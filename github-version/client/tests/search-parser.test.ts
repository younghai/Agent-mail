import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseSearchQuery } from "../app/lib/search-parser.ts";

describe("parseSearchQuery", () => {
	it("leaves plain text as the free-text query", () => {
		assert.deepEqual(parseSearchQuery("OLED launch"), { query: "OLED launch" });
	});

	it("turns each advertised operator into the parameter the mail server filters on", () => {
		// The mail server's contract suite sends exactly these parameters
		// (mail-server/tests/e2e/contract.test.js); keep both lists in step.
		const cases: Array<[string, Record<string, unknown>]> = [
			["from:lg.example subject:런칭", { query: "", from: "lg.example", subject: "런칭" }],
			["in:inbox is:starred", { query: "", folder: "inbox", is_starred: true }],
			["in:draft", { query: "", folder: "draft" }],
			["is:unread", { query: "", is_read: false }],
			["has:attachment", { query: "", has_attachment: true }],
			["after:2026-11-01 SKYPASS", { query: "SKYPASS", date_start: "2026-11-01T00:00:00.000Z" }],
			["before:2020-01-01", { query: "", date_end: "2020-01-01T00:00:00.000Z" }],
		];
		for (const [input, expected] of cases) assert.deepEqual(parseSearchQuery(input), expected, input);
	});

	it("keeps quoted values whole and ignores operators it does not know", () => {
		assert.deepEqual(parseSearchQuery('from:"John Doe" is:bogus'), { query: "", from: "John Doe" });
	});
});
