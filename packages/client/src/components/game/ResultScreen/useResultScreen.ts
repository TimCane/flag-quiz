import { useState } from "react";

interface UseResultScreenProps {
  initialMnemonic: string;
}

export function useResultScreen({ initialMnemonic }: UseResultScreenProps) {
  const [mnemonic, setMnemonic] = useState(initialMnemonic);

  return {
    mnemonic,
    setMnemonic,
  };
}
