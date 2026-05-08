import { Hono } from "hono";
import type Database from "better-sqlite3";
import { requireAuth } from "../middleware/auth.js";

const TABLES = [
  "sessions",
  "classic_attempts",
  "pick_flag_attempts",
  "pick_country_attempts",
  "flag_progress",
  "settings",
] as const;

function rowsToCsv(rows: Record<string, any>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
  for (const row of rows) {
    const values = headers.map((h) => {
      const val = row[h];
      if (val === null || val === undefined) return "";
      const str = String(val);
      // Escape CSV values that contain commas, quotes, or newlines
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    });
    lines.push(values.join(","));
  }
  return lines.join("\n");
}

export function exportRoutes(db: Database.Database): Hono {
  const app = new Hono();

  app.use("*", requireAuth);

  // Full JSON dump
  app.get("/export/json", (c) => {
    const data: Record<string, any[]> = {};

    const dump = db.transaction(() => {
      for (const table of TABLES) {
        data[table] = db.prepare(`SELECT * FROM ${table}`).all();
      }
    });

    dump();

    return c.json({ ok: true, data });
  });

  // CSV export (table name -> CSV string)
  app.get("/export/csv", (c) => {
    const data: Record<string, string> = {};

    const dump = db.transaction(() => {
      for (const table of TABLES) {
        const rows = db.prepare(`SELECT * FROM ${table}`).all() as Record<
          string,
          any
        >[];
        data[table] = rowsToCsv(rows);
      }
    });

    dump();

    return c.json({ ok: true, data });
  });

  return app;
}
