import { flagByCode } from "@flag-quiz/shared";
import { FlagDisplay } from "../FlagDisplay";
import { useQuickFlash } from "./useQuickFlash";

interface QuickFlashProps {
  flagCode: string;
  correct: boolean;
  onDone: () => void;
}

export function QuickFlash({ flagCode, correct, onDone }: QuickFlashProps) {
  useQuickFlash({ onDone });
  const flag = flagByCode.get(flagCode);

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
        {correct ? "\u2713" : "\u2717"} {flag?.name}
      </div>
    </div>
  );
}
