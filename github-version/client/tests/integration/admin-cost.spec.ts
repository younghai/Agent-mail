// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

/**
 * Integration test: AdminDO cost dashboard methods
 *
 * Seeds cost:day:* and cost:month:* keys via recordCostAndCheck (which uses
 * the same storage keys as the budget module), then verifies getDailyCostSeries,
 * getMonthlyCostSeries, and getModelUsageBreakdown return correctly structured data.
 */

import { env, runInDurableObject as _runInDurableObject } from "cloudflare:test";
import { describe, it, expect } from "vitest";

// vitest-pool-workers + drizzle types push generic instantiation past tsc's depth
// limit. Runtime contract preserved; only inference is bypassed.
const runInDurableObject = _runInDurableObject as unknown as <R>(
	stub: unknown,
	cb: (instance: any) => Promise<R> | R,
) => Promise<R>;

const TODAY = new Date().toISOString().slice(0, 10);
const THIS_MONTH = TODAY.slice(0, 7);

describe("AdminDO cost dashboard", () => {
	it("getDailyCostSeries returns a series with correct length and fields", async () => {
		const stub = env.ADMIN.get(env.ADMIN.idFromName("cost-dash-daily-1"));

		// Seed today's cost via recordCostAndCheck to populate cost:day:* key
		await runInDurableObject(stub, async (instance: any) => {
			await instance.recordCostAndCheck(2.5, {
				DAILY_BUDGET_USD: "10",
				MONTHLY_BUDGET_USD: "200",
			});
		});

		const result = await runInDurableObject(stub, async (instance: any) => {
			return instance.getDailyCostSeries(7);
		});

		expect(Array.isArray(result)).toBe(true);
		expect(result.length).toBe(7);

		// Every point has the required fields
		for (const point of result) {
			expect(typeof point.day).toBe("string");
			expect(point.day).toMatch(/^\d{4}-\d{2}-\d{2}$/);
			expect(typeof point.costUsd).toBe("number");
			expect(typeof point.dailyLimitUsd).toBe("number");
		}

		// Last point is today and has the seeded cost
		const last = result[result.length - 1];
		expect(last.day).toBe(TODAY);
		expect(last.costUsd).toBeCloseTo(2.5);
		expect(last.dailyLimitUsd).toBe(10);
	});

	it("getMonthlyCostSeries returns a series with correct length and fields", async () => {
		const stub = env.ADMIN.get(env.ADMIN.idFromName("cost-dash-monthly-1"));

		// Seed this month's cost
		await runInDurableObject(stub, async (instance: any) => {
			await instance.recordCostAndCheck(15.0, {
				DAILY_BUDGET_USD: "10",
				MONTHLY_BUDGET_USD: "200",
			});
		});

		const result = await runInDurableObject(stub, async (instance: any) => {
			return instance.getMonthlyCostSeries(6);
		});

		expect(Array.isArray(result)).toBe(true);
		expect(result.length).toBe(6);

		for (const point of result) {
			expect(typeof point.month).toBe("string");
			expect(point.month).toMatch(/^\d{4}-\d{2}$/);
			expect(typeof point.costUsd).toBe("number");
			expect(typeof point.monthlyLimitUsd).toBe("number");
		}

		// Last point is this month with the seeded cost
		const last = result[result.length - 1];
		expect(last.month).toBe(THIS_MONTH);
		expect(last.costUsd).toBeCloseTo(15.0);
		expect(last.monthlyLimitUsd).toBe(200);
	});

	it("getModelUsageBreakdown returns grouped rows from agent_usage_events", async () => {
		const stub = env.ADMIN.get(env.ADMIN.idFromName("cost-dash-models-1"));

		// Seed agent usage events for today
		await runInDurableObject(stub, async (instance: any) => {
			await instance.recordAgentUsage({
				agentId: "test-agent",
				operation: "chat",
				model: "claude-3-5-sonnet",
				inputTokens: 500,
				outputTokens: 200,
				costUsd: 0.01,
				status: "success",
				createdAt: new Date().toISOString(),
			});
			await instance.recordAgentUsage({
				agentId: "test-agent",
				operation: "chat",
				model: "claude-3-5-sonnet",
				inputTokens: 300,
				outputTokens: 100,
				costUsd: 0.005,
				status: "success",
				createdAt: new Date().toISOString(),
			});
			await instance.recordAgentUsage({
				agentId: "test-agent",
				operation: "summarize",
				model: "claude-3-haiku",
				inputTokens: 1000,
				outputTokens: 400,
				costUsd: 0.002,
				status: "success",
				createdAt: new Date().toISOString(),
			});
		});

		const result = await runInDurableObject(stub, async (instance: any) => {
			return instance.getModelUsageBreakdown(7);
		});

		expect(Array.isArray(result)).toBe(true);
		expect(result.length).toBeGreaterThan(0);

		for (const row of result) {
			expect(typeof row.model).toBe("string");
			expect(typeof row.operation).toBe("string");
			expect(typeof row.count).toBe("number");
			expect(typeof row.inputTokens).toBe("number");
			expect(typeof row.outputTokens).toBe("number");
		}

		// claude-3-5-sonnet + chat should be aggregated with count=2
		const sonnetChat = result.find(
			(r: any) => r.model === "claude-3-5-sonnet" && r.operation === "chat",
		);
		expect(sonnetChat).toBeDefined();
		expect(sonnetChat?.count).toBe(2);
		expect(sonnetChat?.inputTokens).toBe(800);
		expect(sonnetChat?.outputTokens).toBe(300);

		// sorted by count desc: sonnetChat (2) should come before haiku (1)
		const sonnetIdx = result.findIndex(
			(r: any) => r.model === "claude-3-5-sonnet" && r.operation === "chat",
		);
		const haikuIdx = result.findIndex(
			(r: any) => r.model === "claude-3-haiku",
		);
		expect(sonnetIdx).toBeLessThan(haikuIdx);
	});
});
