// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

/**
 * Reviewer — third stage of the email processing pipeline.
 *
 * Takes the draft body produced by DraftWriter and:
 *   1. Calls verifyDraft (workers/lib/ai.ts) for AI-powered sanitization.
 *   2. Strips residual agent meta-commentary that occasionally leaks
 *      (lines beginning with "Draft created", "Here is", markdown
 *      horizontal rules, etc.).
 *
 * Returns {sanitizedBody, usage}.
 */

import { verifyDraft } from "../lib/ai.ts";
import type { Env } from "../types.ts";

// ── Types ─────────────────────────────────────────────────────────────

export interface ReviewerInput {
	draft: { subject: string; body: string };
}

export interface ReviewerResult {
	sanitizedBody: string;
	usage: {
		inputTokens: number;
		outputTokens: number;
		latencyMs: number;
		costUsd: number;
	};
}

// ── Meta-commentary patterns ──────────────────────────────────────────

/** Lines that are common agent meta-commentary leaks. */
const META_PATTERNS = [
	/^Draft created\.?\s*$/im,
	/^Here is\s.*$/im,
	/^Here's the (?:draft|reply|response):?\s*$/im,
	/^---+\s*$/m,
	/^\[Auto-triggered\].*$/im,
];

// ── Implementation ────────────────────────────────────────────────────

export async function runReviewer(
	env: Env,
	input: ReviewerInput,
): Promise<ReviewerResult> {
	const start = Date.now();

	// Step 1: AI-powered verification via verifyDraft
	const verified = await verifyDraft(env.AI, input.draft.body);

	// Step 2: Strip residual meta-commentary that verifyDraft may miss
	let sanitized = verified || input.draft.body;
	for (const pattern of META_PATTERNS) {
		sanitized = sanitized.replace(pattern, "");
	}
	sanitized = sanitized.trim();

	return {
		sanitizedBody: sanitized,
		usage: {
			inputTokens: 0, // verifyDraft uses a separate AI call internally
			outputTokens: 0,
			latencyMs: Date.now() - start,
			costUsd: 0,
		},
	};
}
