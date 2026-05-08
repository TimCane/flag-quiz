#!/bin/sh
set -e

if [ -z "$LITESTREAM_BUCKET" ]; then
  echo "[entrypoint] No LITESTREAM_BUCKET set — running without backup."
  exec node /app/packages/server/dist/index.js
fi

echo "[entrypoint] Restoring database from Litestream (if replica exists)..."
litestream restore -if-replica-exists -if-db-not-exists -config /etc/litestream.yml /data/journal.db

echo "[entrypoint] Starting with Litestream replication..."
exec litestream replicate -exec "node /app/packages/server/dist/index.js" -config /etc/litestream.yml
