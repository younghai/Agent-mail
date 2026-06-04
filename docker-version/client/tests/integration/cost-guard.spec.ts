// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

/**
 * Integration test: AdminDO recordCostAndCheck
 *
 * Exercises the AdminDO.recordCostAndCheck RPC method in a real miniflare
 * Durable Object environment. The DO uses ctx.storage (key-value) for cost
 * accumulation — this verifies multi-call accumulation and budget breach.
 */

import { env, runInDurableObject } from "cloudflare:test";
import { describe, it, expect } from "vitest";

type CostCheckResult = {
	withinDailyBudget: boolean;
	withinMonthlyBudget: boolean;
	dailyUsedUsd: number;
	monthlyUsedUsd: number;
	dailyLimitUsd: number;
	monthlyLimitUsd: number;
};

// cloudflare:test exposes a deeply generic helper that can exceed TS inference depth.
// Narrow it here because this spec only needs the AdminDO RPC surface.
// @ts-expect-error TS2589: avoid expanding cloudflare:test's full Durable Object type.
const runAdminDO = runInDurableObject as (
	stub: DurableObjectStub,
	callback: (instance: any) => Promise<CostCheckResult | void>,
) => Promise<CostCheckResult | void>;

describe("AdminDO cost guard", () => {
	it("recordCostAndCheck returns CostCheckResult with correct fields", async () => {
		const stub = env.ADMIN.get(env.ADMIN.idFromName("cost-guard-test-1"));

		const result = await runAdminDO(stub, async (instance) => {
			return instance.recordCostAndCheck(1.0, {
				DAILY_BUDGET_USD: "10",
				MONTHLY_BUDGET_USD: "200",
			});
		}) as CostCheckResult;

		expect(result.withinDailyBudget).toBe(true);
		expect(result.withinMonthlyBudget).toBe(true);
		expect(result.dailyUsedUsd).toBeCloseTo(1.0);
		expect(result.monthlyUsedUsd).toBeCloseTo(1.0);
		expect(result.dailyLimitUsd).toBe(10);
		expect(result.monthlyLimitUsd).toBe(200);
	});

	it("accumulated spend across calls is summed correctly", async () => {
		const stub = env.ADMIN.get(env.ADMIN.idFromName("cost-guard-test-2"));

		await runAdminDO(stub, async (instance) => {
			await instance.recordCostAndCheck(3.0, {
				DAILY_BUDGET_USD: "10",
				MONTHLY_BUDGET_USD: "200",
			});
		});

		const result = await runAdminDO(stub, async (instance) => {
			return instance.recordCostAndCheck(4.0, {
				DAILY_BUDGET_USD: "10",
				MONTHLY_BUDGET_USD: "200",
			});
		}) as CostCheckResult;

		expect(result.dailyUsedUsd).toBeCloseTo(7.0);
		expect(result.withinDailyBudget).toBe(true);
	});

	it("exceeding daily budget sets withinDailyBudget=false", async () => {
		const stub = env.ADMIN.get(env.ADMIN.idFromName("cost-guard-test-3"));

		// Spend 9 first, then 2 more to breach the 10 limit
		await runAdminDO(stub, async (instance) => {
			await instance.recordCostAndCheck(9.0, {
				DAILY_BUDGET_USD: "10",
				MONTHLY_BUDGET_USD: "200",
			});
		});

		const result = await runAdminDO(stub, async (instance) => {
			return instance.recordCostAndCheck(2.0, {
				DAILY_BUDGET_USD: "10",
				MONTHLY_BUDGET_USD: "200",
			});
		}) as CostCheckResult;

		expect(result.dailyUsedUsd).toBeCloseTo(11.0);
		expect(result.withinDailyBudget).toBe(false);
		// Monthly still fine (11 < 200)
		expect(result.withinMonthlyBudget).toBe(true);
	});
});
