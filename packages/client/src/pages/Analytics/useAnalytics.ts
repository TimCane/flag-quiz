import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { type FlagProgress } from "@flag-quiz/shared";
import { useCollectionApi } from "../../lib/api";
import { useActiveCollection } from "../../lib/collection-context";
import { computeGroupData, computeStateBreakdown, mergeConfusedPairs } from "../../lib/analytics-utils";

interface ProgressDay { day: string; attempts: number; correct_count: number; accuracy: number }
interface FlagAccuracy { flag: string; attempt_count: number; correct_count: number }
interface ConfusedPair { flag: string; guess: string; count: number }
interface ConfidenceDist { confidence: number; count: number }
interface ActivityDay { day: string; count: number }
interface HardestFlag { flag: string; attempt_count: number; accuracy: number }
interface Comparison { attempts: number; accuracy: number; period: string }

export type { ProgressDay, ConfusedPair, ConfidenceDist, ActivityDay, HardestFlag, Comparison };

export function useAnalytics() {
  const { collection, flagByCode } = useActiveCollection();
  const api = useCollectionApi();

  const { data, isLoading, error } = useQuery({
    queryKey: ["analytics", collection.id],
    queryFn: () =>
      Promise.all([
        api.get<{ ok: boolean; progress: ProgressDay[] }>("/stats/progress"),
        api.get<{ ok: boolean; flags: FlagAccuracy[] }>("/stats/groups"),
        api.get<{ ok: boolean; pairs: ConfusedPair[] }>("/stats/confused-pairs"),
        api.get<{ ok: boolean; distribution: ConfidenceDist[] }>("/stats/confidence"),
        api.get<{ ok: boolean; activity: ActivityDay[] }>("/stats/activity"),
        api.get<{ ok: boolean; records: FlagProgress[] }>("/flag-progress"),
        api.get<{ ok: boolean; hardest: HardestFlag[] }>("/stats/hardest"),
        api.get<{ ok: boolean; before: Comparison | null; after: Comparison | null }>("/stats/comparison"),
      ]),
  });

  const progress = data?.[0].progress ?? [];

  const groupData = useMemo(() => {
    if (!data) return [];
    return computeGroupData(data[1].flags, flagByCode, collection);
  }, [data, flagByCode, collection]);

  const confusedPairs = data?.[2].pairs ?? [];
  const confidenceDist = data?.[3].distribution ?? [];
  const activity = data?.[4].activity ?? [];
  const progressRecords = data?.[5].records ?? [];
  const hardest = data?.[6].hardest ?? [];
  const comparison = data ? { before: data[7].before, after: data[7].after } : null;

  const stateBreakdown = useMemo(
    () => computeStateBreakdown(progressRecords, collection.flags.length),
    [progressRecords, collection.flags.length],
  );

  const mnemonics = useMemo(
    () =>
      progressRecords
        .filter((p) => p.mnemonic && p.mnemonic.length > 0)
        .map((p) => ({ code: p.flag, mnemonic: p.mnemonic, flag: flagByCode(p.flag) }))
        .filter((m) => m.flag)
        .sort((a, b) => a.flag!.group.localeCompare(b.flag!.group)),
    [progressRecords, flagByCode],
  );

  const mergedPairs = useMemo(() => mergeConfusedPairs(confusedPairs), [confusedPairs]);

  const hasData = progress.length > 0;

  return {
    error: error?.message ?? null,
    progress,
    groupData,
    groupLabel: collection.groupLabel,
    confidenceDist,
    activity,
    hardest,
    comparison,
    loading: isLoading,
    stateBreakdown,
    mnemonics,
    mergedPairs,
    hasData,
  };
}
