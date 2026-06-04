// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const folders = sqliteTable("folders", {
	id: text("id").primaryKey(),
	name: text("name").notNull().unique(),
	is_deletable: integer("is_deletable").notNull().default(1),
});

export const emails = sqliteTable("emails", {
	id: text("id").primaryKey(),
	folder_id: text("folder_id")
		.notNull()
		.references(() => folders.id, { onDelete: "cascade" }),
	subject: text("subject"),
	sender: text("sender"),
	recipient: text("recipient"),
	cc: text("cc"),
	bcc: text("bcc"),
	date: text("date"),
	read: integer("read").default(0),
	starred: integer("starred").default(0),
	body: text("body"),
	in_reply_to: text("in_reply_to"),
	email_references: text("email_references"),
	thread_id: text("thread_id"),
	message_id: text("message_id"),
	raw_headers: text("raw_headers"),
	approval_state: text("approval_state"),
	approval_meta_json: text("approval_meta_json"),
	citations_json: text("citations_json"),
});

export const attachments = sqliteTable("attachments", {
	id: text("id").primaryKey(),
	email_id: text("email_id")
		.notNull()
		.references(() => emails.id, { onDelete: "cascade" }),
	filename: text("filename").notNull(),
	mimetype: text("mimetype").notNull(),
	size: integer("size").notNull(),
	content_id: text("content_id"),
	disposition: text("disposition"),
});

export const templates = sqliteTable("templates", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	subject: text("subject"),
	body: text("body").notNull(),
	created_at: text("created_at").notNull(),
	updated_at: text("updated_at").notNull(),
});

export const agentFeedback = sqliteTable("agent_feedback", {
	id: text("id").primaryKey(),
	call_id: text("call_id").notNull(),
	session_id: text("session_id"),
	score: integer("score").notNull(),
	comment: text("comment"),
	created_at: text("created_at").notNull(),
});

export const routingRules = sqliteTable("routing_rules", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	priority: integer("priority").notNull().default(0),
	enabled: integer("enabled").notNull().default(1),
	match_json: text("match_json").notNull(),
	action_json: text("action_json").notNull(),
	created_at: text("created_at").notNull(),
	updated_at: text("updated_at").notNull(),
});
