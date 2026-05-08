import { useState, useEffect } from "react";
import { useParams } from "react-router";
import { flagByCode, type FlagProgress } from "@flag-quiz/shared";
import { api } from "../../lib/api";

interface AttemptRow {
  id: string;
  flag: string;
  guess: string | null;
  correct: boolean;
  forgotten?: boolean;
  confidence: number;
  reaction_time_ms: number;
  ts: string;
  session_id: string;
}

interface ConfusionRow {
  guess: string;
  count: number;
}

export type { AttemptRow, ConfusionRow };

export function useFlagDetail() {
  const { flag: flagCode } = useParams<{ flag: string }>();
  const [progress, setProgress] = useState<FlagProgress | null>(null);
  const [attempts, setAttempts] = useState<AttemptRow[]>([]);
  const [confusions, setConfusions] = useState<ConfusionRow[]>([]);
  const [mnemonic, setMnemonic] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const flag = flagCode ? flagByCode.get(flagCode) : null;

  useEffect(() => {
    if (!flagCode) return;

    Promise.all([
      api.get<{ ok: boolean; records: FlagProgress[] }>("/flag-progress"),
      api.get<{ ok: boolean; classic: AttemptRow[]; pick_flag: AttemptRow[]; pick_country: AttemptRow[] }>(`/attempts/${flagCode}`),
      api.get<{ ok: boolean; confusions: ConfusionRow[] }>(`/stats/confusions/${flagCode}`),
    ])
      .then(([progressRes, attemptsRes, confusionsRes]) => {
        const p = progressRes.records.find((r) => r.flag === flagCode) ?? null;
        setProgress(p);
        setMnemonic(p?.mnemonic ?? "");

        // Merge all attempts and sort by timestamp
        const all: AttemptRow[] = [
          ...attemptsRes.classic,
          ...attemptsRes.pick_flag,
          ...attemptsRes.pick_country,
        ].sort((a, b) => b.ts.localeCompare(a.ts));
        setAttempts(all);

        setConfusions(confusionsRes.confusions);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [flagCode]);

  async function saveMnemonic() {
    if (!flagCode || !progress) return;
    setSaving(true);
    try {
      await api.post("/flag-progress", {
        ...progress,
        mnemonic,
        updated_at: new Date().toISOString(),
      });
      setProgress({ ...progress, mnemonic });
    } catch {
      // Error handled by api layer
    } finally {
      setSaving(false);
    }
  }

  return {
    flag,
    progress,
    attempts,
    confusions,
    mnemonic,
    setMnemonic,
    saving,
    saveMnemonic,
    loading,
  };
}
