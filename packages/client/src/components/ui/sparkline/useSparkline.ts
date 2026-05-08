interface UseSparklineResult {
  pathD: string;
  color: string;
}

export function useSparkline(data: number[], width: number, height: number): UseSparklineResult | null {
  if (data.length === 0) return null;

  // Compute rolling accuracy over a window
  const windowSize = Math.max(1, Math.min(3, Math.floor(data.length / 3)));
  const points: number[] = [];
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - windowSize + 1);
    const slice = data.slice(start, i + 1);
    const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
    points.push(avg);
  }

  // Build SVG path
  const xStep = points.length > 1 ? width / (points.length - 1) : width;
  const padding = 2;
  const innerHeight = height - padding * 2;

  const pathParts = points.map((val, i) => {
    const x = i * xStep;
    const y = padding + (1 - val) * innerHeight;
    return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
  });

  const pathD = pathParts.join(" ");

  // Color based on trend (last point)
  const lastVal = points[points.length - 1];
  const color = lastVal > 0.7 ? "#22c55e" : lastVal > 0.4 ? "#eab308" : "#ef4444";

  return { pathD, color };
}
