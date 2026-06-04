// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

/**
 * DraftWriter — second stage of the email processing pipeline.
 *
 * Uses the capable kimi-k2.5 model to write a reply draft based on
 * the incoming email, thread context, and triage classification.
 * Returns {subject, body, usage} or null when triage.skipDraft is true.
 */

import { generateText } from "ai";
import { createWorkersAI } from "workers-ai-provider";
import { stripHtmlToText } from "../lib/email-helpers.ts";
import type { EmailFull } from "../lib/schemas.ts";
import type { Env } from "../types.ts";
import type { TriageResult } from "./triager.ts";

// ── Types ─────────────────────────────────────────────────────────────

export interface DraftWriterInput {
	email: EmailFull;
	threadContext: string;
	systemPrompt: string;
	triage: TriageResult;
}

export interface DraftWriterResult {
	subject: string;
	body: string;
	usage: {
		inputTokens: number;
		outputTokens: number;
		latencyMs: number;
		costUsd: number;
	};
}

// ── Implementation ────────────────────────────────────────────────────

export async function runDraftWriter(
	env: Env,
	input: DraftWriterInput,
): Promise<DraftWriterResult | null> {
	if (input.triage.skipDraft) return null;

	const start = Date.now();

	if (!env.AI) return null;

	const workersai = createWorkersAI({ binding: env.AI });

	const emailText = input.email.body
		? stripHtmlToText(input.email.body).substring(0, 3000)
		: "(no body)";

	const userPrompt = `A new email just arrived. Write an appropriate reply.

Email details:
- From: ${input.email.sender}
- To: ${input.email.recipient}
- Subject: ${input.email.subject}
- Date: ${input.email.date}

Email body:
${emailText}

${input.threadContext ? `Thread history:\n${input.threadContext.substring(0, 4000)}` : "This is the first message in the thread (no prior conversation)."}

Triage context: This email was classified as "${input.triage.category}" — ${input.triage.reason}.

IMPORTANT: Write ONLY the email reply text. Do NOT use any tools. Do NOT include meta-commentary like "Here is the draft:" or "Draft created.". Do NOT include markdown formatting, horizontal rules (---), or code blocks. Just write the email as if you were a person replying.`;

	try {
		const result = await generateText({
			model: workersai("@cf/moonshotai/kimi-k2.5"),
			system: `${input.systemPrompt}

CITATION REQUIREMENTS (CRITICAL):
- Every factual claim or reference to an email/attachment MUST be followed by [#email:ID] or [#attachment:ID].
- At the end of your reply, include a separated "Sources:" block listing all cited items, one per line.
- This Sources: block will be parsed out before delivery to the recipient.
- Example: "As discussed in the previous email [#email:abc-123], the deadline is Friday."`,
			prompt: userPrompt,
		});

		const body = result.text?.trim() || "";
		if (!body) return null;

		const subject = input.email.subject.startsWith("Re:")
			? input.email.subject
			: `Re: ${input.email.subject}`;

		const usage = (result as unknown as Record<string, unknown>)
			.usage as Record<string, unknown> | undefined;

		return {
			subject,
			body,
			usage: {
				inputTokens: Number(
					usage?.inputTokens ?? usage?.promptTokens ?? 0,
				),
				outputTokens: Number(
					usage?.outputTokens ?? usage?.completionTokens ?? 0,
				),
				latencyMs: Date.now() - start,
				costUsd: 0,
			},
		};
	} catch (e) {
		console.error("DraftWriter failed:", (e as Error).message);
		throw e; // Let pipeline handle the error
	}
}
