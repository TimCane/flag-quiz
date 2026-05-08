export const RATING_LABELS: Record<number, string> = {
  1: "Again",
  2: "Hard",
  3: "Good",
  4: "Easy",
};

export const RATING_COLORS: Record<number, string> = {
  1: "bg-gradient-to-b from-red-500 to-red-700 shadow-red-900/30 hover:from-red-400 hover:to-red-600",
  2: "bg-gradient-to-b from-amber-500 to-amber-700 shadow-amber-900/30 hover:from-amber-400 hover:to-amber-600",
  3: "bg-gradient-to-b from-emerald-500 to-emerald-700 shadow-emerald-900/30 hover:from-emerald-400 hover:to-emerald-600",
  4: "bg-gradient-to-b from-sky-500 to-sky-700 shadow-sky-900/30 hover:from-sky-400 hover:to-sky-600",
};

export const MODE_LABELS: Record<string, string> = {
  classic: "Classic",
  "pick-the-flag": "Pick the Flag",
  "pick-the-country": "Pick the Country",
};

export const MODE_DESCRIPTIONS: Record<string, string> = {
  classic: "See a flag, type the country name",
  "pick-the-flag": "See a country name, pick the correct flag",
  "pick-the-country": "See a flag, pick the correct country name",
};

export const EXIT_LABELS: Record<string, string> = {
  normal: "Normal",
  streak: "Streak",
  speed: "Speed",
};

export const EXIT_DESCRIPTIONS: Record<string, string> = {
  normal: "End manually",
  streak: "Ends on wrong answer",
  speed: "Ends if too slow",
};

export const STATE_LABELS: Record<number, string> = {
  0: "New",
  1: "Learning",
  2: "Review",
  3: "Relearning",
};

export const STATE_COLORS: Record<number, string> = {
  0: "text-surface-500",
  1: "text-yellow-400",
  2: "text-gold-400",
  3: "text-orange-400",
};

export const CONTINENT_LABELS: Record<string, string> = {
  africa: "Africa",
  asia: "Asia",
  europe: "Europe",
  "north-america": "N. America",
  "south-america": "S. America",
  oceania: "Oceania",
};

export const CONTINENT_LABELS_FULL: Record<string, string> = {
  africa: "Africa",
  asia: "Asia",
  europe: "Europe",
  "north-america": "North America",
  "south-america": "South America",
  oceania: "Oceania",
};

export const PIE_COLORS = ["#5a6178", "#eab308", "#c9a84c", "#f97316"];

export const CONFIDENCE_COLORS: Record<number, string> = {
  1: "#ef4444",
  2: "#f97316",
  3: "#22c55e",
  4: "#3b82f6",
};

export const CHART_TOOLTIP_STYLE = {
  backgroundColor: "#121620",
  border: "1px solid rgba(42, 47, 66, 0.8)",
  borderRadius: 12,
};

export function formatReactionTime(ms: number): string {
  return ms > 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return sec > 0 ? `${min}m ${sec}s` : `${min}m`;
}
