import { useSessionDetail } from "./useSessionDetail";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { PageSkeleton } from "../../components/ui/skeleton";
import { StatCard } from "../../components/ui/stat-card";
import { AttemptRow } from "../../components/ui/attempt-row";
import { SessionMetadata } from "./SessionMetadata";
import { formatReactionTime } from "../../lib/labels";

export function SessionDetail() {
  const { session, attempts, loading, started, duration, accuracy, avgReaction } = useSessionDetail();

  if (loading) return <PageSkeleton rows={4} />;
  if (!session) return <div className="text-surface-500">Session not found</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="font-display text-3xl italic">Session Detail</h1>

      <SessionMetadata
        mode={session.mode}
        exitCondition={session.exit_condition}
        started={started!}
        duration={duration}
      />

      <div className="grid grid-cols-3 gap-2.5 sm:gap-3 stagger-in">
        <StatCard value={`${accuracy}%`} label="Accuracy" />
        <StatCard value={attempts.length} label="Attempts" />
        <StatCard value={formatReactionTime(avgReaction)} label="Avg Reaction" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Attempts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {attempts.map((a) => (
              <AttemptRow
                key={a.id}
                id={a.id}
                flag={a.flag}
                guess={a.guess}
                correct={a.correct}
                forgotten={a.forgotten}
                confidence={a.confidence}
                reaction_time_ms={a.reaction_time_ms}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
