export const Mode = {
  CLASSIC: "classic",
  PICK_THE_FLAG: "pick-the-flag",
  PICK_THE_COUNTRY: "pick-the-country",
} as const;

export type Mode = (typeof Mode)[keyof typeof Mode];

export const ExitCondition = {
  NORMAL: "normal",
  STREAK: "streak",
  SPEED: "speed",
} as const;

export type ExitCondition = (typeof ExitCondition)[keyof typeof ExitCondition];

export const FsrsState = {
  NEW: 0,
  LEARNING: 1,
  REVIEW: 2,
  RELEARNING: 3,
} as const;

export type FsrsState = (typeof FsrsState)[keyof typeof FsrsState];

export const Rating = {
  AGAIN: 1,
  HARD: 2,
  GOOD: 3,
  EASY: 4,
} as const;

export type Rating = (typeof Rating)[keyof typeof Rating];

export const Continent = {
  AFRICA: "africa",
  ASIA: "asia",
  EUROPE: "europe",
  NORTH_AMERICA: "north-america",
  SOUTH_AMERICA: "south-america",
  OCEANIA: "oceania",
} as const;

export type Continent = (typeof Continent)[keyof typeof Continent];
