import { useSpeedTimer } from "./useSpeedTimer";

interface SpeedTimerProps {
  timeoutMs: number;
  onTimeout: () => void;
  paused?: boolean;
}

export function SpeedTimer({ timeoutMs, onTimeout, paused }: SpeedTimerProps) {
  const { progress, seconds, color } = useSpeedTimer({ timeoutMs, onTimeout, paused });
  const isUrgent = progress > 0.75;

  return (
    <div className="w-full max-w-sm">
      <div className="mb-1.5 flex justify-between text-xs">
        <span className="font-medium uppercase tracking-wider text-surface-500">Speed mode</span>
        <span className={`font-bold tabular-nums ${isUrgent ? "text-red-400 urgency-pulse" : "text-surface-400"}`}>
          {seconds}s
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-800/80">
        <div
          className={`h-full rounded-full transition-all duration-100 ${color} ${isUrgent ? "urgency-pulse" : ""}`}
          style={{ width: `${(1 - progress) * 100}%` }}
        />
      </div>
    </div>
  );
}
