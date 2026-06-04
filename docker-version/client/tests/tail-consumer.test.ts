// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

/**
 * Unit tests for workers/tail-consumer/handler.ts
 *
 * All tests use a dependency-injected mock for capture and alert so neither
 * @sentry/cloudflare nor fetch are ever called.
 */

import assert from "node:assert/strict";
import { test, mock } from "node:test";
import {
	processTailEvents,
	type TailHandlerDeps,
} from "../workers/tail-consumer/handler.ts";
import type { TraceItem } from "@cloudflare/workers-types/experimental";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal TraceItem — only the fields the handler reads. */
function makeEvent(
	overrides: Partial<{
		exceptions: Array<{ message: string; name: string; timestamp: number; stack?: string }>;
		outcome: string;
		scriptName: string | null;
		eventTimestamp: number | null;
	}> = {},
): TraceItem {
	return {
		exceptions: overrides.exceptions ?? [],
		outcome: overrides.outcome ?? "ok",
		scriptName: overrides.scriptName ?? "agentic-inbox",
		eventTimestamp: overrides.eventTimestamp ?? 1700000000000,
		logs: [],
		diagnosticsChannelEvents: [],
		event: null,
		executionModel: "stateless",
		truncated: false,
		cpuTime: 0,
		wallTime: 0,
	} as unknown as TraceItem;
}

/** Build a default mock deps object with jest-style mock functions. */
function makeDeps(): TailHandlerDeps & {
	captureMock: ReturnType<typeof mock.fn>;
	alertMock: ReturnType<typeof mock.fn>;
} {
	const captureMock = mock.fn((_err: unknown, _ctx?: Record<string, unknown>) => {});
	const alertMock = mock.fn(async (_payload: unknown) => ({}));
	return {
		capture: captureMock,
		alert: alertMock,
		captureMock,
		alertMock,
	};
}

// ---------------------------------------------------------------------------
// Test 1 — no exceptions: neither capture nor alert is called
// ---------------------------------------------------------------------------
test("no exceptions — capture and alert are not called", async () => {
	const deps = makeDeps();
	const events = [makeEvent({ exceptions: [], outcome: "ok" })];

	const result = await processTailEvents(events, deps);

	assert.equal(deps.captureMock.mock.calls.length, 0);
	assert.equal(deps.alertMock.mock.calls.length, 0);
	assert.equal(result.exceptionsForwarded, 0);
	assert.equal(result.alertsSent, 0);
});

// ---------------------------------------------------------------------------
// Test 2 — one exception: capture is called once with an Error wrapping the message
// ---------------------------------------------------------------------------
test("one exception — capture called once with Error object", async () => {
	const deps = makeDeps();
	const events = [
		makeEvent({
			exceptions: [{ message: "TypeError: bad input", name: "TypeError", timestamp: 1 }],
			outcome: "ok",
		}),
	];

	const result = await processTailEvents(events, deps);

	assert.equal(deps.captureMock.mock.calls.length, 1);
	const [capturedErr] = deps.captureMock.mock.calls[0].arguments;
	assert.ok(capturedErr instanceof Error);
	assert.equal((capturedErr as Error).message, "TypeError: bad input");
	assert.equal(result.exceptionsForwarded, 1);
});

// ---------------------------------------------------------------------------
// Test 3 — multiple exceptions in same event: capture called N times
// ---------------------------------------------------------------------------
test("multiple exceptions in one event — capture called once per exception", async () => {
	const deps = makeDeps();
	const events = [
		makeEvent({
			exceptions: [
				{ message: "Error A", name: "Error", timestamp: 1 },
				{ message: "Error B", name: "RangeError", timestamp: 2 },
				{ message: "Error C", name: "TypeError", timestamp: 3 },
			],
			outcome: "ok",
		}),
	];

	const result = await processTailEvents(events, deps);

	assert.equal(deps.captureMock.mock.calls.length, 3);
	assert.equal(result.exceptionsForwarded, 3);
});

// ---------------------------------------------------------------------------
// Test 4 — outcome=exception: alert is called once (Slack fatal)
// ---------------------------------------------------------------------------
test("outcome=exception — alert called once with fatal severity", async () => {
	const deps = makeDeps();
	const events = [
		makeEvent({
			exceptions: [{ message: "Unhandled rejection", name: "Error", timestamp: 1 }],
			outcome: "exception",
			scriptName: "agentic-inbox",
		}),
	];

	const result = await processTailEvents(events, deps);

	assert.equal(deps.alertMock.mock.calls.length, 1);
	const [payload] = deps.alertMock.mock.calls[0].arguments as [{ severity: string; title: string }];
	assert.equal(payload.severity, "fatal");
	assert.ok(payload.title.includes("agentic-inbox"));
	assert.equal(result.alertsSent, 1);
});

// ---------------------------------------------------------------------------
// Test 5 — outcome=ok with exceptions: capture fires but alert does not
// ---------------------------------------------------------------------------
test("outcome=ok with exceptions — capture fires, alert skipped", async () => {
	const deps = makeDeps();
	const events = [
		makeEvent({
			exceptions: [{ message: "caught error", name: "Error", timestamp: 1 }],
			outcome: "ok",
		}),
	];

	const result = await processTailEvents(events, deps);

	assert.equal(deps.captureMock.mock.calls.length, 1);
	assert.equal(deps.alertMock.mock.calls.length, 0);
	assert.equal(result.exceptionsForwarded, 1);
	assert.equal(result.alertsSent, 0);
});

// ---------------------------------------------------------------------------
// Test 6 — alert rejection does not throw
// ---------------------------------------------------------------------------
test("alert rejection — processTailEvents does not throw", async () => {
	const deps = makeDeps();
	// Override alert to reject
	deps.alertMock.mock.mockImplementationOnce(async () => {
		throw new Error("Slack webhook failed");
	});
	const events = [
		makeEvent({
			exceptions: [{ message: "err", name: "Error", timestamp: 1 }],
			outcome: "exception",
		}),
	];

	// Should complete without throwing even though alert rejects.
	// capture still fires, alertsSent is 0 because the alert was swallowed.
	const result = await processTailEvents(events, deps);
	assert.equal(result.exceptionsForwarded, 1);
	assert.equal(result.alertsSent, 0);
});

// ---------------------------------------------------------------------------
// Test 7 — returned counts match actual forwarded/sent events
// ---------------------------------------------------------------------------
test("returned counts match exceptions forwarded and alerts sent", async () => {
	const deps = makeDeps();
	const events = [
		// event 1: 2 exceptions, outcome=exception → 2 captures, 1 alert
		makeEvent({
			exceptions: [
				{ message: "err1", name: "Error", timestamp: 1 },
				{ message: "err2", name: "TypeError", timestamp: 2 },
			],
			outcome: "exception",
			scriptName: "worker-a",
		}),
		// event 2: 1 exception, outcome=ok → 1 capture, 0 alerts
		makeEvent({
			exceptions: [{ message: "err3", name: "Error", timestamp: 3 }],
			outcome: "ok",
			scriptName: "worker-b",
		}),
		// event 3: no exceptions → 0 captures, 0 alerts
		makeEvent({ exceptions: [], outcome: "ok", scriptName: "worker-c" }),
	];

	const result = await processTailEvents(events, deps);

	assert.equal(result.exceptionsForwarded, 3);
	assert.equal(result.alertsSent, 1);
	assert.equal(deps.captureMock.mock.calls.length, 3);
	assert.equal(deps.alertMock.mock.calls.length, 1);
});
