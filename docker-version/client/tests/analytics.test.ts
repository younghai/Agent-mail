// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

/**
 * Unit tests for workers/lib/observability/analytics.ts
 *
 * All tests use a mock writeDataPoint function to verify the correct
 * {indexes, doubles, blobs} shape is forwarded. When env.ANALYTICS is
 * undefined, every helper must be a silent no-op (no throw).
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import {
	recordAiEvent,
	recordFeedbackEvent,
	recordTailEvent,
	type AiEventInput,
} from "../workers/lib/observability/analytics.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a mock env with a spy on writeDataPoint. */
function makeEnv() {
	const calls: Array<{ indexes: string[]; doubles: number[]; blobs: string[] }> = [];
	return {
		calls,
		env: {
			ANALYTICS: {
				writeDataPoint(dp: { indexes: string[]; doubles: number[]; blobs: string[] }) {
					calls.push({ indexes: dp.indexes, doubles: dp.doubles, blobs: dp.blobs });
				},
			},
		} as unknown as { ANALYTICS?: AnalyticsEngineDataset },
	};
}

/** Standard AiEventInput used across tests. */
const sampleAiEvent: AiEventInput = {
	mailboxId: "user@example.com",
	operation: "chat",
	model: "@cf/moonshotai/kimi-k2.5",
	inputTokens: 100,
	outputTokens: 50,
	costUsd: 0.002,
	latencyMs: 1200,
	status: "ok",
};

// ---------------------------------------------------------------------------
// Test 1 — recordAiEvent is a no-op when env.ANALYTICS is undefined
// ---------------------------------------------------------------------------
test("recordAiEvent — no-op when ANALYTICS binding absent", () => {
	const env = {} as { ANALYTICS?: AnalyticsEngineDataset };
	// Must not throw
	assert.doesNotThrow(() => {
		recordAiEvent(env, sampleAiEvent);
	});
});

// ---------------------------------------------------------------------------
// Test 2 — recordAiEvent forwards correct {indexes, doubles, blobs} shape
// ---------------------------------------------------------------------------
test("recordAiEvent — correct writeDataPoint shape", () => {
	const { calls, env } = makeEnv();

	recordAiEvent(env, {
		...sampleAiEvent,
		errorCode: "timeout",
	});

	assert.equal(calls.length, 1);
	const dp = calls[0];

	// indexes: [operation]
	assert.deepEqual(dp.indexes, ["chat"]);

	// doubles: [inputTokens, outputTokens, costUsd, latencyMs]
	assert.deepEqual(dp.doubles, [100, 50, 0.002, 1200]);

	// blobs: [mailboxId, model, status, errorCode]
	assert.deepEqual(dp.blobs, ["user@example.com", "@cf/moonshotai/kimi-k2.5", "ok", "timeout"]);
});

// ---------------------------------------------------------------------------
// Test 3 — recordFeedbackEvent shape (score becomes a double)
// ---------------------------------------------------------------------------
test("recordFeedbackEvent — correct writeDataPoint shape", () => {
	const { calls, env } = makeEnv();

	recordFeedbackEvent(env, {
		mailboxId: "user@example.com",
		callId: "call-abc-123",
		score: 1,
	});

	assert.equal(calls.length, 1);
	const dp = calls[0];

	// indexes: [mailboxId]
	assert.deepEqual(dp.indexes, ["user@example.com"]);

	// doubles: [score]
	assert.deepEqual(dp.doubles, [1]);

	// blobs: [callId]
	assert.deepEqual(dp.blobs, ["call-abc-123"]);
});

// ---------------------------------------------------------------------------
// Test 4 — recordTailEvent shape (outcome → index, durationMs → double)
// ---------------------------------------------------------------------------
test("recordTailEvent — correct writeDataPoint shape", () => {
	const { calls, env } = makeEnv();

	recordTailEvent(env, {
		outcome: "exception",
		scriptName: "agentic-inbox",
		durationMs: 350,
	});

	assert.equal(calls.length, 1);
	const dp = calls[0];

	// indexes: [outcome]
	assert.deepEqual(dp.indexes, ["exception"]);

	// doubles: [durationMs]
	assert.deepEqual(dp.doubles, [350]);

	// blobs: [scriptName]
	assert.deepEqual(dp.blobs, ["agentic-inbox"]);
});

// ---------------------------------------------------------------------------
// Test 5 — recordTailEvent with no optional fields
// ---------------------------------------------------------------------------
test("recordTailEvent — no durationMs or scriptName", () => {
	const { calls, env } = makeEnv();

	recordTailEvent(env, { outcome: "ok" });

	assert.equal(calls.length, 1);
	const dp = calls[0];
	assert.deepEqual(dp.indexes, ["ok"]);
	assert.deepEqual(dp.doubles, []);
	assert.deepEqual(dp.blobs, [""]);
});

// ---------------------------------------------------------------------------
// Test 6 — recordFeedbackEvent with negative score
// ---------------------------------------------------------------------------
test("recordFeedbackEvent — negative score", () => {
	const { calls, env } = makeEnv();

	recordFeedbackEvent(env, {
		mailboxId: "test@test.com",
		callId: "call-xyz",
		score: -1,
	});

	assert.equal(calls.length, 1);
	assert.deepEqual(calls[0].doubles, [-1]);
	assert.deepEqual(calls[0].blobs, ["call-xyz"]);
});

// ---------------------------------------------------------------------------
// Test 7 — recordAiEvent with no errorCode (defaults to empty blob)
// ---------------------------------------------------------------------------
test("recordAiEvent — no errorCode produces empty string blob", () => {
	const { calls, env } = makeEnv();

	recordAiEvent(env, sampleAiEvent);

	assert.equal(calls.length, 1);
	assert.equal(calls[0].blobs[3], "");
});
