import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
export const EMAIL_STREAM = 'email-events';

let _redis = null;

function getRedis() {
  if (!_redis) {
    _redis = new Redis(REDIS_URL, {
      lazyConnect: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
      retryStrategy: (times) => (times > 3 ? null : Math.min(times * 300, 3000)),
    });
    _redis.on('error', (err) => console.warn('[redis] connection error (non-fatal):', err.message));
  }
  return _redis;
}

export async function publishEmailEvent(eventType, payload) {
  try {
    await getRedis().xadd(
      EMAIL_STREAM, '*',
      'event_type', eventType,
      'payload', JSON.stringify(payload),
    );
  } catch (err) {
    console.warn('[redis] publish skipped:', err.message);
  }
}
