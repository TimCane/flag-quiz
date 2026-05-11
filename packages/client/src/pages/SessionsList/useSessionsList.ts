import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCollectionApi } from "../../lib/api";
import { useActiveCollection } from "../../lib/collection-context";

interface SessionRow {
  id: string;
  mode: string;
  exit_condition: string;
  started: string;
  ended: string | null;
  attempt_count: number;
  accuracy: number;
}

export type { SessionRow };

export function useSessionsList() {
  const { collection } = useActiveCollection();
  const api = useCollectionApi();
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const { data, isLoading, error } = useQuery({
    queryKey: ["sessions", collection.id, offset],
    queryFn: () => api.get<{ ok: boolean; sessions: SessionRow[]; total: number }>(
      `/sessions?limit=${limit}&offset=${offset}`,
    ),
  });

  return {
    sessions: data?.sessions ?? [],
    loading: isLoading,
    error: error?.message ?? null,
    total: data?.total ?? 0,
    offset,
    setOffset,
    limit,
  };
}
