import { useMemo } from "react";
import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { useCollectionApi } from "../../lib/api";
import { useActiveCollection } from "../../lib/collection-context";
import type { SessionData, AttemptData } from "../../lib/types";

export type { SessionData, AttemptData };

export function useSummary() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { collection } = useActiveCollection();
  const api = useCollectionApi();

  const { data, isLoading, error } = useQuery({
    queryKey: ["session", collection.id, sessionId],
    queryFn: () => api.get<{ ok: boolean; session: SessionData; attempts: AttemptData[] }>(`/sessions/${sessionId}`),
    enabled: !!sessionId,
  });

  const session = data?.session ?? null;
  const attempts = data?.attempts ?? [];

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

  return { session, attempts, loading: isLoading, error: error?.message ?? null, accuracy, avgReaction };
}
