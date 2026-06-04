// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

/**
 * Integration test: MailboxDO happy path
 *
 * Uses vitest-pool-workers `env` helper so MailboxDO runs in a real miniflare
 * Workers environment with SQLite storage. The DO constructor applies
 * mailboxMigrations (which seeds default folders: inbox, sent, trash, etc.)
 * so createEmail can be called without manual folder setup.
 */

import { env, runInDurableObject } from "cloudflare:test";
import { describe, it, expect } from "vitest";

describe("MailboxDO happy path", () => {
	it("createEmail stores an email retrievable via getEmails", async () => {
		const id = env.MAILBOX.idFromName("test-mailbox-happypath");
		const stub = env.MAILBOX.get(id);

		const emailId = crypto.randomUUID();
		const now = new Date().toISOString();

		await runInDurableObject(stub, async (instance: any) => {
			await instance.createEmail("inbox", {
				id: emailId,
				subject: "Hello integration",
				sender: "alice@example.com",
				recipient: "bob@example.com",
				date: now,
				body: "Integration test body",
				read: false,
			}, []);
		});

		const emails = await runInDurableObject(stub, async (instance: any) => {
			return instance.getEmails({ folder: "inbox" });
		});

		expect(Array.isArray(emails)).toBe(true);
		expect(emails.length).toBeGreaterThanOrEqual(1);
		const found = emails.find((e: any) => e.id === emailId);
		expect(found).toBeDefined();
		expect(found.subject).toBe("Hello integration");
	});

	it("markRead updates read status", async () => {
		const id = env.MAILBOX.idFromName("test-mailbox-markread");
		const stub = env.MAILBOX.get(id);

		const emailId = crypto.randomUUID();
		const now = new Date().toISOString();

		await runInDurableObject(stub, async (instance: any) => {
			await instance.createEmail("inbox", {
				id: emailId,
				subject: "Mark read test",
				sender: "sender@example.com",
				recipient: "recv@example.com",
				date: now,
				body: "body",
				read: false,
			}, []);
		});

		// Mark as read via updateEmail (MailboxDO's actual method)
		await runInDurableObject(stub, async (instance: any) => {
			await instance.updateEmail(emailId, { read: true });
		});

		const emails = await runInDurableObject(stub, async (instance: any) => {
			return instance.getEmails({ folder: "inbox" });
		});

		const found = emails.find((e: any) => e.id === emailId);
		// read is stored as 0/1 integer in SQLite
		expect(found?.read).toBeTruthy();
	});

	it("getAdminMetrics reflects stored email count", async () => {
		const id = env.MAILBOX.idFromName("test-mailbox-metrics");
		const stub = env.MAILBOX.get(id);

		const now = new Date().toISOString();
		await runInDurableObject(stub, async (instance: any) => {
			await instance.createEmail("inbox", {
				id: crypto.randomUUID(),
				subject: "Metric email 1",
				sender: "a@example.com",
				recipient: "b@example.com",
				date: now,
				body: "body",
			}, []);
		});

		const metrics = await runInDurableObject(stub, async (instance: any) => {
			return instance.getAdminMetrics();
		});

		expect(metrics.totalEmails).toBeGreaterThanOrEqual(1);
		expect(typeof metrics.unreadEmails).toBe("number");
		expect(Array.isArray(metrics.byDay)).toBe(true);
	});
});
