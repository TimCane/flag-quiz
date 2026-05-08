import { useState, useEffect } from "react";
import { type Setting } from "@flag-quiz/shared";
import { api } from "../../lib/api";

export function useSettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    api
      .get<{ ok: boolean; settings: Setting[] }>("/settings")
      .then((res) => {
        setSettings(res.settings);
        // Expand all non-Advanced categories by default
        const cats = new Set(
          res.settings
            .map((s) => s.category)
            .filter((c) => c !== "Advanced"),
        );
        setExpandedCategories(cats);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleUpdate(key: string, value: string) {
    setSaving(key);
    try {
      await api.put(`/settings/${key}`, { value });
      setSettings((prev) =>
        prev.map((s) => (s.key === key ? { ...s, value } : s)),
      );
      setSaved(key);
      setTimeout(() => setSaved(null), 1500);
    } catch {
      // Error handled by api layer
    } finally {
      setSaving(null);
    }
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

  // Group by category
  const grouped = new Map<string, Setting[]>();
  for (const s of settings) {
    const list = grouped.get(s.category) || [];
    list.push(s);
    grouped.set(s.category, list);
  }

  // Sort categories: Advanced last
  const categories = [...grouped.keys()].sort((a, b) => {
    if (a === "Advanced") return 1;
    if (b === "Advanced") return -1;
    return a.localeCompare(b);
  });

  return {
    loading,
    saving,
    saved,
    expandedCategories,
    handleUpdate,
    toggleCategory,
    grouped,
    categories,
  };
}
