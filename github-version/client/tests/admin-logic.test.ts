// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import assert from "node:assert/strict";
import { test } from "node:test";
import {
	addUsageBucket,
	calculateCompletionRate,
	emptyUsageBucket,
	groupTasksByStatus,
	isTerminalTaskStatus,
} from "../workers/admin/logic.ts";

test("calculateCompletionRate treats done and closed as complete", () => {
	assert.equal(
		calculateCompletionRate([
			{ status: "new" },
			{ status: "done" },
			{ status: "closed" },
			{ status: "blocked" },
		] as any),
		50,
	);
});

test("groupTasksByStatus includes every operational status", () => {
	const grouped = groupTasksByStatus([
		{ status: "new" },
		{ status: "assigned" },
		{ status: "assigned" },
		{ status: "closed" },
	] as any);

	assert.equal(grouped.find((item) => item.status === "assigned")?.count, 2);
	assert.equal(grouped.find((item) => item.status === "closed")?.count, 1);
	assert.equal(grouped.find((item) => item.status === "waiting_client")?.count, 0);
});

test("terminal status helper matches reporting semantics", () => {
	assert.equal(isTerminalTaskStatus("done"), true);
	assert.equal(isTerminalTaskStatus("closed"), true);
	assert.equal(isTerminalTaskStatus("waiting_internal"), false);
});

test("usage buckets add all tracked operations counters", () => {
	const usage = addUsageBucket(emptyUsageBucket(), {
		calls: 2,
		inputTokens: 100,
		outputTokens: 50,
		chatHits: 1,
		costUsd: 0.25,
		errors: 1,
		blocked: 1,
	});

	assert.deepEqual(usage, {
		calls: 2,
		inputTokens: 100,
		outputTokens: 50,
		chatHits: 1,
		costUsd: 0.25,
		errors: 1,
		blocked: 1,
	});
});
