import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type Tag } from "@flag-quiz/shared";
import { useCollectionApi } from "../../lib/api";
import { useActiveCollection } from "../../lib/collection-context";
import { useToast } from "../../components/ui/toast";

export function useTagsSection() {
  const { collection } = useActiveCollection();
  const api = useCollectionApi();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [expanded, setExpanded] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["tags", collection.id],
    queryFn: () => api.get<{ ok: boolean; tags: Tag[] }>("/tags"),
  });

  const tags = data?.tags ?? [];

  // Local optimistic state for tags (overrides query data during mutations)
  const [localTags, setLocalTags] = useState<Tag[] | null>(null);
  const effectiveTags = localTags ?? tags;

  // Reset local state when server data changes
  const resetLocal = () => setLocalTags(null);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["tags", collection.id] });
    resetLocal();
  };

  const addMutation = useMutation({
    mutationFn: async (newTag: Tag) => {
      await api.post("/tags", newTag);
      return newTag.id;
    },
    onMutate: (newTag) => {
      setLocalTags([...effectiveTags, newTag]);
    },
    onError: (_err, newTag) => {
      setLocalTags((prev) => prev?.filter((t) => t.id !== newTag.id) ?? null);
      showToast("Failed to add tag");
    },
    onSettled: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Pick<Tag, "name" | "description" | "type">> }) => {
      const tag = effectiveTags.find((t) => t.id === id);
      if (!tag) return;
      const updated = { ...tag, ...updates, updated_at: new Date().toISOString() };
      await api.put(`/tags/${id}`, {
        name: updated.name,
        sort_order: updated.sort_order,
        description: updated.description,
        type: updated.type,
        updated_at: updated.updated_at,
      });
    },
    onMutate: ({ id, updates }) => {
      setLocalTags(effectiveTags.map((t) =>
        t.id === id ? { ...t, ...updates, updated_at: new Date().toISOString() } : t,
      ));
    },
    onError: () => {
      invalidate();
      showToast("Failed to update tag");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/tags/${id}`);
    },
    onMutate: (id) => {
      setLocalTags(effectiveTags.filter((t) => t.id !== id));
    },
    onError: () => {
      invalidate();
      showToast("Failed to delete tag");
    },
    onSettled: invalidate,
  });

  const reorderMutation = useMutation({
    mutationFn: async (reordered: Tag[]) => {
      const now = new Date().toISOString();
      await api.put("/tags/reorder", {
        order: reordered.map((t, i) => ({ id: t.id, sort_order: i })),
        updated_at: now,
      });
    },
    onError: () => {
      invalidate();
      showToast("Failed to reorder tags");
    },
  });

  const updateTag = useCallback(
    (id: string, updates: Partial<Pick<Tag, "name" | "description" | "type">>) => {
      updateMutation.mutate({ id, updates });
    },
    [updateMutation],
  );

  const deleteTag = useCallback(
    (id: string) => {
      deleteMutation.mutate(id);
    },
    [deleteMutation],
  );

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [newTagId, setNewTagId] = useState<string | null>(null);

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    setDragOverIndex(index);
  }

  function handleDrop(index: number) {
    if (dragIndex !== null && dragIndex !== index) {
      const reordered = [...effectiveTags];
      const [moved] = reordered.splice(dragIndex, 1);
      reordered.splice(index, 0, moved);
      const now = new Date().toISOString();
      const withOrder = reordered.map((t, i) => ({ ...t, sort_order: i, updated_at: now }));
      setLocalTags(withOrder);
      reorderMutation.mutate(withOrder);
    }
    setDragIndex(null);
    setDragOverIndex(null);
  }

  function handleDragEnd() {
    setDragIndex(null);
    setDragOverIndex(null);
  }

  async function handleAdd() {
    const id = crypto.randomUUID();
    const newTag: Tag = {
      id,
      name: "New tag",
      sort_order: effectiveTags.length,
      description: "",
      type: "group",
      updated_at: new Date().toISOString(),
    };
    addMutation.mutate(newTag);
    setNewTagId(id);
  }

  return {
    tags: effectiveTags,
    loading: isLoading,
    expanded,
    setExpanded,
    updateTag,
    deleteTag,
    dragIndex,
    dragOverIndex,
    newTagId,
    setDragIndex,
    handleDragOver,
    handleDrop,
    handleDragEnd,
    handleAdd,
  };
}
