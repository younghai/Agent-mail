import type { AdminTask } from "~/types";
import { STATUS_LABELS } from "./domain";

export interface DailyTimelineItem {
	time: string;
	title: string;
	detail: string;
	status: string;
}

export interface WeeklyTimelineItem {
	day: string;
	title: string;
	detail: string;
	completion: number;
}

export const DAILY_STATUS_SCORE: Record<string, number> = {
	Done: 100,
	"In progress": 68,
	Active: 58,
	Scheduled: 35,
	Blocked: 22,
};

function formatShortDate(value?: string | null) {
	if (!value) return "No date";
	try {
		return new Intl.DateTimeFormat(undefined, {
			month: "short",
			day: "numeric",
		}).format(new Date(value));
	} catch {
		return value;
	}
}

function formatTime(value?: string | null) {
	if (!value) return "--:--";
	try {
		return new Intl.DateTimeFormat(undefined, {
			hour: "2-digit",
			minute: "2-digit",
		}).format(new Date(value));
	} catch {
		return value;
	}
}

export function buildDailyTimeline(tasks: AdminTask[]): DailyTimelineItem[] {
	if (tasks.length === 0) return [];
	return tasks
		.slice()
		.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
		.slice(0, 6)
		.map((task) => ({
			time: formatTime(task.updatedAt),
			title: task.title,
			detail: `${STATUS_LABELS[task.status]} · ${task.owner || "Unassigned"} · ${task.completion}% complete`,
			status: task.status === "blocked" ? "Blocked" : task.status === "done" || task.status === "closed" ? "Done" : "Active",
		}));
}

export function buildWeeklyTimeline(tasks: AdminTask[]): WeeklyTimelineItem[] {
	if (tasks.length === 0) return [];
	return tasks
		.slice()
		.sort((a, b) => new Date(a.dueDate || a.updatedAt).getTime() - new Date(b.dueDate || b.updatedAt).getTime())
		.slice(0, 7)
		.map((task) => ({
			day: formatShortDate(task.dueDate || task.updatedAt),
			title: task.title,
			detail: `${STATUS_LABELS[task.status]} · ${task.priority} priority · ${task.owner || "Unassigned"}`,
			completion: task.completion,
		}));
}
