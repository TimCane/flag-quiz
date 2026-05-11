import { Hono } from "hono";
import crypto from "crypto";
import { lt, eq, count, sql } from "drizzle-orm";
import { rateLimit } from "../schema.js";
import type { DrizzleDb } from "../drizzle.js";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;

function deriveToken(password: string): string {
  return crypto.createHmac("sha256", password).update("flag-quiz-token").digest("hex");
}

function ensureRateLimitTable(db: DrizzleDb): void {
  // Table is created by db.ts init; this is a no-op safety net.
  db.run(sql`CREATE TABLE IF NOT EXISTS rate_limit (ip TEXT NOT NULL, ts INTEGER NOT NULL)`);
  db.run(sql`CREATE INDEX IF NOT EXISTS idx_rate_limit_ip_ts ON rate_limit(ip, ts)`);
}

function isRateLimited(db: DrizzleDb, ip: string): boolean {
  const cutoff = Date.now() - RATE_LIMIT_WINDOW_MS;
  db.delete(rateLimit).where(lt(rateLimit.ts, cutoff)).run();
  const row = db
    .select({ cnt: count() })
    .from(rateLimit)
    .where(eq(rateLimit.ip, ip))
    .get();
  return (row?.cnt ?? 0) >= RATE_LIMIT_MAX;
}

function recordAttempt(db: DrizzleDb, ip: string): void {
  db.insert(rateLimit).values({ ip, ts: Date.now() }).run();
}

export function authRoutes(db: DrizzleDb) {
  ensureRateLimitTable(db);

  return new Hono()
    .post("/auth/check", async (c) => {
      const ip = c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "unknown";

      if (isRateLimited(db, ip)) {
        return c.json({ ok: false as const, error: "Too many attempts" }, 429);
      }

      recordAttempt(db, ip);

      const body = await c.req.json<{ password?: string }>();
      const expected = process.env.APP_PASSWORD;

      if (!expected || body.password !== expected) {
        return c.json({ ok: false as const, error: "Invalid password" }, 401);
      }

      return c.json({ ok: true as const, token: deriveToken(expected) });
    });
}
