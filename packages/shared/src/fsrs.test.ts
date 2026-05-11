import { describe, it, expect } from "vitest";
import { createFsrs, progressToCard, cardToProgress, getSchedulingChoices } from "./fsrs.js";

describe("createFsrs", () => {
  it("returns an FSRS instance", () => {
    const fsrs = createFsrs();
    expect(fsrs).toBeDefined();
  });

  it("accepts custom parameters", () => {
    const fsrs = createFsrs({ requestRetention: 0.85, maximumInterval: 180 });
    expect(fsrs).toBeDefined();
  });
});

describe("progressToCard", () => {
  it("returns empty card for null progress", () => {
    const card = progressToCard(null);
    expect(card).toBeDefined();
    expect(card.state).toBe(0);
  });

  it("returns empty card when stability is null", () => {
    const card = progressToCard({
      flag: "gb",
      mnemonic: "",
      stability: null,
      difficulty: null,
      state: 0,
      last_review: null,
      due: null,
      updated_at: new Date().toISOString(),
    });
    expect(card.state).toBe(0);
  });

  it("converts progress with FSRS state", () => {
    const now = new Date().toISOString();
    const card = progressToCard({
      flag: "gb",
      mnemonic: "Union Jack",
      stability: 10.5,
      difficulty: 5.2,
      state: 2,
      last_review: now,
      due: now,
      updated_at: now,
    });
    expect(card.stability).toBe(10.5);
    expect(card.difficulty).toBe(5.2);
    expect(card.state).toBe(2);
  });
});

describe("cardToProgress", () => {
  it("converts card back to progress", () => {
    const card = progressToCard(null);
    const progress = cardToProgress("gb", card);
    expect(progress.flag).toBe("gb");
    expect(progress.state).toBe(0);
    expect(progress.updated_at).toBeTruthy();
  });
});

describe("getSchedulingChoices", () => {
  it("returns 4 rating choices", () => {
    const fsrs = createFsrs();
    const card = progressToCard(null);
    const choices = getSchedulingChoices(fsrs, card);
    expect(choices).toHaveLength(4);
    expect(choices.map((c) => c.rating)).toEqual([1, 2, 3, 4]);
  });

  it("each choice has card and interval label", () => {
    const fsrs = createFsrs();
    const card = progressToCard(null);
    const choices = getSchedulingChoices(fsrs, card);
    for (const choice of choices) {
      expect(choice.card).toBeDefined();
      expect(typeof choice.intervalLabel).toBe("string");
    }
  });
});
