// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { type Context, Hono } from "hono";
import { cors } from "hono/cors";
import PostalMime from "postal-mime";
import { z } from "zod";
import { sendEmail } from "./email-sender";
import { storeAttachments, type StoredAttachment } from "./lib/attachments";
import {
	validateSender,
	SenderValidationError,
	generateMessageId,
	buildThreadingHeaders,
	listMailboxes,
} from "./lib/email-helpers";
import { SendEmailRequestSchema, type EmailFull } from "./lib/schemas";
import { handleReplyEmail, handleForwardEmail } from "./routes/reply-forward";
import { Folders } from "../shared/folders";
import type { Env } from "./types";
import { recordFeedbackEvent } from "./lib/observability/analytics.ts";
import { requireMailbox, type MailboxContext } from "./lib/mailbox";
import { registerCampaignDemoRoutes } from "./lib/campaign-demo-routes";
import { adminActor } from "./lib/access";
import type {
	AdminActor,
	AdminClient,
	AdminClientInput,
	AdminRole,
	AdminTask,
	AdminTaskInput,
} from "./admin/types";

type AppContext = Context<MailboxContext>;

// -- Request body schemas (kept for validation) ---------------------

const CreateMailboxBody = z.object({
	email: z.string().email(),
	name: z.string().min(1),
settings: z.record(z.string(), z.any()).optional(), // unvalidated — agentSystemPrompt goes straight to AI
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

// -- Helpers --------------------------------------------------------

function slugify(text: string) { // can return "" for non-alphanumeric input
	return text.toString().toLowerCase()
		.replace(/\s+/g, "-").replace(/[^\w-]+/g, "")
		.replace(/--+/g, "-").replace(/^-+/, "").replace(/-+$/, "");
}

function intQuery(c: AppContext, key: string): number | undefined {
	const v = c.req.query(key);
	if (!v) return undefined;
	const n = Number(v);
	return Number.isNaN(n) ? undefined : n;
}

function boolQuery(c: AppContext, key: string): boolean | undefined {
	const v = c.req.query(key);
	if (v === undefined || v === "") return undefined;
	return v === "true" || v === "1";
}

function getAdminStub(env: Env) {
	return env.ADMIN.get(env.ADMIN.idFromName("global"));
}

function stripHtmlToText(value?: string | null) {
	return (value || "")
		.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
		.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
		.replace(/<[^>]*>/g, " ")
		.replace(/\s+/g, " ")
		.trim();
}

function cleanTaskTitle(subject?: string | null) {
	const cleaned = (subject || "")
		.replace(/^((re|fwd|fw|aw|wg|sv|réf):\s*)+/i, "")
		.trim();
	return cleaned || "Email follow-up request";
}

function extractEmailDomain(address?: string | null) {
	const match = (address || "").toLowerCase().match(/[a-z0-9._%+-]+@([a-z0-9.-]+\.[a-z]{2,})/i);
	return match?.[1] ?? "";
}

function inferCompanyFromEmail(address?: string | null) {
	const domain = extractEmailDomain(address);
	if (!domain) return "Inbox";
	const firstLabel = domain.split(".")[0] || domain;
	return firstLabel.charAt(0).toUpperCase() + firstLabel.slice(1);
}

function findClientForEmail(clients: AdminClient[], email: EmailFull, clientId?: string) {
	if (clientId) {
		return clients.find((client) => client.id === clientId);
	}

	const senderDomain = extractEmailDomain(email.sender);
	if (senderDomain) {
		const domainMatch = clients.find((client) =>
			extractEmailDomain(client.email).toLowerCase() === senderDomain,
		);
		if (domainMatch) return domainMatch;
	}

	const subject = (email.subject || "").toLowerCase();
	return clients.find((client) => {
		const company = (client.company || "").toLowerCase();
		const name = (client.name || "").toLowerCase();
		return Boolean(
			(company && subject.includes(company)) ||
			(name && subject.includes(name)),
		);
	});
}

async function resolveClientForEmail(
	admin: ReturnType<typeof getAdminStub>,
	email: EmailFull,
	body: z.infer<typeof RequestFromEmailBody>,
	actor: AdminActor,
) {
	const clients = await admin.listClients() as AdminClient[];
	const matchedClient = findClientForEmail(clients, email, body.clientId);
	if (matchedClient) return matchedClient;
	if (body.clientId) {
		throw new Error("Client not found");
	}

	const company = inferCompanyFromEmail(email.sender);
	const input: AdminClientInput = {
		name: company,
		company,
		email: email.sender,
		owner: body.owner || actor.email,
		status: "active",
		tags: ["auto-created", "email-request"],
		notes: `Auto-created from email ${email.id} so the request can be tracked as an operational task.`,
	};
	return await admin.createClient(input, actor) as AdminClient;
}

function getAdminActor(c: AppContext): AdminActor {
	return adminActor(c.get("accessIdentity"), c.env.ADMIN_EMAILS || "");
}

function requireAdminRole(c: AppContext, roles: AdminRole[]) {
	const actor = getAdminActor(c);
	if (!actor.email) return c.json({ error: "Admin identity is required" }, 403);
	if (!roles.includes(actor.role)) return c.json({ error: "Admin role required" }, 403);
	return actor;
}

// -- App & middleware -----------------------------------------------

const app = new Hono<MailboxContext>();
app.use("/api/*", cors({
	origin: (origin) => {
		// Same-origin requests have no Origin header — allow them.
		if (!origin) return origin;
		// In development, allow localhost for Vite dev server.
		try {
			const url = new URL(origin);
			if (url.hostname === "localhost" || url.hostname === "127.0.0.1") return origin;
		} catch { /* invalid origin */ }
		// Block all other cross-origin requests. The app is served from the
		// same origin as the API, so legitimate browser requests never send
		// an Origin header. Returning undefined omits Access-Control-Allow-Origin.
		return undefined;
	},
}));
app.use("/api/v1/mailboxes/:mailboxId/*", requireMailbox);
registerCampaignDemoRoutes(app);

// -- Config ---------------------------------------------------------

app.get("/api/v1/config", (c) => {
	const domainsRaw = c.env.DOMAINS || "";
	const domains = domainsRaw.split(",").map((d) => d.trim()).filter(Boolean);
	const emailAddresses = c.env.EMAIL_ADDRESSES ?? [];
	return c.json({ domains, emailAddresses });
});

// -- Admin ----------------------------------------------------------

app.get("/api/v1/admin/overview", async (c) => {
	const actor = requireAdminRole(c, ["admin", "manager", "operator", "viewer"]);
	if (actor instanceof Response) return actor;
	const admin = getAdminStub(c.env);
	const [mailboxes, report] = await Promise.all([
		listMailboxes(c.env.BUCKET),
		admin.getReport(),
	]);

	const mailboxMetrics = await Promise.all(
		mailboxes.map(async (mailbox) => {
			const stub = c.env.MAILBOX.get(c.env.MAILBOX.idFromName(mailbox.id));
			const metrics = await (stub as any).getAdminMetrics();
			return {
				id: mailbox.id,
				email: mailbox.id,
				name: mailbox.id,
				...metrics,
			};
		}),
	);

	const emailTotals = mailboxMetrics.reduce(
		(acc, mailbox) => ({
			totalEmails: acc.totalEmails + mailbox.totalEmails,
			unreadEmails: acc.unreadEmails + mailbox.unreadEmails,
			draftEmails: acc.draftEmails + mailbox.draftEmails,
			needsReply: acc.needsReply + mailbox.needsReply,
			threads: acc.threads + mailbox.threads,
			attachments: acc.attachments + mailbox.attachments,
		}),
		{ totalEmails: 0, unreadEmails: 0, draftEmails: 0, needsReply: 0, threads: 0, attachments: 0 },
	);

	const byDay = new Map<string, number>();
	for (const mailbox of mailboxMetrics) {
		for (const point of mailbox.byDay) {
			byDay.set(point.date, (byDay.get(point.date) ?? 0) + point.count);
		}
	}

	return c.json({
		generatedAt: new Date().toISOString(),
		totals: {
			mailboxes: mailboxes.length,
			clients: report.totals.clients,
			tasks: report.totals.tasks,
			openTasks: report.totals.openTasks,
			completedTasks: report.totals.completedTasks,
			completionRate: report.totals.completionRate,
			...emailTotals,
		},
		mailboxes: mailboxMetrics,
		clients: report.clients,
		tasks: report.tasks,
		charts: {
			emailsByDay: [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, count]) => ({ date, count })),
			tasksByStatus: report.charts.tasksByStatus,
			tasksByClient: report.charts.tasksByClient,
			aiUsageByDay: report.charts.aiUsageByDay,
		},
		aiUsage: report.aiUsage,
	});
});

app.get("/api/v1/admin/clients", async (c) => {
	const actor = requireAdminRole(c, ["admin", "manager", "operator", "viewer"]);
	if (actor instanceof Response) return actor;
	return c.json(await getAdminStub(c.env).listClients());
});

app.get("/api/v1/admin/action-queue", async (c) => {
	const actor = requireAdminRole(c, ["admin", "manager", "operator", "viewer"]);
	if (actor instanceof Response) return actor;
	const today = new Date().toISOString().slice(0, 10);
	const isOpen = (status: string) => status !== "done" && status !== "closed";
	const tasks = await getAdminStub(c.env).listTasks({});

	return c.json({
		overdue: tasks
			.filter((task) => task.dueDate && task.dueDate.slice(0, 10) < today && isOpen(task.status))
			.slice(0, 20),
		unassigned: tasks
			.filter((task) => !task.owner?.trim() && isOpen(task.status))
			.slice(0, 20),
		blocked: tasks
			.filter((task) => task.status === "blocked")
			.slice(0, 20),
		waitingClient: tasks
			.filter((task) => task.status === "waiting_client")
			.slice(0, 20),
		draftReview: [],
		needsReply: [],
	});
});

app.post("/api/v1/admin/requests/from-email", async (c) => {
	const actor = requireAdminRole(c, ["admin", "manager", "operator"]);
	if (actor instanceof Response) return actor;
	const body = RequestFromEmailBody.parse(await c.req.json());
	const mailboxId = body.mailboxId.toLowerCase();
	const mailboxKey = `mailboxes/${mailboxId}.json`;
	if (!(await c.env.BUCKET.head(mailboxKey))) {
		return c.json({ error: "Mailbox not found" }, 404);
	}

	const mailboxStub = c.env.MAILBOX.get(c.env.MAILBOX.idFromName(mailboxId));
	const email = await mailboxStub.getEmail(body.emailId) as EmailFull | null;
	if (!email) return c.json({ error: "Email not found" }, 404);

	const admin = getAdminStub(c.env);
	const existingTasks = await admin.listTasks({}) as AdminTask[];
	const existingTask = existingTasks.find((task) =>
		task.mailboxId?.toLowerCase() === mailboxId &&
		task.requestEmailId === email.id,
	);
	if (existingTask) return c.json(existingTask);

	try {
		const client = await resolveClientForEmail(admin, email, body, actor);
		const emailText = stripHtmlToText(email.body) || email.snippet || "";
		const title = cleanTaskTitle(email.subject);
		const taskInput = AdminTaskBody.parse({
			clientId: client.id,
			title,
			type: "request",
			status: email.read ? "triaged" : "new",
			priority: email.read ? "normal" : "high",
			owner: body.owner || client.owner || actor.email,
			completion: email.read ? 10 : 0,
			mailboxId,
			requestEmailId: email.id,
			issue: emailText.slice(0, 500) || title,
			notes: [
				`Created from email ${email.id}.`,
				`From: ${email.sender || "unknown"}.`,
				email.date ? `Received: ${email.date}.` : "",
			].filter(Boolean).join(" "),
		}) as AdminTaskInput;
		return c.json(await admin.createTask(taskInput, actor), 201);
	} catch (e) {
		return c.json({ error: (e as Error).message }, 400);
	}
});

app.get("/api/v1/admin/clients/:clientId", async (c) => {
	const actor = requireAdminRole(c, ["admin", "manager", "operator", "viewer"]);
	if (actor instanceof Response) return actor;
	const clientId = c.req.param("clientId")!;
	const admin = getAdminStub(c.env);
	const clients = await admin.listClients();
	const client = clients.find((item) => item.id === clientId);
	if (!client) return c.json({ error: "Client not found" }, 404);
	const tasks = await admin.listTasks({ clientId });
	const today = new Date().toISOString().slice(0, 10);
	const isDone = (status: string) => status === "done" || status === "closed";

	return c.json({
		client,
		tasks,
		audits: [],
		relatedEmails: [],
		stats: {
			totalTasks: tasks.length,
			completedTasks: tasks.filter((task) => isDone(task.status)).length,
			openTasks: tasks.filter((task) => !isDone(task.status)).length,
			overdueTasks: tasks.filter((task) => task.dueDate && task.dueDate.slice(0, 10) < today && !isDone(task.status)).length,
		},
	});
});

app.post("/api/v1/admin/clients", async (c) => {
	const actor = requireAdminRole(c, ["admin", "manager"]);
	if (actor instanceof Response) return actor;
	const body = AdminClientBody.parse(await c.req.json()) as AdminClientInput;
	return c.json(await getAdminStub(c.env).createClient(body, actor), 201);
});

app.put("/api/v1/admin/clients/:clientId", async (c) => {
	const actor = requireAdminRole(c, ["admin", "manager"]);
	if (actor instanceof Response) return actor;
	const body = AdminClientBody.parse(await c.req.json()) as AdminClientInput;
	const client = await getAdminStub(c.env).updateClient(c.req.param("clientId")!, body, actor);
	return client ? c.json(client) : c.json({ error: "Client not found" }, 404);
});

app.get("/api/v1/admin/tasks", async (c) => {
	const actor = requireAdminRole(c, ["admin", "manager", "operator", "viewer"]);
	if (actor instanceof Response) return actor;
	return c.json(await getAdminStub(c.env).listTasks({
		status: c.req.query("status"),
		clientId: c.req.query("clientId"),
	}));
});

app.get("/api/v1/admin/tasks/:taskId", async (c) => {
	const actor = requireAdminRole(c, ["admin", "manager", "operator", "viewer"]);
	if (actor instanceof Response) return actor;
	const taskId = c.req.param("taskId")!;
	const admin = getAdminStub(c.env);
	const tasks = await admin.listTasks({});
	const task = tasks.find((item) => item.id === taskId);
	if (!task) return c.json({ error: "Task not found" }, 404);
	const clients = await admin.listClients();

	return c.json({
		task,
		client: clients.find((item) => item.id === task.clientId) ?? null,
		events: [],
		audits: [],
		email: null,
	});
});

app.post("/api/v1/admin/tasks", async (c) => {
	const actor = requireAdminRole(c, ["admin", "manager", "operator"]);
	if (actor instanceof Response) return actor;
	const body = AdminTaskBody.parse(await c.req.json()) as AdminTaskInput;
	try {
		return c.json(await getAdminStub(c.env).createTask(body, actor), 201);
	} catch (e) {
		return c.json({ error: (e as Error).message }, 400);
	}
});

app.get("/api/v1/admin/cost/daily", async (c) => {
	const actor = requireAdminRole(c, ["admin", "manager", "operator", "viewer"]);
	if (actor instanceof Response) return actor;
	const days = Math.min(Math.max(parseInt(c.req.query("days") ?? "30"), 1), 365);
	const admin = getAdminStub(c.env);
	const data = await admin.getDailyCostSeries(days);
	return c.json({ data, days });
});

app.get("/api/v1/admin/cost/monthly", async (c) => {
	const actor = requireAdminRole(c, ["admin", "manager", "operator", "viewer"]);
	if (actor instanceof Response) return actor;
	const months = Math.min(Math.max(parseInt(c.req.query("months") ?? "6"), 1), 24);
	const admin = getAdminStub(c.env);
	const data = await admin.getMonthlyCostSeries(months);
	return c.json({ data, months });
});

app.get("/api/v1/admin/cost/models", async (c) => {
	const actor = requireAdminRole(c, ["admin", "manager", "operator", "viewer"]);
	if (actor instanceof Response) return actor;
	const days = Math.min(Math.max(parseInt(c.req.query("days") ?? "7"), 1), 365);
	const admin = getAdminStub(c.env);
	const data = await admin.getModelUsageBreakdown(days);
	return c.json({ data, days });
});

app.put("/api/v1/admin/tasks/:taskId", async (c) => {
	const actor = requireAdminRole(c, ["admin", "manager", "operator"]);
	if (actor instanceof Response) return actor;
	const body = AdminTaskBody.parse(await c.req.json()) as AdminTaskInput;
	try {
		const task = await getAdminStub(c.env).updateTask(c.req.param("taskId")!, body, actor);
		return task ? c.json(task) : c.json({ error: "Task not found" }, 404);
	} catch (e) {
		return c.json({ error: (e as Error).message }, 400);
	}
});

// -- Mailboxes ------------------------------------------------------

app.get("/api/v1/mailboxes", async (c) => {
	const allMailboxes = await listMailboxes(c.env.BUCKET);
	return c.json(allMailboxes.map((m) => ({ ...m, name: m.id })));
});

app.post("/api/v1/mailboxes", async (c) => {
	const { name, settings, email: rawEmail } = CreateMailboxBody.parse(await c.req.json());
	const email = rawEmail.toLowerCase();
	const allowedAddresses = (c.env.EMAIL_ADDRESSES ?? []) as string[];
	if (allowedAddresses.length > 0 && !allowedAddresses.map((a) => a.toLowerCase()).includes(email)) {
		return c.json({ error: "Mailbox creation is restricted to configured EMAIL_ADDRESSES" }, 403);
	}
	const key = `mailboxes/${email}.json`;
	if (await c.env.BUCKET.head(key)) return c.json({ error: "Mailbox already exists" }, 409);
	const defaultSettings = { fromName: name, forwarding: { enabled: false, email: "" }, signature: { enabled: false, text: "" }, autoReply: { enabled: false, subject: "", message: "" } };
	const finalSettings = { ...defaultSettings, ...settings };
	await c.env.BUCKET.put(key, JSON.stringify(finalSettings));
	const stub = c.env.MAILBOX.get(c.env.MAILBOX.idFromName(email));
	await stub.getFolders();
	return c.json({ id: email, email, name, settings: finalSettings }, 201);
});

app.get("/api/v1/mailboxes/:mailboxId", async (c) => {
	const mailboxId = c.req.param("mailboxId")!;
	const obj = await c.env.BUCKET.get(`mailboxes/${mailboxId}.json`);
	if (!obj) return c.json({ error: "Not found" }, 404);
	return c.json({ id: mailboxId, name: mailboxId, email: mailboxId, settings: await obj.json() });
});

app.put("/api/v1/mailboxes/:mailboxId", async (c) => {
	const mailboxId = c.req.param("mailboxId")!;
	const { settings } = (await c.req.json()) as { settings: Record<string, unknown> };
	const key = `mailboxes/${mailboxId}.json`;
	if (!(await c.env.BUCKET.head(key))) return c.json({ error: "Not found" }, 404);
	await c.env.BUCKET.put(key, JSON.stringify(settings));
	return c.json({ id: mailboxId, name: mailboxId, email: mailboxId, settings });
});

app.delete("/api/v1/mailboxes/:mailboxId", async (c) => {
	const mailboxId = c.req.param("mailboxId")!;
	const key = `mailboxes/${mailboxId}.json`;
	if (!(await c.env.BUCKET.head(key))) return c.json({ error: "Not found" }, 404);
	const stub = c.env.MAILBOX.get(c.env.MAILBOX.idFromName(mailboxId));
	const attachmentKeys = await (stub as any).listAttachmentKeys();
	if (attachmentKeys.length > 0) await c.env.BUCKET.delete(attachmentKeys);
	await (stub as any).clearMailboxData();
	await c.env.BUCKET.delete(key);
	return c.body(null, 204);
});

// -- Emails ---------------------------------------------------------

app.get("/api/v1/mailboxes/:mailboxId/emails", async (c: AppContext) => {
	const folder = c.req.query("folder");
	const thread_id = c.req.query("thread_id");
	const threaded = boolQuery(c, "threaded");
	const page = intQuery(c, "page");
	const limit = intQuery(c, "limit");
	const sortColumn = c.req.query("sortColumn") as any;
	const sortDirection = c.req.query("sortDirection") as "ASC" | "DESC" | undefined;
	const stub = c.var.mailboxStub;

	if (threaded && folder) {
		const emails = await (stub as any).getThreadedEmails({ folder, page, limit });
		const totalCount = await (stub as any).countThreadedEmails(folder);
		return c.json({ emails, totalCount });
	}
	const emails = await stub.getEmails({ folder, thread_id, page, limit, sortColumn, sortDirection });
	if (folder) {
		const totalCount = await stub.countEmails({ folder, thread_id });
		return c.json({ emails, totalCount });
	}
	return c.json(emails);
});

app.post("/api/v1/mailboxes/:mailboxId/emails", async (c: AppContext) => {
	const mailboxId = c.req.param("mailboxId")!;
	const body = SendEmailRequestSchema.parse(await c.req.json());
	const { to, cc, bcc, from, subject, html, text, attachments, in_reply_to, references, thread_id } = body;

	let toStr: string, fromEmail: string, fromDomain: string;
	try {
		({ toStr, fromEmail, fromDomain } = validateSender(to, from, mailboxId));
	} catch (e) {
		if (e instanceof SenderValidationError) return c.json({ error: e.message }, 400);
		throw e;
	}

	const { messageId, outgoingMessageId } = generateMessageId(fromDomain);
	const stub = c.var.mailboxStub;
	const rateLimitError = await (stub as any).checkSendRateLimit();
	if (rateLimitError) return c.json({ error: rateLimitError }, 429);
	const attachmentData = await storeAttachments(c.env.BUCKET, messageId, attachments);

	await stub.createEmail(Folders.SENT, {
		id: messageId, subject, sender: fromEmail, recipient: toStr,
		cc: cc ? (Array.isArray(cc) ? cc.join(", ") : cc).toLowerCase() : null,
		bcc: bcc ? (Array.isArray(bcc) ? bcc.join(", ") : bcc).toLowerCase() : null,
		date: new Date().toISOString(), body: html || text || "",
		in_reply_to: in_reply_to || null, email_references: references ? JSON.stringify(references) : null,
		thread_id: thread_id || in_reply_to || messageId, message_id: outgoingMessageId,
		raw_headers: JSON.stringify([
			{ key: "from", value: typeof from === "string" ? from : `${from.name} <${from.email}>` },
			{ key: "to", value: Array.isArray(to) ? to.join(", ") : to },
			...(cc ? [{ key: "cc", value: Array.isArray(cc) ? cc.join(", ") : cc }] : []),
			...(bcc ? [{ key: "bcc", value: Array.isArray(bcc) ? bcc.join(", ") : bcc }] : []),
			{ key: "subject", value: subject }, { key: "date", value: new Date().toISOString() },
			{ key: "message-id", value: `<${outgoingMessageId}>` },
		]),
	}, attachmentData);

	c.executionCtx.waitUntil(
		sendEmail(c.env.EMAIL, {
			to, cc, bcc, from, subject, html, text,
			attachments: attachments?.map((att) => ({ content: att.content, filename: att.filename, type: att.type, disposition: att.disposition || "attachment", contentId: att.contentId })),
			...(in_reply_to ? { headers: buildThreadingHeaders(in_reply_to, references || []) } : {}),
		}).catch((e) => console.error("Deferred email delivery failed:", (e as Error).message)),
	);
	return c.json({ id: messageId, status: "sent" }, 202);
});

app.post("/api/v1/mailboxes/:mailboxId/drafts", async (c: AppContext) => {
	const mailboxId = c.req.param("mailboxId")!;
	const { to, cc, bcc, subject, body, in_reply_to, thread_id, draft_id } = DraftBody.parse(await c.req.json());
	const stub = c.var.mailboxStub;
	const messageId = crypto.randomUUID();
	const now = new Date().toISOString();
	await stub.createEmail(Folders.DRAFT, {
		id: messageId, subject: subject || "", sender: mailboxId.toLowerCase(),
		recipient: (to || "").toLowerCase(), cc: cc?.toLowerCase() || null, bcc: bcc?.toLowerCase() || null,
		date: now, body, in_reply_to: in_reply_to || null, email_references: null,
		thread_id: thread_id || in_reply_to || messageId,
	}, []);
	if (draft_id) {
		const attachments = await stub.deleteEmail(draft_id);
		if (attachments?.length) await c.env.BUCKET.delete(attachments.map((att: any) => `attachments/${draft_id}/${att.id}/${att.filename}`));
	}
	return c.json({ id: messageId, status: "draft", subject: subject || "", recipient: to || "", date: now }, 201);
});

app.get("/api/v1/mailboxes/:mailboxId/emails/:id", async (c: AppContext) => {
	const email = await c.var.mailboxStub.getEmail(c.req.param("id")!);
	if (!email) return c.json({ error: "Email not found" }, 404);
	return new Response(JSON.stringify(email), {
		headers: { "Content-Type": "application/json" },
	});
});

app.put("/api/v1/mailboxes/:mailboxId/emails/:id", async (c: AppContext) => {
	const { read, starred } = (await c.req.json()) as { read?: boolean; starred?: boolean };
	const email = await c.var.mailboxStub.updateEmail(c.req.param("id")!, { read, starred });
	return email ? c.json(email) : c.json({ error: "Email not found" }, 404);
});

app.delete("/api/v1/mailboxes/:mailboxId/emails/:id", async (c: AppContext) => {
	const id = c.req.param("id")!;
	const attachments = await c.var.mailboxStub.deleteEmail(id);
	if (attachments === null) return c.json({ error: "Not found" }, 404);
	if (attachments.length > 0) await c.env.BUCKET.delete(attachments.map((att: any) => `attachments/${id}/${att.id}/${att.filename}`));
	return c.body(null, 204);
});

app.post("/api/v1/mailboxes/:mailboxId/emails/:id/move", async (c: AppContext) => {
	const { folderId } = (await c.req.json()) as { folderId: string };
	const success = await c.var.mailboxStub.moveEmail(c.req.param("id")!, folderId);
	return success ? c.json({ status: "moved" }) : c.json({ error: "Folder not found" }, 400);
});

// -- Threads --------------------------------------------------------

app.get("/api/v1/mailboxes/:mailboxId/threads/:threadId", async (c: AppContext) => {
	return c.json(await (c.var.mailboxStub as any).getThreadEmails(c.req.param("threadId")!));
});

app.post("/api/v1/mailboxes/:mailboxId/threads/:threadId/read", async (c: AppContext) => {
	await c.var.mailboxStub.markThreadRead(c.req.param("threadId")!);
	return c.json({ status: "marked_read" });
});

// -- Reply / Forward ------------------------------------------------

app.post("/api/v1/mailboxes/:mailboxId/emails/:id/reply", handleReplyEmail);
app.post("/api/v1/mailboxes/:mailboxId/emails/:id/forward", handleForwardEmail);

// -- Auto-draft test endpoint (local dev only) ----------------------

app.post("/api/v1/mailboxes/:mailboxId/test-autodraft", async (c: AppContext) => {
	const mailboxId = c.req.param("mailboxId")!;
	const { emailId } = (await c.req.json()) as { emailId: string };

	try {
		const stub = c.var.mailboxStub;
		const email = (await stub.getEmail(emailId)) as EmailFull | null;
		if (!email) return c.json({ error: "Email not found" }, 404);

		const agentStub = c.env.EMAIL_AGENT.get(c.env.EMAIL_AGENT.idFromName(mailboxId));
		const result = await agentStub.fetch(new Request("https://agents/onNewEmail", {
			method: "POST", headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				mailboxId,
				emailId,
				sender: email.sender,
				subject: email.subject,
				threadId: email.thread_id || emailId,
			}),
		}));

		let agentResponse: any = null;
		try { agentResponse = await result.json(); } catch { agentResponse = await result.text(); }
		return c.json({ status: "triggered", agentStatus: result.status, agentResponse });
	} catch (e: any) {
		console.error("test-autodraft error:", e.message, e.stack);
		return c.json({ error: e.message, stack: e.stack }, 500);
	}
});

// -- AI draft reply endpoint ----------------------------------------

app.post("/api/v1/mailboxes/:mailboxId/ai/draft", async (c: AppContext) => {
	const mailboxId = c.req.param("mailboxId")!;
	const { email_id, sender, subject, thread_id } = (await c.req.json()) as {
		email_id: string;
		sender?: string;
		subject?: string;
		thread_id?: string;
	};
	if (!email_id) return c.json({ error: "email_id is required" }, 400);

	try {
		const stub = c.var.mailboxStub;
		const email = (await stub.getEmail(email_id)) as EmailFull | null;

		const agentStub = c.env.EMAIL_AGENT.get(c.env.EMAIL_AGENT.idFromName(mailboxId));
		const agentResult = await agentStub.fetch(new Request("https://agents/onNewEmail", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				mailboxId,
				emailId: email_id,
				sender: sender || email?.sender || "",
				subject: subject || email?.subject || "",
				threadId: thread_id || email?.thread_id || email_id,
			}),
		}));

		const agentResponse = await agentResult.json() as { status: string; text?: string };

		if (agentResponse.status !== "draft_generated") {
			return c.json({ error: `Draft was not generated: ${agentResponse.status}` }, 422);
		}

		// Find the newly created draft for this email (in_reply_to = email_id)
		const draftsResult = await stub.getEmails({ folder: "draft" });
		const emails: EmailFull[] = Array.isArray(draftsResult)
			? draftsResult
			: (draftsResult as any)?.emails ?? [];
		const draft = emails
			.filter((d: any) => d.in_reply_to === email_id)
			.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

		if (!draft) {
			return c.json({ error: "Draft was generated but could not be retrieved" }, 500);
		}

		const bodyText = (draft as any).body_text
			|| stripHtmlToText((draft as any).body || "");

		return c.json({
			draft_id: draft.id,
			subject: (draft as any).subject || "",
			body_text: bodyText,
		}, 201);
	} catch (e: any) {
		console.error("ai/draft error:", e.message, e.stack);
		return c.json({ error: e.message }, 500);
	}
});

// -- Folders --------------------------------------------------------

app.get("/api/v1/mailboxes/:mailboxId/folders", async (c: AppContext) => c.json(await c.var.mailboxStub.getFolders()));

app.post("/api/v1/mailboxes/:mailboxId/folders", async (c: AppContext) => {
	const { name } = (await c.req.json()) as { name: string };
	const slug = slugify(name);
	if (!slug) return c.json({ error: "Folder name must contain alphanumeric characters" }, 400);
	const f = await c.var.mailboxStub.createFolder(slug, name);
	return f ? c.json(f, 201) : c.json({ error: "Folder with this name already exists" }, 409);
});

app.put("/api/v1/mailboxes/:mailboxId/folders/:id", async (c: AppContext) => {
	const { name } = (await c.req.json()) as { name: string };
	const f = await c.var.mailboxStub.updateFolder(c.req.param("id")!, name);
	return f ? c.json(f) : c.json({ error: "Folder not found" }, 404);
});

app.delete("/api/v1/mailboxes/:mailboxId/folders/:id", async (c: AppContext) => {
	const ok = await c.var.mailboxStub.deleteFolder(c.req.param("id")!);
	return ok ? c.body(null, 204) : c.json({ error: "Folder not found or cannot be deleted" }, 400);
});

// -- Templates ------------------------------------------------------

app.get("/api/v1/mailboxes/:mailboxId/templates", async (c: AppContext) =>
	c.json(await c.var.mailboxStub.listTemplates()),
);

app.post("/api/v1/mailboxes/:mailboxId/templates", async (c: AppContext) => {
	const { name, subject, body } = (await c.req.json()) as {
		name?: string;
		subject?: string | null;
		body?: string;
	};
	if (!name?.trim() || !body?.trim()) {
		return c.json({ error: "name and body are required" }, 400);
	}
	const id = crypto.randomUUID();
	const created = await c.var.mailboxStub.createTemplate({
		id,
		name: name.trim(),
		subject: subject ?? null,
		body,
	});
	return created ? c.json(created, 201) : c.json({ error: "Failed to create template" }, 500);
});

app.put("/api/v1/mailboxes/:mailboxId/templates/:id", async (c: AppContext) => {
	const patch = (await c.req.json()) as {
		name?: string;
		subject?: string | null;
		body?: string;
	};
	const updated = await c.var.mailboxStub.updateTemplate(
		c.req.param("id")!,
		patch,
	);
	return updated ? c.json(updated) : c.json({ error: "Template not found" }, 404);
});

app.delete("/api/v1/mailboxes/:mailboxId/templates/:id", async (c: AppContext) => {
	const ok = await c.var.mailboxStub.deleteTemplate(c.req.param("id")!);
	return ok ? c.body(null, 204) : c.json({ error: "Template not found" }, 404);
});

app.post("/api/v1/mailboxes/:mailboxId/templates/:id/touch", async (c: AppContext) => {
	await c.var.mailboxStub.touchTemplate(c.req.param("id")!);
	return c.body(null, 204);
});

// -- Agent feedback -------------------------------------------------

app.post("/api/v1/mailboxes/:mailboxId/agent-feedback", async (c: AppContext) => {
	const { call_id, session_id, score, comment } = (await c.req.json()) as {
		call_id?: string;
		session_id?: string | null;
		score?: number;
		comment?: string | null;
	};
	if (!call_id || (score !== 1 && score !== -1)) {
		return c.json({ error: "call_id and score (+1 or -1) are required" }, 400);
	}
	const recorded = await c.var.mailboxStub.recordAgentFeedback({
		call_id,
		session_id: session_id ?? null,
		score,
		comment: comment ?? null,
	});
	recordFeedbackEvent(c.env, { mailboxId: c.req.param("mailboxId")!, callId: call_id, score: score as 1 | -1 });
	return recorded ? c.json(recorded, 201) : c.body(null, 204);
});

app.delete(
	"/api/v1/mailboxes/:mailboxId/agent-feedback/:callId/:score",
	async (c: AppContext) => {
		const scoreParam = Number(c.req.param("score"));
		if (scoreParam !== 1 && scoreParam !== -1) {
			return c.json({ error: "score must be +1 or -1" }, 400);
		}
		await c.var.mailboxStub.deleteAgentFeedback(c.req.param("callId")!, scoreParam);
		return c.body(null, 204);
	},
);

app.get(
	"/api/v1/mailboxes/:mailboxId/agent-feedback/summary",
	async (c: AppContext) => c.json(await c.var.mailboxStub.getAgentFeedbackSummary()),
);

// -- Routing rules --------------------------------------------------

app.get(
	"/api/v1/mailboxes/:mailboxId/routing-rules",
	async (c: AppContext) => c.json(await c.var.mailboxStub.listRoutingRules()),
);

app.post(
	"/api/v1/mailboxes/:mailboxId/routing-rules",
	async (c: AppContext) => {
		const body = (await c.req.json()) as {
			name?: string;
			priority?: number;
			enabled?: boolean;
			match?: unknown;
			action?: unknown;
		};
		if (!body.name?.trim() || !Array.isArray(body.match) || !body.action) {
			return c.json({ error: "name, match[], and action are required" }, 400);
		}
		const created = await c.var.mailboxStub.createRoutingRule({
			name: body.name.trim(),
			priority: body.priority ?? 0,
			enabled: body.enabled !== false,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			match: body.match as any,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			action: body.action as any,
		});
		return c.json(created, 201);
	},
);

app.put(
	"/api/v1/mailboxes/:mailboxId/routing-rules/:id",
	async (c: AppContext) => {
		const patch = (await c.req.json()) as Record<string, unknown>;
		const updated = await c.var.mailboxStub.updateRoutingRule(
			c.req.param("id")!,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			patch as any,
		);
		return updated ? c.json(updated) : c.json({ error: "Rule not found" }, 404);
	},
);

app.delete(
	"/api/v1/mailboxes/:mailboxId/routing-rules/:id",
	async (c: AppContext) => {
		const ok = await c.var.mailboxStub.deleteRoutingRule(c.req.param("id")!);
		return ok ? c.body(null, 204) : c.json({ error: "Rule not found" }, 404);
	},
);

// -- Customer segmentation ------------------------------------------

app.get(
	"/api/v1/mailboxes/:mailboxId/segments",
	async (c: AppContext) => c.json(await c.var.mailboxStub.getCustomerSegments()),
);

// -- SLA dashboard --------------------------------------------------

app.get(
	"/api/v1/mailboxes/:mailboxId/admin/sla",
	async (c: AppContext) => {
		const raw = c.req.query("window");
		const window = raw === "24h" || raw === "30d" ? raw : "7d";
		return c.json(await c.var.mailboxStub.getSlaMetrics(window));
	},
);

// -- Draft approval (HITL) ------------------------------------------

app.get(
	"/api/v1/mailboxes/:mailboxId/approvals",
	async (c: AppContext) => c.json(await c.var.mailboxStub.listPendingApprovals()),
);

app.post(
	"/api/v1/mailboxes/:mailboxId/drafts/:emailId/approval",
	async (c: AppContext) => {
		const body = (await c.req.json()) as {
			action?: string;
			decided_by?: string;
			comment?: string | null;
		};
		const action = body.action as "submit" | "approve" | "reject" | undefined;
		if (action !== "submit" && action !== "approve" && action !== "reject") {
			return c.json({ error: "action must be submit, approve, or reject" }, 400);
		}
		const result = await c.var.mailboxStub.transitionApproval(
			c.req.param("emailId")!,
			action,
			{ decided_by: body.decided_by, comment: body.comment ?? null },
		);
		return result
			? c.json(result)
			: c.json({ error: "Invalid state transition or draft not found" }, 409);
	},
);

// -- Search ---------------------------------------------------------

app.get("/api/v1/mailboxes/:mailboxId/search", async (c: AppContext) => {
	const searchOpts: Record<string, unknown> = {
		query: c.req.query("query") || "", folder: c.req.query("folder"), from: c.req.query("from"),
		to: c.req.query("to"), subject: c.req.query("subject"), date_start: c.req.query("date_start"),
		date_end: c.req.query("date_end"), is_read: boolQuery(c, "is_read"),
		is_starred: boolQuery(c, "is_starred"), has_attachment: boolQuery(c, "has_attachment"),
	};
	const stub = c.var.mailboxStub as any;
	const emails = await stub.searchEmails({ ...searchOpts, page: intQuery(c, "page"), limit: intQuery(c, "limit") });
	const totalCount = await stub.countSearchResults(searchOpts);
	return c.json({ emails, totalCount });
});

// -- Attachments ----------------------------------------------------

app.get("/api/v1/mailboxes/:mailboxId/emails/:emailId/attachments/:attachmentId", async (c: AppContext) => {
	const emailId = c.req.param("emailId")!;
	const attachmentId = c.req.param("attachmentId")!;
	const attachment = await c.var.mailboxStub.getAttachment(attachmentId);
	if (!attachment) return c.json({ error: "Attachment not found" }, 404);
	const obj = await c.env.BUCKET.get(`attachments/${emailId}/${attachmentId}/${attachment.filename}`);
	if (!obj) return c.json({ error: "Attachment file not found" }, 404);
	const headers = new Headers();
	headers.set("Content-Type", attachment.mimetype);
	const sanitized = attachment.filename.replace(/[\x00-\x1f"\\]/g, "_");
	headers.set("Content-Disposition", `attachment; filename="${sanitized}"; filename*=UTF-8''${encodeURIComponent(attachment.filename)}`);
	return new Response(obj.body, { headers });
});

// -- Receive inbound email ------------------------------------------

const MAX_EMAIL_SIZE = 25 * 1024 * 1024;

async function streamToArrayBuffer(stream: ReadableStream, streamSize: number) {
	if (streamSize > MAX_EMAIL_SIZE) throw new Error(`Email too large: ${streamSize} bytes exceeds ${MAX_EMAIL_SIZE} byte limit`);
	if (streamSize <= 0) throw new Error(`Invalid stream size: ${streamSize}`);
	const result = new Uint8Array(streamSize);
	let bytesRead = 0;
	const reader = stream.getReader();
	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		if (bytesRead + value.length > streamSize) { reader.cancel(); throw new Error(`Stream exceeds declared size`); }
		result.set(value, bytesRead);
		bytesRead += value.length;
	}
	return result;
}

async function receiveEmail(event: { raw: ReadableStream; rawSize: number }, env: Env, ctx: ExecutionContext) {
	const rawEmail = await streamToArrayBuffer(event.raw, event.rawSize);
	const parsedEmail = await new PostalMime().parse(rawEmail);

	if (!parsedEmail.to?.length || !parsedEmail.to[0].address) throw new Error("received email with empty to");

	const allowedAddresses = ((env.EMAIL_ADDRESSES ?? []) as string[]).map((a) => a.toLowerCase());
	const allRecipients = parsedEmail.to.map((t) => t.address?.toLowerCase()).filter(Boolean) as string[];
	const ccRecipients = (parsedEmail.cc || []).map((e) => e.address?.toLowerCase()).filter(Boolean) as string[];
	const bccRecipients = (parsedEmail.bcc || []).map((e) => e.address?.toLowerCase()).filter(Boolean) as string[];

	let mailboxId: string | undefined;
	if (allowedAddresses.length > 0) {
		mailboxId = allRecipients.find((addr) => allowedAddresses.includes(addr));
		if (!mailboxId) { console.log(`Ignoring email: no recipient matches EMAIL_ADDRESSES.`); return; }
	} else { mailboxId = allRecipients[0]; }
	if (!mailboxId) throw new Error("received email with no valid recipient address");

	const messageId = crypto.randomUUID();
	if (!(await env.BUCKET.head(`mailboxes/${mailboxId}.json`))) { console.log(`Ignoring email for ${mailboxId}: mailbox does not exist`); return; }

	const stub = env.MAILBOX.get(env.MAILBOX.idFromName(mailboxId));

	const attachmentData: StoredAttachment[] = [];
	if (parsedEmail.attachments) {
		for (const att of parsedEmail.attachments) {
			const attId = crypto.randomUUID();
			const filename = (att.filename || "untitled").replace(/[\/\\:*?"<>|\x00-\x1f]/g, "_");
			await env.BUCKET.put(`attachments/${messageId}/${attId}/${filename}`, att.content);
			attachmentData.push({ id: attId, email_id: messageId, filename, mimetype: att.mimeType,
				size: typeof att.content === "string" ? att.content.length : att.content.byteLength,
				content_id: att.contentId || null, disposition: att.disposition || "attachment" });
		}
	}

	const extractMsgId = (s: string) => { const m = s.match(/<([^>]+)>/); return m ? m[1] : s.trim().split(/\s+/)[0]; };
	const inReplyTo = parsedEmail.inReplyTo ? extractMsgId(parsedEmail.inReplyTo) : null;
	const emailReferences = parsedEmail.references ? parsedEmail.references.split(/\s+/).filter(Boolean).map(extractMsgId) : [];
	let threadId = emailReferences[0] || inReplyTo || messageId;

	if (!inReplyTo && emailReferences.length === 0) {
		const subjectThread = await (stub as any).findThreadBySubject(parsedEmail.subject || "", parsedEmail.from?.address || undefined);
		if (subjectThread) threadId = subjectThread;
	}

	const originalMessageId = parsedEmail.messageId ? extractMsgId(parsedEmail.messageId) : null;

	await stub.createEmail(Folders.INBOX, {
		id: messageId, subject: parsedEmail.subject || "",
		sender: (parsedEmail.from?.address || "").toLowerCase(), recipient: allRecipients.join(", "),
		cc: ccRecipients.join(", ") || null, bcc: bccRecipients.join(", ") || null,
		date: new Date().toISOString(), // uses receive time, not the email's Date header
		body: parsedEmail.html || parsedEmail.text || "",
		in_reply_to: inReplyTo, email_references: emailReferences.length > 0 ? JSON.stringify(emailReferences) : null,
		thread_id: threadId, message_id: originalMessageId, raw_headers: JSON.stringify(parsedEmail.headers),
	}, attachmentData);

	const agentStub = env.EMAIL_AGENT.get(env.EMAIL_AGENT.idFromName(mailboxId));
	ctx.waitUntil(agentStub.fetch(new Request("https://agents/onNewEmail", {
		method: "POST", headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ mailboxId, emailId: messageId, sender: (parsedEmail.from?.address || "").toLowerCase(), subject: parsedEmail.subject || "", threadId }),
	})).catch((e) => console.error("Auto-draft trigger failed:", (e as Error).message)));
}

export { app, receiveEmail };
