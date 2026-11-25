// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import type {
	AdminActionQueue,
	AdminClient,
	AdminClientDetail,
	AdminOverview,
	AdminTask,
	AdminTaskDetail,
	Email,
	Folder,
	Mailbox,
	Template,
} from "~/types";

const REQUEST_TIMEOUT_MS = 30_000;

export class ApiError extends Error {
	status: number;
	code: string;
	body: Record<string, unknown>;

	constructor(status: number, body: Record<string, unknown>) {
		const detail = body.error && typeof body.error === "object" ? (body.error as Record<string, unknown>) : {};
		super(typeof body.error === "string" ? body.error :
			"message" in detail ? String(detail.message) : `Request failed: ${status}`);
		this.name = "ApiError";
		this.status = status;
		this.code = typeof detail.code === "string" ? detail.code : "";
		this.body = body;
	}
}

// Error bodies arrive in more than one shape ({error}, {success, error: {code, message}}); never trust their type.
async function readJsonBody(response: Response): Promise<Record<string, unknown>> {
	const body = await response.json().catch(() => null);
	return body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : {};
}

export async function request<T>(
	url: string,
	options: RequestInit = {},
): Promise<T> {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

	// Combine caller signal (e.g. TanStack Query abort) with our timeout signal
	const signal = options.signal
		? AbortSignal.any([options.signal, controller.signal])
		: controller.signal;

	try {
		const localServiceToken =
			(typeof window !== "undefined" && window.localStorage.getItem("agentic.localServiceToken")) ||
			import.meta.env.VITE_LOCAL_SERVICE_TOKEN ||
			"";
		const isServer = typeof window === "undefined";
		const baseUrl = isServer ? import.meta.env.VITE_API_BASE_URL || "http://localhost:5174" : "";
		const fullUrl = baseUrl ? `${baseUrl}${url}` : url;
		const res = await fetch(fullUrl, {
			...options,
			signal,
			headers: {
				"Content-Type": "application/json",
				...(localServiceToken ? { Authorization: `Bearer ${localServiceToken}` } : {}),
				...(options.headers as Record<string, string>),
			},
		});

		if (!res.ok) {
			const error = new ApiError(res.status, await readJsonBody(res));
			if (error.status === 401 && error.code === "LOGIN_REQUIRED" && typeof window !== "undefined") {
				window.location.assign("/auth/login");
			}
			throw error;
		}

		if (res.status === 204) return undefined as T;

		const contentType = res.headers.get("content-type") ?? "";
		if (contentType.includes("application/json")) {
			const json = await res.json();
			if (
				json &&
				typeof json === "object" &&
				"success" in json &&
				(json as { success?: unknown }).success === true &&
				"data" in json
			) {
				return (json as { data: T }).data;
			}
			return json as T;
		}
		if ((options.headers as Record<string, string> | undefined)?.Accept !== "*/*") {
			throw new ApiError(res.status, {
				error: `Expected JSON response from ${url}, received ${contentType || "unknown content type"}`,
			});
		}
		return res.blob() as unknown as T;
	} finally {
		clearTimeout(timeout);
	}
}

function get<T>(url: string, opts?: { params?: Record<string, string>; responseType?: string; signal?: AbortSignal }) {
	const query = opts?.params ? `?${new URLSearchParams(opts.params)}` : "";
	return request<T>(`${url}${query}`, {
		method: "GET",
		signal: opts?.signal,
		...(opts?.responseType === "blob" ? { headers: { Accept: "*/*" } } : {}),
	});
}

function post<T>(url: string, body?: unknown, opts?: { signal?: AbortSignal }) {
	return request<T>(url, {
		method: "POST",
		signal: opts?.signal,
		body: body != null ? JSON.stringify(body) : undefined,
	});
}

function put<T>(url: string, body?: unknown) {
	return request<T>(url, {
		method: "PUT",
		body: body != null ? JSON.stringify(body) : undefined,
	});
}

function del<T>(url: string) {
	return request<T>(url, { method: "DELETE" });
}

// ---------- Typed response shapes ----------

interface EmailListResponse {
	emails: Email[];
	totalCount: number;
}

// ---------- API client ----------

const api = {
	// Config
	getConfig: () =>
		get<{ domains: string[]; emailAddresses: string[] }>("/api/v1/config"),

	// System status
	getStatus: () =>
		get<{
			mailServer: { status: string; label: string };
			database:   { status: string; label: string };
			aiAgent:    { status: string; label: string };
			openai:     { status: string; label: string };
			redis:      { status: string; label: string };
		}>("/api/v1/status"),

	// Mailboxes
	listMailboxes: () => get<Mailbox[]>("/api/v1/mailboxes"),
	createMailbox: (email: string, name: string, settings?: unknown) =>
		post<Mailbox>("/api/v1/mailboxes", { email, name, settings }),
	getMailbox: (mailboxId: string) =>
		get<Mailbox>(`/api/v1/mailboxes/${mailboxId}`),
	updateMailbox: (mailboxId: string, settings: unknown) =>
		put<Mailbox>(`/api/v1/mailboxes/${mailboxId}`, { settings }),
	deleteMailbox: (mailboxId: string) =>
		del<void>(`/api/v1/mailboxes/${mailboxId}`),

	// Emails
	listEmails: (mailboxId: string, params: Record<string, string>, opts?: { signal?: AbortSignal }) =>
		get<EmailListResponse | Email[]>(`/api/v1/mailboxes/${mailboxId}/emails`, { params, signal: opts?.signal }),
	sendEmail: (mailboxId: string, email: unknown) =>
		post<void>(`/api/v1/mailboxes/${mailboxId}/emails`, email),
	getEmail: (mailboxId: string, id: string, opts?: { signal?: AbortSignal }) =>
		get<Email>(`/api/v1/mailboxes/${mailboxId}/emails/${id}`, { signal: opts?.signal }),
	updateEmail: (mailboxId: string, id: string, data: unknown) =>
		put<Email>(`/api/v1/mailboxes/${mailboxId}/emails/${id}`, data),
	deleteEmail: (mailboxId: string, id: string) =>
		del<void>(`/api/v1/mailboxes/${mailboxId}/emails/${id}`),
	moveEmail: (mailboxId: string, id: string, folderId: string) =>
		post<void>(`/api/v1/mailboxes/${mailboxId}/emails/${id}/move`, { folderId }),
	getThread: (mailboxId: string, threadId: string, opts?: { signal?: AbortSignal }) =>
		get<Email[]>(`/api/v1/mailboxes/${mailboxId}/threads/${threadId}`, { signal: opts?.signal }),
	markThreadRead: (mailboxId: string, threadId: string) =>
		post<void>(`/api/v1/mailboxes/${mailboxId}/threads/${threadId}/read`),
	getAttachment: (mailboxId: string, emailId: string, attachmentId: string) =>
		get<Blob>(`/api/v1/mailboxes/${mailboxId}/emails/${emailId}/attachments/${attachmentId}`, { responseType: "blob" }),
	saveDraft: (
		mailboxId: string,
		draft: {
			to?: string;
			cc?: string;
			bcc?: string;
			subject?: string;
			body: string;
			in_reply_to?: string;
			thread_id?: string;
			draft_id?: string;
		},
	) => post<{ draft_id: string }>(`/api/v1/mailboxes/${mailboxId}/drafts`, draft),
	replyToEmail: (mailboxId: string, emailId: string, email: unknown) =>
		post<void>(`/api/v1/mailboxes/${mailboxId}/emails/${emailId}/reply`, email),
	forwardEmail: (mailboxId: string, emailId: string, email: unknown) =>
		post<void>(`/api/v1/mailboxes/${mailboxId}/emails/${emailId}/forward`, email),

	// Folders
	listFolders: (mailboxId: string) =>
		get<Folder[]>(`/api/v1/mailboxes/${mailboxId}/folders`),
	createFolder: (mailboxId: string, name: string) =>
		post<Folder>(`/api/v1/mailboxes/${mailboxId}/folders`, { name }),
	updateFolder: (mailboxId: string, id: string, name: string) =>
		put<Folder>(`/api/v1/mailboxes/${mailboxId}/folders/${id}`, { name }),
	deleteFolder: (mailboxId: string, id: string) =>
		del<void>(`/api/v1/mailboxes/${mailboxId}/folders/${id}`),

	// Templates
	listTemplates: (mailboxId: string) =>
		get<Template[]>(`/api/v1/mailboxes/${mailboxId}/templates`),
	createTemplate: (
		mailboxId: string,
		input: { name: string; subject?: string | null; body: string },
	) => post<Template>(`/api/v1/mailboxes/${mailboxId}/templates`, input),
	updateTemplate: (
		mailboxId: string,
		id: string,
		patch: { name?: string; subject?: string | null; body?: string },
	) => put<Template>(`/api/v1/mailboxes/${mailboxId}/templates/${id}`, patch),
	deleteTemplate: (mailboxId: string, id: string) =>
		del<void>(`/api/v1/mailboxes/${mailboxId}/templates/${id}`),
	touchTemplate: (mailboxId: string, id: string) =>
		post<void>(`/api/v1/mailboxes/${mailboxId}/templates/${id}/touch`, {}),

	// Agent feedback
	recordAgentFeedback: (
		mailboxId: string,
		input: {
			call_id: string;
			session_id?: string | null;
			score: 1 | -1;
			comment?: string | null;
		},
	) =>
		post<{ id: string; call_id: string; score: 1 | -1; created_at: string } | null>(
			`/api/v1/mailboxes/${mailboxId}/agent-feedback`,
			input,
		),
	deleteAgentFeedback: (mailboxId: string, callId: string, score: 1 | -1) =>
		del<void>(`/api/v1/mailboxes/${mailboxId}/agent-feedback/${callId}/${score}`),
	getAgentFeedbackSummary: (mailboxId: string) =>
		get<{ up: number; down: number; total: number }>(
			`/api/v1/mailboxes/${mailboxId}/agent-feedback/summary`,
		),

	// Approvals (HITL)
	listPendingApprovals: (mailboxId: string) =>
		get<Array<{
			id: string;
			subject: string | null;
			sender: string | null;
			recipient: string | null;
			body: string | null;
			date: string | null;
			thread_id: string | null;
			in_reply_to: string | null;
			approval_state: string | null;
			approval_meta: {
				decided_by?: string;
				decided_at?: string;
				comment?: string | null;
				submitted_at?: string;
			} | null;
		}>>(`/api/v1/mailboxes/${mailboxId}/approvals`),
	transitionApproval: (
		mailboxId: string,
		emailId: string,
		input: {
			action: "submit" | "approve" | "reject";
			decided_by?: string;
			comment?: string | null;
		},
	) =>
		post<{ state: string; meta: Record<string, unknown> }>(
			`/api/v1/mailboxes/${mailboxId}/drafts/${emailId}/approval`,
			input,
		),

	// Search
	searchEmails: (mailboxId: string, params: Record<string, string>) =>
		get<EmailListResponse | Email[]>(`/api/v1/mailboxes/${mailboxId}/search`, { params }),

	// Admin
	getAdminOverview: () => get<AdminOverview>("/api/v1/admin/overview"),
	getAdminActionQueue: () => get<AdminActionQueue>("/api/v1/admin/action-queue"),
	listAdminClients: () => get<AdminClient[]>("/api/v1/admin/clients"),
	getAdminClient: (clientId: string) => get<AdminClientDetail>(`/api/v1/admin/clients/${clientId}`),
	createAdminClient: (client: Omit<AdminClient, "id" | "createdAt" | "updatedAt">) =>
		post<AdminClient>("/api/v1/admin/clients", client),
	updateAdminClient: (clientId: string, client: Omit<AdminClient, "id" | "createdAt" | "updatedAt">) =>
		put<AdminClient>(`/api/v1/admin/clients/${clientId}`, client),
	listAdminTasks: () => get<AdminTask[]>("/api/v1/admin/tasks"),
	getAdminTask: (taskId: string) => get<AdminTaskDetail>(`/api/v1/admin/tasks/${taskId}`),
	createAdminTask: (task: Omit<AdminTask, "id" | "createdAt" | "updatedAt">) =>
		post<AdminTask>("/api/v1/admin/tasks", task),
	updateAdminTask: (taskId: string, task: Omit<AdminTask, "id" | "createdAt" | "updatedAt">) =>
		put<AdminTask>(`/api/v1/admin/tasks/${taskId}`, task),
	createRequestFromEmail: (input: { mailboxId: string; emailId: string; clientId?: string; owner?: string }) =>
		post<AdminTask>("/api/v1/admin/requests/from-email", input),
	aiDraft: (input: { mailboxId: string; emailId: string; sender?: string; subject?: string; threadId?: string }) =>
		post<{ draft_id: string; subject: string; body_text: string }>(
			`/api/v1/mailboxes/${input.mailboxId}/ai/draft`,
			{ email_id: input.emailId, sender: input.sender, subject: input.subject, thread_id: input.threadId },
		),

	// Admin cost dashboard
	getAdminCostDaily: (days?: number) =>
		get<{ data: Array<{ day: string; costUsd: number; dailyLimitUsd: number }>; days: number }>(
			"/api/v1/admin/cost/daily",
			days !== undefined ? { params: { days: String(days) } } : undefined,
		),
	getAdminCostMonthly: (months?: number) =>
		get<{ data: Array<{ month: string; costUsd: number; monthlyLimitUsd: number }>; months: number }>(
			"/api/v1/admin/cost/monthly",
			months !== undefined ? { params: { months: String(months) } } : undefined,
		),
	getAdminCostModels: (days?: number) =>
		get<{ data: Array<{ model: string; operation: string; count: number; inputTokens: number; outputTokens: number }>; days: number }>(
			"/api/v1/admin/cost/models",
			days !== undefined ? { params: { days: String(days) } } : undefined,
		),

	// Customer segments
	listCustomerSegments: (mailboxId: string) =>
		get<Array<{
			email: string;
			domain: string;
			segment: "vip" | "regular" | "new" | "dormant";
			totalMessages: number;
			lastSeenAt: string;
			firstSeenAt: string;
			starred: number;
		}>>(`/api/v1/mailboxes/${mailboxId}/segments`),

	// SLA metrics
	getSlaMetrics: (mailboxId: string, window?: "24h" | "7d" | "30d") =>
		get<{
			window: string;
			generatedAt: string;
			totalReceived: number;
			totalReplied: number;
			unreplied: number;
			avgResponseHours: number;
			p50ResponseHours: number;
			p90ResponseHours: number;
			overdue: Array<{ id: string; subject: string; sender: string; age_hours: number }>;
			trend: Array<{ date: string; received: number; replied: number; avgHours: number }>;
		}>(
			`/api/v1/mailboxes/${mailboxId}/admin/sla`,
			window ? { params: { window } } : undefined,
		),
};

export default api;
