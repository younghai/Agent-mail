// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

/**
 * Standalone email-ingest processor with injected dependencies.
 *
 * This module isolates the core ingest pipeline so it can be tested in plain
 * Node.js without Cloudflare Worker runtime globals.
 *
 * The real `receiveEmail` in workers/index.ts embeds allowed-address
 * filtering, mailbox-existence checks, PostalMime parsing, threading
 * resolution, attachment storage, and an agent trigger.  This processor
 * covers the narrower "store raw bytes → R2, then notify DO" sub-pipeline
 * that is easiest to unit-test with mocks.
 *
 * NOTE: Integration with the real receiveEmail is left as a follow-up.
 */

export interface ForwardableEmailLike {
	from: string;
	to: string;
	headers: Headers;
	raw: ReadableStream<Uint8Array>;
}

export interface IngestDeps {
	r2Put: (key: string, body: ArrayBuffer) => Promise<void>;
	mailboxStub: {
		saveIncomingEmail: (msg: {
			from: string;
			to: string;
			rawKey: string;
		}) => Promise<unknown>;
	};
	parseRawEmail: (
		raw: ArrayBuffer,
	) => Promise<{ subject: string; date: string; messageId: string }>;
}

export interface IngestResult {
	stored: boolean;
	mailboxId: string;
	rawKey: string;
}

/**
 * Process an incoming email message:
 * 1. Drain the ReadableStream into an ArrayBuffer.
 * 2. Parse metadata from the raw bytes.
 * 3. Store the raw bytes in R2.
 * 4. Notify the mailbox DO stub.
 *
 * Throws if any step fails; callers should handle errors per their retry
 * and bounce policies.
 */
export async function processIncomingEmail(
	msg: ForwardableEmailLike,
	deps: IngestDeps,
): Promise<IngestResult> {
	// 1. Drain ReadableStream into a single ArrayBuffer.
	const chunks: Uint8Array[] = [];
	const reader = msg.raw.getReader();
	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		if (value) chunks.push(value);
	}
	const totalLen = chunks.reduce((acc, c) => acc + c.byteLength, 0);
	const combined = new Uint8Array(totalLen);
	let offset = 0;
	for (const c of chunks) {
		combined.set(c, offset);
		offset += c.byteLength;
	}

	// 2. Parse metadata (subject, date, message-id).
	const parsed = await deps.parseRawEmail(combined.buffer as ArrayBuffer);

	// 3. Derive storage key and write raw bytes to R2.
	const mailboxId = msg.to.split("@")[0];
	const rawKey = `incoming/${mailboxId}/${parsed.messageId}.eml`;
	await deps.r2Put(rawKey, combined.buffer as ArrayBuffer);

	// 4. Notify the mailbox DO.
	await deps.mailboxStub.saveIncomingEmail({
		from: msg.from,
		to: msg.to,
		rawKey,
	});

	return { stored: true, mailboxId, rawKey };
}
