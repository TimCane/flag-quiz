import { FlagDisplay } from "../FlagDisplay";

interface PickFlagRoundProps {
  itemName: string;
  options: string[];
  onAnswer: (guess: string) => void;
}

export function PickFlagRound({ itemName, options, onAnswer }: PickFlagRoundProps) {
  return (
    <div className="flex flex-col items-center gap-8 animate-fade-in">
      <div className="text-center">
        <div className="font-display text-4xl text-white">{itemName}</div>
        <div className="mt-1 text-sm text-surface-500">Tap the correct flag</div>
      </div>

      <div className={`grid gap-4 ${options.length <= 2 ? "grid-cols-2" : options.length === 3 ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-3"}`}>
        {options.map((code) => (
          <button
            key={code}
            onClick={() => onAnswer(code)}
            className="group flex items-center justify-center rounded-2xl border border-surface-700/60 bg-surface-900/50 p-4 transition-all duration-200 hover:border-emerald-500/30 hover:bg-surface-800/50 hover:shadow-lg hover:shadow-emerald-500/5 hover:-translate-y-0.5 active:scale-95 cursor-pointer"
          >
            <FlagDisplay code={code} size="md" />
          </button>
        ))}
      </div>
    </div>
  );
}
