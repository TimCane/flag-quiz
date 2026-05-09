# Local Development Setup

## Prerequisites

- **Node.js 22** or later
- **pnpm 10.33.0** (installed via corepack)

## Setup

1. **Enable corepack** (ships with Node.js):

   ```bash
   corepack enable pnpm
   ```

2. **Install dependencies**:

   ```bash
   pnpm install
   ```

3. **Set the password**:

   ```bash
   export APP_PASSWORD=dev-password
   ```

4. **Start development**:

   ```bash
   pnpm dev
   ```

   This runs all three packages in parallel:
   - **Shared**: TypeScript compiler in watch mode
   - **Client**: Vite dev server on `http://localhost:5173`
   - **Server**: Compiles and runs on `http://localhost:3000`

## Running Individual Packages

```bash
# Server only
pnpm dev:server

# Client only
pnpm dev:client

# Shared (watch mode)
pnpm --filter @flag-quiz/shared dev
```

## Building

```bash
# Build all packages
pnpm build

# Build individual packages
pnpm build:shared
pnpm build:client
pnpm build:server
```

The shared package must be built before client or server.

## Database

During development, the SQLite database is created at `./data/journal.db` relative to the server package. The database is automatically initialized with tables and default settings on first run.

## Client Proxy

The Vite dev server proxies `/api/*` requests to the backend server at `http://localhost:3000`, so both servers can run on different ports during development without CORS issues.
