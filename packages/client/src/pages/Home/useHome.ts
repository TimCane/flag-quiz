import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Mode, ExitCondition } from "@flag-quiz/shared";
import { api } from "../../lib/api";
import { getActiveSession, clearActiveSession, type ActiveSession } from "../../lib/active-session";

export function useHome() {
  const [mode, setMode] = useState<string>(Mode.CLASSIC);
  const [exitCondition, setExitCondition] = useState<string>(ExitCondition.NORMAL);
  const [quick, setQuick] = useState(false);
  const [stats, setStats] = useState<{
    flags_mastered: number;
    flags_learning: number;
    flags_new: number;
    total_attempts: number;
  } | null>(null);
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get<{ ok: boolean } & typeof stats>("/stats").then(setStats).catch(() => {});
    setActiveSession(getActiveSession());
  }, []);

  function handleStart() {
    navigate("/play", { state: { mode, exitCondition, quick } });
  }

  function handleResume() {
    if (!activeSession) return;
    navigate("/play", {
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
    navigate(`/summary/${activeSession.sessionId}`);
  }

  return {
    mode,
    setMode,
    exitCondition,
    setExitCondition,
    quick,
    setQuick,
    stats,
    activeSession,
    handleStart,
    handleResume,
    handleEndSession,
  };
}
