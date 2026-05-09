import { useState, useEffect, useCallback } from "react";
import { type Tag, type Setting } from "@flag-quiz/shared";
import { api } from "../../lib/api";

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
  const [config, setConfig] = useState<PresentationConfig>(DEFAULT_CONFIG);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<{ ok: boolean; tags: Tag[] }>("/tags"),
      api.get<{ ok: boolean; settings: Setting[] }>("/settings"),
    ])
      .then(([tagsRes, settingsRes]) => {
        setTags(tagsRes.tags);

        const configSetting = settingsRes.settings.find(
          (s) => s.key === "presentation_config",
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
        // Best effort
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

  return {
    config,
    tags,
    loading,
    expanded,
    setExpanded,
    toggleTag,
    reorderTags,
    toggleOption,
    setFragmentDelay,
  };
}
