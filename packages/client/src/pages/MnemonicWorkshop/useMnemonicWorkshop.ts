import { useState, useEffect, useCallback, useMemo } from "react";
import { flags, type FlagProgress, type Tag, type FlagTag } from "@flag-quiz/shared";
import { api } from "../../lib/api";

export function useMnemonicWorkshop() {
  const [progressMap, setProgressMap] = useState<Map<string, FlagProgress>>(new Map());
  const [edits, setEdits] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [filter, setFilter] = useState<string>("all");
  const [continentFilter, setContinentFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [tags, setTags] = useState<Tag[]>([]);
  const [flagTagsMap, setFlagTagsMap] = useState<Map<string, string[]>>(new Map());

  useEffect(() => {
    Promise.all([
      api.get<{ ok: boolean; records: FlagProgress[] }>("/flag-progress"),
      api.get<{ ok: boolean; tags: Tag[] }>("/tags"),
      api.get<{ ok: boolean; flag_tags: FlagTag[] }>("/flag-tags"),
    ])
      .then(([progressRes, tagsRes, flagTagsRes]) => {
        const pMap = new Map<string, FlagProgress>();
        for (const p of progressRes.records) pMap.set(p.flag, p);
        setProgressMap(pMap);

        setTags(tagsRes.tags);

        const ftMap = new Map<string, string[]>();
        for (const ft of flagTagsRes.flag_tags) {
          const list = ftMap.get(ft.flag) || [];
          list.push(ft.tag_id);
          ftMap.set(ft.flag, list);
        }
        setFlagTagsMap(ftMap);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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

  const handleTagsChange = useCallback(
    async (code: string, tagIds: string[]) => {
      setFlagTagsMap((prev) => new Map(prev).set(code, tagIds));
      try {
        await api.put(`/flag-tags/${code}`, {
          tag_ids: tagIds,
          updated_at: new Date().toISOString(),
        });
      } catch {
        // Revert on failure
        api
          .get<{ ok: boolean; flag_tags: FlagTag[] }>("/flag-tags")
          .then((res) => {
            const ftMap = new Map<string, string[]>();
            for (const ft of res.flag_tags) {
              const list = ftMap.get(ft.flag) || [];
              list.push(ft.tag_id);
              ftMap.set(ft.flag, list);
            }
            setFlagTagsMap(ftMap);
          })
          .catch(() => {});
      }
    },
    [],
  );

  async function handleSaveAll() {
    if (edits.size === 0) return;
    setSaving(true);

    const entries = [...edits.entries()].map(([code, mnemonic]) => {
      const existing = progressMap.get(code);
      return api
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
        .then(() => ({ code, mnemonic, success: true as const }))
        .catch(() => ({ code, mnemonic, success: false as const }));
    });

    const results = await Promise.allSettled(entries);
    let count = 0;

    for (const result of results) {
      if (result.status === "fulfilled" && result.value.success) {
        const { code, mnemonic } = result.value;
        setProgressMap((prev) => {
          const next = new Map(prev);
          const old = prev.get(code);
          next.set(code, {
            flag: code,
            mnemonic,
            stability: old?.stability ?? null,
            difficulty: old?.difficulty ?? null,
            state: old?.state ?? 0,
            last_review: old?.last_review ?? null,
            due: old?.due ?? null,
            updated_at: new Date().toISOString(),
          });
          return next;
        });
        count++;
      }
    }

    setEdits(new Map());
    setSavedCount(count);
    setSaving(false);
    setTimeout(() => setSavedCount(0), 2000);
  }

  const filteredFlags = useMemo(
    () =>
      flags.filter((f) => {
        if (search) {
          const q = search.toLowerCase();
          if (!f.name.toLowerCase().includes(q) && !f.code.includes(q)) return false;
        }
        if (continentFilter !== "all" && f.continent !== continentFilter) return false;
        if (tagFilter !== "all") {
          const assignedTags = flagTagsMap.get(f.code) || [];
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
    [search, continentFilter, tagFilter, filter, getDisplayMnemonic, flagTagsMap],
  );

  const filledCount = useMemo(
    () => flags.filter((f) => getDisplayMnemonic(f.code).length > 0).length,
    [getDisplayMnemonic],
  );

  return {
    edits,
    loading,
    saving,
    savedCount,
    filter,
    setFilter,
    continentFilter,
    setContinentFilter,
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
    flagTagsMap,
  };
}
