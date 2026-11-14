// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { DurableObject } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/durable-sqlite";
import { eq, and, or, asc, desc, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import * as schema from "../db/schema";
import { Folders } from "../../shared/folders";
import {
DEMO_CAMPAIGNS, demoEmailHtml, escapeHtml, stableDemoId, findDemo,
buildWorkspace, validateRequirements, validateReply, makeCampaign, normalizedOverrides,
} from "../../shared/campaign-demo.js";
import type { WorkspaceStore } from "../../shared/campaign-demo.js";
import type { Env } from "../types";
import { applyMigrations, mailboxMigrations } from "./migrations";
import {
	evaluateRules,
	type RoutableEmail,
	type RoutingRule,
	type RuleAction,
	type RuleMatch,
} from "../lib/routing-rules";
import {
	nextApprovalState,
	type ApprovalAction,
	type ApprovalMeta,
	type ApprovalState,
} from "../lib/approval";
import {
	classify,
	type SenderStats,
	type CustomerSegmentResult,
} from "../lib/segmentation";
import {
	computeSlaMetrics,
	type SlaWindow,
	type SlaMetrics,
} from "../lib/sla";

/**
 * SQL expression to normalize email subjects by stripping common
 * reply/forward prefixes (Re:, Fwd:, FW:, AW:, WG:, Réf:, SV:).
 * Used for conversation grouping. Hardcoded to the `subject` column.
 */
const NORMALIZED_SUBJECT_SQL = `LOWER(TRIM(
	REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
		LOWER(subject),
		'aw: ', ''), 'wg: ', ''), 'réf: ', ''), 'sv: ', ''),
		're: ', ''), 'fwd: ', ''), 'fw: ', '')
))`;

const ALLOWED_SORT_COLUMNS = [
	"id",
	"subject",
	"sender",
	"recipient",
	"date",
	"read",
	"starred",
] as const;

type SortColumn = (typeof ALLOWED_SORT_COLUMNS)[number];

/**
 * Map SortColumn string names to Drizzle column references for safe
 * ORDER BY construction (no string interpolation into SQL).
 */
const SORT_COLUMN_MAP = {
	id: schema.emails.id,
	subject: schema.emails.subject,
	sender: schema.emails.sender,
	recipient: schema.emails.recipient,
	date: schema.emails.date,
	read: schema.emails.read,
	starred: schema.emails.starred,
} satisfies Record<SortColumn, typeof schema.emails[keyof typeof schema.emails]>;

interface SearchFilterOptions {
	query: string;
	folder?: string;
	from?: string;
	to?: string;
	subject?: string;
	date_start?: string;
	date_end?: string;
	is_read?: boolean;
	is_starred?: boolean;
	has_attachment?: boolean;
}

interface GetEmailsOptions {
	folder?: string;
	thread_id?: string;
	page?: number;
	limit?: number;
	sortColumn?: SortColumn;
	sortDirection?: "ASC" | "DESC";
}

interface EmailData {
	id: string;
	subject: string;
	sender: string;
	recipient: string;
	cc?: string | null;
	bcc?: string | null;
	date: string;
	body: string;
	read?: boolean;
	starred?: boolean;
	in_reply_to?: string | null;
	email_references?: string | null;
	thread_id?: string | null;
	message_id?: string | null;
	raw_headers?: string | null;
	citations_json?: string | null;
}

interface AttachmentData {
	id: string;
	email_id: string;
	filename: string;
	mimetype: string;
	size: number;
	content_id?: string | null;
	disposition?: string | null;
}

export class MailboxDO extends DurableObject<Env> {
	declare __DURABLE_OBJECT_BRAND: never;
	db: ReturnType<typeof drizzle>;

	constructor(state: DurableObjectState, env: Env) {
		super(state, env);
		this.db = drizzle(this.ctx.storage, { schema });
		applyMigrations(this.ctx.storage.sql, mailboxMigrations, this.ctx.storage);
	}

	// ── Email CRUD (Drizzle) ───────────────────────────────────────

async seedDemoCampaigns(mailboxEmail: string, refreshContent = false) {
const inbox = this.db.select().from(schema.folders).where(eq(schema.folders.id, Folders.INBOX)).get();
if (!inbox) throw new Error("Inbox folder not found");
let created = 0;
let refreshed = 0;
for (const [index, fixture] of DEMO_CAMPAIGNS.entries()) {
const id = await stableDemoId(mailboxEmail.toLowerCase(), fixture.key);
const existing = this.db.select().from(schema.emails).where(eq(schema.emails.id, id)).get();
if (existing) {
if (refreshContent && findDemo(existing)) {
this.db.update(schema.emails).set({
body: demoEmailHtml(fixture),
}).where(eq(schema.emails.id, id)).run();
refreshed++;
}
continue;
}
this.db.insert(schema.emails).values({
id, folder_id: Folders.INBOX, subject: fixture.subject, sender: fixture.sender,
recipient: mailboxEmail.toLowerCase(), date: new Date(Date.now() - index * 30 * 60000).toISOString(),
body: demoEmailHtml(fixture),
thread_id: id, message_id: `<${id}@campaign-demo.invalid>`, read: 0, starred: 0,
}).run();
created++;
}
return { created, total: DEMO_CAMPAIGNS.length, ...(refreshContent ? { refreshed } : {}) };
}

async getDemoCampaignWorkspace(emailId: string) {
const email = await this.getEmail(emailId);
if (!email) return { ok: false as const, status: 404 as const, error: "메일을 찾을 수 없습니다." };
if (!findDemo(email)) return { ok: false as const, status: 422 as const, error: "이 기능은 가상 캠페인 메일용 데모입니다. 실제 메일 AI 분석은 별도로 연결해야 합니다." };
const state = await this.ctx.storage.get<WorkspaceStore>(`campaign-demo:${emailId}`);
return { ok: true as const, workspace: buildWorkspace(email, state || {}) };
}

async mutateDemoCampaignWorkspace(
emailId: string, mailboxEmail: string, operation: "requirements" | "reply" | "campaign",
input: { requirements?: unknown; title?: string; notes?: string; subject?: string; body?: string },
) {
const email = await this.getEmail(emailId);
if (!email) return { ok: false as const, status: 404 as const, error: "메일을 찾을 수 없습니다." };
const fixture = findDemo(email);
if (!fixture) return { ok: false as const, status: 422 as const, error: "이 기능은 가상 캠페인 메일용 데모입니다. 실제 메일 AI 분석은 별도로 연결해야 합니다." };
let values: Record<string, string> = {};
let reply: { subject: string; body: string } | undefined;
try {
if (operation === "reply") reply = validateReply(input);
else values = validateRequirements(input?.requirements);
} catch (error) {
return { ok: false as const, status: 400 as const, error: (error as Error).message };
}
const draftId = await stableDemoId(mailboxEmail.toLowerCase(), `${emailId}:${operation}`);
return this.ctx.storage.transaction(async (storage) => {
const key = `campaign-demo:${emailId}`;
const state = await storage.get<WorkspaceStore>(key) || {};
if (operation !== "reply") {
try { state.requirements = normalizedOverrides(fixture, values); }
catch (error) {
return { ok: false as const, status: 400 as const, error: (error as Error).message };
}
}
if (operation === "campaign") {
try {
state.campaign = makeCampaign(buildWorkspace(email, state), { title: input.title!, notes: input.notes }, state.campaign, draftId);
} catch (error) {
return { ok: false as const, status: 400 as const, error: (error as Error).message };
}
}
if (reply) {
const previous = this.db.select().from(schema.emails).where(eq(schema.emails.id, draftId)).get();
if (previous && (previous.folder_id !== Folders.DRAFT || previous.in_reply_to !== emailId)) {
return { ok: false as const, status: 400 as const, error: "기존 메일을 덮어쓸 수 없습니다." };
}
const body = `<div style="white-space:pre-wrap">${escapeHtml(reply.body)}</div>`;
this.db.insert(schema.emails).values({
id: draftId, folder_id: Folders.DRAFT, subject: reply.subject, sender: mailboxEmail.toLowerCase(),
recipient: email.sender, date: new Date().toISOString(), body, in_reply_to: email.id,
thread_id: email.thread_id || email.id, read: 1, starred: 0,
}).onConflictDoUpdate({
target: schema.emails.id, set: { subject: reply.subject, body },
}).run();
state.reply = reply;
state.replyDraftId = draftId;
}
state.updatedAt = new Date().toISOString();
await storage.put(key, state);
return { ok: true as const, workspace: buildWorkspace(email, state) };
});
}

	async getEmails(options: GetEmailsOptions = {}) {
		const {
			folder,
			thread_id,
			page = 1,
			limit: rawLimit = 25,
			sortColumn: rawSortColumn = "date",
			sortDirection = "DESC",
		} = options;

		// Cap pagination limit to prevent unbounded queries
		const limit = Math.min(Math.max(rawLimit, 1), 100);

		const sortColumn: SortColumn = ALLOWED_SORT_COLUMNS.includes(
			rawSortColumn as SortColumn,
		)
			? rawSortColumn
			: "date";

		const offset = (page - 1) * limit;

		const conditions: SQL[] = [];
		if (folder) {
			conditions.push(
				sql`${schema.emails.folder_id} = (SELECT id FROM folders WHERE name = ${folder} OR id = ${folder} LIMIT 1)`,
			);
		}
		if (thread_id) {
			conditions.push(eq(schema.emails.thread_id, thread_id));
		}

		const orderCol = SORT_COLUMN_MAP[sortColumn];
		const orderDir = sortDirection === "ASC" ? asc(orderCol) : desc(orderCol);

		const result = this.db
			.select({
				id: schema.emails.id,
				subject: schema.emails.subject,
				sender: schema.emails.sender,
				recipient: schema.emails.recipient,
				cc: schema.emails.cc,
				bcc: schema.emails.bcc,
				date: schema.emails.date,
				read: schema.emails.read,
				starred: schema.emails.starred,
				in_reply_to: schema.emails.in_reply_to,
				email_references: schema.emails.email_references,
				thread_id: schema.emails.thread_id,
				folder_id: schema.emails.folder_id,
				snippet: sql<string>`SUBSTR(${schema.emails.body}, 1, 300)`,
			})
			.from(schema.emails)
			.where(conditions.length > 0 ? and(...conditions) : undefined)
			.orderBy(orderDir)
			.limit(limit)
			.offset(offset)
			.all();

		return result.map((email) => ({
			...email,
			read: !!email.read,
			starred: !!email.starred,
		}));
	}

	/**
	 * Count total emails matching the given filters (for pagination).
	 */
	async countEmails(options: { folder?: string; thread_id?: string } = {}) {
		const { folder, thread_id } = options;
		const conditions: string[] = [];
		const params: (string | number)[] = [];

		if (folder) {
			conditions.push(
				"folder_id = (SELECT id FROM folders WHERE name = ?1 OR id = ?1 LIMIT 1)",
			);
			params.push(folder);
		}

		if (thread_id) {
			conditions.push(`thread_id = ?${params.length + 1}`);
			params.push(thread_id);
		}

		const where =
			conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
		const row = [
			...this.ctx.storage.sql.exec(
				`SELECT COUNT(*) as total FROM emails ${where}`,
				...params,
			),
		][0] as { total: number } | undefined;

		return row?.total ?? 0;
	}

	// ── Threaded queries (raw SQL — too complex for Drizzle's builder) ──

	async getThreadedEmails(options: GetEmailsOptions = {}) {
		const {
			folder,
			page = 1,
			limit: rawLimit = 25,
		} = options;
		const limit = Math.min(Math.max(rawLimit, 1), 100);

		if (!folder) {
			// Fallback to regular getEmails if no folder specified
			return this.getEmails(options);
		}

		const offset = (page - 1) * limit;

		// Thread grouping strategy:
		// For DRAFT folder: group by in_reply_to (the email being replied to).
		//   This ensures reply-drafts to different emails stay separate, even if
		//   they share a thread_id or subject. New drafts (no in_reply_to) each
		//   get their own group via their unique id.
		// For other folders:
		//   1. Primary: group by thread_id (from email threading headers)
		//   2. Fallback: group by normalized subject (strips Re:/Fwd:/FW: prefixes)
		//      for legacy emails that lack threading headers (thread_id IS NULL).
		const isDraftFolder = folder === Folders.DRAFT;

		if (isDraftFolder) {
			const result = this.ctx.storage.sql.exec(
				`WITH
				folder_emails AS (
					SELECT *,
						COALESCE(in_reply_to, id) as draft_group_key
					FROM emails
					WHERE folder_id = (SELECT id FROM folders WHERE name = ?1 OR id = ?1 LIMIT 1)
				),
				draft_stats AS (
					SELECT
						draft_group_key,
						COUNT(*) as thread_count,
						SUM(CASE WHEN read = 0 THEN 1 ELSE 0 END) as thread_unread_count,
						GROUP_CONCAT(DISTINCT sender) as participants
					FROM folder_emails
					GROUP BY draft_group_key
				),
				latest_per_group AS (
					SELECT
						fe.*,
						ROW_NUMBER() OVER (
							PARTITION BY fe.draft_group_key
							ORDER BY fe.date DESC
						) as rn
					FROM folder_emails fe
				)
				SELECT
					lp.id, lp.subject, lp.sender, lp.recipient, lp.date,
					lp.read, lp.starred, lp.thread_id, lp.folder_id,
					lp.in_reply_to, lp.email_references,
					SUBSTR(lp.body, 1, 300) as snippet,
					ds.thread_count, ds.thread_unread_count, ds.participants
				FROM latest_per_group lp
				JOIN draft_stats ds ON lp.draft_group_key = ds.draft_group_key
				WHERE lp.rn = 1
				ORDER BY lp.date DESC
				LIMIT ?2 OFFSET ?3`,
				folder, limit, offset
			);

			const rows = [...result];
			return rows.map((row: any) => ({
				...row,
				read: !!row.read,
				starred: !!row.starred,
				thread_count: row.thread_count || 1,
				thread_unread_count: row.thread_unread_count || 0,
				participants: row.participants || row.sender,
			}));
		}

		// Non-draft folders: full threading logic
		const result = this.ctx.storage.sql.exec(
			`WITH
			folder_emails AS (
				SELECT *,
					COALESCE(thread_id, id) as raw_thread_id,
					${NORMALIZED_SUBJECT_SQL} as normalized_subject
				FROM emails
				WHERE folder_id = (SELECT id FROM folders WHERE name = ?1 OR id = ?1 LIMIT 1)
			),
			thread_to_conversation AS (
				SELECT
					raw_thread_id,
					normalized_subject,
					CASE
						WHEN thread_id IS NOT NULL THEN raw_thread_id
						ELSE MIN(raw_thread_id) OVER (PARTITION BY normalized_subject)
					END as conversation_id
				FROM folder_emails
				GROUP BY raw_thread_id, normalized_subject, thread_id
			),
			all_emails_with_conversation AS (
				SELECT
					e.*,
					COALESCE(tc.conversation_id, COALESCE(e.thread_id, e.id)) as conversation_id
				FROM emails e
				LEFT JOIN thread_to_conversation tc
					ON COALESCE(e.thread_id, e.id) = tc.raw_thread_id
			),
			conversation_stats AS (
				SELECT
					conversation_id,
					COUNT(*) as thread_count,
					SUM(CASE WHEN read = 0 THEN 1 ELSE 0 END) as thread_unread_count,
					SUM(CASE WHEN read = 1 THEN 1 ELSE 0 END) as thread_read_count,
					GROUP_CONCAT(DISTINCT sender) as participants,
					SUM(CASE WHEN folder_id = (SELECT id FROM folders WHERE name = 'draft' LIMIT 1) THEN 1 ELSE 0 END) as has_draft
				FROM all_emails_with_conversation
				WHERE conversation_id IN (
					SELECT DISTINCT conversation_id FROM all_emails_with_conversation
					WHERE folder_id = (SELECT id FROM folders WHERE name = ?1 OR id = ?1 LIMIT 1)
				)
				GROUP BY conversation_id
			),
			latest_message_per_conversation AS (
				SELECT
					conversation_id,
					folder_id,
					ROW_NUMBER() OVER (PARTITION BY conversation_id ORDER BY date DESC) as rn
				FROM all_emails_with_conversation
			),
			latest_in_folder AS (
				SELECT
					fe.*,
					COALESCE(tc.conversation_id, fe.raw_thread_id) as conversation_id,
					ROW_NUMBER() OVER (
						PARTITION BY COALESCE(tc.conversation_id, fe.raw_thread_id)
						ORDER BY fe.date DESC
					) as rn
				FROM folder_emails fe
				LEFT JOIN thread_to_conversation tc
					ON fe.raw_thread_id = tc.raw_thread_id
			)
			SELECT
				lif.id, lif.subject, lif.sender, lif.recipient, lif.date,
				lif.read, lif.starred, lif.thread_id, lif.folder_id,
				lif.in_reply_to, lif.email_references,
				SUBSTR(lif.body, 1, 300) as snippet,
				cs.thread_count, cs.thread_unread_count, cs.participants,
				CASE WHEN lmc.folder_id != (SELECT id FROM folders WHERE name = 'sent' LIMIT 1)
					AND lmc.folder_id != (SELECT id FROM folders WHERE name = 'draft' LIMIT 1)
					AND cs.thread_read_count > 0
					THEN 1 ELSE 0 END as needs_reply,
				CASE WHEN cs.has_draft > 0 THEN 1 ELSE 0 END as has_draft
			FROM latest_in_folder lif
			JOIN conversation_stats cs ON lif.conversation_id = cs.conversation_id
			LEFT JOIN latest_message_per_conversation lmc
				ON lmc.conversation_id = lif.conversation_id AND lmc.rn = 1
			WHERE lif.rn = 1
			ORDER BY lif.date DESC
			LIMIT ?2 OFFSET ?3`,
			folder, limit, offset
		);

		const rows = [...result];
		return rows.map((row: any) => ({
			...row,
			read: !!row.read,
			starred: !!row.starred,
			thread_count: row.thread_count || 1,
			thread_unread_count: row.thread_unread_count || 0,
			participants: row.participants || row.sender,
			needs_reply: !!row.needs_reply,
			has_draft: !!row.has_draft,
		}));
	}

	/**
	 * Count threaded conversations in a folder (for pagination).
	 * Returns the number of conversation groups, not individual emails.
	 */
	async countThreadedEmails(folder: string) {
		const isDraftFolder = folder === Folders.DRAFT;

		if (isDraftFolder) {
			const row = [
				...this.ctx.storage.sql.exec(
					`SELECT COUNT(DISTINCT COALESCE(in_reply_to, id)) as total
					 FROM emails
					 WHERE folder_id = (SELECT id FROM folders WHERE name = ?1 OR id = ?1 LIMIT 1)`,
					folder,
				),
			][0] as { total: number } | undefined;
			return row?.total ?? 0;
		}

		const row = [
			...this.ctx.storage.sql.exec(
				`WITH
				folder_emails AS (
					SELECT
						COALESCE(thread_id, id) as raw_thread_id,
						thread_id,
					${NORMALIZED_SUBJECT_SQL} as normalized_subject
					FROM emails
					WHERE folder_id = (SELECT id FROM folders WHERE name = ?1 OR id = ?1 LIMIT 1)
				),
				thread_to_conversation AS (
					SELECT
						raw_thread_id,
						CASE
							WHEN thread_id IS NOT NULL THEN raw_thread_id
							WHEN normalized_subject != '' THEN MIN(raw_thread_id) OVER (PARTITION BY normalized_subject)
							ELSE raw_thread_id
						END as conversation_id
					FROM folder_emails
					GROUP BY raw_thread_id, normalized_subject, thread_id
				)
				SELECT COUNT(DISTINCT conversation_id) as total
				FROM thread_to_conversation`,
				folder,
			),
		][0] as { total: number } | undefined;
		return row?.total ?? 0;
	}

	// ── Single email operations (Drizzle) ──────────────────────────

	async getEmail(id: string) {
		const email = this.db
			.select()
			.from(schema.emails)
			.where(eq(schema.emails.id, id))
			.get();

		if (!email) return null;

		const emailAttachments = this.db
			.select()
			.from(schema.attachments)
			.where(eq(schema.attachments.email_id, id))
			.all();

		return {
			...email,
			read: !!email.read,
			starred: !!email.starred,
			attachments: emailAttachments,
		};
	}

	/**
	 * Fetch all emails in a thread with full bodies and attachments in
	 * two queries (one for emails, one for attachments) instead of
	 * N+1 individual getEmail calls.
	 */
	async getThreadEmails(threadId: string) {
		const emailRows = [
			...this.ctx.storage.sql.exec(
				`SELECT * FROM emails WHERE thread_id = ?1 ORDER BY date ASC`,
				threadId,
			),
		] as any[];

		if (emailRows.length === 0) return [];

		const emailIds = emailRows.map((e) => e.id as string);

		// Batch-fetch all attachments for the thread in a single query
		const placeholders = emailIds.map((_, i) => `?${i + 1}`).join(",");
		const attachmentRows = [
			...this.ctx.storage.sql.exec(
				`SELECT * FROM attachments WHERE email_id IN (${placeholders})`,
				...emailIds,
			),
		] as any[];

		// Group attachments by email_id
		const attachmentsByEmail = new Map<string, any[]>();
		for (const att of attachmentRows) {
			const list = attachmentsByEmail.get(att.email_id) || [];
			list.push(att);
			attachmentsByEmail.set(att.email_id, list);
		}

		return emailRows.map((email) => ({
			...email,
			read: !!email.read,
			starred: !!email.starred,
			attachments: attachmentsByEmail.get(email.id) || [],
		}));
	}

	async updateEmail(
		id: string,
		{ read, starred }: { read?: boolean; starred?: boolean },
	) {
		const data: { read?: number; starred?: number } = {};
		if (read !== undefined) {
			data.read = read ? 1 : 0;
		}
		if (starred !== undefined) {
			data.starred = starred ? 1 : 0;
		}

		if (Object.keys(data).length === 0) {
			return this.getEmail(id);
		}

		this.db
			.update(schema.emails)
			.set(data)
			.where(eq(schema.emails.id, id))
			.run();

		return this.getEmail(id);
	}

	async markThreadRead(threadId: string) {
		this.ctx.storage.sql.exec(
			`UPDATE emails SET read = 1 WHERE thread_id = ? AND read = 0`,
			threadId,
		);
		return { threadId, markedRead: true };
	}

	async deleteEmail(id: string) {
		const email = this.db
			.select({ id: schema.emails.id })
			.from(schema.emails)
			.where(eq(schema.emails.id, id))
			.get();

		if (!email) return null;

		const emailAttachments = this.db
			.select({
				id: schema.attachments.id,
				filename: schema.attachments.filename,
			})
			.from(schema.attachments)
			.where(eq(schema.attachments.email_id, id))
			.all();

		this.db
			.delete(schema.emails)
			.where(eq(schema.emails.id, id))
			.run();

		return emailAttachments;
	}

	async listAttachmentKeys() {
		const rows = this.db
			.select({
				email_id: schema.attachments.email_id,
				id: schema.attachments.id,
				filename: schema.attachments.filename,
			})
			.from(schema.attachments)
			.all();

		return rows.map((att) => `attachments/${att.email_id}/${att.id}/${att.filename}`);
	}

	async clearMailboxData() {
		this.ctx.storage.sql.exec("DELETE FROM attachments");
		this.ctx.storage.sql.exec("DELETE FROM emails");
		this.ctx.storage.sql.exec("DELETE FROM folders");
		return { cleared: true };
	}

	async getAttachment(id: string) {
		return (
			this.db
				.select()
				.from(schema.attachments)
				.where(eq(schema.attachments.id, id))
				.get() ?? null
		);
	}

	// ── Folders (Drizzle) ──────────────────────────────────────────

	async getFolders() {
		const result = this.db
			.select({
				id: schema.folders.id,
				name: schema.folders.name,
				unreadCount: sql<number>`COALESCE(SUM(CASE WHEN ${schema.emails.read} = 0 THEN 1 ELSE 0 END), 0)`.mapWith(Number),
			})
			.from(schema.folders)
			.leftJoin(schema.emails, eq(schema.emails.folder_id, schema.folders.id))
			.groupBy(schema.folders.id, schema.folders.name)
			.all();
		return result;
	}

	async createFolder(id: string, name: string, is_deletable: number = 1) {
		try {
			const result = this.db
				.insert(schema.folders)
				.values({ id, name, is_deletable })
				.returning({ id: schema.folders.id, name: schema.folders.name })
				.get();
			return { ...result, unreadCount: 0 };
		} catch (e: unknown) {
			if (e instanceof Error && e.message.includes("UNIQUE constraint failed")) {
				return null;
			}
			throw e;
		}
	}

	async updateFolder(id: string, name: string) {
		const result = this.db
			.update(schema.folders)
			.set({ name })
			.where(eq(schema.folders.id, id))
			.returning({ id: schema.folders.id, name: schema.folders.name })
			.get();
		return result;
	}

	async deleteFolder(id: string) {
		const folder = this.db
			.select({ is_deletable: schema.folders.is_deletable })
			.from(schema.folders)
			.where(eq(schema.folders.id, id))
			.get();

		if (!folder || folder.is_deletable === 0) {
			return false;
		}

		this.db
			.delete(schema.folders)
			.where(eq(schema.folders.id, id))
			.run();

		return true;
	}

	async moveEmail(id: string, folderId: string) {
		const folder = this.db
			.select({ id: schema.folders.id })
			.from(schema.folders)
			.where(eq(schema.folders.id, folderId))
			.get();

		if (!folder) return false;

		this.db
			.update(schema.emails)
			.set({ folder_id: folderId })
			.where(eq(schema.emails.id, id))
			.run();

		return true;
	}

	// ── Search (raw SQL — dynamic condition builder) ───────────────

	/**
	 * Build WHERE conditions and params for search queries.
	 * Shared between searchEmails and countSearchResults.
	 */
	#buildSearchConditions(
		options: SearchFilterOptions,
		tableAlias = "",
	): { conditions: string[]; params: (string | number)[] } {
		const { query, folder, from, to, subject, date_start, date_end, is_read, is_starred, has_attachment } = options;
		const prefix = tableAlias ? `${tableAlias}.` : "";
		const conditions: string[] = [];
		const params: (string | number)[] = [];
		let paramIdx = 0;

		const addParam = (value: string | number) => {
			paramIdx++;
			params.push(value);
			return `?${paramIdx}`;
		};

		if (query) {
			const p1 = addParam(`%${query}%`);
			const p2 = addParam(`%${query}%`);
			const p3 = addParam(`%${query}%`);
			const p4 = addParam(`%${query}%`);
			conditions.push(`(${prefix}subject LIKE ${p1} OR ${prefix}body LIKE ${p2} OR ${prefix}sender LIKE ${p3} OR ${prefix}recipient LIKE ${p4} OR ${prefix}cc LIKE ${p4} OR ${prefix}bcc LIKE ${p4})`);
		}
		if (folder) {
			const p = addParam(folder);
			conditions.push(`${prefix}folder_id = (SELECT id FROM folders WHERE name = ${p} OR id = ${p} LIMIT 1)`);
		}
		if (from) { const p = addParam(`%${from}%`); conditions.push(`${prefix}sender LIKE ${p}`); }
		if (to) { const p = addParam(`%${to}%`); conditions.push(`(${prefix}recipient LIKE ${p} OR ${prefix}cc LIKE ${p} OR ${prefix}bcc LIKE ${p})`); }
		if (subject) { const p = addParam(`%${subject}%`); conditions.push(`${prefix}subject LIKE ${p}`); }
		if (date_start) { const p = addParam(date_start); conditions.push(`${prefix}date >= ${p}`); }
		if (date_end) { const p = addParam(date_end); conditions.push(`${prefix}date <= ${p}`); }
		if (is_read !== undefined) { const p = addParam(is_read ? 1 : 0); conditions.push(`${prefix}read = ${p}`); }
		if (is_starred !== undefined) { const p = addParam(is_starred ? 1 : 0); conditions.push(`${prefix}starred = ${p}`); }
		if (has_attachment) { conditions.push(`${prefix}id IN (SELECT DISTINCT email_id FROM attachments)`); }

		return { conditions, params };
	}

	async searchEmails(options: SearchFilterOptions & { page?: number; limit?: number }) {
		const { page = 1, limit: rawLimit = 25 } = options;
		const limit = Math.min(Math.max(rawLimit, 1), 100);
		const { conditions, params } = this.#buildSearchConditions(options, "e");

		const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
		const offset = (page - 1) * limit;

		const query = `
			SELECT e.id, e.subject, e.sender, e.recipient, e.cc, e.bcc, e.date,
				e.read, e.starred, e.in_reply_to, e.email_references,
				e.thread_id, e.folder_id,
				SUBSTR(e.body, 1, 300) as snippet,
				f.name as folder_name
			FROM emails e
			LEFT JOIN folders f ON e.folder_id = f.id
			${where}
			ORDER BY e.date DESC LIMIT ?${params.length + 1} OFFSET ?${params.length + 2}`;
		params.push(limit, offset);

		const result = this.ctx.storage.sql.exec(query, ...params);
		return [...result].map((row: any) => ({
			...row,
			read: !!row.read,
			starred: !!row.starred,
		}));
	}

	/**
	 * Count total search results matching the given filters (for pagination).
	 */
	async countSearchResults(options: SearchFilterOptions) {
		const { conditions, params } = this.#buildSearchConditions(options);

		const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
		const query = `SELECT COUNT(*) as total FROM emails ${where}`;

		const row = [...this.ctx.storage.sql.exec(query, ...params)][0] as
			| { total: number }
			| undefined;
		return row?.total ?? 0;
	}

	async getAdminMetrics() {
		const scalar = (query: string) => {
			const row = [...this.ctx.storage.sql.exec(query)][0] as
				| { value: number | string | null }
				| undefined;
			return Number(row?.value ?? 0);
		};

		const totalEmails = scalar("SELECT COUNT(*) as value FROM emails");
		const unreadEmails = scalar("SELECT COUNT(*) as value FROM emails WHERE read = 0");
		const draftEmails = scalar("SELECT COUNT(*) as value FROM emails WHERE folder_id = 'draft'");
		const sentEmails = scalar("SELECT COUNT(*) as value FROM emails WHERE folder_id = 'sent'");
		const inboxEmails = scalar("SELECT COUNT(*) as value FROM emails WHERE folder_id = 'inbox'");
		const attachments = scalar("SELECT COUNT(*) as value FROM attachments");
		const threads = scalar("SELECT COUNT(DISTINCT COALESCE(thread_id, id)) as value FROM emails");
		const needsReply = scalar(`
			WITH latest AS (
				SELECT
					COALESCE(thread_id, id) as thread_key,
					folder_id,
					ROW_NUMBER() OVER (PARTITION BY COALESCE(thread_id, id) ORDER BY date DESC) as rn
				FROM emails
			)
			SELECT COUNT(*) as value
			FROM latest
			WHERE rn = 1 AND folder_id NOT IN ('sent', 'draft', 'trash', 'archive')
		`);

		const lastEmailRow = [...this.ctx.storage.sql.exec(
			"SELECT MAX(date) as value FROM emails",
		)][0] as { value: string | null } | undefined;

		const byDay = [...this.ctx.storage.sql.exec(`
			SELECT SUBSTR(date, 1, 10) as date, COUNT(*) as count
			FROM emails
			WHERE date >= datetime('now', '-29 days')
			GROUP BY SUBSTR(date, 1, 10)
			ORDER BY date ASC
		`)] as { date: string; count: number }[];

		return {
			totalEmails,
			unreadEmails,
			draftEmails,
			sentEmails,
			inboxEmails,
			attachments,
			threads,
			needsReply,
			lastEmailAt: lastEmailRow?.value ?? null,
			byDay,
		};
	}

	// ── Threading helpers (raw SQL) ────────────────────────────────

	async findThreadBySubject(subject: string, senderAddress?: string): Promise<string | null> {
		const normalized = subject
			.replace(/^(?:(?:re|fwd?|fw|aw|wg|r[eé]f|sv)\s*:\s*)+/i, "")
			.trim()
			.toLowerCase();

		if (!normalized) return null;

		const result = this.ctx.storage.sql.exec(
			`SELECT thread_id, subject,
			        GROUP_CONCAT(DISTINCT LOWER(sender)) as senders,
			        GROUP_CONCAT(DISTINCT LOWER(recipient)) as recipients
			 FROM emails
			 WHERE thread_id IS NOT NULL
			   AND thread_id != id
			   AND date >= datetime('now', '-7 days')
			 GROUP BY thread_id
			 ORDER BY MAX(date) DESC
			 LIMIT 50`,
		);

		const normalizedSender = senderAddress?.toLowerCase().trim();

		for (const row of result) {
			const rowSubject = String((row as any).subject || "")
				.replace(/^(?:(?:re|fwd?|fw|aw|wg|r[eé]f|sv)\s*:\s*)+/i, "")
				.trim()
				.toLowerCase();
			if (rowSubject !== normalized) continue;

			if (normalizedSender) {
				const threadSenders = String((row as any).senders || "");
				const threadRecipients = String((row as any).recipients || "");
				const allParticipants = `${threadSenders},${threadRecipients}`;
				if (!allParticipants.includes(normalizedSender)) {
					continue;
				}
			}

			return String((row as any).thread_id);
		}
		return null;
	}

	// ── Rate limiting (raw SQL) ────────────────────────────────────

	/**
	 * Check if the mailbox has exceeded the send rate limit.
	 * Limits: 20 emails per hour, 100 per day per mailbox.
	 * Returns null if under limit, or an error message string if exceeded.
	 */
	async checkSendRateLimit(): Promise<string | null> {
		const hourRow = [...this.ctx.storage.sql.exec(
			`SELECT COUNT(*) as cnt FROM emails
			 WHERE folder_id = ?1
			   AND date >= datetime('now', '-1 hour')`,
			Folders.SENT,
		)][0] as { cnt: number } | undefined;

		if ((hourRow?.cnt ?? 0) >= 20) {
			return "Rate limit exceeded: max 20 emails per hour per mailbox";
		}

		const dayRow = [...this.ctx.storage.sql.exec(
			`SELECT COUNT(*) as cnt FROM emails
			 WHERE folder_id = ?1
			   AND date >= datetime('now', '-1 day')`,
			Folders.SENT,
		)][0] as { cnt: number } | undefined;

		if ((dayRow?.cnt ?? 0) >= 100) {
			return "Rate limit exceeded: max 100 emails per day per mailbox";
		}

		return null;
	}

	// ── Email creation (Drizzle) ───────────────────────────────────

	async createEmail(
		folder: string,
		email: EmailData,
		attachments: AttachmentData[],
	) {
		// Resolve folder name or ID to the actual folder ID.
		const folderRow = this.db
			.select({ id: schema.folders.id })
			.from(schema.folders)
			.where(or(eq(schema.folders.id, folder), eq(schema.folders.name, folder)))
			.limit(1)
			.get();

		if (!folderRow) {
			throw new Error(
				`createEmail: folder "${folder}" not found. ` +
					"Ensure the folder exists before inserting an email.",
			);
		}

		const folderId = folderRow.id;
		const isSent = folderId === Folders.SENT;

		// Sent emails are always read — the sender obviously knows what they wrote.
		// This prevents sent replies from inflating thread_unread_count.
		this.db
			.insert(schema.emails)
			.values({
				id: email.id,
				folder_id: folderId,
				subject: email.subject,
				sender: email.sender,
				recipient: email.recipient,
				cc: email.cc ?? null,
				bcc: email.bcc ?? null,
				date: email.date,
				read: isSent ? 1 : (email.read ? 1 : 0),
				starred: email.starred ? 1 : 0,
				body: email.body,
				in_reply_to: email.in_reply_to ?? null,
				email_references: email.email_references ?? null,
				thread_id: email.thread_id ?? null,
				message_id: email.message_id ?? null,
				raw_headers: email.raw_headers ?? null,
				citations_json: email.citations_json ?? null,
			})
			.run();

		if (attachments.length > 0) {
			this.db.insert(schema.attachments).values(attachments).run();
		}

		// Apply auto-routing rules to incoming mail. Sent mail is the operator's
		// own output, so it bypasses routing. Failures here are swallowed so a
		// malformed rule never blocks ingestion.
		if (!isSent) {
			try {
				await this.applyRoutingRules(email.id);
			} catch {
				/* never block ingestion on routing failure */
			}
		}
	}

	async listTemplates() {
		return this.db
			.select({
				id: schema.templates.id,
				name: schema.templates.name,
				subject: schema.templates.subject,
				body: schema.templates.body,
				created_at: schema.templates.created_at,
				updated_at: schema.templates.updated_at,
			})
			.from(schema.templates)
			.orderBy(desc(schema.templates.updated_at))
			.all();
	}

	async createTemplate(input: {
		id: string;
		name: string;
		subject?: string | null;
		body: string;
	}) {
		const now = new Date().toISOString();
		const result = this.db
			.insert(schema.templates)
			.values({
				id: input.id,
				name: input.name,
				subject: input.subject ?? null,
				body: input.body,
				created_at: now,
				updated_at: now,
			})
			.returning()
			.get();
		return result ?? null;
	}

	async updateTemplate(
		id: string,
		patch: { name?: string; subject?: string | null; body?: string },
	) {
		const existing = this.db
			.select()
			.from(schema.templates)
			.where(eq(schema.templates.id, id))
			.get();
		if (!existing) return null;

		const result = this.db
			.update(schema.templates)
			.set({
				name: patch.name ?? existing.name,
				subject:
					patch.subject === undefined ? existing.subject : patch.subject,
				body: patch.body ?? existing.body,
				updated_at: new Date().toISOString(),
			})
			.where(eq(schema.templates.id, id))
			.returning()
			.get();
		return result ?? null;
	}

	async deleteTemplate(id: string) {
		const existing = this.db
			.select({ id: schema.templates.id })
			.from(schema.templates)
			.where(eq(schema.templates.id, id))
			.get();
		if (!existing) return false;

		this.db
			.delete(schema.templates)
			.where(eq(schema.templates.id, id))
			.run();
		return true;
	}

	async touchTemplate(id: string) {
		this.db
			.update(schema.templates)
			.set({ updated_at: new Date().toISOString() })
			.where(eq(schema.templates.id, id))
			.run();
	}

	async recordAgentFeedback(input: {
		call_id: string;
		session_id?: string | null;
		score: 1 | -1;
		comment?: string | null;
	}) {
		const id = crypto.randomUUID();
		const created_at = new Date().toISOString();
		try {
			this.db
				.insert(schema.agentFeedback)
				.values({
					id,
					call_id: input.call_id,
					session_id: input.session_id ?? null,
					score: input.score,
					comment: input.comment ?? null,
					created_at,
				})
				.run();
			return { id, call_id: input.call_id, score: input.score, created_at };
		} catch (e: unknown) {
			// UNIQUE(call_id, score) → idempotent rate
			if (e instanceof Error && e.message.includes("UNIQUE constraint failed")) {
				return null;
			}
			throw e;
		}
	}

	async deleteAgentFeedback(call_id: string, score: 1 | -1) {
		this.db
			.delete(schema.agentFeedback)
			.where(
				and(
					eq(schema.agentFeedback.call_id, call_id),
					eq(schema.agentFeedback.score, score),
				),
			)
			.run();
	}

	async getAgentFeedbackSummary() {
		const rows = this.db
			.select({
				score: schema.agentFeedback.score,
				total: sql<number>`COUNT(*)`.mapWith(Number),
			})
			.from(schema.agentFeedback)
			.groupBy(schema.agentFeedback.score)
			.all();
		const up = rows.find((r) => r.score === 1)?.total ?? 0;
		const down = rows.find((r) => r.score === -1)?.total ?? 0;
		return { up, down, total: up + down };
	}

	private rowToRoutingRule(row: {
		id: string;
		name: string;
		priority: number;
		enabled: number;
		match_json: string;
		action_json: string;
	}): RoutingRule {
		return {
			id: row.id,
			name: row.name,
			priority: row.priority,
			enabled: row.enabled === 1,
			match: JSON.parse(row.match_json) as RuleMatch[],
			action: JSON.parse(row.action_json) as RuleAction,
		};
	}

	async listRoutingRules(): Promise<RoutingRule[]> {
		const rows = this.db
			.select({
				id: schema.routingRules.id,
				name: schema.routingRules.name,
				priority: schema.routingRules.priority,
				enabled: schema.routingRules.enabled,
				match_json: schema.routingRules.match_json,
				action_json: schema.routingRules.action_json,
			})
			.from(schema.routingRules)
			.orderBy(desc(schema.routingRules.priority))
			.all();
		return rows.map((r) => this.rowToRoutingRule(r));
	}

	async createRoutingRule(input: {
		name: string;
		priority?: number;
		enabled?: boolean;
		match: RuleMatch[];
		action: RuleAction;
	}): Promise<RoutingRule> {
		const id = crypto.randomUUID();
		const now = new Date().toISOString();
		this.db
			.insert(schema.routingRules)
			.values({
				id,
				name: input.name,
				priority: input.priority ?? 0,
				enabled: input.enabled === false ? 0 : 1,
				match_json: JSON.stringify(input.match),
				action_json: JSON.stringify(input.action),
				created_at: now,
				updated_at: now,
			})
			.run();
		return {
			id,
			name: input.name,
			priority: input.priority ?? 0,
			enabled: input.enabled !== false,
			match: input.match,
			action: input.action,
		};
	}

	async updateRoutingRule(
		id: string,
		patch: {
			name?: string;
			priority?: number;
			enabled?: boolean;
			match?: RuleMatch[];
			action?: RuleAction;
		},
	): Promise<RoutingRule | null> {
		const existing = this.db
			.select()
			.from(schema.routingRules)
			.where(eq(schema.routingRules.id, id))
			.get();
		if (!existing) return null;
		const next = {
			name: patch.name ?? existing.name,
			priority: patch.priority ?? existing.priority,
			enabled:
				patch.enabled === undefined
					? existing.enabled
					: patch.enabled
					? 1
					: 0,
			match_json: patch.match
				? JSON.stringify(patch.match)
				: existing.match_json,
			action_json: patch.action
				? JSON.stringify(patch.action)
				: existing.action_json,
			updated_at: new Date().toISOString(),
		};
		this.db
			.update(schema.routingRules)
			.set(next)
			.where(eq(schema.routingRules.id, id))
			.run();
		return this.rowToRoutingRule({ id, ...next });
	}

	async deleteRoutingRule(id: string): Promise<boolean> {
		const existing = this.db
			.select({ id: schema.routingRules.id })
			.from(schema.routingRules)
			.where(eq(schema.routingRules.id, id))
			.get();
		if (!existing) return false;
		this.db
			.delete(schema.routingRules)
			.where(eq(schema.routingRules.id, id))
			.run();
		return true;
	}

	/**
	 * Apply the highest-priority matching rule to an incoming email row that
	 * has just been inserted. Returns the action taken or null. Folder moves
	 * are only honored when the destination folder exists.
	 */
	async applyRoutingRules(emailId: string): Promise<RuleAction | null> {
		const row = this.db
			.select({
				id: schema.emails.id,
				sender: schema.emails.sender,
				recipient: schema.emails.recipient,
				subject: schema.emails.subject,
				body: schema.emails.body,
				folder_id: schema.emails.folder_id,
			})
			.from(schema.emails)
			.where(eq(schema.emails.id, emailId))
			.get();
		if (!row) return null;

		const rules = await this.listRoutingRules();
		const email: RoutableEmail = {
			sender: row.sender,
			recipient: row.recipient,
			subject: row.subject,
			body: row.body,
		};
		const result = evaluateRules(email, rules);
		if (!result) return null;

		const action = result.action;
		switch (action.type) {
			case "move": {
				if (!action.folderId) return null;
				const folder = this.db
					.select({ id: schema.folders.id })
					.from(schema.folders)
					.where(eq(schema.folders.id, action.folderId))
					.get();
				if (!folder) return null;
				this.db
					.update(schema.emails)
					.set({ folder_id: action.folderId })
					.where(eq(schema.emails.id, emailId))
					.run();
				return action;
			}
			case "mark_read": {
				this.db
					.update(schema.emails)
					.set({ read: 1 })
					.where(eq(schema.emails.id, emailId))
					.run();
				return action;
			}
			case "star": {
				this.db
					.update(schema.emails)
					.set({ starred: 1 })
					.where(eq(schema.emails.id, emailId))
					.run();
				return action;
			}
			case "skip_agent": {
				// Sentinel — the caller (receiveEmail) checks this to skip auto-draft.
				return action;
			}
		}
	}

	// ── Customer segmentation (aggregation over emails) ──────────────

	async getCustomerSegments(): Promise<CustomerSegmentResult[]> {
		const rows = [
			...this.ctx.storage.sql.exec(
				`SELECT sender,
				        COUNT(*) AS totalMessages,
				        MAX(date) AS lastSeenAt,
				        MIN(date) AS firstSeenAt,
				        SUM(starred) AS starred
				 FROM emails
				 WHERE sender IS NOT NULL
				 GROUP BY sender`,
			),
		] as Array<{
			sender: string;
			totalMessages: number;
			lastSeenAt: string;
			firstSeenAt: string;
			starred: number;
		}>;

		const now = new Date();
		return rows
			.map((row) => {
				const lastAt = row.sender.lastIndexOf("@");
				const domain = lastAt >= 0 ? row.sender.slice(lastAt + 1) : "";
				const stats: SenderStats = {
					email: row.sender,
					domain,
					totalMessages: row.totalMessages,
					lastSeenAt: row.lastSeenAt,
					firstSeenAt: row.firstSeenAt,
					starred: row.starred,
				};
				return {
					email: stats.email,
					domain: stats.domain,
					segment: classify(stats, now),
					totalMessages: stats.totalMessages,
					lastSeenAt: stats.lastSeenAt,
					firstSeenAt: stats.firstSeenAt,
					starred: stats.starred,
				};
			})
			.sort((a, b) => b.totalMessages - a.totalMessages);
	}

	// ── SLA metrics (on-the-fly from emails table) ────────────────────

	async getSlaMetrics(window: SlaWindow): Promise<SlaMetrics> {
		// Compute the date cutoff for the window
		const now = new Date();
		const windowHours: Record<SlaWindow, number> = { "24h": 24, "7d": 168, "30d": 720 };
		const hours = windowHours[window];
		const cutoff = new Date(now.getTime() - hours * 3_600_000).toISOString();

		// 1. Received emails (not in 'sent' folder) within window
		const receivedRows = [
			...this.ctx.storage.sql.exec(
				`SELECT id, subject, sender, date
				 FROM emails
				 WHERE folder_id NOT IN (SELECT id FROM folders WHERE name = ?1)
				   AND date >= ?2`,
				Folders.SENT,
				cutoff,
			),
		] as Array<{ id: string; subject: string; sender: string; date: string }>;

		// 2. Sent replies (in 'sent' folder, non-null in_reply_to) within window
		const replyRows = [
			...this.ctx.storage.sql.exec(
				`SELECT id, in_reply_to, date
				 FROM emails
				 WHERE folder_id = (SELECT id FROM folders WHERE name = ?1 LIMIT 1)
				   AND in_reply_to IS NOT NULL
				   AND date >= ?2`,
				Folders.SENT,
				cutoff,
			),
		] as Array<{ id: string; in_reply_to: string; date: string }>;

		return computeSlaMetrics({
			received: receivedRows,
			replies: replyRows,
			now,
			window,
		});
	}

	async listPendingApprovals() {
		const rows = this.db
			.select({
				id: schema.emails.id,
				subject: schema.emails.subject,
				sender: schema.emails.sender,
				recipient: schema.emails.recipient,
				body: schema.emails.body,
				date: schema.emails.date,
				thread_id: schema.emails.thread_id,
				in_reply_to: schema.emails.in_reply_to,
				approval_state: schema.emails.approval_state,
				approval_meta_json: schema.emails.approval_meta_json,
			})
			.from(schema.emails)
			.where(eq(schema.emails.approval_state, "pending"))
			.orderBy(desc(schema.emails.date))
			.all();
		return rows.map((r) => ({
			...r,
			read: false,
			starred: false,
			approval_meta: r.approval_meta_json
				? (JSON.parse(r.approval_meta_json) as ApprovalMeta)
				: null,
		}));
	}

	async transitionApproval(
		emailId: string,
		action: ApprovalAction,
		patch: { decided_by?: string; comment?: string | null } = {},
	): Promise<{ state: ApprovalState | null; meta: ApprovalMeta } | null> {
		const row = this.db
			.select({
				id: schema.emails.id,
				approval_state: schema.emails.approval_state,
				approval_meta_json: schema.emails.approval_meta_json,
			})
			.from(schema.emails)
			.where(eq(schema.emails.id, emailId))
			.get();
		if (!row) return null;

		const current = (row.approval_state as ApprovalState | null) ?? null;
		const next = nextApprovalState(current, action);
		if (next === null && action !== "submit") return null;
		// next can legitimately be null if action=submit refused on terminal —
		// surface that to the caller too.
		if (next === null) return null;

		const existingMeta: ApprovalMeta = row.approval_meta_json
			? (JSON.parse(row.approval_meta_json) as ApprovalMeta)
			: {};
		const now = new Date().toISOString();
		const meta: ApprovalMeta =
			action === "submit"
				? { ...existingMeta, submitted_at: existingMeta.submitted_at ?? now }
				: {
						...existingMeta,
						decided_by: patch.decided_by ?? existingMeta.decided_by,
						decided_at: now,
						comment: patch.comment ?? existingMeta.comment ?? null,
					};

		this.db
			.update(schema.emails)
			.set({
				approval_state: next,
				approval_meta_json: JSON.stringify(meta),
			})
			.where(eq(schema.emails.id, emailId))
			.run();
		return { state: next, meta };
	}
}
