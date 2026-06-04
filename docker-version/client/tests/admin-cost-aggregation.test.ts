// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import assert from "node:assert/strict";
import { test } from "node:test";
import {
	buildDailyCostSeries,
	buildMonthlyCostSeries,
	aggregateModelUsage,
} from "../workers/admin/cost-aggregation.ts";

// --- buildDailyCostSeries ---

test("buildDailyCostSeries returns chronological series for exact count of days", () => {
	const series = buildDailyCostSeries([], 10, "2026-05-09", 5);
	assert.equal(series.length, 5);
	assert.equal(series[0].day, "2026-05-05");
	assert.equal(series[4].day, "2026-05-09");
	// verify strictly ascending
	for (let i = 1; i < series.length; i++) {
		assert.ok(series[i].day > series[i - 1].day, "days should be ascending");
	}
});

test("buildDailyCostSeries pads zero for missing days", () => {
	const series = buildDailyCostSeries(
		[{ day: "2026-05-07", costUsd: 3.5 }],
		10,
		"2026-05-09",
		5,
	);
	assert.equal(series.find((p) => p.day === "2026-05-07")?.costUsd, 3.5);
	assert.equal(series.find((p) => p.day === "2026-05-05")?.costUsd, 0);
	assert.equal(series.find((p) => p.day === "2026-05-06")?.costUsd, 0);
});

test("buildDailyCostSeries includes dailyLimitUsd on every point", () => {
	const series = buildDailyCostSeries([], 42, "2026-05-09", 3);
	assert.ok(series.every((p) => p.dailyLimitUsd === 42));
});

test("buildDailyCostSeries with empty data returns all-zero series", () => {
	const series = buildDailyCostSeries([], 10, "2026-05-09", 7);
	assert.equal(series.length, 7);
	assert.ok(series.every((p) => p.costUsd === 0));
});

test("buildDailyCostSeries with partial data fills in gaps correctly", () => {
	const data = [
		{ day: "2026-05-05", costUsd: 1.0 },
		{ day: "2026-05-09", costUsd: 5.0 },
	];
	const series = buildDailyCostSeries(data, 10, "2026-05-09", 5);
	assert.equal(series.find((p) => p.day === "2026-05-05")?.costUsd, 1.0);
	assert.equal(series.find((p) => p.day === "2026-05-09")?.costUsd, 5.0);
	assert.equal(series.find((p) => p.day === "2026-05-06")?.costUsd, 0);
	assert.equal(series.find((p) => p.day === "2026-05-07")?.costUsd, 0);
	assert.equal(series.find((p) => p.day === "2026-05-08")?.costUsd, 0);
});

test("buildDailyCostSeries with days=1 returns single point for endDay", () => {
	const series = buildDailyCostSeries([{ day: "2026-05-09", costUsd: 7.5 }], 10, "2026-05-09", 1);
	assert.equal(series.length, 1);
	assert.equal(series[0].day, "2026-05-09");
	assert.equal(series[0].costUsd, 7.5);
});

// --- buildMonthlyCostSeries ---

test("buildMonthlyCostSeries returns chronological series for exact count of months", () => {
	const series = buildMonthlyCostSeries([], 200, "2026-05", 4);
	assert.equal(series.length, 4);
	assert.equal(series[0].month, "2026-02");
	assert.equal(series[3].month, "2026-05");
});

test("buildMonthlyCostSeries pads zero for missing months", () => {
	const series = buildMonthlyCostSeries(
		[{ month: "2026-03", costUsd: 45.5 }],
		200,
		"2026-05",
		4,
	);
	assert.equal(series.find((p) => p.month === "2026-03")?.costUsd, 45.5);
	assert.equal(series.find((p) => p.month === "2026-02")?.costUsd, 0);
	assert.equal(series.find((p) => p.month === "2026-04")?.costUsd, 0);
});

test("buildMonthlyCostSeries includes monthlyLimitUsd on every point", () => {
	const series = buildMonthlyCostSeries([], 300, "2026-05", 3);
	assert.ok(series.every((p) => p.monthlyLimitUsd === 300));
});

test("buildMonthlyCostSeries wraps correctly across year boundary", () => {
	const series = buildMonthlyCostSeries([], 200, "2026-02", 4);
	assert.equal(series[0].month, "2025-11");
	assert.equal(series[1].month, "2025-12");
	assert.equal(series[2].month, "2026-01");
	assert.equal(series[3].month, "2026-02");
});

// --- aggregateModelUsage ---

test("aggregateModelUsage groups by model+operation and sums tokens", () => {
	const rows = [
		{ model: "gpt-4", operation: "chat", inputTokens: 100, outputTokens: 50 },
		{ model: "gpt-4", operation: "chat", inputTokens: 200, outputTokens: 80 },
		{ model: "claude-3", operation: "summarize", inputTokens: 300, outputTokens: 100 },
	];
	const result = aggregateModelUsage(rows);
	const gpt4 = result.find((r) => r.model === "gpt-4" && r.operation === "chat");
	assert.ok(gpt4, "gpt-4 chat should exist");
	assert.equal(gpt4?.count, 2);
	assert.equal(gpt4?.inputTokens, 300);
	assert.equal(gpt4?.outputTokens, 130);
	const claude = result.find((r) => r.model === "claude-3");
	assert.equal(claude?.count, 1);
});

test("aggregateModelUsage sorts by count descending", () => {
	const rows = [
		{ model: "a", operation: "op", inputTokens: 0, outputTokens: 0 },
		{ model: "b", operation: "op", inputTokens: 0, outputTokens: 0 },
		{ model: "b", operation: "op", inputTokens: 0, outputTokens: 0 },
		{ model: "b", operation: "op", inputTokens: 0, outputTokens: 0 },
		{ model: "a", operation: "op", inputTokens: 0, outputTokens: 0 },
		{ model: "c", operation: "op", inputTokens: 0, outputTokens: 0 },
	];
	const result = aggregateModelUsage(rows);
	assert.equal(result[0].model, "b"); // count=3 is highest
	assert.equal(result[1].model, "a"); // count=2
	assert.equal(result[2].model, "c"); // count=1
});

test("aggregateModelUsage returns empty array for empty input", () => {
	const result = aggregateModelUsage([]);
	assert.deepEqual(result, []);
});
