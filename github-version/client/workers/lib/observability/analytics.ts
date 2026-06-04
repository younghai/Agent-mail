// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

/**
 * Analytics Engine helpers — sidecar writes to Cloudflare Analytics Engine.
 *
 * Every helper is a no-op when `env.ANALYTICS` is undefined (local dev,
 * binding not yet activated).  When present, calls
 * `env.ANALYTICS.writeDataPoint({indexes, doubles, blobs})`.
 *
 * Packing convention (CF AE limits indexes to 1 string per data point):
 *   indexes — primary low-cardinality dimension (operation, mailboxId, outcome)
 *   doubles — numeric metrics
 *   blobs   — remaining dimensions + high-cardinality identifiers
 */

// -- Types ----------------------------------------------------------------

export interface AiEventInput {
	mailboxId: string;
	operation: "chat" | "auto_draft" | "triage" | "draft" | "review";
	model: string;
	inputTokens: number;
	outputTokens: number;
	costUsd: number;
	latencyMs: number;
	status: "ok" | "error" | "blocked";
	errorCode?: string;
}

export interface FeedbackEventInput {
	mailboxId: string;
	callId: string;
	score: 1 | -1;
}

export interface TailEventInput {
	outcome: "ok" | "exception";
	scriptName?: string;
	durationMs?: number;
}

// -- Helpers --------------------------------------------------------------

/**
 * Record an AI invocation event (chat / auto_draft / triage / draft / review).
 *
 * indexes: [operation]
 * doubles: [inputTokens, outputTokens, costUsd, latencyMs]
 * blobs:   [mailboxId, model, status, errorCode?]
 */
export function recordAiEvent(
	env: { ANALYTICS?: AnalyticsEngineDataset },
	input: AiEventInput,
): void {
	if (!env.ANALYTICS) return;
	env.ANALYTICS.writeDataPoint({
		indexes: [input.operation],
		doubles: [input.inputTokens, input.outputTokens, input.costUsd, input.latencyMs],
		blobs: [
			input.mailboxId,
			input.model,
			input.status,
			input.errorCode ?? "",
		],
	});
}

/**
 * Record a feedback event (thumbs-up / thumbs-down on an AI response).
 *
 * indexes: [mailboxId]
 * doubles: [score]
 * blobs:   [callId]
 */
export function recordFeedbackEvent(
	env: { ANALYTICS?: AnalyticsEngineDataset },
	input: FeedbackEventInput,
): void {
	if (!env.ANALYTICS) return;
	env.ANALYTICS.writeDataPoint({
		indexes: [input.mailboxId],
		doubles: [input.score],
		blobs: [input.callId],
	});
}

/**
 * Record a tail-worker trace event (worker outcome / latency).
 *
 * indexes: [outcome]
 * doubles: [durationMs?]
 * blobs:   [scriptName?]
 */
export function recordTailEvent(
	env: { ANALYTICS?: AnalyticsEngineDataset },
	input: TailEventInput,
): void {
	if (!env.ANALYTICS) return;
	env.ANALYTICS.writeDataPoint({
		indexes: [input.outcome],
		doubles: input.durationMs != null ? [input.durationMs] : [],
		blobs: [input.scriptName ?? ""],
	});
}
