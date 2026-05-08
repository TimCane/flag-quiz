import { useState, useEffect } from "react";
import { api } from "../../lib/api";

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
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const limit = 20;

  useEffect(() => {
    setLoading(true);
    api
      .get<{ ok: boolean; sessions: SessionRow[]; total: number }>(
        `/sessions?limit=${limit}&offset=${offset}`,
      )
      .then((res) => {
        setSessions(res.sessions);
        setTotal(res.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [offset]);

  return { sessions, loading, total, offset, setOffset, limit };
}
