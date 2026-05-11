import { describe, it, expect } from "vitest";
import { flagImageUrl, flagImageUrlFromCollection } from "./flag-image";
import type { Collection } from "@flag-quiz/shared";

describe("flagImageUrl", () => {
  it("builds a path with the correct extension", () => {
    expect(flagImageUrl("world", { code: "gb", ext: "png" })).toBe("/flags/world/gb.png");
    expect(flagImageUrl("world", { code: "eu", ext: "svg" })).toBe("/flags/world/eu.svg");
  });

  it("uses the collection id in the path", () => {
    expect(flagImageUrl("us-states", { code: "ca", ext: "png" })).toBe("/flags/us-states/ca.png");
  });
});

describe("flagImageUrlFromCollection", () => {
  const collection: Collection = {
    id: "test",
    name: "Test",
    description: "",
    groupLabel: "Group",
    itemLabel: "item",
    groups: [],
    flags: [
      { code: "a", name: "A", group: "g", colors: [], patterns: [], symbols: [], ext: "svg" },
      { code: "b", name: "B", group: "g", colors: [], patterns: [], symbols: [], ext: "png" },
    ],
  };

  it("uses the flag's actual extension", () => {
    expect(flagImageUrlFromCollection(collection, "a")).toBe("/flags/test/a.svg");
    expect(flagImageUrlFromCollection(collection, "b")).toBe("/flags/test/b.png");
  });

  it("falls back to .png for unknown codes", () => {
    expect(flagImageUrlFromCollection(collection, "unknown")).toBe("/flags/test/unknown.png");
  });
});
