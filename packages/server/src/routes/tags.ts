import { Hono } from "hono";
import type Database from "better-sqlite3";
import {
  CreateTagSchema,
  UpdateTagSchema,
  SetFlagTagsSchema,
  ReorderTagsSchema,
} from "@flag-quiz/shared";
import { requireAuth } from "../middleware/auth.js";

export function tagRoutes(db: Database.Database): Hono {
  const app = new Hono();

  app.use("*", requireAuth);

  // Get all tags
  app.get("/tags", (c) => {
    const tags = db.prepare(`SELECT * FROM tags ORDER BY sort_order ASC`).all();
    return c.json({ ok: true, tags });
  });

  // Create a tag
  app.post("/tags", async (c) => {
    const body = await c.req.json();
    const parsed = CreateTagSchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ ok: false, error: parsed.error.flatten() }, 400);
    }

    const d = parsed.data;
    db.prepare(
      `INSERT INTO tags (id, name, sort_order, description, type, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(d.id, d.name, d.sort_order, d.description, d.type, d.updated_at);

    return c.json({ ok: true, id: d.id }, 201);
  });

  // Reorder tags
  app.put("/tags/reorder", async (c) => {
    const body = await c.req.json();
    const parsed = ReorderTagsSchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ ok: false, error: parsed.error.flatten() }, 400);
    }

    const stmt = db.prepare(
      `UPDATE tags SET sort_order = ?, updated_at = ? WHERE id = ?`,
    );
    const reorder = db.transaction(() => {
      for (const item of parsed.data.order) {
        stmt.run(item.sort_order, parsed.data.updated_at, item.id);
      }
    });
    reorder();

    return c.json({ ok: true });
  });

  app.put("/tags/:id", async (c) => {
    const id = c.req.param("id");

    const existing = db.prepare(`SELECT id FROM tags WHERE id = ?`).get(id);
    if (!existing) {
      return c.json({ ok: false, error: "Tag not found" }, 404);
    }

    const body = await c.req.json();
    const parsed = UpdateTagSchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ ok: false, error: parsed.error.flatten() }, 400);
    }

    const d = parsed.data;
    db.prepare(
      `UPDATE tags SET name = ?, sort_order = ?, description = ?, type = ?, updated_at = ? WHERE id = ?`,
    ).run(d.name, d.sort_order, d.description, d.type, d.updated_at, id);

    return c.json({ ok: true });
  });

  // Delete a tag
  app.delete("/tags/:id", (c) => {
    const id = c.req.param("id");

    const existing = db.prepare(`SELECT id FROM tags WHERE id = ?`).get(id);
    if (!existing) {
      return c.json({ ok: false, error: "Tag not found" }, 404);
    }

    db.prepare(`DELETE FROM tags WHERE id = ?`).run(id);
    return c.json({ ok: true });
  });

  // Get all flag-tag associations
  app.get("/flag-tags", (c) => {
    const flagTags = db
      .prepare(`SELECT * FROM flag_tags ORDER BY flag, tag_id`)
      .all();
    return c.json({ ok: true, flag_tags: flagTags });
  });

  // Set tags for a flag (replace all)
  app.put("/flag-tags/:flag", async (c) => {
    const flag = c.req.param("flag");
    const body = await c.req.json();
    const parsed = SetFlagTagsSchema.safeParse({ ...body, flag });

    if (!parsed.success) {
      return c.json({ ok: false, error: parsed.error.flatten() }, 400);
    }

    const d = parsed.data;
    const setTags = db.transaction(() => {
      db.prepare(`DELETE FROM flag_tags WHERE flag = ?`).run(d.flag);
      const insert = db.prepare(
        `INSERT INTO flag_tags (flag, tag_id, updated_at) VALUES (?, ?, ?)`,
      );
      for (const tagId of d.tag_ids) {
        insert.run(d.flag, tagId, d.updated_at);
      }
    });
    setTags();

    return c.json({ ok: true });
  });

  return app;
}
