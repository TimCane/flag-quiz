import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createTestApp, cleanupTestApp, get, jsonRequest, type TestContext } from "../test-helpers.js";

let ctx: TestContext;
beforeEach(() => { ctx = createTestApp(); });
afterEach(() => { cleanupTestApp(ctx); });

describe("GET /api/settings", () => {
  it("returns all settings", async () => {
    const res = await get(ctx.app, "/api/settings");
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.ok).toBe(true);
    expect(body.settings.length).toBeGreaterThan(0);
    expect(body.settings[0]).toHaveProperty("key");
    expect(body.settings[0]).toHaveProperty("value");
    expect(body.settings[0]).toHaveProperty("type");
  });
});

describe("PUT /api/settings/:key", () => {
  it("updates a setting value", async () => {
    const res = await jsonRequest(ctx.app, "PUT", "/api/settings/speed_timeout_classic_ms", {
      value: "8000",
    });
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.ok).toBe(true);

    // Verify persisted
    const row = ctx.db.prepare("SELECT value FROM settings WHERE key = ?").get("speed_timeout_classic_ms") as any;
    expect(row.value).toBe("8000");
  });

  it("returns 404 for unknown setting", async () => {
    const res = await jsonRequest(ctx.app, "PUT", "/api/settings/nonexistent_key", {
      value: "123",
    });
    expect(res.status).toBe(404);
  });

  it("returns 400 for missing value", async () => {
    const res = await jsonRequest(ctx.app, "PUT", "/api/settings/speed_timeout_classic_ms", {});
    expect(res.status).toBe(400);
  });

  it("rejects non-numeric value for number settings", async () => {
    const res = await jsonRequest(ctx.app, "PUT", "/api/settings/speed_timeout_classic_ms", {
      value: "banana",
    });
    expect(res.status).toBe(400);
    const body = await res.json() as any;
    expect(body.error).toContain("numeric");
  });

  it("accepts valid numeric string for number settings", async () => {
    const res = await jsonRequest(ctx.app, "PUT", "/api/settings/fsrs_request_retention", {
      value: "0.85",
    });
    expect(res.status).toBe(200);
  });

  it("accepts string settings without type validation", async () => {
    const res = await jsonRequest(ctx.app, "PUT", "/api/settings/presentation_config", {
      value: '{"tag_order":[],"show_title_slide":false}',
    });
    expect(res.status).toBe(200);
  });
});
