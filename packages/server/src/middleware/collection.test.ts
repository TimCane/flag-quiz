import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createTestApp, cleanupTestApp, get, type TestContext } from "../test-helpers.js";

let ctx: TestContext;
beforeEach(() => { ctx = createTestApp(); });
afterEach(() => { cleanupTestApp(ctx); });

describe("requireCollection middleware", () => {
  it("allows valid collection IDs", async () => {
    const res = await get(ctx.app, "/api/world/sessions");
    expect(res.status).toBe(200);
  });

  it("allows us-states collection", async () => {
    const res = await get(ctx.app, "/api/us-states/sessions");
    expect(res.status).toBe(200);
  });

  it("allows uk-counties collection", async () => {
    const res = await get(ctx.app, "/api/uk-counties/sessions");
    expect(res.status).toBe(200);
  });

  it("returns 404 for unknown collection", async () => {
    const res = await get(ctx.app, "/api/nonexistent/sessions");
    expect(res.status).toBe(404);
    const body = await res.json() as any;
    expect(body.ok).toBe(false);
    expect(body.error).toBe("Unknown collection");
  });
});
