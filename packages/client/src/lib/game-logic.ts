import { type ConfusionMap, type Rating, ExitCondition } from "@flag-quiz/shared";

interface Percentiles {
  global: { p25: number; p75: number } | null;
  by_mode: Record<string, { p25: number; p75: number } | null>;
  by_flag: Record<string, { p25: number; p75: number }>;
}

/**
 * Flatten a ConfusionMap into individual {flag, guess} pairs,
 * deduplicating symmetric pairs (A→B and B→A count as one).
 */
export function flattenConfusions(cm: ConfusionMap): { flag: string; guess: string }[] {
  const result: { flag: string; guess: string }[] = [];
  const seen = new Set<string>();
  for (const [flag, peers] of cm.confusions) {
    for (const [guess, count] of peers) {
      const key = [flag, guess].sort().join("-");
      if (seen.has(key)) continue;
      seen.add(key);
      for (let i = 0; i < count; i++) result.push({ flag, guess });
    }
  }
  return result;
}

/**
 * Determine whether the session should end after this attempt.
 */
export function checkExitCondition(
  exitCondition: string,
  correct: boolean,
  reactionTimeMs: number,
  speedTimeoutMs: number,
  currentIndex: number,
  queueLength: number,
): boolean {
  if (exitCondition === ExitCondition.STREAK && !correct) return true;
  if (exitCondition === ExitCondition.SPEED && reactionTimeMs > speedTimeoutMs) return true;
  if (currentIndex + 1 >= queueLength) return true;
  return false;
}

/**
 * Auto-rate an attempt based on reaction time percentiles.
 * Returns FSRS rating: 2 (Hard), 3 (Good), 4 (Easy).
 */
export function autoRate(
  flagCode: string,
  reactionTimeMs: number,
  mode: string,
  percentiles: Percentiles | null,
): Rating {
  if (!percentiles) return 3 as Rating;
  const thresholds =
    percentiles.by_flag[flagCode] ??
    percentiles.by_mode[mode] ??
    percentiles.global;
  if (!thresholds) return 3 as Rating;
  if (reactionTimeMs <= thresholds.p25) return 4 as Rating;
  if (reactionTimeMs <= thresholds.p75) return 3 as Rating;
  return 2 as Rating;
}

export type { Percentiles };
