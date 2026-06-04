import type { AdminTask } from "~/types";

export type TimelineTab = "today" | "week" | "month";

export interface TimelineBucket {
	key: string;
	label: string;
	isToday?: boolean;
	isOverdue?: boolean;
	tasks: AdminTask[];
}

/** Parse a YYYY-MM-DD (or YYYY-MM-DDTHH:mm:ss) string as a local-date midnight. */
function parseLocalDate(dateStr: string): Date {
	const datePart = dateStr.split("T")[0];
	const parts = datePart.split("-");
	return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
}

/** Zero out time components, returning a fresh Date at local midnight. */
function startOfDay(d: Date): Date {
	return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Shift a date by n days (may be negative). */
function addDays(d: Date, n: number): Date {
	const out = new Date(d);
	out.setDate(out.getDate() + n);
	return out;
}

/** Compare two dates by local calendar day. */
function isSameDay(a: Date, b: Date): boolean {
	return (
		a.getFullYear() === b.getFullYear() &&
		a.getMonth() === b.getMonth() &&
		a.getDate() === b.getDate()
	);
}

/** YYYY-MM-DD from local date components (no timezone shift). */
function toLocalDateStr(d: Date): string {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, "0");
	const dd = String(d.getDate()).padStart(2, "0");
	return `${y}-${m}-${dd}`;
}

export function groupTasksByTimeline(
	tasks: AdminTask[],
	tab: TimelineTab,
	now: Date,
): TimelineBucket[] {
	switch (tab) {
		case "today":
			return groupByToday(tasks, now);
		case "week":
			return groupByWeek(tasks, now);
		case "month":
			return groupByMonth(tasks, now);
	}
}

/** Today tab: 기한초과 | 오늘 | 내일 | 이번 주 | 미정 (5 columns) */
function groupByToday(tasks: AdminTask[], now: Date): TimelineBucket[] {
	const today = startOfDay(now);
	const tomorrow = addDays(today, 1);

	const buckets: TimelineBucket[] = [
		{ key: "overdue", label: "기한초과", isOverdue: true, tasks: [] },
		{ key: "today", label: "오늘", isToday: true, tasks: [] },
		{ key: "tomorrow", label: "내일", tasks: [] },
		{ key: "rest-of-week", label: "이번 주", tasks: [] },
		{ key: "no-due", label: "미정", tasks: [] },
	];

	for (const task of tasks) {
		if (!task.dueDate) {
			buckets[4].tasks.push(task);
			continue;
		}
		const due = startOfDay(parseLocalDate(task.dueDate));
		if (due.getTime() < today.getTime()) {
			buckets[0].tasks.push(task);
		} else if (isSameDay(due, today)) {
			buckets[1].tasks.push(task);
		} else if (isSameDay(due, tomorrow)) {
			buckets[2].tasks.push(task);
		} else {
			buckets[3].tasks.push(task);
		}
	}

	return buckets;
}

/** Week tab: Mon~Sun 7 days + 미정 (8 columns) */
function groupByWeek(tasks: AdminTask[], now: Date): TimelineBucket[] {
	const today = startOfDay(now);
	const dow = today.getDay(); // 0 = Sun
	const mondayOffset = dow === 0 ? -6 : 1 - dow;
	const monday = addDays(today, mondayOffset);

	const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

	const buckets: TimelineBucket[] = dayLabels.map((label, i) => {
		const day = addDays(monday, i);
		return {
			key: toLocalDateStr(day),
			label,
			...(isSameDay(day, today) ? { isToday: true } : {}),
			tasks: [] as AdminTask[],
		};
	});
	buckets.push({ key: "no-due", label: "미정", tasks: [] });

	const weekStart = startOfDay(monday);
	const weekEnd = addDays(weekStart, 7);

	for (const task of tasks) {
		if (!task.dueDate) {
			buckets[7].tasks.push(task);
			continue;
		}
		const due = startOfDay(parseLocalDate(task.dueDate));
		if (due.getTime() >= weekStart.getTime() && due.getTime() < weekEnd.getTime()) {
			const diffMs = due.getTime() - weekStart.getTime();
			const dayIndex = Math.round(diffMs / 86400000);
			if (dayIndex >= 0 && dayIndex < 7) {
				buckets[dayIndex].tasks.push(task);
			} else {
				buckets[7].tasks.push(task);
			}
		} else {
			buckets[7].tasks.push(task);
		}
	}

	return buckets;
}

/** Month tab: W1~W5 + 미정 (6 columns) */
function groupByMonth(tasks: AdminTask[], now: Date): TimelineBucket[] {
	const year = now.getFullYear();
	const month = now.getMonth();
	const todayDate = now.getDate();
	const currentWeek = Math.ceil(todayDate / 7);

	const buckets: TimelineBucket[] = [1, 2, 3, 4, 5].map((w) => ({
		key: `W${w}`,
		label: `${w}주차`,
		...(w === currentWeek ? { isToday: true } : {}),
		tasks: [] as AdminTask[],
	}));
	buckets.push({ key: "no-due", label: "미정", tasks: [] });

	for (const task of tasks) {
		if (!task.dueDate) {
			buckets[5].tasks.push(task);
			continue;
		}
		const due = parseLocalDate(task.dueDate);
		if (due.getFullYear() === year && due.getMonth() === month) {
			const weekNum = Math.ceil(due.getDate() / 7);
			const idx = Math.min(weekNum, 5) - 1;
			buckets[idx].tasks.push(task);
		} else {
			buckets[5].tasks.push(task);
		}
	}

	return buckets;
}
