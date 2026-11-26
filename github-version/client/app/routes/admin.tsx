// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { Banner, Button, Input, Select, Textarea, useKumoToastManager } from "@cloudflare/kumo";
import { ArrowLeftIcon, CaretDownIcon, ChartLineUpIcon, PlusIcon } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useLocation } from "react-router";
import { useMailboxParams } from "~/hooks/useMailboxParams";
import { ADMIN_TOKENS } from "~/admin/designTokens";
import { DEMO_ACTION_QUEUE, DEMO_DAILY_TIMELINE, DEMO_WEEKLY_TIMELINE, EMPTY_OVERVIEW, makeDemoOverview } from "~/admin/demoData";
import { getOperationSection, STATUS_LABELS } from "~/admin/domain";
import { DAILY_STATUS_SCORE, buildDailyTimeline, buildWeeklyTimeline, type DailyTimelineItem, type WeeklyTimelineItem } from "~/admin/timeline";
import api, { ApiError } from "~/services/api";
import type { AdminActionQueue, AdminClient, AdminOverview, AdminTask, AdminTaskStatus } from "~/types";
import TaskTimelineBoard from "~/components/TaskTimelineBoard";

export function meta() {
	return [{ title: "Admin Dashboard - Agentic Inbox" }];
}

const ENABLE_ADMIN_DEMO_DATA = import.meta.env.VITE_ADMIN_DEMO_DATA === "true";

function StatCard({ label, value, detail }: { label: string; value: string | number; detail?: string }) {
	return (
		<div className="rounded-2xl border border-kumo-line bg-kumo-base p-4 shadow-sm">
			<div className="text-xs uppercase tracking-[0.16em] text-kumo-subtle">{label}</div>
			<div className="mt-2 text-3xl font-semibold text-kumo-default">{value}</div>
			{detail && <div className="mt-1 text-sm text-kumo-subtle">{detail}</div>}
		</div>
	);
}

function BarChart({ data, labelKey = "date" }: { data: Array<{ date?: string; status?: string; count: number }>; labelKey?: "date" | "status" }) {
	const max = Math.max(...data.map((item) => item.count), 1);
	return (
		<div className="space-y-3">
			{data.length === 0 ? (
				<div className="rounded-xl border border-dashed border-kumo-line p-8 text-center text-sm text-kumo-subtle">
					No data yet
				</div>
			) : (
				data.map((item) => {
					const label = labelKey === "status" ? STATUS_LABELS[item.status as AdminTaskStatus] ?? item.status : item.date;
					return (
						<div key={`${label}-${item.count}`} className="grid grid-cols-[8rem_1fr_3rem] items-center gap-3 text-sm">
							<div className="truncate text-kumo-subtle">{label}</div>
							<div className="h-3 overflow-hidden rounded-full bg-kumo-fill">
								<div
									className="h-full rounded-full"
									style={{
										background: ADMIN_TOKENS.progressGradient,
										width: `${Math.max((item.count / max) * 100, item.count > 0 ? 6 : 0)}%`,
									}}
								/>
							</div>
							<div className="text-right font-medium text-kumo-default">{item.count}</div>
						</div>
					);
				})
			)}
		</div>
	);
}

function CollapsibleSection({
	id,
	title,
	description,
	defaultOpen = false,
	active = false,
	children,
}: {
	id?: string;
	title: string;
	description?: string;
	defaultOpen?: boolean;
	active?: boolean;
	children: ReactNode;
}) {
	const [open, setOpen] = useState(defaultOpen);

	useEffect(() => {
		if (active) setOpen(true);
	}, [active]);

	return (
		<section
			id={id}
			className={`scroll-mt-24 overflow-hidden rounded-2xl border bg-kumo-base shadow-sm ${active ? "ring-2" : "border-kumo-line"}`}
			style={active ? { borderColor: ADMIN_TOKENS.accent, boxShadow: `0 0 0 2px ${ADMIN_TOKENS.accent}24` } : undefined}
		>
			<button
				type="button"
				onClick={() => setOpen((value) => !value)}
				className="flex w-full items-center justify-between gap-4 bg-transparent px-5 py-4 text-left"
				aria-expanded={open}
			>
				<div>
					<h2 className="text-lg font-semibold text-kumo-default">{title}</h2>
					{description && <p className="mt-1 text-sm text-kumo-subtle">{description}</p>}
				</div>
				<span className="flex shrink-0 items-center gap-2 rounded-full bg-kumo-recessed px-3 py-1 text-sm font-medium text-kumo-subtle">
					{open ? "Close" : "Open"}
					<CaretDownIcon
						size={16}
						className={`transition-transform ${open ? "rotate-180" : ""}`}
					/>
				</span>
			</button>
			{open && <div className="border-t border-kumo-line p-5">{children}</div>}
		</section>
	);
}

function DailyTimelineBars({ daily }: { daily: DailyTimelineItem[] }) {
	const max = 100;
	return (
		<div className="space-y-4">
			{daily.length === 0 ? (
				<div className="rounded-xl border border-dashed border-kumo-line p-8 text-center text-sm text-kumo-subtle">
					No daily timeline data yet. Add tasks or enable VITE_ADMIN_DEMO_DATA=true for a sample operating view.
				</div>
			) : daily.map((item) => {
				const score = DAILY_STATUS_SCORE[item.status] ?? 50;
				return (
					<div key={`${item.time}-${item.title}`}>
						<div className="mb-2 flex items-center justify-between gap-3 text-sm">
							<div className="min-w-0">
								<span className="mr-2 font-semibold" style={{ color: ADMIN_TOKENS.accent }}>{item.time}</span>
								<span className="font-medium text-kumo-default">{item.title}</span>
								<p className="mt-0.5 truncate text-kumo-subtle">{item.detail}</p>
							</div>
							<span className="shrink-0 rounded-full bg-kumo-recessed px-2.5 py-1 text-xs font-medium text-kumo-subtle">
								{item.status}
							</span>
						</div>
						<div className="h-4 overflow-hidden rounded-full bg-kumo-fill">
								<div
									className="h-full rounded-full"
									style={{
										background: ADMIN_TOKENS.progressGradient,
										width: `${Math.max((score / max) * 100, 6)}%`,
									}}
								/>
						</div>
					</div>
				);
			})}
		</div>
	);
}

function WeeklyTimelineLine({ weekly }: { weekly: WeeklyTimelineItem[] }) {
	if (weekly.length === 0) {
		return (
			<div className="rounded-xl border border-dashed border-kumo-line p-8 text-center text-sm text-kumo-subtle">
				No weekly timeline data yet. Add client tasks to generate the completion trend.
			</div>
		);
	}

	const width = 560;
	const height = 180;
	const padding = 24;
	const max = 100;
	const step = weekly.length > 1 ? (width - padding * 2) / (weekly.length - 1) : 0;
	const points = weekly.map((item, index) => {
		const x = padding + index * step;
		const y = height - padding - (Math.min(Math.max(item.completion, 0), max) / max) * (height - padding * 2);
		return { ...item, x, y };
	});
	const polyline = points.map((point) => `${point.x},${point.y}`).join(" ");

	return (
		<div>
			<div className="overflow-hidden rounded-xl border border-kumo-line bg-kumo-recessed p-4">
				<svg viewBox={`0 0 ${width} ${height}`} className="h-56 w-full" role="img" aria-label="Weekly timeline completion line chart">
					<line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="currentColor" className="text-kumo-line" />
					<line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="currentColor" className="text-kumo-line" />
					<polyline points={polyline} fill="none" stroke={ADMIN_TOKENS.accent} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
					{points.map((point) => (
						<g key={`${point.day}-${point.title}`}>
							<circle cx={point.x} cy={point.y} r="6" fill={ADMIN_TOKENS.warning} stroke={ADMIN_TOKENS.accent} strokeWidth="3" />
							<text x={point.x} y={height - 5} textAnchor="middle" className="fill-kumo-subtle text-[12px]">
								{point.day}
							</text>
							<text x={point.x} y={Math.max(point.y - 12, 14)} textAnchor="middle" className="fill-kumo-default text-[12px] font-semibold">
								{point.completion}%
							</text>
						</g>
					))}
				</svg>
			</div>
			<div className="mt-4 grid gap-3 md:grid-cols-2">
				{weekly.map((item) => (
					<div key={`${item.day}-${item.title}`} className="rounded-xl bg-kumo-recessed p-3 text-sm">
						<div className="font-semibold text-kumo-default">{item.day} · {item.title}</div>
						<div className="mt-1 text-kumo-subtle">{item.detail}</div>
					</div>
				))}
			</div>
		</div>
	);
}

function TimelineDashboard({
	daily,
	weekly,
}: {
	daily: DailyTimelineItem[];
	weekly: WeeklyTimelineItem[];
}) {
	return (
		<section className="grid gap-6 xl:grid-cols-[1fr_1.35fr]">
			<div className="rounded-2xl border border-kumo-line bg-kumo-base p-5">
				<div className="mb-4">
					<h2 className="text-lg font-semibold">Daily timeline</h2>
					<p className="text-sm text-kumo-subtle">Bar chart for today&apos;s operator flow, AI outputs, blockers, and scheduled reporting.</p>
				</div>
				<DailyTimelineBars daily={daily} />
			</div>

			<div className="rounded-2xl border border-kumo-line bg-kumo-base p-5">
				<div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
					<div>
						<h2 className="text-lg font-semibold">Weekly timeline</h2>
						<p className="text-sm text-kumo-subtle">Line chart for planned request handling, reporting, and completion trend.</p>
					</div>
					<div className="rounded-full bg-kumo-recessed px-3 py-1 text-xs font-medium text-kumo-subtle">
						Daily + weekly operating view
					</div>
				</div>
				<WeeklyTimelineLine weekly={weekly} />
			</div>
		</section>
	);
}

function MiniTaskCard({ task, client }: { task: AdminTask; client?: AdminClient }) {
	return (
		<div className="rounded-xl border border-kumo-line bg-kumo-base p-4">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div>
					<div className="text-sm font-semibold text-kumo-default">{task.title}</div>
					<div className="mt-1 text-xs text-kumo-subtle">
						{client?.company ?? "Unknown client"} · {task.owner || "Unassigned"} · {task.priority}
					</div>
				</div>
				<span className="rounded-full bg-kumo-recessed px-2.5 py-1 text-xs font-medium text-kumo-subtle">
					{STATUS_LABELS[task.status]}
				</span>
			</div>
			<p className="mt-3 text-sm text-kumo-subtle">{task.issue || task.notes || "No issue note."}</p>
			<div className="mt-3 h-2 overflow-hidden rounded-full bg-kumo-fill">
				<div className="h-full rounded-full" style={{ background: ADMIN_TOKENS.accent, width: `${task.completion}%` }} />
			</div>
			<div className="mt-2 text-right text-xs text-kumo-subtle">{task.completion}% complete</div>
		</div>
	);
}

function RequestsOverview({
	tasks,
	clients,
	queue,
}: {
	tasks: AdminTask[];
	clients: AdminClient[];
	queue?: AdminActionQueue;
}) {
	const requestTasks = tasks.filter((task) => task.type === "request" || task.type === "issue").slice(0, 6);
	return (
		<div className="space-y-4">
			<div className="grid gap-3 md:grid-cols-4">
				<StatCard label="Needs reply" value={queue?.needsReply.length ?? 0} detail="Customer emails waiting" />
				<StatCard label="Waiting client" value={queue?.waitingClient.length ?? 0} detail="External confirmation" />
				<StatCard label="Blocked" value={queue?.blocked.length ?? 0} detail="Internal blocker" />
				<StatCard label="Overdue" value={queue?.overdue.length ?? 0} detail="Past due" />
			</div>
			<div className="grid gap-4 lg:grid-cols-2">
				{requestTasks.map((task) => (
					<MiniTaskCard
						key={task.id}
						task={task}
						client={clients.find((client) => client.id === task.clientId)}
					/>
				))}
			</div>
		</div>
	);
}

function ClientsOverview({ clients, tasks }: { clients: AdminClient[]; tasks: AdminTask[] }) {
	return (
		<div className="grid gap-4 lg:grid-cols-3">
			{clients.map((client) => {
				const clientTasks = tasks.filter((task) => task.clientId === client.id);
				const completed = clientTasks.filter((task) => task.status === "done" || task.status === "closed").length;
				const completion = clientTasks.length ? Math.round((completed / clientTasks.length) * 100) : 0;
				return (
					<div key={client.id} className="rounded-xl border border-kumo-line bg-kumo-base p-4">
						<div className="flex items-start justify-between gap-3">
							<div>
								<div className="font-semibold text-kumo-default">{client.company}</div>
								<div className="mt-1 text-sm text-kumo-subtle">{client.name} · {client.email}</div>
							</div>
							<span className="rounded-full bg-kumo-recessed px-2.5 py-1 text-xs text-kumo-subtle">{client.status}</span>
						</div>
						<p className="mt-3 text-sm text-kumo-subtle">{client.notes}</p>
						<div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
							<div className="rounded-lg bg-kumo-recessed p-2"><div className="font-semibold">{clientTasks.length}</div><div className="text-xs text-kumo-subtle">Tasks</div></div>
							<div className="rounded-lg bg-kumo-recessed p-2"><div className="font-semibold">{completed}</div><div className="text-xs text-kumo-subtle">Done</div></div>
							<div className="rounded-lg bg-kumo-recessed p-2"><div className="font-semibold">{completion}%</div><div className="text-xs text-kumo-subtle">Rate</div></div>
						</div>
					</div>
				);
			})}
		</div>
	);
}

function DraftReviewOverview({ queue }: { queue?: AdminActionQueue }) {
	const drafts = queue?.draftReview ?? [];
	const needsReply = queue?.needsReply ?? [];
	return (
		<div className="grid gap-4 lg:grid-cols-2">
			<div className="rounded-xl border border-kumo-line bg-kumo-base p-4">
				<h3 className="font-semibold text-kumo-default">Drafts waiting for review</h3>
				<div className="mt-3 space-y-3">
					{drafts.map((draft) => (
						<div key={draft.id} className="rounded-lg bg-kumo-recessed p-3 text-sm">
							<div className="font-medium text-kumo-default">{draft.subject}</div>
							<div className="mt-1 text-kumo-subtle">To {draft.recipient} · {draft.mailboxEmail}</div>
						</div>
					))}
				</div>
			</div>
			<div className="rounded-xl border border-kumo-line bg-kumo-base p-4">
				<h3 className="font-semibold text-kumo-default">Emails needing reply</h3>
				<div className="mt-3 space-y-3">
					{needsReply.map((email) => (
						<div key={email.id} className="rounded-lg bg-kumo-recessed p-3 text-sm">
							<div className="font-medium text-kumo-default">{email.subject}</div>
							<div className="mt-1 text-kumo-subtle">From {email.sender} · To {email.recipient}</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

function AIAgentsOverview({ data }: { data: AdminOverview }) {
	const rows = data.charts.aiUsageByDay.length > 0 ? data.charts.aiUsageByDay : [
		{ date: "2026-05-04", agentId: "triage-agent", calls: 58, inputTokens: 14800, outputTokens: 3200, chatHits: 9, costUsd: 3.2, errors: 0, blocked: 1, limit: 120 },
		{ date: "2026-05-05", agentId: "timeline-agent", calls: 42, inputTokens: 11200, outputTokens: 2800, chatHits: 7, costUsd: 2.7, errors: 1, blocked: 0, limit: 120 },
	];
	const jobs = data.aiJobs ?? [];
	return (
		<div className="space-y-4">
			<div className="grid gap-3 md:grid-cols-4">
				<StatCard label="Day calls" value={data.aiUsage.day.calls} detail={`$${data.aiUsage.day.costUsd.toFixed(2)}`} />
				<StatCard label="Week calls" value={data.aiUsage.week.calls} detail={`${data.aiUsage.week.chatHits} chats`} />
				<StatCard label="Month tokens" value={(data.aiUsage.month.inputTokens + data.aiUsage.month.outputTokens).toLocaleString()} detail="Input + output" />
				<StatCard label="Blocked" value={data.aiUsage.month.blocked} detail={`${data.aiUsage.month.errors} errors`} />
			</div>
			<div className="overflow-hidden rounded-xl border border-kumo-line">
				<table className="w-full text-left text-sm">
					<thead className="bg-kumo-recessed text-xs uppercase tracking-wide text-kumo-subtle">
						<tr><th className="px-4 py-3">Agent</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Calls</th><th className="px-4 py-3">Tokens</th><th className="px-4 py-3">Cost</th><th className="px-4 py-3">Limit</th></tr>
					</thead>
					<tbody>
						{rows.map((row) => (
							<tr key={`${row.date}-${row.agentId}`} className="border-t border-kumo-line">
								<td className="px-4 py-3 font-medium">{row.agentId}</td>
								<td className="px-4 py-3 text-kumo-subtle">{row.date}</td>
								<td className="px-4 py-3">{row.calls}</td>
								<td className="px-4 py-3">{(row.inputTokens + row.outputTokens).toLocaleString()}</td>
								<td className="px-4 py-3">${row.costUsd.toFixed(2)}</td>
								<td className="px-4 py-3">{row.limit ?? "-"}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
			<div className="overflow-hidden rounded-xl border border-kumo-line">
				<div className="border-b border-kumo-line bg-kumo-recessed px-4 py-3">
					<h3 className="text-sm font-semibold text-kumo-default">AI workflow jobs</h3>
					<p className="mt-1 text-xs text-kumo-subtle">Summary, timeline, task extraction, and draft generation job status.</p>
				</div>
				<table className="w-full text-left text-sm">
					<thead className="bg-kumo-recessed text-xs uppercase tracking-wide text-kumo-subtle">
						<tr><th className="px-4 py-3">Job</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Attempts</th><th className="px-4 py-3">Updated</th><th className="px-4 py-3">Error</th></tr>
					</thead>
					<tbody>
						{jobs.length === 0 ? (
							<tr><td colSpan={5} className="px-4 py-6 text-center text-kumo-subtle">No AI workflow jobs yet.</td></tr>
						) : jobs.slice(0, 10).map((job) => (
							<tr key={job.id} className="border-t border-kumo-line">
								<td className="px-4 py-3 font-medium">{job.jobType}</td>
								<td className="px-4 py-3 text-kumo-subtle">{job.status}</td>
								<td className="px-4 py-3">{job.attemptCount}/{job.maxAttempts}</td>
								<td className="px-4 py-3 text-kumo-subtle">{String(job.updatedAt).slice(0, 19).replace("T", " ")}</td>
								<td className="px-4 py-3 text-kumo-subtle">{job.errorCode || job.errorMessage || "-"}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}

// A failed save keeps what was typed and says why it failed.
function useSave<T>(save: (value: T) => Promise<void>, onSaved: () => void) {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const run = async (value: T) => {
		setError(null);
		setIsSubmitting(true);
		try {
			await save(value);
			onSaved();
		} catch (err) {
			setError(err instanceof ApiError ? err.message : "Could not save. Try again.");
		} finally {
			setIsSubmitting(false);
		}
	};
	return { run, isSubmitting, error };
}

function ClientForm({
	disabled = false,
	onSubmit,
}: {
	disabled?: boolean;
	onSubmit: (client: Omit<AdminClient, "id" | "createdAt" | "updatedAt">) => Promise<void>;
}) {
	const [name, setName] = useState("");
	const [company, setCompany] = useState("");
	const [email, setEmail] = useState("");
	const [owner, setOwner] = useState("");
	const [notes, setNotes] = useState("");
	const { run: save, isSubmitting, error } = useSave(onSubmit, () => {
		setName("");
		setCompany("");
		setEmail("");
		setOwner("");
		setNotes("");
	});

	const submit = (event: FormEvent) => {
		event.preventDefault();
		if (disabled || !name.trim() || !company.trim()) return;
		void save({
			name: name.trim(),
			company: company.trim(),
			email: email.trim(),
			owner: owner.trim(),
			status: "active",
			tags: [],
			notes: notes.trim(),
		});
	};

	return (
		<form onSubmit={submit} className="grid gap-3 md:grid-cols-2">
			{error && (
				<div className="md:col-span-2">
					<Banner variant="error" text={error} />
				</div>
			)}
			<Input label="Client name" value={name} onChange={(event) => setName(event.target.value)} required />
			<Input label="Company" value={company} onChange={(event) => setCompany(event.target.value)} required />
			<Input label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
			<Input label="Owner" value={owner} onChange={(event) => setOwner(event.target.value)} />
			<div className="md:col-span-2">
				<Textarea label="Notes" value={notes} onChange={(event) => setNotes(event.target.value)} />
			</div>
			<div className="md:col-span-2">
				<Button type="submit" variant="primary" icon={<PlusIcon size={16} />} disabled={disabled || isSubmitting}>
					{disabled ? "Disabled in demo mode" : "Add client"}
				</Button>
			</div>
		</form>
	);
}

function TaskForm({
	clients,
	disabled = false,
	onSubmit,
}: {
	clients: AdminClient[];
	disabled?: boolean;
	onSubmit: (task: Omit<AdminTask, "id" | "createdAt" | "updatedAt">) => Promise<void>;
}) {
	const [clientId, setClientId] = useState("");
	const [title, setTitle] = useState("");
	const [owner, setOwner] = useState("");
	const [status, setStatus] = useState<AdminTaskStatus>("new");
	const [completion, setCompletion] = useState("0");
	const [issue, setIssue] = useState("");
	const { run: save, isSubmitting, error } = useSave(onSubmit, () => {
		setTitle("");
		setOwner("");
		setStatus("new");
		setCompletion("0");
		setIssue("");
	});

	const submit = (event: FormEvent) => {
		event.preventDefault();
		if (disabled || !clientId || !title.trim()) return;
		void save({
			clientId,
			title: title.trim(),
			type: "task",
			status,
			priority: "normal",
			owner: owner.trim(),
			completion: Math.min(Math.max(Number(completion) || 0, 0), 100),
			issue: issue.trim(),
		});
	};

	return (
		<form onSubmit={submit} className="grid gap-3 md:grid-cols-2">
			{error && (
				<div className="md:col-span-2">
					<Banner variant="error" text={error} />
				</div>
			)}
			<Select label="Client" value={clientId} onValueChange={(value) => setClientId(value ?? "")} required>
				<Select.Option value="">Select client</Select.Option>
				{clients.map((client) => (
					<Select.Option key={client.id} value={client.id}>{client.company}</Select.Option>
				))}
			</Select>
			<Input label="Task title" value={title} onChange={(event) => setTitle(event.target.value)} required />
			<Select label="Status" value={status} onValueChange={(value) => setStatus((value ?? "new") as AdminTaskStatus)}>
				{Object.entries(STATUS_LABELS).map(([value, label]) => (
					<Select.Option key={value} value={value}>{label}</Select.Option>
				))}
			</Select>
			<Input label="Completion %" type="number" min={0} max={100} value={completion} onChange={(event) => setCompletion(event.target.value)} />
			<Input label="Owner" value={owner} onChange={(event) => setOwner(event.target.value)} />
			<Input label="Issue / request" value={issue} onChange={(event) => setIssue(event.target.value)} />
			<div className="md:col-span-2">
				<Button type="submit" variant="primary" icon={<PlusIcon size={16} />} disabled={disabled || isSubmitting || clients.length === 0}>
					{disabled ? "Disabled in demo mode" : "Add task"}
				</Button>
			</div>
		</form>
	);
}

export default function AdminRoute() {
	const { mailboxSlug } = useMailboxParams();
	const location = useLocation();
	const toastManager = useKumoToastManager();
	const queryClient = useQueryClient();
	const [statusFilter, setStatusFilter] = useState<AdminTaskStatus | "all">("all");
	const [clientFilter, setClientFilter] = useState("all");
	const adminBase = mailboxSlug ? `/mailbox/${mailboxSlug}/admin` : "/admin";
	const backTarget = mailboxSlug ? `/mailbox/${mailboxSlug}` : "/";
	const backLabel = mailboxSlug ? "Mailbox" : "Mailboxes";
	const activeSection = location.hash.slice(1);
	const { data, isLoading, error } = useQuery({
		queryKey: ["admin", "overview"],
		queryFn: () => api.getAdminOverview(),
		refetchInterval: 60_000,
	});
	const { data: actionQueue } = useQuery({
		queryKey: ["admin", "action-queue"],
		queryFn: () => api.getAdminActionQueue(),
		refetchInterval: 60_000,
	});
	const isDemoMode = ENABLE_ADMIN_DEMO_DATA && (!data || (data.clients.length === 0 && data.tasks.length === 0));
	const dashboardData = useMemo(
		() => isDemoMode ? makeDemoOverview(data ?? EMPTY_OVERVIEW) : data,
		[data, isDemoMode],
	);
	const queueData = isDemoMode ? DEMO_ACTION_QUEUE : actionQueue;

	useEffect(() => {
		if (!location.hash) return;
		window.requestAnimationFrame(() => {
			document.getElementById(location.hash.slice(1))?.scrollIntoView({
				behavior: "smooth",
				block: "start",
			});
		});
	}, [location.hash]);

	const createClient = useMutation({
		mutationFn: api.createAdminClient,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["admin", "overview"] });
			toastManager.add({ title: "Client added" });
		},
	});

	const createTask = useMutation({
		mutationFn: api.createAdminTask,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["admin", "overview"] });
			toastManager.add({ title: "Task added" });
		},
	});

	const filteredTasks = useMemo(() => {
		return (dashboardData?.tasks ?? []).filter((task) => {
			if (statusFilter !== "all" && task.status !== statusFilter) return false;
			if (clientFilter !== "all" && task.clientId !== clientFilter) return false;
			return true;
		});
	}, [clientFilter, dashboardData?.tasks, statusFilter]);

	const dailyTimeline = useMemo(
		() => isDemoMode ? DEMO_DAILY_TIMELINE : buildDailyTimeline(dashboardData?.tasks ?? []),
		[dashboardData?.tasks, isDemoMode],
	);
	const weeklyTimeline = useMemo(
		() => isDemoMode ? DEMO_WEEKLY_TIMELINE : buildWeeklyTimeline(dashboardData?.tasks ?? []),
		[dashboardData?.tasks, isDemoMode],
	);
	const demoSectionOpen = (id: string, openByDefault = false) =>
		activeSection === id || (!activeSection && openByDefault);

	const exportCsv = () => {
		if (!dashboardData) return;
		const header = ["title", "client", "owner", "status", "completion", "priority", "dueDate", "issue"];
		const rows = filteredTasks.map((task) => {
			const client = dashboardData.clients.find((item) => item.id === task.clientId);
			return [
				task.title,
				client?.company ?? "",
				task.owner ?? "",
				task.status,
				String(task.completion),
				task.priority,
				task.dueDate ?? "",
				task.issue ?? "",
			];
		});
		const csv = [header, ...rows]
			.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
			.join("\n");
		const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = `agentic-inbox-admin-tasks-${new Date().toISOString().slice(0, 10)}.csv`;
		link.click();
		URL.revokeObjectURL(url);
	};

	if (error || !data) {
		if (error && !isLoading && !isDemoMode) {
			return (
				<div className="h-full min-h-screen overflow-y-auto bg-kumo-recessed p-8">
					<div className="mx-auto max-w-3xl rounded-2xl border border-kumo-line bg-kumo-base p-8">
						<h1 className="text-xl font-semibold text-kumo-default">Admin dashboard unavailable</h1>
						<p className="mt-2 text-kumo-subtle">{error instanceof Error ? error.message : "Failed to load admin data."}</p>
					</div>
				</div>
			);
		}
	}

	if (!dashboardData) return null;

	return (
		<div className="h-full min-h-screen overflow-y-auto text-kumo-default" style={{ background: ADMIN_TOKENS.surface }}>
			<header className="border-b border-kumo-line bg-kumo-base/90 backdrop-blur">
				<div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6">
					<div>
						<RouterLink to={backTarget} className="mb-2 inline-flex items-center gap-2 text-sm text-kumo-subtle no-underline hover:text-kumo-default">
							<ArrowLeftIcon size={16} />
							{backLabel}
						</RouterLink>
						<h1 className="flex items-center gap-3 text-2xl font-bold">
							<span className="flex h-10 w-10 items-center justify-center rounded-xl text-white" style={{ background: ADMIN_TOKENS.accent }}>
								<ChartLineUpIcon size={22} />
							</span>
							Admin Operations
						</h1>
						<p className="mt-1 text-sm text-kumo-subtle">
							Client, request, task, completion, and AI usage control center.
						</p>
						<div className="mt-3">
							<RouterLink
								to={`${adminBase}/cost`}
								className="inline-flex items-center gap-1.5 rounded-full border border-kumo-line bg-kumo-base px-3 py-1.5 text-xs font-medium text-kumo-subtle no-underline hover:text-kumo-default"
							>
								Cost Dashboard
							</RouterLink>
						</div>
					</div>
					<div className="hidden rounded-full bg-kumo-fill px-4 py-2 text-sm text-kumo-subtle md:block">
						{isDemoMode ? "Viewing sample dashboard data" : `Updated ${new Date(dashboardData.generatedAt).toLocaleString()}`}
					</div>
				</div>
			</header>

			<main className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-6">
				{isDemoMode && (
					<>
						<div
							className="fixed right-4 top-4 z-50 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] shadow-lg"
							style={{ borderColor: ADMIN_TOKENS.warning, background: ADMIN_TOKENS.warningSurface, color: ADMIN_TOKENS.warningText }}
						>
							Demo data
						</div>
							<section
								className="rounded-2xl border px-5 py-4 text-sm"
								style={{ borderColor: ADMIN_TOKENS.warning, background: ADMIN_TOKENS.warningSurface, color: ADMIN_TOKENS.warningText }}
							>
								<strong>Sample mode:</strong> VITE_ADMIN_DEMO_DATA=true is enabled, so this dashboard is populated with realistic dummy data. Remove the flag to show only live operational data.
							</section>
					</>
				)}

				<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
					<StatCard label="Clients" value={dashboardData.totals.clients} detail={`${dashboardData.totals.mailboxes} mailboxes`} />
					<StatCard label="Requests open" value={dashboardData.totals.openTasks} detail={`${dashboardData.totals.completedTasks} completed`} />
					<StatCard label="Completion" value={`${dashboardData.totals.completionRate}%`} detail="Task completion rate" />
					<StatCard label="Needs reply" value={dashboardData.totals.needsReply} detail={`${dashboardData.totals.draftEmails} drafts`} />
					<StatCard label="Emails" value={dashboardData.totals.totalEmails} detail={`${dashboardData.totals.unreadEmails} unread`} />
					<StatCard label="AI calls month" value={dashboardData.aiUsage.month.calls} detail={`${dashboardData.aiUsage.month.chatHits} chat hits · $${dashboardData.aiUsage.month.costUsd.toFixed(2)}`} />
				</section>

				<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
					<StatCard label="Overdue" value={queueData?.overdue.length ?? 0} detail="Past due open tasks" />
					<StatCard label="Unassigned" value={queueData?.unassigned.length ?? 0} detail="No owner assigned" />
					<StatCard label="Blocked" value={queueData?.blocked.length ?? 0} detail="Needs escalation" />
					<StatCard label="Draft review" value={queueData?.draftReview.length ?? 0} detail="AI/user drafts waiting" />
				</section>

				<CollapsibleSection
					id="timeline"
					title={getOperationSection("timeline").title}
					description={getOperationSection("timeline").description}
					defaultOpen={demoSectionOpen("timeline", true)}
					active={activeSection === "timeline"}
				>
					<TimelineDashboard daily={dailyTimeline} weekly={weeklyTimeline} />
				</CollapsibleSection>

				{queueData && (
					<CollapsibleSection
						id="requests"
						title={getOperationSection("requests").title}
						description={getOperationSection("requests").description}
						defaultOpen={demoSectionOpen("requests")}
						active={activeSection === "requests"}
					>
						<RequestsOverview tasks={dashboardData.tasks} clients={dashboardData.clients} queue={queueData} />
						<div className="mt-6 border-t border-kumo-line pt-5">
							<h3 className="mb-3 font-semibold text-kumo-default">Today&apos;s request action queue</h3>
							<div className="grid gap-3 md:grid-cols-3">
								{[
									["Overdue", queueData.overdue],
									["Unassigned", queueData.unassigned],
									["Blocked", queueData.blocked],
								].map(([label, tasks]) => (
									<div key={label as string} className="rounded-xl bg-kumo-base p-4">
										<div className="mb-2 font-semibold">{label as string}</div>
										{(tasks as AdminTask[]).length === 0 ? (
											<div className="rounded-lg border border-dashed border-kumo-line px-3 py-4 text-sm text-kumo-subtle">
												No items in this queue.
											</div>
										) : (tasks as AdminTask[]).slice(0, 4).map((task) => (
											<div
												key={task.id}
												className="block rounded-lg px-2 py-1.5 text-sm text-kumo-default"
											>
												<span className="font-medium">{task.title}</span>
												<span className="ml-2 text-kumo-subtle">{STATUS_LABELS[task.status]}</span>
											</div>
										))}
									</div>
								))}
							</div>
						</div>
					</CollapsibleSection>
				)}

				<CollapsibleSection
					id="reports"
					title={getOperationSection("reports").title}
					description={getOperationSection("reports").description}
					defaultOpen={demoSectionOpen("reports")}
					active={activeSection === "reports"}
				>
					<section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
						<div className="rounded-2xl border border-kumo-line bg-kumo-base p-5">
							<div className="mb-4 flex items-center justify-between">
								<h2 className="text-lg font-semibold">Mail volume by day</h2>
								<span className="text-sm text-kumo-subtle">Last 30 days</span>
							</div>
							<BarChart data={dashboardData.charts.emailsByDay} />
						</div>

						<div className="rounded-2xl border border-kumo-line bg-kumo-base p-5">
							<div className="mb-4">
								<h2 className="text-lg font-semibold">Request status</h2>
								<p className="text-sm text-kumo-subtle">Requests, issues, drafts, tasks, and projects</p>
							</div>
							<BarChart data={dashboardData.charts.tasksByStatus} labelKey="status" />
						</div>
					</section>
				</CollapsibleSection>

				<CollapsibleSection
					id="ai-agents"
					title={getOperationSection("ai-agents").title}
					description={getOperationSection("ai-agents").description}
					defaultOpen={demoSectionOpen("ai-agents")}
					active={activeSection === "ai-agents"}
				>
					<AIAgentsOverview data={dashboardData} />
				</CollapsibleSection>

				<CollapsibleSection
					id="clients"
					title={getOperationSection("clients").title}
					description={getOperationSection("clients").description}
					defaultOpen={demoSectionOpen("clients")}
					active={activeSection === "clients"}
				>
					<ClientsOverview clients={dashboardData.clients} tasks={dashboardData.tasks} />
					<section className="grid gap-6 xl:grid-cols-2">
						<div className="rounded-2xl border border-kumo-line bg-kumo-base p-5">
							<h2 className="text-lg font-semibold">Add client</h2>
							{isDemoMode && (
								<div className="mt-3 rounded-xl border border-dashed border-kumo-line bg-kumo-recessed p-3 text-sm text-kumo-subtle">
									<div className="font-medium text-kumo-default">Example input</div>
									<div className="mt-1">Client: Mina Park · Company: Acme Legal · Email: mina.park@acme.example · Owner: Jiyoon</div>
									<div>Notes: Contract renewal, invoice dispute, and reply draft review.</div>
								</div>
							)}
							<div className="mt-4">
								<ClientForm disabled={isDemoMode} onSubmit={async (client) => {
									await createClient.mutateAsync(client);
								}} />
							</div>
						</div>

						<div className="rounded-2xl border border-kumo-line bg-kumo-base p-5">
							<h2 className="text-lg font-semibold">Add request / task</h2>
							{isDemoMode && (
								<div className="mt-3 rounded-xl border border-dashed border-kumo-line bg-kumo-recessed p-3 text-sm text-kumo-subtle">
									<div className="font-medium text-kumo-default">Example task</div>
									<div className="mt-1">Summarize contract renewal thread and draft reply · Owner Jiyoon · Completion 68%</div>
								</div>
							)}
							<div className="mt-4">
								<TaskForm clients={dashboardData.clients} disabled={isDemoMode} onSubmit={async (task) => {
									await createTask.mutateAsync(task);
								}} />
							</div>
						</div>
					</section>
				</CollapsibleSection>

				<CollapsibleSection
					id="draft-review"
					title={getOperationSection("draft-review").title}
					description={getOperationSection("draft-review").description}
					defaultOpen={demoSectionOpen("draft-review")}
					active={activeSection === "draft-review"}
				>
					<DraftReviewOverview queue={queueData} />
				</CollapsibleSection>

				<CollapsibleSection
					id="tasks"
					title={getOperationSection("tasks").title}
					description={getOperationSection("tasks").description}
					defaultOpen={demoSectionOpen("tasks")}
					active={activeSection === "tasks"}
				>
					<div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
						<div>
							<h2 className="text-lg font-semibold">Operational work queue</h2>
							<p className="text-sm text-kumo-subtle">Filter, update status, adjust completion, and export report data.</p>
						</div>
						<div className="flex flex-wrap items-end gap-2">
							<Select label="Client" value={clientFilter} onValueChange={(value) => setClientFilter(value ?? "all")}>
								<Select.Option value="all">All clients</Select.Option>
								{dashboardData.clients.map((client) => (
									<Select.Option key={client.id} value={client.id}>{client.company}</Select.Option>
								))}
							</Select>
							<Select label="Status" value={statusFilter} onValueChange={(value) => setStatusFilter((value ?? "all") as AdminTaskStatus | "all")}>
								<Select.Option value="all">All statuses</Select.Option>
								{Object.entries(STATUS_LABELS).map(([value, label]) => (
									<Select.Option key={value} value={value}>{label}</Select.Option>
								))}
							</Select>
							<Button variant="secondary" onClick={exportCsv}>
								Export CSV
							</Button>
						</div>
					</div>
					<div className="mt-4">
						<TaskTimelineBoard
							tasks={filteredTasks}
							clients={dashboardData.clients}
							isDemoMode={isDemoMode}
							adminBase={adminBase}
						/>
					</div>
				</CollapsibleSection>
			</main>
		</div>
	);
}
