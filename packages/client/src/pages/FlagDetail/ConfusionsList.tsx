import { FlagDisplay } from "../../components/game/FlagDisplay";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { useActiveCollection } from "../../lib/collection-context";
import { type ConfusionRow } from "./useFlagDetail";

interface ConfusionsListProps {
  confusions: ConfusionRow[];
}

export function ConfusionsList({ confusions }: ConfusionsListProps) {
  const { flagByCode } = useActiveCollection();
  if (confusions.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Confused with</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2.5">
          {confusions.map((c) => {
            const confusedFlag = flagByCode(c.guess);
            return (
              <div
                key={c.guess}
                className="flex items-center gap-3 rounded-xl bg-surface-800/30 p-3 transition-all duration-200"
              >
                <FlagDisplay code={c.guess} size="sm" />
                <span className="flex-1 text-sm font-medium text-surface-300">
                  {confusedFlag?.name ?? c.guess}
                </span>
                <span className="rounded-lg bg-surface-800/80 px-2.5 py-1 font-mono text-sm font-medium text-gold-400">
                  {c.count}x
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
