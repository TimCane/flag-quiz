import { Card, CardContent } from "../../components/ui/card";
import { modeLabels, EXIT_LABELS, formatDuration } from "../../lib/labels";
import { useActiveCollection } from "../../lib/collection-context";

interface SessionMetadataProps {
  mode: string;
  exitCondition: string;
  started: Date;
  duration: number | null;
}

export function SessionMetadata({ mode, exitCondition, started, duration }: SessionMetadataProps) {
  const { collection } = useActiveCollection();
  const labels = modeLabels(collection.itemLabel);
  return (
    <Card>
      <CardContent className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-4">
        <MetaItem label="Mode" value={labels[mode] ?? mode} />
        <MetaItem label="Exit Condition" value={EXIT_LABELS[exitCondition]} />
        <MetaItem
          label="Date"
          value={`${started.toLocaleDateString()} ${started.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
        />
        <MetaItem label="Duration" value={duration !== null ? formatDuration(duration) : "In progress"} />
      </CardContent>
    </Card>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wider text-surface-500">{label}</div>
      <div className="mt-0.5 font-bold text-surface-300">{value}</div>
    </div>
  );
}
