// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { Loader } from "@cloudflare/kumo";
import { ArrowLeftIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { Link as RouterLink, useParams } from "react-router";
import { useMailboxParams } from "~/hooks/useMailboxParams";
import api from "~/services/api";

export function meta() {
	return [{ title: "Client Detail - Agentic Inbox" }];
}

function formatDate(value?: string | null) {
	if (!value) return "-";
	return new Date(value).toLocaleString();
}

export default function AdminClientRoute() {
	const { clientId } = useParams<{ clientId: string }>();
	const { mailboxSlug } = useMailboxParams();
	const adminBase = mailboxSlug ? `/mailbox/${mailboxSlug}/admin` : "/admin";
	const { data, isLoading, error } = useQuery({
		queryKey: ["admin", "clients", clientId],
		queryFn: () => api.getAdminClient(clientId!),
		enabled: !!clientId,
	});

	if (isLoading) {
		return <div className="flex h-full min-h-screen items-center justify-center bg-kumo-recessed"><Loader size="lg" /></div>;
	}

	if (error || !data) {
		return (
			<div className="h-full min-h-screen overflow-y-auto bg-kumo-recessed p-8">
				<div className="mx-auto max-w-3xl rounded-2xl border border-kumo-line bg-kumo-base p-8">
					<h1 className="text-xl font-semibold">Client unavailable</h1>
					<p className="mt-2 text-kumo-subtle">{error instanceof Error ? error.message : "Failed to load client."}</p>
				</div>
			</div>
		);
	}

	const completion = data.stats.totalTasks
		? Math.round((data.stats.completedTasks / data.stats.totalTasks) * 100)
		: 0;

	return (
		<div className="h-full min-h-screen overflow-y-auto bg-[#eef1e8]">
			<header className="border-b border-kumo-line bg-kumo-base">
				<div className="mx-auto max-w-7xl px-4 py-5 md:px-6">
					<RouterLink to={adminBase} className="mb-3 inline-flex items-center gap-2 text-sm text-kumo-subtle no-underline hover:text-kumo-default">
						<ArrowLeftIcon size={16} />
						Admin
					</RouterLink>
					<h1 className="text-3xl font-bold text-kumo-default">{data.client.company}</h1>
					<p className="mt-1 text-kumo-subtle">{data.client.name} · {data.client.email || "No email"} · Owner {data.client.owner || "Unassigned"}</p>
				</div>
			</header>

			<main className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-6">
				<section className="grid gap-4 md:grid-cols-4">
					<div className="rounded-2xl border border-kumo-line bg-kumo-base p-5">
						<div className="text-sm text-kumo-subtle">Open tasks</div>
						<div className="mt-2 text-3xl font-bold">{data.stats.openTasks}</div>
					</div>
					<div className="rounded-2xl border border-kumo-line bg-kumo-base p-5">
						<div className="text-sm text-kumo-subtle">Completed</div>
						<div className="mt-2 text-3xl font-bold">{data.stats.completedTasks}</div>
					</div>
					<div className="rounded-2xl border border-kumo-line bg-kumo-base p-5">
						<div className="text-sm text-kumo-subtle">Overdue</div>
						<div className="mt-2 text-3xl font-bold">{data.stats.overdueTasks}</div>
					</div>
					<div className="rounded-2xl border border-kumo-line bg-kumo-base p-5">
						<div className="text-sm text-kumo-subtle">Completion</div>
						<div className="mt-2 text-3xl font-bold">{completion}%</div>
					</div>
				</section>

				<section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
					<div className="rounded-2xl border border-kumo-line bg-kumo-base p-5">
						<h2 className="text-lg font-semibold">Tasks</h2>
						<div className="mt-4 overflow-hidden rounded-xl border border-kumo-line">
							<table className="w-full text-left text-sm">
								<thead className="bg-kumo-recessed text-xs uppercase tracking-wide text-kumo-subtle">
									<tr>
										<th className="px-4 py-3">Task</th>
										<th className="px-4 py-3">Status</th>
										<th className="px-4 py-3">Owner</th>
										<th className="px-4 py-3">Completion</th>
									</tr>
								</thead>
								<tbody>
									{data.tasks.length === 0 ? (
										<tr><td colSpan={4} className="px-4 py-8 text-center text-kumo-subtle">No tasks for this client</td></tr>
									) : data.tasks.map((task) => (
										<tr key={task.id} className="border-t border-kumo-line">
											<td className="px-4 py-3 font-medium">
												<RouterLink to={`${adminBase}/tasks/${task.id}`} className="text-kumo-default no-underline hover:underline">
													{task.title}
												</RouterLink>
											</td>
											<td className="px-4 py-3">{task.status}</td>
											<td className="px-4 py-3 text-kumo-subtle">{task.owner || "-"}</td>
											<td className="px-4 py-3">{task.completion}%</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>

					<div className="space-y-6">
						<div className="rounded-2xl border border-kumo-line bg-kumo-base p-5">
							<h2 className="text-lg font-semibold">Related emails</h2>
							<div className="mt-3 space-y-2">
								{data.relatedEmails.length === 0 ? (
									<div className="rounded-xl border border-dashed border-kumo-line p-6 text-center text-sm text-kumo-subtle">No related emails found</div>
								) : data.relatedEmails.map((email) => (
									<div key={email.id} className="rounded-xl bg-kumo-recessed p-3 text-sm">
										<div className="font-medium">{email.subject || "(No subject)"}</div>
										<div className="text-kumo-subtle">{email.sender} · {formatDate(email.received_at || email.receivedAt)}</div>
									</div>
								))}
							</div>
						</div>

						<div className="rounded-2xl border border-kumo-line bg-kumo-base p-5">
							<h2 className="text-lg font-semibold">Audit trail</h2>
							<div className="mt-3 space-y-2">
								{data.audits.length === 0 ? (
									<div className="text-sm text-kumo-subtle">No audit events yet</div>
								) : data.audits.map((audit) => (
									<div key={audit.id} className="rounded-xl bg-kumo-recessed p-3 text-sm">
										<div className="font-medium">{audit.action}</div>
										<div className="text-kumo-subtle">{audit.actorEmail} · {formatDate(audit.createdAt)}</div>
									</div>
								))}
							</div>
						</div>
					</div>
				</section>

				<RouterLink
					to={adminBase}
					className="inline-flex rounded-md border border-kumo-line bg-kumo-base px-4 py-2 text-sm font-medium text-kumo-default no-underline hover:bg-kumo-tint"
				>
					Back to dashboard
				</RouterLink>
			</main>
		</div>
	);
}
