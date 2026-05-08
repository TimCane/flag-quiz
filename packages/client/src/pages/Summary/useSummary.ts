import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router";
import { api } from "../../lib/api";
import type { SessionData, AttemptData } from "../../lib/types";

export type { SessionData, AttemptData };

export function useSummary() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [session, setSession] = useState<SessionData | null>(null);
  const [attempts, setAttempts] = useState<AttemptData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) return;
    api
      .get<{ ok: boolean; session: SessionData; attempts: AttemptData[] }>(
        `/sessions/${sessionId}`,
      )
      .then((res) => {
        setSession(res.session);
        setAttempts(res.attempts);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sessionId]);

  const correctCount = useMemo(() => attempts.filter((a) => a.correct).length, [attempts]);
  const accuracy = useMemo(
    () => (attempts.length > 0 ? Math.round((correctCount / attempts.length) * 100) : 0),
    [attempts, correctCount],
  );
  const avgReaction = useMemo(
    () =>
      attempts.length > 0
        ? Math.round(attempts.reduce((sum, a) => sum + a.reaction_time_ms, 0) / attempts.length)
        : 0,
    [attempts],
  );

  return { session, attempts, loading, accuracy, avgReaction };
}
