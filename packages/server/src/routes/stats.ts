import { Hono } from "hono";
import { sql } from "drizzle-orm";
import { requireAuth } from "../middleware/auth.js";
import { requireCollection, isFlagInCollection } from "../middleware/collection.js";
import type { DrizzleDb } from "../drizzle.js";

// All queries use the `all_attempts` view which unions classic_attempts,
// pick_flag_attempts, and pick_item_attempts. Adding a new game mode only
// requires adding a row to the view definition in db.ts.

export function statsRoutes(db: DrizzleDb) {
  return new Hono<{ Variables: { collectionId: string } }>()
    .use("*", requireAuth)
    .use("*", requireCollection)
    .get("/stats", (c) => {
      const cid = c.get("collectionId");

      const attemptStats = db.get<{
        total_attempts: number;
        flags_attempted: number;
        accuracy: number;
      }>(sql`
        SELECT
          COUNT(*) AS total_attempts,
          COUNT(DISTINCT flag) AS flags_attempted,
          CASE WHEN COUNT(*) = 0 THEN 0
            ELSE ROUND(SUM(correct) * 100.0 / COUNT(*), 1)
          END AS accuracy
        FROM all_attempts WHERE collection_id = ${cid} AND accidental = 0
      `)!;

      const totalSessions = db.get<{ total: number }>(
        sql`SELECT COUNT(*) AS total FROM sessions WHERE collection_id = ${cid}`,
      )!;

      const progressBreakdown = db.get<{ flags_mastered: number; flags_learning: number; flags_new: number }>(sql`
        SELECT
          COALESCE(SUM(CASE WHEN state = 3 THEN 1 ELSE 0 END), 0) AS flags_mastered,
          COALESCE(SUM(CASE WHEN state IN (1, 2) THEN 1 ELSE 0 END), 0) AS flags_learning,
          COALESCE(SUM(CASE WHEN state = 0 THEN 1 ELSE 0 END), 0) AS flags_new
        FROM flag_progress WHERE collection_id = ${cid}
      `)!;

      return c.json({
        ok: true as const,
        total_attempts: attemptStats.total_attempts,
        total_sessions: totalSessions.total,
        flags_attempted: attemptStats.flags_attempted,
        accuracy: attemptStats.accuracy,
        flags_mastered: progressBreakdown.flags_mastered,
        flags_learning: progressBreakdown.flags_learning,
        flags_new: progressBreakdown.flags_new,
      });
    })
    .get("/stats/flags", (c) => {
      const cid = c.get("collectionId");
      const rows = db.all<{ flag: string; attempt_count: number; accuracy: number; last_seen: string }>(sql`
        SELECT flag, COUNT(*) AS attempt_count,
          ROUND(SUM(correct) * 100.0 / COUNT(*), 1) AS accuracy,
          MAX(ts) AS last_seen
        FROM all_attempts WHERE collection_id = ${cid} AND accidental = 0
        GROUP BY flag ORDER BY flag ASC
      `);

      return c.json({ ok: true as const, flags: rows });
    })
    .get("/stats/confusions/:flag", (c) => {
      const cid = c.get("collectionId");
      const flag = c.req.param("flag");

      if (!isFlagInCollection(cid, flag)) {
        return c.json({ ok: false as const, error: "Unknown flag in this collection" }, 400);
      }

      const rows = db.all<{ guess: string; count: number }>(sql`
        SELECT guess, COUNT(*) AS count
        FROM all_attempts
        WHERE collection_id = ${cid} AND accidental = 0 AND flag = ${flag} AND correct = 0 AND guess IS NOT NULL AND guess != ''
        GROUP BY guess ORDER BY count DESC
      `);

      return c.json({ ok: true as const, confusions: rows });
    })
    .get("/stats/progress", (c) => {
      const cid = c.get("collectionId");
      const rows = db.all<{ day: string; attempts: number; correct_count: number; accuracy: number }>(sql`
        SELECT date(ts) AS day, COUNT(*) AS attempts,
          SUM(correct) AS correct_count,
          ROUND(SUM(correct) * 100.0 / COUNT(*), 1) AS accuracy
        FROM all_attempts WHERE collection_id = ${cid} AND accidental = 0
        GROUP BY date(ts) ORDER BY day ASC
      `);

      return c.json({ ok: true as const, progress: rows });
    })
    .get("/stats/groups", (c) => {
      const cid = c.get("collectionId");
      const rows = db.all<{ flag: string; attempt_count: number; correct_count: number }>(sql`
        SELECT flag, COUNT(*) AS attempt_count, SUM(correct) AS correct_count
        FROM all_attempts WHERE collection_id = ${cid} AND accidental = 0
        GROUP BY flag
      `);

      return c.json({ ok: true as const, flags: rows });
    })
    .get("/stats/confused-pairs", (c) => {
      const cid = c.get("collectionId");
      const rows = db.all<{ flag: string; guess: string; count: number }>(sql`
        SELECT flag, guess, COUNT(*) AS count
        FROM all_attempts
        WHERE collection_id = ${cid} AND accidental = 0 AND correct = 0 AND guess IS NOT NULL AND guess != ''
        GROUP BY flag, guess ORDER BY count DESC LIMIT 50
      `);

      return c.json({ ok: true as const, pairs: rows });
    })
    .get("/stats/confidence", (c) => {
      const cid = c.get("collectionId");
      const rows = db.all<{ confidence: number; count: number }>(sql`
        SELECT confidence, COUNT(*) AS count
        FROM all_attempts WHERE collection_id = ${cid} AND accidental = 0
        GROUP BY confidence ORDER BY confidence ASC
      `);

      return c.json({ ok: true as const, distribution: rows });
    })
    .get("/stats/activity", (c) => {
      const cid = c.get("collectionId");
      const rows = db.all<{ day: string; count: number }>(sql`
        SELECT date(ts) AS day, COUNT(*) AS count
        FROM all_attempts WHERE collection_id = ${cid} AND accidental = 0
        GROUP BY date(ts) ORDER BY day ASC
      `);

      return c.json({ ok: true as const, activity: rows });
    })
    .get("/stats/sparklines", (c) => {
      const cid = c.get("collectionId");
      const rows = db.all<{ flag: string; correct: number }>(sql`
        SELECT flag, correct FROM (
          SELECT flag, correct,
            ROW_NUMBER() OVER (PARTITION BY flag ORDER BY ts DESC) AS rn
          FROM all_attempts WHERE collection_id = ${cid} AND accidental = 0
        ) WHERE rn <= 30
        ORDER BY flag ASC, rn DESC
      `);

      const sparklines: Record<string, number[]> = {};
      for (const r of rows) {
        if (!sparklines[r.flag]) sparklines[r.flag] = [];
        sparklines[r.flag].push(r.correct);
      }

      return c.json({ ok: true as const, sparklines });
    })
    .get("/stats/hardest", (c) => {
      const cid = c.get("collectionId");
      const rows = db.all<{ flag: string; attempt_count: number; accuracy: number }>(sql`
        SELECT flag, COUNT(*) AS attempt_count,
          ROUND(SUM(correct) * 100.0 / COUNT(*), 1) AS accuracy
        FROM all_attempts WHERE collection_id = ${cid} AND accidental = 0
        GROUP BY flag HAVING COUNT(*) >= 3
        ORDER BY accuracy ASC, attempt_count DESC LIMIT 10
      `);

      return c.json({ ok: true as const, hardest: rows });
    })
    .get("/stats/comparison", (c) => {
      const cid = c.get("collectionId");
      const allDays = db.all<{ day: string }>(sql`
        SELECT DISTINCT date(ts) AS day FROM all_attempts
        WHERE collection_id = ${cid} AND accidental = 0
        ORDER BY day ASC
      `);

      if (allDays.length < 2) {
        return c.json({ ok: true as const, before: null, after: null });
      }

      const firstDay = allDays[0].day;
      const lastDay = allDays[allDays.length - 1].day;

      function getStats(startDay: string, days: number) {
        const end = new Date(startDay);
        end.setDate(end.getDate() + days);
        const endStr = end.toISOString().slice(0, 10);

        return db.get<{ attempts: number; accuracy: number }>(sql`
          SELECT COUNT(*) AS attempts,
            CASE WHEN COUNT(*) = 0 THEN 0
              ELSE ROUND(SUM(correct) * 100.0 / COUNT(*), 1)
            END AS accuracy
          FROM all_attempts
          WHERE collection_id = ${cid} AND accidental = 0 AND date(ts) >= ${startDay} AND date(ts) < ${endStr}
        `)!;
      }

      const afterStart = new Date(lastDay);
      afterStart.setDate(afterStart.getDate() - 6);
      const afterStartStr = afterStart.toISOString().slice(0, 10);

      const before = getStats(firstDay, 7);
      const after = getStats(afterStartStr, 7);

      return c.json({
        ok: true as const,
        before: { ...before, period: `${firstDay} to +7d` },
        after: { ...after, period: `${afterStartStr} to ${lastDay}` },
      });
    })
    .get("/stats/percentiles", (c) => {
      const cid = c.get("collectionId");
      const minSamples = 10;

      const allRows = db.all<{ rt: number; flag: string; mode: string }>(sql`
        SELECT reaction_time_ms AS rt, flag, mode
        FROM all_attempts
        WHERE collection_id = ${cid} AND accidental = 0 AND reaction_time_ms > 0
        ORDER BY ts DESC LIMIT 5000
      `);

      function percentiles(times: number[]): { p25: number; p75: number } | null {
        if (times.length < minSamples) return null;
        const sorted = [...times].sort((a, b) => a - b);
        const p25 = sorted[Math.floor(sorted.length * 0.25)];
        const p75 = sorted[Math.floor(sorted.length * 0.75)];
        return { p25, p75 };
      }

      const globalP = percentiles(allRows.map((r) => r.rt));

      const byMode: Record<string, { p25: number; p75: number } | null> = {};
      const modeGroups = new Map<string, number[]>();
      for (const r of allRows) {
        const arr = modeGroups.get(r.mode) || [];
        arr.push(r.rt);
        modeGroups.set(r.mode, arr);
      }
      for (const [mode, times] of modeGroups) {
        byMode[mode] = percentiles(times);
      }

      const byFlag: Record<string, { p25: number; p75: number } | null> = {};
      const flagGroups = new Map<string, number[]>();
      for (const r of allRows) {
        const arr = flagGroups.get(r.flag) || [];
        arr.push(r.rt);
        flagGroups.set(r.flag, arr);
      }
      for (const [flag, times] of flagGroups) {
        const p = percentiles(times);
        if (p) byFlag[flag] = p;
      }

      return c.json({ ok: true as const, global: globalP, by_mode: byMode, by_flag: byFlag });
    })
    .get("/stats/reaction-times", (c) => {
      const cid = c.get("collectionId");
      const rows = db.all<{ flag: string; avg_ms: number }>(sql`
        SELECT flag, ROUND(AVG(reaction_time_ms)) AS avg_ms
        FROM all_attempts
        WHERE collection_id = ${cid} AND accidental = 0 AND reaction_time_ms > 0
        GROUP BY flag
      `);

      return c.json({ ok: true as const, reaction_times: rows });
    });
}
