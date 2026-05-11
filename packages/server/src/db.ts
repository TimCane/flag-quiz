import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { DEFAULT_SETTINGS } from "@flag-quiz/shared";

export function initDb(): Database.Database {
  const dataDir = process.env.DATA_DIR || "./data";
  fs.mkdirSync(dataDir, { recursive: true });
  const dbPath = path.join(dataDir, "journal.db");
  const db = new Database(dbPath);

  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  createTables(db);
  db.exec(`DROP VIEW IF EXISTS all_attempts`);
  runMigrations(db);
  createViews(db);
  cleanupEmptySessions(db);
  seedSettings(db);

  return db;
}

function createTables(db: Database.Database): void {
  // If the unified attempts table already exists (post migration #4), skip
  // creating the legacy attempt tables entirely.
  const hasUnifiedAttempts = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='attempts'").get();

  // Sessions table (always needed).
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      mode TEXT NOT NULL,
      exit_condition TEXT NOT NULL,
      started TEXT NOT NULL,
      ended TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_sessions_started ON sessions(started);
    CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at);
  `);

  // Legacy attempt tables — only created for pre-migration databases.
  // After migration #4 merges them into "attempts", these are no longer needed.
  if (!hasUnifiedAttempts) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS classic_attempts (
        id TEXT PRIMARY KEY, session_id TEXT NOT NULL, flag TEXT NOT NULL, guess TEXT,
        correct INTEGER NOT NULL, forgotten INTEGER NOT NULL DEFAULT 0,
        confidence INTEGER NOT NULL, reaction_time_ms INTEGER NOT NULL,
        ts TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (session_id) REFERENCES sessions(id)
      );
      CREATE INDEX IF NOT EXISTS idx_classic_attempts_session ON classic_attempts(session_id);
      CREATE INDEX IF NOT EXISTS idx_classic_attempts_ts ON classic_attempts(ts);

      CREATE TABLE IF NOT EXISTS pick_flag_attempts (
        id TEXT PRIMARY KEY, session_id TEXT NOT NULL, flag TEXT NOT NULL, guess TEXT NOT NULL,
        options TEXT NOT NULL, correct INTEGER NOT NULL, confidence INTEGER NOT NULL,
        reaction_time_ms INTEGER NOT NULL, ts TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (session_id) REFERENCES sessions(id)
      );
      CREATE INDEX IF NOT EXISTS idx_pick_flag_attempts_session ON pick_flag_attempts(session_id);
      CREATE INDEX IF NOT EXISTS idx_pick_flag_attempts_ts ON pick_flag_attempts(ts);

      CREATE TABLE IF NOT EXISTS pick_country_attempts (
        id TEXT PRIMARY KEY, session_id TEXT NOT NULL, flag TEXT NOT NULL, guess TEXT NOT NULL,
        options TEXT NOT NULL, correct INTEGER NOT NULL, confidence INTEGER NOT NULL,
        reaction_time_ms INTEGER NOT NULL, ts TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (session_id) REFERENCES sessions(id)
      );
      CREATE INDEX IF NOT EXISTS idx_pick_country_attempts_session ON pick_country_attempts(session_id);
      CREATE INDEX IF NOT EXISTS idx_pick_country_attempts_ts ON pick_country_attempts(ts);
    `);
  }

  // Remaining tables.
  db.exec(`
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
  `);
}

type Migration = (db: Database.Database) => void;

const MIGRATIONS: Migration[] = [
  migrateSchema,
  migrateToMultiCollection,
  migrateCountryToItem,
  migrateToUnifiedAttempts,
];

function runMigrations(db: Database.Database): void {
  db.exec(`CREATE TABLE IF NOT EXISTS schema_version (version INTEGER NOT NULL DEFAULT 0)`);
  const row = db.prepare("SELECT version FROM schema_version").get() as { version: number } | undefined;
  let currentVersion = row?.version ?? 0;

  if (!row) {
    db.prepare("INSERT INTO schema_version (version) VALUES (?)").run(0);
  }

  for (let i = currentVersion; i < MIGRATIONS.length; i++) {
    MIGRATIONS[i](db);
    db.prepare("UPDATE schema_version SET version = ?").run(i + 1);
  }
}

function pickItemTableName(db: Database.Database): string {
  const exists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='pick_item_attempts'").get();
  return exists ? "pick_item_attempts" : "pick_country_attempts";
}

function migrateSchema(db: Database.Database): void {
  const sessionsCols = db.prepare("PRAGMA table_info(sessions)").all() as { name: string }[];
  if (!sessionsCols.some((c) => c.name === "quick")) {
    db.exec("ALTER TABLE sessions ADD COLUMN quick INTEGER NOT NULL DEFAULT 0");
  }

  const pickTable = pickItemTableName(db);
  for (const table of ["classic_attempts", "pick_flag_attempts", pickTable]) {
    const tcols = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
    if (!tcols.some((c) => c.name === "accidental")) {
      db.exec(`ALTER TABLE ${table} ADD COLUMN accidental INTEGER NOT NULL DEFAULT 0`);
    }
  }

  const tagCols = db.prepare("PRAGMA table_info(tags)").all() as { name: string }[];
  if (!tagCols.some((c) => c.name === "type")) {
    db.exec("ALTER TABLE tags ADD COLUMN type TEXT NOT NULL DEFAULT 'group'");
  }
}

function migrateToMultiCollection(db: Database.Database): void {
  // Guard: if flag_progress already has collection_id, migration is done.
  const fpCols = db.prepare("PRAGMA table_info(flag_progress)").all() as { name: string }[];
  if (fpCols.some((c) => c.name === "collection_id")) return;

  const run = db.transaction(() => {
    const pickTable = pickItemTableName(db);

    // 1. Add collection_id to sessions + attempt tables (backfill 'world').
    for (const t of ["sessions", "classic_attempts", "pick_flag_attempts", pickTable]) {
      const cols = db.prepare(`PRAGMA table_info(${t})`).all() as { name: string }[];
      if (!cols.some((c) => c.name === "collection_id")) {
        db.exec(`ALTER TABLE ${t} ADD COLUMN collection_id TEXT NOT NULL DEFAULT 'world'`);
      }
      db.exec(`CREATE INDEX IF NOT EXISTS idx_${t}_collection ON ${t}(collection_id)`);
    }

    // Create collection-scoped indexes on attempt tables.
    for (const t of ["classic_attempts", "pick_flag_attempts", pickTable]) {
      db.exec(`CREATE INDEX IF NOT EXISTS idx_${t}_flag ON ${t}(collection_id, flag)`);
    }

    // 2. Rebuild flag_progress with composite PK (collection_id, flag).
    db.exec(`
      CREATE TABLE flag_progress_new (
        collection_id TEXT NOT NULL DEFAULT 'world',
        flag TEXT NOT NULL,
        mnemonic TEXT NOT NULL DEFAULT '',
        stability REAL,
        difficulty REAL,
        state INTEGER NOT NULL DEFAULT 0,
        last_review TEXT,
        due TEXT,
        updated_at TEXT NOT NULL,
        PRIMARY KEY (collection_id, flag)
      );
    `);
    db.exec(`
      INSERT INTO flag_progress_new
        (collection_id, flag, mnemonic, stability, difficulty, state, last_review, due, updated_at)
      SELECT 'world', flag, mnemonic, stability, difficulty, state, last_review, due, updated_at
      FROM flag_progress;
    `);
    db.exec(`DROP TABLE flag_progress`);
    db.exec(`ALTER TABLE flag_progress_new RENAME TO flag_progress`);
    db.exec(`CREATE INDEX idx_flag_progress_state ON flag_progress(collection_id, state)`);
    db.exec(`CREATE INDEX idx_flag_progress_due ON flag_progress(collection_id, due)`);

    // 3. Add collection_id to tags.
    const tcols = db.prepare("PRAGMA table_info(tags)").all() as { name: string }[];
    if (!tcols.some((c) => c.name === "collection_id")) {
      db.exec(`ALTER TABLE tags ADD COLUMN collection_id TEXT NOT NULL DEFAULT 'world'`);
    }
    db.exec(`CREATE INDEX IF NOT EXISTS idx_tags_collection ON tags(collection_id)`);

    // 4. Rebuild flag_tags with composite PK (collection_id, flag, tag_id).
    db.exec(`
      CREATE TABLE flag_tags_new (
        collection_id TEXT NOT NULL DEFAULT 'world',
        flag TEXT NOT NULL,
        tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        PRIMARY KEY (collection_id, flag, tag_id)
      );
    `);
    db.exec(`
      INSERT INTO flag_tags_new (collection_id, flag, tag_id, updated_at)
      SELECT 'world', flag, tag_id, updated_at FROM flag_tags;
    `);
    db.exec(`DROP TABLE flag_tags`);
    db.exec(`ALTER TABLE flag_tags_new RENAME TO flag_tags`);
    db.exec(`CREATE INDEX idx_flag_tags_tag_id ON flag_tags(tag_id)`);
    db.exec(`CREATE INDEX idx_flag_tags_flag ON flag_tags(collection_id, flag)`);
  });

  run();
}

function migrateCountryToItem(db: Database.Database): void {
  // Guard: if pick_country_attempts doesn't exist, migration is already done or not needed.
  const oldExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='pick_country_attempts'").get();
  if (!oldExists) return;

  const run = db.transaction(() => {
    // If both tables exist (e.g. from a prior partial run where createTables made the new
    // table but the rename transaction failed), drop the empty new one first.
    const newExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='pick_item_attempts'").get();
    if (newExists) {
      db.exec(`DROP TABLE pick_item_attempts`);
    }

    // 1. Ensure collection_id exists (may be missing if table was recreated by createTables
    //    after the multi-collection migration already ran).
    const cols = db.prepare("PRAGMA table_info(pick_country_attempts)").all() as { name: string }[];
    if (!cols.some((c) => c.name === "collection_id")) {
      db.exec(`ALTER TABLE pick_country_attempts ADD COLUMN collection_id TEXT NOT NULL DEFAULT 'world'`);
    }
    if (!cols.some((c) => c.name === "accidental")) {
      db.exec(`ALTER TABLE pick_country_attempts ADD COLUMN accidental INTEGER NOT NULL DEFAULT 0`);
    }

    // 2. Rename table.
    db.exec(`ALTER TABLE pick_country_attempts RENAME TO pick_item_attempts`);

    // 3. Drop old indexes and recreate with new names.
    db.exec(`DROP INDEX IF EXISTS idx_pick_country_attempts_collection`);
    db.exec(`DROP INDEX IF EXISTS idx_pick_country_attempts_flag`);
    db.exec(`DROP INDEX IF EXISTS idx_pick_country_attempts_session`);
    db.exec(`DROP INDEX IF EXISTS idx_pick_country_attempts_ts`);
    db.exec(`DROP INDEX IF EXISTS idx_pick_country_attempts_created_at`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_pick_item_attempts_collection ON pick_item_attempts(collection_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_pick_item_attempts_flag ON pick_item_attempts(collection_id, flag)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_pick_item_attempts_session ON pick_item_attempts(session_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_pick_item_attempts_ts ON pick_item_attempts(ts)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_pick_item_attempts_created_at ON pick_item_attempts(created_at)`);

    // 4. Update session mode values.
    db.exec(`UPDATE sessions SET mode = 'pick-the-item' WHERE mode = 'pick-the-country'`);

    // 5. Update settings key.
    db.exec(`UPDATE settings SET key = 'speed_timeout_pick_item_ms' WHERE key = 'speed_timeout_pick_country_ms'`);
  });

  run();
}

function createViews(db: Database.Database): void {
  db.exec(`DROP VIEW IF EXISTS all_attempts`);

  // After migration #4, the unified "attempts" table exists directly.
  // Before that, fall back to the legacy UNION ALL view.
  const unified = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='attempts'").get();
  if (unified) {
    db.exec(`
      CREATE VIEW all_attempts AS
      SELECT mode, id, collection_id, session_id, flag, guess, correct, confidence, reaction_time_ms, ts, accidental
      FROM attempts
    `);
  } else {
    const pickTable = pickItemTableName(db);
    db.exec(`
      CREATE VIEW all_attempts AS
      SELECT 'classic' AS mode, id, collection_id, session_id, flag, guess, correct, confidence, reaction_time_ms, ts, accidental
      FROM classic_attempts
      UNION ALL
      SELECT 'pick-the-flag' AS mode, id, collection_id, session_id, flag, guess, correct, confidence, reaction_time_ms, ts, accidental
      FROM pick_flag_attempts
      UNION ALL
      SELECT 'pick-the-item' AS mode, id, collection_id, session_id, flag, guess, correct, confidence, reaction_time_ms, ts, accidental
      FROM ${pickTable}
    `);
  }
}

function migrateToUnifiedAttempts(db: Database.Database): void {
  // Guard: if unified attempts table already exists, migration is done.
  const exists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='attempts'").get();
  if (exists) return;

  const run = db.transaction(() => {
    // 1. Create unified attempts table with mode column.
    db.exec(`
      CREATE TABLE attempts (
        id TEXT PRIMARY KEY,
        collection_id TEXT NOT NULL DEFAULT 'world',
        session_id TEXT NOT NULL REFERENCES sessions(id),
        mode TEXT NOT NULL,
        flag TEXT NOT NULL,
        guess TEXT,
        options TEXT,
        correct INTEGER NOT NULL,
        forgotten INTEGER NOT NULL DEFAULT 0,
        confidence INTEGER NOT NULL,
        reaction_time_ms INTEGER NOT NULL,
        ts TEXT NOT NULL,
        accidental INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);

    // 2. Copy data from the three legacy tables.
    db.exec(`
      INSERT INTO attempts (id, collection_id, session_id, mode, flag, guess, options, correct, forgotten, confidence, reaction_time_ms, ts, accidental, created_at)
      SELECT id, collection_id, session_id, 'classic', flag, guess, NULL, correct, forgotten, confidence, reaction_time_ms, ts, accidental, created_at
      FROM classic_attempts
    `);
    db.exec(`
      INSERT INTO attempts (id, collection_id, session_id, mode, flag, guess, options, correct, forgotten, confidence, reaction_time_ms, ts, accidental, created_at)
      SELECT id, collection_id, session_id, 'pick-the-flag', flag, guess, options, correct, 0, confidence, reaction_time_ms, ts, accidental, created_at
      FROM pick_flag_attempts
    `);

    const pickItemExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='pick_item_attempts'").get();
    if (pickItemExists) {
      db.exec(`
        INSERT INTO attempts (id, collection_id, session_id, mode, flag, guess, options, correct, forgotten, confidence, reaction_time_ms, ts, accidental, created_at)
        SELECT id, collection_id, session_id, 'pick-the-item', flag, guess, options, correct, 0, confidence, reaction_time_ms, ts, accidental, created_at
        FROM pick_item_attempts
      `);
    }

    // 3. Create indexes on the unified table.
    db.exec(`CREATE INDEX idx_attempts_session ON attempts(session_id)`);
    db.exec(`CREATE INDEX idx_attempts_ts ON attempts(ts)`);
    db.exec(`CREATE INDEX idx_attempts_collection ON attempts(collection_id)`);
    db.exec(`CREATE INDEX idx_attempts_flag ON attempts(collection_id, flag)`);
    db.exec(`CREATE INDEX idx_attempts_mode ON attempts(collection_id, mode)`);

    // 4. Drop legacy tables.
    db.exec(`DROP TABLE IF EXISTS classic_attempts`);
    db.exec(`DROP TABLE IF EXISTS pick_flag_attempts`);
    db.exec(`DROP TABLE IF EXISTS pick_item_attempts`);
  });

  run();
}

function cleanupEmptySessions(db: Database.Database): void {
  const result = db.prepare(`
    DELETE FROM sessions WHERE id NOT IN (
      SELECT DISTINCT session_id FROM all_attempts
    )
  `).run();
  if (result.changes > 0) {
    console.log(`Cleaned up ${result.changes} empty session(s)`);
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
