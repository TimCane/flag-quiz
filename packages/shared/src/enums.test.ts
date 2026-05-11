import { describe, it, expect } from "vitest";
import { Mode, ExitCondition, FsrsState, Rating } from "./enums.js";

describe("Mode", () => {
  it("has three game modes", () => {
    expect(Object.values(Mode)).toHaveLength(3);
  });

  it("uses string values", () => {
    expect(Mode.CLASSIC).toBe("classic");
    expect(Mode.PICK_THE_FLAG).toBe("pick-the-flag");
    expect(Mode.PICK_THE_ITEM).toBe("pick-the-item");
  });
});

describe("ExitCondition", () => {
  it("has four conditions", () => {
    expect(Object.values(ExitCondition)).toHaveLength(4);
  });

  it("includes DUE", () => {
    expect(ExitCondition.DUE).toBe("due");
  });
});

describe("FsrsState", () => {
  it("uses numeric values 0-3", () => {
    expect(FsrsState.NEW).toBe(0);
    expect(FsrsState.LEARNING).toBe(1);
    expect(FsrsState.REVIEW).toBe(2);
    expect(FsrsState.RELEARNING).toBe(3);
  });
});

describe("Rating", () => {
  it("uses numeric values 1-4", () => {
    expect(Rating.AGAIN).toBe(1);
    expect(Rating.HARD).toBe(2);
    expect(Rating.GOOD).toBe(3);
    expect(Rating.EASY).toBe(4);
  });
});
