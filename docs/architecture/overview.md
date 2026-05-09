# Architecture Overview

Flag Quiz is a full-stack TypeScript application organized as a pnpm monorepo. The server hosts both the API and the built client as static files in production.

## High-Level Diagram

```
Browser (React SPA)
    |
    | HTTP (fetch)
    |
Hono Server (Node.js)
    |
    | better-sqlite3
    |
SQLite (journal.db)
    |
    | WAL streaming (optional)
    |
Litestream --> S3-compatible storage
```

## Request Flow

1. The client makes authenticated `fetch` calls to `/api/*` endpoints.
2. The Hono server validates the Bearer token via middleware.
3. Route handlers read from or write to the SQLite database using prepared statements.
4. Responses are returned as JSON.
5. In production, non-API requests are served as static files from the built client, with SPA fallback to `index.html`.

## Key Design Decisions

- **SQLite over Postgres/MySQL**: Single-file database keeps deployment simple. WAL mode allows concurrent reads during writes. Litestream handles backup and replication.
- **Hono over Express**: Lightweight, fast, and TypeScript-native. Small dependency footprint suitable for an embedded application.
- **Shared package**: Types, schemas, enums, flag data, and FSRS utilities are shared between client and server to ensure consistency.
- **Single-password auth**: The app is designed for personal use. A single `APP_PASSWORD` environment variable secures all access.
