import { FlagDisplay } from "../FlagDisplay";
import { useActiveCollection } from "../../../lib/collection-context";

interface PickItemRoundProps {
  flagCode: string;
  options: string[];
  onAnswer: (guess: string) => void;
}

export function PickItemRound({ flagCode, options, onAnswer }: PickItemRoundProps) {
  const { flagByCode } = useActiveCollection();
  return (
    <div className="flex flex-col items-center gap-8 animate-fade-in">
      <div className="rounded-2xl bg-surface-800/30 p-4">
        <FlagDisplay code={flagCode} />
      </div>

      <div className="flex w-full max-w-sm flex-col gap-2.5">
        {options.map((code, i) => {
          const flag = flagByCode(code);
          return (
            <button
              key={code}
              onClick={() => onAnswer(code)}
              className="flex items-center gap-3 min-h-[52px] rounded-xl border border-surface-700/60 bg-surface-900/50 px-5 py-4 text-left text-lg font-medium text-surface-300 transition-all duration-200 hover:border-emerald-500/30 hover:bg-surface-800/50 hover:text-white hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-surface-800/80 font-mono text-xs text-surface-500">{i + 1}</span>
              {flag?.name ?? code}
            </button>
          );
        })}
      </div>
    </div>
  );
}
