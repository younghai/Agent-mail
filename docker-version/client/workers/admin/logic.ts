// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { ADMIN_TASK_STATUSES, type AdminTask, type AdminTaskStatus, type AgentUsageBucket } from "./types.ts";

export function calculateCompletionRate(tasks: Pick<AdminTask, "status">[]) {
	if (tasks.length === 0) return 0;
	const completed = tasks.filter((task) => task.status === "done" || task.status === "closed").length;
	return Math.round((completed / tasks.length) * 100);
}

export function groupTasksByStatus(tasks: Pick<AdminTask, "status">[]) {
	return ADMIN_TASK_STATUSES.map((status) => ({
		status,
		count: tasks.filter((task) => task.status === status).length,
	}));
}

export function isTerminalTaskStatus(status: AdminTaskStatus) {
	return status === "done" || status === "closed";
}

export function emptyUsageBucket(): AgentUsageBucket {
	return {
		calls: 0,
		inputTokens: 0,
		outputTokens: 0,
		chatHits: 0,
		costUsd: 0,
		errors: 0,
		blocked: 0,
	};
}

export function addUsageBucket(a: AgentUsageBucket, b: AgentUsageBucket): AgentUsageBucket {
	return {
		calls: a.calls + b.calls,
		inputTokens: a.inputTokens + b.inputTokens,
		outputTokens: a.outputTokens + b.outputTokens,
		chatHits: a.chatHits + b.chatHits,
		costUsd: a.costUsd + b.costUsd,
		errors: a.errors + b.errors,
		blocked: a.blocked + b.blocked,
	};
}
