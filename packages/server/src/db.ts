import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { DEFAULT_SETTINGS } from "@flag-quiz/shared";

const DATA_DIR = process.env.DATA_DIR || "./data";

export function initDb(): Database.Database {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const dbPath = path.join(DATA_DIR, "journal.db");
  const db = new Database(dbPath);

  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  createTables(db);
  migrateSchema(db);
  seedSettings(db);

  return db;
}

function createTables(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      mode TEXT NOT NULL,
      exit_condition TEXT NOT NULL,
      quick INTEGER NOT NULL DEFAULT 0,
      started TEXT NOT NULL,
      ended TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_started ON sessions(started);
    CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at);

    CREATE TABLE IF NOT EXISTS classic_attempts (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      flag TEXT NOT NULL,
      guess TEXT,
      correct INTEGER NOT NULL,
      forgotten INTEGER NOT NULL DEFAULT 0,
      confidence INTEGER NOT NULL,
      reaction_time_ms INTEGER NOT NULL,
      ts TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (session_id) REFERENCES sessions(id)
    );

    CREATE INDEX IF NOT EXISTS idx_classic_attempts_flag ON classic_attempts(flag);
    CREATE INDEX IF NOT EXISTS idx_classic_attempts_session ON classic_attempts(session_id);
    CREATE INDEX IF NOT EXISTS idx_classic_attempts_ts ON classic_attempts(ts);
    CREATE INDEX IF NOT EXISTS idx_classic_attempts_created_at ON classic_attempts(created_at);

    CREATE TABLE IF NOT EXISTS pick_flag_attempts (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      flag TEXT NOT NULL,
      guess TEXT NOT NULL,
      options TEXT NOT NULL,
      correct INTEGER NOT NULL,
      confidence INTEGER NOT NULL,
      reaction_time_ms INTEGER NOT NULL,
      ts TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (session_id) REFERENCES sessions(id)
    );

    CREATE INDEX IF NOT EXISTS idx_pick_flag_attempts_flag ON pick_flag_attempts(flag);
    CREATE INDEX IF NOT EXISTS idx_pick_flag_attempts_session ON pick_flag_attempts(session_id);
    CREATE INDEX IF NOT EXISTS idx_pick_flag_attempts_ts ON pick_flag_attempts(ts);
    CREATE INDEX IF NOT EXISTS idx_pick_flag_attempts_created_at ON pick_flag_attempts(created_at);

    CREATE TABLE IF NOT EXISTS pick_country_attempts (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      flag TEXT NOT NULL,
      guess TEXT NOT NULL,
      options TEXT NOT NULL,
      correct INTEGER NOT NULL,
      confidence INTEGER NOT NULL,
      reaction_time_ms INTEGER NOT NULL,
      ts TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (session_id) REFERENCES sessions(id)
    );

    CREATE INDEX IF NOT EXISTS idx_pick_country_attempts_flag ON pick_country_attempts(flag);
    CREATE INDEX IF NOT EXISTS idx_pick_country_attempts_session ON pick_country_attempts(session_id);
    CREATE INDEX IF NOT EXISTS idx_pick_country_attempts_ts ON pick_country_attempts(ts);
    CREATE INDEX IF NOT EXISTS idx_pick_country_attempts_created_at ON pick_country_attempts(created_at);

    CREATE TABLE IF NOT EXISTS flag_progress (
      flag TEXT PRIMARY KEY,
      mnemonic TEXT NOT NULL DEFAULT '',
      stability REAL,
      difficulty REAL,
      state INTEGER NOT NULL DEFAULT 0,
      last_review TEXT,
      due TEXT,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_flag_progress_state ON flag_progress(state);
    CREATE INDEX IF NOT EXISTS idx_flag_progress_due ON flag_progress(due);

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      type TEXT NOT NULL,
      label TEXT NOT NULL,
      category TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      description TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS flag_tags (
      flag TEXT NOT NULL,
      tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (flag, tag_id)
    );

    CREATE INDEX IF NOT EXISTS idx_flag_tags_tag_id ON flag_tags(tag_id);
    CREATE INDEX IF NOT EXISTS idx_flag_tags_flag ON flag_tags(flag);
  `);
}

function migrateSchema(db: Database.Database): void {
  // Add quick column to sessions if missing
  const cols = db.prepare("PRAGMA table_info(sessions)").all() as { name: string }[];
  if (!cols.some((c) => c.name === "quick")) {
    db.exec("ALTER TABLE sessions ADD COLUMN quick INTEGER NOT NULL DEFAULT 0");
  }

  // Add accidental column to attempt tables if missing
  for (const table of ["classic_attempts", "pick_flag_attempts", "pick_country_attempts"]) {
    const tcols = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
    if (!tcols.some((c) => c.name === "accidental")) {
      db.exec(`ALTER TABLE ${table} ADD COLUMN accidental INTEGER NOT NULL DEFAULT 0`);
    }
  }
}

function seedSettings(db: Database.Database): void {
  const insert = db.prepare(`
    INSERT OR IGNORE INTO settings (key, value, type, label, category)
    VALUES (?, ?, ?, ?, ?)
  `);

  const seed = db.transaction(() => {
    for (const setting of DEFAULT_SETTINGS) {
      insert.run(
        setting.key,
        setting.value,
        setting.type,
        setting.label,
        setting.category
      );
    }
  });

  seed();
}
