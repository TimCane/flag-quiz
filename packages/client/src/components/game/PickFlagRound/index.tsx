import { FlagDisplay } from "../FlagDisplay";

interface PickFlagRoundProps {
  countryName: string;
  options: string[];
  onAnswer: (guess: string) => void;
}

export function PickFlagRound({ countryName, options, onAnswer }: PickFlagRoundProps) {
  return (
    <div className="flex flex-col items-center gap-8 animate-fade-in">
      <div className="text-center">
        <div className="font-display text-4xl text-white">{countryName}</div>
        <div className="mt-1 text-sm text-surface-500">Tap the correct flag</div>
      </div>

      <div className="grid grid-cols-2 gap-4">
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
