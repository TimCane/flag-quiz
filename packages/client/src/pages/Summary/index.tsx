import { Link } from "react-router";
import { useSummary } from "./useSummary";
import { Button } from "../../components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { StatCard } from "../../components/ui/stat-card";
import { AttemptRow } from "../../components/ui/attempt-row";
import { Spinner } from "../../components/ui/spinner";
import { formatReactionTime } from "../../lib/labels";

export function Summary() {
  const { session, attempts, loading, accuracy, avgReaction } = useSummary();

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }
  if (!session) return <div className="text-center text-surface-500">Session not found</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl italic">Session Summary</h1>
        <Link to="/">
          <Button variant="outline">New Session</Button>
        </Link>
      </div>

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
