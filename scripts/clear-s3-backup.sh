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

echo "Clearing s3://${LITESTREAM_BUCKET}/${LITESTREAM_PATH}/ ..."

node -e "
const { S3Client, ListObjectsV2Command, DeleteObjectsCommand } = require('@aws-sdk/client-s3');

const client = new S3Client({
  endpoint: process.env.LITESTREAM_ENDPOINT,
  region: process.env.LITESTREAM_REGION,
  credentials: {
    accessKeyId: process.env.LITESTREAM_ACCESS_KEY_ID,
    secretAccessKey: process.env.LITESTREAM_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
});

async function clearBucket() {
  let total = 0;
  let token;

  do {
    const list = await client.send(new ListObjectsV2Command({
      Bucket: process.env.LITESTREAM_BUCKET,
      Prefix: process.env.LITESTREAM_PATH + '/',
      ContinuationToken: token,
    }));

    const objects = (list.Contents || []).map(o => ({ Key: o.Key }));
    if (objects.length === 0) break;

    await client.send(new DeleteObjectsCommand({
      Bucket: process.env.LITESTREAM_BUCKET,
      Delete: { Objects: objects },
    }));

    total += objects.length;
    token = list.IsTruncated ? list.NextContinuationToken : undefined;
  } while (token);

  console.log('Deleted ' + total + ' objects.');
}

clearBucket().catch(e => { console.error(e.message); process.exit(1); });
"

echo "Done."
