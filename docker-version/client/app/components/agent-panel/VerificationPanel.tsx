// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { Button, Empty, Loader } from "@cloudflare/kumo";
import { CheckCircleIcon, ProhibitIcon } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import api from "~/services/api";

type PendingApproval = Awaited<
	ReturnType<typeof api.listPendingApprovals>
>[number];

interface VerificationPanelProps {
	mailboxId: string | undefined;
}

const QUERY_KEY = (mailboxId: string) =>
	["approvals", "pending", mailboxId] as const;

function plainBodyPreview(html: string | null): string {
	if (!html) return "";
	return html
		.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
		.replace(/<[^>]+>/g, " ")
		.replace(/\s+/g, " ")
		.trim()
		.slice(0, 240);
}

export default function VerificationPanel({ mailboxId }: VerificationPanelProps) {
	const qc = useQueryClient();
	const [actingId, setActingId] = useState<string | null>(null);

	const { data: approvals = [], isLoading } = useQuery<PendingApproval[]>({
		queryKey: mailboxId ? QUERY_KEY(mailboxId) : ["approvals", "_disabled"],
		queryFn: () => api.listPendingApprovals(mailboxId!) as Promise<PendingApproval[]>,
		enabled: !!mailboxId,
		refetchInterval: 30_000,
	});

	const transition = useMutation({
		mutationFn: (input: {
			emailId: string;
			action: "approve" | "reject";
		}) =>
			api.transitionApproval(mailboxId!, input.emailId, {
				action: input.action,
				comment: null,
			}),
		onSuccess: () => {
			if (mailboxId) qc.invalidateQueries({ queryKey: QUERY_KEY(mailboxId) });
		},
		onSettled: () => setActingId(null),
	});

	const handleApprove = (emailId: string) => {
		setActingId(emailId);
		transition.mutate({ emailId, action: "approve" });
	};

	const handleReject = (emailId: string) => {
		setActingId(emailId);
		transition.mutate({ emailId, action: "reject" });
	};

	if (!mailboxId) return null;

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-full">
				<Loader />
			</div>
		);
	}

	if (approvals.length === 0) {
		return (
			<div className="flex items-center justify-center h-full px-4">
				<Empty
					icon={<CheckCircleIcon size={32} className="text-kumo-inactive" />}
					title="Nothing pending"
					description="Drafts awaiting human approval will appear here."
				/>
			</div>
		);
	}

	return (
		<ul role="list" className="flex flex-col gap-3 px-3 py-3">
			{approvals.map((approval) => {
				const acting = actingId === approval.id && transition.isPending;
				return (
					<li
						key={approval.id}
						className="rounded-lg border border-kumo-line p-3 bg-kumo-elevated"
					>
						<div className="mb-1.5">
							<div className="text-xs text-kumo-subtle truncate">
								to {approval.recipient || "Unknown"}
							</div>
							<div className="text-sm font-medium text-kumo-default truncate">
								{approval.subject || "(No subject)"}
							</div>
						</div>
						<p className="text-[12px] leading-relaxed text-kumo-strong line-clamp-3 mb-2">
							{plainBodyPreview(approval.body)}
						</p>
						<div className="flex items-center gap-2">
							<Button
								type="button"
								variant="primary"
								size="sm"
								icon={<CheckCircleIcon size={14} weight="bold" />}
								loading={acting && transition.variables?.action === "approve"}
								disabled={acting}
								onClick={() => handleApprove(approval.id)}
							>
								Approve
							</Button>
							<Button
								type="button"
								variant="secondary"
								size="sm"
								icon={<ProhibitIcon size={14} weight="bold" />}
								loading={acting && transition.variables?.action === "reject"}
								disabled={acting}
								onClick={() => handleReject(approval.id)}
							>
								Reject
							</Button>
						</div>
					</li>
				);
			})}
		</ul>
	);
}
