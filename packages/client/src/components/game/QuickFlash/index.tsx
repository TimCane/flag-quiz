import { useEffect } from "react";
import { Check, X } from "lucide-react";
import { FlagDisplay } from "../FlagDisplay";
import { useActiveCollection } from "../../../lib/collection-context";

interface QuickFlashProps {
  flagCode: string;
  correct: boolean;
  onDone: () => void;
}

export function QuickFlash({ flagCode, correct, onDone }: QuickFlashProps) {
  const { flagByCode } = useActiveCollection();
  const flag = flagByCode(flagCode);

  useEffect(() => {
    const timer = setTimeout(onDone, 1000);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div className="flex flex-col items-center gap-5 animate-celebrate">
      <div className={`rounded-2xl p-3 ${correct ? "bg-emerald-500/10 ring-2 ring-emerald-500/30" : "bg-red-500/10 ring-2 ring-red-500/30"}`}>
        <FlagDisplay code={flagCode} size="md" />
      </div>
      <div
        className={`font-display text-4xl italic ${
          correct ? "text-emerald-400" : "text-red-400"
        }`}
      >
        {correct ? <Check className="inline h-8 w-8" /> : <X className="inline h-8 w-8" />} {flag?.name}
      </div>
    </div>
  );
}
