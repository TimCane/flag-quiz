import { useState } from "react";

interface UseClassicRoundProps {
  onAnswer: (guess: string | null, forgotten: boolean) => void;
}

export function useClassicRound({ onAnswer }: UseClassicRoundProps) {
  const [confirmingGiveUp, setConfirmingGiveUp] = useState(false);

  const handleSelect = (code: string) => onAnswer(code, false);
  const handleGiveUpClick = () => setConfirmingGiveUp(true);
  const handleConfirmGiveUp = () => onAnswer(null, true);
  const handleCancelGiveUp = () => setConfirmingGiveUp(false);

  return {
    confirmingGiveUp,
    handleSelect,
    handleGiveUpClick,
    handleConfirmGiveUp,
    handleCancelGiveUp,
  };
}
