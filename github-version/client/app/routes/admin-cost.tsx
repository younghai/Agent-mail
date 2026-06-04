// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { ArrowLeftIcon, CurrencyDollarIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { Link as RouterLink } from "react-router";
import { useMailboxParams } from "~/hooks/useMailboxParams";
import { ADMIN_TOKENS } from "~/admin/designTokens";
import api from "~/services/api";

export function meta() {
	return [{ title: "Cost Dashboard - Agentic Inbox" }];
}

function SectionCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
	return (
		<div className="overflow-hidden rounded-2xl border border-kumo-line bg-kumo-base shadow-sm">
			<div className="border-b border-kumo-line px-5 py-4">
				<h2 className="text-lg font-semibold text-kumo-default">{title}</h2>
				{description && <p className="mt-1 text-sm text-kumo-subtle">{description}</p>}
			</div>
			<div className="p-5">{children}</div>
		</div>
	);
}

function StatCard({ label, value, detail }: { label: string; value: string | number; detail?: string }) {
	return (
		<div className="rounded-2xl border border-kumo-line bg-kumo-base p-4 shadow-sm">
			<div className="text-xs uppercase tracking-[0.16em] text-kumo-subtle">{label}</div>
			<div className="mt-2 text-3xl font-semibold text-kumo-default">{value}</div>
			{detail && <div className="mt-1 text-sm text-kumo-subtle">{detail}</div>}
		</div>
	);
}

function ProgressBar({ value, max, label }: { value: number; max: number; label?: string }) {
	const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
	const over = max > 0 && value > max;
	return (
		<div>
			{label && <div className="mb-1 text-xs text-kumo-subtle">{label}</div>}
			<div className="h-3 overflow-hidden rounded-full bg-kumo-fill">
				<div
					className="h-full rounded-full transition-all"
					style={{
						width: `${Math.max(pct, value > 0 ? 2 : 0)}%`,
						background: over ? ADMIN_TOKENS.warning : ADMIN_TOKENS.progressGradient,
					}}
				/>
			</div>
			<div className="mt-1 flex justify-between text-xs text-kumo-subtle">
				<span>${value.toFixed(2)}</span>
				<span>limit ${max.toFixed(2)}</span>
			</div>
		</div>
	);
}

function DailyCostChart({ data }: { data: Array<{ day: string; costUsd: number; dailyLimitUsd: number }> }) {
	if (data.length === 0) {
		return (
			<div className="rounded-xl border border-dashed border-kumo-line p-8 text-center text-sm text-kumo-subtle">
				No daily cost data yet.
			</div>
		);
	}

	const width = 640;
	const height = 200;
	const padX = 40;
	const padY = 24;
	const innerW = width - padX * 2;
	const innerH = height - padY * 2;
	const limitUsd = data[0]?.dailyLimitUsd ?? 0;
	const maxVal = Math.max(...data.map((d) => d.costUsd), limitUsd, 0.01);
	const step = data.length > 1 ? innerW / (data.length - 1) : 0;

	const points = data.map((d, i) => {
		const x = padX + i * step;
		const y = padY + innerH - (d.costUsd / maxVal) * innerH;
		return { ...d, x, y };
	});
	const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");
	const limitY = padY + innerH - (limitUsd / maxVal) * innerH;

	return (
		<div>
			<div className="overflow-hidden rounded-xl border border-kumo-line bg-kumo-recessed p-4">
				<svg viewBox={`0 0 ${width} ${height}`} className="h-52 w-full" role="img" aria-label="Daily cost trend line chart">
					{/* axes */}
					<line x1={padX} y1={padY} x2={padX} y2={padY + innerH} stroke="currentColor" className="text-kumo-line" />
					<line x1={padX} y1={padY + innerH} x2={padX + innerW} y2={padY + innerH} stroke="currentColor" className="text-kumo-line" />
					{/* limit line */}
					{limitUsd > 0 && (
						<line x1={padX} y1={limitY} x2={padX + innerW} y2={limitY} stroke={ADMIN_TOKENS.warning} strokeWidth="1.5" strokeDasharray="6 3" />
					)}
					{/* cost line */}
					{data.length > 1 && (
						<polyline points={polyline} fill="none" stroke={ADMIN_TOKENS.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
					)}
					{/* dots */}
					{points.map((p) => (
						<circle key={p.day} cx={p.x} cy={p.y} r="4" fill={ADMIN_TOKENS.accent} />
					))}
					{/* x-axis labels — show first, middle, last */}
					{[0, Math.floor((data.length - 1) / 2), data.length - 1]
						.filter((i, idx, arr) => arr.indexOf(i) === idx)
						.map((i) => {
							const p = points[i];
							if (!p) return null;
							return (
								<text key={p.day} x={p.x} y={height - 4} textAnchor="middle" className="fill-kumo-subtle text-[11px]">
									{p.day.slice(5)} {/* MM-DD */}
								</text>
							);
						})}
				</svg>
			</div>
			<div className="mt-4 space-y-2">
				{data.slice(-7).map((d) => (
					<div key={d.day} className="grid grid-cols-[8rem_1fr_5rem] items-center gap-3 text-sm">
						<div className="truncate text-kumo-subtle">{d.day}</div>
						<div className="h-2.5 overflow-hidden rounded-full bg-kumo-fill">
							<div
								className="h-full rounded-full"
								style={{
									background: d.costUsd > d.dailyLimitUsd ? ADMIN_TOKENS.warning : ADMIN_TOKENS.progressGradient,
									width: `${Math.max((d.costUsd / Math.max(d.dailyLimitUsd, 0.01)) * 100, d.costUsd > 0 ? 3 : 0)}%`,
								}}
							/>
						</div>
						<div className="text-right font-medium text-kumo-default">${d.costUsd.toFixed(2)}</div>
					</div>
				))}
			</div>
		</div>
	);
}

function MonthlyCostChart({ data }: { data: Array<{ month: string; costUsd: number; monthlyLimitUsd: number }> }) {
	if (data.length === 0) {
		return (
			<div className="rounded-xl border border-dashed border-kumo-line p-8 text-center text-sm text-kumo-subtle">
				No monthly cost data yet.
			</div>
		);
	}

	const limitUsd = data[0]?.monthlyLimitUsd ?? 0;

	return (
		<div className="space-y-4">
			{data.map((d) => (
				<div key={d.month}>
					<div className="mb-1 flex justify-between text-sm">
						<span className="font-medium text-kumo-default">{d.month}</span>
						<span className="text-kumo-subtle">${d.costUsd.toFixed(2)} / ${limitUsd.toFixed(2)}</span>
					</div>
					<ProgressBar value={d.costUsd} max={limitUsd} />
				</div>
			))}
		</div>
	);
}

function ModelUsageTable({ data }: { data: Array<{ model: string; operation: string; count: number; inputTokens: number; outputTokens: number }> }) {
	if (data.length === 0) {
		return (
			<div className="rounded-xl border border-dashed border-kumo-line p-8 text-center text-sm text-kumo-subtle">
				No model usage data yet.
			</div>
		);
	}

	const maxCount = Math.max(...data.map((r) => r.count), 1);

	return (
		<div className="overflow-hidden rounded-xl border border-kumo-line">
			<table className="w-full text-left text-sm">
				<thead className="bg-kumo-recessed text-xs uppercase tracking-wide text-kumo-subtle">
					<tr>
						<th className="px-4 py-3">Model</th>
						<th className="px-4 py-3">Operation</th>
						<th className="px-4 py-3">Calls</th>
						<th className="px-4 py-3">Input tokens</th>
						<th className="px-4 py-3">Output tokens</th>
						<th className="px-4 py-3 w-32">Volume</th>
					</tr>
				</thead>
				<tbody>
					{data.map((row) => (
						<tr key={`${row.model}|${row.operation}`} className="border-t border-kumo-line">
							<td className="px-4 py-3 font-medium text-kumo-default">{row.model || "-"}</td>
							<td className="px-4 py-3 text-kumo-subtle">{row.operation}</td>
							<td className="px-4 py-3">{row.count.toLocaleString()}</td>
							<td className="px-4 py-3">{row.inputTokens.toLocaleString()}</td>
							<td className="px-4 py-3">{row.outputTokens.toLocaleString()}</td>
							<td className="px-4 py-3">
								<div className="h-2.5 overflow-hidden rounded-full bg-kumo-fill">
									<div
										className="h-full rounded-full"
										style={{
											background: ADMIN_TOKENS.progressGradient,
											width: `${Math.max((row.count / maxCount) * 100, 4)}%`,
										}}
									/>
								</div>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

export default function AdminCostRoute() {
	const { mailboxSlug } = useMailboxParams();
	const adminBase = mailboxSlug ? `/mailbox/${mailboxSlug}/admin` : "/admin";
	const backLabel = "Admin";

	const { data: daily, isLoading: dailyLoading } = useQuery({
		queryKey: ["admin", "cost", "daily"],
		queryFn: () => api.getAdminCostDaily(30),
		refetchInterval: 60_000,
	});

	const { data: monthly, isLoading: monthlyLoading } = useQuery({
		queryKey: ["admin", "cost", "monthly"],
		queryFn: () => api.getAdminCostMonthly(6),
		refetchInterval: 60_000,
	});

	const { data: models, isLoading: modelsLoading } = useQuery({
		queryKey: ["admin", "cost", "models"],
		queryFn: () => api.getAdminCostModels(7),
		refetchInterval: 60_000,
	});

	const dailyData = daily?.data ?? [];
	const monthlyData = monthly?.data ?? [];
	const modelsData = models?.data ?? [];

	// Summary stats
	const todayCost = dailyData[dailyData.length - 1]?.costUsd ?? 0;
	const dailyLimit = dailyData[0]?.dailyLimitUsd ?? 0;
	const thisMonthCost = monthlyData[monthlyData.length - 1]?.costUsd ?? 0;
	const monthlyLimit = monthlyData[0]?.monthlyLimitUsd ?? 0;
	const totalCalls = modelsData.reduce((s, r) => s + r.count, 0);

	const isLoading = dailyLoading || monthlyLoading || modelsLoading;

	return (
		<div className="h-full min-h-screen overflow-y-auto text-kumo-default" style={{ background: ADMIN_TOKENS.surface }}>
			<header className="border-b border-kumo-line bg-kumo-base/90 backdrop-blur">
				<div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6">
					<div>
						<RouterLink to={adminBase} className="mb-2 inline-flex items-center gap-2 text-sm text-kumo-subtle no-underline hover:text-kumo-default">
							<ArrowLeftIcon size={16} />
							{backLabel}
						</RouterLink>
						<h1 className="flex items-center gap-3 text-2xl font-bold">
							<span className="flex h-10 w-10 items-center justify-center rounded-xl text-white" style={{ background: ADMIN_TOKENS.accent }}>
								<CurrencyDollarIcon size={22} />
							</span>
							Cost Dashboard
						</h1>
						<p className="mt-1 text-sm text-kumo-subtle">
							AI usage spend, budget progress, and model breakdown.
						</p>
					</div>
					{isLoading && (
						<div className="hidden rounded-full bg-kumo-fill px-4 py-2 text-sm text-kumo-subtle md:block">
							Loading...
						</div>
					)}
				</div>
			</header>

			<main className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-6">
				{/* Summary stat cards */}
				<section className="grid gap-4 md:grid-cols-3">
					<StatCard
						label="Today's spend"
						value={`$${todayCost.toFixed(2)}`}
						detail={`of $${dailyLimit.toFixed(2)} daily limit`}
					/>
					<StatCard
						label="This month"
						value={`$${thisMonthCost.toFixed(2)}`}
						detail={`of $${monthlyLimit.toFixed(2)} monthly limit`}
					/>
					<StatCard
						label="Model calls (7d)"
						value={totalCalls.toLocaleString()}
						detail={`${modelsData.length} model/operation pairs`}
					/>
				</section>

				{/* Budget progress */}
				<section className="grid gap-4 md:grid-cols-2">
					<div className="rounded-2xl border border-kumo-line bg-kumo-base p-5 shadow-sm">
						<h2 className="mb-4 text-lg font-semibold text-kumo-default">Daily budget progress</h2>
						<ProgressBar value={todayCost} max={dailyLimit} label="Today vs daily limit" />
					</div>
					<div className="rounded-2xl border border-kumo-line bg-kumo-base p-5 shadow-sm">
						<h2 className="mb-4 text-lg font-semibold text-kumo-default">Monthly budget progress</h2>
						<ProgressBar value={thisMonthCost} max={monthlyLimit} label="This month vs monthly limit" />
					</div>
				</section>

				{/* Daily cost chart */}
				<SectionCard title="Daily cost trend" description="Cumulative USD spend per day over the last 30 days. Dashed line = daily limit.">
					<DailyCostChart data={dailyData} />
				</SectionCard>

				{/* Monthly cost chart */}
				<SectionCard title="Monthly cost history" description="Month-by-month spend vs monthly budget limit (last 6 months).">
					<MonthlyCostChart data={monthlyData} />
				</SectionCard>

				{/* Model usage breakdown */}
				<SectionCard title="Model usage breakdown" description="Calls, input/output tokens by model and operation for the last 7 days.">
					<ModelUsageTable data={modelsData} />
				</SectionCard>
			</main>
		</div>
	);
}
