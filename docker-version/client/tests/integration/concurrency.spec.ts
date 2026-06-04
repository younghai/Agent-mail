// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

/**
 * Integration test: MailboxDO concurrency
 *
 * Durable Objects serialize all requests — concurrent fetch calls are queued
 * and executed one at a time. This spec verifies that simultaneous createEmail
 * calls resolve to a consistent final state (all emails stored, no corruption).
 *
 * Note: True concurrent DO invocations via Promise.all on stubs are serialized
 * by the runtime, so this is a correctness test, not a race-condition test.
 */

import { env, runInDurableObject as _runInDurableObject } from "cloudflare:test";
import { describe, it, expect } from "vitest";

// drizzle types in MailboxDO push runInDurableObject's generic instantiation
// over tsc's depth limit. The runtime contract is preserved; only inference is bypassed.
const runInDurableObject = _runInDurableObject as unknown as <R>(
	stub: unknown,
	cb: (instance: any) => Promise<R> | R,
) => Promise<R>;

describe("MailboxDO concurrency", () => {
	it("sequential createEmail calls all persist (simulated concurrent load)", async () => {
		const id = env.MAILBOX.idFromName("test-mailbox-concurrency");
		// Cast to non-generic DurableObjectStub to avoid TS2589 deep instantiation
		const stub = env.MAILBOX.get(id) as DurableObjectStub;

		const emailCount = 5;
		const now = new Date().toISOString();
		const emailIds: string[] = Array.from({ length: emailCount }, () => crypto.randomUUID());

		// Insert all emails in a single runInDurableObject call to simulate
		// concurrent access within the same DO tick boundary.
		await runInDurableObject(stub, async (instance: any) => {
			await Promise.all(
				emailIds.map((emailId, i) =>
					instance.createEmail("inbox", {
						id: emailId,
						subject: `Concurrent email ${i}`,
						sender: `sender${i}@example.com`,
						recipient: "recv@example.com",
						date: now,
						body: `Body of email ${i}`,
					}, [])
				)
			);
		});

		// Verify all emails were stored without corruption
		const emails = await runInDurableObject(stub, async (instance: any) => {
			return instance.getEmails({ folder: "inbox", limit: 100 });
		});

		expect(emails.length).toBeGreaterThanOrEqual(emailCount);

		// All inserted IDs should be present
		for (const emailId of emailIds) {
			const found = emails.find((e: any) => e.id === emailId);
			expect(found).toBeDefined();
		}
	});

	it("concurrent markRead calls settle to consistent final state", async () => {
		const id = env.MAILBOX.idFromName("test-mailbox-concurrent-markread");
		const stub = env.MAILBOX.get(id);

		const emailId = crypto.randomUUID();
		const now = new Date().toISOString();

		await runInDurableObject(stub, async (instance: any) => {
			await instance.createEmail("inbox", {
				id: emailId,
				subject: "Concurrent markRead test",
				sender: "a@example.com",
				recipient: "b@example.com",
				date: now,
				body: "body",
				read: false,
			}, []);
		});

		// Fire concurrent updateEmail(read:true) calls — DO serializes them, last write wins
		await runInDurableObject(stub, async (instance: any) => {
			await Promise.all([
				instance.updateEmail(emailId, { read: true }),
				instance.updateEmail(emailId, { read: true }),
				instance.updateEmail(emailId, { read: true }),
			]);
		});

		const emails = await runInDurableObject(stub, async (instance: any) => {
			return instance.getEmails({ folder: "inbox" });
		});

		const found = emails.find((e: any) => e.id === emailId);
		// Final state must be consistent — all calls requested read=true
		expect(found?.read).toBeTruthy();
	});

	it("getAdminMetrics count is consistent after parallel inserts", async () => {
		const id = env.MAILBOX.idFromName("test-mailbox-parallel-metrics");
		const stub = env.MAILBOX.get(id);
		const now = new Date().toISOString();
		const insertCount = 3;

		await runInDurableObject(stub, async (instance: any) => {
			await Promise.all(
				Array.from({ length: insertCount }, (_, i) =>
					instance.createEmail("inbox", {
						id: crypto.randomUUID(),
						subject: `Parallel metric ${i}`,
						sender: "x@example.com",
						recipient: "y@example.com",
						date: now,
						body: "body",
					}, [])
				)
			);
		});

		const metrics = await runInDurableObject(stub, async (instance: any) => {
			return instance.getAdminMetrics();
		});

		expect(metrics.totalEmails).toBeGreaterThanOrEqual(insertCount);
	});
});
