import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { AttemptRow } from "../../components/ui/attempt-row";
import { type AttemptRow as AttemptRowData } from "./useFlagDetail";

interface AttemptsTimelineProps {
  attempts: AttemptRowData[];
}

export function AttemptsTimeline({ attempts }: AttemptsTimelineProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Attempts
          <span className="ml-2 text-sm font-normal text-surface-500">({attempts.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {attempts.length === 0 ? (
          <div className="text-sm text-surface-500">No attempts yet</div>
        ) : (
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
                ts={a.ts}
                linkToFlag={false}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
