// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { Button, Loader, Tooltip } from "@cloudflare/kumo";
import { ArrowLeftIcon, TrayIcon } from "@phosphor-icons/react";
import { useCallback, useMemo, useReducer, useRef } from "react";
import { useNavigate } from "react-router";
import { Folders } from "shared/folders";
import { useMailboxParams } from "~/hooks/useMailboxParams";
import { useKeyboardShortcut } from "~/hooks/useKeyboardShortcut";
import { useUIStore } from "~/hooks/useUIStore";
import { useEmails, useMoveEmail, useUpdateEmail } from "~/queries/emails";
import InboxZeroCard, { InboxZeroEmpty } from "~/components/InboxZeroCard";
import type { Email } from "~/types";

// ---------------------------------------------------------------------------
// Queue reducer — pure state machine for the card navigation
// ---------------------------------------------------------------------------

interface QueueState {
	/** Original snapshot of unread email IDs (immutable once set). */
	ids: string[];
	/** Index into the remaining view. */
	index: number;
	/** Running count — decremented on archive/delete; unchanged on skip. */
	remaining: number;
}

type QueueAction =
	| { type: "init"; ids: string[] }
	| { type: "next" }
	| { type: "prev" }
	| { type: "consume" }; // archive or delete — removes current, auto-advances

function queueReducer(state: QueueState, action: QueueAction): QueueState {
	switch (action.type) {
		case "init":
			return { ids: action.ids, index: 0, remaining: action.ids.length };
		case "next":
			return {
				...state,
				index: Math.min(state.index + 1, state.ids.length - 1),
			};
		case "prev":
			return { ...state, index: Math.max(state.index - 1, 0) };
		case "consume": {
			const newIds = state.ids.filter((_, i) => i !== state.index);
			const newRemaining = state.remaining - 1;
			const newIndex = Math.min(state.index, newIds.length - 1);
			return {
				ids: newIds,
				index: Math.max(newIndex, 0),
				remaining: Math.max(newRemaining, 0),
			};
		}
		default:
			return state;
	}
}

// ---------------------------------------------------------------------------
// Route component
// ---------------------------------------------------------------------------

export default function InboxZeroRoute() {
	const { mailboxId, mailboxSlug } = useMailboxParams();
	const navigate = useNavigate();
	const { startCompose } = useUIStore();
	const moveEmail = useMoveEmail();
	const updateEmail = useUpdateEmail();

	// ---- Fetch unread inbox emails ----
	const params = useMemo(
		() => ({
			folder: Folders.INBOX,
			unread: "true",
			limit: "200",
		}),
		[],
	);
	const { data: emailData, isLoading } = useEmails(mailboxId, params);
	const allEmails = emailData?.emails ?? [];

	// ---- Queue state ----
	const [queue, dispatch] = useReducer(queueReducer, {
		ids: [],
		index: 0,
		remaining: 0,
	});

	// Track initialised — only dispatch "init" when the email list first loads
	// or changes (e.g. refetch). We compare by ID array reference via length +
	// first/last as a lightweight check.
	const prevFingerprint = useRef("");
	const fingerprint = allEmails.length > 0
		? `${allEmails.length}:${allEmails[0].id}:${allEmails[allEmails.length - 1].id}`
		: "";

	if (fingerprint !== prevFingerprint.current && allEmails.length > 0) {
		prevFingerprint.current = fingerprint;
		dispatch({ type: "init", ids: allEmails.map((e: Email) => e.id) });
	}

	// Resolve current email from queue
	const currentEmail: Email | undefined = useMemo(() => {
		if (queue.ids.length === 0) return undefined;
		const id = queue.ids[queue.index];
		return allEmails.find((e: Email) => e.id === id);
	}, [queue.ids, queue.index, allEmails]);

	// ---- Actions ----
	const goBack = useCallback(() => {
		navigate(`/mailbox/${mailboxSlug}/emails/inbox`);
	}, [navigate, mailboxSlug]);

	const advanceAfterAction = useCallback(() => {
		dispatch({ type: "consume" });
	}, []);

	const handleArchive = useCallback(() => {
		if (!mailboxId || !currentEmail) return;
		moveEmail.mutate(
			{ mailboxId, id: currentEmail.id, folderId: Folders.ARCHIVE },
			{ onSettled: advanceAfterAction },
		);
	}, [mailboxId, currentEmail, moveEmail, advanceAfterAction]);

	const handleDelete = useCallback(() => {
		if (!mailboxId || !currentEmail) return;
		moveEmail.mutate(
			{ mailboxId, id: currentEmail.id, folderId: Folders.TRASH },
			{ onSettled: advanceAfterAction },
		);
	}, [mailboxId, currentEmail, moveEmail, advanceAfterAction]);

	const handleReply = useCallback(() => {
		if (!currentEmail) return;
		// Mark as read first
		if (mailboxId && !currentEmail.read) {
			updateEmail.mutate({ mailboxId, id: currentEmail.id, data: { read: true } });
		}
		startCompose({ mode: "reply", originalEmail: currentEmail });
	}, [currentEmail, mailboxId, updateEmail, startCompose]);

	const handleSkip = useCallback(() => {
		dispatch({ type: "next" });
	}, []);

	// ---- Keyboard shortcuts ----
	const shortcutsEnabled = !!currentEmail;

	useKeyboardShortcut("j", () => dispatch({ type: "next" }), {
		enabled: shortcutsEnabled,
	});
	useKeyboardShortcut("k", () => dispatch({ type: "prev" }), {
		enabled: shortcutsEnabled,
	});
	useKeyboardShortcut("a", handleArchive, {
		enabled: shortcutsEnabled,
	});
	useKeyboardShortcut("d", handleDelete, {
		enabled: shortcutsEnabled,
	});
	useKeyboardShortcut("r", handleReply, {
		enabled: shortcutsEnabled,
	});
	useKeyboardShortcut("Escape", goBack, { enabled: true });

	// ---- Render ----
	const isEmpty = queue.remaining === 0 && !isLoading;

	return (
		<div className="flex flex-col h-full">
			{/* Header */}
			<div className="flex items-center gap-2 px-4 py-3.5 border-b border-kumo-line shrink-0 md:px-5">
				<Tooltip content="Back to inbox" side="bottom" asChild>
					<Button
						variant="ghost"
						shape="square"
						size="sm"
						icon={<ArrowLeftIcon size={18} />}
						onClick={goBack}
						aria-label="Back to inbox"
					/>
				</Tooltip>
				<div className="min-w-0 flex-1">
					<h1 className="text-lg font-semibold text-kumo-default flex items-center gap-2">
						<TrayIcon size={20} weight="regular" />
						Inbox Zero
					</h1>
				</div>
				{queue.remaining > 0 && (
					<span className="text-sm text-kumo-subtle">
						<span className="font-medium text-kumo-brand">{queue.remaining}</span>
						{" of "}
						{allEmails.length || queue.remaining} remaining
					</span>
				)}
			</div>

			{/* Card area */}
			<div className="flex-1 overflow-y-auto px-4 py-6 md:px-6">
				{isLoading ? (
					<div className="flex justify-center py-16">
						<Loader size="lg" />
					</div>
				) : isEmpty ? (
					<InboxZeroEmpty />
				) : currentEmail ? (
					<div className="max-w-3xl mx-auto">
						<InboxZeroCard
							email={currentEmail}
							remaining={queue.remaining}
							total={allEmails.length || queue.remaining}
							onArchive={handleArchive}
							onDelete={handleDelete}
							onReply={handleReply}
							onSkip={handleSkip}
						/>
					</div>
				) : (
					<div className="flex justify-center py-16">
						<Loader size="lg" />
					</div>
				)}
			</div>
		</div>
	);
}
