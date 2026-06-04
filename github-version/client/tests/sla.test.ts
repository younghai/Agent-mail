import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { computeSlaMetrics } from "../workers/lib/sla.ts";

const NOW = new Date("2026-05-31T12:00:00Z");

describe("computeSlaMetrics", () => {
	it("returns zeroes for empty input", () => {
		const result = computeSlaMetrics({
			received: [],
			replies: [],
			now: NOW,
			window: "7d",
		});

		assert.equal(result.totalReceived, 0);
		assert.equal(result.totalReplied, 0);
		assert.equal(result.unreplied, 0);
		assert.equal(result.avgResponseHours, 0);
		assert.equal(result.p50ResponseHours, 0);
		assert.equal(result.p90ResponseHours, 0);
		assert.equal(result.overdue.length, 0);
		assert.equal(result.trend.length, 0);
		assert.equal(result.window, "7d");
	});

	it("computes average response time across multiple reply pairs", () => {
		const received = [
			{ id: "r1", subject: "Hello", sender: "a@x.com", date: "2026-05-31T10:00:00Z" },
			{ id: "r2", subject: "World", sender: "b@x.com", date: "2026-05-31T08:00:00Z" },
		];
		const replies = [
			{ id: "s1", in_reply_to: "r1", date: "2026-05-31T11:00:00Z" }, // 1h
			{ id: "s2", in_reply_to: "r2", date: "2026-05-31T10:00:00Z" }, // 2h
		];

		const result = computeSlaMetrics({ received, replies, now: NOW, window: "24h" });

		assert.equal(result.totalReceived, 2);
		assert.equal(result.totalReplied, 2);
		assert.equal(result.unreplied, 0);
		// avg = (1 + 2) / 2 = 1.5
		assert.equal(result.avgResponseHours, 1.5);
	});

	it("computes P50 and P90 correctly on a small dataset", () => {
		// 10 emails with response times 1..10 hours
		const received = Array.from({ length: 10 }, (_, i) => ({
			id: `r${i}`,
			subject: `Sub ${i}`,
			sender: `s${i}@x.com`,
			date: `2026-05-31T00:00:00Z`,
		}));
		const replies = Array.from({ length: 10 }, (_, i) => ({
			id: `s${i}`,
			in_reply_to: `r${i}`,
			date: new Date(Date.UTC(2026, 4, 31, i + 1, 0, 0)).toISOString(), // 1h..10h
		}));

		const result = computeSlaMetrics({ received, replies, now: NOW, window: "24h" });

		// sorted: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
		// P50: floor(10 * 0.5) = index 5 → 6
		assert.equal(result.p50ResponseHours, 6);
		// P90: floor(10 * 0.9) = index 9 → 10
		assert.equal(result.p90ResponseHours, 10);
	});

	it("includes overdue emails (no reply, >24h old)", () => {
		// Email received 48h ago, no reply
		const received = [
			{ id: "r1", subject: "Old email", sender: "old@x.com", date: "2026-05-29T12:00:00Z" },
		];
		const replies: Array<{ id: string; in_reply_to: string; date: string }> = [];

		const result = computeSlaMetrics({ received, replies, now: NOW, window: "7d" });

		assert.equal(result.overdue.length, 1);
		assert.equal(result.overdue[0].id, "r1");
		assert.equal(result.overdue[0].subject, "Old email");
		// age_hours ≈ 48
		assert.ok(result.overdue[0].age_hours >= 47.9);
		assert.ok(result.overdue[0].age_hours <= 48.1);
	});

	it("excludes replied emails and young emails from overdue", () => {
		const received = [
			// Replied → not overdue
			{ id: "r1", subject: "Replied old", sender: "a@x.com", date: "2026-05-29T12:00:00Z" },
			// Young (<24h) → not overdue
			{ id: "r2", subject: "Recent", sender: "b@x.com", date: "2026-05-31T10:00:00Z" },
		];
		const replies = [
			{ id: "s1", in_reply_to: "r1", date: "2026-05-29T13:00:00Z" },
		];

		const result = computeSlaMetrics({ received, replies, now: NOW, window: "7d" });

		assert.equal(result.overdue.length, 0);
		assert.equal(result.unreplied, 1); // r2 is unreplied but not overdue
	});

	it("buckets daily trend with mixed days", () => {
		const received = [
			{ id: "r1", subject: "A", sender: "a@x.com", date: "2026-05-30T10:00:00Z" },
			{ id: "r2", subject: "B", sender: "b@x.com", date: "2026-05-30T14:00:00Z" },
			{ id: "r3", subject: "C", sender: "c@x.com", date: "2026-05-31T08:00:00Z" },
		];
		const replies = [
			{ id: "s1", in_reply_to: "r1", date: "2026-05-30T12:00:00Z" }, // 2h reply to r1
			{ id: "s2", in_reply_to: "r3", date: "2026-05-31T09:30:00Z" }, // 1.5h reply to r3
		];

		const result = computeSlaMetrics({ received, replies, now: NOW, window: "7d" });

		assert.equal(result.trend.length, 2);

		// Day 1: 2026-05-30
		const day1 = result.trend.find((t) => t.date === "2026-05-30")!;
		assert.ok(day1);
		assert.equal(day1.received, 2);
		assert.equal(day1.replied, 1);
		assert.equal(day1.avgHours, 2);

		// Day 2: 2026-05-31
		const day2 = result.trend.find((t) => t.date === "2026-05-31")!;
		assert.ok(day2);
		assert.equal(day2.received, 1);
		assert.equal(day2.replied, 1);
		assert.equal(day2.avgHours, 1.5);
	});

	it("caps overdue list at 10 and sorts by age descending", () => {
		// Create 12 overdue emails
		const received = Array.from({ length: 12 }, (_, i) => ({
			id: `r${i}`,
			subject: `Email ${i}`,
			sender: `s${i}@x.com`,
			date: new Date(NOW.getTime() - (25 + i) * 3_600_000).toISOString(), // 25h, 26h, ..., 36h ago
		}));

		const result = computeSlaMetrics({ received, replies: [], now: NOW, window: "30d" });

		assert.equal(result.overdue.length, 10);
		// First should be oldest (most hours overdue)
		assert.ok(result.overdue[0].age_hours > result.overdue[1].age_hours);
		// The last entry should be the 3rd-oldest (since we cap at 10, dropping the 2 youngest)
		assert.ok(result.overdue[9].age_hours >= 25);
	});
});
