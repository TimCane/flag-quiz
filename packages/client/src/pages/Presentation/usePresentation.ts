import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  type Tag,
  type FlagTag,
  type FlagProgress,
  type Setting,
  flags as allFlags,
  flagByCode,
} from "@flag-quiz/shared";
import { api } from "../../lib/api";
import { CONTINENT_LABELS, STATE_LABELS } from "../../lib/labels";
import type { PresentationConfig } from "../SettingsPage/usePresentationSection";

interface FlagStats {
  flag: string;
  attempt_count: number;
  accuracy: number;
}

interface SlideGroup {
  tag: Tag;
  flags: {
    code: string;
    name: string;
    mnemonic: string;
    accuracy: number | null;
    attemptCount: number;
    avgReactionTimeMs: number | null;
    confusions: { code: string; name: string }[];
    fsrsState: number;
    fsrsStability: number | null;
    fsrsDifficulty: number | null;
    fsrsDue: string | null;
    fsrsLastReview: string | null;
  }[];
}

// Analytics types (matching useAnalytics)
interface ProgressDay { day: string; attempts: number; correct_count: number; accuracy: number }
interface ConfusedPair { flag: string; guess: string; count: number }
interface ConfidenceDist { confidence: number; count: number }
interface ActivityDay { day: string; count: number }
interface HardestFlag { flag: string; attempt_count: number; accuracy: number }
interface Comparison { attempts: number; accuracy: number; period: string }
interface FlagAccuracy { flag: string; attempt_count: number; correct_count: number }

interface Percentiles {
  global: { p25: number; p75: number } | null;
  by_mode: Record<string, { p25: number; p75: number } | null>;
  by_flag: Record<string, { p25: number; p75: number }>;
}

interface AnalyticsData {
  progress: ProgressDay[];
  continentData: { continent: string; accuracy: number; count: number }[];
  confidenceDist: ConfidenceDist[];
  activity: ActivityDay[];
  hardest: HardestFlag[];
  comparison: { before: Comparison | null; after: Comparison | null } | null;
  stateBreakdown: { name: string; value: number }[];
  mergedPairs: { flagA: string; flagB: string; count: number }[];
  sparklines: Record<string, number[]>;
  percentiles: Percentiles | null;
  overallStats: { total_attempts: number; total_sessions: number; accuracy: number; flags_attempted: number } | null;
}

export function usePresentation() {
  const [slideGroups, setSlideGroups] = useState<SlideGroup[]>([]);
  const [config, setConfig] = useState<PresentationConfig | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [progressRecords, setProgressRecords] = useState<FlagProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const deckRef = useRef<HTMLDivElement>(null);
  const revealRef = useRef<any>(null);

  useEffect(() => {
    async function load() {
      try {
        const [
          tagsRes, flagTagsRes, progressRes, settingsRes, statsRes, wrongGuessesRes,
          progressChartRes, continentsRes, pairsRes, confRes, actRes, hardestRes, compRes, sparklinesRes, percentilesRes, overallStatsRes, reactionTimesRes,
        ] = await Promise.all([
          api.get<{ ok: boolean; tags: Tag[] }>("/tags"),
          api.get<{ ok: boolean; flag_tags: FlagTag[] }>("/flag-tags"),
          api.get<{ ok: boolean; records: FlagProgress[] }>("/flag-progress"),
          api.get<{ ok: boolean; settings: Setting[] }>("/settings"),
          api.get<{ ok: boolean; flags: FlagStats[] }>("/stats/flags"),
          api.get<{ ok: boolean; wrong_guesses: { flag: string; guess: string }[] }>("/attempts/wrong-guesses"),
          // Analytics endpoints
          api.get<{ ok: boolean; progress: ProgressDay[] }>("/stats/progress"),
          api.get<{ ok: boolean; flags: FlagAccuracy[] }>("/stats/continents"),
          api.get<{ ok: boolean; pairs: ConfusedPair[] }>("/stats/confused-pairs"),
          api.get<{ ok: boolean; distribution: ConfidenceDist[] }>("/stats/confidence"),
          api.get<{ ok: boolean; activity: ActivityDay[] }>("/stats/activity"),
          api.get<{ ok: boolean; hardest: HardestFlag[] }>("/stats/hardest"),
          api.get<{ ok: boolean; before: Comparison | null; after: Comparison | null }>("/stats/comparison"),
          api.get<{ ok: boolean; sparklines: Record<string, number[]> }>("/stats/sparklines"),
          api.get<{ ok: boolean } & Percentiles>("/stats/percentiles"),
          api.get<{ ok: boolean; total_attempts: number; total_sessions: number; accuracy: number; flags_attempted: number }>("/stats"),
          api.get<{ ok: boolean; reaction_times: { flag: string; avg_ms: number }[] }>("/stats/reaction-times"),
        ]);

        // Parse config
        const configSetting = settingsRes.settings.find(
          (s) => s.key === "presentation_config",
        );
        const cfg: PresentationConfig = configSetting
          ? JSON.parse(configSetting.value)
          : { tag_order: [], show_title_slide: true, show_end_slide: true, show_analytics: true, show_mnemonics: true, fragment_delay_ms: 500 };
        setConfig(cfg);
        setProgressRecords(progressRes.records);

        // Build lookup maps
        const tagsById = new Map(tagsRes.tags.map((t) => [t.id, t]));
        const progressByFlag = new Map(progressRes.records.map((p) => [p.flag, p]));
        const statsByFlag = new Map(statsRes.flags.map((s) => [s.flag, s]));

        // Build confusion map: flag -> top 3 confused country names
        const confusionCounts = new Map<string, Map<string, number>>();
        for (const { flag, guess } of wrongGuessesRes.wrong_guesses) {
          if (!confusionCounts.has(flag)) confusionCounts.set(flag, new Map());
          const m = confusionCounts.get(flag)!;
          m.set(guess, (m.get(guess) || 0) + 1);
        }
        const topConfusions = new Map<string, { code: string; name: string }[]>();
        for (const [flag, guesses] of confusionCounts) {
          const sorted = [...guesses.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([g]) => ({ code: g, name: flagByCode.get(g)?.name || g }));
          topConfusions.set(flag, sorted);
        }

        // Build reaction times map
        const reactionTimeByFlag = new Map(reactionTimesRes.reaction_times.map((r) => [r.flag, r.avg_ms]));

        // Build flag_tags map
        const flagTagMap = new Map<string, string[]>();
        for (const ft of flagTagsRes.flag_tags) {
          const list = flagTagMap.get(ft.tag_id) || [];
          list.push(ft.flag);
          flagTagMap.set(ft.tag_id, list);
        }

        // Build slide groups from tag_order
        const groups: SlideGroup[] = [];
        for (const tagId of cfg.tag_order) {
          const tag = tagsById.get(tagId);
          if (!tag) continue;
          const flagCodes = flagTagMap.get(tagId) || [];
          const flagSlides = flagCodes
            .map((code) => {
              const info = flagByCode.get(code);
              const progress = progressByFlag.get(code);
              const stats = statsByFlag.get(code);
              return {
                code,
                name: info?.name || code,
                mnemonic: progress?.mnemonic || "",
                accuracy: stats ? stats.accuracy : null,
                attemptCount: stats?.attempt_count || 0,
                avgReactionTimeMs: reactionTimeByFlag.get(code) ?? null,
                confusions: topConfusions.get(code) || [],
                fsrsState: progress?.state ?? 0,
                fsrsStability: progress?.stability ?? null,
                fsrsDifficulty: progress?.difficulty ?? null,
                fsrsDue: progress?.due ?? null,
                fsrsLastReview: progress?.last_review ?? null,
              };
            })
            .sort((a, b) => a.name.localeCompare(b.name));

          if (flagSlides.length > 0) {
            groups.push({ tag, flags: flagSlides });
          }
        }

        setSlideGroups(groups);

        // Build analytics data
        // Continent grouping
        const contMap = new Map<string, { correct: number; total: number }>();
        for (const f of continentsRes.flags) {
          const flag = flagByCode.get(f.flag);
          if (!flag) continue;
          const c = flag.continent;
          const entry = contMap.get(c) || { correct: 0, total: 0 };
          entry.correct += f.correct_count;
          entry.total += f.attempt_count;
          contMap.set(c, entry);
        }
        const continentData = [...contMap.entries()]
          .map(([continent, { correct, total }]) => ({
            continent: CONTINENT_LABELS[continent] || continent,
            accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
            count: total,
          }))
          .sort((a, b) => b.accuracy - a.accuracy);

        // Merge confused pairs
        const pairMap = new Map<string, { flagA: string; flagB: string; count: number }>();
        for (const p of pairsRes.pairs) {
          const key = [p.flag, p.guess].sort().join("-");
          const entry = pairMap.get(key) || { flagA: p.flag, flagB: p.guess, count: 0 };
          entry.count += p.count;
          pairMap.set(key, entry);
        }
        const mergedPairs = [...pairMap.values()].sort((a, b) => b.count - a.count).slice(0, 20);

        setAnalyticsData({
          progress: progressChartRes.progress,
          continentData,
          confidenceDist: confRes.distribution,
          activity: actRes.activity,
          hardest: hardestRes.hardest,
          comparison: compRes,
          stateBreakdown: [], // computed via useMemo below
          mergedPairs,
          sparklines: sparklinesRes.sparklines,
          percentiles: { global: percentilesRes.global, by_mode: percentilesRes.by_mode, by_flag: percentilesRes.by_flag },
          overallStats: { total_attempts: overallStatsRes.total_attempts, total_sessions: overallStatsRes.total_sessions, accuracy: overallStatsRes.accuracy, flags_attempted: overallStatsRes.flags_attempted },
        });

        setLoading(false);
      } catch (err: any) {
        setError(err.message || "Failed to load presentation data");
        setLoading(false);
      }
    }
    load();
  }, []);

  // FSRS state breakdown (needs to be computed from progressRecords)
  const stateBreakdown = useMemo(
    () =>
      [0, 1, 2, 3].map((state) => ({
        name: STATE_LABELS[state],
        value: state === 0
          ? allFlags.length - progressRecords.filter((p) => p.state > 0).length
          : progressRecords.filter((p) => p.state === state).length,
      })),
    [progressRecords],
  );

  // Merge stateBreakdown into analyticsData
  const fullAnalyticsData = useMemo(() => {
    if (!analyticsData) return null;
    return { ...analyticsData, stateBreakdown };
  }, [analyticsData, stateBreakdown]);

  const autoAdvanceTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const initReveal = useCallback(async (fragmentDelayMs: number) => {
    if (!deckRef.current || revealRef.current) return;
    const Reveal = (await import("reveal.js")).default;
    const deck = new Reveal(deckRef.current, {
      hash: false,
      history: false,
      controls: true,
      progress: true,
      center: true,
      transition: "slide",
      backgroundTransition: "fade",
      embedded: false,
      keyboard: true,
      overview: true,
      width: 1920,
      height: 1080,
    });
    await deck.initialize();
    revealRef.current = deck;

    // Auto-advance fragments after the first (country name) is revealed
    if (fragmentDelayMs > 0) {
      deck.on("fragmentshown", (event: any) => {
        const fragment = event.fragment as HTMLElement;
        // Only auto-advance after fragment index 0 (the country name)
        const index = parseInt(fragment.getAttribute("data-fragment-index") || "0", 10);
        if (index === 0) {
          // Find remaining fragments in this slide
          const slide = fragment.closest("section");
          if (!slide) return;
          const allFragments = Array.from(slide.querySelectorAll(".fragment:not(.visible)"));
          // Schedule each remaining fragment
          allFragments.forEach((_, i) => {
            const timer = setTimeout(() => {
              if (revealRef.current) revealRef.current.nextFragment();
            }, fragmentDelayMs * (i + 1));
            autoAdvanceTimers.current.push(timer);
          });
        }
      });

      // Clear timers on slide change to prevent stale auto-advances
      deck.on("slidechanged", () => {
        for (const t of autoAdvanceTimers.current) clearTimeout(t);
        autoAdvanceTimers.current = [];
      });
    }
  }, []);

  const destroyReveal = useCallback(() => {
    for (const t of autoAdvanceTimers.current) clearTimeout(t);
    autoAdvanceTimers.current = [];
    if (revealRef.current) {
      revealRef.current.destroy();
      revealRef.current = null;
    }
  }, []);

  return {
    slideGroups,
    config,
    analyticsData: fullAnalyticsData,
    loading,
    error,
    deckRef,
    initReveal,
    destroyReveal,
  };
}
