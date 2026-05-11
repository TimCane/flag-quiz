import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  type Rating,
  type SchedulingResult,
  Mode,
  ExitCondition,
  SETTING_KEYS,
  progressToCard,
  cardToProgress,
  getSchedulingChoices,
  buildConfusionMap,
  pickOptions,
} from "@flag-quiz/shared";
import { useActiveCollection } from "../../../lib/collection-context";
import { saveActiveSession, clearActiveSession } from "../../../lib/active-session";
import { useToast } from "../../ui/toast";
import type { ActiveSession } from "../../../lib/active-session";
import { useSessionInit } from "./useSessionInit.js";
import { useAttemptSaver } from "./useAttemptSaver.js";
import { useCollectionApi } from "../../../lib/api";
import { flattenConfusions, checkExitCondition as checkExit, autoRate as computeAutoRate } from "../../../lib/game-logic";

interface UseGameSessionProps {
  mode: string;
  exitCondition: string;
  quick?: boolean;
  resumeSession?: ActiveSession | null;
}

type Phase = "prompt" | "result" | "quick-flash" | "quick-wrong";

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

export function useGameSession({ mode, exitCondition, quick = false, resumeSession }: UseGameSessionProps) {
  const { collection } = useActiveCollection();
  const collectionApi = useCollectionApi();
  const navigate = useNavigate();

  const {
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
  } = useSessionInit({ mode, exitCondition, quick, resumeSession });

  const { saveAttempt } = useAttemptSaver(mode);
  const { showToast } = useToast();

  const [phase, setPhase] = useState<Phase>("prompt");
  const [attempt, setAttempt] = useState<AttemptState | null>(null);
  const [speedTimedOut, setSpeedTimedOut] = useState(false);
  const promptStartRef = useRef<number>(0);

  // Reset prompt timer when loading completes
  useEffect(() => {
    if (!loading) promptStartRef.current = performance.now();
  }, [loading]);

  const speedTimeoutMs = useMemo(() => {
    if (exitCondition !== ExitCondition.SPEED) return 0;
    const key =
      mode === Mode.CLASSIC
        ? SETTING_KEYS.SPEED_TIMEOUT_CLASSIC_MS
        : mode === Mode.PICK_THE_FLAG
          ? SETTING_KEYS.SPEED_TIMEOUT_PICK_FLAG_MS
          : SETTING_KEYS.SPEED_TIMEOUT_PICK_ITEM_MS;
    return parseInt(settings.get(key) || "5000", 10);
  }, [mode, exitCondition, settings]);

  const currentFlag = queue[currentIndex];

  const currentOptions = useMemo(() => {
    if (!currentFlag || mode === Mode.CLASSIC) return null;
    const minOpts = parseInt(settings.get(SETTING_KEYS.PICK_OPTIONS_MIN) || "2", 10);
    const maxOpts = parseInt(settings.get(SETTING_KEYS.PICK_OPTIONS_MAX) || "6", 10);
    return pickOptions(currentFlag, collection.flags, confusionMap, minOpts, maxOpts);
  }, [currentFlag, mode, confusionMap, settings, collection.flags]);

  function checkExitCondition(correct: boolean, reactionTimeMs: number): boolean {
    return checkExit(exitCondition, correct, reactionTimeMs, speedTimeoutMs, currentIndex, queue.length);
  }

  function autoRate(flagCode: string, reactionTimeMs: number): Rating {
    return computeAutoRate(flagCode, reactionTimeMs, mode, percentiles);
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

      setAttempt({ flagCode: currentFlag, guess, correct, forgotten, reactionTimeMs, options, schedulingChoices: choices, shouldEndAfterReview: shouldEnd });
      setSpeedTimedOut(false);

      if (quick && correct) setPhase("quick-flash");
      else if (quick && !correct) setPhase("quick-wrong");
      else setPhase("result");
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

  const handleSpeedTimeout = useCallback(() => {
    if (!currentFlag || phase !== "prompt") return;
    setSpeedTimedOut(true);
    const progress = progressMap.get(currentFlag) ?? null;
    const card = progressToCard(progress);
    const choices = getSchedulingChoices(fsrs.current, card);
    setAttempt({ flagCode: currentFlag, guess: null, correct: false, forgotten: true, reactionTimeMs: speedTimeoutMs, options: currentOptions, schedulingChoices: choices, shouldEndAfterReview: true });
    setPhase("result");
  }, [currentFlag, phase, progressMap, speedTimeoutMs, currentOptions]);

  function advanceOrEnd(newAttemptCount: number, newCorrectCount: number) {
    if (attempt?.shouldEndAfterReview) {
      clearActiveSession();
      return true;
    }

    const nextIndex = currentIndex + 1;
    setCurrentIndex(nextIndex);
    setPhase("prompt");
    setAttempt(null);
    promptStartRef.current = performance.now();

    saveActiveSession({
      sessionId: sessionId!,
      mode,
      exitCondition,
      queue,
      currentIndex: nextIndex,
      attemptCount: newAttemptCount,
      correctCount: newCorrectCount,
      collectionId: collection.id,
    });
    return false;
  }

  const handleRate = useCallback(
    (rating: Rating, mnemonic: string) => {
      if (!attempt || !sessionId) return;

      const chosen = attempt.schedulingChoices.find((c) => c.rating === rating);
      if (!chosen) return;

      const newAttemptCount = attemptCount + 1;
      const newCorrectCount = attempt.correct ? correctCount + 1 : correctCount;
      setAttemptCount(newAttemptCount);
      setCorrectCount(newCorrectCount);

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
          buildConfusionMap([...flattenConfusions(prev), { flag: attempt.flagCode, guess: attempt.guess! }]),
        );
      }

      const ts = new Date().toISOString();
      const savePromise = (async () => {
        await saveAttempt({
          id: crypto.randomUUID(),
          session_id: sessionId,
          flag: attempt.flagCode,
          correct: attempt.correct,
          confidence: rating,
          reaction_time_ms: attempt.reactionTimeMs,
          ts,
          guess: attempt.guess,
          forgotten: attempt.forgotten,
          options: attempt.options,
        });
        await collectionApi.post("/flag-progress", { ...updatedProgress, mnemonic: finalMnemonic });
      })();

      savePromise.catch(() => showToast("Failed to save — check your connection"));

      const shouldEnd = advanceOrEnd(newAttemptCount, newCorrectCount);
      if (shouldEnd) {
        savePromise.then(() => endSession()).catch(() => endSession());
      }
    },
    [attempt, sessionId, mode, progressMap, exitCondition, currentIndex, queue, attemptCount, correctCount, saveAttempt, collectionApi, collection.id],
  );

  const handleAccidental = useCallback(() => {
    if (!attempt || !sessionId) return;

    const newAttemptCount = attemptCount + 1;
    setAttemptCount(newAttemptCount);

    const ts = new Date().toISOString();
    const savePromise = saveAttempt({
      id: crypto.randomUUID(),
      session_id: sessionId,
      flag: attempt.flagCode,
      correct: attempt.correct,
      confidence: 3,
      reaction_time_ms: attempt.reactionTimeMs,
      ts,
      guess: attempt.guess,
      forgotten: attempt.forgotten,
      options: attempt.options,
      accidental: true,
    });
    savePromise.catch((err) => console.error("Save failed:", err));

    const shouldEnd = advanceOrEnd(newAttemptCount, correctCount);
    if (shouldEnd) {
      savePromise.then(() => endSession()).catch(() => endSession());
    }
  }, [attempt, sessionId, mode, exitCondition, currentIndex, queue, attemptCount, correctCount, saveAttempt, collection.id]);

  const handleQuickCorrectDone = useCallback(() => {
    if (!attempt) return;
    const rating = autoRate(attempt.flagCode, attempt.reactionTimeMs);
    const mnemonic = progressMap.get(attempt.flagCode)?.mnemonic || "";
    handleRate(rating, mnemonic);
  }, [attempt, progressMap, handleRate]);

  const handleQuickWrongNext = useCallback(
    (mnemonic: string) => {
      if (!attempt) return;
      handleRate(1 as Rating, mnemonic);
    },
    [attempt, handleRate],
  );

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (phase !== "result" || !attempt) return;
      if (e.key === "0" && !attempt.correct) {
        e.preventDefault();
        handleAccidental();
        return;
      }
      const key = parseInt(e.key, 10);
      if (key >= 1 && key <= 4) {
        e.preventDefault();
        const mnemonic = progressMap.get(attempt.flagCode)?.mnemonic || "";
        handleRate(key as Rating, mnemonic);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [phase, attempt, handleRate, handleAccidental, progressMap]);

  async function endSession() {
    if (!sessionId) return;
    clearActiveSession();
    try {
      await collectionApi.put(`/sessions/${sessionId}`, { ended: new Date().toISOString() });
    } catch {
      // Best effort
    }
    if (attemptCount === 0) {
      navigate(`/${collection.id}`);
    } else {
      navigate(`/${collection.id}/summary/${sessionId}`);
    }
  }

  const getTagNames = useCallback(
    (flagCode: string): string[] => {
      const tagIds = flagTagsMap.get(flagCode) || [];
      return tagIds.map((id) => tagsMap.get(id)?.name).filter((n): n is string => !!n);
    },
    [flagTagsMap, tagsMap],
  );

  return {
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
    handleClassicAnswer,
    handlePickAnswer,
    handleSpeedTimeout,
    handleRate,
    handleAccidental,
    handleQuickCorrectDone,
    handleQuickWrongNext,
    endSession,
    getTagNames,
  };
}
