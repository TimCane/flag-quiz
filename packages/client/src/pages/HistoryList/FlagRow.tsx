import { memo } from "react";
import { Link } from "react-router";
import { type Flag } from "@flag-quiz/shared";
import { FlagDisplay } from "../../components/game/FlagDisplay";
import { Sparkline } from "../../components/ui/sparkline";
import { STATE_LABELS, STATE_COLORS, groupName } from "../../lib/labels";
import { useActiveCollection } from "../../lib/collection-context";

interface FlagRowProps {
  flag: Flag;
  state: number;
  mnemonic?: string;
  sparklineData?: number[];
  accuracy?: number;
  attemptCount?: number;
}

export const FlagRow = memo(function FlagRow({ flag, state, mnemonic, sparklineData, accuracy, attemptCount }: FlagRowProps) {
  const { collection } = useActiveCollection();
  return (
    <Link
      to={`/${collection.id}/history/${flag.code}`}
      className="flex flex-col gap-2 rounded-xl border border-surface-800/80 bg-surface-900/50 p-3.5 transition-all duration-200 hover:border-surface-700 hover:bg-surface-800/50 glow-border"
    >
      <div className="flex items-center gap-3">
        <FlagDisplay code={flag.code} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-surface-300">{flag.name}</div>
          <div className="text-xs text-surface-500">{groupName(collection, flag.group)}</div>
        </div>
        <div className="text-right text-sm">
          <div className={`font-semibold ${STATE_COLORS[state]}`}>
            {STATE_LABELS[state]}
          </div>
          {attemptCount !== undefined && attemptCount > 0 ? (
            <div className="text-xs text-surface-500">
              <span className={`font-mono ${accuracy !== undefined && accuracy >= 80 ? "text-gold-400" : ""}`}>{accuracy}%</span> &middot; {attemptCount}
            </div>
          ) : (
            <div className="text-xs text-surface-600">New</div>
          )}
        </div>
      </div>

      {(sparklineData?.length ?? 0) > 1 || mnemonic ? (
        <div className="flex items-center gap-3 pl-1">
          {sparklineData && sparklineData.length > 1 && (
            <Sparkline data={sparklineData} width={80} height={24} />
          )}
          {mnemonic && (
            <div className="min-w-0 flex-1 truncate text-xs italic text-surface-600">
              {mnemonic}
            </div>
          )}
        </div>
      ) : null}
    </Link>
  );
});
