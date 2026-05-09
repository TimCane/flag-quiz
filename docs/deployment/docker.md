# Docker Deployment

The application is containerized using a multi-stage Dockerfile and can be run with Docker Compose.

## Multi-Stage Build

The Dockerfile uses 7 stages to minimize the final image size:

| Stage | Purpose |
|-------|---------|
| `deps` | Install all dependencies via pnpm |
| `shared-build` | Compile the shared TypeScript package |
| `client-build` | Build the React client (static files) |
| `server-build` | Compile the server TypeScript |
| `server-prod-deps` | Install production-only server dependencies |
| `litestream` | Copy the Litestream binary |
| Runtime | Final `node:22-alpine` image with compiled code |

The client and server builds run from the shared-build stage, allowing parallel compilation.

## Docker Compose

```yaml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - flag-data:/data
    environment:
      - APP_PASSWORD=${APP_PASSWORD}
      - LITESTREAM_ACCESS_KEY_ID=${LITESTREAM_ACCESS_KEY_ID}
      - LITESTREAM_SECRET_ACCESS_KEY=${LITESTREAM_SECRET_ACCESS_KEY}
      - LITESTREAM_BUCKET=${LITESTREAM_BUCKET}
      - LITESTREAM_ENDPOINT=${LITESTREAM_ENDPOINT}
      - LITESTREAM_PATH=${LITESTREAM_PATH}
      - LITESTREAM_REGION=${LITESTREAM_REGION}
    restart: unless-stopped

volumes:
  flag-data:
```

## Running

```bash
# Set required environment variable
export APP_PASSWORD=your-secret-password

# Build and start
docker compose up -d

# View logs
docker compose logs -f

# Stop
docker compose down
```

## Health Check

The container includes a health check that polls `GET /api/health` every 30 seconds:

```
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3
  CMD wget -qO- http://localhost:3000/api/health || exit 1
```

## Volumes

The `/data` volume persists the SQLite database file (`journal.db`). This volume must survive container restarts to preserve user data.

## Default Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `CLIENT_DIR` | `/app/client` | Path to built client files |
| `DATA_DIR` | `/data` | Database directory |
| `PORT` | `3000` | Server port |
| `NODE_ENV` | `production` | Runtime environment |
