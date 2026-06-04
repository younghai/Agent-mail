// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

/**
 * E2E happy path — full inbound mail flow.
 *
 * Drives:
 *   1. processIncomingEmail (R2 PUT + saveIncomingEmail call)
 *   2. MailboxDO.createEmail seeds the inbox
 *   3. getEmails returns the seeded message (read=false)
 *   4. updateEmail flips it to read=true
 *   5. createEmail("draft", ...) saves a reply draft
 *   6. getEmails("draft") confirms the draft is retrievable
 */

import { env, runInDurableObject as _runInDurableObject } from "cloudflare:test";
import { describe, it, expect } from "vitest";
import { processIncomingEmail } from "../../workers/lib/email-ingest/processor";

// vitest-pool-workers + drizzle types push generic instantiation past tsc's depth
// limit. Runtime contract preserved; only inference is bypassed.
const runInDurableObject = _runInDurableObject as unknown as <R>(
	stub: unknown,
	cb: (instance: any) => Promise<R> | R,
) => Promise<R>;

describe("Full mail flow happy path", () => {
	it("ingests, marks read, and drafts a reply", async () => {
		const mailboxId = "e2e-mailbox-1";
		const stub = env.MAILBOX.get(env.MAILBOX.idFromName(mailboxId));

		// ── Step 1: ingest via processIncomingEmail (mocked deps) ─────────
		const r2Calls: Array<{ key: string; size: number }> = [];
		const doCalls: Array<unknown> = [];
		const rawText = "From: alice@example.com\nTo: bob@example.com\nSubject: Hi\n\nHello";
		const stream = new ReadableStream<Uint8Array>({
			start(c) {
				c.enqueue(new TextEncoder().encode(rawText));
				c.close();
			},
		});

		const ingestResult = await processIncomingEmail(
			{
				from: "alice@example.com",
				to: `${mailboxId}@example.com`,
				headers: new Headers(),
				raw: stream,
			},
			{
				r2Put: async (key, body) => {
					r2Calls.push({ key, size: body.byteLength });
				},
				mailboxStub: {
					saveIncomingEmail: async (msg) => {
						doCalls.push(msg);
						return { ok: true };
					},
				},
				parseRawEmail: async () => ({
					subject: "Hi",
					date: "2026-05-09T00:00:00Z",
					messageId: "msg-e2e-1",
				}),
			},
		);

		expect(ingestResult.stored).toBe(true);
		expect(r2Calls.length).toBe(1);
		expect(r2Calls[0].size).toBeGreaterThan(0);
		expect(doCalls.length).toBe(1);

		// ── Step 2: seed MailboxDO directly (simulates the DO side of saveIncomingEmail) ─
		const emailId = crypto.randomUUID();
		await runInDurableObject(stub, async (instance: any) => {
			await instance.createEmail(
				"inbox",
				{
					id: emailId,
					subject: "Hi",
					sender: "alice@example.com",
					recipient: `${mailboxId}@example.com`,
					date: "2026-05-09T00:00:00Z",
					body: "Hello",
					read: false,
				},
				[],
			);
		});

		// ── Step 3: email is retrievable, unread ───────────────────────────
		const inboxBefore = await runInDurableObject(stub, async (instance: any) => {
			return instance.getEmails({ folder: "inbox", limit: 10 });
		});
		const seeded = (inboxBefore as any[]).find((e: any) => e.id === emailId);
		expect(seeded).toBeDefined();
		expect(seeded.read).toBe(false);

		// ── Step 4: mark read ──────────────────────────────────────────────
		await runInDurableObject(stub, async (instance: any) => {
			await instance.updateEmail(emailId, { read: true });
		});
		const inboxAfter = await runInDurableObject(stub, async (instance: any) => {
			return instance.getEmails({ folder: "inbox", limit: 10 });
		});
		const afterRead = (inboxAfter as any[]).find((e: any) => e.id === emailId);
		expect(afterRead.read).toBe(true);

		// ── Step 5: save a reply draft ─────────────────────────────────────
		const draftId = crypto.randomUUID();
		await runInDurableObject(stub, async (instance: any) => {
			await instance.createEmail(
				"draft",
				{
					id: draftId,
					subject: "Re: Hi",
					sender: `${mailboxId}@example.com`,
					recipient: "alice@example.com",
					date: "2026-05-09T00:01:00Z",
					body: "Thanks for reaching out.",
					read: false,
				},
				[],
			);
		});

		// ── Step 6: draft is retrievable from drafts folder ────────────────
		const drafts = await runInDurableObject(stub, async (instance: any) => {
			return instance.getEmails({ folder: "draft", limit: 10 });
		});
		const draft = (drafts as any[]).find((e: any) => e.id === draftId);
		expect(draft).toBeDefined();
		expect(draft.subject).toBe("Re: Hi");
	});
});
