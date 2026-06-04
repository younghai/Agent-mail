// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import assert from "node:assert/strict";
import { test } from "node:test";
import {
	processIncomingEmail,
	type ForwardableEmailLike,
	type IngestDeps,
} from "../workers/lib/email-ingest/processor.ts";

// ── Helpers ───────────────────────────────────────────────────────────────────

function rawAsStream(text: string): ReadableStream<Uint8Array> {
	const encoded = new TextEncoder().encode(text);
	return new ReadableStream<Uint8Array>({
		start(controller) {
			controller.enqueue(encoded);
			controller.close();
		},
	});
}

function rawAsChunkedStream(text: string, chunkSize: number): ReadableStream<Uint8Array> {
	const encoded = new TextEncoder().encode(text);
	return new ReadableStream<Uint8Array>({
		start(controller) {
			for (let i = 0; i < encoded.length; i += chunkSize) {
				controller.enqueue(encoded.slice(i, i + chunkSize));
			}
			controller.close();
		},
	});
}

interface MockDeps extends IngestDeps {
	_inspect: () => { r2Calls: Array<{ key: string; size: number }>; doCalls: unknown[] };
}

function createMockDeps(opts: {
	r2Fail?: boolean;
	parseFail?: boolean;
	messageId?: string;
} = {}): MockDeps {
	const r2Calls: Array<{ key: string; size: number }> = [];
	const doCalls: unknown[] = [];
	return {
		r2Put: async (key: string, body: ArrayBuffer) => {
			if (opts.r2Fail) throw new Error("R2 write failed");
			r2Calls.push({ key, size: body.byteLength });
		},
		mailboxStub: {
			saveIncomingEmail: async (msg: unknown) => {
				doCalls.push(msg);
				return { ok: true };
			},
		},
		parseRawEmail: async (_raw: ArrayBuffer) => {
			if (opts.parseFail) throw new Error("Parse failed");
			return {
				subject: "Hello",
				date: "2026-05-08",
				messageId: opts.messageId ?? "msg-1",
			};
		},
		_inspect: () => ({ r2Calls, doCalls }),
	};
}

function makeMsg(to: string, body: string): ForwardableEmailLike {
	return {
		from: "sender@example.com",
		to,
		headers: new Headers({ "Content-Type": "text/plain" }),
		raw: rawAsStream(body),
	};
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test("processes simple email — writes R2 and calls DO", async () => {
	const deps = createMockDeps();
	const result = await processIncomingEmail(makeMsg("alice@example.com", "Hello world"), deps);

	assert.equal(result.stored, true);
	assert.equal(result.mailboxId, "alice");
	assert.ok(result.rawKey.startsWith("incoming/alice/"));
	assert.ok(result.rawKey.endsWith(".eml"));

	const { r2Calls, doCalls } = deps._inspect();
	assert.equal(r2Calls.length, 1);
	assert.equal(doCalls.length, 1);
});

test("extracts mailbox ID from to address (local part only)", async () => {
	const deps = createMockDeps();
	const result = await processIncomingEmail(makeMsg("bob@mail.company.org", "Test"), deps);
	assert.equal(result.mailboxId, "bob");
});

test("rawKey contains messageId returned by parseRawEmail", async () => {
	const deps = createMockDeps({ messageId: "unique-message-id-42" });
	const result = await processIncomingEmail(makeMsg("alice@example.com", "Test"), deps);
	assert.ok(result.rawKey.includes("unique-message-id-42"));
});

test("handles empty body — zero bytes stored, DO still called", async () => {
	const deps = createMockDeps();
	const msg: ForwardableEmailLike = {
		from: "sender@example.com",
		to: "alice@example.com",
		headers: new Headers(),
		raw: new ReadableStream<Uint8Array>({ start(c) { c.close(); } }),
	};
	const result = await processIncomingEmail(msg, deps);
	assert.equal(result.stored, true);
	const { r2Calls, doCalls } = deps._inspect();
	assert.equal(r2Calls[0].size, 0);
	assert.equal(doCalls.length, 1);
});

test("handles large body split across many chunks — full bytes stored", async () => {
	const largeText = "x".repeat(10_000);
	const deps = createMockDeps();
	const msg: ForwardableEmailLike = {
		from: "sender@example.com",
		to: "alice@example.com",
		headers: new Headers(),
		raw: rawAsChunkedStream(largeText, 512),
	};
	const result = await processIncomingEmail(msg, deps);
	assert.equal(result.stored, true);
	const { r2Calls } = deps._inspect();
	const expectedSize = new TextEncoder().encode(largeText).byteLength;
	assert.equal(r2Calls[0].size, expectedSize);
});

test("propagates R2 failure — throws and DO is not called", async () => {
	const deps = createMockDeps({ r2Fail: true });
	await assert.rejects(
		() => processIncomingEmail(makeMsg("alice@example.com", "Test"), deps),
		/R2 write failed/,
	);
	const { doCalls } = deps._inspect();
	assert.equal(doCalls.length, 0, "DO must not be called when R2 fails");
});

test("propagates parse failure — throws, R2 and DO are not called", async () => {
	const deps = createMockDeps({ parseFail: true });
	await assert.rejects(
		() => processIncomingEmail(makeMsg("alice@example.com", "Test"), deps),
		/Parse failed/,
	);
	const { r2Calls, doCalls } = deps._inspect();
	assert.equal(r2Calls.length, 0, "R2 must not be called when parse fails");
	assert.equal(doCalls.length, 0, "DO must not be called when parse fails");
});

test("idempotent same messageId writes same R2 key on two calls", async () => {
	const key1 = await (async () => {
		const deps = createMockDeps({ messageId: "fixed-id" });
		const r = await processIncomingEmail(makeMsg("alice@example.com", "Test"), deps);
		return r.rawKey;
	})();
	const key2 = await (async () => {
		const deps = createMockDeps({ messageId: "fixed-id" });
		const r = await processIncomingEmail(makeMsg("alice@example.com", "Test"), deps);
		return r.rawKey;
	})();
	assert.equal(key1, key2);
});

test("DO is passed correct from/to/rawKey fields", async () => {
	const deps = createMockDeps({ messageId: "msg-99" });
	await processIncomingEmail(makeMsg("charlie@example.com", "Hi"), deps);
	const { doCalls } = deps._inspect();
	const call = doCalls[0] as { from: string; to: string; rawKey: string };
	assert.equal(call.from, "sender@example.com");
	assert.equal(call.to, "charlie@example.com");
	assert.ok(call.rawKey.startsWith("incoming/charlie/msg-99"));
});
