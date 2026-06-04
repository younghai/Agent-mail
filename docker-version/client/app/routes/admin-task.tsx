// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { Button, Input, Loader, Select, Textarea, useKumoToastManager } from "@cloudflare/kumo";
import { ArrowLeftIcon } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link as RouterLink, useParams } from "react-router";
import { useMailboxParams } from "~/hooks/useMailboxParams";
import api from "~/services/api";
import type { AdminTask, AdminTaskStatus } from "~/types";

const STATUS_LABELS: Record<AdminTaskStatus, string> = {
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

export function meta() {
	return [{ title: "Task Detail - Agentic Inbox" }];
}

function formatDate(value?: string | null) {
	if (!value) return "-";
	return new Date(value).toLocaleString();
}

export default function AdminTaskRoute() {
	const { taskId } = useParams<{ taskId: string }>();
	const { mailboxSlug } = useMailboxParams();
	const adminBase = mailboxSlug ? `/mailbox/${mailboxSlug}/admin` : "/admin";
	const toastManager = useKumoToastManager();
	const queryClient = useQueryClient();
	const { data, isLoading, error } = useQuery({
		queryKey: ["admin", "tasks", taskId],
		queryFn: () => api.getAdminTask(taskId!),
		enabled: !!taskId,
	});
	const [notes, setNotes] = useState("");

	const updateTask = useMutation({
		mutationFn: ({ id, task }: { id: string; task: Omit<AdminTask, "id" | "createdAt" | "updatedAt"> }) =>
			api.updateAdminTask(id, task),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["admin", "tasks", taskId] });
			queryClient.invalidateQueries({ queryKey: ["admin", "overview"] });
			toastManager.add({ title: "Task updated" });
		},
	});

	if (isLoading) {
		return <div className="flex h-full min-h-screen items-center justify-center bg-kumo-recessed"><Loader size="lg" /></div>;
	}

	if (error || !data) {
		return (
			<div className="h-full min-h-screen overflow-y-auto bg-kumo-recessed p-8">
				<div className="mx-auto max-w-3xl rounded-2xl border border-kumo-line bg-kumo-base p-8">
					<h1 className="text-xl font-semibold">Task unavailable</h1>
					<p className="mt-2 text-kumo-subtle">{error instanceof Error ? error.message : "Failed to load task."}</p>
				</div>
			</div>
		);
	}

	const task = data.task;
	const patchTask = async (patch: Partial<AdminTask>) => {
		await updateTask.mutateAsync({
			id: task.id,
			task: {
				clientId: patch.clientId ?? task.clientId,
				title: patch.title ?? task.title,
				type: patch.type ?? task.type,
				status: patch.status ?? task.status,
				priority: patch.priority ?? task.priority,
				owner: patch.owner ?? task.owner ?? "",
				dueDate: patch.dueDate ?? task.dueDate ?? "",
				completion: patch.completion ?? task.completion,
				mailboxId: patch.mailboxId ?? task.mailboxId ?? "",
				requestEmailId: patch.requestEmailId ?? task.requestEmailId ?? "",
				issue: patch.issue ?? task.issue ?? "",
				notes: patch.notes ?? task.notes ?? "",
			},
		});
	};

	return (
		<div className="h-full min-h-screen overflow-y-auto bg-[#eef1e8]">
			<header className="border-b border-kumo-line bg-kumo-base">
				<div className="mx-auto max-w-7xl px-4 py-5 md:px-6">
					<RouterLink to={adminBase} className="mb-3 inline-flex items-center gap-2 text-sm text-kumo-subtle no-underline hover:text-kumo-default">
						<ArrowLeftIcon size={16} />
						Admin
					</RouterLink>
					<h1 className="text-3xl font-bold text-kumo-default">{task.title}</h1>
					<p className="mt-1 text-kumo-subtle">
						{data.client ? (
							<RouterLink to={`${adminBase}/clients/${data.client.id}`} className="text-kumo-subtle no-underline hover:underline">
								{data.client.company}
							</RouterLink>
						) : "Unknown client"} · {task.type} · {task.priority}
					</p>
				</div>
			</header>

			<main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 md:px-6 xl:grid-cols-[1fr_0.8fr]">
				<section className="space-y-6">
					<div className="rounded-2xl border border-kumo-line bg-kumo-base p-5">
						<h2 className="text-lg font-semibold">Controls</h2>
						<div className="mt-4 grid gap-4 md:grid-cols-2">
							<Select label="Status" value={task.status} onValueChange={(value) => value && patchTask({ status: value as AdminTaskStatus })}>
								{Object.entries(STATUS_LABELS).map(([value, label]) => (
									<Select.Option key={value} value={value}>{label}</Select.Option>
								))}
							</Select>
							<Input
								label="Completion %"
								type="number"
								min={0}
								max={100}
								defaultValue={String(task.completion)}
								onBlur={(event) => {
									const completion = Math.min(Math.max(Number(event.target.value) || 0, 0), 100);
									if (completion !== task.completion) patchTask({ completion });
								}}
							/>
							<Input label="Owner" defaultValue={task.owner ?? ""} onBlur={(event) => patchTask({ owner: event.target.value })} />
							<Input label="Due date" type="date" defaultValue={task.dueDate ?? ""} onBlur={(event) => patchTask({ dueDate: event.target.value })} />
						</div>
						<div className="mt-4">
							<Textarea
								label="Notes"
								value={notes || task.notes || ""}
								onChange={(event) => setNotes(event.target.value)}
							/>
							<div className="mt-3 flex gap-2">
								<Button variant="primary" onClick={() => patchTask({ notes })}>Save notes</Button>
								<Button variant="secondary" onClick={() => patchTask({ status: "done", completion: 100 })}>Complete</Button>
							</div>
						</div>
					</div>

					<div className="rounded-2xl border border-kumo-line bg-kumo-base p-5">
						<h2 className="text-lg font-semibold">Source email</h2>
						{data.email ? (
							<div className="mt-4 rounded-xl bg-kumo-recessed p-4 text-sm">
								<div className="font-semibold">{data.email.subject || "(No subject)"}</div>
								<div className="mt-1 text-kumo-subtle">{data.email.sender} → {data.email.recipient}</div>
								<div className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap">
									{data.email.body_text || data.email.body || data.email.body_html || data.email.snippet || "No body"}
								</div>
							</div>
						) : (
							<div className="mt-4 rounded-xl border border-dashed border-kumo-line p-8 text-center text-sm text-kumo-subtle">
								No source email linked
							</div>
						)}
					</div>
				</section>

				<section className="space-y-6">
					<div className="rounded-2xl border border-kumo-line bg-kumo-base p-5">
						<h2 className="text-lg font-semibold">Timeline</h2>
						<div className="mt-4 space-y-3">
							{data.events.length === 0 ? (
								<div className="text-sm text-kumo-subtle">No task events yet</div>
							) : data.events.map((event) => (
								<div key={event.id} className="rounded-xl bg-kumo-recessed p-3 text-sm">
									<div className="font-medium">
										{event.eventType}
										{event.fromStatus || event.toStatus ? ` · ${event.fromStatus || "-"} → ${event.toStatus || "-"}` : ""}
									</div>
									<div className="text-kumo-subtle">{event.actorEmail} · {formatDate(event.createdAt)}</div>
								</div>
							))}
						</div>
					</div>

					<div className="rounded-2xl border border-kumo-line bg-kumo-base p-5">
						<h2 className="text-lg font-semibold">Audit log</h2>
						<div className="mt-4 space-y-3">
							{data.audits.length === 0 ? (
								<div className="text-sm text-kumo-subtle">No audit entries yet</div>
							) : data.audits.map((audit) => (
								<div key={audit.id} className="rounded-xl bg-kumo-recessed p-3 text-sm">
									<div className="font-medium">{audit.action}</div>
									<div className="text-kumo-subtle">{audit.actorEmail} · {formatDate(audit.createdAt)}</div>
								</div>
							))}
						</div>
					</div>
				</section>
			</main>
		</div>
	);
}
