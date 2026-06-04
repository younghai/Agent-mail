// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

/**
 * Triager — first stage of the email processing pipeline.
 *
 * Uses a small, fast model (@cf/meta/llama-3.2-3b-instruct) to classify
 * incoming emails and decide whether a draft should be generated.
 *
 * When env.AI is missing (local dev) returns a safe default with
 * skipDraft=false so the pipeline proceeds normally.
 */

import { stripHtmlToText } from "../lib/email-helpers.ts";
import type { EmailFull } from "../lib/schemas.ts";
import type { Env } from "../types.ts";

// ── Types ─────────────────────────────────────────────────────────────

export interface TriageInput {
	email: EmailFull;
	threadContext: string;
}

export interface TriageResult {
	category: "inquiry" | "complaint" | "transactional" | "spam";
	skipDraft: boolean;
	reason: string;
	usage: {
		inputTokens: number;
		outputTokens: number;
		latencyMs: number;
		costUsd: number;
	};
}

// ── Prompt ────────────────────────────────────────────────────────────

const TRIAGE_PROMPT = `You are an email triage classifier. Analyze the incoming email and classify it into exactly one category.

Categories:
- "inquiry" — general questions, information requests, sales inquiries, partnership proposals
- "complaint" — complaints, negative feedback, disputes, refund requests, legal threats
- "transactional" — automated notifications, receipts, shipping updates, system alerts, out-of-office auto-replies
- "spam" — unsolicited marketing, phishing attempts, completely irrelevant content

Respond ONLY with a JSON object (no markdown, no explanation, nothing else):
{"category":"inquiry","skipDraft":false,"reason":"brief explanation"}

Rules:
- skipDraft MUST be true ONLY for "spam"
- For transactional emails (receipts, notifications), set skipDraft=false — they may still need a brief acknowledgment
- When unsure, default to "inquiry" with skipDraft=false`;

// ── Implementation ────────────────────────────────────────────────────

export async function runTriager(
	env: Env,
	input: TriageInput,
): Promise<TriageResult> {
	const start = Date.now();

	// Safe default when AI binding is unavailable (local dev)
	if (!env.AI) {
		return {
			category: "inquiry",
			skipDraft: false,
			reason: "ai_unavailable",
			usage: { inputTokens: 0, outputTokens: 0, latencyMs: 0, costUsd: 0 },
		};
	}

	const emailText = input.email.body
		? stripHtmlToText(input.email.body).substring(0, 2000)
		: "(no body)";

	const userContent = `Subject: ${input.email.subject}
From: ${input.email.sender}
To: ${input.email.recipient}
Date: ${input.email.date}

Body:
${emailText}

${input.threadContext ? `Thread context:\n${input.threadContext.substring(0, 2000)}` : "(first message in thread)"}`;

	try {
		const response = (await env.AI.run(
			"@cf/meta/llama-3.2-3b-instruct",
			{
				messages: [
					{ role: "system", content: TRIAGE_PROMPT },
					{ role: "user", content: userContent },
				],
				max_tokens: 200,
				temperature: 0,
			},
		)) as { response?: string };

		const raw = (response?.response || "").trim();

		// Extract JSON from response — the model may wrap in markdown fences
		const jsonMatch = raw.match(/\{[\s\S]*\}/);
		if (!jsonMatch) {
			return {
				category: "inquiry",
				skipDraft: false,
				reason: "parse_failed",
				usage: {
					inputTokens: 0,
					outputTokens: 0,
					latencyMs: Date.now() - start,
					costUsd: 0,
				},
			};
		}

		const parsed = JSON.parse(jsonMatch[0]);
		const validCategories = ["inquiry", "complaint", "transactional", "spam"] as const;
		const category = validCategories.includes(parsed.category)
			? parsed.category
			: "inquiry";
		const skipDraft = category === "spam" ? true : Boolean(parsed.skipDraft);
		const reason =
			typeof parsed.reason === "string" ? parsed.reason : "classified";

		return {
			category: category as TriageResult["category"],
			skipDraft,
			reason,
			usage: {
				inputTokens: 0,
				outputTokens: 0,
				latencyMs: Date.now() - start,
				costUsd: 0,
			},
		};
	} catch (e) {
		console.error("Triager failed:", (e as Error).message);
		return {
			category: "inquiry",
			skipDraft: false,
			reason: `triage_error: ${(e as Error).message}`,
			usage: {
				inputTokens: 0,
				outputTokens: 0,
				latencyMs: Date.now() - start,
				costUsd: 0,
			},
		};
	}
}
