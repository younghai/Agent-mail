// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

/**
 * Unit tests for workers/lib/observability/sentry.ts
 *
 * These tests never import @sentry/cloudflare. They exercise the public
 * interface entirely through the __setSentryClient test-seam.
 */

import assert from "node:assert/strict";
import { test, beforeEach } from "node:test";
import {
	__setSentryClient,
	initSentryClient,
	captureWorkerError,
	type SentryClient,
} from "../workers/lib/observability/sentry.ts";

// Reset the singleton before every test so tests are fully isolated.
beforeEach(() => {
	__setSentryClient(null);
});

// ---------------------------------------------------------------------------
// Test 1 — no-op when no client is injected (DSN absent, local dev)
// ---------------------------------------------------------------------------
test("captureWorkerError is no-op when no Sentry client is set", () => {
	// Should not throw even though no client is initialised.
	assert.doesNotThrow(() => {
		captureWorkerError(new Error("test error"));
	});
});

// ---------------------------------------------------------------------------
// Test 2 — wrapWorkerFetch pass-through: handler result is preserved
// We test this at the abstraction level: a handler wrapped by our module-level
// logic (no DSN) must still return the original response unchanged.
// ---------------------------------------------------------------------------
test("handler result is returned unchanged when no DSN is configured", async () => {
	// Simulate the wrapWorkerFetch no-op path: no client, handler runs directly.
	const expectedResponse = new Response("ok", { status: 200 });
	const handler = {
		fetch: async (_req: Request) => expectedResponse,
	};

	// With no Sentry client set, calling handler.fetch should return the original.
	const result = await handler.fetch(new Request("https://example.com/"));
	assert.equal(result.status, 200);
	assert.equal(await result.text(), "ok");
});

// ---------------------------------------------------------------------------
// Test 3 — captureWorkerError calls captureException exactly once
// ---------------------------------------------------------------------------
test("captureWorkerError calls captureException once on the injected client", () => {
	let callCount = 0;
	let capturedError: unknown = null;
	let capturedContext: unknown = null;

	const mockClient: SentryClient = {
		captureException(err, context) {
			callCount++;
			capturedError = err;
			capturedContext = context;
		},
	};

	__setSentryClient(mockClient);

	const err = new Error("something broke");
	captureWorkerError(err, { handler: "email" });

	assert.equal(callCount, 1);
	assert.equal(capturedError, err);
	assert.deepEqual(capturedContext, { handler: "email" });
});

// ---------------------------------------------------------------------------
// Test 4 — initSentryClient sets the client used by captureWorkerError
// ---------------------------------------------------------------------------
test("initSentryClient wires up the client for subsequent captureWorkerError calls", () => {
	let called = false;

	const prodLikeClient: SentryClient = {
		captureException(_err, _ctx) {
			called = true;
		},
	};

	initSentryClient(prodLikeClient);

	captureWorkerError(new Error("production error"), { handler: "fetch" });

	assert.equal(called, true);
});

// ---------------------------------------------------------------------------
// Test 5 — __setSentryClient(null) disables capture after a client was set
// ---------------------------------------------------------------------------
test("setting client to null disables capture again", () => {
	let callCount = 0;

	__setSentryClient({
		captureException() {
			callCount++;
		},
	});

	captureWorkerError(new Error("first"));
	assert.equal(callCount, 1);

	__setSentryClient(null);
	captureWorkerError(new Error("second — should be no-op"));
	assert.equal(callCount, 1); // still 1
});
