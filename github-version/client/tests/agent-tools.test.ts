// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

/**
 * Integration tests for the 9 EmailAgent tools.
 *
 * Strategy: each tool delegates to a standalone function in workers/lib/tools.ts
 * which calls methods on a mailbox DO stub. We provide a per-method configurable
 * mock stub and verify:
 *   (a) the correct stub method was called with the expected arguments
 *   (b) the tool returns the expected shape
 *
 * The createEmailTools wrapper is tested separately for rate-limit enforcement
 * on draft_reply and draft_email (the only two tools that call guardRateLimit).
 *
 * Notably excluded: runVerifyDraft=true paths (would require mocking env.AI).
 */

import assert from "node:assert/strict";
import { test } from "node:test";

import {
	toolListEmails,
	toolGetEmail,
	toolGetThread,
	toolSearchEmails,
	toolDraftReply,
	toolDraftEmail,
	toolMarkEmailRead,
	toolMoveEmail,
	toolDiscardDraft,
} from "../workers/lib/tools.ts";
import { createEmailTools } from "../workers/agent/tools-factory.ts";
import type { RateLimitStorage } from "../workers/lib/rate-limit/limiter.ts";
import { Folders } from "../shared/folders.ts";

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

type StubCall = { method: string; args: unknown[] };

function makeMailboxStub() {
	const calls: StubCall[] = [];
	const returns: Record<string, unknown> = {};

	const stub = new Proxy(
		{},
		{
			get(_target, prop: string) {
				if (prop === "_calls") return calls;
				if (prop === "_returns") return returns;
				return async (...args: unknown[]) => {
					calls.push({ method: prop, args });
					// Return the configured value for this method (default undefined)
					return returns[prop];
				};
			},
		},
	) as {
		_calls: StubCall[];
		_returns: Record<string, unknown>;
		[key: string]: unknown;
	};

	return stub;
}

type MockStub = ReturnType<typeof makeMailboxStub>;

/** Build a minimal Env whose MAILBOX.get() returns the given stub. */
function makeEnv(stub: MockStub) {
	const fakeId = Symbol("doId");
	return {
		MAILBOX: {
			idFromName: (_name: string) => fakeId,
			get: (_id: unknown) => stub,
		},
		AI: {},
		BUCKET: { get: async () => null, list: async () => ({ objects: [] }), put: async () => {} },
		ADMIN: {
			idFromName: (_name: string) => Symbol("adminId"),
			get: () => ({
				recordAgentUsage: async () => {},
				recordCostAndCheck: async () => ({
					withinDailyBudget: true,
					withinMonthlyBudget: true,
					dailyUsedUsd: 0,
					dailyLimitUsd: 10,
					monthlyUsedUsd: 0,
					monthlyLimitUsd: 100,
				}),
			}),
		},
		EMAIL: { send: async () => {} },
		DOMAINS: "example.com",
		RATE_LIMIT_PER_MINUTE: "20",
		RATE_LIMIT_PER_DAY: "500",
	} as unknown as import("../workers/types.ts").Env;
}

/** Map-backed RateLimitStorage compatible with checkRateLimit. */
function makeRateLimitStorage(): RateLimitStorage {
	const store = new Map<string, unknown>();
	return {
		async get<T = unknown>(key: string): Promise<T | undefined> {
			return store.get(key) as T | undefined;
		},
		async put(key: string, value: unknown): Promise<void> {
			store.set(key, value);
		},
	};
}

/** Pre-seeded storage that has already exhausted the limit for a given key prefix. */
function makeBlockingStorage(mailboxId: string): RateLimitStorage {
	const store = new Map<string, unknown>();
	// The key format is: rate-limit:agent:<mailboxId>:minute:<windowStart>
	// We set a large value so any window is already over the limit.
	// checkRateLimit computes the window key at call time, so we seed every possible
	// window around now by setting 999 for all likely keys.
	const windowSeconds = 60;
	const windowMs = windowSeconds * 1000;
	const now = Date.now();
	const windowStart = Math.floor(now / windowMs) * windowMs;
	const key = `rate-limit:agent:${mailboxId}:minute:${windowStart}`;
	store.set(key, 999); // well above any limit
	return {
		async get<T = unknown>(k: string): Promise<T | undefined> {
			return store.get(k) as T | undefined;
		},
		async put(k: string, value: unknown): Promise<void> {
			store.set(k, value);
		},
	};
}

const MAILBOX_ID = "user@example.com";

// ---------------------------------------------------------------------------
// list_emails — 2 tests
// ---------------------------------------------------------------------------

test("list_emails: calls stub.getEmails with correct folder and pagination", async () => {
	const stub = makeMailboxStub();
	const fakeList = [{ id: "e1", subject: "Hello" }];
	stub._returns.getEmails = fakeList;
	const env = makeEnv(stub);

	const result = await toolListEmails(env, MAILBOX_ID, {
		folder: Folders.INBOX,
		limit: 10,
		page: 2,
	});

	assert.equal(stub._calls.length, 1);
	const call = stub._calls[0];
	assert.equal(call.method, "getEmails");
	const arg = call.args[0] as Record<string, unknown>;
	assert.equal(arg.folder, Folders.INBOX);
	assert.equal(arg.limit, 10);
	assert.equal(arg.page, 2);
	assert.equal(arg.sortColumn, "date");
	assert.equal(arg.sortDirection, "DESC");
	assert.deepEqual(result, fakeList);
});

test("list_emails: returns stub result unchanged for sent folder", async () => {
	const stub = makeMailboxStub();
	stub._returns.getEmails = [];
	const env = makeEnv(stub);

	const result = await toolListEmails(env, MAILBOX_ID, {
		folder: Folders.SENT,
		limit: 20,
		page: 1,
	});

	const call = stub._calls[0];
	assert.equal((call.args[0] as Record<string, unknown>).folder, Folders.SENT);
	assert.deepEqual(result, []);
});

// ---------------------------------------------------------------------------
// get_email — 2 tests
// ---------------------------------------------------------------------------

test("get_email: returns enriched email when found", async () => {
	const stub = makeMailboxStub();
	stub._returns.getEmail = {
		id: "e42",
		subject: "Test",
		sender: "alice@example.com",
		recipient: MAILBOX_ID,
		date: "2026-01-01T00:00:00Z",
		read: false,
		starred: false,
		body: "<p>Hello</p>",
	};
	const env = makeEnv(stub);

	const result = (await toolGetEmail(env, MAILBOX_ID, "e42")) as Record<string, unknown>;

	assert.equal(stub._calls.length, 1);
	assert.equal(stub._calls[0].method, "getEmail");
	assert.deepEqual(stub._calls[0].args, ["e42"]);
	assert.equal(result.id, "e42");
	// getFullEmail attaches body_text and body_html
	assert.ok("body_text" in result, "should include body_text");
	assert.ok("body_html" in result, "should include body_html");
});

test("get_email: returns error object when email not found", async () => {
	const stub = makeMailboxStub();
	stub._returns.getEmail = null;
	const env = makeEnv(stub);

	const result = (await toolGetEmail(env, MAILBOX_ID, "missing-id")) as Record<string, unknown>;

	assert.equal(result.error, "Email not found");
});

// ---------------------------------------------------------------------------
// get_thread — 2 tests
// ---------------------------------------------------------------------------

test("get_thread: calls stub.getThreadEmails with threadId", async () => {
	const stub = makeMailboxStub();
	stub._returns.getThreadEmails = [
		{
			id: "e1",
			subject: "Thread subject",
			sender: "alice@example.com",
			recipient: MAILBOX_ID,
			date: "2026-01-01T00:00:00Z",
			read: true,
			starred: false,
			body: "<p>First message</p>",
		},
	];
	const env = makeEnv(stub);

	const result = (await toolGetThread(env, MAILBOX_ID, "thread-123")) as Record<string, unknown>;

	assert.equal(stub._calls.length, 1);
	assert.equal(stub._calls[0].method, "getThreadEmails");
	assert.deepEqual(stub._calls[0].args, ["thread-123"]);
	assert.equal(result.thread_id, "thread-123");
	assert.equal(result.message_count, 1);
});

test("get_thread: returns empty thread for no messages", async () => {
	const stub = makeMailboxStub();
	stub._returns.getThreadEmails = [];
	const env = makeEnv(stub);

	const result = (await toolGetThread(env, MAILBOX_ID, "thread-empty")) as Record<string, unknown>;

	assert.equal(result.thread_id, "thread-empty");
	assert.equal(result.message_count, 0);
	assert.deepEqual(result.messages, []);
});

// ---------------------------------------------------------------------------
// search_emails — 2 tests
// ---------------------------------------------------------------------------

test("search_emails: forwards query and folder to stub.searchEmails", async () => {
	const stub = makeMailboxStub();
	const fakeResults = [{ id: "e99", subject: "Matching email" }];
	stub._returns.searchEmails = fakeResults;
	const env = makeEnv(stub);

	const result = await toolSearchEmails(env, MAILBOX_ID, {
		query: "invoice",
		folder: Folders.INBOX,
	});

	assert.equal(stub._calls.length, 1);
	assert.equal(stub._calls[0].method, "searchEmails");
	const arg = stub._calls[0].args[0] as Record<string, unknown>;
	assert.equal(arg.query, "invoice");
	assert.equal(arg.folder, Folders.INBOX);
	assert.deepEqual(result, fakeResults);
});

test("search_emails: works without folder filter and returns empty array", async () => {
	const stub = makeMailboxStub();
	stub._returns.searchEmails = [];
	const env = makeEnv(stub);

	const result = await toolSearchEmails(env, MAILBOX_ID, { query: "nothing" });

	const arg = stub._calls[0].args[0] as Record<string, unknown>;
	assert.equal(arg.query, "nothing");
	assert.equal(arg.folder, undefined);
	assert.deepEqual(result, []);
});

// ---------------------------------------------------------------------------
// draft_reply — 2 tests (runVerifyDraft=false to avoid env.AI dependency)
// ---------------------------------------------------------------------------

test("draft_reply: calls stub.createEmail in draft folder and returns draft_saved status", async () => {
	const stub = makeMailboxStub();
	// getEmail is called to retrieve the original for thread_id / quoted block
	stub._returns.getEmail = null; // no original found — thread_id defaults to originalEmailId
	const env = makeEnv(stub);

	const result = (await toolDraftReply(env, MAILBOX_ID, {
		originalEmailId: "orig-1",
		to: "alice@example.com",
		subject: "Re: Test",
		body: "Thanks for reaching out.",
		isPlainText: true,
		runVerifyDraft: false,
	})) as Record<string, unknown>;

	assert.equal(result.status, "draft_saved");
	assert.ok(typeof result.draftId === "string" && result.draftId.length > 0);

	// createEmail must be called with the DRAFT folder
	const createCall = stub._calls.find((c) => c.method === "createEmail");
	assert.ok(createCall, "createEmail should be called");
	assert.equal(createCall!.args[0], Folders.DRAFT);
	const emailData = createCall!.args[1] as Record<string, unknown>;
	assert.equal(emailData.recipient, "alice@example.com");
	assert.equal(emailData.subject, "Re: Test");
});

test("draft_reply: includes original email context when original exists", async () => {
	const stub = makeMailboxStub();
	stub._returns.getEmail = {
		id: "orig-2",
		subject: "Hello",
		sender: "bob@example.com",
		recipient: MAILBOX_ID,
		date: "2026-01-01T10:00:00Z",
		read: true,
		starred: false,
		thread_id: "thread-abc",
		body: "<p>Original body</p>",
	};
	const env = makeEnv(stub);

	const result = (await toolDraftReply(env, MAILBOX_ID, {
		originalEmailId: "orig-2",
		to: "bob@example.com",
		subject: "Re: Hello",
		body: "Got it.",
		isPlainText: true,
		runVerifyDraft: false,
	})) as Record<string, unknown>;

	assert.equal(result.status, "draft_saved");
	const createCall = stub._calls.find((c) => c.method === "createEmail");
	const emailData = createCall!.args[1] as Record<string, unknown>;
	// thread_id should be inherited from the original
	assert.equal(emailData.thread_id, "thread-abc");
	assert.equal(emailData.in_reply_to, "orig-2");
});

// ---------------------------------------------------------------------------
// draft_email — 2 tests
// ---------------------------------------------------------------------------

test("draft_email: calls stub.createEmail in draft folder with correct fields", async () => {
	const stub = makeMailboxStub();
	const env = makeEnv(stub);

	const result = (await toolDraftEmail(env, MAILBOX_ID, {
		to: "carol@example.com",
		subject: "New Project",
		body: "Hi Carol, let's connect.",
		isPlainText: true,
		runVerifyDraft: false,
	})) as Record<string, unknown>;

	assert.equal(result.status, "draft_saved");
	assert.ok(typeof result.draftId === "string");

	const createCall = stub._calls.find((c) => c.method === "createEmail");
	assert.ok(createCall, "createEmail should be called");
	assert.equal(createCall!.args[0], Folders.DRAFT);
	const emailData = createCall!.args[1] as Record<string, unknown>;
	assert.equal(emailData.recipient, "carol@example.com");
	assert.equal(emailData.subject, "New Project");
});

test("draft_email: resolves thread_id from in_reply_to when no thread_id provided", async () => {
	const stub = makeMailboxStub();
	stub._returns.getEmail = {
		id: "orig-3",
		subject: "Existing",
		sender: "dave@example.com",
		recipient: MAILBOX_ID,
		date: "2026-01-02T00:00:00Z",
		read: false,
		starred: false,
		thread_id: "thread-xyz",
		body: null,
	};
	const env = makeEnv(stub);

	const result = (await toolDraftEmail(env, MAILBOX_ID, {
		to: "dave@example.com",
		subject: "Re: Existing",
		body: "Replying.",
		isPlainText: true,
		runVerifyDraft: false,
		in_reply_to: "orig-3",
	})) as Record<string, unknown>;

	assert.equal(result.status, "draft_saved");
	// thread_id resolved from original email's thread_id
	assert.equal(result.threadId, "thread-xyz");
});

// ---------------------------------------------------------------------------
// mark_email_read — 2 tests
// ---------------------------------------------------------------------------

test("mark_email_read: calls stub.updateEmail with read=true", async () => {
	const stub = makeMailboxStub();
	const env = makeEnv(stub);

	const result = (await toolMarkEmailRead(env, MAILBOX_ID, "e-read-1", true)) as Record<string, unknown>;

	assert.equal(stub._calls.length, 1);
	assert.equal(stub._calls[0].method, "updateEmail");
	assert.equal(stub._calls[0].args[0], "e-read-1");
	assert.deepEqual(stub._calls[0].args[1], { read: true });
	assert.equal(result.status, "updated");
	assert.equal(result.emailId, "e-read-1");
	assert.equal(result.read, true);
});

test("mark_email_read: calls stub.updateEmail with read=false (mark unread)", async () => {
	const stub = makeMailboxStub();
	const env = makeEnv(stub);

	const result = (await toolMarkEmailRead(env, MAILBOX_ID, "e-read-2", false)) as Record<string, unknown>;

	assert.equal(stub._calls[0].args[1 as unknown as number] as Record<string, unknown>, stub._calls[0].args[1]);
	const updateArg = stub._calls[0].args[1] as Record<string, unknown>;
	assert.equal(updateArg.read, false);
	assert.equal(result.read, false);
});

// ---------------------------------------------------------------------------
// move_email — 2 tests
// ---------------------------------------------------------------------------

test("move_email: calls stub.moveEmail and returns moved status on success", async () => {
	const stub = makeMailboxStub();
	stub._returns.moveEmail = true;
	const env = makeEnv(stub);

	const result = (await toolMoveEmail(env, MAILBOX_ID, "e-move-1", Folders.ARCHIVE)) as Record<string, unknown>;

	assert.equal(stub._calls.length, 1);
	assert.equal(stub._calls[0].method, "moveEmail");
	assert.equal(stub._calls[0].args[0], "e-move-1");
	assert.equal(stub._calls[0].args[1], Folders.ARCHIVE);
	assert.equal(result.status, "moved");
	assert.equal(result.folder, Folders.ARCHIVE);
});

test("move_email: returns error object when stub returns falsy", async () => {
	const stub = makeMailboxStub();
	stub._returns.moveEmail = false;
	const env = makeEnv(stub);

	const result = (await toolMoveEmail(env, MAILBOX_ID, "e-move-2", Folders.TRASH)) as Record<string, unknown>;

	assert.ok("error" in result, "should return error object");
	assert.equal(result.error, "Failed to move email");
});

// ---------------------------------------------------------------------------
// discard_draft — 3 tests
// ---------------------------------------------------------------------------

test("discard_draft: calls stub.deleteEmail and returns discarded status", async () => {
	const stub = makeMailboxStub();
	stub._returns.getEmail = { id: "d1", folder_id: Folders.DRAFT };
	const env = makeEnv(stub);

	const result = (await toolDiscardDraft(env, MAILBOX_ID, "d1")) as Record<string, unknown>;

	const deleteCall = stub._calls.find((c) => c.method === "deleteEmail");
	assert.ok(deleteCall, "deleteEmail should be called");
	assert.equal(deleteCall!.args[0], "d1");
	assert.equal(result.status, "discarded");
	assert.equal(result.draftId, "d1");
});

test("discard_draft: returns error when draft not found", async () => {
	const stub = makeMailboxStub();
	stub._returns.getEmail = null;
	const env = makeEnv(stub);

	const result = (await toolDiscardDraft(env, MAILBOX_ID, "missing-draft")) as Record<string, unknown>;

	assert.equal(result.error, "Draft not found");
	// deleteEmail must NOT be called
	const deleteCall = stub._calls.find((c) => c.method === "deleteEmail");
	assert.equal(deleteCall, undefined);
});

test("discard_draft: returns error when email is not in draft folder", async () => {
	const stub = makeMailboxStub();
	stub._returns.getEmail = { id: "e-inbox", folder_id: Folders.INBOX };
	const env = makeEnv(stub);

	const result = (await toolDiscardDraft(env, MAILBOX_ID, "e-inbox")) as Record<string, unknown>;

	assert.equal(result.error, "Cannot discard: email is not a draft");
	const deleteCall = stub._calls.find((c) => c.method === "deleteEmail");
	assert.equal(deleteCall, undefined);
});

// ---------------------------------------------------------------------------
// Rate limit enforcement via createEmailTools wrapper — 4 tests
// ---------------------------------------------------------------------------

test("draft_reply tool: rate-limited — returns error object, stub not called", async () => {
	const stub = makeMailboxStub();
	const env = makeEnv(stub);
	const blockingStorage = makeBlockingStorage(MAILBOX_ID);

	const tools = createEmailTools(env, MAILBOX_ID, blockingStorage);
	const result = (await tools.draft_reply.execute({
		originalEmailId: "orig-rl",
		to: "alice@example.com",
		subject: "Re: Rate limited",
		body: "Hello",
	})) as Record<string, unknown>;

	assert.ok("error" in result, "should return error when rate limited");
	assert.ok(typeof result.retryAfterSeconds === "number");
	// mailbox stub must not have been touched
	assert.equal(stub._calls.length, 0);
});

test("draft_reply tool: allowed — delegates to toolDraftReply", async () => {
	const stub = makeMailboxStub();
	stub._returns.getEmail = null;
	const env = makeEnv(stub);
	const storage = makeRateLimitStorage();

	const tools = createEmailTools(env, MAILBOX_ID, storage);
	await tools.draft_reply.execute({
		originalEmailId: "orig-ok",
		to: "alice@example.com",
		subject: "Re: OK",
		body: "Hello",
	});

	// Key assertion: stub WAS called (rate limit did not block)
	assert.ok(stub._calls.length > 0, "stub should have been called when allowed");
});

test("draft_email tool: rate-limited — returns error object, stub not called", async () => {
	const stub = makeMailboxStub();
	const env = makeEnv(stub);
	const blockingStorage = makeBlockingStorage(MAILBOX_ID);

	const tools = createEmailTools(env, MAILBOX_ID, blockingStorage);
	const result = (await tools.draft_email.execute({
		to: "carol@example.com",
		subject: "Rate limited",
		body: "Blocked",
	})) as Record<string, unknown>;

	assert.ok("error" in result, "should return error when rate limited");
	assert.ok(typeof result.retryAfterSeconds === "number");
	assert.equal(stub._calls.length, 0);
});

test("draft_email tool: allowed — delegates to toolDraftEmail", async () => {
	const stub = makeMailboxStub();
	const env = makeEnv(stub);
	const storage = makeRateLimitStorage();

	const tools = createEmailTools(env, MAILBOX_ID, storage);
	const result = (await tools.draft_email.execute({
		to: "carol@example.com",
		subject: "New Email",
		body: "Hello Carol.",
	})) as Record<string, unknown>;

	assert.ok(stub._calls.length > 0, "stub should have been called when allowed");
	// When allowed, result should be draft_saved (not an error)
	assert.equal(result.status, "draft_saved");
});
