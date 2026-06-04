import type { AdminTaskStatus } from "~/types";

export const STATUS_LABELS: Record<AdminTaskStatus, string> = {
	new: "New",
	triaged: "Triaged",
	assigned: "Assigned",
	in_progress: "In progress",
	waiting_client: "Waiting client",
	waiting_internal: "Waiting internal",
	done: "Done",
	closed: "Closed",
	blocked: "Blocked",
};

export const OPERATION_SECTIONS = [
	{
		key: "requests",
		label: "Requests",
		hash: "requests",
		title: "Requests",
		description: "Customer requests, issues, needs-reply mail, blockers, and waiting-client work.",
	},
	{
		key: "tasks",
		label: "Tasks",
		hash: "tasks",
		title: "Tasks",
		description: "Filter, update status, adjust completion, and export task/report data.",
	},
	{
		key: "clients",
		label: "Clients",
		hash: "clients",
		title: "Clients",
		description: "Client profiles, owners, notes, task counts, completion rates, and client creation.",
	},
	{
		key: "timeline",
		label: "Timeline",
		hash: "timeline",
		title: "Daily / weekly timeline dashboard",
		description: "Bar and line charts for daily operations and weekly task progress.",
	},
	{
		key: "draft-review",
		label: "Draft Review",
		hash: "draft-review",
		title: "Draft Review",
		description: "AI/user drafts waiting for review plus source emails that need a reply.",
	},
	{
		key: "ai-agents",
		label: "AI Agents",
		hash: "ai-agents",
		title: "AI Agents",
		description: "AI agent calls, token usage, chat hits, cost, errors, blocked calls, and limits.",
	},
	{
		key: "reports",
		label: "Reports",
		hash: "reports",
		title: "Mail volume by day / Request status",
		description: "Open this section to inspect mail volume and request state distribution.",
	},
] as const;

export type OperationSectionKey = (typeof OPERATION_SECTIONS)[number]["key"];

export function getOperationSection(key: OperationSectionKey) {
	return OPERATION_SECTIONS.find((section) => section.key === key)!;
}
