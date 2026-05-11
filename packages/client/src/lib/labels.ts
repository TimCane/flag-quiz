import type { Collection } from "@flag-quiz/shared";

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

export function modeLabels(itemLabel: string): Record<string, string> {
  const cap = itemLabel.charAt(0).toUpperCase() + itemLabel.slice(1);
  return {
    classic: "Classic",
    "pick-the-flag": "Pick the Flag",
    "pick-the-item": `Pick the ${cap}`,
  };
}

export function modeDescriptions(itemLabel: string): Record<string, string> {
  return {
    classic: `See a flag, type the ${itemLabel} name`,
    "pick-the-flag": `See a ${itemLabel} name, pick the correct flag`,
    "pick-the-item": `See a flag, pick the correct ${itemLabel} name`,
  };
}

export const EXIT_LABELS: Record<string, string> = {
  normal: "Normal",
  streak: "Streak",
  speed: "Speed",
  due: "Due",
};

export const EXIT_DESCRIPTIONS: Record<string, string> = {
  normal: "End manually",
  streak: "Ends on wrong answer",
  speed: "Ends if too slow",
  due: "Only flags due for review",
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

// Olympic-ring-inspired palette indexed by position; collections can have any number of
// group buckets, so we cycle through these.
const GROUP_PALETTE = [
  "#0081C8", // blue
  "#F4C542", // yellow
  "#333333", // black
  "#EE334E", // red
  "#00A651", // green
  "#FC4C02", // orange
  "#7C3AED", // purple
  "#0EA5E9", // sky
  "#10B981", // emerald
  "#F59E0B", // amber
  "#EF4444", // rose
  "#6366F1", // indigo
];

export function groupName(collection: Collection, groupId: string): string {
  const g = collection.groups.find((x) => x.id === groupId);
  return g?.name ?? groupId;
}

export function groupColor(collection: Collection, groupId: string): string {
  const idx = collection.groups.findIndex((g) => g.id === groupId);
  if (idx < 0) return "#10b981";
  return GROUP_PALETTE[idx % GROUP_PALETTE.length];
}

export function groupColors(collection: Collection): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 0; i < collection.groups.length; i++) {
    out[collection.groups[i].id] = GROUP_PALETTE[i % GROUP_PALETTE.length];
    // Also map display name to colour, since some charts key by display name.
    out[collection.groups[i].name] = GROUP_PALETTE[i % GROUP_PALETTE.length];
  }
  return out;
}

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
