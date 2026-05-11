import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router";
import { type FlagProgress } from "@flag-quiz/shared";
import { useCollectionApi } from "../../lib/api";
import { useActiveCollection } from "../../lib/collection-context";
import { useToast } from "../../components/ui/toast";

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
  const { collection, flagByCode } = useActiveCollection();
  const api = useCollectionApi();

  const [mnemonic, setMnemonic] = useState("");
  const [saving, setSaving] = useState(false);
  const [progressOverride, setProgressOverride] = useState<FlagProgress | null>(null);

  const { showToast } = useToast();
  const flag = flagCode ? flagByCode(flagCode) : null;

  const { data, isLoading, error } = useQuery({
    queryKey: ["flagDetail", collection.id, flagCode],
    queryFn: () =>
      Promise.all([
        api.get<{ ok: boolean; records: FlagProgress[] }>("/flag-progress"),
        api.get<{ ok: boolean; classic: AttemptRow[]; pick_flag: AttemptRow[]; pick_item: AttemptRow[] }>(`/attempts/${flagCode}`),
        api.get<{ ok: boolean; confusions: ConfusionRow[] }>(`/stats/confusions/${flagCode}`),
      ]),
    enabled: !!flagCode,
  });

  const fetchedProgress = useMemo(() => {
    if (!data || !flagCode) return null;
    return data[0].records.find((r) => r.flag === flagCode) ?? null;
  }, [data, flagCode]);

  const progress = progressOverride ?? fetchedProgress;

  const attempts = useMemo(() => {
    if (!data) return [];
    const all: AttemptRow[] = [
      ...data[1].classic,
      ...data[1].pick_flag,
      ...data[1].pick_item,
    ].sort((a, b) => b.ts.localeCompare(a.ts));
    return all;
  }, [data]);

  const confusions = data?.[2].confusions ?? [];

  // Sync mnemonic from progress when data loads
  useEffect(() => {
    if (progress) {
      setMnemonic(progress.mnemonic ?? "");
    }
  }, [progress]);

  async function saveMnemonic() {
    if (!flagCode || !progress) return;
    setSaving(true);
    setProgressOverride({ ...progress, mnemonic });
    try {
      await api.post("/flag-progress", {
        ...progress,
        mnemonic,
        updated_at: new Date().toISOString(),
      });
    } catch {
      setProgressOverride(null);
      showToast("Failed to save note");
    } finally {
      setSaving(false);
    }
  }

  return {
    collection,
    flag,
    progress,
    attempts,
    confusions,
    mnemonic,
    setMnemonic,
    saving,
    saveMnemonic,
    loading: isLoading,
    error: error?.message ?? null,
  };
}
