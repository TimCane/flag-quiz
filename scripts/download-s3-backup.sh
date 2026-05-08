#!/bin/sh
set -e

# Load .env if present
if [ -f .env ]; then
  set -a
  . ./.env
  set +a
fi

# Validate required vars
for var in LITESTREAM_BUCKET LITESTREAM_ENDPOINT LITESTREAM_REGION LITESTREAM_ACCESS_KEY_ID LITESTREAM_SECRET_ACCESS_KEY LITESTREAM_PATH; do
  eval val=\$$var
  if [ -z "$val" ]; then
    echo "Error: $var is not set" >&2
    exit 1
  fi
done

DEST="${1:-./backup}"
mkdir -p "$DEST"

echo "Downloading s3://${LITESTREAM_BUCKET}/${LITESTREAM_PATH}/ to ${DEST}/ ..."

node -e "
const { S3Client, ListObjectsV2Command, GetObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');
const { pipeline } = require('stream/promises');

const client = new S3Client({
  endpoint: process.env.LITESTREAM_ENDPOINT,
  region: process.env.LITESTREAM_REGION,
  credentials: {
    accessKeyId: process.env.LITESTREAM_ACCESS_KEY_ID,
    secretAccessKey: process.env.LITESTREAM_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
});

async function download() {
  const dest = process.argv[1];
  const prefix = process.env.LITESTREAM_PATH + '/';
  let total = 0;
  let token;

  do {
    const list = await client.send(new ListObjectsV2Command({
      Bucket: process.env.LITESTREAM_BUCKET,
      Prefix: prefix,
      ContinuationToken: token,
    }));

    for (const obj of list.Contents || []) {
      const relPath = obj.Key.slice(prefix.length);
      if (!relPath) continue;

      const filePath = path.join(dest, relPath);
      fs.mkdirSync(path.dirname(filePath), { recursive: true });

      const res = await client.send(new GetObjectCommand({
        Bucket: process.env.LITESTREAM_BUCKET,
        Key: obj.Key,
      }));

      await pipeline(res.Body, fs.createWriteStream(filePath));
      total++;
    }

    token = list.IsTruncated ? list.NextContinuationToken : undefined;
  } while (token);

  console.log('Downloaded ' + total + ' files to ' + dest);
}

download().catch(e => { console.error(e.message); process.exit(1); });
" "$DEST"

echo "Done."
