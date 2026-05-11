import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createTestApp, cleanupTestApp, get, authHeader, TEST_TOKEN, type TestContext } from "../test-helpers.js";

let ctx: TestContext;
beforeEach(() => { ctx = createTestApp(); });
afterEach(() => { cleanupTestApp(ctx); });

describe("requireAuth middleware", () => {
  it("allows requests with valid token", async () => {
    const res = await get(ctx.app, "/api/settings");
    expect(res.status).toBe(200);
  });

  it("rejects requests without Authorization header", async () => {
    const res = await ctx.app.request("/api/settings");
    expect(res.status).toBe(401);
    const body = await res.json() as any;
    expect(body.ok).toBe(false);
    expect(body.error).toBe("Unauthorized");
  });

  it("rejects requests with invalid token", async () => {
    const res = await ctx.app.request("/api/settings", {
      headers: { Authorization: "Bearer invalid-token" },
    });
    expect(res.status).toBe(401);
  });

  it("rejects requests without Bearer prefix", async () => {
    const res = await ctx.app.request("/api/settings", {
      headers: { Authorization: TEST_TOKEN },
    });
    expect(res.status).toBe(401);
  });

  it("rejects requests with empty token", async () => {
    const res = await ctx.app.request("/api/settings", {
      headers: { Authorization: "Bearer " },
    });
    expect(res.status).toBe(401);
  });
});
