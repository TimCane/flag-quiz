import { useState, useEffect, useMemo } from "react";
import { flags, type FlagProgress } from "@flag-quiz/shared";
import { api } from "../../lib/api";

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
  const [statsMap, setStatsMap] = useState<Map<string, FlagStats>>(new Map());
  const [progressMap, setProgressMap] = useState<Map<string, FlagProgress>>(new Map());
  const [sparklines, setSparklines] = useState<Record<string, number[]>>({});
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [continentFilter, setContinentFilter] = useState<string>("all");
  const [stateFilter, setStateFilter] = useState<StateFilter>("all");
  const [mnemonicFilter, setMnemonicFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    Promise.all([
      api.get<{ ok: boolean; flags: FlagStats[] }>("/stats/flags"),
      api.get<{ ok: boolean; records: FlagProgress[] }>("/flag-progress"),
      api.get<{ ok: boolean; sparklines: Record<string, number[]> }>("/stats/sparklines"),
    ])
      .then(([statsRes, progressRes, sparklinesRes]) => {
        const sMap = new Map<string, FlagStats>();
        for (const s of statsRes.flags) sMap.set(s.flag, s);
        setStatsMap(sMap);

        const pMap = new Map<string, FlagProgress>();
        for (const p of progressRes.records) pMap.set(p.flag, p);
        setProgressMap(pMap);
        setSparklines(sparklinesRes.sparklines ?? {});
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const sortedFlags = useMemo(() => {
    let filtered = [...flags];

    // Search
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (f) => f.name.toLowerCase().includes(q) || f.code.includes(q),
      );
    }

    // Continent filter
    if (continentFilter !== "all") {
      filtered = filtered.filter((f) => f.continent === continentFilter);
    }

    // State filter
    if (stateFilter !== "all") {
      filtered = filtered.filter((f) => {
        const p = progressMap.get(f.code);
        if (stateFilter === "new") return !p || p.state === 0;
        if (stateFilter === "learning") return p?.state === 1 || p?.state === 3;
        if (stateFilter === "review") return p?.state === 2;
        return true;
      });
    }

    // Mnemonic filter
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

    // Sort
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
  }, [flags, statsMap, progressMap, sortKey, continentFilter, stateFilter, mnemonicFilter, search]);

  return {
    statsMap,
    progressMap,
    sparklines,
    loading,
    sortKey,
    setSortKey,
    continentFilter,
    setContinentFilter,
    stateFilter,
    setStateFilter,
    mnemonicFilter,
    setMnemonicFilter,
    search,
    setSearch,
    sortedFlags,
  };
}
