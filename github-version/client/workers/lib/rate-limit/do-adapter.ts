// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

/**
 * Adapter that wraps DurableObjectStorage to satisfy the RateLimitStorage interface.
 *
 * DO storage does not support TTL/expirationTtl natively (unlike Workers KV).
 * The rate limiter stores epoch-bucketed keys, so old buckets become stale but
 * harmless. Cleanup of old keys is deferred to a future DO alarm implementation.
 *
 * We accept `unknown` for the storage parameter to avoid version-mismatch issues
 * between @cloudflare/workers-types variants; the caller casts at the boundary.
 */

import type { RateLimitStorage } from "./limiter.ts";

export function asRateLimitStorage(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	doStorage: any,
): RateLimitStorage {
	return {
		async get<T = unknown>(key: string): Promise<T | undefined> {
			const value = await (doStorage as { get(k: string): Promise<T | null | undefined> }).get(key);
			return value ?? undefined;
		},
		async put(key: string, value: unknown): Promise<void> {
			// DO storage.put does not accept expirationTtl; we omit it intentionally.
			await (doStorage as { put(k: string, v: unknown): Promise<void> }).put(key, value);
		},
	};
}
