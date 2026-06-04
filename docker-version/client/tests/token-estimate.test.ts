import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
	computeStreamingStats,
	estimateTokens,
	formatStreamingStats,
} from "../app/lib/token-estimate.ts";

describe("estimateTokens", () => {
	it("returns 0 for empty input", () => {
		assert.equal(estimateTokens(""), 0);
	});

	it("approximates Latin text at ~4 chars per token", () => {
		const text = "The quick brown fox jumps over the lazy dog";
		const tokens = estimateTokens(text);
		// 43 chars / 4 ≈ 11
		assert.ok(tokens >= 9 && tokens <= 13, `expected 9-13, got ${tokens}`);
	});

	it("approximates Hangul at ~1.6 chars per token", () => {
		const text = "안녕하세요 메일 에이전트입니다";
		const tokens = estimateTokens(text);
		// 16 chars at ~1.6 cpt ≈ 10
		assert.ok(tokens >= 8 && tokens <= 12, `expected 8-12, got ${tokens}`);
	});

	it("blends CJK + Latin sensibly", () => {
		const mixed = "안녕 hello 메일 world";
		const tokens = estimateTokens(mixed);
		assert.ok(tokens > 0);
	});
});

describe("computeStreamingStats", () => {
	it("computes elapsed and rate", () => {
		const text = "x".repeat(40); // ~10 tokens
		const startedAt = 1000;
		const now = 2000; // 1s elapsed
		const stats = computeStreamingStats(text, startedAt, now);
		assert.ok(stats.tokens >= 8 && stats.tokens <= 12);
		assert.equal(stats.elapsedMs, 1000);
		assert.ok(stats.tokensPerSecond >= 8 && stats.tokensPerSecond <= 12);
	});

	it("never returns zero elapsedMs", () => {
		const stats = computeStreamingStats("hi", 5000, 5000);
		assert.ok(stats.elapsedMs >= 1);
	});
});

describe("formatStreamingStats", () => {
	it("renders tokens · seconds · rate when tokens > 0", () => {
		const out = formatStreamingStats({
			tokens: 42,
			elapsedMs: 1500,
			tokensPerSecond: 28,
		});
		assert.match(out, /≈42 tokens/);
		assert.match(out, /1\.5s/);
		assert.match(out, /28 tok\/s/);
	});

	it("hides tokens line when count is zero", () => {
		const out = formatStreamingStats({
			tokens: 0,
			elapsedMs: 500,
			tokensPerSecond: 0,
		});
		assert.equal(out, "0.5s");
	});
});
