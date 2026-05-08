import { type ActiveSession } from "../../lib/active-session";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { MODE_LABELS } from "../../lib/labels";

interface ActiveSessionCardProps {
  session: ActiveSession;
  onResume: () => void;
  onEnd: () => void;
}

export function ActiveSessionCard({ session, onResume, onEnd }: ActiveSessionCardProps) {
  return (
    <Card className="border-gold-400/30 bg-gradient-to-b from-gold-400/5 to-transparent animate-pulse-subtle">
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <div className="font-bold text-gold-300">Session in progress</div>
          <div className="mt-0.5 text-sm text-surface-400">
            {MODE_LABELS[session.mode]} &middot; {session.attemptCount} attempts &middot; {session.correctCount} correct
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={onResume} size="default">Resume</Button>
          <Button variant="ghost" onClick={onEnd} className="text-surface-500">End</Button>
        </div>
      </CardContent>
    </Card>
  );
}
