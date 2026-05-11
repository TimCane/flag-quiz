import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createTestApp, cleanupTestApp, get, jsonRequest, seedSession, seedClassicAttempt, seedPickFlagAttempt, type TestContext } from "../test-helpers.js";

let ctx: TestContext;
beforeEach(() => { ctx = createTestApp(); });
afterEach(() => { cleanupTestApp(ctx); });

describe("POST /api/:collection/classic-attempts", () => {
  it("records a classic attempt", async () => {
    const sid = seedSession(ctx.db);
    const res = await jsonRequest(ctx.app, "POST", "/api/world/classic-attempts", {
      id: crypto.randomUUID(),
      session_id: sid,
      flag: "gb",
      guess: "gb",
      correct: true,
      forgotten: false,
      confidence: 3,
      reaction_time_ms: 1500,
      ts: new Date().toISOString(),
    });
    expect(res.status).toBe(201);
    const body = await res.json() as any;
    expect(body.ok).toBe(true);
  });

  it("allows null guess (don't know)", async () => {
    const sid = seedSession(ctx.db);
    const res = await jsonRequest(ctx.app, "POST", "/api/world/classic-attempts", {
      id: crypto.randomUUID(),
      session_id: sid,
      flag: "gb",
      guess: null,
      correct: false,
      forgotten: true,
      confidence: 1,
      reaction_time_ms: 5000,
      ts: new Date().toISOString(),
    });
    expect(res.status).toBe(201);
  });

  it("rejects unknown flag", async () => {
    const sid = seedSession(ctx.db);
    const res = await jsonRequest(ctx.app, "POST", "/api/world/classic-attempts", {
      id: crypto.randomUUID(),
      session_id: sid,
      flag: "nonexistent",
      guess: "nonexistent",
      correct: true,
      forgotten: false,
      confidence: 3,
      reaction_time_ms: 1500,
      ts: new Date().toISOString(),
    });
    expect(res.status).toBe(400);
    const body = await res.json() as any;
    expect(body.error).toContain("Unknown flag");
  });

  it("rejects invalid schema", async () => {
    const res = await jsonRequest(ctx.app, "POST", "/api/world/classic-attempts", { bad: "data" });
    expect(res.status).toBe(400);
  });

  it("defaults accidental to false", async () => {
    const sid = seedSession(ctx.db);
    const attemptId = crypto.randomUUID();
    await jsonRequest(ctx.app, "POST", "/api/world/classic-attempts", {
      id: attemptId,
      session_id: sid,
      flag: "gb",
      guess: "gb",
      correct: true,
      forgotten: false,
      confidence: 3,
      reaction_time_ms: 1500,
      ts: new Date().toISOString(),
    });

    const row = ctx.db.prepare("SELECT accidental FROM attempts WHERE id = ?").get(attemptId) as any;
    expect(row.accidental).toBe(0);
  });
});

describe("POST /api/:collection/pick-flag-attempts", () => {
  it("records a pick-flag attempt", async () => {
    const sid = seedSession(ctx.db, { mode: "pick-the-flag" });
    const res = await jsonRequest(ctx.app, "POST", "/api/world/pick-flag-attempts", {
      id: crypto.randomUUID(),
      session_id: sid,
      flag: "fr",
      guess: "de",
      options: ["fr", "de", "gb", "it"],
      correct: false,
      confidence: 2,
      reaction_time_ms: 3000,
      ts: new Date().toISOString(),
    });
    expect(res.status).toBe(201);
  });
});

describe("POST /api/:collection/pick-item-attempts", () => {
  it("records a pick-item attempt", async () => {
    const sid = seedSession(ctx.db, { mode: "pick-the-item" });
    const res = await jsonRequest(ctx.app, "POST", "/api/world/pick-item-attempts", {
      id: crypto.randomUUID(),
      session_id: sid,
      flag: "de",
      guess: "de",
      options: ["de", "fr", "it", "es"],
      correct: true,
      confidence: 4,
      reaction_time_ms: 1200,
      ts: new Date().toISOString(),
    });
    expect(res.status).toBe(201);
  });
});

describe("GET /api/:collection/attempts/wrong-guesses", () => {
  it("returns wrong guesses excluding accidental", async () => {
    const sid = seedSession(ctx.db);
    seedClassicAttempt(ctx.db, sid, { flag: "fr", guess: "de", correct: 0 });
    seedClassicAttempt(ctx.db, sid, { flag: "gb", guess: "ie", correct: 0, accidental: 1 });
    seedClassicAttempt(ctx.db, sid, { flag: "it", guess: "it", correct: 1 });

    const res = await get(ctx.app, "/api/world/attempts/wrong-guesses");
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.wrong_guesses).toHaveLength(1);
    expect(body.wrong_guesses[0].flag).toBe("fr");
    expect(body.wrong_guesses[0].guess).toBe("de");
  });

  it("excludes null/empty guesses", async () => {
    const sid = seedSession(ctx.db);
    // Directly insert with null guess since seedClassicAttempt defaults guess to "gb"
    ctx.db.prepare(
      `INSERT INTO attempts (id, collection_id, session_id, mode, flag, guess, correct, forgotten, confidence, reaction_time_ms, ts, accidental)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    ).run(crypto.randomUUID(), "world", sid, "classic", "fr", null, 0, 1, 1, 5000, new Date().toISOString(), 0);

    const res = await get(ctx.app, "/api/world/attempts/wrong-guesses");
    const body = await res.json() as any;
    expect(body.wrong_guesses).toHaveLength(0);
  });
});

describe("GET /api/:collection/attempts/:flag", () => {
  it("returns attempts grouped by mode", async () => {
    const sid = seedSession(ctx.db);
    seedClassicAttempt(ctx.db, sid, { flag: "fr" });
    seedPickFlagAttempt(ctx.db, sid, { flag: "fr" });

    const res = await get(ctx.app, "/api/world/attempts/fr");
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.classic).toHaveLength(1);
    expect(body.pick_flag).toHaveLength(1);
    expect(body.pick_item).toHaveLength(0);
  });

  it("converts correct to boolean", async () => {
    const sid = seedSession(ctx.db);
    seedClassicAttempt(ctx.db, sid, { flag: "gb", correct: 1 });

    const res = await get(ctx.app, "/api/world/attempts/gb");
    const body = await res.json() as any;
    expect(body.classic[0].correct).toBe(true);
  });

  it("rejects unknown flag", async () => {
    const res = await get(ctx.app, "/api/world/attempts/nonexistent");
    expect(res.status).toBe(400);
  });
});
