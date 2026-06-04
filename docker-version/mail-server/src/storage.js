import * as Minio from 'minio';

const S3_ENDPOINT = process.env.S3_ENDPOINT || 'http://localhost:9000';
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY || 'minioadmin';
const S3_SECRET_KEY = process.env.S3_SECRET_KEY || '';
const S3_BUCKET = process.env.S3_BUCKET || 'agentic-inbox';
const PRESIGN_EXPIRY_SECONDS = 3600;

function parseEndpoint(url) {
  const u = new URL(url);
  return {
    endPoint: u.hostname,
    port: parseInt(u.port, 10) || (u.protocol === 'https:' ? 443 : 9000),
    useSSL: u.protocol === 'https:',
  };
}

let _client = null;

function getClient() {
  if (!_client) {
    const { endPoint, port, useSSL } = parseEndpoint(S3_ENDPOINT);
    _client = new Minio.Client({ endPoint, port, useSSL, accessKey: S3_ACCESS_KEY, secretKey: S3_SECRET_KEY });
  }
  return _client;
}

export async function ensureBucket() {
  try {
    const exists = await getClient().bucketExists(S3_BUCKET);
    if (!exists) await getClient().makeBucket(S3_BUCKET);
  } catch (err) {
    console.warn('[minio] bucket ensure failed (non-fatal):', err.message);
  }
}

export async function uploadObject(storageKey, buffer, contentType, size) {
  await getClient().putObject(S3_BUCKET, storageKey, buffer, size, { 'Content-Type': contentType });
}

export async function presignGetUrl(storageKey) {
  return getClient().presignedGetObject(S3_BUCKET, storageKey, PRESIGN_EXPIRY_SECONDS);
}

export async function deleteObject(storageKey) {
  try {
    await getClient().removeObject(S3_BUCKET, storageKey);
  } catch (err) {
    console.warn('[minio] delete failed (non-fatal):', err.message);
  }
}
