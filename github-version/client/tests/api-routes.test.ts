// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

/**
 * Integration tests for Workers REST API routes.
 *
 * Strategy: Rather than importing workers/index.ts directly (which has
 * extensionless imports that break Node ESM), we build an equivalent Hono
 * app inline with the same route handlers wired to injectable mock
 * dependencies. This gives us real Hono routing + middleware behaviour
 * without requiring the Cloudflare Workers runtime.
 *
 * Routes covered (35 total, ≥15 tested below):
 *   GET  /api/v1/config
 *   GET  /api/v1/admin/clients
 *   POST /api/v1/admin/clients
 *   PUT  /api/v1/admin/clients/:clientId
 *   GET  /api/v1/admin/clients/:clientId
 *   GET  /api/v1/admin/tasks
 *   POST /api/v1/admin/tasks
 *   POST /api/v1/admin/requests/from-email
 *   GET  /api/v1/admin/action-queue
 *   GET  /api/v1/mailboxes
 *   POST /api/v1/mailboxes
 *   GET  /api/v1/mailboxes/:mailboxId
 *   PUT  /api/v1/mailboxes/:mailboxId
 *   DELETE /api/v1/mailboxes/:mailboxId
 *   GET  /api/v1/mailboxes/:mailboxId/emails
 *   GET  /api/v1/mailboxes/:mailboxId/emails/:id
 *   PUT  /api/v1/mailboxes/:mailboxId/emails/:id
 *   DELETE /api/v1/mailboxes/:mailboxId/emails/:id
 *   POST /api/v1/mailboxes/:mailboxId/emails/:id/move
 *   POST /api/v1/mailboxes/:mailboxId/drafts
 *   GET  /api/v1/mailboxes/:mailboxId/folders
 *   POST /api/v1/mailboxes/:mailboxId/folders
 *   GET  /api/v1/mailboxes/:mailboxId/threads/:threadId
 *   GET  /api/v1/mailboxes/:mailboxId/emails/:emailId/attachments/:attachmentId
 *   GET  /api/v1/mailboxes/:mailboxId/search
 *   unknown route → 404
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { createMiddleware } from "hono/factory";
import { z } from "zod";
import { adminActor, type AccessIdentity } from "../workers/lib/access.ts";

// ---------------------------------------------------------------------------
// Types (minimal inline to avoid importing CF-specific modules)
// ---------------------------------------------------------------------------

interface MockR2Object {
	json<T = unknown>(): Promise<T>;
	text(): Promise<string>;
	arrayBuffer(): Promise<ArrayBuffer>;
	body: ReadableStream;
}

interface MockR2 {
	_store: Map<string, string | ArrayBuffer>;
	head(key: string): Promise<{ key: string } | null>;
	get(key: string): Promise<MockR2Object | null>;
	put(key: string, value: string | ArrayBuffer): Promise<void>;
	delete(keys: string | string[]): Promise<void>;
	list(opts?: { prefix?: string }): Promise<{ objects: { key: string }[] }>;
}

interface MockDOStub {
	[method: string]: (...args: unknown[]) => Promise<unknown>;
}

interface MockDONamespace {
	idFromName(name: string): { toString(): string };
	get(): MockDOStub;
}

type AdminRole = "admin" | "manager" | "operator" | "viewer";
interface AdminActor { email: string; role: AdminRole }

// ---------------------------------------------------------------------------
// Mock R2
// ---------------------------------------------------------------------------

function createMockR2(): MockR2 {
	const store = new Map<string, string | ArrayBuffer>();
	return {
		_store: store,
		async head(key: string) {
			return store.has(key) ? { key } : null;
		},
		async get(key: string) {
			const val = store.get(key);
			if (val === undefined) return null;
			const v = val;
			return {
				body: new ReadableStream(),
				async json<T>() { return JSON.parse(v as string) as T; },
				async text() { return v as string; },
				async arrayBuffer() {
					if (typeof v === "string") return new TextEncoder().encode(v).buffer as ArrayBuffer;
					return v as ArrayBuffer;
				},
			};
		},
		async put(key: string, value: string | ArrayBuffer) {
			store.set(key, value);
		},
		async delete(keys: string | string[]) {
			const arr = Array.isArray(keys) ? keys : [keys];
			for (const k of arr) store.delete(k);
		},
		async list(opts?: { prefix?: string }) {
			const prefix = opts?.prefix ?? "";
			const objects = [...store.keys()]
				.filter((k) => k.startsWith(prefix))
				.map((k) => ({ key: k }));
			return { objects };
		},
	};
}

// ---------------------------------------------------------------------------
// Mock Mailbox DO stub
// ---------------------------------------------------------------------------

interface MailboxStubConfig {
	emails?: unknown[];
	email?: unknown | null;
	folders?: unknown[];
	threadEmails?: unknown[];
	attachment?: { filename: string; mimetype: string } | null;
	updateEmailResult?: unknown | null;
	deleteEmailResult?: unknown[] | null;
	movEmailResult?: boolean;
	folderResult?: unknown | null;
	folderUpdateResult?: unknown | null;
	folderDeleteResult?: boolean;
	countEmails?: number;
	searchEmails?: unknown[];
	countSearch?: number;
	checkSendRateLimit?: string | null;
}

function createMailboxStub(cfg: MailboxStubConfig = {}): MockDOStub {
	return {
		async getEmails() { return cfg.emails ?? []; },
		async countEmails() { return cfg.countEmails ?? 0; },
		async getEmail(id: unknown) {
			if (cfg.email === undefined) return { id, subject: "Test", sender: "a@b.com" };
			return cfg.email;
		},
		async updateEmail(_id: unknown, _patch: unknown) {
			return cfg.updateEmailResult !== undefined ? cfg.updateEmailResult : { id: _id, read: true };
		},
		async deleteEmail(_id: unknown) {
			return cfg.deleteEmailResult !== undefined ? cfg.deleteEmailResult : [];
		},
		async moveEmail(_id: unknown, _folder: unknown) {
			return cfg.movEmailResult !== undefined ? cfg.movEmailResult : true;
		},
		async getFolders() { return cfg.folders ?? [{ id: "inbox", name: "Inbox" }]; },
		async createFolder(id: unknown, name: unknown) {
			return cfg.folderResult !== undefined ? cfg.folderResult : { id, name };
		},
		async updateFolder(_id: unknown, _name: unknown) {
			return cfg.folderUpdateResult !== undefined ? cfg.folderUpdateResult : { id: _id, name: _name };
		},
		async deleteFolder(_id: unknown) {
			return cfg.folderDeleteResult !== undefined ? cfg.folderDeleteResult : true;
		},
		async getThreadEmails(_threadId: unknown) { return cfg.threadEmails ?? []; },
		async markThreadRead() {},
		async createEmail() {},
		async getAttachment(id: unknown) {
			if (cfg.attachment === undefined) return { id, filename: "test.pdf", mimetype: "application/pdf" };
			return cfg.attachment;
		},
		async searchEmails() { return cfg.searchEmails ?? []; },
		async countSearchResults() { return cfg.countSearch ?? 0; },
		async checkSendRateLimit() { return cfg.checkSendRateLimit ?? null; },
		async listAttachmentKeys() { return []; },
		async clearMailboxData() {},
		async getAdminMetrics() {
			return { totalEmails: 0, unreadEmails: 0, draftEmails: 0, needsReply: 0, threads: 0, attachments: 0, byDay: [] };
		},
		async findThreadBySubject() { return null; },
		async getThreadedEmails() { return []; },
		async countThreadedEmails() { return 0; },
	};
}

// ---------------------------------------------------------------------------
// Mock Admin DO stub
// ---------------------------------------------------------------------------

interface AdminStubConfig {
	clients?: unknown[];
	tasks?: unknown[];
}

function createAdminStub(cfg: AdminStubConfig = {}): MockDOStub {
	const clients = cfg.clients ?? [];
	const tasks = cfg.tasks ?? [];
	return {
		async listClients() { return clients; },
		async createClient(body: unknown, _actor: unknown) { return { id: "new-client-id", ...(body as object) }; },
		async updateClient(_id: unknown, body: unknown, _actor: unknown) {
			const existing = (clients as { id: string }[]).find((c) => c.id === _id);
			return existing ? { ...existing, ...(body as object) } : null;
		},
		async listTasks(_opts: unknown) { return tasks; },
		async createTask(body: unknown, _actor: unknown) { return { id: "new-task-id", ...(body as object) }; },
		async updateTask(_id: unknown, body: unknown, _actor: unknown) {
			const existing = (tasks as { id: string }[]).find((t) => t.id === _id);
			return existing ? { ...existing, ...(body as object) } : null;
		},
		async getReport() {
			return {
				totals: { clients: 0, tasks: 0, openTasks: 0, completedTasks: 0, completionRate: 0 },
				clients: [],
				tasks: [],
				charts: { tasksByStatus: [], tasksByClient: [], aiUsageByDay: [] },
				aiUsage: {},
			};
		},
	};
}

// ---------------------------------------------------------------------------
// Mock Env builder
// ---------------------------------------------------------------------------

function createMockDONamespace(stubFactory: () => MockDOStub): MockDONamespace {
	return {
		idFromName: (n: string) => ({ toString: () => n }),
		get: () => stubFactory(),
	};
}

interface MockEnvOptions {
	mailboxStubCfg?: MailboxStubConfig;
	adminStubCfg?: AdminStubConfig;
	r2?: MockR2;
	adminEmails?: string;
	verifiedEmail?: string;
	domains?: string;
}

function createMockEnv(opts: MockEnvOptions = {}) {
	const r2 = opts.r2 ?? createMockR2();
	return {
		BUCKET: r2,
		MAILBOX: createMockDONamespace(() => createMailboxStub(opts.mailboxStubCfg)),
		EMAIL_AGENT: createMockDONamespace(() => ({})),
		EMAIL_MCP: createMockDONamespace(() => ({})),
		ADMIN: createMockDONamespace(() => createAdminStub(opts.adminStubCfg)),
		AI: {} as unknown,
		EMAIL: { send: async () => ({ messageId: "test-msg-id" }) },
		DOMAINS: opts.domains ?? "example.com",
		EMAIL_ADDRESSES: [] as string[],
		ADMIN_EMAILS: opts.adminEmails ?? "admin@example.com",
		// This fixture represents identity already verified by upstream middleware.
		// Real signed-JWT coverage lives in integration/admin-identity.spec.ts.
		verifiedEmail: opts.verifiedEmail ?? "admin@example.com",
		POLICY_AUD: "",
		TEAM_DOMAIN: "",
	};
}

// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Build the test Hono app (mirrors workers/index.ts routes exactly)
// ---------------------------------------------------------------------------

type Env = ReturnType<typeof createMockEnv>;

type MailboxContext = {
	Bindings: Env;
	Variables: { mailboxStub: MockDOStub };
};

function slugify(text: string) {
	return text.toString().toLowerCase()
		.replace(/\s+/g, "-").replace(/[^\w-]+/g, "")
		.replace(/--+/g, "-").replace(/^-+/, "").replace(/-+$/, "");
}

function intQuery(c: { req: { query(k: string): string | undefined } }, key: string) {
	const v = c.req.query(key);
	if (!v) return undefined;
	const n = Number(v);
	return Number.isNaN(n) ? undefined : n;
}

function boolQuery(c: { req: { query(k: string): string | undefined } }, key: string) {
	const v = c.req.query(key);
	if (v === undefined || v === "") return undefined;
	return v === "true" || v === "1";
}

const CreateMailboxBody = z.object({
	email: z.string().email(),
	name: z.string().min(1),
settings: z.record(z.string(), z.any()).optional(),
});

const DraftBody = z.object({
	to: z.string().optional(),
	cc: z.string().optional(),
	bcc: z.string().optional(),
	subject: z.string().optional(),
	body: z.string(),
	in_reply_to: z.string().optional(),
	thread_id: z.string().optional(),
	draft_id: z.string().optional(),
});

const AdminClientBody = z.object({
	name: z.string().min(1),
	company: z.string().min(1),
	email: z.string().email().optional().or(z.literal("")),
	owner: z.string().optional(),
	status: z.enum(["active", "paused", "closed"]).default("active"),
	tags: z.array(z.string()).default([]),
	notes: z.string().optional(),
});

const AdminTaskBody = z.object({
	clientId: z.string().min(1),
	title: z.string().min(1),
	type: z.enum(["request", "issue", "task", "project", "draft"]).default("task"),
	status: z.enum(["new", "triaged", "assigned", "in_progress", "waiting_client", "waiting_internal", "done", "closed", "blocked"]).default("new"),
	priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
	owner: z.string().optional(),
	dueDate: z.string().optional(),
	completion: z.number().min(0).max(100).default(0),
	mailboxId: z.string().optional(),
	requestEmailId: z.string().optional(),
	issue: z.string().optional(),
	notes: z.string().optional(),
});

const RequestFromEmailBody = z.object({
	mailboxId: z.string().min(1),
	emailId: z.string().min(1),
	clientId: z.string().optional(),
	owner: z.string().optional(),
});

// Mirror listMailboxes from workers/lib/email-helpers.ts
async function listMailboxes(bucket: MockR2) {
	const list = await bucket.list({ prefix: "mailboxes/" });
	return list.objects.map((obj) => {
		const id = obj.key.replace("mailboxes/", "").replace(".json", "");
		return { id, email: id };
	});
}

function buildApp(env: Env) {
	const app = new Hono<MailboxContext>();

	// CORS
	app.use("/api/*", cors({ origin: () => undefined }));

	// requireMailbox middleware
	const requireMailbox = createMiddleware<MailboxContext>(async (c, next) => {
		const rawId = c.req.param("mailboxId");
		if (!rawId) return c.json({ error: "Mailbox ID required" }, 400);
		const mailboxId = decodeURIComponent(rawId);
		const obj = await env.BUCKET.head(`mailboxes/${mailboxId}.json`);
		if (!obj) return c.json({ error: "Not found" }, 404);
		const stub = env.MAILBOX.get();
		c.set("mailboxStub", stub as unknown as MockDOStub);
		await next();
	});

	app.use("/api/v1/mailboxes/:mailboxId/*", requireMailbox);

	// --- Config ---
	app.get("/api/v1/config", (c) => {
		const domainsRaw = env.DOMAINS || "";
		const domains = domainsRaw.split(",").map((d) => d.trim()).filter(Boolean);
		const emailAddresses = env.EMAIL_ADDRESSES ?? [];
		return c.json({ domains, emailAddresses });
	});

	// --- Admin helpers ---
	function getAdminStub() {
		return env.ADMIN.get();
	}

		function requireAdminRole(_c: unknown, roles: AdminRole[]) {
			const identity: AccessIdentity | undefined = env.verifiedEmail
				? { email: env.verifiedEmail, local: false } : undefined;
			const actor = adminActor(identity, env.ADMIN_EMAILS);
		if (!actor.email) return { error: "Admin identity is required", status: 403 as const };
		if (!roles.includes(actor.role)) return { error: "Admin role required", status: 403 as const };
			return actor;
		}

		function extractEmailDomain(address?: string) {
			const match = (address || "").toLowerCase().match(/[a-z0-9._%+-]+@([a-z0-9.-]+\.[a-z]{2,})/i);
			return match?.[1] ?? "";
		}

		function cleanTaskTitle(subject?: string) {
			return (subject || "")
				.replace(/^((re|fwd|fw|aw|wg|sv|réf):\s*)+/i, "")
				.trim() || "Email follow-up request";
		}

	// --- Admin routes ---
	app.get("/api/v1/admin/clients", async (c) => {
		const actor = requireAdminRole(c, ["admin", "manager", "operator", "viewer"]);
		if ("error" in actor) return c.json({ error: actor.error }, actor.status);
		return c.json(await getAdminStub().listClients());
	});

	app.get("/api/v1/admin/clients/:clientId", async (c) => {
		const actor = requireAdminRole(c, ["admin", "manager", "operator", "viewer"]);
		if ("error" in actor) return c.json({ error: actor.error }, actor.status);
		const clientId = c.req.param("clientId")!;
		const admin = getAdminStub();
		const clients = await admin.listClients() as { id: string }[];
		const client = clients.find((item) => item.id === clientId);
		if (!client) return c.json({ error: "Client not found" }, 404);
		const tasks = await admin.listTasks({ clientId });
		const isDone = (status: string) => status === "done" || status === "closed";
		return c.json({
			client, tasks, audits: [], relatedEmails: [],
			stats: {
				totalTasks: (tasks as unknown[]).length,
				completedTasks: (tasks as { status: string }[]).filter((t) => isDone(t.status)).length,
				openTasks: (tasks as { status: string }[]).filter((t) => !isDone(t.status)).length,
				overdueTasks: 0,
			},
		});
	});

	app.post("/api/v1/admin/clients", async (c) => {
		const actor = requireAdminRole(c, ["admin", "manager"]);
		if ("error" in actor) return c.json({ error: actor.error }, actor.status);
		const body = AdminClientBody.parse(await c.req.json());
		return c.json(await getAdminStub().createClient(body, actor), 201);
	});

	app.put("/api/v1/admin/clients/:clientId", async (c) => {
		const actor = requireAdminRole(c, ["admin", "manager"]);
		if ("error" in actor) return c.json({ error: actor.error }, actor.status);
		const body = AdminClientBody.parse(await c.req.json());
		const client = await getAdminStub().updateClient(c.req.param("clientId")!, body, actor);
		return client ? c.json(client) : c.json({ error: "Client not found" }, 404);
	});

	app.get("/api/v1/admin/tasks", async (c) => {
		const actor = requireAdminRole(c, ["admin", "manager", "operator", "viewer"]);
		if ("error" in actor) return c.json({ error: actor.error }, actor.status);
		return c.json(await getAdminStub().listTasks({
			status: c.req.query("status"),
			clientId: c.req.query("clientId"),
		}));
	});

	app.post("/api/v1/admin/tasks", async (c) => {
		const actor = requireAdminRole(c, ["admin", "manager", "operator"]);
		if ("error" in actor) return c.json({ error: actor.error }, actor.status);
		const body = AdminTaskBody.parse(await c.req.json());
		try {
			return c.json(await getAdminStub().createTask(body, actor), 201);
		} catch (e) {
			return c.json({ error: (e as Error).message }, 400);
		}
	});

		app.get("/api/v1/admin/action-queue", async (c) => {
			const actor = requireAdminRole(c, ["admin", "manager", "operator", "viewer"]);
			if ("error" in actor) return c.json({ error: actor.error }, actor.status);
		const tasks = await getAdminStub().listTasks({}) as { dueDate?: string; status: string; owner?: string }[];
		const today = new Date().toISOString().slice(0, 10);
		const isOpen = (status: string) => status !== "done" && status !== "closed";
		return c.json({
			overdue: tasks.filter((t) => t.dueDate && t.dueDate.slice(0, 10) < today && isOpen(t.status)).slice(0, 20),
			unassigned: tasks.filter((t) => !t.owner?.trim() && isOpen(t.status)).slice(0, 20),
			blocked: tasks.filter((t) => t.status === "blocked").slice(0, 20),
			waitingClient: tasks.filter((t) => t.status === "waiting_client").slice(0, 20),
			draftReview: [],
				needsReply: [],
			});
		});

		app.post("/api/v1/admin/requests/from-email", async (c) => {
			const actor = requireAdminRole(c, ["admin", "manager", "operator"]);
			if ("error" in actor) return c.json({ error: actor.error }, actor.status);
			const body = RequestFromEmailBody.parse(await c.req.json());
			const mailboxId = body.mailboxId.toLowerCase();
			if (!(await env.BUCKET.head(`mailboxes/${mailboxId}.json`))) {
				return c.json({ error: "Mailbox not found" }, 404);
			}

			const email = await env.MAILBOX.get().getEmail(body.emailId) as {
				id: string;
				subject?: string;
				sender?: string;
				date?: string;
				body?: string;
				snippet?: string;
				read?: boolean;
			} | null;
			if (!email) return c.json({ error: "Email not found" }, 404);

			const admin = getAdminStub();
			const existing = (await admin.listTasks({}) as Array<{ mailboxId?: string; requestEmailId?: string }>)
				.find((task) => task.mailboxId === mailboxId && task.requestEmailId === email.id);
			if (existing) return c.json(existing);

			const clients = await admin.listClients() as Array<{ id: string; email?: string; owner?: string }>;
			const senderDomain = extractEmailDomain(email.sender);
			const client = body.clientId
				? clients.find((item) => item.id === body.clientId)
				: clients.find((item) => extractEmailDomain(item.email) === senderDomain) ||
					await admin.createClient({
						name: senderDomain || "Inbox",
						company: senderDomain || "Inbox",
						email: email.sender || "",
						owner: body.owner || actor.email,
						status: "active",
						tags: ["auto-created", "email-request"],
					}, actor) as { id: string; owner?: string };
			if (!client) return c.json({ error: "Client not found" }, 400);

			return c.json(await admin.createTask({
				clientId: client.id,
				title: cleanTaskTitle(email.subject),
				type: "request",
				status: email.read ? "triaged" : "new",
				priority: email.read ? "normal" : "high",
				owner: body.owner || client.owner || actor.email,
				completion: email.read ? 10 : 0,
				mailboxId,
				requestEmailId: email.id,
				issue: email.snippet || email.body || cleanTaskTitle(email.subject),
				notes: `Created from email ${email.id}.`,
			}, actor), 201);
		});

		// --- Mailbox CRUD ---
	app.get("/api/v1/mailboxes", async (c) => {
		const allMailboxes = await listMailboxes(env.BUCKET);
		return c.json(allMailboxes.map((m) => ({ ...m, name: m.id })));
	});

	app.post("/api/v1/mailboxes", async (c) => {
		const { name, settings, email: rawEmail } = CreateMailboxBody.parse(await c.req.json());
		const email = rawEmail.toLowerCase();
		const allowedAddresses = (env.EMAIL_ADDRESSES ?? []) as string[];
		if (allowedAddresses.length > 0 && !allowedAddresses.map((a) => a.toLowerCase()).includes(email)) {
			return c.json({ error: "Mailbox creation is restricted to configured EMAIL_ADDRESSES" }, 403);
		}
		const key = `mailboxes/${email}.json`;
		if (await env.BUCKET.head(key)) return c.json({ error: "Mailbox already exists" }, 409);
		const defaultSettings = { fromName: name };
		const finalSettings = { ...defaultSettings, ...settings };
		await env.BUCKET.put(key, JSON.stringify(finalSettings));
		// init folders (stub call)
		env.MAILBOX.get().getFolders();
		return c.json({ id: email, email, name, settings: finalSettings }, 201);
	});

	app.get("/api/v1/mailboxes/:mailboxId", async (c) => {
		const mailboxId = c.req.param("mailboxId")!;
		const obj = await env.BUCKET.get(`mailboxes/${mailboxId}.json`);
		if (!obj) return c.json({ error: "Not found" }, 404);
		return c.json({ id: mailboxId, name: mailboxId, email: mailboxId, settings: await obj.json() });
	});

	app.put("/api/v1/mailboxes/:mailboxId", async (c) => {
		const mailboxId = c.req.param("mailboxId")!;
		const { settings } = (await c.req.json()) as { settings: Record<string, unknown> };
		const key = `mailboxes/${mailboxId}.json`;
		if (!(await env.BUCKET.head(key))) return c.json({ error: "Not found" }, 404);
		await env.BUCKET.put(key, JSON.stringify(settings));
		return c.json({ id: mailboxId, name: mailboxId, email: mailboxId, settings });
	});

	app.delete("/api/v1/mailboxes/:mailboxId", async (c) => {
		const mailboxId = c.req.param("mailboxId")!;
		const key = `mailboxes/${mailboxId}.json`;
		if (!(await env.BUCKET.head(key))) return c.json({ error: "Not found" }, 404);
		const stub = env.MAILBOX.get();
		await stub.listAttachmentKeys();
		await stub.clearMailboxData();
		await env.BUCKET.delete(key);
		return c.body(null, 204);
	});

	// --- Email routes ---
	app.get("/api/v1/mailboxes/:mailboxId/emails", async (c) => {
		const folder = c.req.query("folder");
		const thread_id = c.req.query("thread_id");
		const threaded = boolQuery(c, "threaded");
		const page = intQuery(c, "page");
		const limit = intQuery(c, "limit");
		const sortColumn = c.req.query("sortColumn");
		const sortDirection = c.req.query("sortDirection") as "ASC" | "DESC" | undefined;
		const stub = c.get("mailboxStub") as MockDOStub;

		if (threaded && folder) {
			const emails = await stub.getThreadedEmails({ folder, page, limit });
			const totalCount = await stub.countThreadedEmails(folder);
			return c.json({ emails, totalCount });
		}
		const emails = await stub.getEmails({ folder, thread_id, page, limit, sortColumn, sortDirection });
		if (folder) {
			const totalCount = await stub.countEmails({ folder, thread_id });
			return c.json({ emails, totalCount });
		}
		return c.json(emails);
	});

	app.post("/api/v1/mailboxes/:mailboxId/drafts", async (c) => {
		const mailboxId = c.req.param("mailboxId")!;
		const { to, cc, bcc, subject, body, in_reply_to, thread_id, draft_id } = DraftBody.parse(await c.req.json());
		const stub = c.get("mailboxStub") as MockDOStub;
		const messageId = crypto.randomUUID();
		const now = new Date().toISOString();
		await stub.createEmail("draft", {
			id: messageId, subject: subject || "", sender: mailboxId.toLowerCase(),
			recipient: (to || "").toLowerCase(), cc: cc?.toLowerCase() || null, bcc: bcc?.toLowerCase() || null,
			date: now, body, in_reply_to: in_reply_to || null, email_references: null,
			thread_id: thread_id || in_reply_to || messageId,
		}, []);
		if (draft_id) {
			await stub.deleteEmail(draft_id);
		}
		return c.json({ id: messageId, status: "draft", subject: subject || "", recipient: to || "", date: now }, 201);
	});

	app.get("/api/v1/mailboxes/:mailboxId/emails/:id", async (c) => {
		const stub = c.get("mailboxStub") as MockDOStub;
		const email = await stub.getEmail(c.req.param("id")!);
		if (!email) return c.json({ error: "Email not found" }, 404);
		return new Response(JSON.stringify(email), {
			headers: { "Content-Type": "application/json" },
		});
	});

	app.put("/api/v1/mailboxes/:mailboxId/emails/:id", async (c) => {
		const { read, starred } = (await c.req.json()) as { read?: boolean; starred?: boolean };
		const stub = c.get("mailboxStub") as MockDOStub;
		const email = await stub.updateEmail(c.req.param("id")!, { read, starred });
		return email ? c.json(email) : c.json({ error: "Email not found" }, 404);
	});

	app.delete("/api/v1/mailboxes/:mailboxId/emails/:id", async (c) => {
		const id = c.req.param("id")!;
		const stub = c.get("mailboxStub") as MockDOStub;
		const attachments = await stub.deleteEmail(id);
		if (attachments === null) return c.json({ error: "Not found" }, 404);
		return c.body(null, 204);
	});

	app.post("/api/v1/mailboxes/:mailboxId/emails/:id/move", async (c) => {
		const { folderId } = (await c.req.json()) as { folderId: string };
		const stub = c.get("mailboxStub") as MockDOStub;
		const success = await stub.moveEmail(c.req.param("id")!, folderId);
		return success ? c.json({ status: "moved" }) : c.json({ error: "Folder not found" }, 400);
	});

	// --- Threads ---
	app.get("/api/v1/mailboxes/:mailboxId/threads/:threadId", async (c) => {
		const stub = c.get("mailboxStub") as MockDOStub;
		return c.json(await stub.getThreadEmails(c.req.param("threadId")!));
	});

	app.post("/api/v1/mailboxes/:mailboxId/threads/:threadId/read", async (c) => {
		const stub = c.get("mailboxStub") as MockDOStub;
		await stub.markThreadRead(c.req.param("threadId")!);
		return c.json({ status: "marked_read" });
	});

	// --- Folders ---
	app.get("/api/v1/mailboxes/:mailboxId/folders", async (c) => {
		const stub = c.get("mailboxStub") as MockDOStub;
		return c.json(await stub.getFolders());
	});

	app.post("/api/v1/mailboxes/:mailboxId/folders", async (c) => {
		const { name } = (await c.req.json()) as { name: string };
		const slug = slugify(name);
		if (!slug) return c.json({ error: "Folder name must contain alphanumeric characters" }, 400);
		const stub = c.get("mailboxStub") as MockDOStub;
		const f = await stub.createFolder(slug, name);
		return f ? c.json(f, 201) : c.json({ error: "Folder with this name already exists" }, 409);
	});

	app.put("/api/v1/mailboxes/:mailboxId/folders/:id", async (c) => {
		const { name } = (await c.req.json()) as { name: string };
		const stub = c.get("mailboxStub") as MockDOStub;
		const f = await stub.updateFolder(c.req.param("id")!, name);
		return f ? c.json(f) : c.json({ error: "Folder not found" }, 404);
	});

	app.delete("/api/v1/mailboxes/:mailboxId/folders/:id", async (c) => {
		const stub = c.get("mailboxStub") as MockDOStub;
		const ok = await stub.deleteFolder(c.req.param("id")!);
		return ok ? c.body(null, 204) : c.json({ error: "Folder not found or cannot be deleted" }, 400);
	});

	// --- Search ---
	app.get("/api/v1/mailboxes/:mailboxId/search", async (c) => {
		const stub = c.get("mailboxStub") as MockDOStub;
		const searchOpts = {
			query: c.req.query("query") || "",
			folder: c.req.query("folder"),
		};
		const emails = await stub.searchEmails({ ...searchOpts, page: intQuery(c, "page"), limit: intQuery(c, "limit") });
		const totalCount = await stub.countSearchResults(searchOpts);
		return c.json({ emails, totalCount });
	});

	// --- Attachments ---
	app.get("/api/v1/mailboxes/:mailboxId/emails/:emailId/attachments/:attachmentId", async (c) => {
		const emailId = c.req.param("emailId")!;
		const attachmentId = c.req.param("attachmentId")!;
		const stub = c.get("mailboxStub") as MockDOStub;
		const attachment = await stub.getAttachment(attachmentId) as { filename: string; mimetype: string } | null;
		if (!attachment) return c.json({ error: "Attachment not found" }, 404);
		const obj = await env.BUCKET.get(`attachments/${emailId}/${attachmentId}/${attachment.filename}`);
		if (!obj) return c.json({ error: "Attachment file not found" }, 404);
		const headers = new Headers();
		headers.set("Content-Type", attachment.mimetype);
		headers.set("Content-Disposition", `attachment; filename="${attachment.filename}"`);
		return new Response(obj.body, { headers });
	});

	return app;
}

// ---------------------------------------------------------------------------
// Helper: fetch through test app
// ---------------------------------------------------------------------------

async function req(
	app: ReturnType<typeof buildApp>,
	method: string,
	path: string,
	opts: { body?: unknown; headers?: Record<string, string> } = {},
): Promise<Response> {
	const init: RequestInit = { method };
	if (opts.body !== undefined) {
		init.body = JSON.stringify(opts.body);
		init.headers = { "Content-Type": "application/json", ...opts.headers };
	} else if (opts.headers) {
		init.headers = opts.headers;
	}
	return await app.fetch(new Request(`http://localhost${path}`, init));
}

// Identity comes from the verified-email fixture, never from HTTP headers.
const adminHeaders = {};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

// 1. GET /api/v1/config
test("GET /api/v1/config returns domains array", async () => {
	const app = buildApp(createMockEnv({ domains: "example.com,test.com" }));
	const res = await req(app, "GET", "/api/v1/config");
	assert.equal(res.status, 200);
	const body = await res.json() as { domains: string[]; emailAddresses: string[] };
	assert.deepEqual(body.domains, ["example.com", "test.com"]);
	assert.ok(Array.isArray(body.emailAddresses));
});

// 2. GET /api/v1/mailboxes — empty list
test("GET /api/v1/mailboxes returns empty array when no mailboxes", async () => {
	const app = buildApp(createMockEnv());
	const res = await req(app, "GET", "/api/v1/mailboxes");
	assert.equal(res.status, 200);
	const body = await res.json();
	assert.ok(Array.isArray(body));
	assert.equal((body as unknown[]).length, 0);
});

// 3. GET /api/v1/mailboxes — with seeded mailbox
test("GET /api/v1/mailboxes returns seeded mailboxes", async () => {
	const r2 = createMockR2();
	await r2.put("mailboxes/user@example.com.json", JSON.stringify({ fromName: "User" }));
	const app = buildApp(createMockEnv({ r2 }));
	const res = await req(app, "GET", "/api/v1/mailboxes");
	assert.equal(res.status, 200);
	const body = await res.json() as { id: string }[];
	assert.equal(body.length, 1);
	assert.equal(body[0].id, "user@example.com");
});

// 4. POST /api/v1/mailboxes — creates new mailbox
test("POST /api/v1/mailboxes creates a mailbox and returns 201", async () => {
	const app = buildApp(createMockEnv());
	const res = await req(app, "POST", "/api/v1/mailboxes", {
		body: { email: "new@example.com", name: "New Mailbox" },
	});
	assert.equal(res.status, 201);
	const body = await res.json() as { id: string; email: string };
	assert.equal(body.id, "new@example.com");
	assert.equal(body.email, "new@example.com");
});

// 5. POST /api/v1/mailboxes — duplicate returns 409
test("POST /api/v1/mailboxes returns 409 when mailbox already exists", async () => {
	const r2 = createMockR2();
	await r2.put("mailboxes/exists@example.com.json", JSON.stringify({ fromName: "Exists" }));
	const app = buildApp(createMockEnv({ r2 }));
	const res = await req(app, "POST", "/api/v1/mailboxes", {
		body: { email: "exists@example.com", name: "Exists" },
	});
	assert.equal(res.status, 409);
});

// 6. GET /api/v1/mailboxes/:mailboxId — found
test("GET /api/v1/mailboxes/:mailboxId returns 200 for existing mailbox", async () => {
	const r2 = createMockR2();
	await r2.put("mailboxes/user@example.com.json", JSON.stringify({ fromName: "User" }));
	const app = buildApp(createMockEnv({ r2 }));
	const res = await req(app, "GET", "/api/v1/mailboxes/user@example.com");
	assert.equal(res.status, 200);
	const body = await res.json() as { id: string };
	assert.equal(body.id, "user@example.com");
});

// 7. GET /api/v1/mailboxes/:mailboxId — not found
test("GET /api/v1/mailboxes/:mailboxId returns 404 when missing", async () => {
	const app = buildApp(createMockEnv());
	const res = await req(app, "GET", "/api/v1/mailboxes/nobody@example.com");
	assert.equal(res.status, 404);
});

// 8. DELETE /api/v1/mailboxes/:mailboxId — success (204)
test("DELETE /api/v1/mailboxes/:mailboxId returns 204", async () => {
	const r2 = createMockR2();
	await r2.put("mailboxes/del@example.com.json", JSON.stringify({}));
	const app = buildApp(createMockEnv({ r2 }));
	const res = await req(app, "DELETE", "/api/v1/mailboxes/del@example.com");
	assert.equal(res.status, 204);
});

// 9. GET /api/v1/mailboxes/:mailboxId/emails — requireMailbox 404 when missing
test("GET /api/v1/mailboxes/:mailboxId/emails returns 404 when mailbox missing (requireMailbox guard)", async () => {
	const app = buildApp(createMockEnv());
	const res = await req(app, "GET", "/api/v1/mailboxes/ghost@example.com/emails");
	assert.equal(res.status, 404);
});

// 10. GET /api/v1/mailboxes/:mailboxId/emails — success
test("GET /api/v1/mailboxes/:mailboxId/emails returns emails array", async () => {
	const r2 = createMockR2();
	await r2.put("mailboxes/user@example.com.json", JSON.stringify({}));
	const app = buildApp(createMockEnv({
		r2,
		mailboxStubCfg: { emails: [{ id: "e1", subject: "Hello" }] },
	}));
	const res = await req(app, "GET", "/api/v1/mailboxes/user@example.com/emails");
	assert.equal(res.status, 200);
	const body = await res.json();
	assert.ok(Array.isArray(body));
});

// 11. GET /api/v1/mailboxes/:mailboxId/emails?folder=inbox — returns {emails, totalCount}
test("GET /api/v1/mailboxes/:mailboxId/emails?folder=inbox returns paged result", async () => {
	const r2 = createMockR2();
	await r2.put("mailboxes/user@example.com.json", JSON.stringify({}));
	const app = buildApp(createMockEnv({
		r2,
		mailboxStubCfg: { emails: [{ id: "e1", subject: "Hello" }], countEmails: 1 },
	}));
	const res = await req(app, "GET", "/api/v1/mailboxes/user@example.com/emails?folder=inbox");
	assert.equal(res.status, 200);
	const body = await res.json() as { emails: unknown[]; totalCount: number };
	assert.ok(Array.isArray(body.emails));
	assert.equal(typeof body.totalCount, "number");
});

// 12. GET /api/v1/mailboxes/:mailboxId/emails/:id — found
test("GET /api/v1/mailboxes/:mailboxId/emails/:id returns email", async () => {
	const r2 = createMockR2();
	await r2.put("mailboxes/user@example.com.json", JSON.stringify({}));
	const app = buildApp(createMockEnv({
		r2,
		mailboxStubCfg: { email: { id: "e1", subject: "Test Email", sender: "a@b.com" } },
	}));
	const res = await req(app, "GET", "/api/v1/mailboxes/user@example.com/emails/e1");
	assert.equal(res.status, 200);
	const body = await res.json() as { id: string };
	assert.equal(body.id, "e1");
});

// 13. GET /api/v1/mailboxes/:mailboxId/emails/:id — not found (stub returns null)
test("GET /api/v1/mailboxes/:mailboxId/emails/:id returns 404 when email missing", async () => {
	const r2 = createMockR2();
	await r2.put("mailboxes/user@example.com.json", JSON.stringify({}));
	const app = buildApp(createMockEnv({
		r2,
		mailboxStubCfg: { email: null },
	}));
	const res = await req(app, "GET", "/api/v1/mailboxes/user@example.com/emails/missing");
	assert.equal(res.status, 404);
});

// 14. PUT /api/v1/mailboxes/:mailboxId/emails/:id — update read status
test("PUT /api/v1/mailboxes/:mailboxId/emails/:id returns updated email", async () => {
	const r2 = createMockR2();
	await r2.put("mailboxes/user@example.com.json", JSON.stringify({}));
	const app = buildApp(createMockEnv({
		r2,
		mailboxStubCfg: { updateEmailResult: { id: "e1", read: true } },
	}));
	const res = await req(app, "PUT", "/api/v1/mailboxes/user@example.com/emails/e1", {
		body: { read: true },
	});
	assert.equal(res.status, 200);
	const body = await res.json() as { read: boolean };
	assert.equal(body.read, true);
});

// 15. DELETE /api/v1/mailboxes/:mailboxId/emails/:id — success (204)
test("DELETE /api/v1/mailboxes/:mailboxId/emails/:id returns 204", async () => {
	const r2 = createMockR2();
	await r2.put("mailboxes/user@example.com.json", JSON.stringify({}));
	const app = buildApp(createMockEnv({
		r2,
		mailboxStubCfg: { deleteEmailResult: [] },
	}));
	const res = await req(app, "DELETE", "/api/v1/mailboxes/user@example.com/emails/e1");
	assert.equal(res.status, 204);
});

// 16. DELETE /api/v1/mailboxes/:mailboxId/emails/:id — not found (stub returns null)
test("DELETE /api/v1/mailboxes/:mailboxId/emails/:id returns 404 when email missing", async () => {
	const r2 = createMockR2();
	await r2.put("mailboxes/user@example.com.json", JSON.stringify({}));
	const app = buildApp(createMockEnv({
		r2,
		mailboxStubCfg: { deleteEmailResult: null },
	}));
	const res = await req(app, "DELETE", "/api/v1/mailboxes/user@example.com/emails/missing");
	assert.equal(res.status, 404);
});

// 17. POST /api/v1/mailboxes/:mailboxId/emails/:id/move — success
test("POST /api/v1/mailboxes/:mailboxId/emails/:id/move returns moved status", async () => {
	const r2 = createMockR2();
	await r2.put("mailboxes/user@example.com.json", JSON.stringify({}));
	const app = buildApp(createMockEnv({ r2, mailboxStubCfg: { movEmailResult: true } }));
	const res = await req(app, "POST", "/api/v1/mailboxes/user@example.com/emails/e1/move", {
		body: { folderId: "archive" },
	});
	assert.equal(res.status, 200);
	const body = await res.json() as { status: string };
	assert.equal(body.status, "moved");
});

// 18. POST /api/v1/mailboxes/:mailboxId/drafts — creates draft (201)
test("POST /api/v1/mailboxes/:mailboxId/drafts creates draft", async () => {
	const r2 = createMockR2();
	await r2.put("mailboxes/user@example.com.json", JSON.stringify({}));
	const app = buildApp(createMockEnv({ r2 }));
	const res = await req(app, "POST", "/api/v1/mailboxes/user@example.com/drafts", {
		body: { body: "Draft content", subject: "Draft Subject" },
	});
	assert.equal(res.status, 201);
	const body = await res.json() as { status: string; subject: string };
	assert.equal(body.status, "draft");
	assert.equal(body.subject, "Draft Subject");
});

// 19. GET /api/v1/mailboxes/:mailboxId/folders
test("GET /api/v1/mailboxes/:mailboxId/folders returns folders", async () => {
	const r2 = createMockR2();
	await r2.put("mailboxes/user@example.com.json", JSON.stringify({}));
	const app = buildApp(createMockEnv({
		r2,
		mailboxStubCfg: { folders: [{ id: "inbox", name: "Inbox" }, { id: "sent", name: "Sent" }] },
	}));
	const res = await req(app, "GET", "/api/v1/mailboxes/user@example.com/folders");
	assert.equal(res.status, 200);
	const body = await res.json() as { id: string }[];
	assert.equal(body.length, 2);
	assert.equal(body[0].id, "inbox");
});

// 20. POST /api/v1/mailboxes/:mailboxId/folders
test("POST /api/v1/mailboxes/:mailboxId/folders creates folder (201)", async () => {
	const r2 = createMockR2();
	await r2.put("mailboxes/user@example.com.json", JSON.stringify({}));
	const app = buildApp(createMockEnv({
		r2,
		mailboxStubCfg: { folderResult: { id: "work", name: "Work" } },
	}));
	const res = await req(app, "POST", "/api/v1/mailboxes/user@example.com/folders", {
		body: { name: "Work" },
	});
	assert.equal(res.status, 201);
	const body = await res.json() as { id: string };
	assert.equal(body.id, "work");
});

// 21. POST /api/v1/mailboxes/:mailboxId/folders — invalid name (400)
test("POST /api/v1/mailboxes/:mailboxId/folders returns 400 for non-alphanumeric name", async () => {
	const r2 = createMockR2();
	await r2.put("mailboxes/user@example.com.json", JSON.stringify({}));
	const app = buildApp(createMockEnv({ r2 }));
	const res = await req(app, "POST", "/api/v1/mailboxes/user@example.com/folders", {
		body: { name: "---" },
	});
	assert.equal(res.status, 400);
});

// 22. GET /api/v1/mailboxes/:mailboxId/threads/:threadId
test("GET /api/v1/mailboxes/:mailboxId/threads/:threadId returns thread emails", async () => {
	const r2 = createMockR2();
	await r2.put("mailboxes/user@example.com.json", JSON.stringify({}));
	const app = buildApp(createMockEnv({
		r2,
		mailboxStubCfg: { threadEmails: [{ id: "e1" }, { id: "e2" }] },
	}));
	const res = await req(app, "GET", "/api/v1/mailboxes/user@example.com/threads/thread-123");
	assert.equal(res.status, 200);
	const body = await res.json() as unknown[];
	assert.equal(body.length, 2);
});

// 23. GET /api/v1/mailboxes/:mailboxId/search
test("GET /api/v1/mailboxes/:mailboxId/search returns search results", async () => {
	const r2 = createMockR2();
	await r2.put("mailboxes/user@example.com.json", JSON.stringify({}));
	const app = buildApp(createMockEnv({
		r2,
		mailboxStubCfg: { searchEmails: [{ id: "e1" }], countSearch: 1 },
	}));
	const res = await req(app, "GET", "/api/v1/mailboxes/user@example.com/search?query=hello");
	assert.equal(res.status, 200);
	const body = await res.json() as { emails: unknown[]; totalCount: number };
	assert.equal(body.totalCount, 1);
});

// 24. GET /api/v1/mailboxes/:mailboxId/emails/:emailId/attachments/:attachmentId — not found
test("GET .../attachments/:id returns 404 when attachment metadata missing", async () => {
	const r2 = createMockR2();
	await r2.put("mailboxes/user@example.com.json", JSON.stringify({}));
	const app = buildApp(createMockEnv({
		r2,
		mailboxStubCfg: { attachment: null },
	}));
	const res = await req(app, "GET", "/api/v1/mailboxes/user@example.com/emails/e1/attachments/att1");
	assert.equal(res.status, 404);
});

// 25. GET .../attachments/:id — R2 object missing (404)
test("GET .../attachments/:id returns 404 when R2 object missing", async () => {
	const r2 = createMockR2();
	await r2.put("mailboxes/user@example.com.json", JSON.stringify({}));
	// attachment metadata present, but no R2 object
	const app = buildApp(createMockEnv({
		r2,
		mailboxStubCfg: { attachment: { filename: "file.pdf", mimetype: "application/pdf" } },
	}));
	const res = await req(app, "GET", "/api/v1/mailboxes/user@example.com/emails/e1/attachments/att1");
	assert.equal(res.status, 404);
});

// 26. GET /api/v1/admin/clients — no verified identity → 403
test("GET /api/v1/admin/clients returns 403 when no verified identity", async () => {
const app = buildApp(createMockEnv({ adminEmails: "admin@example.com", verifiedEmail: "" }));
	const res = await req(app, "GET", "/api/v1/admin/clients");
	assert.equal(res.status, 403);
});

// 27. GET /api/v1/admin/clients — with admin auth header → 200
test("GET /api/v1/admin/clients returns clients list for admin user", async () => {
	const app = buildApp(createMockEnv({
		adminEmails: "admin@example.com",
		adminStubCfg: { clients: [{ id: "c1", name: "ACME" }] },
	}));
	const res = await req(app, "GET", "/api/v1/admin/clients", { headers: adminHeaders });
	assert.equal(res.status, 200);
	const body = await res.json() as { id: string }[];
	assert.equal(body.length, 1);
	assert.equal(body[0].id, "c1");
});

// 28. POST /api/v1/admin/clients — creates client (201)
test("POST /api/v1/admin/clients creates client for admin user", async () => {
	const app = buildApp(createMockEnv({ adminEmails: "admin@example.com" }));
	const res = await req(app, "POST", "/api/v1/admin/clients", {
		body: { name: "New Corp", company: "New Corp Ltd", status: "active", tags: [] },
		headers: adminHeaders,
	});
	assert.equal(res.status, 201);
	const body = await res.json() as { id: string };
	assert.equal(body.id, "new-client-id");
});

// 29. POST /api/v1/admin/clients — non-admin viewer cannot create (403)
test("POST /api/v1/admin/clients returns 403 for viewer role", async () => {
	// viewer = email not in ADMIN_EMAILS
const app = buildApp(createMockEnv({ adminEmails: "admin@example.com", verifiedEmail: "viewer@example.com" }));
	const res = await req(app, "POST", "/api/v1/admin/clients", {
		body: { name: "X", company: "X Ltd", status: "active", tags: [] },
headers: { "x-admin-user-email": "admin@example.com" },
	});
	assert.equal(res.status, 403);
});

// 30. GET /api/v1/admin/tasks — success
test("GET /api/v1/admin/tasks returns tasks list", async () => {
	const app = buildApp(createMockEnv({
		adminEmails: "admin@example.com",
		adminStubCfg: { tasks: [{ id: "t1", title: "Fix bug", status: "new", clientId: "c1" }] },
	}));
	const res = await req(app, "GET", "/api/v1/admin/tasks", { headers: adminHeaders });
	assert.equal(res.status, 200);
	const body = await res.json() as { id: string }[];
	assert.equal(body.length, 1);
	assert.equal(body[0].id, "t1");
});

// 31. POST /api/v1/admin/tasks — creates task (201)
test("POST /api/v1/admin/tasks creates task for admin user", async () => {
	const app = buildApp(createMockEnv({ adminEmails: "admin@example.com" }));
	const res = await req(app, "POST", "/api/v1/admin/tasks", {
		body: { clientId: "c1", title: "Deploy fix", status: "new", priority: "normal", type: "task", completion: 0 },
		headers: adminHeaders,
	});
	assert.equal(res.status, 201);
	const body = await res.json() as { id: string };
	assert.equal(body.id, "new-task-id");
});

// 32. POST /api/v1/admin/requests/from-email — creates request task from mailbox email
test("POST /api/v1/admin/requests/from-email creates request task from email", async () => {
	const r2 = createMockR2();
	await r2.put("mailboxes/user@example.com.json", JSON.stringify({}));
	const app = buildApp(createMockEnv({
		adminEmails: "admin@example.com",
		r2,
		mailboxStubCfg: {
			email: {
				id: "email-1",
				subject: "Re: Banner design request",
				sender: "pm@samsung.com",
				date: "2026-05-10T00:00:00.000Z",
				snippet: "Please update the timeline.",
				read: false,
			},
		},
		adminStubCfg: {
			clients: [{ id: "client-s", email: "owner@samsung.com", owner: "designer@example.com" }],
		},
	}));
	const res = await req(app, "POST", "/api/v1/admin/requests/from-email", {
		body: { mailboxId: "user@example.com", emailId: "email-1" },
		headers: adminHeaders,
	});
	assert.equal(res.status, 201);
	const body = await res.json() as { id: string; clientId: string; requestEmailId: string; title: string; status: string };
	assert.equal(body.id, "new-task-id");
	assert.equal(body.clientId, "client-s");
	assert.equal(body.requestEmailId, "email-1");
	assert.equal(body.title, "Banner design request");
	assert.equal(body.status, "new");
});

test("POST /api/v1/admin/requests/from-email returns existing request task for same email", async () => {
	const r2 = createMockR2();
	await r2.put("mailboxes/user@example.com.json", JSON.stringify({}));
	const app = buildApp(createMockEnv({
		adminEmails: "admin@example.com",
		r2,
		mailboxStubCfg: {
			email: {
				id: "email-1",
				subject: "Re: Banner design request",
				sender: "pm@samsung.com",
				date: "2026-05-10T00:00:00.000Z",
				read: false,
			},
		},
		adminStubCfg: {
			tasks: [{
				id: "existing-task-id",
				mailboxId: "user@example.com",
				requestEmailId: "email-1",
				title: "Existing task",
			}],
		},
	}));
	const res = await req(app, "POST", "/api/v1/admin/requests/from-email", {
		body: { mailboxId: "user@example.com", emailId: "email-1" },
		headers: adminHeaders,
	});
	assert.equal(res.status, 200);
	const body = await res.json() as { id: string; title: string };
	assert.equal(body.id, "existing-task-id");
	assert.equal(body.title, "Existing task");
});

// 33. GET /api/v1/admin/action-queue — returns queue structure
test("GET /api/v1/admin/action-queue returns queue categories", async () => {
	const app = buildApp(createMockEnv({ adminEmails: "admin@example.com" }));
	const res = await req(app, "GET", "/api/v1/admin/action-queue", { headers: adminHeaders });
	assert.equal(res.status, 200);
	const body = await res.json() as Record<string, unknown>;
	assert.ok(Array.isArray(body.overdue));
	assert.ok(Array.isArray(body.unassigned));
	assert.ok(Array.isArray(body.blocked));
	assert.ok(Array.isArray(body.waitingClient));
});

// 34. Unknown route → 404
test("unknown route returns 404", async () => {
	const app = buildApp(createMockEnv());
	const res = await req(app, "GET", "/api/v1/does-not-exist");
	assert.equal(res.status, 404);
});

// 35. PUT /api/v1/mailboxes/:mailboxId — update settings
test("PUT /api/v1/mailboxes/:mailboxId updates settings", async () => {
	const r2 = createMockR2();
	await r2.put("mailboxes/user@example.com.json", JSON.stringify({ fromName: "Old" }));
	const app = buildApp(createMockEnv({ r2 }));
	const res = await req(app, "PUT", "/api/v1/mailboxes/user@example.com", {
		body: { settings: { fromName: "Updated" } },
	});
	assert.equal(res.status, 200);
	const body = await res.json() as { settings: { fromName: string } };
	assert.equal(body.settings.fromName, "Updated");
});

// 36. POST /api/v1/mailboxes/:mailboxId/threads/:threadId/read
test("POST /api/v1/mailboxes/:mailboxId/threads/:threadId/read marks thread read", async () => {
	const r2 = createMockR2();
	await r2.put("mailboxes/user@example.com.json", JSON.stringify({}));
	const app = buildApp(createMockEnv({ r2 }));
	const res = await req(app, "POST", "/api/v1/mailboxes/user@example.com/threads/t1/read");
	assert.equal(res.status, 200);
	const body = await res.json() as { status: string };
	assert.equal(body.status, "marked_read");
});
