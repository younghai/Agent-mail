import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
	evaluateRules,
	matchesRule,
	type RoutingRule,
} from "../workers/lib/routing-rules.ts";

function rule(overrides: Partial<RoutingRule> = {}): RoutingRule {
	return {
		id: overrides.id ?? "r1",
		name: overrides.name ?? "Test rule",
		priority: overrides.priority ?? 0,
		enabled: overrides.enabled ?? true,
		match: overrides.match ?? [
			{ field: "sender", op: "contains", value: "acme.com" },
		],
		action: overrides.action ?? { type: "move", folderId: "archive" },
	};
}

describe("matchesRule", () => {
	it("returns false when rule is disabled", () => {
		const r = rule({ enabled: false });
		assert.equal(matchesRule({ sender: "x@acme.com" }, r), false);
	});

	it("returns false when match list is empty", () => {
		const r = rule({ match: [] });
		assert.equal(matchesRule({ sender: "x@acme.com" }, r), false);
	});

	it("matches contains case-insensitively by default", () => {
		const r = rule();
		assert.equal(matchesRule({ sender: "X@ACME.COM" }, r), true);
	});

	it("respects caseSensitive flag", () => {
		const r = rule({
			match: [
				{ field: "sender", op: "contains", value: "acme.com", caseSensitive: true },
			],
		});
		assert.equal(matchesRule({ sender: "X@ACME.COM" }, r), false);
		assert.equal(matchesRule({ sender: "x@acme.com" }, r), true);
	});

	it("supports equals/startsWith/endsWith", () => {
		assert.equal(
			matchesRule({ subject: "Re: hello" }, rule({
				match: [{ field: "subject", op: "startsWith", value: "Re:" }],
			})),
			true,
		);
		assert.equal(
			matchesRule({ subject: "hello world" }, rule({
				match: [{ field: "subject", op: "endsWith", value: "world" }],
			})),
			true,
		);
		assert.equal(
			matchesRule({ subject: "hello" }, rule({
				match: [{ field: "subject", op: "equals", value: "hello" }],
			})),
			true,
		);
	});

	it("supports regex with case-insensitive flag", () => {
		const r = rule({
			match: [{ field: "subject", op: "regex", value: "^urgent" }],
		});
		assert.equal(matchesRule({ subject: "URGENT: server down" }, r), true);
		assert.equal(matchesRule({ subject: "later: maybe urgent" }, r), false);
	});

	it("treats invalid regex as never-match (fail-safe)", () => {
		const r = rule({
			match: [{ field: "subject", op: "regex", value: "[" }],
		});
		assert.equal(matchesRule({ subject: "anything" }, r), false);
	});

	it("requires ALL matches to pass (AND semantics)", () => {
		const r = rule({
			match: [
				{ field: "sender", op: "contains", value: "acme.com" },
				{ field: "subject", op: "contains", value: "invoice" },
			],
		});
		assert.equal(
			matchesRule({ sender: "x@acme.com", subject: "invoice #42" }, r),
			true,
		);
		assert.equal(
			matchesRule({ sender: "x@acme.com", subject: "hello" }, r),
			false,
		);
	});

	it("treats missing fields as empty strings", () => {
		const r = rule({
			match: [{ field: "body", op: "contains", value: "urgent" }],
		});
		assert.equal(matchesRule({ sender: "x@y.com" }, r), false);
	});
});

describe("evaluateRules", () => {
	it("returns null when no rules match", () => {
		const result = evaluateRules({ sender: "x@other.com" }, [rule()]);
		assert.equal(result, null);
	});

	it("picks the highest-priority matching rule", () => {
		const low = rule({ id: "low", priority: 0, action: { type: "mark_read" } });
		const high = rule({
			id: "high",
			priority: 100,
			action: { type: "move", folderId: "vip" },
		});
		const result = evaluateRules({ sender: "x@acme.com" }, [low, high]);
		assert.equal(result?.rule.id, "high");
		assert.equal(result?.action.type, "move");
		assert.equal(result?.action.folderId, "vip");
	});

	it("skips disabled rules even when they would otherwise match", () => {
		const disabled = rule({
			id: "disabled",
			priority: 100,
			enabled: false,
			action: { type: "move", folderId: "vip" },
		});
		const enabled = rule({
			id: "enabled",
			priority: 0,
			action: { type: "mark_read" },
		});
		const result = evaluateRules({ sender: "x@acme.com" }, [disabled, enabled]);
		assert.equal(result?.rule.id, "enabled");
	});

	it("does not mutate the input rules array order", () => {
		const a = rule({ id: "a", priority: 0 });
		const b = rule({ id: "b", priority: 100 });
		const input = [a, b];
		evaluateRules({ sender: "x@acme.com" }, input);
		assert.deepEqual(input.map((r) => r.id), ["a", "b"]);
	});
});
