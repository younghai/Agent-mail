import { useState } from "react";
import { Link as RouterLink } from "react-router";
import { STATUS_LABELS } from "~/admin/domain";
import {
	groupTasksByTimeline,
	type TimelineBucket,
	type TimelineTab,
} from "~/lib/task-timeline";
import type { AdminClient, AdminTask } from "~/types";

/** Check whether a task's dueDate is strictly before today (local). */
function isOverdueTask(task: AdminTask, now: Date): boolean {
	if (!task.dueDate) return false;
	const parts = task.dueDate.split("T")[0].split("-");
	const due = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	return due.getTime() < today.getTime();
}

function TaskCard({
	task,
	client,
	isDemoMode,
	adminBase,
	now,
}: {
	task: AdminTask;
	client?: AdminClient;
	isDemoMode: boolean;
	adminBase: string;
	now: Date;
}) {
	const overdue = isOverdueTask(task, now);
	const urgent = task.priority === "urgent";

	const borderClass = overdue || urgent ? "border-l-4" : "";

	const cardStyle: React.CSSProperties = {};
	if (overdue) {
		cardStyle.borderLeftColor = "#ef4444";
		cardStyle.backgroundColor = "rgba(255, 235, 235, 0.5)";
	} else if (urgent) {
		cardStyle.borderLeftColor = "#d8b15f";
	}

	return (
		<div
			className={`rounded-lg border border-kumo-line bg-kumo-base p-3 transition-shadow hover:shadow-md ${borderClass}`}
			style={cardStyle}
		>
			<div className="flex items-start justify-between gap-2">
				<div className="min-w-0">
					{isDemoMode ? (
						<span className="text-sm font-medium text-kumo-default">{task.title}</span>
					) : (
						<RouterLink
							to={`${adminBase}/tasks/${task.id}`}
							className="text-sm font-medium text-kumo-default no-underline hover:underline"
						>
							{task.title}
						</RouterLink>
					)}
					<div className="mt-1 text-xs text-kumo-subtle">
						{client?.company ?? "Unknown"} · {task.owner || "Unassigned"} · {STATUS_LABELS[task.status]}
					</div>
				</div>
				<span
					className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
						task.priority === "urgent"
							? "bg-amber-100 text-amber-800"
							: task.priority === "high"
								? "bg-red-50 text-red-700"
								: "bg-kumo-recessed text-kumo-subtle"
					}`}
				>
					{task.priority}
				</span>
			</div>
			{task.dueDate && (
				<div className="mt-2 text-xs text-kumo-subtle">Due: {task.dueDate}</div>
			)}
			<div className="mt-2 h-1.5 overflow-hidden rounded-full bg-kumo-fill">
				<div
					className="h-full rounded-full"
					style={{ width: `${task.completion}%`, background: "#123c33" }}
				/>
			</div>
		</div>
	);
}

function BucketColumn({
	bucket,
	clients,
	isDemoMode,
	adminBase,
	now,
}: {
	bucket: TimelineBucket;
	clients: AdminClient[];
	isDemoMode: boolean;
	adminBase: string;
	now: Date;
}) {
	const isNoDue = bucket.key === "no-due";

	const headerClass = bucket.isOverdue
		? "text-kumo-destructive"
		: bucket.isToday
			? "text-kumo-brand"
			: "text-kumo-default";

	const columnBg = bucket.isOverdue ? "bg-kumo-tint" : "";

	return (
		<div
			className={`min-w-[200px] flex-1 rounded-xl border border-kumo-line p-3 ${columnBg} ${isNoDue ? "opacity-55" : ""}`}
		>
			<div className="mb-3 flex items-center justify-between">
				<h3 className={`text-sm font-semibold ${headerClass}`}>{bucket.label}</h3>
				<span className="rounded-full bg-kumo-recessed px-2 py-0.5 text-xs text-kumo-subtle">
					{bucket.tasks.length}
				</span>
			</div>
			<div className="space-y-2">
				{bucket.tasks.length === 0 ? (
					<div className="rounded-lg border border-dashed border-kumo-line px-3 py-4 text-center text-xs text-kumo-subtle">
						No tasks
					</div>
				) : (
					bucket.tasks.map((task) => (
						<TaskCard
							key={task.id}
							task={task}
							client={clients.find((c) => c.id === task.clientId)}
							isDemoMode={isDemoMode}
							adminBase={adminBase}
							now={now}
						/>
					))
				)}
			</div>
		</div>
	);
}

const TABS: { key: TimelineTab; label: string }[] = [
	{ key: "today", label: "Day" },
	{ key: "week", label: "Week" },
	{ key: "month", label: "Month" },
];

interface TaskTimelineBoardProps {
	tasks: AdminTask[];
	clients: AdminClient[];
	isDemoMode: boolean;
	adminBase: string;
}

export default function TaskTimelineBoard({
	tasks,
	clients,
	isDemoMode,
	adminBase,
}: TaskTimelineBoardProps) {
	const [activeTab, setActiveTab] = useState<TimelineTab>("today");
	const [now] = useState(() => new Date());

	const buckets = groupTasksByTimeline(tasks, activeTab, now);

	return (
		<div>
			<div className="mb-4 flex gap-1">
				{TABS.map(({ key, label }) => (
					<button
						key={key}
						type="button"
						onClick={() => setActiveTab(key)}
						className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
							activeTab === key
								? "bg-kumo-brand text-white"
								: "bg-kumo-recessed text-kumo-subtle hover:text-kumo-default"
						}`}
					>
						{label}
					</button>
				))}
			</div>
			<div className="flex gap-3 overflow-x-auto pb-2">
				{buckets.map((bucket) => (
					<BucketColumn
						key={bucket.key}
						bucket={bucket}
						clients={clients}
						isDemoMode={isDemoMode}
						adminBase={adminBase}
						now={now}
					/>
				))}
			</div>
		</div>
	);
}
