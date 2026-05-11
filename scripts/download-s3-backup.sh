#!/bin/sh
set -e

# Restore the production Litestream backup into the local dev database.
# Usage: ./scripts/download-s3-backup.sh
#
# Reads S3 credentials from .env at repo root. Downloads litestream if not
# already present, restores the DB snapshot, and copies it to both local
# data directories so it works with `pnpm dev` and `pnpm dev:server`.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Load .env if present
if [ -f "$REPO_ROOT/.env" ]; then
  set -a
  . "$REPO_ROOT/.env"
  set +a
fi

# Validate required vars
for var in LITESTREAM_BUCKET LITESTREAM_ENDPOINT LITESTREAM_REGION LITESTREAM_ACCESS_KEY_ID LITESTREAM_SECRET_ACCESS_KEY LITESTREAM_PATH; do
  eval val=\$$var
  if [ -z "$val" ]; then
    echo "Error: $var is not set (check .env)" >&2
    exit 1
  fi
done

# Ensure litestream is available
LITESTREAM_BIN="$REPO_ROOT/.cache/litestream"
LITESTREAM_VERSION="0.3.13"

ensure_litestream() {
  if [ -x "$LITESTREAM_BIN" ]; then
    return
  fi

  echo "Downloading litestream v${LITESTREAM_VERSION}..."
  mkdir -p "$(dirname "$LITESTREAM_BIN")"

  ARCH=$(uname -m)
  case "$ARCH" in
    x86_64|amd64) ARCH="amd64" ;;
    aarch64|arm64) ARCH="arm64" ;;
    *) echo "Unsupported architecture: $ARCH" >&2; exit 1 ;;
  esac

  OS=$(uname -s | tr '[:upper:]' '[:lower:]')
  TAR_URL="https://github.com/benbjohnson/litestream/releases/download/v${LITESTREAM_VERSION}/litestream-v${LITESTREAM_VERSION}-${OS}-${ARCH}.tar.gz"

  TMP_TAR=$(mktemp)
  curl -fsSL "$TAR_URL" -o "$TMP_TAR"
  tar -xzf "$TMP_TAR" -C "$(dirname "$LITESTREAM_BIN")" litestream
  chmod +x "$LITESTREAM_BIN"
  rm -f "$TMP_TAR"

  echo "Installed litestream to $LITESTREAM_BIN"
}

ensure_litestream

# Restore to a temp path first, then copy to both data dirs
RESTORE_PATH="$REPO_ROOT/.cache/restored.db"
rm -f "$RESTORE_PATH" "$RESTORE_PATH-wal" "$RESTORE_PATH-shm"

# Generate a temporary litestream config for the restore
RESTORE_CONFIG=$(mktemp)
cat > "$RESTORE_CONFIG" <<EOF
dbs:
  - path: ${RESTORE_PATH}
    replicas:
      - type: s3
        bucket: ${LITESTREAM_BUCKET}
        path: ${LITESTREAM_PATH}
        endpoint: ${LITESTREAM_ENDPOINT}
        region: ${LITESTREAM_REGION}
        access-key-id: ${LITESTREAM_ACCESS_KEY_ID}
        secret-access-key: ${LITESTREAM_SECRET_ACCESS_KEY}
EOF

echo "Restoring s3://${LITESTREAM_BUCKET}/${LITESTREAM_PATH} ..."
"$LITESTREAM_BIN" restore -config "$RESTORE_CONFIG" "$RESTORE_PATH"
rm -f "$RESTORE_CONFIG"

if [ ! -f "$RESTORE_PATH" ]; then
  echo "Error: restore completed but no DB file found" >&2
  exit 1
fi

# Copy to both data directories
ROOT_DIR="$REPO_ROOT/data"
SERVER_DIR="$REPO_ROOT/packages/server/data"

for DIR in "$ROOT_DIR" "$SERVER_DIR"; do
  mkdir -p "$DIR"
  rm -f "$DIR/journal.db" "$DIR/journal.db-wal" "$DIR/journal.db-shm"
  cp "$RESTORE_PATH" "$DIR/journal.db"
  echo "  -> $DIR/journal.db"
done

rm -f "$RESTORE_PATH"

# Sanity check
SIZE=$(wc -c < "$ROOT_DIR/journal.db" | tr -d ' ')
echo ""
echo "Restored ${SIZE} bytes"
node -e "
const Database = require('better-sqlite3');
const db = new Database('$ROOT_DIR/journal.db');
const tables = db.prepare(\"SELECT name FROM sqlite_master WHERE type='table' ORDER BY name\").all();
console.log('Tables: ' + tables.map(t => t.name).join(', '));
const sessions = db.prepare('SELECT COUNT(*) AS c FROM sessions').get();
console.log('Sessions: ' + sessions.c);
"
echo ""
echo "Ready — run: pnpm dev"
