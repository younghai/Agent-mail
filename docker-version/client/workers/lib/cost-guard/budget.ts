// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

export interface BudgetEnv {
	DAILY_BUDGET_USD?: string;
	MONTHLY_BUDGET_USD?: string;
}

export interface UsageStorage {
	get(key: string): Promise<number | undefined>;
	put(key: string, value: number): Promise<void>;
}

export interface CostCheckResult {
	withinDailyBudget: boolean;
	withinMonthlyBudget: boolean;
	dailyUsedUsd: number;
	monthlyUsedUsd: number;
	dailyLimitUsd: number;
	monthlyLimitUsd: number;
}

function formatDay(epochMs: number): string {
	const d = new Date(epochMs);
	return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

function formatMonth(epochMs: number): string {
	const d = new Date(epochMs);
	return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export async function recordAndCheck(
	storage: UsageStorage,
	costUsd: number,
	env: BudgetEnv,
	now: () => number = Date.now,
): Promise<CostCheckResult> {
	const t = now();
	const dayKey = `cost:day:${formatDay(t)}`;
	const monthKey = `cost:month:${formatMonth(t)}`;
	const dailyPrev = (await storage.get(dayKey)) ?? 0;
	const monthlyPrev = (await storage.get(monthKey)) ?? 0;
	const dailyUsed = dailyPrev + costUsd;
	const monthlyUsed = monthlyPrev + costUsd;
	await storage.put(dayKey, dailyUsed);
	await storage.put(monthKey, monthlyUsed);
	const dailyLimitUsd = parseFloat(env.DAILY_BUDGET_USD ?? "10");
	const monthlyLimitUsd = parseFloat(env.MONTHLY_BUDGET_USD ?? "200");
	return {
		withinDailyBudget: dailyUsed <= dailyLimitUsd,
		withinMonthlyBudget: monthlyUsed <= monthlyLimitUsd,
		dailyUsedUsd: dailyUsed,
		monthlyUsedUsd: monthlyUsed,
		dailyLimitUsd,
		monthlyLimitUsd,
	};
}
