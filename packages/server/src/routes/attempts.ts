import { Hono } from "hono";
import { sql, eq, and } from "drizzle-orm";
import {
  ClassicAttemptSchema,
  PickAttemptSchema,
  Mode,
} from "@flag-quiz/shared";
import { requireAuth } from "../middleware/auth.js";
import { requireCollection, isFlagInCollection } from "../middleware/collection.js";
import { attempts } from "../schema.js";
import type { DrizzleDb } from "../drizzle.js";

function safeParseJson(value: string | undefined | null): unknown[] {
  if (!value) return [];
  try {
    return JSON.parse(value);
  } catch {
    console.warn("Corrupted JSON in attempt options column:", value.slice(0, 100));
    return [];
  }
}

type AttemptSchema = typeof ClassicAttemptSchema | typeof PickAttemptSchema;

function createAttemptHandler(db: DrizzleDb, schema: AttemptSchema, mode: string) {
  return async (c: any) => {
    const collectionId = c.get("collectionId");
    const body = await c.req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return c.json({ ok: false as const, error: parsed.error?.flatten() }, 400);
    }

    const d = parsed.data;
    if (!isFlagInCollection(collectionId, d.flag)) {
      return c.json({ ok: false as const, error: "Unknown flag in this collection" }, 400);
    }

    db.insert(attempts)
      .values({
        id: d.id,
        collection_id: collectionId,
        session_id: d.session_id,
        mode,
        flag: d.flag,
        guess: d.guess ?? null,
        correct: d.correct ? 1 : 0,
        forgotten: "forgotten" in d ? (d.forgotten ? 1 : 0) : 0,
        confidence: d.confidence,
        reaction_time_ms: d.reaction_time_ms,
        ts: d.ts,
        accidental: d.accidental ? 1 : 0,
        options: "options" in d ? JSON.stringify(d.options) : null,
      })
      .run();
    return c.json({ ok: true as const, id: d.id }, 201);
  };
}

export function attemptRoutes(db: DrizzleDb) {
  return new Hono<{ Variables: { collectionId: string } }>()
    .use("*", requireAuth)
    .use("*", requireCollection)
    .post("/classic-attempts", createAttemptHandler(db, ClassicAttemptSchema, Mode.CLASSIC))
    .post("/pick-flag-attempts", createAttemptHandler(db, PickAttemptSchema, Mode.PICK_THE_FLAG))
    .post("/pick-item-attempts", createAttemptHandler(db, PickAttemptSchema, Mode.PICK_THE_ITEM))
    .get("/attempts/wrong-guesses", (c) => {
      const collectionId = c.get("collectionId");
      const wrong_guesses = db.all<{ flag: string; guess: string }>(
        sql`SELECT flag, guess FROM all_attempts
            WHERE collection_id = ${collectionId} AND correct = 0 AND accidental = 0
            AND guess IS NOT NULL AND guess != ''`,
      );

      return c.json({ ok: true as const, wrong_guesses });
    })
    .get("/attempts/:flag", (c) => {
      const collectionId = c.get("collectionId");
      const flag = c.req.param("flag");

      if (!isFlagInCollection(collectionId, flag)) {
        return c.json({ ok: false as const, error: "Unknown flag in this collection" }, 400);
      }

      const rows = db
        .select()
        .from(attempts)
        .where(and(eq(attempts.collection_id, collectionId), eq(attempts.flag, flag)))
        .orderBy(attempts.ts)
        .all();

      const classic = rows.filter((a) => a.mode === Mode.CLASSIC).map((a) => ({
        ...a,
        correct: a.correct === 1,
        forgotten: a.forgotten === 1,
        options: undefined,
      }));
      const pick_flag = rows.filter((a) => a.mode === Mode.PICK_THE_FLAG).map((a) => ({
        ...a,
        correct: a.correct === 1,
        options: safeParseJson(a.options),
      }));
      const pick_item = rows.filter((a) => a.mode === Mode.PICK_THE_ITEM).map((a) => ({
        ...a,
        correct: a.correct === 1,
        options: safeParseJson(a.options),
      }));

      return c.json({ ok: true as const, classic, pick_flag, pick_item });
    });
}
