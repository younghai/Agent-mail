import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { classify, type SenderStats } from "../workers/lib/segmentation.ts";

function stats(overrides: Partial<SenderStats> = {}): SenderStats {
	return {
		email: overrides.email ?? "test@example.com",
		domain: overrides.domain ?? "example.com",
		totalMessages: overrides.totalMessages ?? 1,
		lastSeenAt: overrides.lastSeenAt ?? new Date().toISOString(),
		firstSeenAt: overrides.firstSeenAt ?? new Date().toISOString(),
		starred: overrides.starred ?? 0,
	};
}

describe("classify", () => {
	it("returns dormant when last activity > 90 days ago", () => {
		const now = new Date("2026-05-31T12:00:00Z");
		const s = stats({ lastSeenAt: "2026-02-01T00:00:00Z" }); // ~119 days ago
		assert.equal(classify(s, now), "dormant");
	});

	it("returns vip when ≥5 messages and ≥1 starred", () => {
		const now = new Date();
		const s = stats({ totalMessages: 5, starred: 1 });
		assert.equal(classify(s, now), "vip");
	});

	it("returns regular when ≥5 messages but no starred", () => {
		const now = new Date();
		const s = stats({ totalMessages: 5, starred: 0 });
		assert.equal(classify(s, now), "regular");
	});

	it("returns new when <5 messages", () => {
		const now = new Date();
		const s = stats({ totalMessages: 4, starred: 0 });
		assert.equal(classify(s, now), "new");
	});

	it("boundary at exactly 90 days is still active (regular/new path)", () => {
		const now = new Date("2026-05-31T12:00:00Z");
		// Exactly 90 days ago — not > 90, so should NOT be dormant
		const lastSeen = new Date("2026-03-02T12:00:00Z");
		const s = stats({ totalMessages: 5, starred: 0, lastSeenAt: lastSeen.toISOString() });
		// The difference is exactly 90 days → lastDays = 90 → not > 90 → not dormant
		assert.equal(classify(s, now), "regular");
	});

	it("boundary at exactly 5 messages with starred → vip", () => {
		const now = new Date();
		const s = stats({ totalMessages: 5, starred: 1 });
		assert.equal(classify(s, now), "vip");
	});

	it("returns new for empty/zero stats", () => {
		const now = new Date();
		const s = stats({ totalMessages: 0, starred: 0 });
		assert.equal(classify(s, now), "new");
	});

	it("returns vip even with many starred", () => {
		const now = new Date();
		const s = stats({ totalMessages: 10, starred: 5 });
		assert.equal(classify(s, now), "vip");
	});

	it("dormant takes priority over vip", () => {
		const now = new Date("2026-05-31T12:00:00Z");
		const s = stats({ totalMessages: 10, starred: 3, lastSeenAt: "2025-12-01T00:00:00Z" });
		assert.equal(classify(s, now), "dormant");
	});
});
