// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

/**
 * Integration test: R2 attachment lifecycle
 *
 * Uses miniflare's in-memory R2 emulation via `env.BUCKET`.
 * Exercises: PUT → GET → byte comparison → DELETE.
 * Note: Workers AI (env.AI) is NOT tested here — AI binding is not emulated
 * by miniflare and any code path hitting it would fail at runtime.
 */

import { env } from "cloudflare:test";
import { describe, it, expect } from "vitest";

describe("R2 attachment lifecycle", () => {
	it("PUT then GET returns identical bytes", async () => {
		const key = `attachments/test-email-id/${crypto.randomUUID()}/hello.txt`;
		const data = new TextEncoder().encode("Hello R2 integration test");

		await env.BUCKET.put(key, data);

		const obj = await env.BUCKET.get(key);
		expect(obj).not.toBeNull();

		const retrieved = new Uint8Array(await obj!.arrayBuffer());
		expect(retrieved).toEqual(data);
	});

	it("DELETE removes the object — GET returns null", async () => {
		const key = `attachments/del-test/${crypto.randomUUID()}/file.bin`;
		const data = new Uint8Array([0x01, 0x02, 0x03]);

		await env.BUCKET.put(key, data);
		const before = await env.BUCKET.get(key);
		expect(before).not.toBeNull();

		await env.BUCKET.delete(key);

		const after = await env.BUCKET.get(key);
		expect(after).toBeNull();
	});

	it("storeAttachments stores base64 content and returns correct metadata", async () => {
		// Import the shared attachment helper directly
		const { storeAttachments } = await import("../../workers/lib/attachments");
		const emailId = crypto.randomUUID();

		const content = btoa("attachment content");
		const stored = await storeAttachments(env.BUCKET as any, emailId, [
			{
				content,
				filename: "test.txt",
				type: "text/plain",
				disposition: "attachment",
			},
		]);

		expect(stored.length).toBe(1);
		expect(stored[0].email_id).toBe(emailId);
		expect(stored[0].filename).toBe("test.txt");
		expect(stored[0].mimetype).toBe("text/plain");
		expect(stored[0].size).toBeGreaterThan(0);

		// Verify the object is actually in R2
		const r2Key = `attachments/${emailId}/${stored[0].id}/test.txt`;
		const obj = await env.BUCKET.get(r2Key);
		expect(obj).not.toBeNull();

		// Verify the bytes round-trip
		const bytes = new Uint8Array(await obj!.arrayBuffer());
		const decoded = new TextDecoder().decode(bytes);
		expect(decoded).toBe("attachment content");
	});
});
