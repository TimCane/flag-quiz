# Monorepo Structure

The project uses pnpm workspaces to manage three packages in a single repository.

## Workspace Configuration

Defined in `pnpm-workspace.yaml`:

```yaml
packages:
  - "packages/*"
```

## Packages

| Package | Name | Purpose |
|---------|------|---------|
| `packages/shared` | `@flag-quiz/shared` | Types, schemas, enums, flag data, FSRS utilities |
| `packages/client` | `@flag-quiz/client` | React SPA (Vite + Tailwind) |
| `packages/server` | `@flag-quiz/server` | Node.js API server (Hono + SQLite) |

## Dependency Graph

```
@flag-quiz/client  --> @flag-quiz/shared
@flag-quiz/server  --> @flag-quiz/shared
```

Both the client and server depend on the shared package. The shared package has no internal dependencies.

## Build Order

The shared package must be built before client or server, as both import its compiled output. The root `pnpm build` command handles this via pnpm's topological build ordering.

## TypeScript Configuration

Each package has its own `tsconfig.json` that extends `tsconfig.base.json` in the project root. The base config sets:

- Target: ES2022
- Module: ESNext with bundler resolution
- Strict mode enabled
- Declaration and declaration map generation
