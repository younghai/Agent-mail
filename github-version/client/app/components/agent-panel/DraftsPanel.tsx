// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { Badge, Empty, Loader } from "@cloudflare/kumo";
import { FileIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useUIStore } from "~/hooks/useUIStore";
import api from "~/services/api";
import type { Email } from "~/types";

interface Citation {
	type: "email" | "attachment";
	id: string;
	snippet?: string;
}

interface DraftsPanelProps {
	mailboxId: string | undefined;
}

const QUERY_KEY = (mailboxId: string) =>
	["drafts", mailboxId] as const;

function plainBodyPreview(html: string | null): string {
	if (!html) return "";
	return html
		.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
		.replace(/<[^>]+>/g, " ")
		.replace(/\s+/g, " ")
		.trim()
		.slice(0, 240);
}

export default function DraftsPanel({ mailboxId }: DraftsPanelProps) {
	const selectEmail = useUIStore((s) => s.selectEmail);

	const { data: drafts = [], isLoading } = useQuery<Email[]>({
		queryKey: mailboxId ? QUERY_KEY(mailboxId) : ["drafts", "_disabled"],
		queryFn: async () => {
			const result = await api.listEmails(mailboxId!, { folder: "draft" });
			if (result && typeof result === "object" && "emails" in result) {
				return (result as { emails: Email[] }).emails ?? [];
			}
			return Array.isArray(result) ? result : [];
		},
		enabled: !!mailboxId,
		refetchInterval: 30_000,
	});

	if (!mailboxId) return null;

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-full">
				<Loader />
			</div>
		);
	}

	if (drafts.length === 0) {
		return (
			<div className="flex items-center justify-center h-full px-4">
				<Empty
					icon={<FileIcon size={32} className="text-kumo-inactive" />}
					title="Pending drafts"
					description="Drafts the agent generates will appear here for quick review."
				/>
			</div>
		);
	}

	const handleCitationClick = (citation: Citation) => {
		if (citation.type === "email") {
			selectEmail(citation.id);
		}
		// TODO: attachment citation click — navigate to attachment view
	};

	return (
		<ul role="list" className="flex flex-col gap-3 px-3 py-3">
			{drafts.map((draft) => {
				let citations: Citation[] = [];
				if (draft.citations_json) {
					try {
						citations = JSON.parse(draft.citations_json) as Citation[];
					} catch {
						// ignore malformed JSON
					}
				}

				return (
					<li
						key={draft.id}
						className="rounded-lg border border-kumo-line p-3 bg-kumo-elevated"
					>
						<div className="mb-1.5">
							<div className="text-xs text-kumo-subtle truncate">
								{draft.sender || "Agent"}
							</div>
							<div className="text-sm font-medium text-kumo-default truncate">
								{draft.subject || "(No subject)"}
							</div>
						</div>
						<p className="text-[12px] leading-relaxed text-kumo-strong line-clamp-3 mb-2">
							{plainBodyPreview(draft.body ?? draft.snippet ?? null)}
						</p>
						{citations.length > 0 && (
							<div className="flex flex-wrap gap-1.5 mt-2">
								{citations.map((citation) => (
									<Badge
										key={`${citation.type}:${citation.id}`}
										variant="outline"
									>
										<button
											type="button"
											onClick={() => handleCitationClick(citation)}
											aria-label={`Source: ${citation.type} ${citation.id}`}
											className="bg-transparent border-0 cursor-pointer p-0 text-inherit font-inherit text-[11px]"
										>
											{citation.type === "email" ? "📧" : "📎"}{" "}
											{citation.id.length > 16
												? `${citation.id.slice(0, 8)}…${citation.id.slice(-4)}`
												: citation.id}
										</button>
									</Badge>
								))}
							</div>
						)}
					</li>
				);
			})}
		</ul>
	);
}
