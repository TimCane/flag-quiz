import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  type FlagProgress,
  type Setting,
  type ConfusionMap,
  type Tag,
  type FlagTag,
  ExitCondition,
  SETTING_KEYS,
  createFsrs,
  buildConfusionMap,
} from "@flag-quiz/shared";
import { api, useCollectionApi } from "../../../lib/api";
import { useActiveCollection } from "../../../lib/collection-context";
import { saveActiveSession } from "../../../lib/active-session";
import type { ActiveSession } from "../../../lib/active-session";

interface Percentiles {
  global: { p25: number; p75: number } | null;
  by_mode: Record<string, { p25: number; p75: number } | null>;
  by_flag: Record<string, { p25: number; p75: number }>;
}

interface UseSessionInitProps {
  mode: string;
  exitCondition: string;
  quick: boolean;
  resumeSession?: ActiveSession | null;
}

export function useSessionInit({ mode, exitCondition, quick, resumeSession }: UseSessionInitProps) {
  const { collection } = useActiveCollection();
  const collectionApi = useCollectionApi();
  const flags = collection.flags;

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [queue, setQueue] = useState<string[]>([]);
  const [progressMap, setProgressMap] = useState<Map<string, FlagProgress>>(new Map());
  const [settings, setSettings] = useState<Map<string, string>>(new Map());
  const [percentiles, setPercentiles] = useState<Percentiles | null>(null);
  const [confusionMap, setConfusionMap] = useState<ConfusionMap>({ confusions: new Map() });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [attemptCount, setAttemptCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tagsMap, setTagsMap] = useState<Map<string, Tag>>(new Map());
  const [flagTagsMap, setFlagTagsMap] = useState<Map<string, string[]>>(new Map());

  const fsrs = useRef(createFsrs());

  // Fetch session prerequisites via TanStack Query
  const { data: initData, error: queryError } = useQuery({
    queryKey: ["session-init", collection.id, quick],
    queryFn: async () => {
      const requests: Promise<any>[] = [
        collectionApi.get<{ ok: boolean; records: FlagProgress[] }>("/flag-progress"),
        api.get<{ ok: boolean; settings: Setting[] }>("/settings"),
        collectionApi.get<{ ok: boolean; wrong_guesses: { flag: string; guess: string }[] }>("/attempts/wrong-guesses"),
        collectionApi.get<{ ok: boolean; tags: Tag[] }>("/tags"),
        collectionApi.get<{ ok: boolean; flag_tags: FlagTag[] }>("/flag-tags"),
      ];
      if (quick) {
        requests.push(collectionApi.get<{ ok: boolean } & Percentiles>("/stats/percentiles"));
      }
      return Promise.all(requests);
    },
    staleTime: 0, // Always refetch on new session
  });

  // Process fetched data and create session
  const initialized = useRef(false);
  useEffect(() => {
    if (!initData || initialized.current) return;
    initialized.current = true;

    const [progressRes, settingsRes, wrongGuessesRes, tagsRes, flagTagsRes, percentilesRes] = initData;

    if (percentilesRes) {
      setPercentiles({
        global: percentilesRes.global,
        by_mode: percentilesRes.by_mode,
        by_flag: percentilesRes.by_flag,
      });
    }

    const pMap = new Map<string, FlagProgress>();
    for (const p of progressRes.records) pMap.set(p.flag, p);
    setProgressMap(pMap);

    const sMap = new Map<string, string>();
    for (const s of settingsRes.settings) sMap.set(s.key, s.value);
    setSettings(sMap);

    setConfusionMap(buildConfusionMap(wrongGuessesRes.wrong_guesses ?? []));

    const tMap = new Map<string, Tag>();
    for (const t of tagsRes.tags) tMap.set(t.id, t);
    setTagsMap(tMap);

    const ftMap = new Map<string, string[]>();
    for (const ft of flagTagsRes.flag_tags) {
      const list = ftMap.get(ft.flag) || [];
      list.push(ft.tag_id);
      ftMap.set(ft.flag, list);
    }
    setFlagTagsMap(ftMap);

    const retention = parseFloat(sMap.get(SETTING_KEYS.FSRS_REQUEST_RETENTION) || "0.9");
    const maxInterval = parseInt(sMap.get(SETTING_KEYS.FSRS_MAXIMUM_INTERVAL) || "365", 10);
    fsrs.current = createFsrs({ requestRetention: retention, maximumInterval: maxInterval });

    const now = new Date();
    const rng = new Map<string, number>();
    for (const f of flags) rng.set(f.code, Math.random());
    const sorted = [...flags].sort((a, b) => {
      const pa = pMap.get(a.code);
      const pb = pMap.get(b.code);
      if (!pa && pb) return -1;
      if (pa && !pb) return 1;
      if (!pa && !pb) return rng.get(a.code)! - rng.get(b.code)!;
      const dueA = pa!.due ? new Date(pa!.due) : now;
      const dueB = pb!.due ? new Date(pb!.due) : now;
      const diff = dueA.getTime() - dueB.getTime();
      return diff !== 0 ? diff : rng.get(a.code)! - rng.get(b.code)!;
    });

    let finalList = sorted;
    if (exitCondition === ExitCondition.DUE) {
      const todayEnd = new Date(now);
      todayEnd.setHours(23, 59, 59, 999);
      finalList = sorted.filter((f) => {
        const p = pMap.get(f.code);
        if (!p || !p.due) return false;
        return new Date(p.due) <= todayEnd;
      });
    }
    const sortedQueue = finalList.map((f) => f.code);

    if (resumeSession) {
      setSessionId(resumeSession.sessionId);
      setQueue(resumeSession.queue);
      setCurrentIndex(resumeSession.currentIndex);
      setAttemptCount(resumeSession.attemptCount);
      setCorrectCount(resumeSession.correctCount);
      setLoading(false);
    } else {
      setQueue(sortedQueue);
      const id = crypto.randomUUID();
      collectionApi
        .post("/sessions", {
          id,
          mode,
          exit_condition: exitCondition,
          quick,
          started: now.toISOString(),
        })
        .then(() => {
          setSessionId(id);
          saveActiveSession({
            sessionId: id,
            mode,
            exitCondition,
            queue: sortedQueue,
            currentIndex: 0,
            attemptCount: 0,
            correctCount: 0,
            collectionId: collection.id,
          });
          setLoading(false);
        })
        .catch((err: any) => {
          setError(err.message || "Failed to create session");
          setLoading(false);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initData]);

  useEffect(() => {
    if (queryError) {
      setError(queryError.message || "Failed to start session");
      setLoading(false);
    }
  }, [queryError]);

  return {
    sessionId,
    queue,
    progressMap,
    setProgressMap,
    settings,
    percentiles,
    confusionMap,
    setConfusionMap,
    currentIndex,
    setCurrentIndex,
    attemptCount,
    setAttemptCount,
    correctCount,
    setCorrectCount,
    loading,
    error,
    tagsMap,
    flagTagsMap,
    fsrs,
  };
}

export type { Percentiles };
