import { Hono } from "hono";
import type Database from "better-sqlite3";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;

const attempts: { ts: number }[] = [];

function isRateLimited(): boolean {
  const now = Date.now();
  // Remove expired entries
  while (attempts.length > 0 && now - attempts[0].ts > RATE_LIMIT_WINDOW_MS) {
    attempts.shift();
  }
  return attempts.length >= RATE_LIMIT_MAX;
}

export function authRoutes(_db: Database.Database): Hono {
  const app = new Hono();

  app.post("/auth/check", async (c) => {
    if (isRateLimited()) {
      return c.json({ ok: false, error: "Too many attempts" }, 429);
    }

    attempts.push({ ts: Date.now() });

    const body = await c.req.json<{ password?: string }>();
    const expected = process.env.APP_PASSWORD;

    if (!expected || body.password !== expected) {
      return c.json({ ok: false, error: "Invalid password" }, 401);
    }

    return c.json({ ok: true, token: expected });
  });

  return app;
}
