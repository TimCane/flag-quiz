import { useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import {
  type Tag,
  type FlagTag,
  type FlagProgress,
  type Setting,
  SETTING_KEYS,
} from "@flag-quiz/shared";
import { api, useCollectionApi } from "../../lib/api";
import { STATE_LABELS, groupName } from "../../lib/labels";
import { useActiveCollection } from "../../lib/collection-context";
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

export function usePresentation() {
  const { collection, imageUrl, flagByCode } = useActiveCollection();
  const collectionApi = useCollectionApi();
  const deckRef = useRef<HTMLDivElement>(null);
  const revealRef = useRef<any>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["presentation", collection.id],
    queryFn: () =>
      Promise.all([
        collectionApi.get<{ ok: boolean; tags: Tag[] }>("/tags"),
        collectionApi.get<{ ok: boolean; flag_tags: FlagTag[] }>("/flag-tags"),
        collectionApi.get<{ ok: boolean; records: FlagProgress[] }>("/flag-progress"),
        api.get<{ ok: boolean; settings: Setting[] }>("/settings"),
        collectionApi.get<{ ok: boolean; flags: FlagStats[] }>("/stats/flags"),
        collectionApi.get<{ ok: boolean; wrong_guesses: { flag: string; guess: string }[] }>("/attempts/wrong-guesses"),
        collectionApi.get<{ ok: boolean; progress: ProgressDay[] }>("/stats/progress"),
        collectionApi.get<{ ok: boolean; flags: FlagAccuracy[] }>("/stats/groups"),
        collectionApi.get<{ ok: boolean; pairs: ConfusedPair[] }>("/stats/confused-pairs"),
        collectionApi.get<{ ok: boolean; distribution: ConfidenceDist[] }>("/stats/confidence"),
        collectionApi.get<{ ok: boolean; activity: ActivityDay[] }>("/stats/activity"),
        collectionApi.get<{ ok: boolean; hardest: HardestFlag[] }>("/stats/hardest"),
        collectionApi.get<{ ok: boolean; before: Comparison | null; after: Comparison | null }>("/stats/comparison"),
        collectionApi.get<{ ok: boolean; sparklines: Record<string, number[]> }>("/stats/sparklines"),
        collectionApi.get<{ ok: boolean } & Percentiles>("/stats/percentiles"),
        collectionApi.get<{ ok: boolean; total_attempts: number; total_sessions: number; accuracy: number; flags_attempted: number }>("/stats"),
        collectionApi.get<{ ok: boolean; reaction_times: { flag: string; avg_ms: number }[] }>("/stats/reaction-times"),
      ]),
  });

  const config = useMemo<PresentationConfig | null>(() => {
    if (!data) return null;
    const configSetting = data[3].settings.find((s) => s.key === SETTING_KEYS.PRESENTATION_CONFIG);
    return configSetting
      ? JSON.parse(configSetting.value)
      : { tag_order: [], show_title_slide: true, show_end_slide: true, show_analytics: true, show_mnemonics: true, fragment_delay_ms: 500 };
  }, [data]);

  const progressRecords = data?.[2].records ?? [];

  const slideGroups = useMemo<SlideGroup[]>(() => {
    if (!data || !config) return [];
    const [tagsRes, flagTagsRes, progressRes, , statsRes, wrongGuessesRes, , , , , , , , , , , reactionTimesRes] = data;

    const tagsById = new Map(tagsRes.tags.map((t) => [t.id, t]));
    const progressByFlag = new Map(progressRes.records.map((p) => [p.flag, p]));
    const statsByFlag = new Map(statsRes.flags.map((s) => [s.flag, s]));

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
        .map(([g]) => ({ code: g, name: flagByCode(g)?.name || g }));
      topConfusions.set(flag, sorted);
    }

    const reactionTimeByFlag = new Map(reactionTimesRes.reaction_times.map((r) => [r.flag, r.avg_ms]));

    const flagTagMap = new Map<string, string[]>();
    for (const ft of flagTagsRes.flag_tags) {
      const list = flagTagMap.get(ft.tag_id) || [];
      list.push(ft.flag);
      flagTagMap.set(ft.tag_id, list);
    }

    const groups: SlideGroup[] = [];
    for (const tagId of config.tag_order) {
      const tag = tagsById.get(tagId);
      if (!tag) continue;
      const flagCodes = flagTagMap.get(tagId) || [];
      const flagSlides = flagCodes
        .map((code) => {
          const info = flagByCode(code);
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
    return groups;
  }, [data, config, flagByCode]);

  const stateBreakdown = useMemo(
    () =>
      [0, 1, 2, 3].map((state) => ({
        name: STATE_LABELS[state],
        value: state === 0
          ? collection.flags.length - progressRecords.filter((p) => p.state > 0).length
          : progressRecords.filter((p) => p.state === state).length,
      })),
    [progressRecords, collection.flags.length],
  );

  const analyticsData = useMemo(() => {
    if (!data) return null;
    const [, , , , , , progressChartRes, groupsRes, pairsRes, confRes, , hardestRes, compRes, sparklinesRes, percentilesRes, overallStatsRes] = data;

    const grpMap = new Map<string, { correct: number; total: number }>();
    for (const f of groupsRes.flags) {
      const flag = flagByCode(f.flag);
      if (!flag) continue;
      const g = flag.group;
      const entry = grpMap.get(g) || { correct: 0, total: 0 };
      entry.correct += f.correct_count;
      entry.total += f.attempt_count;
      grpMap.set(g, entry);
    }
    const groupData = [...grpMap.entries()]
      .map(([groupId, { correct, total }]) => ({
        group: groupName(collection, groupId),
        accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
        count: total,
      }))
      .sort((a, b) => b.accuracy - a.accuracy);

    const pairMap = new Map<string, { flagA: string; flagB: string; count: number }>();
    for (const p of pairsRes.pairs) {
      const key = [p.flag, p.guess].sort().join("-");
      const entry = pairMap.get(key) || { flagA: p.flag, flagB: p.guess, count: 0 };
      entry.count += p.count;
      pairMap.set(key, entry);
    }
    const mergedPairs = [...pairMap.values()].sort((a, b) => b.count - a.count).slice(0, 20);

    return {
      progress: progressChartRes.progress,
      groupData,
      groupLabel: collection.groupLabel,
      confidenceDist: confRes.distribution,
      activity: data[10].activity,
      hardest: hardestRes.hardest,
      comparison: compRes,
      stateBreakdown,
      mergedPairs,
      sparklines: sparklinesRes.sparklines,
      percentiles: { global: percentilesRes.global, by_mode: percentilesRes.by_mode, by_flag: percentilesRes.by_flag },
      overallStats: { total_attempts: overallStatsRes.total_attempts, total_sessions: overallStatsRes.total_sessions, accuracy: overallStatsRes.accuracy, flags_attempted: overallStatsRes.flags_attempted },
    };
  }, [data, stateBreakdown, flagByCode, collection]);

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

    if (fragmentDelayMs > 0) {
      deck.on("fragmentshown", (event: any) => {
        const fragment = event.fragment as HTMLElement;
        const index = parseInt(fragment.getAttribute("data-fragment-index") || "0", 10);
        if (index === 0) {
          const slide = fragment.closest("section");
          if (!slide) return;
          const allFragments = Array.from(slide.querySelectorAll(".fragment:not(.visible)"));
          allFragments.forEach((_, i) => {
            const timer = setTimeout(() => {
              if (revealRef.current) revealRef.current.nextFragment();
            }, fragmentDelayMs * (i + 1));
            autoAdvanceTimers.current.push(timer);
          });
        }
      });

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

  const navigate = useNavigate();

  function handleBack() {
    navigate(`/${collection.id}`);
  }

  return {
    collection,
    imageUrl,
    flagByCode,
    slideGroups,
    config,
    analyticsData,
    loading: isLoading,
    error: error?.message ?? null,
    deckRef,
    initReveal,
    destroyReveal,
    handleBack,
  };
}
