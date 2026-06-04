// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

/**
 * Sliding-window rate limiter backed by an abstract key-value storage.
 *
 * Uses epoch-bucketed keys so old buckets naturally become stale.
 * NOTE: DO storage has no native TTL support (unlike KV). Old bucket keys
 * will persist in DO storage until a periodic alarm-based cleanup is added.
 * Because keys are namespaced by epoch window, stale keys are harmless but
 * do accumulate. A future cleanup pass can scan and delete keys older than
 * the window duration.
 */

export interface RateLimitStorage {
	get<T = unknown>(key: string): Promise<T | undefined>;
	put(key: string, value: unknown, options?: { expirationTtl?: number }): Promise<void>;
}

export interface RateLimitOptions {
	limit: number;
	windowSeconds: number;
	/** Injectable clock for deterministic testing. Defaults to Date.now. */
	now?: () => number;
}

export type RateLimitDecision =
	| { allowed: true; remaining: number; limit: number }
	| { allowed: false; retryAfterSeconds: number; reason: string };

/**
 * Check and increment a rate-limit counter for a given bucket key.
 *
 * @param storage  Abstracted storage backend (DO storage or KV adapter).
 * @param bucketKey  Logical key identifying the rate-limit bucket, e.g.
 *                   `agent:<mailboxId>:minute`. The window epoch is appended
 *                   internally so different windows use different keys.
 * @param opts  Limit configuration and optional clock injection.
 */
export async function checkRateLimit(
	storage: RateLimitStorage,
	bucketKey: string,
	opts: RateLimitOptions,
): Promise<RateLimitDecision> {
	const nowMs = (opts.now ?? (() => Date.now()))();
	const windowMs = opts.windowSeconds * 1000;
	const windowStart = Math.floor(nowMs / windowMs) * windowMs;
	const key = `rate-limit:${bucketKey}:${windowStart}`;

	const current = ((await storage.get<number>(key)) ?? 0);

	if (current >= opts.limit) {
		const retryAfterSeconds = Math.ceil((windowStart + windowMs - nowMs) / 1000);
		return {
			allowed: false,
			retryAfterSeconds,
			reason: `Rate limit exceeded: ${opts.limit} per ${opts.windowSeconds}s`,
		};
	}

	// NOTE: DO storage does not support expirationTtl natively (KV does).
	// We store without TTL; stale epoch keys persist but are harmless since
	// each window uses a distinct key. Periodic cleanup via DO alarm is future work.
	await storage.put(key, current + 1);

	return {
		allowed: true,
		remaining: opts.limit - current - 1,
		limit: opts.limit,
	};
}
