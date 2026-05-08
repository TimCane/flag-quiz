import { useEffect } from "react";

interface UseQuickFlashProps {
  onDone: () => void;
}

export function useQuickFlash({ onDone }: UseQuickFlashProps) {
  useEffect(() => {
    const timer = setTimeout(onDone, 1000);
    return () => clearTimeout(timer);
  }, [onDone]);
}
