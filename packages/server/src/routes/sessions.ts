import { Hono } from "hono";
import type Database from "better-sqlite3";
import { CreateSessionSchema, UpdateSessionSchema } from "@flag-quiz/shared";
import { requireAuth } from "../middleware/auth.js";

export function sessionRoutes(db: Database.Database): Hono {
  const app = new Hono();

  app.use("*", requireAuth);

  // Create session
  app.post("/sessions", async (c) => {
    const body = await c.req.json();
    const parsed = CreateSessionSchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ ok: false, error: parsed.error.flatten() }, 400);
    }

    const { id, mode, exit_condition, quick, started } = parsed.data;

    const stmt = db.prepare(`
      INSERT INTO sessions (id, mode, exit_condition, quick, started)
      VALUES (?, ?, ?, ?, ?)
    `);

    try {
      stmt.run(id, mode, exit_condition, quick ? 1 : 0, started);
      return c.json({ ok: true, id }, 201);
    } catch (err: any) {
      if (err.message?.includes("UNIQUE constraint")) {
        return c.json({ ok: false, error: "Session already exists" }, 409);
      }
      throw err;
    }
  });

  // Update session (set ended timestamp)
  app.put("/sessions/:id", async (c) => {
    const id = c.req.param("id");
    const body = await c.req.json();
    const parsed = UpdateSessionSchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ ok: false, error: parsed.error.flatten() }, 400);
    }

    const stmt = db.prepare(`UPDATE sessions SET ended = ? WHERE id = ?`);
    const result = stmt.run(parsed.data.ended, id);

    if (result.changes === 0) {
      return c.json({ ok: false, error: "Session not found" }, 404);
    }

    return c.json({ ok: true });
  });

  // List sessions with attempt counts and accuracy
  app.get("/sessions", (c) => {
    const limit = Math.min(parseInt(c.req.query("limit") || "50", 10), 200);
    const offset = parseInt(c.req.query("offset") || "0", 10);

    const stmt = db.prepare(`
      SELECT
        s.*,
        COALESCE(ca.cnt, 0) + COALESCE(pf.cnt, 0) + COALESCE(pc.cnt, 0) AS attempt_count,
        CASE
          WHEN (COALESCE(ca.cnt, 0) + COALESCE(pf.cnt, 0) + COALESCE(pc.cnt, 0)) = 0 THEN 0
          ELSE ROUND(
            (COALESCE(ca.correct_cnt, 0) + COALESCE(pf.correct_cnt, 0) + COALESCE(pc.correct_cnt, 0)) * 100.0 /
            (COALESCE(ca.cnt, 0) + COALESCE(pf.cnt, 0) + COALESCE(pc.cnt, 0)),
            1
          )
        END AS accuracy
      FROM sessions s
      LEFT JOIN (
        SELECT session_id, COUNT(*) AS cnt, SUM(correct) AS correct_cnt
        FROM classic_attempts GROUP BY session_id
      ) ca ON ca.session_id = s.id
      LEFT JOIN (
        SELECT session_id, COUNT(*) AS cnt, SUM(correct) AS correct_cnt
        FROM pick_flag_attempts GROUP BY session_id
      ) pf ON pf.session_id = s.id
      LEFT JOIN (
        SELECT session_id, COUNT(*) AS cnt, SUM(correct) AS correct_cnt
        FROM pick_country_attempts GROUP BY session_id
      ) pc ON pc.session_id = s.id
      ORDER BY s.started DESC
      LIMIT ? OFFSET ?
    `);

    const sessions = stmt.all(limit, offset);

    const countStmt = db.prepare(`SELECT COUNT(*) AS total FROM sessions`);
    const { total } = countStmt.get() as { total: number };

    return c.json({ ok: true, sessions, total });
  });

  // Get single session with attempts
  app.get("/sessions/:id", (c) => {
    const id = c.req.param("id");

    const sessionStmt = db.prepare(`SELECT * FROM sessions WHERE id = ?`);
    const session = sessionStmt.get(id) as any;

    if (!session) {
      return c.json({ ok: false, error: "Session not found" }, 404);
    }

    const modeTableMap: Record<string, string> = {
      classic: "classic_attempts",
      "pick-the-flag": "pick_flag_attempts",
      "pick-the-country": "pick_country_attempts",
    };

    const table = modeTableMap[session.mode];
    let attempts: any[] = [];

    if (table) {
      const attemptsStmt = db.prepare(
        `SELECT * FROM ${table} WHERE session_id = ? ORDER BY ts ASC`
      );
      attempts = attemptsStmt.all(id) as any[];

      // Convert SQLite integers back to booleans, parse JSON arrays
      attempts = attempts.map((a) => {
        const result = { ...a, correct: a.correct === 1 };
        if ("forgotten" in a) {
          result.forgotten = a.forgotten === 1;
        }
        if ("options" in a && typeof a.options === "string") {
          result.options = JSON.parse(a.options);
        }
        return result;
      });
    }

    return c.json({ ok: true, session, attempts });
  });

  return app;
}
