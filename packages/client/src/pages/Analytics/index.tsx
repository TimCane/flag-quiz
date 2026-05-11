import { lazy, Suspense } from "react";
import { useAnalytics } from "./useAnalytics";
import { Button } from "../../components/ui/button";
import { PageSkeleton, CardSkeleton } from "../../components/ui/skeleton";
import { NoAnalyticsEmpty } from "../../components/ui/empty-state";
import { useActiveCollection } from "../../lib/collection-context";

const ProgressChart = lazy(() => import("./ProgressChart").then((m) => ({ default: m.ProgressChart })));
const GroupAccuracyChart = lazy(() => import("./ContinentChart").then((m) => ({ default: m.GroupAccuracyChart })));
const ConfusedPairsTable = lazy(() => import("./ConfusedPairsTable").then((m) => ({ default: m.ConfusedPairsTable })));
const ConfidenceChart = lazy(() => import("./ConfidenceChart").then((m) => ({ default: m.ConfidenceChart })));
const Heatmap = lazy(() => import("./Heatmap").then((m) => ({ default: m.Heatmap })));
const FsrsBreakdownChart = lazy(() => import("./FsrsBreakdownChart").then((m) => ({ default: m.FsrsBreakdownChart })));
const BeforeAfterCard = lazy(() => import("./BeforeAfterCard").then((m) => ({ default: m.BeforeAfterCard })));
const HardestFlagsTable = lazy(() => import("./HardestFlagsTable").then((m) => ({ default: m.HardestFlagsTable })));
const MnemonicGallery = lazy(() => import("./MnemonicGallery").then((m) => ({ default: m.MnemonicGallery })));

function ChartFallback() {
  return <CardSkeleton />;
}

export function Analytics() {
  const { collection } = useActiveCollection();
  const {
    progress,
    groupData,
    groupLabel,
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
          <a href={`/api/${collection.id}/export/json`} target="_blank" className="flex-1 sm:flex-none">
            <Button variant="outline" size="default" className="w-full sm:w-auto">Export JSON</Button>
          </a>
          <a href={`/api/${collection.id}/export/csv`} target="_blank" className="flex-1 sm:flex-none">
            <Button variant="outline" size="default" className="w-full sm:w-auto">Export CSV</Button>
          </a>
        </div>
      </div>

      {!hasData && <NoAnalyticsEmpty />}

      {hasData && (
        <Suspense fallback={<ChartFallback />}>
          <div className="stagger-in space-y-6">
            <ProgressChart data={progress} />
            <div className="grid gap-6 sm:grid-cols-2">
              <GroupAccuracyChart data={groupData} label={groupLabel} />
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
        </Suspense>
      )}
    </div>
  );
}
