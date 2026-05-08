import { FlagDisplay } from "../FlagDisplay";
import { CountrySelect } from "../CountrySelect";
import { Button } from "../../ui/button";
import { useClassicRound } from "./useClassicRound";

interface ClassicRoundProps {
  flagCode: string;
  onAnswer: (guess: string | null, forgotten: boolean) => void;
}

export function ClassicRound({ flagCode, onAnswer }: ClassicRoundProps) {
  const {
    confirmingGiveUp,
    handleSelect,
    handleGiveUpClick,
    handleConfirmGiveUp,
    handleCancelGiveUp,
  } = useClassicRound({ onAnswer });

  return (
    <div className="flex flex-col items-center gap-8 animate-fade-in">
      <div className="rounded-2xl bg-surface-800/30 p-4">
        <FlagDisplay code={flagCode} />
      </div>

      <CountrySelect onSelect={handleSelect} />

      {!confirmingGiveUp ? (
        <Button
          variant="ghost"
          size="default"
          onClick={handleGiveUpClick}
          className="text-surface-600 hover:text-surface-400"
        >
          I don't know
        </Button>
      ) : (
        <div className="flex items-center gap-3 animate-fade-in">
          <span className="text-sm text-surface-400">Are you sure?</span>
          <Button
            variant="destructive"
            size="default"
            onClick={handleConfirmGiveUp}
          >
            Yes, skip
          </Button>
          <Button
            variant="ghost"
            size="default"
            onClick={handleCancelGiveUp}
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}
