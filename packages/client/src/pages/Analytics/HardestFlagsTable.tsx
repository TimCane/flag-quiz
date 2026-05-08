import { Link } from "react-router";
import { flagByCode } from "@flag-quiz/shared";
import { FlagDisplay } from "../../components/game/FlagDisplay";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import type { HardestFlag } from "./useAnalytics";

export function HardestFlagsTable({ flags }: { flags: HardestFlag[] }) {
  if (flags.length === 0) return null;

  return (
    <Card>
      <CardHeader><CardTitle>Hardest Flags</CardTitle></CardHeader>
      <CardContent>
        <div className="space-y-2">
          {flags.map((h, i) => {
            const f = flagByCode.get(h.flag);
            return (
              <Link
                key={h.flag}
                to={`/history/${h.flag}`}
                className="flex items-center gap-3 rounded-xl border border-surface-800/80 bg-surface-800/20 px-4 py-3.5 transition-all duration-200 hover:border-surface-700 hover:bg-surface-800/40 glow-border"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface-800/80 text-xs font-bold text-surface-400">
                  {i + 1}
                </span>
                <FlagDisplay code={h.flag} size="sm" />
                <div className="flex-1 text-sm font-medium text-surface-300">{f?.name}</div>
                <div className="text-right">
                  <span className="text-sm font-bold text-red-400">{h.accuracy}%</span>
                  <div className="text-xs text-surface-500">{h.attempt_count} attempts</div>
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
