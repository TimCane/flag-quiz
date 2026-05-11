import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { Mode, ExitCondition } from "@flag-quiz/shared";
import { useCollectionApi } from "../../lib/api";
import { useActiveCollection } from "../../lib/collection-context";
import { getActiveSession, clearActiveSession, type ActiveSession } from "../../lib/active-session";

interface HomeStats {
  flags_mastered: number;
  flags_learning: number;
  flags_new: number;
  total_attempts: number;
}

export function useHome() {
  const { collection } = useActiveCollection();
  const api = useCollectionApi();

  const [mode, setMode] = useState<string>(Mode.CLASSIC);
  const [exitCondition, setExitCondition] = useState<string>(ExitCondition.NORMAL);
  const [quick, setQuick] = useState(false);
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const navigate = useNavigate();

  const { data: stats, error } = useQuery({
    queryKey: ["homeStats", collection.id],
    queryFn: () => api.get<{ ok: boolean } & HomeStats>("/stats"),
  });

  useEffect(() => {
    const session = getActiveSession();
    // Only show resume card if it belongs to the active deck.
    if (session && session.collectionId === collection.id) {
      setActiveSession(session);
    } else {
      setActiveSession(null);
    }
  }, [collection.id]);

  function handleStart() {
    navigate(`/${collection.id}/play`, { state: { mode, exitCondition, quick } });
  }

  function handleResume() {
    if (!activeSession) return;
    navigate(`/${collection.id}/play`, {
      state: {
        mode: activeSession.mode,
        exitCondition: activeSession.exitCondition,
        resume: activeSession,
      },
    });
  }

  async function handleEndSession() {
    if (!activeSession) return;
    try {
      await api.put(`/sessions/${activeSession.sessionId}`, { ended: new Date().toISOString() });
    } catch {}
    clearActiveSession();
    if (activeSession.attemptCount === 0) {
      navigate(`/${collection.id}`);
    } else {
      navigate(`/${collection.id}/summary/${activeSession.sessionId}`);
    }
  }

  return {
    mode,
    setMode,
    exitCondition,
    setExitCondition,
    quick,
    setQuick,
    stats: stats ?? null,
    error: error?.message ?? null,
    activeSession,
    handleStart,
    handleResume,
    handleEndSession,
  };
}
