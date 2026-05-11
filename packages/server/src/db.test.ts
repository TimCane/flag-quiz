import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Database from "better-sqlite3";
import { initDb } from "./db.js";
import fs from "fs";
import path from "path";
import os from "os";

let tmpDir: string;

function freshDb(): Database.Database {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "fq-test-"));
  process.env.DATA_DIR = tmpDir;
  return initDb();
}

afterEach(() => {
  if (tmpDir) {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

describe("database initialization", () => {
  let db: Database.Database;
  beforeEach(() => { db = freshDb(); });

  it("creates all required tables", () => {
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
      .all() as { name: string }[];
    const names = tables.map((t) => t.name);

    expect(names).toContain("sessions");
    expect(names).toContain("attempts");
    expect(names).toContain("flag_progress");
    expect(names).toContain("settings");
    expect(names).toContain("tags");
    expect(names).toContain("flag_tags");
    expect(names).toContain("schema_version");
  });

  it("creates the all_attempts view", () => {
    const views = db
      .prepare("SELECT name FROM sqlite_master WHERE type='view'")
      .all() as { name: string }[];
    expect(views.map((v) => v.name)).toContain("all_attempts");
  });

  it("sets schema version", () => {
    const row = db.prepare("SELECT version FROM schema_version").get() as { version: number };
    expect(row.version).toBeGreaterThanOrEqual(4);
  });

  it("seeds default settings", () => {
    const { cnt } = db.prepare("SELECT COUNT(*) AS cnt FROM settings").get() as { cnt: number };
    expect(cnt).toBeGreaterThan(0);
  });

  it("is idempotent", () => {
    expect(() => initDb()).not.toThrow();
  });
});

describe("all_attempts view", () => {
  let db: Database.Database;
  beforeEach(() => { db = freshDb(); });

  it("unions all modes from attempts table", () => {
    const sid = crypto.randomUUID();
    const ts = new Date().toISOString();
    db.prepare("INSERT INTO sessions (id, collection_id, mode, exit_condition, quick, started) VALUES (?,?,?,?,?,?)").run(sid, "world", "classic", "normal", 0, ts);

    db.prepare("INSERT INTO attempts (id, collection_id, session_id, mode, flag, guess, correct, forgotten, confidence, reaction_time_ms, ts, accidental) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)").run(crypto.randomUUID(), "world", sid, "classic", "gb", "gb", 1, 0, 3, 1500, ts, 0);
    db.prepare("INSERT INTO attempts (id, collection_id, session_id, mode, flag, guess, options, correct, confidence, reaction_time_ms, ts, accidental) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)").run(crypto.randomUUID(), "world", sid, "pick-the-flag", "fr", "fr", '["fr","de"]', 1, 3, 2000, ts, 0);
    db.prepare("INSERT INTO attempts (id, collection_id, session_id, mode, flag, guess, options, correct, confidence, reaction_time_ms, ts, accidental) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)").run(crypto.randomUUID(), "world", sid, "pick-the-item", "de", "fr", '["de","fr"]', 0, 2, 3000, ts, 0);

    const rows = db.prepare("SELECT * FROM all_attempts WHERE collection_id = ?").all("world");
    expect(rows).toHaveLength(3);

    const modes = (rows as any[]).map((r) => r.mode).sort();
    expect(modes).toEqual(["classic", "pick-the-flag", "pick-the-item"]);
  });

  it("scopes by collection_id", () => {
    const sid = crypto.randomUUID();
    const ts = new Date().toISOString();
    db.prepare("INSERT INTO sessions (id, collection_id, mode, exit_condition, quick, started) VALUES (?,?,?,?,?,?)").run(sid, "world", "classic", "normal", 0, ts);
    db.prepare("INSERT INTO attempts (id, collection_id, session_id, mode, flag, guess, correct, forgotten, confidence, reaction_time_ms, ts, accidental) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)").run(crypto.randomUUID(), "world", sid, "classic", "gb", "gb", 1, 0, 3, 1500, ts, 0);

    const { cnt: world } = db.prepare("SELECT COUNT(*) AS cnt FROM all_attempts WHERE collection_id = ?").get("world") as { cnt: number };
    const { cnt: other } = db.prepare("SELECT COUNT(*) AS cnt FROM all_attempts WHERE collection_id = ?").get("us-states") as { cnt: number };
    expect(world).toBe(1);
    expect(other).toBe(0);
  });

  it("accidental filter works", () => {
    const sid = crypto.randomUUID();
    const ts = new Date().toISOString();
    db.prepare("INSERT INTO sessions (id, collection_id, mode, exit_condition, quick, started) VALUES (?,?,?,?,?,?)").run(sid, "world", "classic", "normal", 0, ts);
    db.prepare("INSERT INTO attempts (id, collection_id, session_id, mode, flag, guess, correct, forgotten, confidence, reaction_time_ms, ts, accidental) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)").run(crypto.randomUUID(), "world", sid, "classic", "gb", "gb", 1, 0, 3, 1500, ts, 1);

    const { cnt: all } = db.prepare("SELECT COUNT(*) AS cnt FROM all_attempts WHERE session_id = ?").get(sid) as { cnt: number };
    const { cnt: nonAcc } = db.prepare("SELECT COUNT(*) AS cnt FROM all_attempts WHERE session_id = ? AND accidental = 0").get(sid) as { cnt: number };
    expect(all).toBe(1);
    expect(nonAcc).toBe(0);
  });
});

describe("empty session cleanup", () => {
  it("removes sessions with no attempts on init", () => {
    const db = freshDb();
    db.prepare("INSERT INTO sessions (id, collection_id, mode, exit_condition, quick, started) VALUES (?,?,?,?,?,?)").run("empty", "world", "classic", "normal", 0, new Date().toISOString());

    const { cnt: before } = db.prepare("SELECT COUNT(*) AS cnt FROM sessions WHERE id = 'empty'").get() as { cnt: number };
    expect(before).toBe(1);

    // Re-init runs cleanup
    initDb();

    const { cnt: after } = db.prepare("SELECT COUNT(*) AS cnt FROM sessions WHERE id = 'empty'").get() as { cnt: number };
    expect(after).toBe(0);
  });

  it("keeps sessions with attempts", () => {
    const db = freshDb();
    const sid = crypto.randomUUID();
    const ts = new Date().toISOString();
    db.prepare("INSERT INTO sessions (id, collection_id, mode, exit_condition, quick, started) VALUES (?,?,?,?,?,?)").run(sid, "world", "classic", "normal", 0, ts);
    db.prepare("INSERT INTO attempts (id, collection_id, session_id, mode, flag, guess, correct, forgotten, confidence, reaction_time_ms, ts, accidental) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)").run(crypto.randomUUID(), "world", sid, "classic", "gb", "gb", 1, 0, 3, 1500, ts, 0);

    initDb();

    const { cnt } = db.prepare("SELECT COUNT(*) AS cnt FROM sessions WHERE id = ?").get(sid) as { cnt: number };
    expect(cnt).toBe(1);
  });
});
