import { Hono } from "hono";
import { eq, asc } from "drizzle-orm";
import { UpdateSettingSchema } from "@flag-quiz/shared";
import { requireAuth } from "../middleware/auth.js";
import { settings } from "../schema.js";
import type { DrizzleDb } from "../drizzle.js";

export function settingsRoutes(db: DrizzleDb) {
  return new Hono()
    .use("*", requireAuth)
    .get("/settings", (c) => {
      const rows = db
        .select()
        .from(settings)
        .orderBy(asc(settings.category), asc(settings.key))
        .all();
      return c.json({ ok: true as const, settings: rows });
    })
    .put("/settings/:key", async (c) => {
      const key = c.req.param("key");

      const existing = db
        .select()
        .from(settings)
        .where(eq(settings.key, key))
        .get();
      if (!existing) {
        return c.json({ ok: false as const, error: "Setting not found" }, 404);
      }

      const body = await c.req.json();
      const parsed = UpdateSettingSchema.safeParse(body);

      if (!parsed.success) {
        return c.json({ ok: false as const, error: parsed.error.flatten() }, 400);
      }

      const { value } = parsed.data;

      if (existing.type === "number" && isNaN(Number(value))) {
        return c.json({ ok: false as const, error: `Expected a numeric value for this setting` }, 400);
      }
      if (existing.type === "boolean" && value !== "true" && value !== "false") {
        return c.json({ ok: false as const, error: `Expected "true" or "false" for this setting` }, 400);
      }

      db.update(settings)
        .set({ value })
        .where(eq(settings.key, key))
        .run();

      return c.json({ ok: true as const });
    });
}
