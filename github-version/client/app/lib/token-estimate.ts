// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

/**
 * Client-side token + cost approximation for the streaming AgentPanel.
 *
 * The authoritative token count and cost are recorded server-side in
 * admin_agent_usage_events. This helper exists only so the operator can
 * see an in-flight estimate while a reply is being generated; numbers
 * are intentionally rough.
 *
 * Heuristic:
 *   - Latin scripts:  ~4 chars  / token
 *   - CJK scripts:    ~1.6 chars / token  (Hangul, Hiragana, Han)
 * For mixed text we sample the first 200 chars and pick the dominant ratio.
 */

const CJK_RE = /[぀-ヿ㐀-䶿一-鿿가-힯]/;

function pickRatio(sample: string): number {
	const head = sample.slice(0, 200);
	let cjk = 0;
	for (const ch of head) {
		if (CJK_RE.test(ch)) cjk++;
	}
	const cjkRatio = head.length ? cjk / head.length : 0;
	// Blend: 100% CJK ≈ 1.6 cpt, 0% CJK ≈ 4.0 cpt
	return 4.0 - 2.4 * cjkRatio;
}

export function estimateTokens(text: string): number {
	if (!text) return 0;
	const cpt = pickRatio(text);
	return Math.max(1, Math.round(text.length / cpt));
}

export interface StreamingStats {
	tokens: number;
	elapsedMs: number;
	tokensPerSecond: number;
}

export function computeStreamingStats(
	text: string,
	startedAt: number,
	now: number = Date.now(),
): StreamingStats {
	const tokens = estimateTokens(text);
	const elapsedMs = Math.max(1, now - startedAt);
	const tokensPerSecond = tokens / (elapsedMs / 1000);
	return { tokens, elapsedMs, tokensPerSecond };
}

export function formatStreamingStats(stats: StreamingStats): string {
	const seconds = (stats.elapsedMs / 1000).toFixed(1);
	if (stats.tokens === 0) return `${seconds}s`;
	const rate = stats.tokensPerSecond.toFixed(0);
	return `≈${stats.tokens} tokens · ${seconds}s · ${rate} tok/s`;
}
