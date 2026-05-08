import { Link } from "react-router";
import { flagByCode } from "@flag-quiz/shared";
import { FlagDisplay } from "../../game/FlagDisplay";
import { RATING_LABELS, formatReactionTime } from "../../../lib/labels";

interface AttemptRowProps {
  id: string;
  flag: string;
  guess: string | null;
  correct: boolean;
  forgotten?: boolean;
  confidence: number;
  reaction_time_ms: number;
  ts?: string;
  linkToFlag?: boolean;
}

export function AttemptRow({
  flag: flagCode,
  guess,
  correct,
  forgotten,
  confidence,
  reaction_time_ms,
  ts,
  linkToFlag = true,
}: AttemptRowProps) {
  const flag = flagByCode.get(flagCode);
  const guessFlag = guess ? flagByCode.get(guess) : null;

  const content = (
    <>
      <FlagDisplay code={flagCode} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="font-semibold text-surface-300">{flag?.name}</div>
        {!correct && !forgotten && guessFlag && (
          <div className="text-xs text-surface-500">Guessed: {guessFlag.name}</div>
        )}
        {forgotten && <div className="text-xs text-surface-500">Skipped</div>}
      </div>
      <div className="text-right text-sm">
        <span
          className={
            correct
              ? "font-semibold text-emerald-400"
              : "font-semibold text-red-400"
          }
        >
          {correct ? "Correct" : "Wrong"}
        </span>
        <div className="text-xs text-surface-500">
          {RATING_LABELS[confidence]} &middot; <span className="font-mono">{formatReactionTime(reaction_time_ms)}</span>
        </div>
        {ts && (
          <div className="text-xs text-surface-600">
            {new Date(ts).toLocaleDateString()}
          </div>
        )}
      </div>
    </>
  );

  const className =
    "flex items-center gap-3 rounded-xl border border-surface-700/60 bg-surface-900/50 p-3.5 transition-all duration-200 hover:border-surface-600 hover:bg-surface-800/50 glow-border";

  if (linkToFlag) {
    return (
      <Link to={`/history/${flagCode}`} className={className}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}
