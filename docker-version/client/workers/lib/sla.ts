// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

/**
 * SLA metrics computation — pure helper.
 *
 * Computes response-time percentiles, overdue counts, and daily trends
 * from arrays of received and sent emails. Designed to run on Edge
 * (no Node deps, no I/O) so MailboxDO.getSlaMetrics can call it inline.
 */

export type SlaWindow = "24h" | "7d" | "30d";

export interface SlaMetrics {
	window: string;
	generatedAt: string;
	totalReceived: number;
	totalReplied: number;
	unreplied: number;
	avgResponseHours: number;
	p50ResponseHours: number;
	p90ResponseHours: number;
	overdue: Array<{
		id: string;
		subject: string;
		sender: string;
		age_hours: number;
	}>;
	trend: Array<{
		date: string; // YYYY-MM-DD
		received: number;
		replied: number;
		avgHours: number;
	}>;
}

interface ReceivedEmail {
	id: string;
	subject: string;
	sender: string;
	date: string;
}

interface ReplyEmail {
	id: string;
	in_reply_to: string;
	date: string;
}

const MS_PER_HOUR = 3_600_000;
const HOURS_PER_DAY = 24;

/**
 * Compute SLA metrics from received and reply email arrays.
 *
 * Pairs replies to received emails by `reply.in_reply_to === received.id`.
 * Response time = reply.date − received.date in hours.
 * Percentile = sort ascending, pick at `floor(n * p)` (linear interpolation).
 * Overdue = received with no matching reply where age > 24 h, capped at 10,
 * sorted by age descending.
 * Daily trend = bucket by ISO date (YYYY-MM-DD) for the window;
 *   per-day received count, replied count, avgHours.
 */
export function computeSlaMetrics(input: {
	received: ReceivedEmail[];
	replies: ReplyEmail[];
	now: Date;
	window: SlaWindow;
}): SlaMetrics {
	const { received, replies, now, window: windowStr } = input;

	// Build a map of received email IDs for quick reply matching
	const receivedMap = new Map<string, ReceivedEmail>();
	for (const r of received) {
		receivedMap.set(r.id, r);
	}

	// Pair replies to received emails and compute response times
	const responseTimes: number[] = []; // in hours
	const repliedReceivedIds = new Set<string>();

	for (const reply of replies) {
		const parent = receivedMap.get(reply.in_reply_to);
		if (!parent) continue;

		const replyMs = new Date(reply.date).getTime();
		const parentMs = new Date(parent.date).getTime();
		const hours = (replyMs - parentMs) / MS_PER_HOUR;

		// Only count non-negative response times (protect against clock skew)
		if (hours >= 0) {
			responseTimes.push(hours);
		}
		repliedReceivedIds.add(parent.id);
	}

	// Compute avg
	const avgResponseHours =
		responseTimes.length > 0
			? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
			: 0;

	// Percentile helper (linear, floor index)
	const percentile = (sorted: number[], p: number): number => {
		if (sorted.length === 0) return 0;
		const idx = Math.floor(sorted.length * p);
		return sorted[Math.min(idx, sorted.length - 1)];
	};

	const sorted = [...responseTimes].sort((a, b) => a - b);
	const p50ResponseHours = percentile(sorted, 0.5);
	const p90ResponseHours = percentile(sorted, 0.9);

	// Overdue: received with no reply where age > 24h
	const nowMs = now.getTime();
	const overdue = received
		.filter((r) => {
			if (repliedReceivedIds.has(r.id)) return false;
			const ageHours = (nowMs - new Date(r.date).getTime()) / MS_PER_HOUR;
			return ageHours > HOURS_PER_DAY;
		})
		.map((r) => ({
			id: r.id,
			subject: r.subject,
			sender: r.sender,
			age_hours: (nowMs - new Date(r.date).getTime()) / MS_PER_HOUR,
		}))
		.sort((a, b) => b.age_hours - a.age_hours)
		.slice(0, 10);

	// Daily trend bucket
	const dayBuckets = new Map<
		string,
		{ received: number; replyTimes: number[]; repliedCount: number }
	>();

	for (const r of received) {
		const day = r.date.slice(0, 10); // YYYY-MM-DD
		const bucket = dayBuckets.get(day) ?? {
			received: 0,
			replyTimes: [],
			repliedCount: 0,
		};
		bucket.received++;
		dayBuckets.set(day, bucket);
	}

	// Build response-time-per-day from the pairs we already computed
	for (const reply of replies) {
		const parent = receivedMap.get(reply.in_reply_to);
		if (!parent) continue;

		const replyMs = new Date(reply.date).getTime();
		const parentMs = new Date(parent.date).getTime();
		const hours = (replyMs - parentMs) / MS_PER_HOUR;
		if (hours < 0) continue;

		const day = parent.date.slice(0, 10);
		const bucket = dayBuckets.get(day);
		if (bucket) {
			bucket.replyTimes.push(hours);
			bucket.repliedCount++;
		}
	}

	const trend = [...dayBuckets.entries()]
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([date, bucket]) => ({
			date,
			received: bucket.received,
			replied: bucket.repliedCount,
			avgHours:
				bucket.replyTimes.length > 0
					? bucket.replyTimes.reduce((a, b) => a + b, 0) /
						bucket.replyTimes.length
					: 0,
		}));

	return {
		window: windowStr,
		generatedAt: now.toISOString(),
		totalReceived: received.length,
		totalReplied: repliedReceivedIds.size,
		unreplied: received.length - repliedReceivedIds.size,
		avgResponseHours: Math.round(avgResponseHours * 100) / 100,
		p50ResponseHours: Math.round(p50ResponseHours * 100) / 100,
		p90ResponseHours: Math.round(p90ResponseHours * 100) / 100,
		overdue: overdue.map((o) => ({
			...o,
			age_hours: Math.round(o.age_hours * 100) / 100,
		})),
		trend,
	};
}
