import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { groupTasksByTimeline } from "../app/lib/task-timeline.ts";
import type { AdminTask } from "../app/types/index.ts";

function makeTask(overrides: Partial<AdminTask> & { id: string }): AdminTask {
	return {
		clientId: "c1",
		title: "Test task",
		type: "task",
		status: "new",
		priority: "normal",
		completion: 0,
		createdAt: "2026-01-01",
		updatedAt: "2026-01-01",
		...overrides,
	};
}

/** Thursday, May 28, 2026 at noon local */
const NOW = new Date(2026, 4, 28, 12, 0, 0);

describe("groupTasksByTimeline", () => {
	// 1. empty input → correct bucket structure
	it("returns correct bucket structure for empty input on today tab", () => {
		const buckets = groupTasksByTimeline([], "today", NOW);
		assert.equal(buckets.length, 5);
		assert.equal(buckets[0].key, "overdue");
		assert.equal(buckets[1].key, "today");
		assert.equal(buckets[2].key, "tomorrow");
		assert.equal(buckets[3].key, "rest-of-week");
		assert.equal(buckets[4].key, "no-due");
		for (const b of buckets) {
			assert.equal(b.tasks.length, 0);
		}
	});

	// 2. today tab groups correctly
	it("groups tasks correctly on today tab", () => {
		const tasks = [
			makeTask({ id: "1", dueDate: "2026-05-25" }), // overdue (before Mon of this week)
			makeTask({ id: "2", dueDate: "2026-05-28" }), // today (Thu)
			makeTask({ id: "3", dueDate: "2026-05-29" }), // tomorrow (Fri)
			makeTask({ id: "4", dueDate: "2026-05-30" }), // rest of week (Sat)
			makeTask({ id: "5" }),                         // no due date
		];
		const buckets = groupTasksByTimeline(tasks, "today", NOW);

		assert.equal(buckets[0].tasks.length, 1); // overdue
		assert.equal(buckets[0].tasks[0].id, "1");
		assert.equal(buckets[1].tasks.length, 1); // today
		assert.equal(buckets[1].tasks[0].id, "2");
		assert.equal(buckets[2].tasks.length, 1); // tomorrow
		assert.equal(buckets[2].tasks[0].id, "3");
		assert.equal(buckets[3].tasks.length, 1); // rest of week
		assert.equal(buckets[3].tasks[0].id, "4");
		assert.equal(buckets[4].tasks.length, 1); // no due
		assert.equal(buckets[4].tasks[0].id, "5");
	});

	// 3. week tab labels Mon~Sun + 미정
	it("week tab has Mon-Sun labels plus 미정", () => {
		const buckets = groupTasksByTimeline([], "week", NOW);
		assert.equal(buckets.length, 8);
		assert.equal(buckets[0].label, "Mon");
		assert.equal(buckets[1].label, "Tue");
		assert.equal(buckets[2].label, "Wed");
		assert.equal(buckets[3].label, "Thu");
		assert.equal(buckets[4].label, "Fri");
		assert.equal(buckets[5].label, "Sat");
		assert.equal(buckets[6].label, "Sun");
		assert.equal(buckets[7].label, "미정");
	});

	// 4. month tab assigns to week-of-month
	it("month tab assigns tasks to correct week-of-month", () => {
		const tasks = [
			makeTask({ id: "m1", dueDate: "2026-05-03" }), // W1 (ceil(3/7)=1)
			makeTask({ id: "m2", dueDate: "2026-05-10" }), // W2 (ceil(10/7)=2)
			makeTask({ id: "m3", dueDate: "2026-05-17" }), // W3 (ceil(17/7)=3)
			makeTask({ id: "m4", dueDate: "2026-05-24" }), // W4 (ceil(24/7)=4)
			makeTask({ id: "m5", dueDate: "2026-05-29" }), // W5 (ceil(29/7)=5)
		];
		const buckets = groupTasksByTimeline(tasks, "month", NOW);

		assert.equal(buckets.length, 6); // W1-W5 + 미정
		assert.equal(buckets[0].key, "W1");
		assert.equal(buckets[0].tasks.length, 1);
		assert.equal(buckets[0].tasks[0].id, "m1");
		assert.equal(buckets[1].key, "W2");
		assert.equal(buckets[1].tasks[0].id, "m2");
		assert.equal(buckets[4].key, "W5");
		assert.equal(buckets[4].tasks[0].id, "m5");
	});

	// 5. overdue tasks → overdue bucket
	it("overdue tasks go to overdue bucket on today tab", () => {
		const tasks = [
			makeTask({ id: "past1", dueDate: "2026-05-26" }), // 2 days before today
			makeTask({ id: "past2", dueDate: "2026-05-01" }), // far past
		];
		const buckets = groupTasksByTimeline(tasks, "today", NOW);
		assert.equal(buckets[0].key, "overdue");
		assert.equal(buckets[0].isOverdue, true);
		assert.equal(buckets[0].tasks.length, 2);
	});

	// 6. tasks without due date → 미정
	it("tasks without due date go to 미정 bucket", () => {
		const tasks = [
			makeTask({ id: "nd1" }),
			makeTask({ id: "nd2", dueDate: undefined }),
		];

		const todayBuckets = groupTasksByTimeline(tasks, "today", NOW);
		assert.equal(todayBuckets[4].label, "미정");
		assert.equal(todayBuckets[4].tasks.length, 2);

		const weekBuckets = groupTasksByTimeline(tasks, "week", NOW);
		assert.equal(weekBuckets[7].label, "미정");
		assert.equal(weekBuckets[7].tasks.length, 2);

		const monthBuckets = groupTasksByTimeline(tasks, "month", NOW);
		assert.equal(monthBuckets[5].label, "미정");
		assert.equal(monthBuckets[5].tasks.length, 2);
	});

	// 7. urgent priority preserved
	it("preserves urgent priority in bucket tasks", () => {
		const tasks = [
			makeTask({ id: "u1", priority: "urgent", dueDate: "2026-05-28" }),
			makeTask({ id: "n1", priority: "normal", dueDate: "2026-05-28" }),
		];
		const buckets = groupTasksByTimeline(tasks, "today", NOW);
		const todayBucket = buckets[1];
		assert.equal(todayBucket.tasks.length, 2);
		assert.equal(todayBucket.tasks[0].priority, "urgent");
		assert.equal(todayBucket.tasks[1].priority, "normal");
	});

	// 8. now boundary respected (timezone-safe)
	it("respects now boundary — task due exactly today goes to today bucket", () => {
		const midnight = new Date(2026, 4, 28, 0, 0, 0);
		const endOfDay = new Date(2026, 4, 28, 23, 59, 59);
		const task = makeTask({ id: "t1", dueDate: "2026-05-28" });

		const atMidnight = groupTasksByTimeline([task], "today", midnight);
		assert.equal(atMidnight[1].tasks.length, 1);
		assert.equal(atMidnight[0].tasks.length, 0);

		const atEndOfDay = groupTasksByTimeline([task], "today", endOfDay);
		assert.equal(atEndOfDay[1].tasks.length, 1);
		assert.equal(atEndOfDay[0].tasks.length, 0);
	});

	// 9. week tab assigns to correct day columns
	it("week tab assigns tasks to correct day columns", () => {
		// Week of May 25 (Mon) – May 31 (Sun), 2026
		const tasks = [
			makeTask({ id: "w-mon", dueDate: "2026-05-25" }),
			makeTask({ id: "w-wed", dueDate: "2026-05-27" }),
			makeTask({ id: "w-sun", dueDate: "2026-05-31" }),
		];
		const buckets = groupTasksByTimeline(tasks, "week", NOW);

		assert.equal(buckets[0].tasks.length, 1); // Mon
		assert.equal(buckets[0].tasks[0].id, "w-mon");
		assert.equal(buckets[2].tasks.length, 1); // Wed
		assert.equal(buckets[2].tasks[0].id, "w-wed");
		assert.equal(buckets[6].tasks.length, 1); // Sun
		assert.equal(buckets[6].tasks[0].id, "w-sun");
	});

	// 10. week tab sends outside-week tasks to 미정
	it("week tab sends tasks outside current week to 미정", () => {
		const tasks = [
			makeTask({ id: "next-week", dueDate: "2026-06-01" }),
			makeTask({ id: "prev-week", dueDate: "2026-05-24" }),
		];
		const buckets = groupTasksByTimeline(tasks, "week", NOW);
		assert.equal(buckets[7].tasks.length, 2);
	});

	// 11. month tab sends outside-month tasks to 미정
	it("month tab sends tasks outside current month to 미정", () => {
		const tasks = [
			makeTask({ id: "prev-month", dueDate: "2026-04-30" }),
			makeTask({ id: "next-month", dueDate: "2026-06-01" }),
		];
		const buckets = groupTasksByTimeline(tasks, "month", NOW);
		assert.equal(buckets[5].tasks.length, 2);
	});

	// 12. today tab bucket flags
	it("today tab sets isOverdue and isToday flags correctly", () => {
		const buckets = groupTasksByTimeline([], "today", NOW);
		assert.equal(buckets[0].isOverdue, true);
		assert.equal(buckets[0].isToday, undefined);
		assert.equal(buckets[1].isToday, true);
		assert.equal(buckets[1].isOverdue, undefined);
		assert.equal(buckets[2].isToday, undefined);
		assert.equal(buckets[3].isToday, undefined);
		assert.equal(buckets[4].isToday, undefined);
	});

	// 13. month tab marks current week with isToday
	it("month tab marks current week with isToday", () => {
		// May 28 → ceil(28/7) = 4 → W4 is current week
		const buckets = groupTasksByTimeline([], "month", NOW);
		assert.equal(buckets[3].key, "W4");
		assert.equal(buckets[3].isToday, true);
		assert.equal(buckets[0].isToday, undefined);
		assert.equal(buckets[4].isToday, undefined);
	});

	// 14. week tab marks today column
	it("week tab marks today column with isToday", () => {
		const buckets = groupTasksByTimeline([], "week", NOW);
		// May 28, 2026 is Thursday → index 3 (Mon=0, Tue=1, Wed=2, Thu=3)
		assert.equal(buckets[3].isToday, true);
		assert.equal(buckets[0].isToday, undefined);
		assert.equal(buckets[6].isToday, undefined);
	});
});
