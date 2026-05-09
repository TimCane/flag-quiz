# Environment Variables

## Required

| Variable | Description |
|----------|-------------|
| `APP_PASSWORD` | Password for authenticating users. Must be set for the app to accept logins. |

## Server

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | HTTP port the server listens on |
| `NODE_ENV` | - | Set to `production` in Docker |
| `CLIENT_DIR` | - | Path to the built client static files. When set, the server serves these and provides SPA fallback. |
| `DATA_DIR` | `./data` | Directory where `journal.db` is created |

## Litestream (S3 Database Backup)

All Litestream variables are optional. If `LITESTREAM_BUCKET` is not set, replication is disabled entirely.

| Variable | Description |
|----------|-------------|
| `LITESTREAM_BUCKET` | S3 bucket name |
| `LITESTREAM_ENDPOINT` | S3-compatible endpoint URL |
| `LITESTREAM_REGION` | AWS region (e.g., `us-east-1`) |
| `LITESTREAM_ACCESS_KEY_ID` | Access key for S3 authentication |
| `LITESTREAM_SECRET_ACCESS_KEY` | Secret key for S3 authentication |
| `LITESTREAM_PATH` | Path prefix within the bucket |

## Example `.env` File

```env
APP_PASSWORD=my-secret-password

# Optional: Litestream S3 backup
LITESTREAM_BUCKET=my-flag-quiz-backups
LITESTREAM_ENDPOINT=https://s3.us-east-1.amazonaws.com
LITESTREAM_REGION=us-east-1
LITESTREAM_ACCESS_KEY_ID=AKIA...
LITESTREAM_SECRET_ACCESS_KEY=...
LITESTREAM_PATH=backups/journal
```
