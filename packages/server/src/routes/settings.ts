import { Hono } from "hono";
import type Database from "better-sqlite3";
import { UpdateSettingSchema } from "@flag-quiz/shared";
import { requireAuth } from "../middleware/auth.js";

export function settingsRoutes(db: Database.Database): Hono {
  const app = new Hono();

  app.use("*", requireAuth);

  // Get all settings
  app.get("/settings", (c) => {
    const stmt = db.prepare(`SELECT * FROM settings ORDER BY category, key`);
    const settings = stmt.all();
    return c.json({ ok: true, settings });
  });

  // Update a setting value
  app.put("/settings/:key", async (c) => {
    const key = c.req.param("key");

    // Check that the setting exists
    const existing = db.prepare(`SELECT * FROM settings WHERE key = ?`).get(key);
    if (!existing) {
      return c.json({ ok: false, error: "Setting not found" }, 404);
    }

    const body = await c.req.json();
    const parsed = UpdateSettingSchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ ok: false, error: parsed.error.flatten() }, 400);
    }

    const stmt = db.prepare(`UPDATE settings SET value = ? WHERE key = ?`);
    stmt.run(parsed.data.value, key);

    return c.json({ ok: true });
  });

  return app;
}
