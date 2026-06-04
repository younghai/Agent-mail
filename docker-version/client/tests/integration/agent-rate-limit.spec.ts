// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

/**
 * Integration test: rate-limit primitive in miniflare environment
 *
 * Note: EmailAgent DO depends on Workers AI binding (env.AI) for its primary
 * chat/draft operations. Workers AI is NOT emulated by miniflare, so we
 * cannot exercise the full EmailAgent RPC flow here.
 *
 * Instead this spec verifies the rate-limit helper (workers/lib/rate-limit/limiter.ts)
 * using an R2-backed storage adapter, confirming the primitive works in a real
 * Workers runtime (not Node.js). This validates the integration boundary that
 * the unit tests (tests/rate-limit.test.ts) cannot reach.
 *
 * Limitation acknowledged: full EmailAgent rate-limit flow requires staging
 * environment with Workers AI binding (M5 scope).
 */

import { env } from "cloudflare:test";
import { describe, it, expect } from "vitest";
import { checkRateLimit } from "../../workers/lib/rate-limit/limiter";

/**
 * Lightweight KV-backed storage using miniflare's in-memory KV namespace.
 * Adapts the Workers KVNamespace interface to RateLimitStorage.
 */
function makeKVStorage(kv: KVNamespace) {
	return {
		async get<T = unknown>(key: string): Promise<T | undefined> {
			const val = await kv.get(key, "json");
			return (val ?? undefined) as T | undefined;
		},
		async put(key: string, value: unknown): Promise<void> {
			await kv.put(key, JSON.stringify(value));
		},
	};
}

describe("rate-limit helper in Workers runtime", () => {
	const BASE_NOW = 1_000_000_000_000; // arbitrary epoch ms

	it("first call is allowed with remaining = limit - 1", async () => {
		const storage = makeKVStorage(env.SLACK_DEDUP_KV);
		const result = await checkRateLimit(storage, `rl-test-${crypto.randomUUID()}`, {
			limit: 5,
			windowSeconds: 60,
			now: () => BASE_NOW,
		});

		expect(result.allowed).toBe(true);
		if (result.allowed) {
			expect(result.remaining).toBe(4);
		}
	});

	it("call beyond limit is denied", async () => {
		const key = `rl-deny-${crypto.randomUUID()}`;
		const storage = makeKVStorage(env.SLACK_DEDUP_KV);
		const opts = { limit: 2, windowSeconds: 60, now: () => BASE_NOW };

		await checkRateLimit(storage, key, opts);
		await checkRateLimit(storage, key, opts);
		const result = await checkRateLimit(storage, key, opts);

		expect(result.allowed).toBe(false);
		if (!result.allowed) {
			expect(result.retryAfterSeconds).toBeGreaterThan(0);
		}
	});

	it("different keys are independent", async () => {
		const storage = makeKVStorage(env.SLACK_DEDUP_KV);
		const opts = { limit: 1, windowSeconds: 60, now: () => BASE_NOW };
		const keyA = `rl-indep-a-${crypto.randomUUID()}`;
		const keyB = `rl-indep-b-${crypto.randomUUID()}`;

		// Exhaust key A
		await checkRateLimit(storage, keyA, opts);
		const blockedA = await checkRateLimit(storage, keyA, opts);
		expect(blockedA.allowed).toBe(false);

		// Key B is unaffected
		const resultB = await checkRateLimit(storage, keyB, opts);
		expect(resultB.allowed).toBe(true);
	});
});
