// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import assert from "node:assert/strict";
import { test } from "node:test";
import { extractCitations } from "../workers/lib/citations.ts";

// ---------------------------------------------------------------------------
// Test 1 — Single email inline marker
// ---------------------------------------------------------------------------

test("parses [#email:abc-123] inline marker → 1 citation of type email", () => {
	const body = "Thanks for your question. As mentioned in the previous thread [#email:abc-123], the deadline is Friday.";
	const { stripped, citations } = extractCitations(body);

	assert.equal(citations.length, 1);
	assert.equal(citations[0].type, "email");
	assert.equal(citations[0].id, "abc-123");
	// Inline marker stays in stripped text
	assert.ok(stripped.includes("[#email:abc-123]"));
});

// ---------------------------------------------------------------------------
// Test 2 — Attachment inline marker
// ---------------------------------------------------------------------------

test("parses [#attachment:att-1] inline marker → type attachment", () => {
	const body = "Please find the updated spec attached [#attachment:att-1].";
	const { stripped, citations } = extractCitations(body);

	assert.equal(citations.length, 1);
	assert.equal(citations[0].type, "attachment");
	assert.equal(citations[0].id, "att-1");
	assert.ok(stripped.includes("[#attachment:att-1]"));
});

// ---------------------------------------------------------------------------
// Test 3 — Multiple inline markers + Sources: block → all parsed, block removed
// ---------------------------------------------------------------------------

test("multiple inline markers + Sources: block → all parsed, block removed", () => {
	const body = `Thanks for reaching out. As discussed [#email:thread-42], the report is ready [#attachment:report-pdf].

The key findings are in the attached document.

Sources:
[#email:thread-42]
[#attachment:report-pdf]`;

	const { stripped, citations } = extractCitations(body);

	assert.equal(citations.length, 2);

	const emailCite = citations.find((c) => c.type === "email");
	assert.ok(emailCite);
	assert.equal(emailCite!.id, "thread-42");

	const attCite = citations.find((c) => c.type === "attachment");
	assert.ok(attCite);
	assert.equal(attCite!.id, "report-pdf");

	// Sources block is removed from stripped
	assert.ok(!stripped.includes("Sources:"));
	// But inline markers remain
	assert.ok(stripped.includes("[#email:thread-42]"));
	assert.ok(stripped.includes("[#attachment:report-pdf]"));
});

// ---------------------------------------------------------------------------
// Test 4 — Sources: block at EOF removed without trailing newline
// ---------------------------------------------------------------------------

test("Sources: block at EOF without trailing newline is removed", () => {
	const body = "Here is the answer [#email:msg-99].\n\nSources:\n[#email:msg-99]";
	const { stripped, citations } = extractCitations(body);

	assert.equal(citations.length, 1);
	assert.equal(citations[0].type, "email");
	assert.equal(citations[0].id, "msg-99");

	// Sources block removed
	assert.ok(!stripped.includes("Sources:"));
	assert.equal(stripped.trim(), "Here is the answer [#email:msg-99].");
});

// ---------------------------------------------------------------------------
// Test 5 — Empty body or no markers → {stripped: body, citations: []}
// ---------------------------------------------------------------------------

test("empty body → {stripped: body, citations: []}", () => {
	const result1 = extractCitations("");
	assert.equal(result1.stripped, "");
	assert.deepEqual(result1.citations, []);
});

test("body with no markers → {stripped: body, citations: []}", () => {
	const body = "Just a plain email with no citations.";
	const result = extractCitations(body);
	assert.equal(result.stripped, body);
	assert.deepEqual(result.citations, []);
});

// ---------------------------------------------------------------------------
// Test 6 — Duplicate (type, id) deduplicated
// ---------------------------------------------------------------------------

test("duplicate (type, id) citations are deduplicated", () => {
	const body = "See email A [#email:dup-1] and also email B which references the same [#email:dup-1].";

	const { citations } = extractCitations(body);

	assert.equal(citations.length, 1);
	assert.equal(citations[0].type, "email");
	assert.equal(citations[0].id, "dup-1");
});
