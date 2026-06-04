// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

export interface Template {
	id: string;
	name: string;
	subject?: string | null;
	body: string;
	created_at: string;
	updated_at: string;
}

export interface SignatureSettings {
	enabled: boolean;
	text: string;
	html?: string;
}

export interface MailboxSettings {
	fromName?: string;
	forwarding?: { enabled: boolean; email: string };
	signature?: SignatureSettings;
	autoReply?: { enabled: boolean; subject: string; message: string };
	agentSystemPrompt?: string;
	aiProvider?: "kimi" | "codex" | "openai" | "workers-ai";
	kimiApiKey?: string;
	codexToken?: string;
	openaiKey?: string;
}

export interface Mailbox {
	id: string;
	email: string;
	name: string;
	settings?: MailboxSettings;
}

export interface Email {
	id: string;
	thread_id?: string | null;
	folder_id?: string | null;
	subject: string;
	sender: string;
	recipient: string;
	cc?: string;
	bcc?: string;
	date: string;
	read: boolean;
	starred: boolean;
	body?: string | null;
	body_text?: string | null;
	body_html?: string | null;
	in_reply_to?: string | null;
	email_references?: string | null;
	message_id?: string | null;
	raw_headers?: string | null;
	attachments?: Attachment[];
	snippet?: string | null;
	citations_json?: string | null;
	// Thread aggregate fields (only present in threaded list view)
	thread_count?: number;
	thread_unread_count?: number;
	participants?: string;
	needs_reply?: boolean;
	has_draft?: boolean;
	attachment_count?: number;
}

export interface Attachment {
	id: string;
	filename: string;
	mimetype: string;
	size: number;
	content_id?: string;
	disposition?: string;
}

export interface Folder {
	id: string;
	name: string;
	unreadCount: number;
}

export type AdminClientStatus = "active" | "paused" | "closed";
export type AdminTaskType = "request" | "issue" | "task" | "project" | "draft";
export type AdminTaskStatus =
	| "new"
	| "triaged"
	| "assigned"
	| "in_progress"
	| "waiting_client"
	| "waiting_internal"
	| "done"
	| "closed"
	| "blocked";
export type AdminTaskPriority = "low" | "normal" | "high" | "urgent";

export interface AdminClient {
	id: string;
	name: string;
	company: string;
	email?: string;
	owner?: string;
	status: AdminClientStatus;
	tags: string[];
	notes?: string;
	createdAt: string;
	updatedAt: string;
}

export interface AdminTask {
	id: string;
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
	createdAt: string;
	updatedAt: string;
}

export interface AdminTaskEvent {
	id: string;
	taskId: string;
	eventType: string;
	fromStatus?: string;
	toStatus?: string;
	actorEmail: string;
	actorRole: string;
	metadata: Record<string, unknown>;
	createdAt: string;
}

export interface AdminAuditLog {
	id: string;
	entityType: string;
	entityId: string;
	action: string;
	actorEmail: string;
	actorRole: string;
	before: unknown;
	after: unknown;
	createdAt: string;
}

export interface AdminRelatedEmail {
	id: string;
	mailbox_id?: string;
	mailboxId?: string;
	subject: string;
	sender: string;
	recipient: string;
	received_at?: string;
	receivedAt?: string;
}

export interface AdminClientDetail {
	client: AdminClient;
	tasks: AdminTask[];
	audits: AdminAuditLog[];
	relatedEmails: AdminRelatedEmail[];
	stats: {
		totalTasks: number;
		completedTasks: number;
		openTasks: number;
		overdueTasks: number;
	};
}

export interface AdminTaskDetail {
	task: AdminTask;
	client: AdminClient | null;
	events: AdminTaskEvent[];
	audits: AdminAuditLog[];
	email: Email | null;
}

export interface AdminActionQueue {
	overdue: AdminTask[];
	unassigned: AdminTask[];
	blocked: AdminTask[];
	waitingClient: AdminTask[];
	draftReview: Array<{
		id: string;
		mailboxId: string;
		mailboxEmail: string;
		subject: string;
		recipient: string;
		updatedAt: string;
	}>;
	needsReply: AdminRelatedEmail[];
}

export interface AdminUsageBucket {
	calls: number;
	inputTokens: number;
	outputTokens: number;
	chatHits: number;
	costUsd: number;
	errors: number;
	blocked: number;
}

export interface AdminOverview {
	generatedAt: string;
	totals: {
		mailboxes: number;
		clients: number;
		tasks: number;
		openTasks: number;
		completedTasks: number;
		completionRate: number;
		totalEmails: number;
		unreadEmails: number;
		draftEmails: number;
		needsReply: number;
		threads: number;
		attachments: number;
	};
	mailboxes: Array<{
		id: string;
		email: string;
		name: string;
		totalEmails: number;
		unreadEmails: number;
		draftEmails: number;
		sentEmails: number;
		inboxEmails: number;
		attachments: number;
		threads: number;
		needsReply: number;
		lastEmailAt: string | null;
		byDay: Array<{ date: string; count: number }>;
	}>;
	clients: AdminClient[];
	tasks: AdminTask[];
	charts: {
		emailsByDay: Array<{ date: string; count: number }>;
		tasksByStatus: Array<{ status: AdminTaskStatus; count: number }>;
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
			limit?: number;
		}>;
	};
	aiUsage: {
		day: AdminUsageBucket;
		week: AdminUsageBucket;
		month: AdminUsageBucket;
		total: AdminUsageBucket;
	};
}
