import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  type FlagProgress,
  type Setting,
  type Rating,
  type SchedulingResult,
  type ConfusionMap,
  type Tag,
  type FlagTag,
  Mode,
  ExitCondition,
  flags,
  createFsrs,
  progressToCard,
  cardToProgress,
  getSchedulingChoices,
  buildConfusionMap,
  pickOptions,
} from "@flag-quiz/shared";
import { api } from "../../../lib/api";
import { saveActiveSession, clearActiveSession } from "../../../lib/active-session";
import type { ActiveSession } from "../../../lib/active-session";

interface UseGameSessionProps {
  mode: string;
  exitCondition: string;
  quick?: boolean;
  resumeSession?: ActiveSession | null;
}

type Phase = "prompt" | "result" | "quick-flash" | "quick-wrong";

interface Percentiles {
  global: { p25: number; p75: number } | null;
  by_mode: Record<string, { p25: number; p75: number } | null>;
  by_flag: Record<string, { p25: number; p75: number }>;
}

interface AttemptState {
  flagCode: string;
  guess: string | null;
  correct: boolean;
  forgotten: boolean;
  reactionTimeMs: number;
  options: string[] | null;
  schedulingChoices: SchedulingResult[];
  shouldEndAfterReview: boolean;
}

function flattenConfusions(cm: ConfusionMap): { flag: string; guess: string }[] {
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

export function useGameSession({ mode, exitCondition, quick = false, resumeSession }: UseGameSessionProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [queue, setQueue] = useState<string[]>([]);
  const [progressMap, setProgressMap] = useState<Map<string, FlagProgress>>(new Map());
  const [settings, setSettings] = useState<Map<string, string>>(new Map());
  const [percentiles, setPercentiles] = useState<Percentiles | null>(null);
  const [confusionMap, setConfusionMap] = useState<ConfusionMap>({ confusions: new Map() });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("prompt");
  const [attempt, setAttempt] = useState<AttemptState | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [speedTimedOut, setSpeedTimedOut] = useState(false);
  const [tagsMap, setTagsMap] = useState<Map<string, Tag>>(new Map());
  const [flagTagsMap, setFlagTagsMap] = useState<Map<string, string[]>>(new Map());
  const promptStartRef = useRef<number>(0);
  const navigate = useNavigate();

  const fsrs = useRef(createFsrs());

  // Speed timeout value
  const speedTimeoutMs = useMemo(() => {
    if (exitCondition !== ExitCondition.SPEED) return 0;
    const key =
      mode === Mode.CLASSIC
        ? "speed_timeout_classic_ms"
        : mode === Mode.PICK_THE_FLAG
          ? "speed_timeout_pick_flag_ms"
          : "speed_timeout_pick_country_ms";
    return parseInt(settings.get(key) || "5000", 10);
  }, [mode, exitCondition, settings]);

  // Initialize session
  useEffect(() => {
    async function init() {
      try {
        const requests: Promise<any>[] = [
          api.get<{ ok: boolean; records: FlagProgress[] }>("/flag-progress"),
          api.get<{ ok: boolean; settings: Setting[] }>("/settings"),
          api.get<{ ok: boolean; wrong_guesses: { flag: string; guess: string }[] }>("/attempts/wrong-guesses"),
          api.get<{ ok: boolean; tags: Tag[] }>("/tags"),
          api.get<{ ok: boolean; flag_tags: FlagTag[] }>("/flag-tags"),
        ];
        if (quick) {
          requests.push(api.get<{ ok: boolean } & Percentiles>("/stats/percentiles"));
        }
        const [progressRes, settingsRes, wrongGuessesRes, tagsRes, flagTagsRes, percentilesRes] = await Promise.all(requests);

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

        const retention = parseFloat(sMap.get("fsrs_request_retention") || "0.9");
        const maxInterval = parseInt(sMap.get("fsrs_maximum_interval") || "365", 10);
        fsrs.current = createFsrs({ requestRetention: retention, maximumInterval: maxInterval });

        const now = new Date();
        const sorted = [...flags].sort((a, b) => {
          const pa = pMap.get(a.code);
          const pb = pMap.get(b.code);
          if (!pa && pb) return -1;
          if (pa && !pb) return 1;
          if (!pa && !pb) return 0;
          const dueA = pa!.due ? new Date(pa!.due) : now;
          const dueB = pb!.due ? new Date(pb!.due) : now;
          return dueA.getTime() - dueB.getTime();
        });

        const sortedQueue = sorted.map((f) => f.code);

        // Resume existing session or create new one
        if (resumeSession) {
          setSessionId(resumeSession.sessionId);
          setQueue(resumeSession.queue);
          setCurrentIndex(resumeSession.currentIndex);
          setAttemptCount(resumeSession.attemptCount);
          setCorrectCount(resumeSession.correctCount);
        } else {
          setQueue(sortedQueue);
          const id = crypto.randomUUID();
          await api.post("/sessions", {
            id,
            mode,
            exit_condition: exitCondition,
            quick,
            started: now.toISOString(),
          });
          setSessionId(id);

          // Save initial active session
          saveActiveSession({
            sessionId: id,
            mode,
            exitCondition,
            queue: sortedQueue,
            currentIndex: 0,
            attemptCount: 0,
            correctCount: 0,
          });
        }

        setLoading(false);
        promptStartRef.current = performance.now();
      } catch (err: any) {
        setError(err.message || "Failed to start session");
        setLoading(false);
      }
    }
    init();
  }, [mode, exitCondition]);

  const currentFlag = queue[currentIndex];

  const currentOptions = useMemo(() => {
    if (!currentFlag || mode === Mode.CLASSIC) return null;
    const minOpts = parseInt(settings.get("pick_options_min") || "2", 10);
    const maxOpts = parseInt(settings.get("pick_options_max") || "6", 10);
    return pickOptions(currentFlag, confusionMap, minOpts, maxOpts);
  }, [currentFlag, mode, confusionMap, settings]);

  function checkExitCondition(correct: boolean, reactionTimeMs: number): boolean {
    if (exitCondition === ExitCondition.STREAK && !correct) return true;
    if (exitCondition === ExitCondition.SPEED && reactionTimeMs > speedTimeoutMs) return true;
    if (currentIndex + 1 >= queue.length) return true;
    return false;
  }

  /** Auto-rate based on reaction time percentiles with fallback chain */
  function autoRate(flagCode: string, reactionTimeMs: number): Rating {
    if (!percentiles) return 3 as Rating; // Good fallback

    // Fallback chain: per-flag -> per-mode -> global
    const thresholds =
      percentiles.by_flag[flagCode] ??
      percentiles.by_mode[mode] ??
      percentiles.global;

    if (!thresholds) return 3 as Rating;

    if (reactionTimeMs <= thresholds.p25) return 4 as Rating; // Easy
    if (reactionTimeMs <= thresholds.p75) return 3 as Rating; // Good
    return 2 as Rating; // Hard
  }

  const submitAnswer = useCallback(
    (guess: string | null, forgotten: boolean, options: string[] | null) => {
      if (!currentFlag) return;

      const reactionTimeMs = Math.round(performance.now() - promptStartRef.current);
      const correct = guess === currentFlag;

      const progress = progressMap.get(currentFlag) ?? null;
      const card = progressToCard(progress);
      const choices = getSchedulingChoices(fsrs.current, card);

      const shouldEnd = checkExitCondition(correct, reactionTimeMs);

      setAttempt({
        flagCode: currentFlag,
        guess,
        correct,
        forgotten,
        reactionTimeMs,
        options,
        schedulingChoices: choices,
        shouldEndAfterReview: shouldEnd,
      });
      setSpeedTimedOut(false);

      if (quick && correct) {
        // Quick mode correct: show brief flash, auto-rate
        setPhase("quick-flash");
      } else if (quick && !correct) {
        // Quick mode wrong: show mnemonic editor
        setPhase("quick-wrong");
      } else {
        setPhase("result");
      }
    },
    [currentFlag, progressMap, currentIndex, queue.length, exitCondition, speedTimeoutMs, quick],
  );

  const handleClassicAnswer = useCallback(
    (guess: string | null, forgotten: boolean) => submitAnswer(guess, forgotten, null),
    [submitAnswer],
  );

  const handlePickAnswer = useCallback(
    (guess: string) => submitAnswer(guess, false, currentOptions),
    [submitAnswer, currentOptions],
  );

  // Speed mode timeout handler -- submit as "too slow"
  const handleSpeedTimeout = useCallback(() => {
    if (!currentFlag || phase !== "prompt") return;
    setSpeedTimedOut(true);

    const progress = progressMap.get(currentFlag) ?? null;
    const card = progressToCard(progress);
    const choices = getSchedulingChoices(fsrs.current, card);

    setAttempt({
      flagCode: currentFlag,
      guess: null,
      correct: false,
      forgotten: true,
      reactionTimeMs: speedTimeoutMs,
      options: currentOptions,
      schedulingChoices: choices,
      shouldEndAfterReview: true,
    });
    setPhase("result");
  }, [currentFlag, phase, progressMap, speedTimeoutMs, currentOptions]);

  const handleRate = useCallback(
    (rating: Rating, mnemonic: string) => {
      if (!attempt || !sessionId) return;

      const chosen = attempt.schedulingChoices.find((c) => c.rating === rating);
      if (!chosen) return;

      const newAttemptCount = attemptCount + 1;
      const newCorrectCount = attempt.correct ? correctCount + 1 : correctCount;
      setAttemptCount(newAttemptCount);
      setCorrectCount(newCorrectCount);

      // Update local state immediately
      const updatedProgress = cardToProgress(attempt.flagCode, chosen.card);
      const existingMnemonic = progressMap.get(attempt.flagCode)?.mnemonic || "";
      const finalMnemonic = mnemonic || existingMnemonic;

      setProgressMap((prev) => {
        const next = new Map(prev);
        next.set(attempt.flagCode, { ...updatedProgress, mnemonic: finalMnemonic });
        return next;
      });

      if (!attempt.correct && attempt.guess) {
        setConfusionMap((prev) =>
          buildConfusionMap([
            ...flattenConfusions(prev),
            { flag: attempt.flagCode, guess: attempt.guess! },
          ]),
        );
      }

      // Fire-and-forget: save to server in background
      const attemptId = crypto.randomUUID();
      const ts = new Date().toISOString();
      const baseData = {
        id: attemptId,
        session_id: sessionId,
        flag: attempt.flagCode,
        correct: attempt.correct,
        confidence: rating,
        reaction_time_ms: attempt.reactionTimeMs,
        ts,
      };

      const savePromise = (async () => {
        if (mode === Mode.CLASSIC) {
          await api.post("/classic-attempts", { ...baseData, guess: attempt.guess, forgotten: attempt.forgotten });
        } else if (mode === Mode.PICK_THE_FLAG) {
          await api.post("/pick-flag-attempts", { ...baseData, guess: attempt.guess ?? attempt.flagCode, options: attempt.options! });
        } else if (mode === Mode.PICK_THE_COUNTRY) {
          await api.post("/pick-country-attempts", { ...baseData, guess: attempt.guess ?? attempt.flagCode, options: attempt.options! });
        }
        await api.post("/flag-progress", { ...updatedProgress, mnemonic: finalMnemonic });
      })();

      // Don't block UI on save -- just log errors
      savePromise.catch((err) => console.error("Save failed:", err));

      // Advance UI immediately
      if (attempt.shouldEndAfterReview) {
        clearActiveSession();
        // Wait for save before ending so the data is there for the summary
        savePromise.then(() => endSession()).catch(() => endSession());
        return;
      }

      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setPhase("prompt");
      setAttempt(null);
      promptStartRef.current = performance.now();

      // Persist active session for rejoin
      saveActiveSession({
        sessionId,
        mode,
        exitCondition,
        queue,
        currentIndex: nextIndex,
        attemptCount: newAttemptCount,
        correctCount: newCorrectCount,
      });
    },
    [attempt, sessionId, mode, progressMap, exitCondition, currentIndex, queue, attemptCount, correctCount],
  );

  /** Quick mode: correct flash done -- auto-rate and advance */
  const handleQuickCorrectDone = useCallback(() => {
    if (!attempt) return;
    const rating = autoRate(attempt.flagCode, attempt.reactionTimeMs);
    const mnemonic = progressMap.get(attempt.flagCode)?.mnemonic || "";
    handleRate(rating, mnemonic);
  }, [attempt, progressMap, handleRate]);

  /** Quick mode: wrong -- user clicked Next with mnemonic */
  const handleQuickWrongNext = useCallback(
    (mnemonic: string) => {
      if (!attempt) return;
      handleRate(1 as Rating, mnemonic); // Always "Again" for wrong
    },
    [attempt, handleRate],
  );

  // Keyboard shortcuts: 1-4 for rating on result screen
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (phase !== "result" || !attempt) return;
      const key = parseInt(e.key, 10);
      if (key >= 1 && key <= 4) {
        e.preventDefault();
        const mnemonic = progressMap.get(attempt.flagCode)?.mnemonic || "";
        handleRate(key as Rating, mnemonic);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [phase, attempt, handleRate, progressMap]);

  async function endSession() {
    if (!sessionId) return;
    clearActiveSession();
    try {
      await api.put(`/sessions/${sessionId}`, { ended: new Date().toISOString() });
    } catch {
      // Best effort
    }
    navigate(`/summary/${sessionId}`);
  }

  const getTagNames = useCallback(
    (flagCode: string): string[] => {
      const tagIds = flagTagsMap.get(flagCode) || [];
      return tagIds
        .map((id) => tagsMap.get(id)?.name)
        .filter((n): n is string => !!n);
    },
    [flagTagsMap, tagsMap],
  );

  return {
    // State
    loading,
    error,
    currentFlag,
    currentIndex,
    currentOptions,
    phase,
    attempt,
    attemptCount,
    correctCount,
    speedTimedOut,
    speedTimeoutMs,
    queue,
    progressMap,

    // Derived
    mode,
    exitCondition,

    // Handlers
    handleClassicAnswer,
    handlePickAnswer,
    handleSpeedTimeout,
    handleRate,
    handleQuickCorrectDone,
    handleQuickWrongNext,
    endSession,
    navigate,
    getTagNames,
  };
}
