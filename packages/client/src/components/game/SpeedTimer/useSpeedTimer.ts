import { useState, useEffect, useRef } from "react";

interface UseSpeedTimerProps {
  timeoutMs: number;
  onTimeout: () => void;
  paused?: boolean;
}

export function useSpeedTimer({ timeoutMs, onTimeout, paused }: UseSpeedTimerProps) {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(performance.now());
  const frameRef = useRef<number>(0);
  const rawRef = useRef(0);
  const lastBucketRef = useRef(-1);

  useEffect(() => {
    startRef.current = performance.now();
    rawRef.current = 0;
    lastBucketRef.current = -1;
    setElapsed(0);

    function tick() {
      if (paused) return;
      const now = performance.now();
      const ms = now - startRef.current;
      rawRef.current = ms;

      if (ms >= timeoutMs) {
        setElapsed(ms);
        onTimeout();
        return;
      }

      const bucket = Math.floor(ms / 100);
      if (bucket !== lastBucketRef.current) {
        lastBucketRef.current = bucket;
        setElapsed(ms);
      }

      frameRef.current = requestAnimationFrame(tick);
    }

    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [timeoutMs, paused, onTimeout]);

  const progress = Math.min(elapsed / timeoutMs, 1);
  const remaining = Math.max(0, timeoutMs - elapsed);
  const seconds = (remaining / 1000).toFixed(1);

  // Color transitions: green -> yellow -> red
  const color =
    progress < 0.5
      ? "bg-green-500"
      : progress < 0.75
        ? "bg-yellow-500"
        : "bg-red-500";

  return {
    progress,
    seconds,
    color,
  };
}
