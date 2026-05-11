import { describe, it, expect } from "vitest";
import { collections, getCollection, flagByCode, flagsForCollection, isKnownCollection } from "./index.js";

describe("collections registry", () => {
  it("has at least 3 collections", () => {
    expect(collections.length).toBeGreaterThanOrEqual(3);
  });

  it("each collection has unique id", () => {
    const ids = collections.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("each collection has required fields", () => {
    for (const c of collections) {
      expect(c.id).toBeTruthy();
      expect(c.name).toBeTruthy();
      expect(c.description).toBeTruthy();
      expect(c.groupLabel).toBeTruthy();
      expect(c.itemLabel).toBeTruthy();
      expect(c.groups.length).toBeGreaterThan(0);
      expect(c.flags.length).toBeGreaterThan(0);
    }
  });

  it("each flag has unique code within its collection", () => {
    for (const c of collections) {
      const codes = c.flags.map((f) => f.code);
      const dupes = codes.filter((code, i) => codes.indexOf(code) !== i);
      expect(dupes, `Duplicate codes in ${c.id}: ${dupes.join(", ")}`).toHaveLength(0);
    }
  });

  it("each flag has a valid group", () => {
    for (const c of collections) {
      const groupIds = new Set(c.groups.map((g) => g.id));
      for (const f of c.flags) {
        expect(groupIds.has(f.group), `Flag ${f.code} in ${c.id} has invalid group "${f.group}"`).toBe(true);
      }
    }
  });

  it("each flag has required fields", () => {
    for (const c of collections) {
      for (const f of c.flags) {
        expect(f.code).toBeTruthy();
        expect(f.name).toBeTruthy();
        expect(f.ext).toMatch(/^(png|svg)$/);
        expect(Array.isArray(f.colors)).toBe(true);
        expect(Array.isArray(f.patterns)).toBe(true);
        expect(Array.isArray(f.symbols)).toBe(true);
      }
    }
  });
});

describe("getCollection", () => {
  it("returns collection by id", () => {
    const world = getCollection("world");
    expect(world).toBeDefined();
    expect(world!.name).toBe("World Flags");
  });

  it("returns undefined for unknown id", () => {
    expect(getCollection("nonexistent")).toBeUndefined();
  });
});

describe("flagByCode", () => {
  it("finds flag in collection", () => {
    const flag = flagByCode("world", "gb");
    expect(flag).toBeDefined();
    expect(flag!.name).toBe("United Kingdom");
  });

  it("returns undefined for wrong collection", () => {
    expect(flagByCode("us-states", "gb")).toBeUndefined();
  });

  it("returns undefined for unknown code", () => {
    expect(flagByCode("world", "zzz")).toBeUndefined();
  });
});

describe("flagsForCollection", () => {
  it("returns flags array", () => {
    const flags = flagsForCollection("world");
    expect(flags.length).toBeGreaterThan(100);
  });

  it("returns empty for unknown collection", () => {
    expect(flagsForCollection("nope")).toHaveLength(0);
  });
});

describe("isKnownCollection", () => {
  it("returns true for known", () => {
    expect(isKnownCollection("world")).toBe(true);
    expect(isKnownCollection("us-states")).toBe(true);
    expect(isKnownCollection("uk-counties")).toBe(true);
  });

  it("returns false for unknown", () => {
    expect(isKnownCollection("mars")).toBe(false);
  });
});
