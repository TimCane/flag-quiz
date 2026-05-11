import { useFlagDetail } from "./useFlagDetail";
import { FlagDisplay } from "../../components/game/FlagDisplay";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { PageSkeleton } from "../../components/ui/skeleton";
import { MnemonicTextarea } from "../../components/ui/mnemonic-textarea";
import { groupName } from "../../lib/labels";
import { ProgressCard } from "./ProgressCard";
import { ConfusionsList } from "./ConfusionsList";
import { AttemptsTimeline } from "./AttemptsTimeline";

export function FlagDetail() {
  const {
    collection,
    flag,
    progress,
    attempts,
    confusions,
    mnemonic,
    setMnemonic,
    saving,
    saveMnemonic,
    loading,
  } = useFlagDetail();

  if (loading) return <PageSkeleton rows={4} />;
  if (!flag) return <div className="text-surface-500">Flag not found</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-5">
        <div className="rounded-2xl bg-surface-800/30 p-2">
          <FlagDisplay code={flag.code} size="md" />
        </div>
        <div>
          <h1 className="font-display text-3xl italic">{flag.name}</h1>
          <div className="mt-1 text-sm font-medium text-surface-500">
            {flag.code.toUpperCase()} &middot; {groupName(collection, flag.group)}
          </div>
        </div>
      </div>

      <ProgressCard progress={progress} />

      <Card>
        <CardHeader>
          <CardTitle>Note</CardTitle>
        </CardHeader>
        <CardContent>
          <MnemonicTextarea
            value={mnemonic}
            onChange={setMnemonic}
            rows={3}
            label={false}
          />
          {mnemonic !== (progress?.mnemonic ?? "") && (
            <button
              onClick={saveMnemonic}
              disabled={saving}
              className="mt-3 rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-900/20 transition-all duration-200 hover:from-emerald-400 hover:to-emerald-500 disabled:opacity-50 cursor-pointer"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          )}
        </CardContent>
      </Card>

      <ConfusionsList confusions={confusions} />

      <AttemptsTimeline attempts={attempts} />
    </div>
  );
}
