# --- Stage 1: Install dependencies ---
FROM node:22-alpine AS deps
RUN corepack enable pnpm
WORKDIR /build
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/client/package.json packages/client/
COPY packages/server/package.json packages/server/
RUN pnpm install --frozen-lockfile

# --- Stage 2: Build shared ---
FROM deps AS shared-build
COPY packages/shared/ packages/shared/
RUN pnpm --filter @flag-quiz/shared build

# --- Stage 3: Build client ---
FROM shared-build AS client-build
COPY packages/client/ packages/client/
RUN pnpm --filter @flag-quiz/client build

# --- Stage 4: Build server ---
FROM shared-build AS server-build
COPY packages/server/ packages/server/
RUN pnpm --filter @flag-quiz/server build

# --- Stage 5: Production server deps ---
FROM node:22-alpine AS server-prod-deps
RUN corepack enable pnpm && apk add --no-cache python3 make g++
WORKDIR /build
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/server/package.json packages/server/
RUN pnpm install --frozen-lockfile --prod --filter @flag-quiz/server --filter @flag-quiz/shared

# --- Stage 6: Litestream binary ---
FROM litestream/litestream:0.3.13 AS litestream

# --- Stage 7: Runtime ---
FROM node:22-alpine
RUN apk add --no-cache ca-certificates

WORKDIR /app

# Server deps + build
COPY --from=server-prod-deps /build/node_modules /app/node_modules
COPY --from=server-prod-deps /build/packages/server/node_modules /app/packages/server/node_modules
COPY --from=server-build /build/packages/server/dist /app/packages/server/dist
COPY --from=server-build /build/packages/server/package.json /app/packages/server/package.json

# Shared build + deps (server imports from it at runtime)
COPY --from=server-prod-deps /build/packages/shared/node_modules /app/packages/shared/node_modules
COPY --from=shared-build /build/packages/shared/dist /app/packages/shared/dist
COPY --from=shared-build /build/packages/shared/package.json /app/packages/shared/package.json

# Client static build
COPY --from=client-build /build/packages/client/dist /app/client

# Litestream
COPY --from=litestream /usr/local/bin/litestream /usr/local/bin/litestream

COPY litestream.yml /etc/litestream.yml
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENV CLIENT_DIR=/app/client
ENV DATA_DIR=/data
ENV PORT=3000
ENV NODE_ENV=production

EXPOSE 3000
VOLUME /data

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

ENTRYPOINT ["/entrypoint.sh"]
