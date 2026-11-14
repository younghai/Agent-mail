import {
  S3Client, HeadBucketCommand, CreateBucketCommand,
  PutObjectCommand, GetObjectCommand, DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const S3_ENDPOINT = process.env.S3_ENDPOINT || 'http://localhost:9000';
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY || 'minioadmin';
const S3_SECRET_KEY = process.env.S3_SECRET_KEY || '';
const S3_BUCKET = process.env.S3_BUCKET || 'agentic-inbox';
const PRESIGN_EXPIRY_SECONDS = 3600;

let _client = null;

function getClient() {
  if (process.env.REPLIT_WEB_ENABLED === 'true' &&
      (!process.env.S3_ENDPOINT?.startsWith('https://') || !process.env.S3_ACCESS_KEY ||
       !process.env.S3_SECRET_KEY || !process.env.S3_BUCKET)) {
    const error = new Error('Durable attachment storage is not configured. Configure an HTTPS S3 endpoint and bucket.');
    error.code = 'STORAGE_NOT_CONFIGURED';
    error.status = 503;
    throw error;
  }
  if (!_client) {
    _client = new S3Client({
      endpoint: S3_ENDPOINT,
      region: process.env.S3_REGION || 'us-east-1',
      forcePathStyle: true,
      credentials: { accessKeyId: S3_ACCESS_KEY, secretAccessKey: S3_SECRET_KEY },
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
    });
  }
  return _client;
}

export async function ensureBucket() {
  try {
    try {
      await getClient().send(new HeadBucketCommand({ Bucket: S3_BUCKET }));
    } catch (err) {
      if (err.$metadata?.httpStatusCode !== 404) throw err;
      await getClient().send(new CreateBucketCommand({ Bucket: S3_BUCKET }));
    }
  } catch (err) {
    console.warn('[minio] bucket ensure failed (non-fatal):', err.message);
  }
}

export async function uploadObject(storageKey, buffer, contentType, size) {
  await getClient().send(new PutObjectCommand({
    Bucket: S3_BUCKET, Key: storageKey, Body: buffer,
    ContentType: contentType, ContentLength: size,
  }));
}

export async function presignGetUrl(storageKey) {
  return getSignedUrl(getClient(), new GetObjectCommand({
    Bucket: S3_BUCKET, Key: storageKey,
  }), { expiresIn: PRESIGN_EXPIRY_SECONDS });
}

export async function deleteObject(storageKey) {
  try {
    await getClient().send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: storageKey }));
  } catch (err) {
    console.warn('[minio] delete failed (non-fatal):', err.message);
  }
}
