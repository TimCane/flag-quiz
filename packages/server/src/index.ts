import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { initDb } from "./db.js";
import { authRoutes } from "./routes/auth.js";
import { healthRoutes } from "./routes/health.js";
import { sessionRoutes } from "./routes/sessions.js";
import { attemptRoutes } from "./routes/attempts.js";
import { flagProgressRoutes } from "./routes/flag-progress.js";
import { settingsRoutes } from "./routes/settings.js";
import { statsRoutes } from "./routes/stats.js";
import { exportRoutes } from "./routes/export.js";

const app = new Hono();

app.use("*", cors());

const db = initDb();

// Public routes
app.route("/api", healthRoutes);
app.route("/api", authRoutes(db));

// Protected routes (requireAuth applied within each route group)
app.route("/api", sessionRoutes(db));
app.route("/api", attemptRoutes(db));
app.route("/api", flagProgressRoutes(db));
app.route("/api", settingsRoutes(db));
app.route("/api", statsRoutes(db));
app.route("/api", exportRoutes(db));

// Serve client static files in production
const clientDir = process.env.CLIENT_DIR;
if (clientDir) {
  app.use("/*", serveStatic({ root: clientDir }));
  // SPA fallback: serve index.html for non-API, non-file routes
  app.get("*", serveStatic({ root: clientDir, path: "index.html" }));
}

const port = parseInt(process.env.PORT || "3000", 10);

serve({ fetch: app.fetch, port }, () => {
  console.log(`Server running on http://localhost:${port}`);
});
