import { describe, it, expect } from "vitest";
import { DEFAULT_SETTINGS } from "./settings.js";
import { SettingSchema } from "./schemas/setting.js";

describe("DEFAULT_SETTINGS", () => {
  it("has at least 5 settings", () => {
    expect(DEFAULT_SETTINGS.length).toBeGreaterThanOrEqual(5);
  });

  it("has unique keys", () => {
    const keys = DEFAULT_SETTINGS.map((s) => s.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("all settings pass schema validation", () => {
    for (const setting of DEFAULT_SETTINGS) {
      const result = SettingSchema.safeParse(setting);
      expect(result.success, `Setting "${setting.key}" failed validation`).toBe(true);
    }
  });

  it("number settings have valid numeric values", () => {
    const numberSettings = DEFAULT_SETTINGS.filter((s) => s.type === "number");
    expect(numberSettings.length).toBeGreaterThan(0);
    for (const s of numberSettings) {
      expect(isNaN(Number(s.value)), `Setting "${s.key}" value "${s.value}" is not a number`).toBe(false);
    }
  });

  it("includes speed timeout settings for all modes", () => {
    const keys = DEFAULT_SETTINGS.map((s) => s.key);
    expect(keys).toContain("speed_timeout_classic_ms");
    expect(keys).toContain("speed_timeout_pick_flag_ms");
    expect(keys).toContain("speed_timeout_pick_item_ms");
  });

  it("includes FSRS settings", () => {
    const keys = DEFAULT_SETTINGS.map((s) => s.key);
    expect(keys).toContain("fsrs_request_retention");
    expect(keys).toContain("fsrs_maximum_interval");
  });

  it("presentation_config is valid JSON", () => {
    const config = DEFAULT_SETTINGS.find((s) => s.key === "presentation_config");
    expect(config).toBeDefined();
    expect(() => JSON.parse(config!.value)).not.toThrow();
  });
});
