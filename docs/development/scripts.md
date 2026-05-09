# Scripts

All scripts are run from the repository root using `pnpm`.

## Development

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `pnpm dev` | Run all packages in parallel (shared watch + client dev server + server) |
| `dev:server` | `pnpm dev:server` | Run the server package only |
| `dev:client` | `pnpm dev:client` | Run the client Vite dev server only |

## Build

| Script | Command | Description |
|--------|---------|-------------|
| `build` | `pnpm build` | Build all packages in dependency order |
| `build:shared` | `pnpm build:shared` | Build the shared package |
| `build:client` | `pnpm build:client` | Build the client (TypeScript check + Vite build) |
| `build:server` | `pnpm build:server` | Build the server (TypeScript compilation) |

## Migration

| Script | Command | Description |
|--------|---------|-------------|
| `migrate` | `pnpm migrate` | Run the v1 data migration script (`scripts/migrate-v1.ts` via tsx) |

## Package-Level Scripts

### Client (`packages/client`)

| Script | Description |
|--------|-------------|
| `dev` | Start Vite dev server (port 5173) |
| `build` | TypeScript check + Vite production build |
| `preview` | Preview the production build locally |

### Server (`packages/server`)

| Script | Description |
|--------|-------------|
| `dev` | Compile TypeScript and run the server |
| `dev:watch` | Run with tsx in watch mode (auto-restart on changes) |
| `build` | Compile TypeScript |
| `start` | Run the compiled server (`node dist/index.js`) |

### Shared (`packages/shared`)

| Script | Description |
|--------|-------------|
| `build` | Compile TypeScript |
| `dev` | Compile TypeScript in watch mode |
