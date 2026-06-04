// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

/**
 * Unit tests for workers/lib/rate-limit/limiter.ts
 *
 * Uses a simple Map-based mock storage — no Durable Object runtime required.
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import {
	checkRateLimit,
	type RateLimitStorage,
} from "../workers/lib/rate-limit/limiter.ts";

// ---------------------------------------------------------------------------
// Mock storage backed by a plain Map
// ---------------------------------------------------------------------------
function makeStorage(): RateLimitStorage {
	const store = new Map<string, unknown>();
	return {
		async get<T = unknown>(key: string): Promise<T | undefined> {
			return store.get(key) as T | undefined;
		},
		async put(key: string, value: unknown): Promise<void> {
			store.set(key, value);
		},
	};
}

// Frozen clock factory: returns a function returning the given ms timestamp.
const clock = (ms: number) => () => ms;

const BASE_NOW = 1_000_000_000; // arbitrary epoch ms, start of a window

// ---------------------------------------------------------------------------
// Test 1 — first call is always allowed; remaining = limit - 1
// ---------------------------------------------------------------------------
test("first call is allowed and remaining equals limit minus one", async () => {
	const storage = makeStorage();
	const result = await checkRateLimit(storage, "user:alice:minute", {
		limit: 5,
		windowSeconds: 60,
		now: clock(BASE_NOW),
	});

	assert.equal(result.allowed, true);
	if (result.allowed) {
		assert.equal(result.remaining, 4);
		assert.equal(result.limit, 5);
	}
});

// ---------------------------------------------------------------------------
// Test 2 — call at limit-1 is still allowed; remaining = 0
// ---------------------------------------------------------------------------
test("call at limit-1 is allowed with remaining=0", async () => {
	const storage = makeStorage();
	const opts = { limit: 3, windowSeconds: 60, now: clock(BASE_NOW) };

	// First two calls consume slots 1 and 2
	await checkRateLimit(storage, "user:bob:minute", opts);
	await checkRateLimit(storage, "user:bob:minute", opts);

	// Third call: exactly at limit — should still be allowed, remaining=0
	const result = await checkRateLimit(storage, "user:bob:minute", opts);
	assert.equal(result.allowed, true);
	if (result.allowed) {
		assert.equal(result.remaining, 0);
	}
});

// ---------------------------------------------------------------------------
// Test 3 — call exceeding limit returns allowed=false with retryAfterSeconds > 0
// ---------------------------------------------------------------------------
test("call beyond limit is denied with retryAfterSeconds > 0", async () => {
	const storage = makeStorage();
	const opts = { limit: 2, windowSeconds: 60, now: clock(BASE_NOW) };

	await checkRateLimit(storage, "user:charlie:minute", opts);
	await checkRateLimit(storage, "user:charlie:minute", opts);

	// Third call must be denied
	const result = await checkRateLimit(storage, "user:charlie:minute", opts);
	assert.equal(result.allowed, false);
	if (!result.allowed) {
		assert.ok(result.retryAfterSeconds > 0, "retryAfterSeconds should be positive");
		assert.ok(typeof result.reason === "string" && result.reason.length > 0);
	}
});

// ---------------------------------------------------------------------------
// Test 4 — different bucketKeys are independent
// ---------------------------------------------------------------------------
test("different bucketKeys are independent of each other", async () => {
	const storage = makeStorage();
	const opts = { limit: 1, windowSeconds: 60, now: clock(BASE_NOW) };

	// Exhaust bucket A
	await checkRateLimit(storage, "user:alice:minute", opts);
	const blockedA = await checkRateLimit(storage, "user:alice:minute", opts);
	assert.equal(blockedA.allowed, false);

	// Bucket B is unaffected
	const resultB = await checkRateLimit(storage, "user:bob:minute", opts);
	assert.equal(resultB.allowed, true);
});

// ---------------------------------------------------------------------------
// Test 5 — advancing past window resets the counter
// ---------------------------------------------------------------------------
test("advancing past the window resets the counter", async () => {
	const storage = makeStorage();
	const windowSeconds = 60;
	const windowMs = windowSeconds * 1000;

	const opts = { limit: 2, windowSeconds, now: clock(BASE_NOW) };

	// Exhaust the first window
	await checkRateLimit(storage, "user:dave:minute", opts);
	await checkRateLimit(storage, "user:dave:minute", opts);
	const denied = await checkRateLimit(storage, "user:dave:minute", opts);
	assert.equal(denied.allowed, false);

	// Advance clock into the next window
	const nextWindowOpts = {
		limit: 2,
		windowSeconds,
		now: clock(BASE_NOW + windowMs + 1),
	};
	const allowed = await checkRateLimit(storage, "user:dave:minute", nextWindowOpts);
	assert.equal(allowed.allowed, true);
});

// ---------------------------------------------------------------------------
// Test 6 — limit=1: second call in same window is denied
// ---------------------------------------------------------------------------
test("limit=1 allows exactly one call then denies", async () => {
	const storage = makeStorage();
	const opts = { limit: 1, windowSeconds: 60, now: clock(BASE_NOW) };

	const first = await checkRateLimit(storage, "user:eve:minute", opts);
	assert.equal(first.allowed, true);
	if (first.allowed) {
		assert.equal(first.remaining, 0);
	}

	const second = await checkRateLimit(storage, "user:eve:minute", opts);
	assert.equal(second.allowed, false);
});

// ---------------------------------------------------------------------------
// Test 7 — retryAfterSeconds is within expected range for mid-window call
// ---------------------------------------------------------------------------
test("retryAfterSeconds is bounded by window duration when denied mid-window", async () => {
	const storage = makeStorage();
	const windowSeconds = 60;
	const windowMs = windowSeconds * 1000;

	// Set clock to 30 seconds into the window
	const windowStart = Math.floor(BASE_NOW / windowMs) * windowMs;
	const midWindow = windowStart + 30_000;

	const opts = { limit: 1, windowSeconds, now: clock(midWindow) };

	await checkRateLimit(storage, "user:frank:minute", opts);
	const result = await checkRateLimit(storage, "user:frank:minute", opts);

	assert.equal(result.allowed, false);
	if (!result.allowed) {
		// 30 seconds remain in the window; retryAfterSeconds should be ~30
		assert.ok(result.retryAfterSeconds > 0);
		assert.ok(result.retryAfterSeconds <= windowSeconds);
	}
});
