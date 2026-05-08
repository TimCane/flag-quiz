import { useState } from "react";

interface UseQuickWrongScreenProps {
  initialMnemonic: string;
  onNext: (mnemonic: string) => void;
}

export function useQuickWrongScreen({ initialMnemonic, onNext }: UseQuickWrongScreenProps) {
  const [mnemonic, setMnemonic] = useState(initialMnemonic);

  const handleNext = () => onNext(mnemonic);

  return {
    mnemonic,
    setMnemonic,
    handleNext,
  };
}
