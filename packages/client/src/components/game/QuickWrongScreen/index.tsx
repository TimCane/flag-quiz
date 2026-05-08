import { flagByCode } from "@flag-quiz/shared";
import { FlagDisplay } from "../FlagDisplay";
import { Button } from "../../ui/button";
import { MnemonicTextarea } from "../../ui/mnemonic-textarea";
import { useQuickWrongScreen } from "./useQuickWrongScreen";

interface QuickWrongScreenProps {
  flagCode: string;
  guess: string | null;
  forgotten: boolean;
  mnemonic: string;
  onNext: (mnemonic: string) => void;
}

export function QuickWrongScreen({
  flagCode,
  guess,
  forgotten,
  mnemonic: initialMnemonic,
  onNext,
}: QuickWrongScreenProps) {
  const { mnemonic, setMnemonic, handleNext } = useQuickWrongScreen({
    initialMnemonic,
    onNext,
  });
  const flag = flagByCode.get(flagCode);
  const guessFlag = guess ? flagByCode.get(guess) : null;

  return (
    <div className="flex flex-col items-center gap-6 animate-fade-in">
      <div className="rounded-2xl bg-red-500/5 p-3 ring-2 ring-red-500/20">
        <FlagDisplay code={flagCode} size="md" />
      </div>

      <div className="text-center">
        <div className="font-display text-4xl italic text-red-400">
          {forgotten ? "Skipped" : "Wrong"}
        </div>
        <div className="mt-1.5 font-display text-2xl text-white">{flag?.name}</div>
        {!forgotten && guessFlag && (
          <div className="mt-1 text-sm text-surface-500">
            You guessed: {guessFlag.name}
          </div>
        )}
      </div>

      <div className="w-full max-w-sm">
        <MnemonicTextarea
          value={mnemonic}
          onChange={setMnemonic}
          rows={2}
          autoFocus
        />
      </div>

      <Button
        onClick={handleNext}
        size="xl"
        className="w-full max-w-sm"
      >
        Next
      </Button>

      <div className="text-xs font-medium text-surface-600">Rated as Again</div>
    </div>
  );
}
