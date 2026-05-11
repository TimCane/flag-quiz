import { useState } from "react";
import { FlagDisplay } from "../FlagDisplay";
import { ItemSelect } from "../ItemSelect";
import { Button } from "../../ui/button";

interface ClassicRoundProps {
  flagCode: string;
  onAnswer: (guess: string | null, forgotten: boolean) => void;
}

export function ClassicRound({ flagCode, onAnswer }: ClassicRoundProps) {
  const [confirmingGiveUp, setConfirmingGiveUp] = useState(false);

  return (
    <div className="flex flex-col items-center gap-8 animate-fade-in">
      <div className="rounded-2xl bg-surface-800/30 p-4">
        <FlagDisplay code={flagCode} />
      </div>

      <ItemSelect onSelect={(code) => onAnswer(code, false)} />

      {!confirmingGiveUp ? (
        <Button
          variant="ghost"
          size="default"
          onClick={() => setConfirmingGiveUp(true)}
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
            onClick={() => onAnswer(null, true)}
          >
            Yes, skip
          </Button>
          <Button
            variant="ghost"
            size="default"
            onClick={() => setConfirmingGiveUp(false)}
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}
