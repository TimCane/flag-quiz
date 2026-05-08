import { Hono } from "hono";
import type Database from "better-sqlite3";
import {
  ClassicAttemptSchema,
  PickFlagAttemptSchema,
  PickCountryAttemptSchema,
} from "@flag-quiz/shared";
import { requireAuth } from "../middleware/auth.js";

export function attemptRoutes(db: Database.Database): Hono {
  const app = new Hono();

  app.use("*", requireAuth);

  // Save classic attempt
  app.post("/classic-attempts", async (c) => {
    const body = await c.req.json();
    const parsed = ClassicAttemptSchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ ok: false, error: parsed.error.flatten() }, 400);
    }

    const d = parsed.data;
    const stmt = db.prepare(`
      INSERT INTO classic_attempts (id, session_id, flag, guess, correct, forgotten, confidence, reaction_time_ms, ts)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      d.id,
      d.session_id,
      d.flag,
      d.guess,
      d.correct ? 1 : 0,
      d.forgotten ? 1 : 0,
      d.confidence,
      d.reaction_time_ms,
      d.ts
    );

    return c.json({ ok: true, id: d.id }, 201);
  });

  // Save pick-flag attempt
  app.post("/pick-flag-attempts", async (c) => {
    const body = await c.req.json();
    const parsed = PickFlagAttemptSchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ ok: false, error: parsed.error.flatten() }, 400);
    }

    const d = parsed.data;
    const stmt = db.prepare(`
      INSERT INTO pick_flag_attempts (id, session_id, flag, guess, options, correct, confidence, reaction_time_ms, ts)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      d.id,
      d.session_id,
      d.flag,
      d.guess,
      JSON.stringify(d.options),
      d.correct ? 1 : 0,
      d.confidence,
      d.reaction_time_ms,
      d.ts
    );

    return c.json({ ok: true, id: d.id }, 201);
  });

  // Save pick-country attempt
  app.post("/pick-country-attempts", async (c) => {
    const body = await c.req.json();
    const parsed = PickCountryAttemptSchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ ok: false, error: parsed.error.flatten() }, 400);
    }

    const d = parsed.data;
    const stmt = db.prepare(`
      INSERT INTO pick_country_attempts (id, session_id, flag, guess, options, correct, confidence, reaction_time_ms, ts)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      d.id,
      d.session_id,
      d.flag,
      d.guess,
      JSON.stringify(d.options),
      d.correct ? 1 : 0,
      d.confidence,
      d.reaction_time_ms,
      d.ts
    );

    return c.json({ ok: true, id: d.id }, 201);
  });

  // Get all wrong guesses across all tables (for building confusion map)
  app.get("/attempts/wrong-guesses", (c) => {
    const wrong_guesses: { flag: string; guess: string }[] = [];

    const classicStmt = db.prepare(
      `SELECT flag, guess FROM classic_attempts WHERE correct = 0 AND guess IS NOT NULL AND guess != ''`
    );
    for (const row of classicStmt.all() as { flag: string; guess: string }[]) {
      wrong_guesses.push(row);
    }

    const pickFlagStmt = db.prepare(
      `SELECT flag, guess FROM pick_flag_attempts WHERE correct = 0`
    );
    for (const row of pickFlagStmt.all() as { flag: string; guess: string }[]) {
      wrong_guesses.push(row);
    }

    const pickCountryStmt = db.prepare(
      `SELECT flag, guess FROM pick_country_attempts WHERE correct = 0`
    );
    for (const row of pickCountryStmt.all() as { flag: string; guess: string }[]) {
      wrong_guesses.push(row);
    }

    return c.json({ ok: true, wrong_guesses });
  });

  // Get all attempts for a specific flag across all tables
  app.get("/attempts/:flag", (c) => {
    const flag = c.req.param("flag");

    const classicStmt = db.prepare(
      `SELECT * FROM classic_attempts WHERE flag = ? ORDER BY ts ASC`
    );
    const classic = (classicStmt.all(flag) as any[]).map((a) => ({
      ...a,
      correct: a.correct === 1,
      forgotten: a.forgotten === 1,
    }));

    const pickFlagStmt = db.prepare(
      `SELECT * FROM pick_flag_attempts WHERE flag = ? ORDER BY ts ASC`
    );
    const pick_flag = (pickFlagStmt.all(flag) as any[]).map((a) => ({
      ...a,
      correct: a.correct === 1,
      options: JSON.parse(a.options),
    }));

    const pickCountryStmt = db.prepare(
      `SELECT * FROM pick_country_attempts WHERE flag = ? ORDER BY ts ASC`
    );
    const pick_country = (pickCountryStmt.all(flag) as any[]).map((a) => ({
      ...a,
      correct: a.correct === 1,
      options: JSON.parse(a.options),
    }));

    return c.json({ ok: true, classic, pick_flag, pick_country });
  });

  return app;
}
