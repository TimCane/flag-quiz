import { Hono } from "hono";
import { eq, and, sql } from "drizzle-orm";
import { CreateSessionSchema, UpdateSessionSchema } from "@flag-quiz/shared";
import { requireAuth } from "../middleware/auth.js";
import { requireCollection } from "../middleware/collection.js";
import { sessions, attempts } from "../schema.js";
import type { DrizzleDb } from "../drizzle.js";

export function sessionRoutes(db: DrizzleDb) {
  return new Hono<{ Variables: { collectionId: string } }>()
    .use("*", requireAuth)
    .use("*", requireCollection)
    .post("/sessions", async (c) => {
      const collectionId = c.get("collectionId");
      const body = await c.req.json();
      const parsed = CreateSessionSchema.safeParse(body);

      if (!parsed.success) {
        return c.json({ ok: false as const, error: parsed.error.flatten() }, 400);
      }

      const { id, mode, exit_condition, quick, started } = parsed.data;

      try {
        db.insert(sessions)
          .values({
            id,
            collection_id: collectionId,
            mode,
            exit_condition,
            quick: quick ? 1 : 0,
            started,
          })
          .run();
        return c.json({ ok: true as const, id }, 201);
      } catch (err: any) {
        if (err.message?.includes("UNIQUE constraint")) {
          return c.json({ ok: false as const, error: "Session already exists" }, 409);
        }
        throw err;
      }
    })
    .put("/sessions/:id", async (c) => {
      const collectionId = c.get("collectionId");
      const id = c.req.param("id");
      const body = await c.req.json();
      const parsed = UpdateSessionSchema.safeParse(body);

      if (!parsed.success) {
        return c.json({ ok: false as const, error: parsed.error.flatten() }, 400);
      }

      // Check if session has attempts via the all_attempts view (raw SQL — view not in Drizzle schema)
      const hasAttempts = db.get<{ x: number }>(
        sql`SELECT 1 AS x FROM all_attempts WHERE session_id = ${id} AND collection_id = ${collectionId} LIMIT 1`,
      );

      if (!hasAttempts) {
        db.delete(sessions)
          .where(and(eq(sessions.id, id), eq(sessions.collection_id, collectionId)))
          .run();
        return c.json({ ok: true as const, deleted: true });
      }

      const result = db.update(sessions)
        .set({ ended: parsed.data.ended })
        .where(and(eq(sessions.id, id), eq(sessions.collection_id, collectionId)))
        .run();

      if (result.changes === 0) {
        return c.json({ ok: false as const, error: "Session not found" }, 404);
      }

      return c.json({ ok: true as const });
    })
    .get("/sessions", (c) => {
      const collectionId = c.get("collectionId");
      const limit = Math.min(parseInt(c.req.query("limit") || "50", 10) || 50, 200);
      const offset = Math.max(parseInt(c.req.query("offset") || "0", 10) || 0, 0);

      // Complex LEFT JOIN with aggregate subquery — raw SQL via Drizzle sql template
      const rows = db.all<{
        id: string;
        collection_id: string;
        mode: string;
        exit_condition: string;
        quick: number;
        started: string;
        ended: string | null;
        created_at: string;
        attempt_count: number;
        accuracy: number;
      }>(sql`
        SELECT
          s.*,
          COALESCE(a.cnt, 0) AS attempt_count,
          CASE WHEN COALESCE(a.cnt, 0) = 0 THEN 0
            ELSE ROUND(COALESCE(a.correct_cnt, 0) * 100.0 / a.cnt, 1)
          END AS accuracy
        FROM sessions s
        LEFT JOIN (
          SELECT session_id, COUNT(*) AS cnt, SUM(correct) AS correct_cnt
          FROM all_attempts WHERE collection_id = ${collectionId} GROUP BY session_id
        ) a ON a.session_id = s.id
        WHERE s.collection_id = ${collectionId}
        ORDER BY s.started DESC
        LIMIT ${limit} OFFSET ${offset}
      `);

      const totalRow = db.get<{ total: number }>(
        sql`SELECT COUNT(*) AS total FROM sessions WHERE collection_id = ${collectionId}`,
      );

      return c.json({ ok: true as const, sessions: rows, total: totalRow?.total ?? 0 });
    })
    .get("/sessions/:id", (c) => {
      const collectionId = c.get("collectionId");
      const id = c.req.param("id");

      const session = db
        .select()
        .from(sessions)
        .where(and(eq(sessions.id, id), eq(sessions.collection_id, collectionId)))
        .get();

      if (!session) {
        return c.json({ ok: false as const, error: "Session not found" }, 404);
      }

      const rows = db
        .select()
        .from(attempts)
        .where(and(eq(attempts.session_id, id), eq(attempts.collection_id, collectionId)))
        .orderBy(attempts.ts)
        .all();

      const mapped = rows.map((a) => {
        const result: Record<string, unknown> = { ...a, correct: a.correct === 1 };
        if (a.forgotten !== undefined) {
          result.forgotten = a.forgotten === 1;
        }
        if (typeof a.options === "string") {
          try {
            result.options = JSON.parse(a.options);
          } catch {
            result.options = [];
          }
        }
        return result;
      });

      return c.json({ ok: true as const, session, attempts: mapped });
    });
}
