import { useAnalytics } from "./useAnalytics";
import { Button } from "../../components/ui/button";
import { PageSkeleton } from "../../components/ui/skeleton";
import { NoAnalyticsEmpty } from "../../components/ui/empty-state";
import { ProgressChart } from "./ProgressChart";
import { ContinentChart } from "./ContinentChart";
import { ConfusedPairsTable } from "./ConfusedPairsTable";
import { ConfidenceChart } from "./ConfidenceChart";
import { Heatmap } from "./Heatmap";
import { FsrsBreakdownChart } from "./FsrsBreakdownChart";
import { BeforeAfterCard } from "./BeforeAfterCard";
import { HardestFlagsTable } from "./HardestFlagsTable";
import { MnemonicGallery } from "./MnemonicGallery";

export function Analytics() {
  const {
    progress,
    continentData,
    confidenceDist,
    activity,
    hardest,
    comparison,
    loading,
    stateBreakdown,
    mnemonics,
    mergedPairs,
    hasData,
  } = useAnalytics();

  if (loading) return <PageSkeleton rows={3} />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-3xl italic">Analytics</h1>
        <div className="flex gap-2">
          <a href="/api/export/json" target="_blank" className="flex-1 sm:flex-none">
            <Button variant="outline" size="default" className="w-full sm:w-auto">Export JSON</Button>
          </a>
          <a href="/api/export/csv" target="_blank" className="flex-1 sm:flex-none">
            <Button variant="outline" size="default" className="w-full sm:w-auto">Export CSV</Button>
          </a>
        </div>
      </div>

      {!hasData && <NoAnalyticsEmpty />}

      {hasData && (
        <div className="stagger-in space-y-6">
          <ProgressChart data={progress} />
          <div className="grid gap-6 sm:grid-cols-2">
            <ContinentChart data={continentData} />
            <ConfidenceChart data={confidenceDist} />
          </div>
          <ConfusedPairsTable pairs={mergedPairs} />
          <Heatmap data={activity} />
          <div className="grid gap-6 sm:grid-cols-2">
            <FsrsBreakdownChart data={stateBreakdown} />
            {comparison?.before && comparison?.after && comparison.before.attempts > 0 && comparison.after.attempts > 0 && (
              <BeforeAfterCard before={comparison.before} after={comparison.after} />
            )}
          </div>
          <HardestFlagsTable flags={hardest} />
          <MnemonicGallery mnemonics={mnemonics} />
        </div>
      )}
    </div>
  );
}
