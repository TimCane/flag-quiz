import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createTestApp, cleanupTestApp, get, type TestContext } from "../test-helpers.js";

let ctx: TestContext;
beforeEach(() => { ctx = createTestApp(); });
afterEach(() => { cleanupTestApp(ctx); });

describe("GET /api/decks", () => {
  it("returns all collections", async () => {
    const res = await get(ctx.app, "/api/decks");
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.ok).toBe(true);
    expect(body.decks.length).toBeGreaterThanOrEqual(3);
  });

  it("includes required fields per deck", async () => {
    const res = await get(ctx.app, "/api/decks");
    const body = await res.json() as any;
    const world = body.decks.find((d: any) => d.id === "world");
    expect(world).toBeDefined();
    expect(world.name).toBeTypeOf("string");
    expect(world.flagCount).toBeGreaterThan(0);
    expect(world.dueCount).toBeTypeOf("number");
    expect(world.newCount).toBeTypeOf("number");
    expect(world.sampleFlags).toHaveLength(4);
    expect(world.sampleFlags[0]).toHaveProperty("code");
    expect(world.sampleFlags[0]).toHaveProperty("name");
  });

  it("counts due flags correctly", async () => {
    // Seed a due flag
    const pastDue = new Date(Date.now() - 86_400_000).toISOString();
    ctx.db.prepare(
      `INSERT OR REPLACE INTO flag_progress (collection_id, flag, mnemonic, stability, difficulty, state, last_review, due, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?)`,
    ).run("world", "gb", "", 5, 5, 2, pastDue, pastDue, pastDue);

    const res = await get(ctx.app, "/api/decks");
    const body = await res.json() as any;
    const world = body.decks.find((d: any) => d.id === "world");
    expect(world.dueCount).toBeGreaterThanOrEqual(1);
  });
});
