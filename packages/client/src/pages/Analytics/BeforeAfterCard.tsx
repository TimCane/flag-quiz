import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import type { Comparison } from "./useAnalytics";

interface Props {
  before: Comparison;
  after: Comparison;
}

export function BeforeAfterCard({ before, after }: Props) {
  const improved = after.accuracy > before.accuracy;

  return (
    <Card>
      <CardHeader><CardTitle>Before / After</CardTitle></CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-surface-800/80 bg-surface-800/20 p-5 text-center">
            <div className="text-xs font-semibold uppercase tracking-wider text-surface-500">First week</div>
            <div className="mt-2 text-4xl font-extrabold tracking-tight text-surface-400">{before.accuracy}%</div>
            <div className="mt-1 text-xs font-medium text-surface-600">{before.attempts} attempts</div>
          </div>
          <div className="rounded-xl border border-surface-800/80 bg-surface-800/20 p-5 text-center">
            <div className="text-xs font-semibold uppercase tracking-wider text-surface-500">Latest week</div>
            <div className="mt-2 text-4xl font-extrabold tracking-tight text-emerald-400">{after.accuracy}%</div>
            <div className="mt-1 text-xs font-medium text-surface-600">{after.attempts} attempts</div>
          </div>
        </div>
        {improved && (
          <div className="mt-4 text-center">
            <span className="inline-block rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 text-sm font-bold text-emerald-400">
              +{(after.accuracy - before.accuracy).toFixed(1)}% improvement
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
