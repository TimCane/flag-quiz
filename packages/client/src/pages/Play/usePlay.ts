import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { type ActiveSession } from "../../lib/active-session";

interface PlayState {
  mode?: string;
  exitCondition?: string;
  quick?: boolean;
  resume?: ActiveSession;
}

export function usePlay() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as PlayState | null;

  useEffect(() => {
    if (!state?.mode || !state?.exitCondition) {
      navigate("/", { replace: true });
    }
  }, [state, navigate]);

  const isValid = !!(state?.mode && state?.exitCondition);

  return {
    isValid,
    mode: state?.mode ?? "",
    exitCondition: state?.exitCondition ?? "",
    quick: state?.quick ?? false,
    resumeSession: state?.resume ?? null,
  };
}
