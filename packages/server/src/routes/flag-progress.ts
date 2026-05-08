import { Hono } from "hono";
import type Database from "better-sqlite3";
import { UpsertFlagProgressSchema } from "@flag-quiz/shared";
import { requireAuth } from "../middleware/auth.js";

export function flagProgressRoutes(db: Database.Database): Hono {
  const app = new Hono();

  app.use("*", requireAuth);

  // Get all flag progress records
  app.get("/flag-progress", (c) => {
    const stmt = db.prepare(`SELECT * FROM flag_progress ORDER BY flag ASC`);
    const records = stmt.all();
    return c.json({ ok: true, records });
  });

  // Upsert a flag progress record
  app.post("/flag-progress", async (c) => {
    const body = await c.req.json();
    const parsed = UpsertFlagProgressSchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ ok: false, error: parsed.error.flatten() }, 400);
    }

    const d = parsed.data;
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO flag_progress (flag, mnemonic, stability, difficulty, state, last_review, due, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      d.flag,
      d.mnemonic,
      d.stability,
      d.difficulty,
      d.state,
      d.last_review,
      d.due,
      d.updated_at
    );

    return c.json({ ok: true, flag: d.flag }, 201);
  });

  return app;
}
