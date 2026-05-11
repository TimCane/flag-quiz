import {
  FSRS,
  createEmptyCard,
  Rating as FsrsRating,
  type Card,
  type RecordLogItem,
} from "ts-fsrs";
import type { FlagProgress } from "./schemas/flag-progress.js";
import type { Rating } from "./enums.js";

export type SchedulingResult = {
  rating: Rating;
  card: Card;
  intervalLabel: string;
};

export function createFsrs(params?: {
  requestRetention?: number;
  maximumInterval?: number;
}): FSRS {
  return new FSRS({
    request_retention: params?.requestRetention ?? 0.9,
    maximum_interval: params?.maximumInterval ?? 365,
  });
}

export function progressToCard(progress: FlagProgress | null): Card {
  if (!progress || progress.stability === null) {
    return createEmptyCard();
  }

  const card = createEmptyCard();
  card.due = new Date(progress.due ?? new Date().toISOString());
  card.stability = progress.stability;
  card.difficulty = progress.difficulty ?? 0;
  card.state = progress.state;
  if (progress.last_review) {
    card.last_review = new Date(progress.last_review);
  }
  return card;
}

export function cardToProgress(
  flag: string,
  card: Card,
): Omit<FlagProgress, "mnemonic"> {
  return {
    flag,
    stability: card.stability,
    difficulty: card.difficulty,
    state: card.state,
    last_review: card.last_review
      ? new Date(card.last_review).toISOString()
      : null,
    due: new Date(card.due).toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export function getSchedulingChoices(
  fsrs: FSRS,
  card: Card,
  now: Date = new Date(),
): SchedulingResult[] {
  const scheduling = fsrs.repeat(card, now);

  return [
    formatChoice(1, scheduling[FsrsRating.Again]),
    formatChoice(2, scheduling[FsrsRating.Hard]),
    formatChoice(3, scheduling[FsrsRating.Good]),
    formatChoice(4, scheduling[FsrsRating.Easy]),
  ];
}

function formatChoice(
  rating: Rating,
  item: RecordLogItem,
): SchedulingResult {
  return {
    rating,
    card: item.card,
    intervalLabel: formatInterval(item.card),
  };
}

function formatInterval(card: Card): string {
  const now = new Date();
  const due = new Date(card.due);
  const diffMs = due.getTime() - now.getTime();
  const diffMin = Math.round(diffMs / 60_000);
  const diffHours = Math.round(diffMs / 3_600_000);
  const diffDays = Math.round(diffMs / 86_400_000);

  if (diffMin < 1) return "now";
  if (diffMin < 60) return `${diffMin}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays === 1) return "1d";
  return `${diffDays}d`;
}
