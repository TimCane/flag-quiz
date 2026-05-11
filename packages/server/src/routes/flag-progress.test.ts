import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createTestApp, cleanupTestApp, get, jsonRequest, type TestContext } from "../test-helpers.js";

let ctx: TestContext;
beforeEach(() => { ctx = createTestApp(); });
afterEach(() => { cleanupTestApp(ctx); });

describe("GET /api/:collection/flag-progress", () => {
  it("returns empty list initially", async () => {
    const res = await get(ctx.app, "/api/world/flag-progress");
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.ok).toBe(true);
    expect(body.records).toEqual([]);
  });

  it("returns progress records after upsert", async () => {
    const now = new Date().toISOString();
    await jsonRequest(ctx.app, "POST", "/api/world/flag-progress", {
      flag: "gb",
      mnemonic: "Union Jack",
      stability: 10.5,
      difficulty: 5.0,
      state: 2,
      last_review: now,
      due: now,
      updated_at: now,
    });

    const res = await get(ctx.app, "/api/world/flag-progress");
    const body = await res.json() as any;
    expect(body.records).toHaveLength(1);
    expect(body.records[0].flag).toBe("gb");
    expect(body.records[0].mnemonic).toBe("Union Jack");
  });

  it("scopes to collection", async () => {
    const now = new Date().toISOString();
    await jsonRequest(ctx.app, "POST", "/api/world/flag-progress", {
      flag: "gb",
      mnemonic: "",
      stability: 10,
      difficulty: 5,
      state: 2,
      last_review: now,
      due: now,
      updated_at: now,
    });

    const res = await get(ctx.app, "/api/us-states/flag-progress");
    const body = await res.json() as any;
    expect(body.records).toHaveLength(0);
  });
});

describe("POST /api/:collection/flag-progress", () => {
  it("creates flag progress", async () => {
    const now = new Date().toISOString();
    const res = await jsonRequest(ctx.app, "POST", "/api/world/flag-progress", {
      flag: "fr",
      mnemonic: "Tricolore",
      stability: 8,
      difficulty: 4,
      state: 1,
      last_review: now,
      due: now,
      updated_at: now,
    });
    expect(res.status).toBe(201);
    const body = await res.json() as any;
    expect(body.ok).toBe(true);
    expect(body.flag).toBe("fr");
  });

  it("upserts (replaces) existing progress", async () => {
    const now = new Date().toISOString();
    const base = {
      flag: "gb",
      stability: 5,
      difficulty: 5,
      state: 1,
      last_review: now,
      due: now,
      updated_at: now,
    };

    await jsonRequest(ctx.app, "POST", "/api/world/flag-progress", { ...base, mnemonic: "First" });
    await jsonRequest(ctx.app, "POST", "/api/world/flag-progress", { ...base, mnemonic: "Updated" });

    const res = await get(ctx.app, "/api/world/flag-progress");
    const body = await res.json() as any;
    expect(body.records).toHaveLength(1);
    expect(body.records[0].mnemonic).toBe("Updated");
  });

  it("rejects unknown flag", async () => {
    const now = new Date().toISOString();
    const res = await jsonRequest(ctx.app, "POST", "/api/world/flag-progress", {
      flag: "zzz",
      mnemonic: "",
      stability: null,
      difficulty: null,
      state: 0,
      last_review: null,
      due: null,
      updated_at: now,
    });
    expect(res.status).toBe(400);
  });

  it("rejects invalid data", async () => {
    const res = await jsonRequest(ctx.app, "POST", "/api/world/flag-progress", { bad: "data" });
    expect(res.status).toBe(400);
  });
});
