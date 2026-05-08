import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router";
import { api } from "../../lib/api";
import type { SessionData, AttemptData } from "../../lib/types";

export type { SessionData, AttemptData };

export function useSessionDetail() {
  const { id } = useParams<{ id: string }>();
  const [session, setSession] = useState<SessionData | null>(null);
  const [attempts, setAttempts] = useState<AttemptData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api
      .get<{ ok: boolean; session: SessionData; attempts: AttemptData[] }>(
        `/sessions/${id}`,
      )
      .then((res) => {
        setSession(res.session);
        setAttempts(res.attempts);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const started = session ? new Date(session.started) : null;
  const ended = session?.ended ? new Date(session.ended) : null;
  const duration =
    started && ended
      ? Math.round((ended.getTime() - started.getTime()) / 1000)
      : null;
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

  return { session, attempts, loading, started, duration, accuracy, avgReaction };
}
