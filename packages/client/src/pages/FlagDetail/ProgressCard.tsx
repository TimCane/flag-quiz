import { type FlagProgress } from "@flag-quiz/shared";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { STATE_LABELS } from "../../lib/labels";

interface ProgressCardProps {
  progress: FlagProgress | null;
}

export function ProgressCard({ progress }: ProgressCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Progress</CardTitle>
      </CardHeader>
      <CardContent>
        {progress ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <ProgressItem label="State" value={STATE_LABELS[progress.state]} />
            <ProgressItem label="Stability" value={progress.stability?.toFixed(2) ?? "\u2014"} />
            <ProgressItem label="Difficulty" value={progress.difficulty?.toFixed(2) ?? "\u2014"} />
            <ProgressItem
              label="Next due"
              value={progress.due ? new Date(progress.due).toLocaleDateString() : "\u2014"}
            />
          </div>
        ) : (
          <div className="text-sm text-surface-500">Not yet reviewed</div>
        )}
      </CardContent>
    </Card>
  );
}

function ProgressItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wider text-surface-500">{label}</div>
      <div className="mt-0.5 font-mono text-lg font-medium text-surface-300">{value}</div>
    </div>
  );
}
