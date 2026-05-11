import { Link } from "react-router";
import { modeLabels, EXIT_LABELS, formatDuration } from "../../lib/labels";
import { useActiveCollection } from "../../lib/collection-context";

interface SessionRowProps {
  id: string;
  mode: string;
  exitCondition: string;
  started: string;
  ended: string | null;
  accuracy: number;
  attemptCount: number;
}

export function SessionRow({ id, mode, exitCondition, started, ended, accuracy, attemptCount }: SessionRowProps) {
  const { collection } = useActiveCollection();
  const labels = modeLabels(collection.itemLabel);
  const startedDate = new Date(started);
  const endedDate = ended ? new Date(ended) : null;
  const duration = endedDate
    ? Math.round((endedDate.getTime() - startedDate.getTime()) / 1000)
    : null;

  return (
    <Link
      to={`/${collection.id}/sessions/${id}`}
      className="flex items-center justify-between rounded-xl border border-surface-800/80 bg-surface-900/50 p-4 transition-all duration-200 hover:border-surface-700 hover:bg-surface-800/50 glow-border"
    >
      <div>
        <div className="font-display text-base text-surface-300">
          {labels[mode] ?? mode}
          <span className="ml-2 text-sm font-normal text-surface-500">
            {EXIT_LABELS[exitCondition] ?? exitCondition}
          </span>
        </div>
        <div className="mt-0.5 text-sm text-surface-500">
          {startedDate.toLocaleDateString()}{" "}
          {startedDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          {duration !== null && ` · ${formatDuration(duration)}`}
        </div>
      </div>
      <div className="text-right">
        <div className={`font-mono text-lg font-bold ${accuracy >= 80 ? "text-gold-400" : accuracy >= 50 ? "text-emerald-400" : "text-red-400"}`}>{accuracy}%</div>
        <div className="text-sm text-surface-500">
          {attemptCount} attempt{attemptCount !== 1 ? "s" : ""}
        </div>
      </div>
    </Link>
  );
}
