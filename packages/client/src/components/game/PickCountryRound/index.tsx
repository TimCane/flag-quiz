import { FlagDisplay } from "../FlagDisplay";
import { flagByCode } from "@flag-quiz/shared";

interface PickCountryRoundProps {
  flagCode: string;
  options: string[];
  onAnswer: (guess: string) => void;
}

export function PickCountryRound({ flagCode, options, onAnswer }: PickCountryRoundProps) {
  return (
    <div className="flex flex-col items-center gap-8 animate-fade-in">
      <div className="rounded-2xl bg-surface-800/30 p-4">
        <FlagDisplay code={flagCode} />
      </div>

      <div className="flex w-full max-w-sm flex-col gap-2.5">
        {options.map((code) => {
          const flag = flagByCode.get(code);
          return (
            <button
              key={code}
              onClick={() => onAnswer(code)}
              className="min-h-[52px] rounded-xl border border-surface-700/60 bg-surface-900/50 px-5 py-4 text-left text-lg font-medium text-surface-300 transition-all duration-200 hover:border-emerald-500/30 hover:bg-surface-800/50 hover:text-white hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer"
            >
              {flag?.name ?? code}
            </button>
          );
        })}
      </div>
    </div>
  );
}
