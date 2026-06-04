// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

/**
 * Tail Worker handler — pure function, no Worker context dependencies.
 *
 * Receives TraceItem[] from the Cloudflare Tail runtime and:
 *   1. Forwards each exception to Sentry via deps.capture.
 *   2. When outcome === 'exception', sends a fatal Slack alert via deps.alert.
 *
 * Events are processed sequentially (not Promise.all) to preserve in-memory
 * dedup consistency in DefaultSlackAlertClient — the Map check-then-set is
 * not concurrency-safe under parallel awaits.
 */

import type { TraceItem } from "@cloudflare/workers-types/experimental";
import type { AlertPayload } from "../lib/observability/slack-alert";

export interface TailHandlerDeps {
	capture: (err: unknown, ctx?: Record<string, unknown>) => void;
	alert: (payload: AlertPayload) => Promise<unknown>;
	recordTailAnalytics?: (input: { outcome: string; scriptName?: string; durationMs?: number }) => void;
}

export interface TailHandlerResult {
	exceptionsForwarded: number;
	alertsSent: number;
}

export async function processTailEvents(
	events: TraceItem[],
	deps: TailHandlerDeps,
): Promise<TailHandlerResult> {
	let exceptionsForwarded = 0;
	let alertsSent = 0;

	for (const evt of events) {
		// Analytics: record every traced event (not just exceptions).
		if (deps.recordTailAnalytics) {
			deps.recordTailAnalytics({
				outcome: evt.outcome,
				scriptName: evt.scriptName ?? undefined,
				durationMs: evt.wallTime || undefined,
			});
		}

		if (!evt.exceptions || evt.exceptions.length === 0) continue;

		for (const exc of evt.exceptions) {
			deps.capture(new Error(exc.message), {
				scriptName: evt.scriptName ?? undefined,
				outcome: evt.outcome,
				eventTimestamp: evt.eventTimestamp ?? undefined,
				stack: exc.stack ?? undefined,
				name: exc.name,
			});
			exceptionsForwarded++;
		}

		// Only send a Slack alert when the worker outcome itself was an exception.
		// Non-fatal logged exceptions go to Sentry only.
		// Alert failures are swallowed — Slack must never break the tail handler.
		if (evt.outcome === "exception") {
			try {
				await deps.alert({
					severity: "fatal",
					title: `Worker exception in ${evt.scriptName ?? "unknown"}`,
					message: evt.exceptions[0]?.message ?? "unknown",
					fingerprint: `tail:${evt.scriptName}:${evt.exceptions[0]?.name}`,
					context: {
						outcome: evt.outcome,
						...(evt.eventTimestamp !== null && evt.eventTimestamp !== undefined
							? { eventTimestamp: evt.eventTimestamp }
							: {}),
					},
				});
				alertsSent++;
			} catch {
				// Intentionally swallowed — alert failure must not propagate.
			}
		}
	}

	return { exceptionsForwarded, alertsSent };
}
