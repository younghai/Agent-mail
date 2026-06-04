// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

/**
 * Email processing pipeline — Triager → DraftWriter → Reviewer.
 *
 * Orchestrates the three stages of automatic email reply generation.
 * Each stage records its own usage via recordAgentUsage + recordAiEvent.
 *
 * Skip conditions:
 *   - triaged.category === "spam" → draft=null, no further AI calls
 *   - triage.skipDraft === true → draft=null
 *
 * On any thrown error mid-pipeline, returns draft=null and logs via
 * captureWorkerError.
 */

import type { EmailFull } from "../lib/schemas.ts";
import type { Env } from "../types.ts";
import { captureWorkerError } from "../lib/observability/sentry.ts";
import { recordAiEvent } from "../lib/observability/analytics.ts";
import { runTriager, type TriageInput, type TriageResult } from "./triager.ts";
import {
	runDraftWriter,
	type DraftWriterInput,
	type DraftWriterResult,
} from "./draft-writer.ts";
import { runReviewer, type ReviewerInput, type ReviewerResult } from "./reviewer.ts";
import { extractCitations, type Citation } from "../lib/citations.ts";

// ── Public types ──────────────────────────────────────────────────────

export interface PipelineInput {
	mailboxId: string;
	email: EmailFull;
	threadContext: string;
	systemPrompt: string;
}

export interface PipelineResult {
	triaged: {
		category: string;
		skipDraft: boolean;
		reason: string;
	};
	draft: {
		subject: string;
		body: string;
		citations?: Citation[];
	} | null;
	totalCostUsd: number;
	totalLatencyMs: number;
}

// ── Dependency injection (for testing) ────────────────────────────────

export interface PipelineRunners {
	triager?: (env: Env, input: TriageInput) => Promise<TriageResult>;
	drafter?: (
		env: Env,
		input: DraftWriterInput,
	) => Promise<DraftWriterResult | null>;
	reviewer?: (env: Env, input: ReviewerInput) => Promise<ReviewerResult>;
}

// ── recordAgentUsage (extracted from index.ts) ────────────────────────

/**
 * Record agent usage to the ADMIN DO and check cost budgets.
 *
 * Operation type widened to include pipeline stages:
 * "chat" | "auto_draft" | "triage" | "draft" | "review".
 */
export async function recordAgentUsage(
	env: Env,
	agentId: string,
	event: "chat" | "auto_draft" | "triage" | "draft" | "review",
	usage?: unknown,
	status: "ok" | "error" | "blocked" = "ok",
	errorCode = "",
	estimatedCostUsd?: number,
) {
	const usageRecord = (usage ?? {}) as Record<string, unknown>;
	const inputTokens = Number(
		usageRecord.inputTokens ??
			usageRecord.promptTokens ??
			usageRecord.prompt_tokens ??
			0,
	);
	const outputTokens = Number(
		usageRecord.outputTokens ??
			usageRecord.completionTokens ??
			usageRecord.completion_tokens ??
			0,
	);

	const admin = env.ADMIN.get(env.ADMIN.idFromName("global"));
	await admin.recordAgentUsage({
		agentId,
		operation: event,
		model: event === "triage"
			? "@cf/meta/llama-3.2-3b-instruct"
			: "@cf/moonshotai/kimi-k2.5",
		inputTokens: Number.isFinite(inputTokens) ? inputTokens : 0,
		outputTokens: Number.isFinite(outputTokens) ? outputTokens : 0,
		costUsd: 0,
		status,
		errorCode,
	});

	// Cost guard — record spend and alert if over budget (never blocks caller).
	const costUsd = estimatedCostUsd ?? 0;
	if (costUsd > 0) {
		try {
			const result = await admin.recordCostAndCheck(costUsd, {
				DAILY_BUDGET_USD: env.DAILY_BUDGET_USD,
				MONTHLY_BUDGET_USD: env.MONTHLY_BUDGET_USD,
			});
			if (!result.withinDailyBudget || !result.withinMonthlyBudget) {
				captureWorkerError(
					new Error(
						`Cost budget exceeded: daily=${result.dailyUsedUsd.toFixed(4)}/${result.dailyLimitUsd} monthly=${result.monthlyUsedUsd.toFixed(4)}/${result.monthlyLimitUsd}`,
					),
					{
						agentId,
						event,
						dailyUsedUsd: result.dailyUsedUsd,
						dailyLimitUsd: result.dailyLimitUsd,
						monthlyUsedUsd: result.monthlyUsedUsd,
						monthlyLimitUsd: result.monthlyLimitUsd,
					},
					"fatal",
				);
			}
		} catch {
			// Swallow — cost guard must never break the agent flow.
		}
	}
}

// ── Helper: record one pipeline stage ─────────────────────────────────

async function recordStage(
	env: Env,
	mailboxId: string,
	operation: "triage" | "draft" | "review",
	stageUsage: { inputTokens: number; outputTokens: number; latencyMs: number; costUsd: number },
	status: "ok" | "error" | "blocked" = "ok",
	errorCode = "",
) {
	await recordAgentUsage(env, mailboxId, operation, stageUsage, status, errorCode, stageUsage.costUsd);

	const model =
		operation === "triage"
			? "@cf/meta/llama-3.2-3b-instruct"
			: operation === "review"
				? "@cf/meta/llama-4-scout-17b-16e-instruct"
				: "@cf/moonshotai/kimi-k2.5";

	recordAiEvent(env, {
		mailboxId,
		operation,
		model,
		inputTokens: stageUsage.inputTokens,
		outputTokens: stageUsage.outputTokens,
		costUsd: stageUsage.costUsd,
		latencyMs: stageUsage.latencyMs,
		status,
		errorCode,
	});
}

// ── Pipeline entry point ──────────────────────────────────────────────

export async function runEmailPipeline(
	env: Env,
	input: PipelineInput,
	runners?: PipelineRunners,
): Promise<PipelineResult> {
	const pipelineStart = Date.now();
	const _triager = runners?.triager ?? runTriager;
	const _drafter = runners?.drafter ?? runDraftWriter;
	const _reviewer = runners?.reviewer ?? runReviewer;

	// ── Stage 1: Triage ────────────────────────────────────────────
	let triaged: TriageResult;
	try {
		triaged = await _triager(env, {
			email: input.email,
			threadContext: input.threadContext,
		});
		await recordStage(env, input.mailboxId, "triage", triaged.usage);
	} catch (e) {
		const err = e as Error;
		console.error("Pipeline triage stage failed:", err.message);
		captureWorkerError(err, {
			mailboxId: input.mailboxId,
			stage: "triage",
		});

		await recordStage(
			env,
			input.mailboxId,
			"triage",
			{ inputTokens: 0, outputTokens: 0, latencyMs: Date.now() - pipelineStart, costUsd: 0 },
			"error",
			"triage_failed",
		);

		return {
			triaged: { category: "inquiry", skipDraft: true, reason: `error: ${err.message}` },
			draft: null,
			totalCostUsd: 0,
			totalLatencyMs: Date.now() - pipelineStart,
		};
	}

	// ── Short-circuit: spam or skipDraft ────────────────────────────
	if (triaged.skipDraft) {
		return {
			triaged: {
				category: triaged.category,
				skipDraft: true,
				reason: triaged.reason,
			},
			draft: null,
			totalCostUsd: triaged.usage.costUsd,
			totalLatencyMs: Date.now() - pipelineStart,
		};
	}

	// ── Stage 2: Draft ─────────────────────────────────────────────
	let draftResult: DraftWriterResult | null;
	try {
		draftResult = await _drafter(env, {
			email: input.email,
			threadContext: input.threadContext,
			systemPrompt: input.systemPrompt,
			triage: triaged,
		});

		if (draftResult) {
			await recordStage(env, input.mailboxId, "draft", draftResult.usage);
		}
	} catch (e) {
		const err = e as Error;
		console.error("Pipeline draft stage failed:", err.message);
		captureWorkerError(err, {
			mailboxId: input.mailboxId,
			stage: "draft",
		});

		await recordStage(
			env,
			input.mailboxId,
			"draft",
			{ inputTokens: 0, outputTokens: 0, latencyMs: 0, costUsd: 0 },
			"error",
			"draft_failed",
		);

		return {
			triaged: {
				category: triaged.category,
				skipDraft: triaged.skipDraft,
				reason: triaged.reason,
			},
			draft: null,
			totalCostUsd: 0,
			totalLatencyMs: Date.now() - pipelineStart,
		};
	}

	if (!draftResult) {
		return {
			triaged: {
				category: triaged.category,
				skipDraft: triaged.skipDraft,
				reason: triaged.reason,
			},
			draft: null,
			totalCostUsd: 0,
			totalLatencyMs: Date.now() - pipelineStart,
		};
	}

	// ── Extract citations from draft body before review ──────────
		const { stripped: strippedDraftBody, citations } = extractCitations(draftResult.body);

	// ── Stage 3: Review ────────────────────────────────────────────
	let reviewResult: ReviewerResult;
	try {
		reviewResult = await _reviewer(env, {
			draft: { subject: draftResult.subject, body: strippedDraftBody },
		});
		await recordStage(env, input.mailboxId, "review", reviewResult.usage);
	} catch (e) {
		const err = e as Error;
		console.error("Pipeline review stage failed:", err.message);
		captureWorkerError(err, {
			mailboxId: input.mailboxId,
			stage: "review",
		});

		await recordStage(
			env,
			input.mailboxId,
			"review",
			{ inputTokens: 0, outputTokens: 0, latencyMs: 0, costUsd: 0 },
			"error",
			"review_failed",
		);

		// Return the unreviewed draft rather than null — best effort
		return {
			triaged: {
				category: triaged.category,
				skipDraft: triaged.skipDraft,
				reason: triaged.reason,
			},
			draft: { subject: draftResult.subject, body: strippedDraftBody, citations },
			totalCostUsd: draftResult.usage.costUsd,
			totalLatencyMs: Date.now() - pipelineStart,
		};
	}

	// ── Assemble result ────────────────────────────────────────────
	const totalCostUsd =
		triaged.usage.costUsd +
		draftResult.usage.costUsd +
		reviewResult.usage.costUsd;

	return {
		triaged: {
			category: triaged.category,
			skipDraft: triaged.skipDraft,
			reason: triaged.reason,
		},
		draft: {
			subject: draftResult.subject,
			body: reviewResult.sanitizedBody,
				citations,
		},
		totalCostUsd,
		totalLatencyMs: Date.now() - pipelineStart,
	};
}
