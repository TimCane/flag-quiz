# Getting Started

Flag Quiz is an interactive learning application that teaches users to recognize world flags using spaced repetition. It features three game modes, comprehensive analytics, and mnemonic support.

## Prerequisites

- [Node.js](https://nodejs.org/) 22 or later
- [pnpm](https://pnpm.io/) 10.33.0 (managed via `corepack`)

## Quick Start

1. **Enable pnpm via corepack:**

   ```bash
   corepack enable pnpm
   ```

2. **Install dependencies:**

   ```bash
   pnpm install
   ```

3. **Set the application password:**

   ```bash
   export APP_PASSWORD=your-secret-password
   ```

4. **Start all packages in development mode:**

   ```bash
   pnpm dev
   ```

   This runs the client dev server (port 5173) and the API server (port 3000) in parallel.

5. **Open the app:**

   Navigate to `http://localhost:5173` and log in with the password you set.

## Production Build

```bash
pnpm build
```

This builds all three packages (shared, client, server) in dependency order. The compiled server and static client files can then be run with:

```bash
CLIENT_DIR=packages/client/dist node packages/server/dist/index.js
```

## Docker

For containerized deployment, see [Docker](deployment/docker.md).
