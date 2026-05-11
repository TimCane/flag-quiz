import { Hono } from "hono";
import { eq, asc } from "drizzle-orm";
import { UpsertFlagProgressSchema } from "@flag-quiz/shared";
import { requireAuth } from "../middleware/auth.js";
import { requireCollection, isFlagInCollection } from "../middleware/collection.js";
import { flagProgress } from "../schema.js";
import type { DrizzleDb } from "../drizzle.js";

export function flagProgressRoutes(db: DrizzleDb) {
  return new Hono<{ Variables: { collectionId: string } }>()
    .use("*", requireAuth)
    .use("*", requireCollection)
    .get("/flag-progress", (c) => {
      const collectionId = c.get("collectionId");
      const records = db
        .select()
        .from(flagProgress)
        .where(eq(flagProgress.collection_id, collectionId))
        .orderBy(asc(flagProgress.flag))
        .all();
      return c.json({ ok: true as const, records });
    })
    .post("/flag-progress", async (c) => {
      const collectionId = c.get("collectionId");
      const body = await c.req.json();
      const parsed = UpsertFlagProgressSchema.safeParse(body);

      if (!parsed.success) {
        return c.json({ ok: false as const, error: parsed.error.flatten() }, 400);
      }

      const d = parsed.data;
      if (!isFlagInCollection(collectionId, d.flag)) {
        return c.json({ ok: false as const, error: "Unknown flag in this collection" }, 400);
      }

      db.insert(flagProgress)
        .values({
          collection_id: collectionId,
          flag: d.flag,
          mnemonic: d.mnemonic,
          stability: d.stability,
          difficulty: d.difficulty,
          state: d.state,
          last_review: d.last_review,
          due: d.due,
          updated_at: d.updated_at,
        })
        .onConflictDoUpdate({
          target: [flagProgress.collection_id, flagProgress.flag],
          set: {
            mnemonic: d.mnemonic,
            stability: d.stability,
            difficulty: d.difficulty,
            state: d.state,
            last_review: d.last_review,
            due: d.due,
            updated_at: d.updated_at,
          },
        })
        .run();

      return c.json({ ok: true as const, flag: d.flag }, 201);
    });
}
