# Litestream (Database Backup)

[Litestream](https://litestream.io/) continuously replicates the SQLite database to S3-compatible object storage, providing disaster recovery without manual backups.

## How It Works

Litestream runs as a wrapper around the Node.js server process. It monitors the SQLite WAL (Write-Ahead Log) and streams changes to an S3 bucket in near-real-time.

## Configuration

Litestream is configured via `/etc/litestream.yml` (copied into the Docker image):

```yaml
dbs:
  - path: /data/journal.db
    replicas:
      - type: s3
        bucket: ${LITESTREAM_BUCKET}
        path: ${LITESTREAM_PATH}
        endpoint: ${LITESTREAM_ENDPOINT}
        region: ${LITESTREAM_REGION}
        access-key-id: ${LITESTREAM_ACCESS_KEY_ID}
        secret-access-key: ${LITESTREAM_SECRET_ACCESS_KEY}
```

All values are read from environment variables.

## Startup Behavior

The entrypoint script (`entrypoint.sh`) handles two scenarios:

### With Litestream (recommended for production)

When `LITESTREAM_BUCKET` is set:

1. Restore the database from the latest S3 replica (if one exists and no local DB is present).
2. Start the server wrapped by Litestream's `replicate` command, which continuously streams WAL changes to S3.

### Without Litestream

When `LITESTREAM_BUCKET` is not set:

1. Start the server directly without any replication.
2. The database exists only on the local volume.

## Required Environment Variables

| Variable | Description |
|----------|-------------|
| `LITESTREAM_BUCKET` | S3 bucket name (omit to disable replication entirely) |
| `LITESTREAM_ENDPOINT` | S3-compatible endpoint URL (e.g., for Backblaze B2, MinIO) |
| `LITESTREAM_REGION` | AWS region |
| `LITESTREAM_ACCESS_KEY_ID` | AWS/S3 access key |
| `LITESTREAM_SECRET_ACCESS_KEY` | AWS/S3 secret key |
| `LITESTREAM_PATH` | Path prefix within the bucket for the database replica |

## Compatible Storage Providers

Litestream works with any S3-compatible storage:

- AWS S3
- Backblaze B2
- MinIO
- DigitalOcean Spaces
- Cloudflare R2
