import { sqliteTable, text, integer, real, index, primaryKey } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// ─── Sessions ──────────────────────────────────────────────────────────────────

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  collection_id: text("collection_id").notNull().default("world"),
  mode: text("mode").notNull(),
  exit_condition: text("exit_condition").notNull(),
  quick: integer("quick").notNull().default(0),
  started: text("started").notNull(),
  ended: text("ended"),
  created_at: text("created_at").notNull().default(sql`(datetime('now'))`),
}, (t) => [
  index("idx_sessions_started").on(t.started),
  index("idx_sessions_created_at").on(t.created_at),
  index("idx_sessions_collection").on(t.collection_id),
]);

// ─── Attempts (unified) ───────────────────────────────────────────────────────

export const attempts = sqliteTable("attempts", {
  id: text("id").primaryKey(),
  collection_id: text("collection_id").notNull().default("world"),
  session_id: text("session_id").notNull().references(() => sessions.id),
  mode: text("mode").notNull(),
  flag: text("flag").notNull(),
  guess: text("guess"),
  options: text("options"),
  correct: integer("correct").notNull(),
  forgotten: integer("forgotten").notNull().default(0),
  confidence: integer("confidence").notNull(),
  reaction_time_ms: integer("reaction_time_ms").notNull(),
  ts: text("ts").notNull(),
  accidental: integer("accidental").notNull().default(0),
  created_at: text("created_at").notNull().default(sql`(datetime('now'))`),
}, (t) => [
  index("idx_attempts_session").on(t.session_id),
  index("idx_attempts_ts").on(t.ts),
  index("idx_attempts_collection").on(t.collection_id),
  index("idx_attempts_flag").on(t.collection_id, t.flag),
  index("idx_attempts_mode").on(t.collection_id, t.mode),
]);

// ─── Flag progress (FSRS state) ───────────────────────────────────────────────

export const flagProgress = sqliteTable("flag_progress", {
  collection_id: text("collection_id").notNull().default("world"),
  flag: text("flag").notNull(),
  mnemonic: text("mnemonic").notNull().default(""),
  stability: real("stability"),
  difficulty: real("difficulty"),
  state: integer("state").notNull().default(0),
  last_review: text("last_review"),
  due: text("due"),
  updated_at: text("updated_at").notNull(),
}, (t) => [
  primaryKey({ columns: [t.collection_id, t.flag] }),
  index("idx_flag_progress_state").on(t.collection_id, t.state),
  index("idx_flag_progress_due").on(t.collection_id, t.due),
]);

// ─── Settings ──────────────────────────────────────────────────────────────────

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  type: text("type").notNull(),
  label: text("label").notNull(),
  category: text("category").notNull(),
});

// ─── Tags ──────────────────────────────────────────────────────────────────────

export const tags = sqliteTable("tags", {
  id: text("id").primaryKey(),
  collection_id: text("collection_id").notNull().default("world"),
  name: text("name").notNull(),
  sort_order: integer("sort_order").notNull().default(0),
  description: text("description").notNull().default(""),
  type: text("type").notNull().default("group"),
  updated_at: text("updated_at").notNull().default(sql`(datetime('now'))`),
}, (t) => [
  index("idx_tags_collection").on(t.collection_id),
]);

export const flagTags = sqliteTable("flag_tags", {
  collection_id: text("collection_id").notNull().default("world"),
  flag: text("flag").notNull(),
  tag_id: text("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
  updated_at: text("updated_at").notNull().default(sql`(datetime('now'))`),
}, (t) => [
  primaryKey({ columns: [t.collection_id, t.flag, t.tag_id] }),
  index("idx_flag_tags_tag_id").on(t.tag_id),
  index("idx_flag_tags_flag").on(t.collection_id, t.flag),
]);

// ─── Rate limiting ─────────────────────────────────────────────────────────────

export const rateLimit = sqliteTable("rate_limit", {
  ip: text("ip").notNull(),
  ts: integer("ts").notNull(),
}, (t) => [
  index("idx_rate_limit_ip_ts").on(t.ip, t.ts),
]);
