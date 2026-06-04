// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

export interface DailyCostPoint {
	day: string; // YYYY-MM-DD
	costUsd: number;
	dailyLimitUsd: number;
}

export interface MonthlyCostPoint {
	month: string; // YYYY-MM
	costUsd: number;
	monthlyLimitUsd: number;
}

export interface ModelUsageRow {
	model: string;
	operation: string;
	count: number;
	inputTokens: number;
	outputTokens: number;
}

export function buildDailyCostSeries(
	dailyData: Array<{ day: string; costUsd: number }>,
	dailyLimitUsd: number,
	endDay: string,
	days: number,
): DailyCostPoint[] {
	const map = new Map(dailyData.map((d) => [d.day, d.costUsd]));
	const result: DailyCostPoint[] = [];
	const end = new Date(endDay + "T00:00:00Z");
	for (let i = days - 1; i >= 0; i--) {
		const d = new Date(end);
		d.setUTCDate(end.getUTCDate() - i);
		const key = d.toISOString().slice(0, 10);
		result.push({ day: key, costUsd: map.get(key) ?? 0, dailyLimitUsd });
	}
	return result;
}

export function buildMonthlyCostSeries(
	monthlyData: Array<{ month: string; costUsd: number }>,
	monthlyLimitUsd: number,
	endMonth: string, // YYYY-MM
	months: number,
): MonthlyCostPoint[] {
	const map = new Map(monthlyData.map((d) => [d.month, d.costUsd]));
	const result: MonthlyCostPoint[] = [];
	const [yEnd, mEnd] = endMonth.split("-").map(Number);
	for (let i = months - 1; i >= 0; i--) {
		const dt = new Date(Date.UTC(yEnd, mEnd - 1 - i, 1));
		const key = `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}`;
		result.push({ month: key, costUsd: map.get(key) ?? 0, monthlyLimitUsd });
	}
	return result;
}

export function aggregateModelUsage(
	rows: Array<{ model: string; operation: string; inputTokens: number; outputTokens: number }>,
): ModelUsageRow[] {
	const map = new Map<string, ModelUsageRow>();
	for (const r of rows) {
		const key = `${r.model}|${r.operation}`;
		const existing = map.get(key);
		if (existing) {
			existing.count++;
			existing.inputTokens += r.inputTokens;
			existing.outputTokens += r.outputTokens;
		} else {
			map.set(key, { model: r.model, operation: r.operation, count: 1, inputTokens: r.inputTokens, outputTokens: r.outputTokens });
		}
	}
	return [...map.values()].sort((a, b) => b.count - a.count);
}
