import { FlagDisplay } from "../../components/game/FlagDisplay";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { useActiveCollection } from "../../lib/collection-context";

interface MergedPair {
  flagA: string;
  flagB: string;
  count: number;
}

export function ConfusedPairsTable({ pairs }: { pairs: MergedPair[] }) {
  const { flagByCode } = useActiveCollection();
  return (
    <Card>
      <CardHeader><CardTitle>Most Confused Pairs</CardTitle></CardHeader>
      <CardContent>
        {pairs.length === 0 ? (
          <div className="text-sm text-surface-500">No wrong answers yet</div>
        ) : (
          <div className="space-y-2.5">
            {pairs.map((p) => {
              const fa = flagByCode(p.flagA);
              const fb = flagByCode(p.flagB);
              return (
                <div
                  key={`${p.flagA}-${p.flagB}`}
                  className="rounded-xl border border-surface-800/80 bg-surface-800/20 p-3.5 transition-all duration-200"
                >
                  {/* Flags side by side */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FlagDisplay code={p.flagA} size="sm" />
                      <FlagDisplay code={p.flagB} size="sm" />
                    </div>
                    <span className="rounded-lg bg-amber-500/10 px-2.5 py-1 text-sm font-bold text-amber-400">
                      {p.count}x
                    </span>
                  </div>
                  {/* Names below */}
                  <div className="mt-2 flex items-center gap-2 text-sm">
                    <span className="font-medium text-surface-300">{fa?.name}</span>
                    <span className="text-surface-600">/</span>
                    <span className="text-surface-400">{fb?.name}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
