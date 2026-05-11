import { Hono } from "hono";
import { eq, and, asc } from "drizzle-orm";
import {
  CreateTagSchema,
  UpdateTagSchema,
  SetFlagTagsSchema,
  ReorderTagsSchema,
} from "@flag-quiz/shared";
import { requireAuth } from "../middleware/auth.js";
import { requireCollection, isFlagInCollection } from "../middleware/collection.js";
import { tags, flagTags } from "../schema.js";
import type { DrizzleDb } from "../drizzle.js";

export function tagRoutes(db: DrizzleDb) {
  return new Hono<{ Variables: { collectionId: string } }>()
    .use("*", requireAuth)
    .use("*", requireCollection)
    .get("/tags", (c) => {
      const collectionId = c.get("collectionId");
      const rows = db
        .select()
        .from(tags)
        .where(eq(tags.collection_id, collectionId))
        .orderBy(asc(tags.sort_order))
        .all();
      return c.json({ ok: true as const, tags: rows });
    })
    .post("/tags", async (c) => {
      const collectionId = c.get("collectionId");
      const body = await c.req.json();
      const parsed = CreateTagSchema.safeParse(body);

      if (!parsed.success) {
        return c.json({ ok: false as const, error: parsed.error.flatten() }, 400);
      }

      const d = parsed.data;
      db.insert(tags)
        .values({
          id: d.id,
          collection_id: collectionId,
          name: d.name,
          sort_order: d.sort_order,
          description: d.description,
          type: d.type,
          updated_at: d.updated_at,
        })
        .run();

      return c.json({ ok: true as const, id: d.id }, 201);
    })
    .put("/tags/reorder", async (c) => {
      const collectionId = c.get("collectionId");
      const body = await c.req.json();
      const parsed = ReorderTagsSchema.safeParse(body);

      if (!parsed.success) {
        return c.json({ ok: false as const, error: parsed.error.flatten() }, 400);
      }

      db.transaction((tx) => {
        for (const item of parsed.data.order) {
          tx.update(tags)
            .set({ sort_order: item.sort_order, updated_at: parsed.data.updated_at })
            .where(and(eq(tags.id, item.id), eq(tags.collection_id, collectionId)))
            .run();
        }
      });

      return c.json({ ok: true as const });
    })
    .put("/tags/:id", async (c) => {
      const collectionId = c.get("collectionId");
      const id = c.req.param("id");

      const existing = db
        .select({ id: tags.id })
        .from(tags)
        .where(and(eq(tags.id, id), eq(tags.collection_id, collectionId)))
        .get();
      if (!existing) {
        return c.json({ ok: false as const, error: "Tag not found" }, 404);
      }

      const body = await c.req.json();
      const parsed = UpdateTagSchema.safeParse(body);

      if (!parsed.success) {
        return c.json({ ok: false as const, error: parsed.error.flatten() }, 400);
      }

      const d = parsed.data;
      db.update(tags)
        .set({
          name: d.name,
          sort_order: d.sort_order,
          description: d.description,
          type: d.type,
          updated_at: d.updated_at,
        })
        .where(and(eq(tags.id, id), eq(tags.collection_id, collectionId)))
        .run();

      return c.json({ ok: true as const });
    })
    .delete("/tags/:id", (c) => {
      const collectionId = c.get("collectionId");
      const id = c.req.param("id");

      const existing = db
        .select({ id: tags.id })
        .from(tags)
        .where(and(eq(tags.id, id), eq(tags.collection_id, collectionId)))
        .get();
      if (!existing) {
        return c.json({ ok: false as const, error: "Tag not found" }, 404);
      }

      db.delete(tags)
        .where(and(eq(tags.id, id), eq(tags.collection_id, collectionId)))
        .run();
      return c.json({ ok: true as const });
    })
    .get("/flag-tags", (c) => {
      const collectionId = c.get("collectionId");
      const rows = db
        .select()
        .from(flagTags)
        .where(eq(flagTags.collection_id, collectionId))
        .orderBy(asc(flagTags.flag), asc(flagTags.tag_id))
        .all();
      return c.json({ ok: true as const, flag_tags: rows });
    })
    .put("/flag-tags/:flag", async (c) => {
      const collectionId = c.get("collectionId");
      const flag = c.req.param("flag");

      if (!isFlagInCollection(collectionId, flag)) {
        return c.json({ ok: false as const, error: "Unknown flag in this collection" }, 400);
      }

      const body = await c.req.json();
      const parsed = SetFlagTagsSchema.safeParse({ ...body, flag });

      if (!parsed.success) {
        return c.json({ ok: false as const, error: parsed.error.flatten() }, 400);
      }

      const d = parsed.data;
      db.transaction((tx) => {
        tx.delete(flagTags)
          .where(and(eq(flagTags.collection_id, collectionId), eq(flagTags.flag, d.flag)))
          .run();
        for (const tagId of d.tag_ids) {
          tx.insert(flagTags)
            .values({ collection_id: collectionId, flag: d.flag, tag_id: tagId, updated_at: d.updated_at })
            .run();
        }
      });

      return c.json({ ok: true as const });
    });
}
