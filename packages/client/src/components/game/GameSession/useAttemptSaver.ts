import { useCallback } from "react";
import { Mode } from "@flag-quiz/shared";
import { useCollectionApi } from "../../../lib/api";

interface AttemptData {
  id: string;
  session_id: string;
  flag: string;
  correct: boolean;
  confidence: number;
  reaction_time_ms: number;
  ts: string;
  guess: string | null;
  forgotten: boolean;
  options: string[] | null;
  accidental?: boolean;
}

export function useAttemptSaver(mode: string) {
  const collectionApi = useCollectionApi();

  const saveAttempt = useCallback(
    async (data: AttemptData) => {
      const base = {
        id: data.id,
        session_id: data.session_id,
        flag: data.flag,
        correct: data.correct,
        confidence: data.confidence,
        reaction_time_ms: data.reaction_time_ms,
        ts: data.ts,
        accidental: data.accidental,
      };

      if (mode === Mode.CLASSIC) {
        await collectionApi.post("/classic-attempts", { ...base, guess: data.guess, forgotten: data.forgotten });
      } else if (mode === Mode.PICK_THE_FLAG) {
        await collectionApi.post("/pick-flag-attempts", { ...base, guess: data.guess ?? data.flag, options: data.options! });
      } else if (mode === Mode.PICK_THE_ITEM) {
        await collectionApi.post("/pick-item-attempts", { ...base, guess: data.guess ?? data.flag, options: data.options! });
      }
    },
    [mode, collectionApi],
  );

  return { saveAttempt };
}
