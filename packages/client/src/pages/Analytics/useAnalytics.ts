import { useState, useEffect, useMemo } from "react";
import { flags, flagByCode, type FlagProgress } from "@flag-quiz/shared";
import { api } from "../../lib/api";
import { CONTINENT_LABELS, STATE_LABELS } from "../../lib/labels";

interface ProgressDay { day: string; attempts: number; correct_count: number; accuracy: number }
interface FlagAccuracy { flag: string; attempt_count: number; correct_count: number }
interface ConfusedPair { flag: string; guess: string; count: number }
interface ConfidenceDist { confidence: number; count: number }
interface ActivityDay { day: string; count: number }
interface HardestFlag { flag: string; attempt_count: number; accuracy: number }
interface Comparison { attempts: number; accuracy: number; period: string }

export type { ProgressDay, ConfusedPair, ConfidenceDist, ActivityDay, HardestFlag, Comparison };

export function useAnalytics() {
  const [progress, setProgress] = useState<ProgressDay[]>([]);
  const [continentData, setContinentData] = useState<{ continent: string; accuracy: number; count: number }[]>([]);
  const [confusedPairs, setConfusedPairs] = useState<ConfusedPair[]>([]);
  const [confidenceDist, setConfidenceDist] = useState<ConfidenceDist[]>([]);
  const [activity, setActivity] = useState<ActivityDay[]>([]);
  const [progressRecords, setProgressRecords] = useState<FlagProgress[]>([]);
  const [hardest, setHardest] = useState<HardestFlag[]>([]);
  const [comparison, setComparison] = useState<{ before: Comparison | null; after: Comparison | null } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<{ ok: boolean; progress: ProgressDay[] }>("/stats/progress"),
      api.get<{ ok: boolean; flags: FlagAccuracy[] }>("/stats/continents"),
      api.get<{ ok: boolean; pairs: ConfusedPair[] }>("/stats/confused-pairs"),
      api.get<{ ok: boolean; distribution: ConfidenceDist[] }>("/stats/confidence"),
      api.get<{ ok: boolean; activity: ActivityDay[] }>("/stats/activity"),
      api.get<{ ok: boolean; records: FlagProgress[] }>("/flag-progress"),
      api.get<{ ok: boolean; hardest: HardestFlag[] }>("/stats/hardest"),
      api.get<{ ok: boolean; before: Comparison | null; after: Comparison | null }>("/stats/comparison"),
    ])
      .then(([progressRes, contRes, pairsRes, confRes, actRes, fpRes, hardestRes, compRes]) => {
        setProgress(progressRes.progress);

        // Group flag accuracy by continent
        const contMap = new Map<string, { correct: number; total: number }>();
        for (const f of contRes.flags) {
          const flag = flagByCode.get(f.flag);
          if (!flag) continue;
          const c = flag.continent;
          const entry = contMap.get(c) || { correct: 0, total: 0 };
          entry.correct += f.correct_count;
          entry.total += f.attempt_count;
          contMap.set(c, entry);
        }

        setContinentData(
          [...contMap.entries()]
            .map(([continent, { correct, total }]) => ({
              continent: CONTINENT_LABELS[continent] || continent,
              accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
              count: total,
            }))
            .sort((a, b) => b.accuracy - a.accuracy),
        );

        setConfusedPairs(pairsRes.pairs);
        setConfidenceDist(confRes.distribution);
        setActivity(actRes.activity);
        setProgressRecords(fpRes.records);
        setHardest(hardestRes.hardest);
        setComparison(compRes);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // FSRS state breakdown
  const stateBreakdown = useMemo(
    () =>
      [0, 1, 2, 3].map((state) => ({
        name: STATE_LABELS[state],
        value: state === 0
          ? flags.length - progressRecords.filter((p) => p.state > 0).length
          : progressRecords.filter((p) => p.state === state).length,
      })),
    [progressRecords],
  );

  // Mnemonics for gallery
  const mnemonics = useMemo(
    () =>
      progressRecords
        .filter((p) => p.mnemonic && p.mnemonic.length > 0)
        .map((p) => ({ code: p.flag, mnemonic: p.mnemonic, flag: flagByCode.get(p.flag) }))
        .filter((m) => m.flag)
        .sort((a, b) => a.flag!.continent.localeCompare(b.flag!.continent)),
    [progressRecords],
  );

  // Merge confused pairs bidirectionally
  const mergedPairs = useMemo(() => {
    const pairMap = new Map<string, { flagA: string; flagB: string; count: number }>();
    for (const p of confusedPairs) {
      const key = [p.flag, p.guess].sort().join("-");
      const entry = pairMap.get(key) || { flagA: p.flag, flagB: p.guess, count: 0 };
      entry.count += p.count;
      pairMap.set(key, entry);
    }
    return [...pairMap.values()].sort((a, b) => b.count - a.count).slice(0, 20);
  }, [confusedPairs]);

  const hasData = progress.length > 0;

  return {
    progress,
    continentData,
    confidenceDist,
    activity,
    hardest,
    comparison,
    loading,
    stateBreakdown,
    mnemonics,
    mergedPairs,
    hasData,
  };
}
