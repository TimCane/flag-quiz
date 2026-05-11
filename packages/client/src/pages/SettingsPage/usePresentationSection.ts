import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { type Tag, type Setting, SETTING_KEYS } from "@flag-quiz/shared";
import { api, useCollectionApi } from "../../lib/api";
import { useActiveCollection } from "../../lib/collection-context";
import { useToast } from "../../components/ui/toast";

export interface PresentationConfig {
  tag_order: string[];
  show_title_slide: boolean;
  show_end_slide: boolean;
  show_analytics: boolean;
  show_mnemonics: boolean;
  fragment_delay_ms: number;
}

const DEFAULT_CONFIG: PresentationConfig = {
  tag_order: [],
  show_title_slide: true,
  show_end_slide: true,
  show_analytics: true,
  show_mnemonics: true,
  fragment_delay_ms: 500,
};

export function usePresentationSection() {
  const { collection } = useActiveCollection();
  const collectionApi = useCollectionApi();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [config, setConfig] = useState<PresentationConfig>(DEFAULT_CONFIG);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      collectionApi.get<{ ok: boolean; tags: Tag[] }>("/tags"),
      api.get<{ ok: boolean; settings: Setting[] }>("/settings"),
    ])
      .then(([tagsRes, settingsRes]) => {
        setTags(tagsRes.tags);

        const configSetting = settingsRes.settings.find(
          (s) => s.key === SETTING_KEYS.PRESENTATION_CONFIG,
        );
        if (configSetting) {
          try {
            setConfig({ ...DEFAULT_CONFIG, ...JSON.parse(configSetting.value) });
          } catch {
            // Use default
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const saveConfig = useCallback(
    async (newConfig: PresentationConfig) => {
      setConfig(newConfig);
      try {
        await api.put("/settings/presentation_config", {
          value: JSON.stringify(newConfig),
        });
      } catch {
        showToast("Failed to save presentation config");
      }
    },
    [],
  );

  const toggleTag = useCallback(
    (tagId: string) => {
      const newOrder = config.tag_order.includes(tagId)
        ? config.tag_order.filter((id) => id !== tagId)
        : [...config.tag_order, tagId];
      saveConfig({ ...config, tag_order: newOrder });
    },
    [config, saveConfig],
  );

  const reorderTags = useCallback(
    (fromIndex: number, toIndex: number) => {
      const newOrder = [...config.tag_order];
      const [moved] = newOrder.splice(fromIndex, 1);
      newOrder.splice(toIndex, 0, moved);
      saveConfig({ ...config, tag_order: newOrder });
    },
    [config, saveConfig],
  );

  const toggleOption = useCallback(
    (key: keyof Omit<PresentationConfig, "tag_order" | "fragment_delay_ms">) => {
      saveConfig({ ...config, [key]: !config[key] });
    },
    [config, saveConfig],
  );

  const setFragmentDelay = useCallback(
    (ms: number) => {
      saveConfig({ ...config, fragment_delay_ms: ms });
    },
    [config, saveConfig],
  );

  const selectedTags = config.tag_order
    .map((id) => tags.find((t) => t.id === id))
    .filter((t): t is NonNullable<typeof t> => !!t);

  const unselectedTags = tags.filter((t) => !config.tag_order.includes(t.id));

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    setDragOverIndex(index);
  }

  function handleDrop(index: number) {
    if (dragIndex !== null && dragIndex !== index) {
      reorderTags(dragIndex, index);
    }
    setDragIndex(null);
    setDragOverIndex(null);
  }

  function handleDragEnd() {
    setDragIndex(null);
    setDragOverIndex(null);
  }

  function handleLaunch() {
    navigate(`/${collection.id}/presentation`);
  }

  return {
    config,
    tags,
    loading,
    expanded,
    setExpanded,
    toggleTag,
    toggleOption,
    setFragmentDelay,
    selectedTags,
    unselectedTags,
    dragIndex,
    dragOverIndex,
    setDragIndex,
    handleDragOver,
    handleDrop,
    handleDragEnd,
    handleLaunch,
  };
}
