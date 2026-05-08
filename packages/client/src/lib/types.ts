export interface SessionData {
  id: string;
  mode: string;
  exit_condition: string;
  started: string;
  ended: string | null;
}

export interface AttemptData {
  id: string;
  flag: string;
  guess: string | null;
  correct: boolean;
  forgotten?: boolean;
  confidence: number;
  reaction_time_ms: number;
  ts: string;
}
