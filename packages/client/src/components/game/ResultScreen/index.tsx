import { flagByCode, type SchedulingResult, type Rating } from "@flag-quiz/shared";
import { FlagDisplay } from "../FlagDisplay";
import { useResultScreen } from "./useResultScreen";
import { MnemonicTextarea } from "../../ui/mnemonic-textarea";
import { RATING_LABELS, RATING_COLORS } from "../../../lib/labels";

interface ResultScreenProps {
  flagCode: string;
  correct: boolean;
  guess: string | null;
  forgotten: boolean;
  mnemonic: string;
  schedulingChoices: SchedulingResult[];
  onRate: (rating: Rating, mnemonic: string) => void;
}

export function ResultScreen({
  flagCode,
  correct,
  guess,
  forgotten,
  mnemonic: initialMnemonic,
  schedulingChoices,
  onRate,
}: ResultScreenProps) {
  const { mnemonic, setMnemonic } = useResultScreen({ initialMnemonic });
  const flag = flagByCode.get(flagCode);
  const guessFlag = guess ? flagByCode.get(guess) : null;

  return (
    <div className="flex flex-col items-center animate-celebrate">
      {/* Flag with emotional halo */}
      <div className={`rounded-2xl bg-surface-800/30 p-4 ${correct ? "halo-correct" : "halo-wrong"}`}>
        <FlagDisplay code={flagCode} size="lg" />
      </div>

      {/* Verdict */}
      <div className="mt-5 text-center">
        <div
          className={`font-display text-5xl italic sm:text-6xl ${
            correct ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {correct ? "Correct!" : forgotten ? "Skipped" : "Wrong"}
        </div>
        <div className="mt-2 font-display text-2xl text-white">{flag?.name}</div>
        {!correct && !forgotten && guessFlag && (
          <div className="mt-1 text-sm text-surface-500">
            You guessed: {guessFlag.name}
          </div>
        )}
      </div>

      {/* Mnemonic */}
      <div className="mt-6 w-full max-w-sm">
        <MnemonicTextarea
          value={mnemonic}
          onChange={setMnemonic}
          rows={2}
        />
      </div>

      {/* Rating buttons — prominent at bottom */}
      <div className="mt-6 grid w-full max-w-sm grid-cols-2 gap-2.5 sm:grid-cols-4">
        {schedulingChoices.map((choice) => (
          <button
            key={choice.rating}
            onClick={() => onRate(choice.rating, mnemonic)}
            className={`flex min-h-[68px] flex-col items-center justify-center rounded-xl px-3 py-4 text-white shadow-lg transition-all duration-200 hover:-translate-y-1 hover:shadow-xl active:scale-95 cursor-pointer ${RATING_COLORS[choice.rating]}`}
          >
            <span className="text-base font-bold">
              {RATING_LABELS[choice.rating]}
            </span>
            <span className="mt-0.5 font-mono text-xs font-medium opacity-70">{choice.intervalLabel}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
