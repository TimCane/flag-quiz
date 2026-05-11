import { Hono } from "hono";
import { requireAuth } from "../middleware/auth.js";
import { requireCollection } from "../middleware/collection.js";
import type { DrizzleDb } from "../drizzle.js";

const COLLECTION_SCOPED_TABLES = [
  "sessions",
  "attempts",
  "flag_progress",
  "tags",
  "flag_tags",
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
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    });
    lines.push(values.join(","));
  }
  return lines.join("\n");
}

export function exportRoutes(db: DrizzleDb) {
  return new Hono<{ Variables: { collectionId: string } }>()
    .use("*", requireAuth)
    .use("*", requireCollection)
    .get("/export/json", (c) => {
      const collectionId = c.get("collectionId");
      const data: Record<string, any[]> = {};

      // Dynamic table iteration — use raw SQLite client for parameterized queries
      const sqlite = db.$client;
      const dump = sqlite.transaction(() => {
        for (const table of COLLECTION_SCOPED_TABLES) {
          data[table] = sqlite
            .prepare(`SELECT * FROM ${table} WHERE collection_id = ?`)
            .all(collectionId);
        }
        data["settings"] = sqlite.prepare(`SELECT * FROM settings`).all();
      });

      dump();

      return c.json({ ok: true as const, data });
    })
    .get("/export/csv", (c) => {
      const collectionId = c.get("collectionId");
      const data: Record<string, string> = {};

      const sqlite = db.$client;
      const dump = sqlite.transaction(() => {
        for (const table of COLLECTION_SCOPED_TABLES) {
          const rows = sqlite
            .prepare(`SELECT * FROM ${table} WHERE collection_id = ?`)
            .all(collectionId) as Record<string, any>[];
          data[table] = rowsToCsv(rows);
        }
        const settingsRows = sqlite.prepare(`SELECT * FROM settings`).all() as Record<string, any>[];
        data["settings"] = rowsToCsv(settingsRows);
      });

      dump();

      return c.json({ ok: true as const, data });
    });
}
