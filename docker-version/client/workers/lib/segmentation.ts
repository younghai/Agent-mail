// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

/**
 * Customer segmentation — pure evaluator.
 *
 * Classifies a sender into one of four segments based on message frequency,
 * recency, and starred count. Designed to run on Edge (no Node deps, no I/O),
 * so MailboxDO.getCustomerSegments can call it inline against aggregated rows.
 */

export type Segment = "vip" | "regular" | "new" | "dormant";

export interface SenderStats {
	email: string;
	domain: string;
	totalMessages: number;
	lastSeenAt: string; // ISO 8601
	firstSeenAt: string;
	starred: number;
}

export interface CustomerSegmentResult {
	email: string;
	domain: string;
	segment: Segment;
	totalMessages: number;
	lastSeenAt: string;
	firstSeenAt: string;
	starred: number;
}

const MS_PER_DAY = 86_400_000;

/**
 * Classify a sender's stats into a segment.
 *
 * Rules (evaluated in order):
 *  1. dormant — last activity > 90 days ago
 *  2. vip     — ≥5 messages AND ≥1 starred
 *  3. regular — ≥5 messages, no starred
 *  4. new     — <5 messages (or anything else)
 */
export function classify(stats: SenderStats, now: Date): Segment {
	const lastDays =
		(now.getTime() - new Date(stats.lastSeenAt).getTime()) / MS_PER_DAY;

	if (lastDays > 90) return "dormant";
	if (stats.totalMessages >= 5 && stats.starred >= 1) return "vip";
	if (stats.totalMessages >= 5) return "regular";
	return "new";
}
