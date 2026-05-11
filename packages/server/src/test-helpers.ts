import Database from "better-sqlite3";
import { Hono } from "hono";
import { cors } from "hono/cors";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import os from "os";
import { initDb } from "./db.js";
import { createDrizzleDb } from "./drizzle.js";
import { healthRoutes } from "./routes/health.js";
import { authRoutes } from "./routes/auth.js";
import { deckRoutes } from "./routes/decks.js";
import { sessionRoutes } from "./routes/sessions.js";
import { attemptRoutes } from "./routes/attempts.js";
import { flagProgressRoutes } from "./routes/flag-progress.js";
import { settingsRoutes } from "./routes/settings.js";
import { statsRoutes } from "./routes/stats.js";
import { exportRoutes } from "./routes/export.js";
import { tagRoutes } from "./routes/tags.js";

const TEST_PASSWORD = "test-password-123";

export function deriveToken(password: string): string {
  return crypto.createHmac("sha256", password).update("flag-quiz-token").digest("hex");
}

export const TEST_TOKEN = deriveToken(TEST_PASSWORD);

export interface TestContext {
  app: Hono;
  db: Database.Database;
  tmpDir: string;
}

export function createTestApp(): TestContext {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "fq-test-"));

  process.env.DATA_DIR = tmpDir;
  process.env.APP_PASSWORD = TEST_PASSWORD;

  const db = initDb();
  const drizzleDb = createDrizzleDb(db);

  const app = new Hono()
    .use("*", cors())
    .route("/api", healthRoutes)
    .route("/api", authRoutes(drizzleDb))
    .route("/api", deckRoutes(drizzleDb))
    .route("/api", settingsRoutes(drizzleDb))
    .route("/api/:collection", sessionRoutes(drizzleDb))
    .route("/api/:collection", attemptRoutes(drizzleDb))
    .route("/api/:collection", flagProgressRoutes(drizzleDb))
    .route("/api/:collection", statsRoutes(drizzleDb))
    .route("/api/:collection", exportRoutes(drizzleDb))
    .route("/api/:collection", tagRoutes(drizzleDb));

  app.onError((err, c) => {
    console.error(err);
    return c.json({ ok: false, error: "Internal server error" }, 500);
  });

  return { app, db, tmpDir };
}

export function cleanupTestApp(ctx: TestContext): void {
  if (ctx.tmpDir) {
    fs.rmSync(ctx.tmpDir, { recursive: true, force: true });
  }
}

export function authHeader(): Record<string, string> {
  return { Authorization: `Bearer ${TEST_TOKEN}` };
}

export async function jsonRequest(app: Hono, method: string, path: string, body?: unknown, headers?: Record<string, string>): Promise<Response> {
  const h: Record<string, string> = {
    "Content-Type": "application/json",
    ...authHeader(),
    ...headers,
  };

  return app.request(path, {
    method,
    headers: h,
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function get(app: Hono, path: string, headers?: Record<string, string>): Promise<Response> {
  return app.request(path, {
    method: "GET",
    headers: { ...authHeader(), ...headers },
  });
}

export function seedSession(db: Database.Database, opts: {
  id?: string;
  collectionId?: string;
  mode?: string;
  exitCondition?: string;
  quick?: number;
} = {}): string {
  const id = opts.id ?? crypto.randomUUID();
  const ts = new Date().toISOString();
  db.prepare(
    `INSERT INTO sessions (id, collection_id, mode, exit_condition, quick, started) VALUES (?,?,?,?,?,?)`,
  ).run(id, opts.collectionId ?? "world", opts.mode ?? "classic", opts.exitCondition ?? "normal", opts.quick ?? 0, ts);
  return id;
}

export function seedClassicAttempt(db: Database.Database, sessionId: string, opts: {
  flag?: string;
  guess?: string | null;
  correct?: number;
  collectionId?: string;
  accidental?: number;
  reactionTimeMs?: number;
} = {}): string {
  const id = crypto.randomUUID();
  const ts = new Date().toISOString();
  db.prepare(
    `INSERT INTO attempts (id, collection_id, session_id, mode, flag, guess, correct, forgotten, confidence, reaction_time_ms, ts, accidental)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
  ).run(
    id,
    opts.collectionId ?? "world",
    sessionId,
    "classic",
    opts.flag ?? "gb",
    opts.guess ?? "gb",
    opts.correct ?? 1,
    0,
    3,
    opts.reactionTimeMs ?? 1500,
    ts,
    opts.accidental ?? 0,
  );
  return id;
}

export function seedPickFlagAttempt(db: Database.Database, sessionId: string, opts: {
  flag?: string;
  guess?: string;
  correct?: number;
  collectionId?: string;
  options?: string[];
} = {}): string {
  const id = crypto.randomUUID();
  const ts = new Date().toISOString();
  db.prepare(
    `INSERT INTO attempts (id, collection_id, session_id, mode, flag, guess, options, correct, confidence, reaction_time_ms, ts, accidental)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
  ).run(
    id,
    opts.collectionId ?? "world",
    sessionId,
    "pick-the-flag",
    opts.flag ?? "fr",
    opts.guess ?? "fr",
    JSON.stringify(opts.options ?? ["fr", "de", "gb", "it"]),
    opts.correct ?? 1,
    3,
    2000,
    ts,
    0,
  );
  return id;
}

export function seedTag(db: Database.Database, opts: {
  id?: string;
  collectionId?: string;
  name?: string;
  sortOrder?: number;
  type?: string;
} = {}): string {
  const id = opts.id ?? crypto.randomUUID();
  db.prepare(
    `INSERT INTO tags (id, collection_id, name, sort_order, description, type, updated_at) VALUES (?,?,?,?,?,?,?)`,
  ).run(id, opts.collectionId ?? "world", opts.name ?? "Test Tag", opts.sortOrder ?? 0, "", opts.type ?? "group", new Date().toISOString());
  return id;
}
