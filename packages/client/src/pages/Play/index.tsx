import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { GameSession } from "../../components/game/GameSession";
import { type ActiveSession } from "../../lib/active-session";

interface PlayState {
  mode?: string;
  exitCondition?: string;
  quick?: boolean;
  resume?: ActiveSession;
}

export function Play() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as PlayState | null;

  useEffect(() => {
    if (!state?.mode || !state?.exitCondition) {
      navigate("/", { replace: true });
    }
  }, [state, navigate]);

  if (!state?.mode || !state?.exitCondition) return null;

  return (
    <GameSession
      mode={state.mode}
      exitCondition={state.exitCondition}
      quick={state.quick ?? false}
      resumeSession={state.resume ?? null}
    />
  );
}
