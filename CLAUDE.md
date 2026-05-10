# Flag Quiz

A full-stack TypeScript app for learning world flags using spaced repetition (FSRS). pnpm monorepo with three packages: shared, client, server.

## Quick Reference

```bash
pnpm install          # Install all dependencies
pnpm dev              # Start client (5173) + server (3000) in parallel
pnpm build            # Build shared -> client -> server
pnpm dev:client       # Client only
pnpm dev:server       # Server only
```

Requires `APP_PASSWORD` env var set (or `.env` at repo root).

## Monorepo Layout

```
packages/
  shared/   — Zod schemas, enums, flag metadata, FSRS utils, confusion map
  client/   — React 19 SPA (Vite, Tailwind CSS 4, React Router 7)
  server/   — Hono REST API + SQLite (better-sqlite3, WAL mode)
docs/       — Architecture, API reference, deployment guides
scripts/    — Seed scripts, backup utilities
data/       — SQLite database (gitignored)
```

**Dependency graph:** client and server both depend on shared. Build shared first.

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, React Router 7, Vite 6, Tailwind CSS 4, Recharts, Lucide icons |
| Backend | Hono 4, Node.js 22, better-sqlite3 |
| Validation | Zod (shared schemas used by both client and server) |
| Spaced Repetition | ts-fsrs (FSRS algorithm) |
| PWA | vite-plugin-pwa (auto-update service worker) |
| Database | SQLite with WAL mode, Litestream for S3 replication |
| Package Manager | pnpm 10 with workspaces |

## Code Conventions

- **TypeScript strict mode** throughout. Target ES2022, bundler module resolution.
- **Components:** PascalCase filenames. Pages use `useX` hook for state/logic + component for rendering.
- **Variables/functions:** camelCase. Booleans prefixed with `is`/`should`.
- **Imports:** Use workspace aliases (`@flag-quiz/shared`). ES module `.js` extensions in compiled output.
- **Database:** SQLite integers for booleans (0/1). ISO 8601 strings for timestamps. JSON.stringify for arrays. Parameterized prepared statements. Transactions for multi-step operations.
- **API responses:** `{ ok: boolean, ...data }` shape. Zod `.safeParse()` for request validation.
- **HTTP errors:** 400 bad request, 401 unauthorized, 404 not found, 409 conflict, 429 rate limit.
- **Styling:** Tailwind utility classes. Custom theme called "Diplomatic Atlas" (warm gray-blue, emerald, gold). Fonts: DM Serif Display, DM Sans, JetBrains Mono (self-hosted via fontsource).

## Architecture Notes

- **Auth:** Single-password model. `POST /api/auth/check` validates password, returns bearer token. Protected routes use `Authorization: Bearer <token>` header. Rate-limited to 10 attempts/60s.
- **Client proxy:** Vite dev server proxies `/api` requests to `localhost:3000`. In production, the server serves the built client static files via `CLIENT_DIR` env var.
- **Game modes:** Classic (type name), Pick the Flag (choose flag from options), Pick the Country (choose country from options). Each has its own attempt table.
- **FSRS states:** New (0), Learning (1), Review (2), Relearning (3). Four ratings: Again, Hard, Good, Easy.
- **No test framework** is currently configured.

## Key Files

- `packages/shared/src/flags.ts` — 197 flag objects with metadata (code, name, colors, patterns, symbols, continent)
- `packages/shared/src/schemas/` — Zod schemas for all domain types
- `packages/shared/src/fsrs.ts` — FSRS scheduling wrapper
- `packages/server/src/db.ts` — SQLite schema, migrations, table creation
- `packages/server/src/routes/` — All API route handlers
- `packages/client/src/pages/` — Page components (Home, Play, Analytics, Settings, etc.)
- `packages/client/src/components/game/` — Game session and round components
- `packages/client/vite.config.ts` — Vite + React + Tailwind + PWA + dev proxy

## Database Tables

`sessions`, `classic_attempts`, `pick_flag_attempts`, `pick_country_attempts`, `flag_progress` (FSRS state), `settings` (key-value), `tags`, `flag_tags` (junction).

Schema details in `packages/server/src/db.ts` and `docs/server/database.md`.

## Deployment

Multi-stage Docker build (7 stages). `docker-compose.yml` mounts `/data` volume for SQLite persistence. Optional Litestream replication to S3. Health check on `/api/health`.

Key env vars: `APP_PASSWORD` (required), `PORT` (default 3000), `DATA_DIR`, `CLIENT_DIR`, `LITESTREAM_*`.
