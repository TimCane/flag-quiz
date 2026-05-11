import { describe, it, expect } from "vitest";
import { modeLabels, modeDescriptions, groupName, groupColor, formatReactionTime, formatDuration } from "./labels";
import type { Collection } from "@flag-quiz/shared";

const mockCollection: Collection = {
  id: "test",
  name: "Test",
  description: "Test collection",
  groupLabel: "Region",
  itemLabel: "item",
  groups: [
    { id: "a", name: "Alpha" },
    { id: "b", name: "Beta" },
  ],
  flags: [],
};

describe("modeLabels", () => {
  it("capitalizes the item label for pick-the-item", () => {
    const labels = modeLabels("country");
    expect(labels["pick-the-item"]).toBe("Pick the Country");
  });

  it("returns static labels for classic and pick-the-flag", () => {
    const labels = modeLabels("state");
    expect(labels.classic).toBe("Classic");
    expect(labels["pick-the-flag"]).toBe("Pick the Flag");
  });
});

describe("modeDescriptions", () => {
  it("includes the item label in descriptions", () => {
    const desc = modeDescriptions("county");
    expect(desc.classic).toContain("county");
    expect(desc["pick-the-flag"]).toContain("county");
    expect(desc["pick-the-item"]).toContain("county");
  });
});

describe("groupName", () => {
  it("returns the group display name", () => {
    expect(groupName(mockCollection, "a")).toBe("Alpha");
  });

  it("returns the raw id for unknown groups", () => {
    expect(groupName(mockCollection, "unknown")).toBe("unknown");
  });
});

describe("groupColor", () => {
  it("returns a color from the palette", () => {
    const color = groupColor(mockCollection, "a");
    expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it("returns fallback for unknown group", () => {
    expect(groupColor(mockCollection, "unknown")).toBe("#10b981");
  });
});

describe("formatReactionTime", () => {
  it("formats ms under 1s", () => {
    expect(formatReactionTime(500)).toBe("500ms");
  });

  it("formats seconds over 1s", () => {
    expect(formatReactionTime(2500)).toBe("2.5s");
  });
});

describe("formatDuration", () => {
  it("formats seconds only", () => {
    expect(formatDuration(45)).toBe("45s");
  });

  it("formats minutes and seconds", () => {
    expect(formatDuration(125)).toBe("2m 5s");
  });

  it("formats exact minutes", () => {
    expect(formatDuration(120)).toBe("2m");
  });
});
