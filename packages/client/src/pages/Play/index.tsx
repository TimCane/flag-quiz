import { usePlay } from "./usePlay";
import { GameSession } from "../../components/game/GameSession";

export function Play() {
  const { isValid, mode, exitCondition, quick, resumeSession } = usePlay();

  if (!isValid) return null;

  return (
    <GameSession
      mode={mode}
      exitCondition={exitCondition}
      quick={quick}
      resumeSession={resumeSession}
    />
  );
}
