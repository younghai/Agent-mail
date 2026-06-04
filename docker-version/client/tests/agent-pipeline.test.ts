// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

/**
 * Unit tests for the email processing pipeline
 * (workers/agent/pipeline.ts — triage → draft → review).
 *
 * All tests use mock implementations of the three stage runners and
 * a mock ADMIN DO to verify recordAgentUsage calls. Workers AI is
 * never exercised.
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import {
	runEmailPipeline,
	type PipelineInput,
	type PipelineRunners,
} from "../workers/agent/pipeline.ts";
import type { EmailFull } from "../workers/lib/schemas.ts";

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

/** Minimal EmailFull used across tests. */
const SAMPLE_EMAIL: EmailFull = {
	id: "email-1",
	subject: "Hello from Alice",
	sender: "alice@example.com",
	recipient: "user@example.com",
	date: "2026-01-15T10:00:00Z",
	read: false,
	starred: false,
	body: "<p>Hi, I have a question about your product.</p>",
	thread_id: "thread-1",
};

/** Build a minimal Env with spy on ADMIN.recordAgentUsage. */
function makeEnv() {
	const usageCalls: Array<{
		agentId: string;
		operation: string;
		status: string;
		errorCode: string;
	}> = [];

	const adminStub = {
		recordAgentUsage: async (input: {
			agentId: string;
			operation: string;
			status: string;
			errorCode?: string;
		}) => {
			usageCalls.push({
				agentId: input.agentId,
				operation: input.operation,
				status: input.status,
				errorCode: input.errorCode ?? "",
			});
		},
		recordCostAndCheck: async () => ({
			withinDailyBudget: true,
			withinMonthlyBudget: true,
			dailyUsedUsd: 0,
			dailyLimitUsd: 10,
			monthlyUsedUsd: 0,
			monthlyLimitUsd: 100,
		}),
	};

	const fakeId = Symbol("adminId");
	const env = {
		MAILBOX: {
			idFromName: () => Symbol("doId"),
			get: () => ({}),
		},
		AI: {},
		BUCKET: {
			get: async () => null,
			list: async () => ({ objects: [] }),
			put: async () => {},
		},
		ADMIN: {
			idFromName: () => fakeId,
			get: () => adminStub,
		},
		EMAIL: { send: async () => {} },
		DOMAINS: "example.com",
		RATE_LIMIT_PER_MINUTE: "20",
		RATE_LIMIT_PER_DAY: "500",
		DAILY_BUDGET_USD: "10",
		MONTHLY_BUDGET_USD: "100",
	} as unknown as import("../workers/types.ts").Env;

	return { env, usageCalls };
}

/** Standard pipeline input used across tests. */
const SAMPLE_INPUT: PipelineInput = {
	mailboxId: "user@example.com",
	email: SAMPLE_EMAIL,
	threadContext: "[2026-01-15] alice@example.com → user@example.com: Hi, question",
	systemPrompt: "You are a helpful email assistant.",
};

// ---------------------------------------------------------------------------
// Test 1 — Happy path: triage → draft → review all called once
// ---------------------------------------------------------------------------

test("happy path: all three stages called, totalCostUsd is sum of stages", async () => {
	const { env } = makeEnv();

	const triageCalls: unknown[] = [];
	const draftCalls: unknown[] = [];
	const reviewCalls: unknown[] = [];

	const runners: PipelineRunners = {
		triager: async (_env, input) => {
			triageCalls.push(input);
			return {
				category: "inquiry" as const,
				skipDraft: false,
				reason: "general question",
				usage: { inputTokens: 100, outputTokens: 20, latencyMs: 50, costUsd: 0.001 },
			};
		},
		drafter: async (_env, input) => {
			draftCalls.push(input);
			return {
				subject: "Re: Hello from Alice",
				body: "Thanks for your question. Here is the answer.",
				usage: { inputTokens: 500, outputTokens: 100, latencyMs: 200, costUsd: 0.005 },
			};
		},
		reviewer: async (_env, input) => {
			reviewCalls.push(input);
			return {
				sanitizedBody: input.draft.body,
				usage: { inputTokens: 80, outputTokens: 80, latencyMs: 100, costUsd: 0.002 },
			};
		},
	};

	const result = await runEmailPipeline(env, SAMPLE_INPUT, runners);

	// Each stage was called exactly once
	assert.equal(triageCalls.length, 1);
	assert.equal(draftCalls.length, 1);
	assert.equal(reviewCalls.length, 1);

	// Draft is present
	assert.ok(result.draft, "draft should be present");
	assert.equal(result.draft!.subject, "Re: Hello from Alice");
	assert.equal(result.draft!.body, "Thanks for your question. Here is the answer.");

	// totalCostUsd is the sum of all stages
	assert.equal(result.totalCostUsd, 0.001 + 0.005 + 0.002);

	// Triaged is correct
	assert.equal(result.triaged.category, "inquiry");
	assert.equal(result.triaged.skipDraft, false);
});

// ---------------------------------------------------------------------------
// Test 2 — Spam short-circuit: only triager called
// ---------------------------------------------------------------------------

test("spam short-circuit: triage returns spam → draft is null, drafter/reviewer NOT called", async () => {
	const { env } = makeEnv();

	const draftCalls: unknown[] = [];
	const reviewCalls: unknown[] = [];

	const runners: PipelineRunners = {
		triager: async () => ({
			category: "spam" as const,
			skipDraft: true,
			reason: "unsolicited marketing",
			usage: { inputTokens: 50, outputTokens: 10, latencyMs: 30, costUsd: 0.0005 },
		}),
		drafter: async (_env, input) => {
			draftCalls.push(input);
			return null;
		},
		reviewer: async (_env, input) => {
			reviewCalls.push(input);
			return { sanitizedBody: "", usage: { inputTokens: 0, outputTokens: 0, latencyMs: 0, costUsd: 0 } };
		},
	};

	const result = await runEmailPipeline(env, SAMPLE_INPUT, runners);

	// Draft is null
	assert.equal(result.draft, null);

	// Drafter and reviewer were NOT called
	assert.equal(draftCalls.length, 0, "drafter should not be called for spam");
	assert.equal(reviewCalls.length, 0, "reviewer should not be called for spam");

	// Triaged reflects spam
	assert.equal(result.triaged.category, "spam");
	assert.equal(result.triaged.skipDraft, true);
	assert.equal(result.totalCostUsd, 0.0005);
});

// ---------------------------------------------------------------------------
// Test 3 — Reviewer sanitization replaces the body from draft
// ---------------------------------------------------------------------------

test("reviewer sanitization replaces the draft body", async () => {
	const { env } = makeEnv();

	const runners: PipelineRunners = {
		triager: async () => ({
			category: "inquiry" as const,
			skipDraft: false,
			reason: "test",
			usage: { inputTokens: 0, outputTokens: 0, latencyMs: 0, costUsd: 0 },
		}),
		drafter: async () => ({
			subject: "Re: Test",
			body: "Draft created.\n\nHere is the reply text.\n---\nExtra line.",
			usage: { inputTokens: 0, outputTokens: 0, latencyMs: 0, costUsd: 0 },
		}),
		reviewer: async () => ({
			sanitizedBody: "Here is the reply text.",
			usage: { inputTokens: 0, outputTokens: 0, latencyMs: 0, costUsd: 0 },
		}),
	};

	const result = await runEmailPipeline(env, SAMPLE_INPUT, runners);

	assert.ok(result.draft, "draft should be present");
	// Body should be the REVIEWER's sanitized version, not the drafter's original
	assert.equal(
		result.draft!.body,
		"Here is the reply text.",
		"body should be sanitized by reviewer",
	);
});

// ---------------------------------------------------------------------------
// Test 4 — Triager throws: pipeline returns draft=null, no throw
// ---------------------------------------------------------------------------

test("triager error: pipeline returns draft=null without throwing", async () => {
	const { env } = makeEnv();

	const runners: PipelineRunners = {
		triager: async () => {
			throw new Error("AI service unavailable");
		},
		drafter: async () => null,
		reviewer: async () => ({
			sanitizedBody: "unused",
			usage: { inputTokens: 0, outputTokens: 0, latencyMs: 0, costUsd: 0 },
		}),
	};

	// Must NOT throw
	const result = await runEmailPipeline(env, SAMPLE_INPUT, runners);

	assert.equal(result.draft, null, "draft should be null on triager error");
	assert.equal(result.triaged.category, "inquiry");
	assert.equal(result.triaged.skipDraft, true);
	assert.ok(
		result.triaged.reason.includes("error"),
		"reason should mention error",
	);
});

// ---------------------------------------------------------------------------
// Test 5 — recordAgentUsage stage operations emitted in order
// ---------------------------------------------------------------------------

test("recordAgentUsage operations are emitted in order: triage, draft, review", async () => {
	const { env, usageCalls } = makeEnv();

	const runners: PipelineRunners = {
		triager: async () => ({
			category: "inquiry" as const,
			skipDraft: false,
			reason: "test",
			usage: { inputTokens: 0, outputTokens: 0, latencyMs: 0, costUsd: 0 },
		}),
		drafter: async () => ({
			subject: "Re: Test",
			body: "Hello",
			usage: { inputTokens: 0, outputTokens: 0, latencyMs: 0, costUsd: 0 },
		}),
		reviewer: async () => ({
			sanitizedBody: "unused",
			usage: { inputTokens: 0, outputTokens: 0, latencyMs: 0, costUsd: 0 },
		}),
	};

	await runEmailPipeline(env, SAMPLE_INPUT, runners);

	// Should have exactly 3 usage records: triage, draft, review
	assert.equal(usageCalls.length, 3, "should have 3 stage usage records");

	assert.equal(usageCalls[0].operation, "triage");
	assert.equal(usageCalls[0].status, "ok");

	assert.equal(usageCalls[1].operation, "draft");
	assert.equal(usageCalls[1].status, "ok");

	assert.equal(usageCalls[2].operation, "review");
	assert.equal(usageCalls[2].status, "ok");
});
