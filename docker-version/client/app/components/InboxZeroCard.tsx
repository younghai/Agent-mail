// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { Button, Tooltip } from "@cloudflare/kumo";
import {
	ArchiveIcon,
	ArrowBendUpLeftIcon,
	CheckCircleIcon,
	SkipForwardIcon,
	TrashIcon,
} from "@phosphor-icons/react";
import { formatListDate } from "shared/dates";
import EmailIframe from "~/components/EmailIframe";
import type { Email } from "~/types";

interface InboxZeroCardProps {
	email: Email;
	remaining: number;
	total: number;
	onArchive: () => void;
	onDelete: () => void;
	onReply: () => void;
	onSkip: () => void;
}

export default function InboxZeroCard({
	email,
	remaining,
	total,
	onArchive,
	onDelete,
	onReply,
	onSkip,
}: InboxZeroCardProps) {
	const displayBody = email.body_html ?? email.body ?? email.body_text ?? "";

	return (
		<article
			className="flex flex-col bg-kumo-default rounded-lg border border-kumo-line shadow-sm overflow-hidden"
			aria-live="polite"
			aria-label={`Email ${remaining} of ${total} opened from ${email.sender}`}
		>
			{/* Header */}
			<div className="px-6 py-4 border-b border-kumo-line">
				<div className="flex items-start justify-between gap-3">
					<div className="min-w-0 flex-1">
						<h2 className="text-lg font-semibold text-kumo-default truncate">
							{email.subject || "(No subject)"}
						</h2>
						<div className="flex items-center gap-2 mt-1 text-sm text-kumo-subtle">
							<span className="font-medium text-kumo-strong truncate">
								{email.sender}
							</span>
							<span className="shrink-0">&middot;</span>
							<span className="shrink-0">
								{formatListDate(email.date)}
							</span>
						</div>
					</div>
					<div className="shrink-0 text-sm text-kumo-subtle text-right">
						<span className="font-medium text-kumo-brand">{remaining}</span>
						{" of "}
						<span>{total}</span>
						<span className="block text-xs">remaining</span>
					</div>
				</div>
			</div>

			{/* Body */}
			<div className="flex-1 overflow-y-auto" style={{ minHeight: 200, maxHeight: "calc(100vh - 320px)" }}>
				{displayBody ? (
					<EmailIframe body={displayBody} autoSize />
				) : (
					<div className="px-6 py-8 text-sm text-kumo-subtle italic text-center">
						No content
					</div>
				)}
			</div>

			{/* Action bar */}
			<div className="flex items-center justify-center gap-3 px-6 py-3 border-t border-kumo-line bg-kumo-recessed">
				<Tooltip content="Reply (r)" side="top" asChild>
					<Button
						variant="secondary"
						size="sm"
						icon={<ArrowBendUpLeftIcon size={16} />}
						onClick={onReply}
						aria-label="Reply to email"
					>
						Reply
						<kbd className="ml-1.5 text-xs bg-kumo-fill text-kumo-subtle rounded px-1.5 py-0.5 font-mono border border-kumo-line">
							r
						</kbd>
					</Button>
				</Tooltip>
				<Tooltip content="Archive (a)" side="top" asChild>
					<Button
						variant="secondary"
						size="sm"
						icon={<ArchiveIcon size={16} />}
						onClick={onArchive}
						aria-label="Archive email"
					>
						Archive
						<kbd className="ml-1.5 text-xs bg-kumo-fill text-kumo-subtle rounded px-1.5 py-0.5 font-mono border border-kumo-line">
							a
						</kbd>
					</Button>
				</Tooltip>
				<Tooltip content="Delete (d)" side="top" asChild>
					<Button
						variant="secondary"
						size="sm"
						icon={<TrashIcon size={16} />}
						onClick={onDelete}
						aria-label="Delete email"
					>
						Delete
						<kbd className="ml-1.5 text-xs bg-kumo-fill text-kumo-subtle rounded px-1.5 py-0.5 font-mono border border-kumo-line">
							d
						</kbd>
					</Button>
				</Tooltip>
				<Tooltip content="Skip (j)" side="top" asChild>
					<Button
						variant="secondary"
						size="sm"
						icon={<SkipForwardIcon size={16} />}
						onClick={onSkip}
						aria-label="Skip to next email"
					>
						Skip
						<kbd className="ml-1.5 text-xs bg-kumo-fill text-kumo-subtle rounded px-1.5 py-0.5 font-mono border border-kumo-line">
							j
						</kbd>
					</Button>
				</Tooltip>
			</div>
		</article>
	);
}

/** Shown when all emails have been processed. */
export function InboxZeroEmpty() {
	return (
		<div className="flex flex-col items-center justify-center py-24 px-6 text-center">
			<div className="mb-4">
				<CheckCircleIcon
					size={64}
					weight="thin"
					className="text-kumo-brand"
				/>
			</div>
			<h2 className="text-xl font-semibold text-kumo-default mb-2">
				Inbox Zero!
			</h2>
			<p className="text-sm text-kumo-subtle max-w-sm">
				You&apos;ve processed all unread emails. Great work!
			</p>
		</div>
	);
}
