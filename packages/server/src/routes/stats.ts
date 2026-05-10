import { Hono } from "hono";
import type Database from "better-sqlite3";
import { requireAuth } from "../middleware/auth.js";

export function statsRoutes(db: Database.Database): Hono {
  const app = new Hono();

  app.use("*", requireAuth);

  app.get("/stats", (c) => {
    const stats = db.transaction(() => {
      // Total attempts across all 3 tables
      const totalAttempts = db
        .prepare(
          `SELECT
            (SELECT COUNT(*) FROM classic_attempts WHERE accidental = 0) +
            (SELECT COUNT(*) FROM pick_flag_attempts WHERE accidental = 0) +
            (SELECT COUNT(*) FROM pick_country_attempts WHERE accidental = 0) AS total`
        )
        .get() as { total: number };

      // Total sessions
      const totalSessions = db
        .prepare(`SELECT COUNT(*) AS total FROM sessions`)
        .get() as { total: number };

      // Unique flags attempted across all tables
      const flagsAttempted = db
        .prepare(
          `SELECT COUNT(DISTINCT flag) AS total FROM (
            SELECT flag FROM classic_attempts WHERE accidental = 0
            UNION
            SELECT flag FROM pick_flag_attempts WHERE accidental = 0
            UNION
            SELECT flag FROM pick_country_attempts WHERE accidental = 0
          )`
        )
        .get() as { total: number };

      // Overall accuracy across all tables
      const accuracy = db
        .prepare(
          `SELECT
            CASE
              WHEN (
                (SELECT COUNT(*) FROM classic_attempts WHERE accidental = 0) +
                (SELECT COUNT(*) FROM pick_flag_attempts WHERE accidental = 0) +
                (SELECT COUNT(*) FROM pick_country_attempts WHERE accidental = 0)
              ) = 0 THEN 0
              ELSE ROUND(
                (
                  (SELECT SUM(correct) FROM classic_attempts WHERE accidental = 0) +
                  (SELECT SUM(correct) FROM pick_flag_attempts WHERE accidental = 0) +
                  (SELECT SUM(correct) FROM pick_country_attempts WHERE accidental = 0)
                ) * 100.0 / (
                  (SELECT COUNT(*) FROM classic_attempts WHERE accidental = 0) +
                  (SELECT COUNT(*) FROM pick_flag_attempts WHERE accidental = 0) +
                  (SELECT COUNT(*) FROM pick_country_attempts WHERE accidental = 0)
                ),
                1
              )
            END AS accuracy`
        )
        .get() as { accuracy: number };

      // Flag progress breakdown by state
      // state: 0 = new, 1 = learning, 2 = review, 3 = mastered
      const progressBreakdown = db
        .prepare(
          `SELECT
            COALESCE(SUM(CASE WHEN state = 3 THEN 1 ELSE 0 END), 0) AS flags_mastered,
            COALESCE(SUM(CASE WHEN state IN (1, 2) THEN 1 ELSE 0 END), 0) AS flags_learning,
            COALESCE(SUM(CASE WHEN state = 0 THEN 1 ELSE 0 END), 0) AS flags_new
          FROM flag_progress`
        )
        .get() as {
        flags_mastered: number;
        flags_learning: number;
        flags_new: number;
      };

      return {
        total_attempts: totalAttempts.total,
        total_sessions: totalSessions.total,
        flags_attempted: flagsAttempted.total,
        accuracy: accuracy.accuracy,
        flags_mastered: progressBreakdown.flags_mastered,
        flags_learning: progressBreakdown.flags_learning,
        flags_new: progressBreakdown.flags_new,
      };
    })();

    return c.json({ ok: true, ...stats });
  });

  // Per-flag stats for the history list
  app.get("/stats/flags", (c) => {
    const rows = db.prepare(`
      SELECT
        flag,
        SUM(cnt) AS attempt_count,
        CASE WHEN SUM(cnt) = 0 THEN 0
          ELSE ROUND(SUM(correct_cnt) * 100.0 / SUM(cnt), 1)
        END AS accuracy,
        MAX(last_seen) AS last_seen
      FROM (
        SELECT flag, COUNT(*) AS cnt, SUM(correct) AS correct_cnt, MAX(ts) AS last_seen
        FROM classic_attempts WHERE accidental = 0 GROUP BY flag
        UNION ALL
        SELECT flag, COUNT(*) AS cnt, SUM(correct) AS correct_cnt, MAX(ts) AS last_seen
        FROM pick_flag_attempts WHERE accidental = 0 GROUP BY flag
        UNION ALL
        SELECT flag, COUNT(*) AS cnt, SUM(correct) AS correct_cnt, MAX(ts) AS last_seen
        FROM pick_country_attempts WHERE accidental = 0 GROUP BY flag
      )
      GROUP BY flag
      ORDER BY flag ASC
    `).all() as { flag: string; attempt_count: number; accuracy: number; last_seen: string }[];

    return c.json({ ok: true, flags: rows });
  });

  // Confusion pairs for a specific flag
  app.get("/stats/confusions/:flag", (c) => {
    const flag = c.req.param("flag");

    const rows = db.prepare(`
      SELECT guess, COUNT(*) AS count FROM (
        SELECT guess FROM classic_attempts WHERE accidental = 0 AND flag = ? AND correct = 0 AND guess IS NOT NULL AND guess != ''
        UNION ALL
        SELECT guess FROM pick_flag_attempts WHERE accidental = 0 AND flag = ? AND correct = 0
        UNION ALL
        SELECT guess FROM pick_country_attempts WHERE accidental = 0 AND flag = ? AND correct = 0
      )
      GROUP BY guess
      ORDER BY count DESC
    `).all(flag, flag, flag) as { guess: string; count: number }[];

    return c.json({ ok: true, confusions: rows });
  });

  // Daily progress over time: accuracy and cumulative flags mastered per day
  app.get("/stats/progress", (c) => {
    const rows = db.prepare(`
      SELECT
        date(ts) AS day,
        COUNT(*) AS attempts,
        SUM(correct) AS correct_count,
        ROUND(SUM(correct) * 100.0 / COUNT(*), 1) AS accuracy
      FROM (
        SELECT ts, correct FROM classic_attempts WHERE accidental = 0
        UNION ALL
        SELECT ts, correct FROM pick_flag_attempts WHERE accidental = 0
        UNION ALL
        SELECT ts, correct FROM pick_country_attempts WHERE accidental = 0
      )
      GROUP BY date(ts)
      ORDER BY day ASC
    `).all() as { day: string; attempts: number; correct_count: number; accuracy: number }[];

    return c.json({ ok: true, progress: rows });
  });

  // Accuracy by continent
  app.get("/stats/continents", (c) => {
    // We need to join with flag data — but flags are in shared package, not DB.
    // Return per-flag accuracy and let the client group by continent.
    const rows = db.prepare(`
      SELECT
        flag,
        SUM(cnt) AS attempt_count,
        SUM(correct_cnt) AS correct_count
      FROM (
        SELECT flag, COUNT(*) AS cnt, SUM(correct) AS correct_cnt FROM classic_attempts WHERE accidental = 0 GROUP BY flag
        UNION ALL
        SELECT flag, COUNT(*) AS cnt, SUM(correct) AS correct_cnt FROM pick_flag_attempts WHERE accidental = 0 GROUP BY flag
        UNION ALL
        SELECT flag, COUNT(*) AS cnt, SUM(correct) AS correct_cnt FROM pick_country_attempts WHERE accidental = 0 GROUP BY flag
      )
      GROUP BY flag
    `).all() as { flag: string; attempt_count: number; correct_count: number }[];

    return c.json({ ok: true, flags: rows });
  });

  // Top confused pairs (bidirectional)
  app.get("/stats/confused-pairs", (c) => {
    const rows = db.prepare(`
      SELECT flag, guess, COUNT(*) AS count FROM (
        SELECT flag, guess FROM classic_attempts WHERE accidental = 0 AND correct = 0 AND guess IS NOT NULL AND guess != ''
        UNION ALL
        SELECT flag, guess FROM pick_flag_attempts WHERE accidental = 0 AND correct = 0
        UNION ALL
        SELECT flag, guess FROM pick_country_attempts WHERE accidental = 0 AND correct = 0
      )
      GROUP BY flag, guess
      ORDER BY count DESC
      LIMIT 50
    `).all() as { flag: string; guess: string; count: number }[];

    return c.json({ ok: true, pairs: rows });
  });

  // Confidence/rating distribution
  app.get("/stats/confidence", (c) => {
    const rows = db.prepare(`
      SELECT confidence, COUNT(*) AS count FROM (
        SELECT confidence FROM classic_attempts WHERE accidental = 0
        UNION ALL
        SELECT confidence FROM pick_flag_attempts WHERE accidental = 0
        UNION ALL
        SELECT confidence FROM pick_country_attempts WHERE accidental = 0
      )
      GROUP BY confidence
      ORDER BY confidence ASC
    `).all() as { confidence: number; count: number }[];

    return c.json({ ok: true, distribution: rows });
  });

  // Session activity per day (for heatmap)
  app.get("/stats/activity", (c) => {
    const rows = db.prepare(`
      SELECT
        date(ts) AS day,
        COUNT(*) AS count
      FROM (
        SELECT ts FROM classic_attempts WHERE accidental = 0
        UNION ALL
        SELECT ts FROM pick_flag_attempts WHERE accidental = 0
        UNION ALL
        SELECT ts FROM pick_country_attempts WHERE accidental = 0
      )
      GROUP BY date(ts)
      ORDER BY day ASC
    `).all() as { day: string; count: number }[];

    return c.json({ ok: true, activity: rows });
  });

  // Per-flag attempt sequence (for sparklines) — returns correct/wrong in order
  app.get("/stats/sparklines", (c) => {
    const rows = db.prepare(`
      SELECT flag, correct FROM (
        SELECT flag, correct, ts FROM classic_attempts WHERE accidental = 0
        UNION ALL
        SELECT flag, correct, ts FROM pick_flag_attempts WHERE accidental = 0
        UNION ALL
        SELECT flag, correct, ts FROM pick_country_attempts WHERE accidental = 0
      )
      ORDER BY flag ASC, ts ASC
    `).all() as { flag: string; correct: number }[];

    // Group into per-flag arrays of 0/1
    const sparklines: Record<string, number[]> = {};
    for (const r of rows) {
      if (!sparklines[r.flag]) sparklines[r.flag] = [];
      sparklines[r.flag].push(r.correct);
    }

    return c.json({ ok: true, sparklines });
  });

  // Hardest flags — lowest accuracy with minimum 3 attempts
  app.get("/stats/hardest", (c) => {
    const rows = db.prepare(`
      SELECT
        flag,
        SUM(cnt) AS attempt_count,
        ROUND(SUM(correct_cnt) * 100.0 / SUM(cnt), 1) AS accuracy
      FROM (
        SELECT flag, COUNT(*) AS cnt, SUM(correct) AS correct_cnt FROM classic_attempts WHERE accidental = 0 GROUP BY flag
        UNION ALL
        SELECT flag, COUNT(*) AS cnt, SUM(correct) AS correct_cnt FROM pick_flag_attempts WHERE accidental = 0 GROUP BY flag
        UNION ALL
        SELECT flag, COUNT(*) AS cnt, SUM(correct) AS correct_cnt FROM pick_country_attempts WHERE accidental = 0 GROUP BY flag
      )
      GROUP BY flag
      HAVING SUM(cnt) >= 3
      ORDER BY accuracy ASC, attempt_count DESC
      LIMIT 10
    `).all() as { flag: string; attempt_count: number; accuracy: number }[];

    return c.json({ ok: true, hardest: rows });
  });

  // Before/after comparison — first 7 days vs last 7 days
  app.get("/stats/comparison", (c) => {
    const allDays = db.prepare(`
      SELECT DISTINCT date(ts) AS day FROM (
        SELECT ts FROM classic_attempts WHERE accidental = 0
        UNION ALL SELECT ts FROM pick_flag_attempts WHERE accidental = 0
        UNION ALL SELECT ts FROM pick_country_attempts WHERE accidental = 0
      ) ORDER BY day ASC
    `).all() as { day: string }[];

    if (allDays.length < 2) {
      return c.json({ ok: true, before: null, after: null });
    }

    const firstDay = allDays[0].day;
    const lastDay = allDays[allDays.length - 1].day;

    function getStats(startDay: string, days: number) {
      const end = new Date(startDay);
      end.setDate(end.getDate() + days);
      const endStr = end.toISOString().slice(0, 10);

      return db.prepare(`
        SELECT
          COUNT(*) AS attempts,
          ROUND(SUM(correct) * 100.0 / COUNT(*), 1) AS accuracy
        FROM (
          SELECT correct, ts FROM classic_attempts WHERE accidental = 0 AND date(ts) >= ? AND date(ts) < ?
          UNION ALL
          SELECT correct, ts FROM pick_flag_attempts WHERE accidental = 0 AND date(ts) >= ? AND date(ts) < ?
          UNION ALL
          SELECT correct, ts FROM pick_country_attempts WHERE accidental = 0 AND date(ts) >= ? AND date(ts) < ?
        )
      `).get(startDay, endStr, startDay, endStr, startDay, endStr) as { attempts: number; accuracy: number };
    }

    // Last 7 days for "after"
    const afterStart = new Date(lastDay);
    afterStart.setDate(afterStart.getDate() - 6);
    const afterStartStr = afterStart.toISOString().slice(0, 10);

    const before = getStats(firstDay, 7);
    const after = getStats(afterStartStr, 7);

    return c.json({
      ok: true,
      before: { ...before, period: `${firstDay} to +7d` },
      after: { ...after, period: `${afterStartStr} to ${lastDay}` },
    });
  });

  // Reaction time percentiles for Quick mode auto-rating
  app.get("/stats/percentiles", (c) => {
    const minSamples = 10;

    // All reaction times with mode and flag
    const allRows = db.prepare(`
      SELECT reaction_time_ms AS rt, flag, 'classic' AS mode FROM classic_attempts WHERE accidental = 0 AND reaction_time_ms > 0
      UNION ALL
      SELECT reaction_time_ms AS rt, flag, 'pick-the-flag' AS mode FROM pick_flag_attempts WHERE accidental = 0 AND reaction_time_ms > 0
      UNION ALL
      SELECT reaction_time_ms AS rt, flag, 'pick-the-country' AS mode FROM pick_country_attempts WHERE accidental = 0 AND reaction_time_ms > 0
    `).all() as { rt: number; flag: string; mode: string }[];

    function percentiles(times: number[]): { p25: number; p75: number } | null {
      if (times.length < minSamples) return null;
      const sorted = [...times].sort((a, b) => a - b);
      const p25 = sorted[Math.floor(sorted.length * 0.25)];
      const p75 = sorted[Math.floor(sorted.length * 0.75)];
      return { p25, p75 };
    }

    // Global
    const globalP = percentiles(allRows.map((r) => r.rt));

    // By mode
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

    // By flag
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

    return c.json({ ok: true, global: globalP, by_mode: byMode, by_flag: byFlag });
  });

  // Average reaction time per flag
  app.get("/stats/reaction-times", (c) => {
    const rows = db.prepare(`
      SELECT flag, ROUND(AVG(rt)) AS avg_ms FROM (
        SELECT flag, reaction_time_ms AS rt FROM classic_attempts WHERE accidental = 0 AND reaction_time_ms > 0
        UNION ALL
        SELECT flag, reaction_time_ms AS rt FROM pick_flag_attempts WHERE accidental = 0 AND reaction_time_ms > 0
        UNION ALL
        SELECT flag, reaction_time_ms AS rt FROM pick_country_attempts WHERE accidental = 0 AND reaction_time_ms > 0
      )
      GROUP BY flag
    `).all() as { flag: string; avg_ms: number }[];

    return c.json({ ok: true, reaction_times: rows });
  });

  return app;
}
