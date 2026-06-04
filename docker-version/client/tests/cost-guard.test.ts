// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

/**
 * Unit tests for workers/lib/cost-guard/budget.ts
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { recordAndCheck } from "../workers/lib/cost-guard/budget.ts";
import type { UsageStorage } from "../workers/lib/cost-guard/budget.ts";

/** In-memory UsageStorage backed by a Map — for testing only. */
function makeStorage(): UsageStorage {
	const m = new Map<string, number>();
	return {
		async get(key) { return m.get(key); },
		async put(key, value) { m.set(key, value); },
	};
}

// Freeze a known timestamp: 2026-05-08T12:00:00Z
const DAY1 = Date.UTC(2026, 4, 8, 12, 0, 0); // May 8
const DAY2 = Date.UTC(2026, 4, 9, 12, 0, 0); // May 9 — different day key
const MONTH2 = Date.UTC(2026, 5, 1, 12, 0, 0); // Jun 1 — different month key

// ---------------------------------------------------------------------------
// Test 1 — first call: dailyUsed == costUsd, withinDaily == true
// ---------------------------------------------------------------------------
test("first call sets dailyUsed to costUsd and withinDailyBudget is true", async () => {
	const storage = makeStorage();
	const result = await recordAndCheck(storage, 1.0, { DAILY_BUDGET_USD: "10", MONTHLY_BUDGET_USD: "200" }, () => DAY1);
	assert.equal(result.dailyUsedUsd, 1.0);
	assert.equal(result.withinDailyBudget, true);
	assert.equal(result.withinMonthlyBudget, true);
	assert.equal(result.dailyLimitUsd, 10);
	assert.equal(result.monthlyLimitUsd, 200);
});

// ---------------------------------------------------------------------------
// Test 2 — accumulated spend below limit: both within flags remain true
// ---------------------------------------------------------------------------
test("accumulated spend below limits keeps both within flags true", async () => {
	const storage = makeStorage();
	await recordAndCheck(storage, 3.0, { DAILY_BUDGET_USD: "10", MONTHLY_BUDGET_USD: "200" }, () => DAY1);
	const result = await recordAndCheck(storage, 4.0, { DAILY_BUDGET_USD: "10", MONTHLY_BUDGET_USD: "200" }, () => DAY1);
	assert.equal(result.dailyUsedUsd, 7.0);
	assert.equal(result.withinDailyBudget, true);
	assert.equal(result.withinMonthlyBudget, true);
});

// ---------------------------------------------------------------------------
// Test 3 — daily limit exceeded: withinDailyBudget is false, used > limit
// ---------------------------------------------------------------------------
test("exceeding daily limit sets withinDailyBudget to false", async () => {
	const storage = makeStorage();
	await recordAndCheck(storage, 9.0, { DAILY_BUDGET_USD: "10", MONTHLY_BUDGET_USD: "200" }, () => DAY1);
	const result = await recordAndCheck(storage, 2.0, { DAILY_BUDGET_USD: "10", MONTHLY_BUDGET_USD: "200" }, () => DAY1);
	assert.equal(result.dailyUsedUsd, 11.0);
	assert.equal(result.withinDailyBudget, false);
	assert.equal(result.dailyLimitUsd, 10);
	// Monthly is still fine
	assert.equal(result.withinMonthlyBudget, true);
});

// ---------------------------------------------------------------------------
// Test 4 — different day: new dayKey, accumulation is isolated
// ---------------------------------------------------------------------------
test("different day uses a separate day key and accumulates independently", async () => {
	const storage = makeStorage();
	// Spend on day 1
	await recordAndCheck(storage, 8.0, { DAILY_BUDGET_USD: "10", MONTHLY_BUDGET_USD: "200" }, () => DAY1);
	// Spend on day 2 — should start fresh daily counter
	const result = await recordAndCheck(storage, 1.0, { DAILY_BUDGET_USD: "10", MONTHLY_BUDGET_USD: "200" }, () => DAY2);
	assert.equal(result.dailyUsedUsd, 1.0);
	assert.equal(result.withinDailyBudget, true);
	// Monthly accumulates across both days
	assert.equal(result.monthlyUsedUsd, 9.0);
});

// ---------------------------------------------------------------------------
// Test 5 — monthly limit exceeded with daily still OK
// ---------------------------------------------------------------------------
test("monthly limit exceeded while daily is still within budget", async () => {
	const storage = makeStorage();
	// Spend 190 in month 1 (day 1)
	await recordAndCheck(storage, 190.0, { DAILY_BUDGET_USD: "1000", MONTHLY_BUDGET_USD: "200" }, () => DAY1);
	// Spend 15 more in month 1 (day 2) — still same month key
	const result = await recordAndCheck(storage, 15.0, { DAILY_BUDGET_USD: "1000", MONTHLY_BUDGET_USD: "200" }, () => DAY2);
	assert.equal(result.monthlyUsedUsd, 205.0);
	assert.equal(result.withinMonthlyBudget, false);
	// Daily for day2 is only 15 — within the 1000 limit
	assert.equal(result.dailyUsedUsd, 15.0);
	assert.equal(result.withinDailyBudget, true);
});

// ---------------------------------------------------------------------------
// Test 6 — storage get returns undefined (cache miss) → starts at 0
// ---------------------------------------------------------------------------
test("storage miss (undefined) is treated as zero for first call", async () => {
	const storage = makeStorage(); // empty map — all gets return undefined
	const result = await recordAndCheck(storage, 0.5, {}, () => DAY1);
	assert.equal(result.dailyUsedUsd, 0.5);
	assert.equal(result.monthlyUsedUsd, 0.5);
	// Default limits: daily=10, monthly=200
	assert.equal(result.dailyLimitUsd, 10);
	assert.equal(result.monthlyLimitUsd, 200);
	assert.equal(result.withinDailyBudget, true);
	assert.equal(result.withinMonthlyBudget, true);
});

// ---------------------------------------------------------------------------
// Test 7 — different month: monthly key resets, daily also resets
// ---------------------------------------------------------------------------
test("different month uses a new monthly key — both counters start fresh", async () => {
	const storage = makeStorage();
	// Spend in May
	await recordAndCheck(storage, 150.0, { DAILY_BUDGET_USD: "10", MONTHLY_BUDGET_USD: "200" }, () => DAY1);
	// Spend in June — new month key
	const result = await recordAndCheck(storage, 5.0, { DAILY_BUDGET_USD: "10", MONTHLY_BUDGET_USD: "200" }, () => MONTH2);
	assert.equal(result.monthlyUsedUsd, 5.0);
	assert.equal(result.withinMonthlyBudget, true);
});
