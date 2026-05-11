import { describe, it, expect } from "vitest";
import type { Collection, FlagProgress } from "@flag-quiz/shared";
import { computeGroupData, computeStateBreakdown, mergeConfusedPairs } from "./analytics-utils";

const mockCollection: Collection = {
  id: "test",
  name: "Test",
  description: "Test collection",
  groupLabel: "Region",
  itemLabel: "item",
  groups: [
    { id: "europe", name: "Europe" },
    { id: "asia", name: "Asia" },
  ],
  flags: [
    { code: "fr", name: "France", group: "europe", colors: [], patterns: [], symbols: [], ext: "svg" },
    { code: "de", name: "Germany", group: "europe", colors: [], patterns: [], symbols: [], ext: "svg" },
    { code: "jp", name: "Japan", group: "asia", colors: [], patterns: [], symbols: [], ext: "svg" },
  ],
};

const flagMap = new Map(mockCollection.flags.map((f) => [f.code, f]));
const flagByCode = (code: string) => flagMap.get(code);

describe("computeGroupData", () => {
  it("returns empty array for empty input", () => {
    expect(computeGroupData([], flagByCode, mockCollection)).toEqual([]);
  });

  it("aggregates accuracy by group", () => {
    const flags = [
      { flag: "fr", attempt_count: 10, correct_count: 8 },
      { flag: "de", attempt_count: 10, correct_count: 6 },
      { flag: "jp", attempt_count: 10, correct_count: 9 },
    ];
    const result = computeGroupData(flags, flagByCode, mockCollection);

    expect(result).toHaveLength(2);

    const asia = result.find((g) => g.group === "Asia");
    expect(asia).toEqual({ group: "Asia", accuracy: 90, count: 10 });

    const europe = result.find((g) => g.group === "Europe");
    expect(europe).toEqual({ group: "Europe", accuracy: 70, count: 20 });
  });

  it("sorts by accuracy descending", () => {
    const flags = [
      { flag: "fr", attempt_count: 10, correct_count: 5 },
      { flag: "jp", attempt_count: 10, correct_count: 10 },
    ];
    const result = computeGroupData(flags, flagByCode, mockCollection);
    expect(result[0].group).toBe("Asia");
    expect(result[1].group).toBe("Europe");
  });

  it("skips flags not found in collection", () => {
    const flags = [
      { flag: "xx", attempt_count: 10, correct_count: 10 },
    ];
    expect(computeGroupData(flags, flagByCode, mockCollection)).toEqual([]);
  });

  it("returns 0% accuracy for groups with zero attempts", () => {
    const flags = [
      { flag: "fr", attempt_count: 0, correct_count: 0 },
    ];
    const result = computeGroupData(flags, flagByCode, mockCollection);
    expect(result[0].accuracy).toBe(0);
  });
});

describe("computeStateBreakdown", () => {
  it("counts all flags as New when no progress records exist", () => {
    const result = computeStateBreakdown([], 10);
    expect(result).toEqual([
      { name: "New", value: 10 },
      { name: "Learning", value: 0 },
      { name: "Review", value: 0 },
      { name: "Relearning", value: 0 },
    ]);
  });

  it("distributes flags across states correctly", () => {
    const records = [
      { state: 1 },
      { state: 1 },
      { state: 2 },
      { state: 2 },
      { state: 2 },
      { state: 3 },
    ] as FlagProgress[];

    const result = computeStateBreakdown(records, 10);
    expect(result).toEqual([
      { name: "New", value: 4 },     // 10 - 6 with state > 0
      { name: "Learning", value: 2 },
      { name: "Review", value: 3 },
      { name: "Relearning", value: 1 },
    ]);
  });
});

describe("mergeConfusedPairs", () => {
  it("returns empty array for empty input", () => {
    expect(mergeConfusedPairs([])).toEqual([]);
  });

  it("merges bidirectional pairs", () => {
    const pairs = [
      { flag: "fr", guess: "it", count: 3 },
      { flag: "it", guess: "fr", count: 2 },
    ];
    const result = mergeConfusedPairs(pairs);
    expect(result).toHaveLength(1);
    expect(result[0].count).toBe(5);
  });

  it("sorts by count descending", () => {
    const pairs = [
      { flag: "fr", guess: "it", count: 2 },
      { flag: "de", guess: "at", count: 5 },
    ];
    const result = mergeConfusedPairs(pairs);
    expect(result[0].count).toBe(5);
    expect(result[1].count).toBe(2);
  });

  it("limits results to specified count", () => {
    const pairs = Array.from({ length: 30 }, (_, i) => ({
      flag: `a${i}`,
      guess: `b${i}`,
      count: 30 - i,
    }));
    expect(mergeConfusedPairs(pairs, 5)).toHaveLength(5);
    expect(mergeConfusedPairs(pairs)).toHaveLength(20); // default limit
  });

  it("uses consistent key ordering for merge", () => {
    const pairs = [
      { flag: "zz", guess: "aa", count: 1 },
      { flag: "aa", guess: "zz", count: 1 },
    ];
    const result = mergeConfusedPairs(pairs);
    expect(result).toHaveLength(1);
    expect(result[0].count).toBe(2);
  });
});
