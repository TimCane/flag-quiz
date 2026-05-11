import { Hono } from "hono";
import { eq, and, lte, gt, count } from "drizzle-orm";
import { collections } from "@flag-quiz/shared";
import { requireAuth } from "../middleware/auth.js";
import { flagProgress } from "../schema.js";
import type { DrizzleDb } from "../drizzle.js";

export function deckRoutes(db: DrizzleDb) {
  return new Hono()
    .use("*", requireAuth)
    .get("/decks", (c) => {
      const nowIso = new Date().toISOString();

      const decks = collections.map((collection) => {
        const flagCount = collection.flags.length;

        const dueRow = db
          .select({ cnt: count() })
          .from(flagProgress)
          .where(and(
            eq(flagProgress.collection_id, collection.id),
            lte(flagProgress.due, nowIso),
          ))
          .get();
        const dueCount = dueRow?.cnt ?? 0;

        const seenRow = db
          .select({ cnt: count() })
          .from(flagProgress)
          .where(and(
            eq(flagProgress.collection_id, collection.id),
            gt(flagProgress.state, 0),
          ))
          .get();
        const seenCount = seenRow?.cnt ?? 0;
        const newCount = Math.max(flagCount - seenCount, 0);

        return {
          id: collection.id,
          name: collection.name,
          description: collection.description,
          groupLabel: collection.groupLabel,
          flagCount,
          dueCount,
          newCount,
          sampleFlags: collection.flags.slice(0, 4).map((f) => ({
            code: f.code,
            name: f.name,
            ext: f.ext,
          })),
        };
      });

      return c.json({ ok: true as const, decks });
    });
}
