import type { Collection, Flag, FlagProgress } from "@flag-quiz/shared";
import { groupName } from "./labels";

interface FlagAccuracy {
  flag: string;
  attempt_count: number;
  correct_count: number;
}

interface ConfusedPair {
  flag: string;
  guess: string;
  count: number;
}

export interface GroupAccuracy {
  group: string;
  accuracy: number;
  count: number;
}

export interface MergedPair {
  flagA: string;
  flagB: string;
  count: number;
}

export interface StateBreakdownItem {
  name: string;
  value: number;
}

const STATE_LABELS: Record<number, string> = {
  0: "New",
  1: "Learning",
  2: "Review",
  3: "Relearning",
};

/**
 * Aggregate per-flag accuracy into per-group accuracy.
 */
export function computeGroupData(
  flags: FlagAccuracy[],
  flagByCode: (code: string) => Flag | undefined,
  collection: Collection,
): GroupAccuracy[] {
  const grpMap = new Map<string, { correct: number; total: number }>();
  for (const f of flags) {
    const flag = flagByCode(f.flag);
    if (!flag) continue;
    const g = flag.group;
    const entry = grpMap.get(g) || { correct: 0, total: 0 };
    entry.correct += f.correct_count;
    entry.total += f.attempt_count;
    grpMap.set(g, entry);
  }
  return [...grpMap.entries()]
    .map(([groupId, { correct, total }]) => ({
      group: groupName(collection, groupId),
      accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
      count: total,
    }))
    .sort((a, b) => b.accuracy - a.accuracy);
}

/**
 * Compute FSRS state breakdown counts.
 */
export function computeStateBreakdown(
  progressRecords: FlagProgress[],
  totalFlags: number,
): StateBreakdownItem[] {
  return [0, 1, 2, 3].map((state) => ({
    name: STATE_LABELS[state],
    value:
      state === 0
        ? totalFlags - progressRecords.filter((p) => p.state > 0).length
        : progressRecords.filter((p) => p.state === state).length,
  }));
}

/**
 * Merge bidirectional confused pairs (A→B + B→A) and return top N.
 */
export function mergeConfusedPairs(pairs: ConfusedPair[], limit = 20): MergedPair[] {
  const pairMap = new Map<string, MergedPair>();
  for (const p of pairs) {
    const key = [p.flag, p.guess].sort().join("-");
    const entry = pairMap.get(key) || { flagA: p.flag, flagB: p.guess, count: 0 };
    entry.count += p.count;
    pairMap.set(key, entry);
  }
  return [...pairMap.values()].sort((a, b) => b.count - a.count).slice(0, limit);
}
