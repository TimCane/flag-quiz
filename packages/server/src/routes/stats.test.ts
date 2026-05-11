import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createTestApp, cleanupTestApp, get, seedSession, seedClassicAttempt, seedPickFlagAttempt, type TestContext } from "../test-helpers.js";

let ctx: TestContext;
beforeEach(() => { ctx = createTestApp(); });
afterEach(() => { cleanupTestApp(ctx); });

function seedProgressData() {
  const sid = seedSession(ctx.db);
  seedClassicAttempt(ctx.db, sid, { flag: "gb", correct: 1, reactionTimeMs: 1000 });
  seedClassicAttempt(ctx.db, sid, { flag: "fr", correct: 1, reactionTimeMs: 2000 });
  seedClassicAttempt(ctx.db, sid, { flag: "de", guess: "fr", correct: 0, reactionTimeMs: 3000 });
  seedPickFlagAttempt(ctx.db, sid, { flag: "it", correct: 1 });
  return sid;
}

describe("GET /api/:collection/stats", () => {
  it("returns zero stats for empty collection", async () => {
    const res = await get(ctx.app, "/api/world/stats");
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.ok).toBe(true);
    expect(body.total_attempts).toBe(0);
    expect(body.total_sessions).toBe(0);
    expect(body.flags_attempted).toBe(0);
    expect(body.accuracy).toBe(0);
  });

  it("returns correct aggregate stats", async () => {
    seedProgressData();

    const res = await get(ctx.app, "/api/world/stats");
    const body = await res.json() as any;
    expect(body.total_attempts).toBe(4);
    expect(body.total_sessions).toBe(1);
    expect(body.flags_attempted).toBe(4);
    expect(body.accuracy).toBe(75.0); // 3/4 correct
  });
});

describe("GET /api/:collection/stats/flags", () => {
  it("returns per-flag accuracy", async () => {
    seedProgressData();

    const res = await get(ctx.app, "/api/world/stats/flags");
    const body = await res.json() as any;
    expect(body.flags.length).toBe(4);

    const gb = body.flags.find((f: any) => f.flag === "gb");
    expect(gb.accuracy).toBe(100);
    expect(gb.attempt_count).toBe(1);
  });
});

describe("GET /api/:collection/stats/confusions/:flag", () => {
  it("returns confusion counts", async () => {
    seedProgressData();

    const res = await get(ctx.app, "/api/world/stats/confusions/de");
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.confusions).toHaveLength(1);
    expect(body.confusions[0].guess).toBe("fr");
    expect(body.confusions[0].count).toBe(1);
  });

  it("rejects unknown flag", async () => {
    const res = await get(ctx.app, "/api/world/stats/confusions/zzz");
    expect(res.status).toBe(400);
  });
});

describe("GET /api/:collection/stats/progress", () => {
  it("returns daily progress", async () => {
    seedProgressData();

    const res = await get(ctx.app, "/api/world/stats/progress");
    const body = await res.json() as any;
    expect(body.progress.length).toBeGreaterThanOrEqual(1);
    expect(body.progress[0]).toHaveProperty("day");
    expect(body.progress[0]).toHaveProperty("attempts");
    expect(body.progress[0]).toHaveProperty("accuracy");
  });
});

describe("GET /api/:collection/stats/groups", () => {
  it("returns per-flag group data", async () => {
    seedProgressData();

    const res = await get(ctx.app, "/api/world/stats/groups");
    const body = await res.json() as any;
    expect(body.flags.length).toBe(4);
  });
});

describe("GET /api/:collection/stats/confused-pairs", () => {
  it("returns confused pairs", async () => {
    seedProgressData();

    const res = await get(ctx.app, "/api/world/stats/confused-pairs");
    const body = await res.json() as any;
    expect(body.pairs.length).toBeGreaterThanOrEqual(1);
    const pair = body.pairs[0];
    expect(pair.flag).toBe("de");
    expect(pair.guess).toBe("fr");
  });
});

describe("GET /api/:collection/stats/confidence", () => {
  it("returns confidence distribution", async () => {
    seedProgressData();

    const res = await get(ctx.app, "/api/world/stats/confidence");
    const body = await res.json() as any;
    expect(body.distribution.length).toBeGreaterThanOrEqual(1);
    expect(body.distribution[0]).toHaveProperty("confidence");
    expect(body.distribution[0]).toHaveProperty("count");
  });
});

describe("GET /api/:collection/stats/activity", () => {
  it("returns activity heatmap data", async () => {
    seedProgressData();

    const res = await get(ctx.app, "/api/world/stats/activity");
    const body = await res.json() as any;
    expect(body.activity.length).toBeGreaterThanOrEqual(1);
    expect(body.activity[0]).toHaveProperty("day");
    expect(body.activity[0]).toHaveProperty("count");
  });
});

describe("GET /api/:collection/stats/sparklines", () => {
  it("returns sparkline data per flag", async () => {
    seedProgressData();

    const res = await get(ctx.app, "/api/world/stats/sparklines");
    const body = await res.json() as any;
    expect(body.sparklines).toHaveProperty("gb");
    expect(body.sparklines.gb).toEqual([1]);
  });
});

describe("GET /api/:collection/stats/hardest", () => {
  it("returns empty for insufficient data", async () => {
    seedProgressData(); // Each flag has only 1 attempt, threshold is 3

    const res = await get(ctx.app, "/api/world/stats/hardest");
    const body = await res.json() as any;
    expect(body.hardest).toEqual([]);
  });

  it("returns flags with 3+ attempts sorted by accuracy", async () => {
    const sid = seedSession(ctx.db);
    // "de" gets 3 attempts: 1 correct, 2 wrong = 33.3% accuracy
    seedClassicAttempt(ctx.db, sid, { flag: "de", guess: "de", correct: 1 });
    seedClassicAttempt(ctx.db, sid, { flag: "de", guess: "fr", correct: 0 });
    seedClassicAttempt(ctx.db, sid, { flag: "de", guess: "it", correct: 0 });

    const res = await get(ctx.app, "/api/world/stats/hardest");
    const body = await res.json() as any;
    expect(body.hardest).toHaveLength(1);
    expect(body.hardest[0].flag).toBe("de");
    expect(body.hardest[0].accuracy).toBeCloseTo(33.3, 0);
  });
});

describe("GET /api/:collection/stats/comparison", () => {
  it("returns null for insufficient data", async () => {
    const res = await get(ctx.app, "/api/world/stats/comparison");
    const body = await res.json() as any;
    expect(body.before).toBeNull();
    expect(body.after).toBeNull();
  });

  it("returns before/after comparison with enough days", async () => {
    // Seed attempts across 2 different days
    const sid = seedSession(ctx.db);
    const day1 = "2025-01-01T10:00:00.000Z";
    const day2 = "2025-01-10T10:00:00.000Z";

    ctx.db.prepare(
      `INSERT INTO attempts (id, collection_id, session_id, mode, flag, guess, correct, forgotten, confidence, reaction_time_ms, ts, accidental)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    ).run(crypto.randomUUID(), "world", sid, "classic", "gb", "gb", 1, 0, 3, 1500, day1, 0);

    ctx.db.prepare(
      `INSERT INTO attempts (id, collection_id, session_id, mode, flag, guess, correct, forgotten, confidence, reaction_time_ms, ts, accidental)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    ).run(crypto.randomUUID(), "world", sid, "classic", "fr", "fr", 1, 0, 3, 1200, day2, 0);

    const res = await get(ctx.app, "/api/world/stats/comparison");
    const body = await res.json() as any;
    expect(body.before).not.toBeNull();
    expect(body.after).not.toBeNull();
    expect(body.before.attempts).toBeGreaterThanOrEqual(1);
    expect(body.after.attempts).toBeGreaterThanOrEqual(1);
  });
});

describe("GET /api/:collection/stats/percentiles", () => {
  it("returns null for insufficient data", async () => {
    seedProgressData(); // Only 4 attempts, threshold is 10

    const res = await get(ctx.app, "/api/world/stats/percentiles");
    const body = await res.json() as any;
    expect(body.global).toBeNull();
  });

  it("computes percentiles with enough data", async () => {
    const sid = seedSession(ctx.db);
    for (let i = 0; i < 15; i++) {
      seedClassicAttempt(ctx.db, sid, { flag: "gb", correct: 1, reactionTimeMs: 1000 + i * 100 });
    }

    const res = await get(ctx.app, "/api/world/stats/percentiles");
    const body = await res.json() as any;
    expect(body.global).not.toBeNull();
    expect(body.global.p25).toBeTypeOf("number");
    expect(body.global.p75).toBeTypeOf("number");
    expect(body.global.p25).toBeLessThanOrEqual(body.global.p75);
    expect(body.by_mode).toHaveProperty("classic");
  });
});

describe("GET /api/:collection/stats/reaction-times", () => {
  it("returns average reaction times per flag", async () => {
    seedProgressData();

    const res = await get(ctx.app, "/api/world/stats/reaction-times");
    const body = await res.json() as any;
    expect(body.reaction_times.length).toBeGreaterThan(0);
    const gb = body.reaction_times.find((r: any) => r.flag === "gb");
    expect(gb).toBeDefined();
    expect(gb.avg_ms).toBeTypeOf("number");
  });
});
