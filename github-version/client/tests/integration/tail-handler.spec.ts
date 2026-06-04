// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

/**
 * Integration test: tail handler in Workers runtime
 *
 * processTailEvents is a pure function (no DO/R2/AI bindings) so it can run
 * inside the Workers runtime environment without additional mocking.
 * This verifies the function behaves identically in the real Workers runtime
 * as it does under Node.js (tests/tail-consumer.test.ts).
 *
 * Note: The full `default.tail()` entrypoint requires a deployed Tail Worker
 * service binding — that is not emulated by miniflare. Limitation acknowledged;
 * full end-to-end tail routing requires staging (M5 scope).
 */

import { describe, it, expect, vi } from "vitest";
import { processTailEvents } from "../../workers/tail-consumer/handler";
import type { TraceItem } from "@cloudflare/workers-types/experimental";

function makeTraceItem(overrides: Partial<{
	exceptions: Array<{ message: string; name: string; timestamp: number; stack?: string }>;
	outcome: string;
	scriptName: string | null;
	eventTimestamp: number | null;
}> = {}): TraceItem {
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

describe("processTailEvents in Workers runtime", () => {
	it("no exceptions — capture and alert not called, counters=0", async () => {
		const capture = vi.fn();
		const alert = vi.fn().mockResolvedValue({});

		const result = await processTailEvents(
			[makeTraceItem({ exceptions: [], outcome: "ok" })],
			{ capture, alert },
		);

		expect(capture).not.toHaveBeenCalled();
		expect(alert).not.toHaveBeenCalled();
		expect(result.exceptionsForwarded).toBe(0);
		expect(result.alertsSent).toBe(0);
	});

	it("one exception — capture called once, forwarded=1", async () => {
		const capture = vi.fn();
		const alert = vi.fn().mockResolvedValue({});

		const result = await processTailEvents(
			[makeTraceItem({
				exceptions: [{ message: "boom", name: "Error", timestamp: Date.now() }],
				outcome: "ok",
			})],
			{ capture, alert },
		);

		expect(capture).toHaveBeenCalledTimes(1);
		const capturedError = capture.mock.calls[0][0] as Error;
		expect(capturedError.message).toBe("boom");
		expect(result.exceptionsForwarded).toBe(1);
		// outcome != 'exception' so no alert
		expect(alert).not.toHaveBeenCalled();
		expect(result.alertsSent).toBe(0);
	});

	it("outcome=exception — alert is sent once", async () => {
		const capture = vi.fn();
		const alert = vi.fn().mockResolvedValue({});

		const result = await processTailEvents(
			[makeTraceItem({
				exceptions: [{ message: "fatal", name: "Error", timestamp: Date.now() }],
				outcome: "exception",
			})],
			{ capture, alert },
		);

		expect(capture).toHaveBeenCalledTimes(1);
		expect(alert).toHaveBeenCalledTimes(1);
		expect(result.alertsSent).toBe(1);
		const payload = alert.mock.calls[0][0] as any;
		expect(payload.severity).toBe("fatal");
	});

	it("multiple events — counts accumulate correctly", async () => {
		const capture = vi.fn();
		const alert = vi.fn().mockResolvedValue({});

		const events = [
			makeTraceItem({
				exceptions: [
					{ message: "err1", name: "Error", timestamp: Date.now() },
					{ message: "err2", name: "TypeError", timestamp: Date.now() },
				],
				outcome: "exception",
			}),
			makeTraceItem({ exceptions: [], outcome: "ok" }),
			makeTraceItem({
				exceptions: [{ message: "err3", name: "Error", timestamp: Date.now() }],
				outcome: "ok",
			}),
		];

		const result = await processTailEvents(events, { capture, alert });

		expect(result.exceptionsForwarded).toBe(3);
		expect(result.alertsSent).toBe(1); // only the first event has outcome=exception
	});
});
