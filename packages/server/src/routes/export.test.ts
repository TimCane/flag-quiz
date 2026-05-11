import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createTestApp, cleanupTestApp, get, seedSession, seedClassicAttempt, seedTag, type TestContext } from "../test-helpers.js";

let ctx: TestContext;
beforeEach(() => { ctx = createTestApp(); });
afterEach(() => { cleanupTestApp(ctx); });

describe("GET /api/:collection/export/json", () => {
  it("returns all tables as JSON", async () => {
    const sid = seedSession(ctx.db);
    seedClassicAttempt(ctx.db, sid);
    seedTag(ctx.db);

    const res = await get(ctx.app, "/api/world/export/json");
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.ok).toBe(true);
    expect(body.data).toHaveProperty("sessions");
    expect(body.data).toHaveProperty("attempts");
    expect(body.data).toHaveProperty("flag_progress");
    expect(body.data).toHaveProperty("tags");
    expect(body.data).toHaveProperty("flag_tags");
    expect(body.data).toHaveProperty("settings");
    expect(body.data.sessions).toHaveLength(1);
    expect(body.data.attempts).toHaveLength(1);
    expect(body.data.settings.length).toBeGreaterThan(0);
  });

  it("scopes to collection", async () => {
    seedSession(ctx.db, { collectionId: "us-states" });

    const res = await get(ctx.app, "/api/world/export/json");
    const body = await res.json() as any;
    expect(body.data.sessions).toHaveLength(0);
  });
});

describe("GET /api/:collection/export/csv", () => {
  it("returns all tables as CSV strings", async () => {
    const sid = seedSession(ctx.db);
    seedClassicAttempt(ctx.db, sid);

    const res = await get(ctx.app, "/api/world/export/csv");
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.ok).toBe(true);
    expect(body.data).toHaveProperty("sessions");
    expect(body.data).toHaveProperty("attempts");
    expect(typeof body.data.sessions).toBe("string");
    expect(body.data.sessions).toContain("id,");
    expect(body.data.sessions).toContain(sid);
  });

  it("returns empty strings for tables with no data", async () => {
    const res = await get(ctx.app, "/api/world/export/csv");
    const body = await res.json() as any;
    expect(body.data.sessions).toBe("");
    expect(body.data.tags).toBe("");
  });

  it("escapes CSV special characters", async () => {
    // Seed a tag with commas and quotes in description
    ctx.db.prepare(
      `INSERT INTO tags (id, collection_id, name, sort_order, description, type, updated_at) VALUES (?,?,?,?,?,?,?)`,
    ).run(crypto.randomUUID(), "world", 'Tag "with" quotes', 0, 'Has, commas\nand newlines', "group", new Date().toISOString());

    const res = await get(ctx.app, "/api/world/export/csv");
    const body = await res.json() as any;
    // CSV should escape quotes and wrap fields with special chars
    expect(body.data.tags).toContain('""');
  });
});
