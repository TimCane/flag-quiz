import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { initDb } from "./db.js";
import { createDrizzleDb } from "./drizzle.js";
import { authRoutes } from "./routes/auth.js";
import { healthRoutes } from "./routes/health.js";
import { deckRoutes } from "./routes/decks.js";
import { sessionRoutes } from "./routes/sessions.js";
import { attemptRoutes } from "./routes/attempts.js";
import { flagProgressRoutes } from "./routes/flag-progress.js";
import { settingsRoutes } from "./routes/settings.js";
import { statsRoutes } from "./routes/stats.js";
import { exportRoutes } from "./routes/export.js";
import { tagRoutes } from "./routes/tags.js";

const corsOrigin = process.env.CORS_ORIGIN;

const db = initDb();
const drizzleDb = createDrizzleDb(db);

// Chain .route() calls so TypeScript accumulates route types for Hono RPC
const api = new Hono()
  .use("*", cors(corsOrigin ? { origin: corsOrigin } : {}))
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

api.onError((err, c) => {
  console.error(err);
  return c.json({ ok: false, error: "Internal server error" }, 500);
});

export type AppType = typeof api;

// Serve client static files in production
const clientDir = process.env.CLIENT_DIR;
if (clientDir) {
  api.use("/*", serveStatic({ root: clientDir }));
  api.get("*", serveStatic({ root: clientDir, path: "index.html" }));
}

const port = parseInt(process.env.PORT || "3000", 10);

serve({ fetch: api.fetch, port }, () => {
  console.log(`Server running on http://localhost:${port}`);
});
