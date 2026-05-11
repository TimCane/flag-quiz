import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type Setting } from "@flag-quiz/shared";
import { api } from "../../lib/api";
import { useToast } from "../../components/ui/toast";

export function useSettingsPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [settings, setSettings] = useState<Setting[]>([]);
  const [saved, setSaved] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const { data, isLoading, error } = useQuery({
    queryKey: ["settings"],
    queryFn: () => api.get<{ ok: boolean; settings: Setting[] }>("/settings"),
  });

  useEffect(() => {
    if (data) {
      setSettings(data.settings);
      const cats = new Set(
        data.settings
          .map((s) => s.category)
          .filter((c) => c !== "Advanced"),
      );
      setExpandedCategories(cats);
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      await api.put(`/settings/${key}`, { value });
      return { key, value };
    },
    onMutate: ({ key, value }) => {
      setSettings((prev) =>
        prev.map((s) => (s.key === key ? { ...s, value } : s)),
      );
    },
    onSuccess: ({ key }) => {
      setSaved(key);
      setTimeout(() => setSaved(null), 1500);
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: () => {
      showToast("Failed to save setting");
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });

  function handleUpdate(key: string, value: string) {
    updateMutation.mutate({ key, value });
  }

  function toggleCategory(category: string) {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }

  const grouped = new Map<string, Setting[]>();
  for (const s of settings) {
    const list = grouped.get(s.category) || [];
    list.push(s);
    grouped.set(s.category, list);
  }

  const categories = [...grouped.keys()].sort((a, b) => {
    if (a === "Advanced") return 1;
    if (b === "Advanced") return -1;
    return a.localeCompare(b);
  });

  return {
    loading: isLoading,
    error: error?.message ?? null,
    saving: updateMutation.isPending ? updateMutation.variables?.key ?? null : null,
    saved,
    expandedCategories,
    handleUpdate,
    toggleCategory,
    grouped,
    categories,
  };
}
