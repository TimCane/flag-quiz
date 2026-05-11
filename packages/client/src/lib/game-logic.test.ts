import { describe, it, expect } from "vitest";
import { ExitCondition } from "@flag-quiz/shared";
import type { ConfusionMap } from "@flag-quiz/shared";
import { flattenConfusions, checkExitCondition, autoRate } from "./game-logic";
import type { Percentiles } from "./game-logic";

describe("flattenConfusions", () => {
  it("returns empty array for empty confusion map", () => {
    const cm: ConfusionMap = { confusions: new Map() };
    expect(flattenConfusions(cm)).toEqual([]);
  });

  it("flattens a single confusion pair", () => {
    const cm: ConfusionMap = {
      confusions: new Map([["fr", new Map([["it", 2]])]]),
    };
    const result = flattenConfusions(cm);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ flag: "fr", guess: "it" });
  });

  it("deduplicates symmetric pairs (A->B and B->A)", () => {
    const cm: ConfusionMap = {
      confusions: new Map([
        ["fr", new Map([["it", 1]])],
        ["it", new Map([["fr", 1]])],
      ]),
    };
    const result = flattenConfusions(cm);
    // Should only produce 1 pair, not 2 (deduped by sorted key)
    expect(result).toHaveLength(1);
  });

  it("repeats pairs according to count", () => {
    const cm: ConfusionMap = {
      confusions: new Map([["de", new Map([["at", 3]])]]),
    };
    expect(flattenConfusions(cm)).toHaveLength(3);
  });
});

describe("checkExitCondition", () => {
  it("ends on wrong answer in streak mode", () => {
    expect(checkExitCondition(ExitCondition.STREAK, false, 1000, 5000, 0, 10)).toBe(true);
  });

  it("continues on correct answer in streak mode", () => {
    expect(checkExitCondition(ExitCondition.STREAK, true, 1000, 5000, 0, 10)).toBe(false);
  });

  it("ends when reaction time exceeds timeout in speed mode", () => {
    expect(checkExitCondition(ExitCondition.SPEED, true, 6000, 5000, 0, 10)).toBe(true);
  });

  it("continues when reaction time is within timeout in speed mode", () => {
    expect(checkExitCondition(ExitCondition.SPEED, true, 3000, 5000, 0, 10)).toBe(false);
  });

  it("ends when queue is exhausted regardless of mode", () => {
    expect(checkExitCondition(ExitCondition.NORMAL, true, 1000, 5000, 9, 10)).toBe(true);
  });

  it("continues in normal mode when queue has more items", () => {
    expect(checkExitCondition(ExitCondition.NORMAL, true, 1000, 5000, 5, 10)).toBe(false);
  });
});

describe("autoRate", () => {
  const percentiles: Percentiles = {
    global: { p25: 1000, p75: 3000 },
    by_mode: {
      classic: { p25: 800, p75: 2500 },
    },
    by_flag: {
      fr: { p25: 500, p75: 1500 },
    },
  };

  it("returns Good (3) when no percentiles available", () => {
    expect(autoRate("fr", 1000, "classic", null)).toBe(3);
  });

  it("uses flag-specific thresholds when available", () => {
    // fr has p25=500, p75=1500
    expect(autoRate("fr", 400, "classic", percentiles)).toBe(4); // Easy (under p25)
    expect(autoRate("fr", 800, "classic", percentiles)).toBe(3); // Good (between p25-p75)
    expect(autoRate("fr", 2000, "classic", percentiles)).toBe(2); // Hard (over p75)
  });

  it("falls back to mode thresholds when flag not found", () => {
    // classic mode has p25=800, p75=2500
    expect(autoRate("unknown", 500, "classic", percentiles)).toBe(4);
    expect(autoRate("unknown", 1500, "classic", percentiles)).toBe(3);
    expect(autoRate("unknown", 3000, "classic", percentiles)).toBe(2);
  });

  it("falls back to global thresholds when mode not found", () => {
    // global has p25=1000, p75=3000
    expect(autoRate("unknown", 500, "unknown-mode", percentiles)).toBe(4);
    expect(autoRate("unknown", 2000, "unknown-mode", percentiles)).toBe(3);
    expect(autoRate("unknown", 4000, "unknown-mode", percentiles)).toBe(2);
  });

  it("returns Good when thresholds exist but are null", () => {
    const p: Percentiles = { global: null, by_mode: {}, by_flag: {} };
    expect(autoRate("fr", 1000, "classic", p)).toBe(3);
  });
});
