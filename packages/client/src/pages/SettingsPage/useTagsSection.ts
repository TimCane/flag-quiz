import { useState, useEffect, useCallback } from "react";
import { type Tag } from "@flag-quiz/shared";
import { api } from "../../lib/api";

export function useTagsSection() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    api
      .get<{ ok: boolean; tags: Tag[] }>("/tags")
      .then((res) => setTags(res.tags))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const addTag = useCallback(async (): Promise<string | null> => {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const newTag: Tag = {
      id,
      name: "",
      sort_order: tags.length,
      description: "",
      updated_at: now,
    };

    setTags((prev) => [...prev, newTag]);

    try {
      await api.post("/tags", newTag);
      return id;
    } catch {
      setTags((prev) => prev.filter((t) => t.id !== id));
      return null;
    }
  }, [tags.length]);

  const updateTag = useCallback(
    async (id: string, updates: Partial<Pick<Tag, "name" | "description">>) => {
      const tag = tags.find((t) => t.id === id);
      if (!tag) return;

      const updated = {
        ...tag,
        ...updates,
        updated_at: new Date().toISOString(),
      };

      setTags((prev) => prev.map((t) => (t.id === id ? updated : t)));

      try {
        await api.put(`/tags/${id}`, {
          name: updated.name,
          sort_order: updated.sort_order,
          description: updated.description,
          updated_at: updated.updated_at,
        });
      } catch {
        setTags((prev) => prev.map((t) => (t.id === id ? tag : t)));
      }
    },
    [tags],
  );

  const deleteTag = useCallback(async (id: string) => {
    setTags((prev) => prev.filter((t) => t.id !== id));
    try {
      await api.delete(`/tags/${id}`);
    } catch {
      // Refetch on failure
      api
        .get<{ ok: boolean; tags: Tag[] }>("/tags")
        .then((res) => setTags(res.tags))
        .catch(() => {});
    }
  }, []);

  const reorder = useCallback(
    async (fromIndex: number, toIndex: number) => {
      const reordered = [...tags];
      const [moved] = reordered.splice(fromIndex, 1);
      reordered.splice(toIndex, 0, moved);

      const now = new Date().toISOString();
      const withOrder = reordered.map((t, i) => ({
        ...t,
        sort_order: i,
        updated_at: now,
      }));

      setTags(withOrder);

      try {
        await api.put("/tags/reorder", {
          order: withOrder.map((t) => ({ id: t.id, sort_order: t.sort_order })),
          updated_at: now,
        });
      } catch {
        api
          .get<{ ok: boolean; tags: Tag[] }>("/tags")
          .then((res) => setTags(res.tags))
          .catch(() => {});
      }
    },
    [tags],
  );

  return {
    tags,
    loading,
    expanded,
    setExpanded,
    addTag,
    updateTag,
    deleteTag,
    reorder,
  };
}
