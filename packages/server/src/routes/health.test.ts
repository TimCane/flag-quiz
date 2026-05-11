import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createTestApp, cleanupTestApp, type TestContext } from "../test-helpers.js";

let ctx: TestContext;
beforeEach(() => { ctx = createTestApp(); });
afterEach(() => { cleanupTestApp(ctx); });

describe("GET /api/health", () => {
  it("returns ok without auth", async () => {
    const res = await ctx.app.request("/api/health");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true });
  });
});
