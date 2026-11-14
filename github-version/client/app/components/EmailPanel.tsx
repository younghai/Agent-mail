// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { Button, useKumoToastManager } from "@cloudflare/kumo";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router";
import { useMailboxParams } from "~/hooks/useMailboxParams";
import { Folders } from "shared/folders";
import AgentSurface from "~/components/AgentSurface";
import EmailPanelDialogs from "~/components/email-panel/EmailPanelDialogs";
import EmailPanelHeader from "~/components/email-panel/EmailPanelHeader";
import EmailPanelToolbar from "~/components/email-panel/EmailPanelToolbar";
import CampaignActions from "~/components/email-panel/CampaignActions";
import { findDemo } from "../../shared/campaign-demo.js";
import SingleMessageView from "~/components/email-panel/SingleMessageView";
import ThreadMessage from "~/components/email-panel/ThreadMessage";
import { splitEmailList, toEmailListValue } from "~/lib/utils";
import api from "~/services/api";
import { useDeleteEmail, useEmail, useMoveEmail, useReplyToEmail, useSendEmail, useThreadReplies, useUpdateEmail } from "~/queries/emails";
import { useFolders } from "~/queries/folders";
import { useMailbox } from "~/queries/mailboxes";
import { useCustomerSegments } from "~/queries/segments";
import { useUIStore } from "~/hooks/useUIStore";
import { ADMIN_TOKENS } from "~/admin/designTokens";
import type { Email, Folder, Mailbox } from "~/types";

function EmailPanelSkeleton() {
	return (
		<div className="animate-pulse p-5 space-y-4">
			<div className="h-5 w-2/3 rounded bg-kumo-fill" />
			<div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-kumo-fill" /><div className="space-y-2 flex-1"><div className="h-3 w-40 rounded bg-kumo-fill" /><div className="h-2.5 w-24 rounded bg-kumo-fill" /></div></div>
			<div className="space-y-2 pt-4"><div className="h-2.5 w-full rounded bg-kumo-fill" /><div className="h-2.5 w-5/6 rounded bg-kumo-fill" /><div className="h-2.5 w-4/6 rounded bg-kumo-fill" /><div className="h-2.5 w-3/4 rounded bg-kumo-fill" /></div>
		</div>
	);
}

function stripHtml(value?: string | null) {
	return (value || "")
		.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
		.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
		.replace(/<[^>]*>/g, " ")
		.replace(/\s+/g, " ")
		.trim();
}

function formatAgentDate(value?: string | null) {
	if (!value) return "No date";
	try {
		const d = new Date(value);
		if (isNaN(d.getTime())) return value;
		const pad = (n: number) => String(n).padStart(2, "0");
		return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
	} catch {
		return value;
	}
}

function resolveDate(msg: Email & { email_date?: string; received_at?: string }) {
	return msg.email_date || msg.received_at || msg.date || null;
}

function senderLabel(email: Email) {
	return email.sender || email.recipient || "Unknown sender";
}

function EmailAgentResults({
	email,
	messages,
	mailboxEmail,
	draftCount,
	lastReceivedMessage,
	onDraftReply,
	onCreateTask,
	isCreatingTask,
}: {
	email: Email;
	messages: Email[];
	mailboxEmail?: string;
	draftCount: number;
	lastReceivedMessage?: Email;
	onDraftReply: () => void;
	onCreateTask: () => void;
	isCreatingTask: boolean;
}) {
	const participants = Array.from(
		new Set(
			messages
				.flatMap((msg) => [msg.sender, msg.recipient])
				.filter(Boolean)
				.map((value) => value.trim()),
		),
	).slice(0, 5);
	const latest = messages[0] || email;
	const latestText =
		stripHtml(latest.body_text) ||
		stripHtml(latest.snippet) ||
		stripHtml(latest.body) ||
		stripHtml(latest.body_html) ||
		"No readable body text is available yet.";
	const needsReply = Boolean(email.needs_reply || !latest.read);
	const timeline = [...messages].reverse();
	const requestCandidate = email.subject || latestText.slice(0, 90) || "Follow up on this email thread";
	const confidence = messages.length > 1 || latestText.length > 240 ? "High" : "Medium";

	return (
		<section className="mx-4 mb-4 mt-5 overflow-hidden rounded-2xl border border-kumo-line bg-kumo-elevated shadow-sm">
			<div className="border-b border-kumo-line bg-kumo-recessed px-4 py-3">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div>
						<p className="text-xs font-semibold uppercase tracking-wide text-kumo-subtle">
							AI Agent results
						</p>
						<h3 className="text-base font-semibold text-kumo-default">
							Thread workspace
						</h3>
					</div>
					<Button size="sm" variant="primary" onClick={onDraftReply}>
						Create reply draft
					</Button>
				</div>
			</div>

			<div className="grid gap-4 p-4 xl:grid-cols-[1fr_1fr]">
				<div className="space-y-4">
					<div className="rounded-xl border border-kumo-line bg-kumo-base p-4">
						<h4 className="text-sm font-semibold text-kumo-default">메일/스레드 요약</h4>
						<p className="mt-2 text-sm leading-6 text-kumo-default">
							{messages.length > 1
								? `${messages.length}개 메일로 구성된 스레드입니다. `
								: "단일 메일입니다. "}
							주제는 “{email.subject || "(No subject)"}”이며 최근 메시지는 {senderLabel(latest)}에서 왔습니다.
						</p>
						<p className="mt-2 line-clamp-3 text-sm leading-6 text-kumo-subtle">
							{latestText}
						</p>
					</div>

					<div className="rounded-xl border border-kumo-line bg-kumo-base p-4">
						<h4 className="text-sm font-semibold text-kumo-default">현재 상황</h4>
						<div className="mt-3 grid grid-cols-2 gap-2 text-sm">
							<div className="rounded-lg bg-kumo-recessed p-3">
								<p className="text-xs text-kumo-subtle">Status</p>
								<p className="font-medium text-kumo-default">
									{needsReply ? "Needs review/reply" : "No immediate action"}
								</p>
							</div>
							<div className="rounded-lg bg-kumo-recessed p-3">
								<p className="text-xs text-kumo-subtle">Drafts</p>
								<p className="font-medium text-kumo-default">{draftCount}</p>
							</div>
							<div className="rounded-lg bg-kumo-recessed p-3">
								<p className="text-xs text-kumo-subtle">Participants</p>
								<p className="font-medium text-kumo-default">{participants.length}</p>
							</div>
							<div className="rounded-lg bg-kumo-recessed p-3">
								<p className="text-xs text-kumo-subtle">Mailbox</p>
								<p className="truncate font-medium text-kumo-default">
									{mailboxEmail || "Unknown"}
								</p>
							</div>
						</div>
					</div>

					<div className="rounded-xl border border-kumo-line bg-kumo-base p-4">
						<div className="flex items-start justify-between gap-3">
							<div>
								<h4 className="text-sm font-semibold text-kumo-default">요청사항 / Task 후보</h4>
								<p className="mt-2 text-sm leading-6 text-kumo-default">
									{requestCandidate}
								</p>
								<p className="mt-2 text-xs text-kumo-subtle">
									근거: 최근 메시지 {formatAgentDate(resolveDate(latest as Email & { email_date?: string; received_at?: string }))} · 발신자 {senderLabel(latest)}
								</p>
							</div>
								<span
									className="shrink-0 rounded-full px-3 py-1 text-xs font-semibold"
									style={{ background: ADMIN_TOKENS.accentSoft, color: ADMIN_TOKENS.accentText }}
								>
									{confidence} confidence
								</span>
						</div>
						<Button
							className="mt-4"
							size="sm"
							variant="secondary"
							onClick={onCreateTask}
							loading={isCreatingTask}
						>
							Task로 전환
						</Button>
					</div>

					<div className="rounded-xl border border-kumo-line bg-kumo-base p-4">
						<h4 className="text-sm font-semibold text-kumo-default">답변메일 초안 방향</h4>
						<p className="mt-2 text-sm leading-6 text-kumo-subtle">
							최근 수신자인 {lastReceivedMessage ? senderLabel(lastReceivedMessage) : "상대방"}에게
							요청 확인, 담당자/일정 명시, 다음 액션을 포함한 답변 초안을 작성하는 흐름이 적합합니다.
						</p>
					</div>
				</div>

				<div className="space-y-4">
					<div className="rounded-xl border border-kumo-line bg-kumo-base p-4">
						<h4 className="text-sm font-semibold text-kumo-default">타임라인</h4>
						<div className="mt-3 space-y-0">
							{timeline.map((msg, idx) => {
								type EM = Email & { email_date?: string; received_at?: string };
								const isDraft = msg.folder_id === Folders.DRAFT;
								const isSent = msg.sender === mailboxEmail;
								const dirLabel = isDraft ? "Draft" : isSent ? "발신" : "수신";
								const dotColor = isDraft ? "border-kumo-destructive" : isSent ? "border-kumo-subtle" : "border-kumo-brand";
								const bodyText = stripHtml(msg.body_text) || stripHtml(msg.snippet) || stripHtml(msg.body_html) || "";
								const description = msg.subject || (bodyText.length > 60 ? bodyText.slice(0, 60) + "…" : bodyText) || "(No subject)";
								return (
									<div key={msg.id} className="relative flex gap-3 pb-4 last:pb-0">
										{idx < timeline.length - 1 && (
											<div className="absolute left-[7px] top-2 bottom-0 w-px bg-kumo-line" />
										)}
										<div className={`mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 ${dotColor} bg-kumo-base z-10`} />
										<div className="min-w-0 flex-1">
											<div className="flex items-center gap-2">
												<span className="text-xs font-semibold text-kumo-default tabular-nums">
													{formatAgentDate(resolveDate(msg as EM))}
												</span>
												<span className="text-[10px] text-kumo-subtle">{dirLabel}</span>
											</div>
											<p className="mt-0.5 text-xs text-kumo-default truncate leading-relaxed">
												{description}
											</p>
										</div>
									</div>
								);
							})}
						</div>
					</div>

					<div className="h-[460px] overflow-hidden rounded-xl border border-kumo-line bg-kumo-base">
						<AgentSurface />
					</div>
				</div>
			</div>
		</section>
	);
}

function EmailAgentActionBar({
	subject,
	messageCount,
	draftCount,
	agentPlacement,
	isCreatingTask,
	isAiDrafting,
	onShowResults,
	onCreateTask,
	onDraftReply,
	onSetAgentPlacement,
}: {
	subject: string;
	messageCount: number;
	draftCount: number;
	agentPlacement: "side" | "below";
	isCreatingTask: boolean;
	isAiDrafting: boolean;
	onShowResults: () => void;
	onCreateTask: () => void;
	onDraftReply: () => void;
	onSetAgentPlacement: (placement: "side" | "below") => void;
}) {
	return (
			<div className="border-b border-kumo-line px-3 py-3 md:px-4" style={{ background: ADMIN_TOKENS.warningSurface }}>
			<div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
				<div className="min-w-0">
					<p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: ADMIN_TOKENS.mutedText }}>
						Agent menu
					</p>
					<p className="mt-1 truncate text-sm text-kumo-default">
						{messageCount} message{messageCount === 1 ? "" : "s"} · {draftCount} draft{draftCount === 1 ? "" : "s"} · {subject || "(No subject)"}
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<Button size="sm" variant="secondary" onClick={onShowResults}>
						요약/타임라인 보기
					</Button>
					<Button size="sm" variant="secondary" onClick={onCreateTask} loading={isCreatingTask}>
						Task 생성
					</Button>
					<Button size="sm" variant="primary" onClick={onDraftReply} loading={isAiDrafting}>
						답장 초안
					</Button>
					<div className="flex items-center gap-1 rounded-lg bg-kumo-base p-1">
						<Button
							size="sm"
							variant={agentPlacement === "below" ? "secondary" : "ghost"}
							onClick={() => onSetAgentPlacement("below")}
						>
							메일 하단
						</Button>
						<Button
							size="sm"
							variant={agentPlacement === "side" ? "secondary" : "ghost"}
							onClick={() => onSetAgentPlacement("side")}
						>
							오른쪽
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}

export default function EmailPanel({ emailId }: { emailId: string }) {
	const { folder } = useParams<{ folder: string }>();
	const { mailboxId } = useMailboxParams();
	const { data: email } = useEmail(mailboxId, emailId) as { data?: Email };
	const { data: threadRepliesRaw } = useThreadReplies(mailboxId, email?.thread_id) as {
		data?: Email[];
	};
	const updateEmail = useUpdateEmail();
	const deleteEmailMut = useDeleteEmail();
	const moveEmailMut = useMoveEmail();
	const sendEmailMut = useSendEmail();
	const replyMut = useReplyToEmail();
	const { data: folders = [] } = useFolders(mailboxId) as { data?: Folder[] };
	const { data: currentMailbox } = useMailbox(mailboxId) as {
		data?: Mailbox;
	};
	const { data: segments } = useCustomerSegments(mailboxId);

	const segmentMap = useMemo(() => {
		if (!segments) return new Map<string, import("~/queries/segments").Segment>();
		return new Map(segments.map((s) => [s.email, s.segment]));
	}, [segments]);
	const {
		closePanel,
		startCompose,
		agentResultPlacement,
		setAgentResultPlacement,
	} = useUIStore();
	const toastManager = useKumoToastManager();
	const queryClient = useQueryClient();
	const [isSending, setIsSending] = useState(false);
	const [isCreatingTask, setIsCreatingTask] = useState(false);
	const [isAiDrafting, setIsAiDrafting] = useState(false);
	const [sourceViewEmail, setSourceViewEmail] = useState<Email | null>(null);
	const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
	const [previewImage, setPreviewImage] = useState<{ url: string; filename: string } | null>(null);
	const agentResultsRef = useRef<HTMLDivElement>(null);
	const isDraftFolder = folder === Folders.DRAFT;

	const threadReplies = useMemo(() => {
		if (!threadRepliesRaw || !email) return [];
		return threadRepliesRaw.filter((e) => e.id !== email.id);
	}, [threadRepliesRaw, email]);

	const allMessages = useMemo(() => {
		if (!email) return [];
		type EM = Email & { email_date?: string; received_at?: string };
		return [email, ...threadReplies].sort((a, b) => {
			const ad = resolveDate(a as EM) ?? "";
			const bd = resolveDate(b as EM) ?? "";
			return new Date(bd).getTime() - new Date(ad).getTime();
		});
	}, [email, threadReplies]);

	// Reset expanded state only when the selected email changes, not on every refetch.
	// Using allMessages as a dependency would reset user expand/collapse state on background refetches.
	const currentEmailId = email?.id;
useEffect(() => {
if (email && findDemo(email)) setExpandedMessages(new Set([email.id]));
else if (allMessages.length > 1) setExpandedMessages(new Set([allMessages[0].id]));
}, [currentEmailId]); // eslint-disable-line react-hooks/exhaustive-deps

	const toggleExpand = (msgId: string) => { setExpandedMessages((prev) => { const next = new Set(prev); if (next.has(msgId)) next.delete(msgId); else next.add(msgId); return next; }); };

	const draftMessageIds = useMemo(() => {
		const ids = new Set<string>();
		for (const msg of allMessages) { if (msg.folder_id === Folders.DRAFT) ids.add(msg.id); else if (isDraftFolder && msg.id === emailId) ids.add(msg.id); }
		return ids;
	}, [allMessages, isDraftFolder, emailId]);

	const lastReceivedMessage = useMemo(() => {
		const ce = currentMailbox?.email;
		const received = allMessages.filter((msg) => !draftMessageIds.has(msg.id) && msg.sender !== ce);
		if (received.length > 0) return received[0];
		const nonDrafts = allMessages.filter((msg) => !draftMessageIds.has(msg.id));
		return nonDrafts.length > 0 ? nonDrafts[0] : email;
	}, [allMessages, draftMessageIds, currentMailbox?.email, email]);

	const moveToFolders = useMemo(() => { const cur = folder || email?.folder_id; return folders.filter((f) => f.id !== cur); }, [folders, folder, email?.folder_id]);

	if (!email) return <EmailPanelSkeleton />;

	const toggleStar = () => { if (mailboxId) updateEmail.mutate({ mailboxId, id: email.id, data: { starred: !email.starred } }); };
	const handleMove = (folderId: string) => { if (mailboxId) { moveEmailMut.mutate({ mailboxId, id: email.id, folderId }); closePanel(); } };
	const handleDelete = () => { if (mailboxId) { if (!window.confirm("Are you sure you want to delete this email?")) return; deleteEmailMut.mutate({ mailboxId, id: email.id }); closePanel(); } };

	const handleEditDraft = (draftMsg?: Email) => {
		const target = draftMsg || email;
		if (target.in_reply_to) { startCompose({ mode: "reply", originalEmail: allMessages.find((msg) => msg.id === target.in_reply_to), draftEmail: target }); }
		else { startCompose({ mode: "new", originalEmail: undefined, draftEmail: target }); }
	};

	const handleDeleteDraft = async (draftMsg?: Email) => {
		const target = draftMsg || email;
		if (!mailboxId) return;
		if (!window.confirm("Discard this draft?")) return;
		deleteEmailMut.mutate({ mailboxId, id: target.id });
		toastManager.add({ title: "Draft discarded" });
		if (target.id === emailId) closePanel();
	};

	const handleSendDraft = async (draftMsg?: Email) => {
		let target = draftMsg || email;
		if (!mailboxId || !currentMailbox) return;
		setIsSending(true);
		try {
			if (!target.recipient || !target.subject) { try { const fresh = await api.getEmail(mailboxId, target.id) as Email; if (fresh) target = fresh; } catch {} }
			if (!target.recipient) { toastManager.add({ title: "Cannot send: no recipient set on this draft.", variant: "error" }); return; }
			const toRecipients = splitEmailList(target.recipient);
			if (toRecipients.length === 0) { toastManager.add({ title: "Cannot send: no valid recipient set on this draft.", variant: "error" }); return; }
			const fromName = currentMailbox.settings?.fromName || currentMailbox.name;
			const from = fromName && fromName !== currentMailbox.email ? { email: currentMailbox.email, name: fromName } : currentMailbox.email;
			const originalEmail = target.in_reply_to ? allMessages.find((msg) => msg.id === target.in_reply_to) : undefined;
			const emailData = {
				to: toEmailListValue(toRecipients),
				cc: toEmailListValue(splitEmailList(target.cc)),
				bcc: toEmailListValue(splitEmailList(target.bcc)),
				from,
				subject: target.subject || "(no subject)",
				html: target.body || "",
				text: target.body ? target.body.replace(/<[^>]*>/g, "").trim() : "",
			};
			if (originalEmail) await replyMut.mutateAsync({ mailboxId, emailId: originalEmail.id, email: emailData }); else await sendEmailMut.mutateAsync({ mailboxId, email: emailData });
			await deleteEmailMut.mutateAsync({ mailboxId, id: target.id });
			toastManager.add({ title: "Email sent!" });
			if (isDraftFolder) closePanel();
		} catch (err) {
			const message = (err instanceof Error ? err.message : null) || "Failed to send email.";
			toastManager.add({ title: message, variant: "error" });
		} finally { setIsSending(false); }
	};

	const revealAgentResults = () => {
		setAgentResultPlacement("below");
		window.requestAnimationFrame(() => {
			agentResultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
		});
	};

	const handleCreateTaskFromEmail = async () => {
		if (!mailboxId || !email) return;
		setIsCreatingTask(true);
		try {
			const task = await api.createRequestFromEmail({ mailboxId, emailId: email.id });
			queryClient.invalidateQueries({ queryKey: ["admin", "overview"] });
			queryClient.invalidateQueries({ queryKey: ["admin", "action-queue"] });
			toastManager.add({ title: `Task created: ${task.title}` });
		} catch (err) {
			toastManager.add({
				title: err instanceof Error ? err.message : "Failed to create task from email.",
				variant: "error",
			});
		} finally {
			setIsCreatingTask(false);
		}
	};

	const handleAiDraftReply = async () => {
		if (!mailboxId || !email) return;
		setIsAiDrafting(true);
		try {
			const result = await api.aiDraft({
				mailboxId,
				emailId: email.id,
				sender: email.sender,
				subject: email.subject,
				threadId: email.thread_id ?? undefined,
			});
			const draftEmailObj = {
				id: result.draft_id,
				subject: result.subject,
				sender: currentMailbox?.email || "",
				recipient: lastReceivedMessage?.sender || email.sender,
				date: new Date().toISOString(),
				read: true,
				starred: false,
				body_text: result.body_text,
				body: result.body_text,
				in_reply_to: email.id,
			};
			queryClient.invalidateQueries({ queryKey: ["emails", mailboxId] });
			startCompose({ mode: "reply", originalEmail: lastReceivedMessage, draftEmail: draftEmailObj });
			toastManager.add({ title: "AI draft created" });
		} catch (err) {
			const msg = err instanceof Error ? err.message : "Failed to generate AI draft.";
			toastManager.add({ title: msg, variant: "error" });
		} finally {
			setIsAiDrafting(false);
		}
	};

	const hasThread = allMessages.length > 1;
	const draftCount = draftMessageIds.size;
	const isDemo = Boolean(findDemo(email));

	return (
		<div className="flex min-h-0 min-w-0 flex-col h-full [&>div:first-child]:flex-wrap md:[&>div:first-child]:flex-nowrap">
			<EmailPanelToolbar
				email={email}
				mailboxId={mailboxId}
				isDraftFolder={isDraftFolder}
				isSending={isSending}
				moveToFolders={moveToFolders}
				agentPlacement={agentResultPlacement}
				onBack={closePanel}
				onSendDraft={() => handleSendDraft()}
				onEditDraft={() => handleEditDraft()}
				onReply={() =>
					startCompose({ mode: "reply", originalEmail: lastReceivedMessage })
				}
				onReplyAll={() =>
					startCompose({
						mode: "reply-all",
						originalEmail: lastReceivedMessage,
					})
				}
				onForward={() => startCompose({ mode: "forward", originalEmail: email })}
				onToggleStar={toggleStar}
				onToggleRead={() => {
					if (mailboxId) {
						updateEmail.mutate({
							mailboxId,
							id: email.id,
							data: { read: !email.read },
						});
					}
				}}
				onMove={handleMove}
				onViewSource={() => setSourceViewEmail(email)}
				onDelete={handleDelete}
				onSetAgentPlacement={setAgentResultPlacement}
			/>

			{!isDemo && <EmailAgentActionBar
				subject={email.subject}
				messageCount={allMessages.length}
				draftCount={draftCount}
				agentPlacement={agentResultPlacement}
				isCreatingTask={isCreatingTask}
				isAiDrafting={isAiDrafting}
				onShowResults={revealAgentResults}
				onCreateTask={handleCreateTaskFromEmail}
				onDraftReply={handleAiDraftReply}
				onSetAgentPlacement={setAgentResultPlacement}
			/>}

			<EmailPanelHeader
				subject={email.subject}
				messageCount={allMessages.length}
				showThreadCount={hasThread}
			/>

			<div className="min-h-0 flex-1 overflow-y-auto">
				{isDemo && mailboxId && <CampaignActions key={email.id} mailboxId={mailboxId} emailId={email.id} threadId={email.thread_id} />}
				{hasThread ? (
					allMessages.map((msg, idx) => {
						const isDraft = draftMessageIds.has(msg.id);
						return (
							<ThreadMessage
								key={msg.id}
								email={msg}
								mailboxId={mailboxId}
								mailboxEmail={currentMailbox?.email}
								segment={msg.sender !== currentMailbox?.email ? segmentMap.get(msg.sender) : undefined}
								isLast={idx === allMessages.length - 1}
								isDraft={isDraft}
								isSending={isDraft ? isSending : false}
								isExpanded={expandedMessages.has(msg.id)}
								onToggleExpand={() => toggleExpand(msg.id)}
								onSendDraft={isDraft ? () => handleSendDraft(msg) : undefined}
								onEditDraft={isDraft ? () => handleEditDraft(msg) : undefined}
								onDeleteDraft={isDraft ? () => handleDeleteDraft(msg) : undefined}
								onViewSource={() => setSourceViewEmail(msg)}
								onPreviewImage={(url, filename) =>
									setPreviewImage({ url, filename })
								}
							/>
						);
					})
				) : (
					<SingleMessageView
						email={email}
						mailboxId={mailboxId}
						segment={email.sender !== currentMailbox?.email ? segmentMap.get(email.sender) : undefined}
						onPreviewImage={(url, filename) =>
							setPreviewImage({ url, filename })
						}
					/>
				)}
				{!isDemo && agentResultPlacement === "below" && (
					<div ref={agentResultsRef}>
						<EmailAgentResults
							email={email}
							messages={allMessages}
							mailboxEmail={currentMailbox?.email}
							draftCount={draftCount}
							lastReceivedMessage={lastReceivedMessage}
							onDraftReply={handleAiDraftReply}
							onCreateTask={handleCreateTaskFromEmail}
							isCreatingTask={isCreatingTask}
						/>
					</div>
				)}
			</div>

			<EmailPanelDialogs
				sourceViewEmail={sourceViewEmail}
				previewImage={previewImage}
				onCloseSource={() => setSourceViewEmail(null)}
				onClosePreview={() => setPreviewImage(null)}
			/>
		</div>
	);
}
