import { describe, it, expect } from "vitest";
import { buildConfusionMap, pickOptions } from "./confusions.js";
import { getCollection } from "./collections/index.js";

describe("buildConfusionMap", () => {
  it("returns empty map for no wrong guesses", () => {
    const cm = buildConfusionMap([]);
    expect(cm.confusions.size).toBe(0);
  });

  it("builds bidirectional pairs", () => {
    const cm = buildConfusionMap([
      { flag: "td", guess: "ro" },
      { flag: "td", guess: "ro" },
    ]);
    const tdPeers = cm.confusions.get("td")!;
    expect(tdPeers.find(([c]) => c === "ro")![1]).toBe(2);
    const roPeers = cm.confusions.get("ro")!;
    expect(roPeers.find(([c]) => c === "td")![1]).toBe(2);
  });

  it("ignores entries where flag equals guess", () => {
    const cm = buildConfusionMap([{ flag: "gb", guess: "gb" }]);
    expect(cm.confusions.size).toBe(0);
  });

  it("ignores entries with null guess", () => {
    const cm = buildConfusionMap([{ flag: "gb", guess: null as any }]);
    expect(cm.confusions.size).toBe(0);
  });
});

describe("pickOptions", () => {
  const world = getCollection("world")!;
  const flags = world.flags;
  const emptyCm = buildConfusionMap([]);

  it("always includes the target flag", () => {
    const options = pickOptions("gb", flags, emptyCm, 4, 4);
    expect(options).toContain("gb");
  });

  it("returns requested number of options", () => {
    const options = pickOptions("gb", flags, emptyCm, 4, 4);
    expect(options).toHaveLength(4);
  });

  it("returns unique options", () => {
    const options = pickOptions("gb", flags, emptyCm, 6, 6);
    expect(new Set(options).size).toBe(options.length);
  });

  it("prefers confused flags when available", () => {
    const cm = buildConfusionMap([
      { flag: "td", guess: "ro" },
      { flag: "td", guess: "ro" },
      { flag: "td", guess: "ro" },
    ]);
    const options = pickOptions("td", flags, cm, 2, 4);
    expect(options).toContain("td");
    expect(options).toContain("ro");
  });

  it("handles min > available flags gracefully", () => {
    const tinyFlags = flags.slice(0, 2);
    const options = pickOptions(tinyFlags[0].code, tinyFlags, emptyCm, 4, 4);
    expect(options.length).toBeLessThanOrEqual(4);
    expect(options).toContain(tinyFlags[0].code);
  });
});
