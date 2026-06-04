// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

export const ADMIN_TASK_STATUSES = [
	"new",
	"triaged",
	"assigned",
	"in_progress",
	"waiting_client",
	"waiting_internal",
	"done",
	"closed",
	"blocked",
] as const;

export type AdminRole = "admin" | "manager" | "operator" | "viewer";
export type AdminClientStatus = "active" | "paused" | "closed";
export type AdminTaskType = "request" | "issue" | "task" | "project" | "draft";
export type AdminTaskStatus = (typeof ADMIN_TASK_STATUSES)[number];
export type AdminTaskPriority = "low" | "normal" | "high" | "urgent";

export interface AdminActor {
	email: string;
	role: AdminRole;
}

export interface AdminClientInput {
	name: string;
	company: string;
	email?: string;
	owner?: string;
	status: AdminClientStatus;
	tags: string[];
	notes?: string;
}

export interface AdminClient extends AdminClientInput {
	id: string;
	createdAt: string;
	updatedAt: string;
}

export interface AdminTaskInput {
	clientId: string;
	title: string;
	type: AdminTaskType;
	status: AdminTaskStatus;
	priority: AdminTaskPriority;
	owner?: string;
	dueDate?: string;
	completion: number;
	mailboxId?: string;
	requestEmailId?: string;
	issue?: string;
	notes?: string;
}

export interface AdminTask extends AdminTaskInput {
	id: string;
	createdAt: string;
	updatedAt: string;
}

export interface AgentUsageEventInput {
	agentId: string;
	operation: "chat" | "auto_draft" | "verify_draft" | "prompt_injection" | "tool" | "other" | "triage" | "draft" | "review";
	model?: string;
	inputTokens?: number;
	outputTokens?: number;
	costUsd?: number;
	latencyMs?: number;
	status: "ok" | "error" | "blocked";
	errorCode?: string;
	createdAt?: string;
}

export interface AgentUsageBucket {
	calls: number;
	inputTokens: number;
	outputTokens: number;
	chatHits: number;
	costUsd: number;
	errors: number;
	blocked: number;
}

export interface TaskStatusCount {
	status: AdminTaskStatus;
	count: number;
}

export interface AdminSnapshot {
	generatedAt: string;
	clients: AdminClient[];
	tasks: AdminTask[];
	charts: {
		tasksByStatus: TaskStatusCount[];
		tasksByClient: Array<{
			clientId: string;
			clientName: string;
			total: number;
			completed: number;
			overdue: number;
		}>;
		aiUsageByDay: Array<{
			date: string;
			agentId: string;
			calls: number;
			inputTokens: number;
			outputTokens: number;
			chatHits: number;
			costUsd: number;
			errors: number;
			blocked: number;
		}>;
	};
	aiUsage: {
		day: AgentUsageBucket;
		week: AgentUsageBucket;
		month: AgentUsageBucket;
		total: AgentUsageBucket;
	};
}
