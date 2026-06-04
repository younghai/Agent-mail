// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

/**
 * Unit tests for workers/lib/observability/slack-alert.ts
 *
 * These tests never make real HTTP calls. They exercise the public interface
 * through __setSlackAlertClient (mock injection) and DefaultSlackAlertClient
 * (with a controlled fetch and clock).
 */

import assert from "node:assert/strict";
import { test, beforeEach, afterEach } from "node:test";
import {
	__setSlackAlertClient,
	initSlackAlert,
	notifySlack,
	DefaultSlackAlertClient,
	memoryDedupStorage,
	kvDedupStorage,
	type SlackAlertClient,
	type AlertPayload,
	type NotifyResult,
} from "../workers/lib/observability/slack-alert.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Capture the original fetch so we can restore it after each test. */
let originalFetch: typeof globalThis.fetch;

beforeEach(() => {
	originalFetch = globalThis.fetch;
	// Reset to no-op client before every test.
	__setSlackAlertClient({
		async notify(_p: AlertPayload): Promise<NotifyResult> {
			return { sent: false, deduped: false };
		},
	});
});

afterEach(() => {
	globalThis.fetch = originalFetch;
});

// ---------------------------------------------------------------------------
// Test 1 — no webhook URL: initSlackAlert installs a no-op, notifySlack is safe
// ---------------------------------------------------------------------------
test("notifySlack is no-op when SLACK_ALERT_WEBHOOK_URL is absent", async () => {
	initSlackAlert({});

	const result = await notifySlack({
		severity: "fatal",
		title: "Test",
		message: "Should not throw",
	});

	assert.equal(result.sent, false);
	assert.equal(result.deduped, false);
});

// ---------------------------------------------------------------------------
// Test 2 — same fingerprint within TTL is deduped; fetch called only once
// ---------------------------------------------------------------------------
test("same fingerprint within TTL is deduped and fetch is called only once", async () => {
	let fetchCallCount = 0;
	globalThis.fetch = async (_url: RequestInfo | URL, _init?: RequestInit) => {
		fetchCallCount++;
		return new Response("ok", { status: 200 });
	};

	const client = new DefaultSlackAlertClient({
		webhookUrl: "https://hooks.slack.com/test",
		dedupTtlMs: 60_000, // 1 minute
		storage: memoryDedupStorage(),
		now: () => 1_000_000, // frozen clock
	});

	const payload: AlertPayload = {
		severity: "error",
		title: "DB down",
		message: "Connection refused",
		fingerprint: "db-connection-error",
	};

	const r1 = await client.notify(payload);
	const r2 = await client.notify(payload); // same fingerprint, same time

	assert.equal(r1.sent, true);
	assert.equal(r1.deduped, false);
	assert.equal(r2.sent, false);
	assert.equal(r2.deduped, true);
	assert.equal(fetchCallCount, 1);
});

// ---------------------------------------------------------------------------
// Test 3 — different fingerprints are NOT deduped; each gets its own fetch call
// ---------------------------------------------------------------------------
test("different fingerprints are not deduped — each triggers its own fetch", async () => {
	let fetchCallCount = 0;
	globalThis.fetch = async (_url: RequestInfo | URL, _init?: RequestInit) => {
		fetchCallCount++;
		return new Response("ok", { status: 200 });
	};

	const client = new DefaultSlackAlertClient({
		webhookUrl: "https://hooks.slack.com/test",
		dedupTtlMs: 60_000,
		storage: memoryDedupStorage(),
		now: () => 1_000_000,
	});

	await client.notify({ severity: "error", title: "A", message: "msg-a", fingerprint: "fp-a" });
	await client.notify({ severity: "error", title: "B", message: "msg-b", fingerprint: "fp-b" });

	assert.equal(fetchCallCount, 2);
});

// ---------------------------------------------------------------------------
// Test 4 — TTL expiry re-enables sending
// ---------------------------------------------------------------------------
test("after TTL expires the same fingerprint is sent again", async () => {
	let fetchCallCount = 0;
	globalThis.fetch = async (_url: RequestInfo | URL, _init?: RequestInit) => {
		fetchCallCount++;
		return new Response("ok", { status: 200 });
	};

	let nowMs = 1_000_000;
	const client = new DefaultSlackAlertClient({
		webhookUrl: "https://hooks.slack.com/test",
		dedupTtlMs: 5_000, // 5 seconds
		storage: memoryDedupStorage(),
		now: () => nowMs,
	});

	const payload: AlertPayload = {
		severity: "fatal",
		title: "Cache miss",
		message: "Redis unreachable",
		fingerprint: "redis-down",
	};

	const r1 = await client.notify(payload);
	assert.equal(r1.sent, true);

	// Advance clock past TTL.
	nowMs += 6_000;

	const r2 = await client.notify(payload);
	assert.equal(r2.sent, true);
	assert.equal(r2.deduped, false);
	assert.equal(fetchCallCount, 2);
});

// ---------------------------------------------------------------------------
// Test 5 — HTTP 4xx/5xx response returns sent:false without throwing
// ---------------------------------------------------------------------------
test("HTTP error response returns sent:false and does not throw", async () => {
	globalThis.fetch = async (_url: RequestInfo | URL, _init?: RequestInit) => {
		return new Response("Bad Request", { status: 400 });
	};

	const client = new DefaultSlackAlertClient({
		webhookUrl: "https://hooks.slack.com/test",
		dedupTtlMs: 60_000,
		storage: memoryDedupStorage(),
	});

	let result: NotifyResult | undefined;
	await assert.doesNotReject(async () => {
		result = await client.notify({
			severity: "error",
			title: "Oops",
			message: "Bad payload",
		});
	});

	assert.equal(result?.sent, false);
	assert.equal(result?.deduped, false);
});

// ---------------------------------------------------------------------------
// Test 6 — network-level fetch rejection returns sent:false without throwing
// ---------------------------------------------------------------------------
test("network failure returns sent:false and does not throw", async () => {
	globalThis.fetch = async (_url: RequestInfo | URL, _init?: RequestInit) => {
		throw new TypeError("Failed to fetch");
	};

	const client = new DefaultSlackAlertClient({
		webhookUrl: "https://hooks.slack.com/test",
		dedupTtlMs: 60_000,
		storage: memoryDedupStorage(),
	});

	let result: NotifyResult | undefined;
	await assert.doesNotReject(async () => {
		result = await client.notify({
			severity: "fatal",
			title: "Network gone",
			message: "All down",
		});
	});

	assert.equal(result?.sent, false);
	assert.equal(result?.deduped, false);
});

// ---------------------------------------------------------------------------
// Test 7 — no fingerprint means always-send (no dedup applied)
// ---------------------------------------------------------------------------
test("payload without fingerprint is never deduped", async () => {
	let fetchCallCount = 0;
	globalThis.fetch = async (_url: RequestInfo | URL, _init?: RequestInit) => {
		fetchCallCount++;
		return new Response("ok", { status: 200 });
	};

	const client = new DefaultSlackAlertClient({
		webhookUrl: "https://hooks.slack.com/test",
		dedupTtlMs: 60_000,
		storage: memoryDedupStorage(),
		now: () => 1_000_000,
	});

	const payload: AlertPayload = { severity: "warning", title: "Warn", message: "heads up" };

	await client.notify(payload);
	await client.notify(payload);
	await client.notify(payload);

	assert.equal(fetchCallCount, 3);
});

// ---------------------------------------------------------------------------
// Test 8 — __setSlackAlertClient mock injection routes through notifySlack
// ---------------------------------------------------------------------------
test("__setSlackAlertClient mock receives calls via notifySlack", async () => {
	let called = false;
	let capturedPayload: AlertPayload | null = null;

	const mock: SlackAlertClient = {
		async notify(payload) {
			called = true;
			capturedPayload = payload;
			return { sent: true, deduped: false };
		},
	};

	__setSlackAlertClient(mock);

	const result = await notifySlack({
		severity: "fatal",
		title: "Critical failure",
		message: "System is down",
		fingerprint: "critical-fp",
	});

	assert.equal(called, true);
	assert.equal(result.sent, true);
	assert.ok(capturedPayload !== null);
	assert.equal((capturedPayload as AlertPayload).severity, "fatal");
	assert.equal((capturedPayload as AlertPayload).fingerprint, "critical-fp");
});

// ---------------------------------------------------------------------------
// KV dedup storage tests (B4)
// ---------------------------------------------------------------------------

/** Minimal KVNamespace mock for testing kvDedupStorage. */
function makeFakeKV() {
	const store = new Map<string, string>();
	const getCalls: string[] = [];
	const putCalls: Array<{ key: string; value: string; options?: { expirationTtl?: number } }> = [];
	const kv = {
		store,
		getCalls,
		putCalls,
		async get(key: string) {
			getCalls.push(key);
			return store.get(key) ?? null;
		},
		async put(key: string, value: string, options?: { expirationTtl?: number }) {
			putCalls.push({ key, value, options });
			store.set(key, value);
		},
	} as unknown as KVNamespace & { store: Map<string, string>; getCalls: string[]; putCalls: Array<{ key: string; value: string; options?: { expirationTtl?: number } }> };
	return kv;
}

// Test 9 — KV get returns parsed number from stored string
test("kv_storage_get_returns_parsed_number", async () => {
	const fakeKV = makeFakeKV();
	fakeKV.store.set("slack-dedup:fp1", "12345");
	const storage = kvDedupStorage(fakeKV, 30);
	const result = await storage.get("fp1");
	assert.equal(result, 12345);
	assert.ok(fakeKV.getCalls.includes("slack-dedup:fp1"));
});

// Test 10 — KV get returns undefined on cache miss (null from KV)
test("kv_storage_get_returns_undefined_on_miss", async () => {
	const fakeKV = makeFakeKV();
	const storage = kvDedupStorage(fakeKV, 30);
	const result = await storage.get("missing-fp");
	assert.equal(result, undefined);
});

// Test 11 — KV put includes correct expirationTtl
test("kv_storage_put_includes_ttl", async () => {
	const fakeKV = makeFakeKV();
	const ttlMinutes = 30;
	const storage = kvDedupStorage(fakeKV, ttlMinutes);
	await storage.put("fp2", 99999);
	assert.equal(fakeKV.putCalls.length, 1);
	assert.equal(fakeKV.putCalls[0].key, "slack-dedup:fp2");
	assert.equal(fakeKV.putCalls[0].value, "99999");
	// expirationTtl = ttlMinutes * 60 + 60
	assert.equal(fakeKV.putCalls[0].options?.expirationTtl, ttlMinutes * 60 + 60);
});

// Test 12 — initSlackAlert uses KV storage when SLACK_DEDUP_KV is bound
test("init_uses_kv_when_bound", async () => {
	const fakeKV = makeFakeKV();
	// Pre-seed a timestamp so the dedup check finds a recent entry (within TTL)
	const recentTs = Date.now();
	fakeKV.store.set("slack-dedup:test-fp", String(recentTs));

	globalThis.fetch = async () => new Response("ok", { status: 200 });

	initSlackAlert({
		SLACK_ALERT_WEBHOOK_URL: "https://hooks.slack.com/test",
		SLACK_ALERT_DEDUP_TTL_MINUTES: "30",
		SLACK_DEDUP_KV: fakeKV,
	});

	// The first notify call should check KV for the fingerprint
	const result = await notifySlack({
		severity: "error",
		title: "KV test",
		message: "checking kv path",
		fingerprint: "test-fp",
	});

	// KV get was called with the prefixed key
	assert.ok(fakeKV.getCalls.some((k) => k === "slack-dedup:test-fp"), "KV get was not called");
	// Because the stored timestamp is very recent, the alert should be deduped
	assert.equal(result.deduped, true);
});

// Test 13 — initSlackAlert uses memory storage when SLACK_DEDUP_KV is absent
test("init_uses_memory_when_kv_unbound", async () => {
	let fetchCallCount = 0;
	globalThis.fetch = async () => {
		fetchCallCount++;
		return new Response("ok", { status: 200 });
	};

	initSlackAlert({
		SLACK_ALERT_WEBHOOK_URL: "https://hooks.slack.com/test",
		SLACK_ALERT_DEDUP_TTL_MINUTES: "30",
		// No SLACK_DEDUP_KV — should use in-memory storage
	});

	// First send should go through (no KV involved)
	const r1 = await notifySlack({ severity: "error", title: "A", message: "m", fingerprint: "mem-fp" });
	assert.equal(r1.sent, true);
	// Second send within TTL — in-memory dedup should catch it
	const r2 = await notifySlack({ severity: "error", title: "A", message: "m", fingerprint: "mem-fp" });
	assert.equal(r2.deduped, true);
	assert.equal(fetchCallCount, 1);
});
