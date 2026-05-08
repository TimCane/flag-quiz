import { useSessionsList } from "./useSessionsList";
import { PageSkeleton } from "../../components/ui/skeleton";
import { NoSessionsEmpty } from "../../components/ui/empty-state";
import { SessionRow } from "./SessionRow";

export function SessionsList() {
  const { sessions, loading, total, offset, setOffset, limit } = useSessionsList();

  if (loading && sessions.length === 0) {
    return <PageSkeleton rows={5} />;
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <h1 className="font-display text-3xl italic">Sessions</h1>

      {sessions.length === 0 ? (
        <NoSessionsEmpty />
      ) : (
        <div className="space-y-2">
          {sessions.map((s) => (
            <SessionRow
              key={s.id}
              id={s.id}
              mode={s.mode}
              exitCondition={s.exit_condition}
              started={s.started}
              ended={s.ended}
              accuracy={s.accuracy}
              attemptCount={s.attempt_count}
            />
          ))}
        </div>
      )}

      {total > limit && (
        <div className="flex items-center justify-center gap-4 pt-2">
          <button
            onClick={() => setOffset(Math.max(0, offset - limit))}
            disabled={offset === 0}
            className="min-h-[44px] rounded-xl px-5 py-2.5 text-sm font-medium text-surface-400 transition-all duration-200 active:bg-surface-800 hover:text-white hover:bg-surface-800/50 disabled:opacity-30 cursor-pointer"
          >
            Previous
          </button>
          <span className="text-sm font-medium text-surface-500">
            {offset + 1}--{Math.min(offset + limit, total)} of {total}
          </span>
          <button
            onClick={() => setOffset(offset + limit)}
            disabled={offset + limit >= total}
            className="min-h-[44px] rounded-xl px-5 py-2.5 text-sm font-medium text-surface-400 transition-all duration-200 active:bg-surface-800 hover:text-white hover:bg-surface-800/50 disabled:opacity-30 cursor-pointer"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
