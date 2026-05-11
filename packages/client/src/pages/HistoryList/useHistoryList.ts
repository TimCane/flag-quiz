import { useState, useMemo, useDeferredValue } from "react";
import { useQuery } from "@tanstack/react-query";
import { type FlagProgress } from "@flag-quiz/shared";
import { useCollectionApi } from "../../lib/api";
import { useActiveCollection } from "../../lib/collection-context";

interface FlagStats {
  flag: string;
  attempt_count: number;
  accuracy: number;
  last_seen: string | null;
}

export type SortKey = "name" | "accuracy" | "last_seen" | "due";
export type StateFilter = "all" | "new" | "learning" | "review";

export type { FlagStats };

export function useHistoryList() {
  const { collection } = useActiveCollection();
  const api = useCollectionApi();
  const flags = collection.flags;

  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [stateFilter, setStateFilter] = useState<StateFilter>("all");
  const [mnemonicFilter, setMnemonicFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);

  const { data, isLoading, error } = useQuery({
    queryKey: ["historyList", collection.id],
    queryFn: () =>
      Promise.all([
        api.get<{ ok: boolean; flags: FlagStats[] }>("/stats/flags"),
        api.get<{ ok: boolean; records: FlagProgress[] }>("/flag-progress"),
        api.get<{ ok: boolean; sparklines: Record<string, number[]> }>("/stats/sparklines"),
      ]),
  });

  const statsMap = useMemo(() => {
    const sMap = new Map<string, FlagStats>();
    if (data) for (const s of data[0].flags) sMap.set(s.flag, s);
    return sMap;
  }, [data]);

  const progressMap = useMemo(() => {
    const pMap = new Map<string, FlagProgress>();
    if (data) for (const p of data[1].records) pMap.set(p.flag, p);
    return pMap;
  }, [data]);

  const sparklines = data?.[2].sparklines ?? {};

  const sortedFlags = useMemo(() => {
    let filtered = [...flags];

    if (deferredSearch) {
      const q = deferredSearch.toLowerCase();
      filtered = filtered.filter(
        (f) => f.name.toLowerCase().includes(q) || f.code.includes(q),
      );
    }

    if (groupFilter !== "all") {
      filtered = filtered.filter((f) => f.group === groupFilter);
    }

    if (stateFilter !== "all") {
      filtered = filtered.filter((f) => {
        const p = progressMap.get(f.code);
        if (stateFilter === "new") return !p || p.state === 0;
        if (stateFilter === "learning") return p?.state === 1 || p?.state === 3;
        if (stateFilter === "review") return p?.state === 2;
        return true;
      });
    }

    if (mnemonicFilter === "has") {
      filtered = filtered.filter((f) => {
        const p = progressMap.get(f.code);
        return p?.mnemonic && p.mnemonic.length > 0;
      });
    } else if (mnemonicFilter === "none") {
      filtered = filtered.filter((f) => {
        const p = progressMap.get(f.code);
        return !p?.mnemonic || p.mnemonic.length === 0;
      });
    }

    filtered.sort((a, b) => {
      const sa = statsMap.get(a.code);
      const sb = statsMap.get(b.code);
      const pa = progressMap.get(a.code);
      const pb = progressMap.get(b.code);

      switch (sortKey) {
        case "name":
          return a.name.localeCompare(b.name);
        case "accuracy":
          return (sb?.accuracy ?? -1) - (sa?.accuracy ?? -1);
        case "last_seen": {
          const la = sa?.last_seen ?? "";
          const lb = sb?.last_seen ?? "";
          return lb.localeCompare(la);
        }
        case "due": {
          const da = pa?.due ?? "9999";
          const db = pb?.due ?? "9999";
          return da.localeCompare(db);
        }
        default:
          return 0;
      }
    });

    return filtered;
  }, [flags, statsMap, progressMap, sortKey, groupFilter, stateFilter, mnemonicFilter, deferredSearch]);

  return {
    statsMap,
    progressMap,
    sparklines,
    loading: isLoading,
    error: error?.message ?? null,
    sortKey,
    setSortKey,
    groupFilter,
    setGroupFilter,
    stateFilter,
    setStateFilter,
    mnemonicFilter,
    setMnemonicFilter,
    search,
    setSearch,
    sortedFlags,
    groupLabel: collection.groupLabel,
    groups: collection.groups,
  };
}
