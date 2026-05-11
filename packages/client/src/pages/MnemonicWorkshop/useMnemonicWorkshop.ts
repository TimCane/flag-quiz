import { useState, useCallback, useMemo, useDeferredValue } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type FlagProgress, type Tag, type FlagTag } from "@flag-quiz/shared";
import { useCollectionApi } from "../../lib/api";
import { useActiveCollection } from "../../lib/collection-context";
import { useToast } from "../../components/ui/toast";

export function useMnemonicWorkshop() {
  const { collection } = useActiveCollection();
  const api = useCollectionApi();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const flags = collection.flags;

  const [edits, setEdits] = useState<Map<string, string>>(new Map());
  const [savedCount, setSavedCount] = useState(0);
  const [filter, setFilter] = useState<string>("all");
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);

  const { data, isLoading } = useQuery({
    queryKey: ["mnemonicWorkshop", collection.id],
    queryFn: () =>
      Promise.all([
        api.get<{ ok: boolean; records: FlagProgress[] }>("/flag-progress"),
        api.get<{ ok: boolean; tags: Tag[] }>("/tags"),
        api.get<{ ok: boolean; flag_tags: FlagTag[] }>("/flag-tags"),
      ]),
  });

  const progressMap = useMemo(() => {
    const pMap = new Map<string, FlagProgress>();
    if (data) for (const p of data[0].records) pMap.set(p.flag, p);
    return pMap;
  }, [data]);

  const tags = data?.[1].tags ?? [];

  const flagTagsMap = useMemo(() => {
    const ftMap = new Map<string, string[]>();
    if (data) {
      for (const ft of data[2].flag_tags) {
        const list = ftMap.get(ft.flag) || [];
        list.push(ft.tag_id);
        ftMap.set(ft.flag, list);
      }
    }
    return ftMap;
  }, [data]);

  // Local edits for flag tags — accumulated until save
  const [tagEdits, setTagEdits] = useState<Map<string, string[]>>(new Map());

  const effectiveFlagTags = useMemo(() => {
    if (tagEdits.size === 0) return flagTagsMap;
    const merged = new Map(flagTagsMap);
    for (const [code, ids] of tagEdits) merged.set(code, ids);
    return merged;
  }, [flagTagsMap, tagEdits]);

  const getDisplayMnemonic = useCallback(
    (code: string) => {
      if (edits.has(code)) return edits.get(code)!;
      return progressMap.get(code)?.mnemonic ?? "";
    },
    [edits, progressMap],
  );

  function handleEdit(code: string, value: string) {
    const original = progressMap.get(code)?.mnemonic ?? "";
    if (value === original) {
      setEdits((prev) => {
        const next = new Map(prev);
        next.delete(code);
        return next;
      });
    } else {
      setEdits((prev) => new Map(prev).set(code, value));
    }
  }

  function handleTagsChange(code: string, tagIds: string[]) {
    const original = flagTagsMap.get(code) || [];
    const same = tagIds.length === original.length && tagIds.every((id) => original.includes(id));
    if (same) {
      setTagEdits((prev) => {
        const next = new Map(prev);
        next.delete(code);
        return next;
      });
    } else {
      setTagEdits((prev) => new Map(prev).set(code, tagIds));
    }
  }

  const saveMutation = useMutation({
    mutationFn: async ({ mnemonics, tagChanges }: {
      mnemonics: { code: string; mnemonic: string }[];
      tagChanges: { code: string; tagIds: string[] }[];
    }) => {
      const promises: Promise<{ success: boolean }>[] = [];

      for (const { code, mnemonic } of mnemonics) {
        const existing = progressMap.get(code);
        promises.push(
          api
            .post("/flag-progress", {
              flag: code,
              mnemonic,
              stability: existing?.stability ?? null,
              difficulty: existing?.difficulty ?? null,
              state: existing?.state ?? 0,
              last_review: existing?.last_review ?? null,
              due: existing?.due ?? null,
              updated_at: new Date().toISOString(),
            })
            .then(() => ({ success: true }))
            .catch(() => ({ success: false })),
        );
      }

      for (const { code, tagIds } of tagChanges) {
        promises.push(
          api
            .put(`/flag-tags/${code}`, {
              tag_ids: tagIds,
              updated_at: new Date().toISOString(),
            })
            .then(() => ({ success: true }))
            .catch(() => ({ success: false })),
        );
      }

      const results = await Promise.allSettled(promises);
      let count = 0;
      for (const r of results) {
        if (r.status === "fulfilled" && r.value.success) count++;
      }
      return count;
    },
    onSuccess: (count, { mnemonics, tagChanges }) => {
      const total = mnemonics.length + tagChanges.length;
      if (count < total) {
        showToast(`${total - count} change${total - count !== 1 ? "s" : ""} failed to save`);
      }
      setEdits(new Map());
      setTagEdits(new Map());
      setSavedCount(count);
      setTimeout(() => setSavedCount(0), 2000);
      queryClient.invalidateQueries({ queryKey: ["mnemonicWorkshop", collection.id] });
    },
    onError: () => {
      showToast("Failed to save — check your connection");
    },
  });

  const pendingCount = edits.size + tagEdits.size;

  async function handleSaveAll() {
    if (pendingCount === 0) return;
    saveMutation.mutate({
      mnemonics: [...edits.entries()].map(([code, mnemonic]) => ({ code, mnemonic })),
      tagChanges: [...tagEdits.entries()].map(([code, tagIds]) => ({ code, tagIds })),
    });
  }

  const filteredFlags = useMemo(
    () =>
      flags.filter((f) => {
        if (deferredSearch) {
          const q = deferredSearch.toLowerCase();
          if (!f.name.toLowerCase().includes(q) && !f.code.includes(q)) return false;
        }
        if (groupFilter !== "all" && f.group !== groupFilter) return false;
        if (tagFilter !== "all") {
          const assignedTags = effectiveFlagTags.get(f.code) || [];
          if (tagFilter === "untagged") {
            if (assignedTags.length > 0) return false;
          } else {
            if (!assignedTags.includes(tagFilter)) return false;
          }
        }
        if (filter === "empty") {
          const m = getDisplayMnemonic(f.code);
          if (m.length > 0) return false;
        } else if (filter === "filled") {
          const m = getDisplayMnemonic(f.code);
          if (m.length === 0) return false;
        }
        return true;
      }),
    [flags, deferredSearch, groupFilter, tagFilter, filter, getDisplayMnemonic, effectiveFlagTags],
  );

  const filledCount = useMemo(
    () => flags.filter((f) => getDisplayMnemonic(f.code).length > 0).length,
    [flags, getDisplayMnemonic],
  );

  return {
    edits,
    pendingCount,
    loading: isLoading,
    saving: saveMutation.isPending,
    savedCount,
    filter,
    setFilter,
    groupFilter,
    setGroupFilter,
    tagFilter,
    setTagFilter,
    search,
    setSearch,
    getDisplayMnemonic,
    handleEdit,
    handleSaveAll,
    handleTagsChange,
    filteredFlags,
    filledCount,
    totalFlags: flags.length,
    tags,
    tagEdits,
    flagTagsMap: effectiveFlagTags,
    groupLabel: collection.groupLabel,
    groups: collection.groups,
  };
}
