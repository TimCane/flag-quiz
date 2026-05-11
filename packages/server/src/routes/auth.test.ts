import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createTestApp, cleanupTestApp, type TestContext } from "../test-helpers.js";

let ctx: TestContext;
beforeEach(() => { ctx = createTestApp(); });
afterEach(() => { cleanupTestApp(ctx); });

describe("POST /api/auth/check", () => {
  it("returns token for correct password", async () => {
    const res = await ctx.app.request("/api/auth/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: process.env.APP_PASSWORD }),
    });
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.ok).toBe(true);
    expect(body.token).toBeTypeOf("string");
    expect(body.token.length).toBe(64); // SHA-256 hex
  });

  it("returns 401 for wrong password", async () => {
    const res = await ctx.app.request("/api/auth/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: "wrong" }),
    });
    expect(res.status).toBe(401);
    const body = await res.json() as any;
    expect(body.ok).toBe(false);
  });

  it("returns 429 after rate limit exceeded", async () => {
    for (let i = 0; i < 10; i++) {
      await ctx.app.request("/api/auth/check", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-forwarded-for": "1.2.3.4" },
        body: JSON.stringify({ password: "wrong" }),
      });
    }

    const res = await ctx.app.request("/api/auth/check", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": "1.2.3.4" },
      body: JSON.stringify({ password: process.env.APP_PASSWORD }),
    });
    expect(res.status).toBe(429);
  });

  it("rate limits per IP", async () => {
    for (let i = 0; i < 10; i++) {
      await ctx.app.request("/api/auth/check", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-forwarded-for": "1.2.3.4" },
        body: JSON.stringify({ password: "wrong" }),
      });
    }

    // Different IP should not be rate limited
    const res = await ctx.app.request("/api/auth/check", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": "5.6.7.8" },
      body: JSON.stringify({ password: process.env.APP_PASSWORD }),
    });
    expect(res.status).toBe(200);
  });
});
