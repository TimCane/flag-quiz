import { useSparkline } from "./useSparkline";

interface SparklineProps {
  data: number[]; // array of 0 (wrong) or 1 (correct)
  width?: number;
  height?: number;
}

export function Sparkline({ data, width = 60, height = 20 }: SparklineProps) {
  const result = useSparkline(data, width, height);
  if (!result) return null;

  const { pathD, color } = result;

  return (
    <svg width={width} height={height} className="flex-shrink-0 drop-shadow-sm">
      <defs>
        <linearGradient id={`sparkline-${color}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={color} stopOpacity={0.4} />
          <stop offset="100%" stopColor={color} stopOpacity={1} />
        </linearGradient>
      </defs>
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
