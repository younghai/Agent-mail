// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { ArrowLeftIcon, ClockIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router";
import { useMailboxParams } from "~/hooks/useMailboxParams";
import { ADMIN_TOKENS } from "~/admin/designTokens";
import { useSlaMetrics, type SlaWindow } from "~/queries/sla";
import { useUIStore } from "~/hooks/useUIStore";

export function meta() {
	return [{ title: "SLA Dashboard - Agentic Inbox" }];
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

function WindowSelector({ value, onChange }: { value: SlaWindow; onChange: (w: SlaWindow) => void }) {
	const options: SlaWindow[] = ["24h", "7d", "30d"];
	const labels: Record<SlaWindow, string> = { "24h": "24h", "7d": "7 days", "30d": "30 days" };
	return (
		<div className="inline-flex rounded-lg border border-kumo-line bg-kumo-recessed p-0.5">
			{options.map((opt) => (
				<button
					key={opt}
					type="button"
					onClick={() => onChange(opt)}
					className={
						`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
							value === opt
								? "bg-kumo-base text-kumo-default shadow-sm"
								: "text-kumo-subtle hover:text-kumo-default"
						}`
					}
				>
					{labels[opt]}
				</button>
			))}
		</div>
	);
}

function TrendChart({ data }: { data: Array<{ date: string; received: number; replied: number; avgHours: number }> }) {
	if (data.length === 0) {
		return (
			<div className="rounded-xl border border-dashed border-kumo-line p-8 text-center text-sm text-kumo-subtle">
				No trend data available for this window.
			</div>
		);
	}

	const width = 640;
	const height = 200;
	const padX = 40;
	const padY = 24;
	const innerW = width - padX * 2;
	const innerH = height - padY * 2;
	const maxVal = Math.max(...data.map((d) => d.received), ...data.map((d) => d.replied), 1);
	const step = data.length > 1 ? innerW / (data.length - 1) : 0;

	const receivedPoints = data.map((d, i) => {
		const x = padX + i * step;
		const y = padY + innerH - (d.received / maxVal) * innerH;
		return { ...d, x, y };
	});
	const repliedPoints = data.map((d, i) => {
		const x = padX + i * step;
		const y = padY + innerH - (d.replied / maxVal) * innerH;
		return { ...d, x, y };
	});

	const receivedPolyline = receivedPoints.map((p) => `${p.x},${p.y}`).join(" ");
	const repliedPolyline = repliedPoints.map((p) => `${p.x},${p.y}`).join(" ");

	return (
		<div className="overflow-hidden rounded-xl border border-kumo-line bg-kumo-recessed p-4">
			<svg viewBox={`0 0 ${width} ${height}`} className="h-52 w-full" role="img" aria-label="SLA trend chart — received vs replied emails per day">
				{/* axes */}
				<line x1={padX} y1={padY} x2={padX} y2={padY + innerH} stroke="currentColor" className="text-kumo-line" />
				<line x1={padX} y1={padY + innerH} x2={padX + innerW} y2={padY + innerH} stroke="currentColor" className="text-kumo-line" />
				{/* received line */}
				{data.length > 1 && (
					<polyline points={receivedPolyline} fill="none" stroke={ADMIN_TOKENS.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
				)}
				{/* replied line */}
				{data.length > 1 && (
					<polyline points={repliedPolyline} fill="none" stroke={ADMIN_TOKENS.warning} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="6 3" />
				)}
				{/* dots */}
				{receivedPoints.map((p) => (
					<circle key={`r-${p.date}`} cx={p.x} cy={p.y} r="4" fill={ADMIN_TOKENS.accent} />
				))}
				{repliedPoints.map((p) => (
					<circle key={`s-${p.date}`} cx={p.x} cy={p.y} r="3" fill={ADMIN_TOKENS.warning} />
				))}
				{/* x-axis labels */}
				{[0, Math.floor((data.length - 1) / 2), data.length - 1]
					.filter((i, idx, arr) => arr.indexOf(i) === idx)
					.map((i) => {
						const p = receivedPoints[i];
						if (!p) return null;
						return (
							<text key={p.date} x={p.x} y={height - 4} textAnchor="middle" className="fill-kumo-subtle text-[11px]">
								{p.date.slice(5)}
							</text>
						);
					})}
			</svg>
			{/* legend */}
			<div className="mt-3 flex items-center gap-5 text-xs text-kumo-subtle">
				<span className="flex items-center gap-1.5">
					<span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: ADMIN_TOKENS.accent }} />
					Received
				</span>
				<span className="flex items-center gap-1.5">
					<span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: ADMIN_TOKENS.warning }} />
					Replied
				</span>
			</div>
		</div>
	);
}

function OverdueList({ items, onSelect }: { items: Array<{ id: string; subject: string; sender: string; age_hours: number }>; onSelect: (id: string) => void }) {
	if (items.length === 0) {
		return (
			<div className="rounded-xl border border-dashed border-kumo-line p-8 text-center text-sm text-kumo-subtle">
				No overdue emails. All caught up!
			</div>
		);
	}

	return (
		<div className="space-y-2">
			{items.map((item) => (
				<button
					key={item.id}
					type="button"
					onClick={() => onSelect(item.id)}
					className="w-full rounded-xl border border-kumo-line bg-kumo-base p-3 text-left transition-colors hover:bg-kumo-tint cursor-pointer"
				>
					<div className="flex items-start justify-between gap-3">
						<div className="min-w-0 flex-1">
							<div className="truncate text-sm font-medium text-kumo-default">
								{item.subject || "(no subject)"}
							</div>
							<div className="mt-0.5 truncate text-xs text-kumo-subtle">
								{item.sender}
							</div>
						</div>
						<div className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ background: "#fef2f2", color: "#991b1b" }}>
							{item.age_hours.toFixed(1)}h overdue
						</div>
					</div>
				</button>
			))}
		</div>
	);
}

export default function SlaDashboardRoute() {
	const { mailboxId, mailboxSlug } = useMailboxParams();
	const navigate = useNavigate();
	const { selectEmail, closeSidebar } = useUIStore();
	const [window, setWindow] = useState<SlaWindow>("7d");
	const adminBase = mailboxSlug ? `/mailbox/${mailboxSlug}/admin` : "/admin";

	const { data: metrics, isLoading } = useSlaMetrics(mailboxId, window);

	const handleOverdueSelect = (emailId: string) => {
		selectEmail(emailId);
		closeSidebar();
		navigate(`/mailbox/${mailboxSlug}/emails/inbox`);
	};

	return (
		<div className="h-full min-h-screen overflow-y-auto text-kumo-default" style={{ background: ADMIN_TOKENS.surface }}>
			<header className="border-b border-kumo-line bg-kumo-base/90 backdrop-blur">
				<div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6">
					<div>
						<RouterLink to={adminBase} className="mb-2 inline-flex items-center gap-2 text-sm text-kumo-subtle no-underline hover:text-kumo-default">
							<ArrowLeftIcon size={16} />
							Admin
						</RouterLink>
						<h1 className="flex items-center gap-3 text-2xl font-bold">
							<span className="flex h-10 w-10 items-center justify-center rounded-xl text-white" style={{ background: ADMIN_TOKENS.accent }}>
								<ClockIcon size={22} />
							</span>
							SLA Dashboard
						</h1>
						<p className="mt-1 text-sm text-kumo-subtle">
							Response-time metrics, overdue alerts, and daily trends.
						</p>
					</div>
					<div className="flex items-center gap-4">
						<WindowSelector value={window} onChange={setWindow} />
						{isLoading && (
							<div className="hidden rounded-full bg-kumo-fill px-4 py-2 text-sm text-kumo-subtle md:block">
								Loading...
							</div>
						)}
					</div>
				</div>
			</header>

			<main className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-6">
				{/* KPI cards */}
				<section className="grid gap-4 grid-cols-2 md:grid-cols-4">
					<StatCard
						label="Replied"
						value={metrics?.totalReplied ?? "—"}
						detail={metrics ? `of ${metrics.totalReceived} received` : undefined}
					/>
					<StatCard
						label="Avg response"
						value={metrics ? `${metrics.avgResponseHours}h` : "—"}
					/>
					<StatCard
						label="P50 response"
						value={metrics ? `${metrics.p50ResponseHours}h` : "—"}
					/>
					<StatCard
						label="P90 response"
						value={metrics ? `${metrics.p90ResponseHours}h` : "—"}
					/>
				</section>

				{/* Trend + Overdue layout */}
				<section className="grid gap-6 lg:grid-cols-2">
					{/* Trend chart */}
					<div className="overflow-hidden rounded-2xl border border-kumo-line bg-kumo-base shadow-sm">
						<div className="border-b border-kumo-line px-5 py-4">
							<h2 className="text-lg font-semibold text-kumo-default">Daily trend</h2>
							<p className="mt-1 text-sm text-kumo-subtle">
								Received vs replied over the selected window.
							</p>
						</div>
						<div className="p-5">
							<TrendChart data={metrics?.trend ?? []} />
						</div>
					</div>

					{/* Overdue list */}
					<div className="overflow-hidden rounded-2xl border border-kumo-line bg-kumo-base shadow-sm">
						<div className="border-b border-kumo-line px-5 py-4">
							<h2 className="text-lg font-semibold text-kumo-default">
								Overdue{" "}
								{metrics && metrics.overdue.length > 0 && (
									<span className="ml-1 inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-medium" style={{ background: "#fef2f2", color: "#991b1b" }}>
										{metrics.overdue.length}
									</span>
								)}
							</h2>
							<p className="mt-1 text-sm text-kumo-subtle">
								Unanswered emails older than 24 hours (max 10).
							</p>
						</div>
						<div className="p-5">
							<OverdueList items={metrics?.overdue ?? []} onSelect={handleOverdueSelect} />
						</div>
					</div>
				</section>
			</main>
		</div>
	);
}
