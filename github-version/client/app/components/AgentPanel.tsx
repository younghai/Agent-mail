// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { Badge, Button, Empty, Loader, Tooltip } from "@cloudflare/kumo";
import {
	ArrowUpIcon,
	ChatCircleIcon,
	CheckCircleIcon,
	FileIcon,
	MagnifyingGlassIcon,
	RobotIcon,
	ThumbsDownIcon,
	ThumbsUpIcon,
	TrashIcon,
	UserIcon,
	StopIcon,
} from "@phosphor-icons/react";
import api from "~/services/api";
import VerificationPanel from "~/components/agent-panel/VerificationPanel";
import DraftsPanel from "~/components/agent-panel/DraftsPanel";
import { useCallback, useEffect, useRef, useState } from "react";
import { useMailboxParams } from "~/hooks/useMailboxParams";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useUIStore, type AgentPanelTab } from "~/hooks/useUIStore";
import {
	computeStreamingStats,
	estimateTokens,
	formatStreamingStats,
} from "~/lib/token-estimate";

const TAB_DEFS: ReadonlyArray<{
	id: AgentPanelTab;
	label: string;
	icon: React.ReactNode;
}> = [
	{ id: "conversation", label: "Chat", icon: <ChatCircleIcon size={14} weight="regular" /> },
	{ id: "analysis", label: "Analysis", icon: <MagnifyingGlassIcon size={14} weight="regular" /> },
	{ id: "drafts", label: "Drafts", icon: <FileIcon size={14} weight="regular" /> },
	{ id: "verification", label: "Verify", icon: <CheckCircleIcon size={14} weight="regular" /> },
];

interface ChatMessage {
	id: string;
	role: "user" | "assistant";
	content: string;
	finalTokens?: number;
}

function MessageBubble({ message }: { message: ChatMessage }) {
	const isUser = message.role === "user";
	return (
		<div
			className={`flex gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}
			aria-label={isUser ? "You said" : "Agent replied"}
		>
			<div
				className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
					isUser ? "bg-kumo-brand text-kumo-inverse" : "bg-kumo-fill text-kumo-default"
				}`}
				aria-hidden="true"
			>
				{isUser ? <UserIcon size={12} weight="bold" /> : <RobotIcon size={12} weight="bold" />}
			</div>
			<div
				className={`rounded-lg px-3 py-2 text-[13px] leading-relaxed break-words max-w-[85%] ${
					isUser
						? "bg-kumo-brand text-kumo-inverse rounded-br-sm"
						: "bg-kumo-elevated text-kumo-default border border-kumo-line rounded-bl-sm overflow-hidden"
				}`}
			>
				{isUser ? (
					message.content
				) : (
					<Markdown
						remarkPlugins={[remarkGfm]}
						components={{
							a: ({ href, children }) => (
								<a href={href} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-link)", textDecoration: "underline" }}>
									{children}
								</a>
							),
							p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
							strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
							ul: ({ children }) => <ul className="list-disc pl-4 mb-2 last:mb-0 space-y-0.5">{children}</ul>,
							ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 last:mb-0 space-y-0.5">{children}</ol>,
							li: ({ children }) => <li>{children}</li>,
							h1: ({ children }) => <h3 className="font-semibold text-sm mb-1">{children}</h3>,
							h2: ({ children }) => <h4 className="font-semibold text-[13px] mb-1">{children}</h4>,
							h3: ({ children }) => <h5 className="font-semibold text-[13px] mb-0.5">{children}</h5>,
							code: ({ children }) => (
								<code className="bg-kumo-fill px-1 py-0.5 rounded text-[12px]">{children}</code>
							),
						}}
					>
						{message.content || " "}
					</Markdown>
				)}
			</div>
		</div>
	);
}

export default function AgentPanel() {
	const { mailboxId } = useMailboxParams();
	const { agentPanelTab, setAgentPanelTab } = useUIStore();
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [inputValue, setInputValue] = useState("");
	const [isStreaming, setIsStreaming] = useState(false);
	const [streamStartedAt, setStreamStartedAt] = useState<number | null>(null);
	const [streamingTick, setStreamingTick] = useState(0);
	const [feedbackByMsg, setFeedbackByMsg] = useState<Record<string, 1 | -1>>({});
	const sessionIdRef = useRef<string | null>(null);
	const abortRef = useRef<AbortController | null>(null);
	const scrollRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLTextAreaElement>(null);

	useEffect(() => {
		const el = scrollRef.current;
		if (el) el.scrollTop = el.scrollHeight;
	}, [messages]);

	useEffect(() => {
		inputRef.current?.focus();
	}, []);

	// Tick every 250ms while streaming so the elapsed-time / tokens-per-second
	// readout updates smoothly. No-op when idle.
	useEffect(() => {
		if (!isStreaming) return;
		const id = setInterval(() => setStreamingTick((t) => t + 1), 250);
		return () => clearInterval(id);
	}, [isStreaming]);

	// When streaming completes, snapshot the final token estimate on the last
	// assistant message so the footer keeps showing a stable count.
	useEffect(() => {
		if (isStreaming) return;
		setMessages((prev) => {
			const last = prev[prev.length - 1];
			if (!last || last.role !== "assistant" || last.finalTokens !== undefined)
				return prev;
			if (!last.content) return prev;
			return prev.map((m) =>
				m.id === last.id ? { ...m, finalTokens: estimateTokens(last.content) } : m,
			);
		});
	}, [isStreaming]);

	const sendMessage = useCallback(
		async (text: string) => {
			if (!mailboxId || !text.trim() || isStreaming) return;

			const userMsgId = crypto.randomUUID();
			const assistantMsgId = crypto.randomUUID();
			setMessages((prev) => [
				...prev,
				{ id: userMsgId, role: "user", content: text },
				{ id: assistantMsgId, role: "assistant", content: "" },
			]);
			setIsStreaming(true);
			setStreamStartedAt(Date.now());

			const controller = new AbortController();
			abortRef.current = controller;

			const localToken =
				(typeof window !== "undefined" && window.localStorage.getItem("agentic.localServiceToken")) ||
				import.meta.env.VITE_LOCAL_SERVICE_TOKEN ||
				"";

			try {
				const res = await fetch(`/api/v1/mailboxes/${mailboxId}/ai/chat`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						...(localToken ? { Authorization: `Bearer ${localToken}` } : {}),
					},
					body: JSON.stringify({
						message: text,
						...(sessionIdRef.current ? { session_id: sessionIdRef.current } : {}),
					}),
					signal: controller.signal,
				});

				if (!res.ok) {
					const errData = await res.json().catch(() => ({}));
					const errMsg =
						(errData as { error?: { message?: string } })?.error?.message ||
						`Request failed: ${res.status}`;
					setMessages((prev) =>
						prev.map((m) =>
							m.id === assistantMsgId ? { ...m, content: `⚠ ${errMsg}` } : m,
						),
					);
					return;
				}

				const reader = res.body!.getReader();
				const decoder = new TextDecoder();
				let buffer = "";

				while (true) {
					const { done, value } = await reader.read();
					if (done) break;
					buffer += decoder.decode(value, { stream: true });

					const lines = buffer.split("\n");
					buffer = lines.pop() ?? "";

					for (const line of lines) {
						if (!line.startsWith("data: ")) continue;
						try {
							const parsed = JSON.parse(line.slice(6)) as {
								type?: string;
								content?: string;
								session_id?: string;
							};
							if (parsed.type === "text" && parsed.content) {
								setMessages((prev) =>
									prev.map((m) =>
										m.id === assistantMsgId
											? { ...m, content: m.content + parsed.content }
											: m,
									),
								);
							}
							if (parsed.session_id) {
								sessionIdRef.current = parsed.session_id;
							}
						} catch {
							// ignore malformed SSE lines
						}
					}
				}
			} catch (err: unknown) {
				if ((err as Error)?.name === "AbortError") return;
				setMessages((prev) =>
					prev.map((m) =>
						m.id === assistantMsgId
							? { ...m, content: "⚠ Connection error. Please try again." }
							: m,
					),
				);
			} finally {
				setIsStreaming(false);
				setStreamStartedAt(null);
				abortRef.current = null;
			}
		},
		[mailboxId, isStreaming],
	);

	const handleSend = () => {
		const text = inputValue.trim();
		if (!text) return;
		setInputValue("");
		sendMessage(text);
		if (inputRef.current) inputRef.current.style.height = "auto";
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	};

	const handleStop = () => {
		abortRef.current?.abort();
		setIsStreaming(false);
	};

	const submitFeedback = useCallback(
		async (assistantMsgId: string, score: 1 | -1) => {
			if (!mailboxId) return;
			const previous = feedbackByMsg[assistantMsgId];
			// Optimistic: toggle off if same score, else set to new score
			if (previous === score) {
				setFeedbackByMsg((prev) => {
					const { [assistantMsgId]: _omit, ...rest } = prev;
					return rest;
				});
				try {
					await api.deleteAgentFeedback(mailboxId, assistantMsgId, score);
				} catch {
					// Roll back on failure
					setFeedbackByMsg((prev) => ({ ...prev, [assistantMsgId]: score }));
				}
				return;
			}
			setFeedbackByMsg((prev) => ({ ...prev, [assistantMsgId]: score }));
			try {
				await api.recordAgentFeedback(mailboxId, {
					call_id: assistantMsgId,
					session_id: sessionIdRef.current,
					score,
					comment: null,
				});
			} catch {
				setFeedbackByMsg((prev) => {
					const next = { ...prev };
					if (previous) next[assistantMsgId] = previous;
					else delete next[assistantMsgId];
					return next;
				});
			}
		},
		[mailboxId, feedbackByMsg],
	);

	const suggestedPrompts = [
		"Show me the latest inbox emails",
		"Any unread emails?",
		"Draft a response to the latest email",
	];

	const lastMsg = messages[messages.length - 1];
	const showThinkingDot = isStreaming && lastMsg?.role === "user";

	// Tick is referenced so this re-runs while streaming; it is otherwise unused.
	void streamingTick;
	const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
	const isStreamingLast =
		isStreaming && streamStartedAt !== null && lastAssistant?.id === lastMsg?.id;
	const liveStatsLine =
		isStreamingLast && lastAssistant?.content
			? formatStreamingStats(
					computeStreamingStats(lastAssistant.content, streamStartedAt!),
				)
			: null;

	return (
		<div className="flex flex-col h-full">
			{/* Header */}
			<div className="flex items-center justify-between px-3 py-1.5 border-b border-kumo-line shrink-0">
				<div className="flex items-center gap-2">
					<Badge variant="beta">AI</Badge>
					<span className="text-xs text-kumo-subtle">Email Agent</span>
				</div>
				<div className="flex items-center gap-1">
					{isStreaming && <Loader size="sm" />}
					{messages.length > 0 && (
						<Tooltip content="Clear chat" asChild>
							<Button
								variant="ghost"
								shape="square"
								size="sm"
								icon={<TrashIcon size={14} />}
								onClick={() => {
									if (window.confirm("Clear chat history?")) {
										setMessages([]);
										sessionIdRef.current = null;
									}
								}}
								aria-label="Clear chat"
							/>
						</Tooltip>
					)}
				</div>
			</div>

			{/* Tabs */}
			<div
				role="tablist"
				aria-label="Agent panel sections"
				className="flex items-center gap-0 px-2 border-b border-kumo-line shrink-0"
			>
				{TAB_DEFS.map((tab) => {
					const active = agentPanelTab === tab.id;
					return (
						<button
							key={tab.id}
							type="button"
							role="tab"
							aria-selected={active}
							aria-controls={`agent-panel-${tab.id}`}
							onClick={() => setAgentPanelTab(tab.id)}
							className={`flex items-center gap-1.5 px-2 py-2 text-[11px] font-medium border-b-2 -mb-px bg-transparent cursor-pointer focus:outline-none focus:ring-2 focus:ring-inset focus:ring-kumo-ring ${
								active
									? "border-kumo-brand text-kumo-default"
									: "border-transparent text-kumo-subtle hover:text-kumo-default"
							}`}
						>
							<span aria-hidden="true">{tab.icon}</span>
							<span>{tab.label}</span>
						</button>
					);
				})}
			</div>

			{agentPanelTab === "verification" && (
				<div
					role="tabpanel"
					id="agent-panel-verification"
					className="flex-1 overflow-y-auto"
				>
					<VerificationPanel mailboxId={mailboxId} />
				</div>
			)}

			{agentPanelTab === "drafts" && (
				<div
					role="tabpanel"
					id="agent-panel-drafts"
					className="flex-1 overflow-y-auto"
				>
					<DraftsPanel mailboxId={mailboxId} />
				</div>
			)}

			{agentPanelTab === "analysis" && (
				<div
					role="tabpanel"
					id="agent-panel-analysis"
					className="flex-1 flex items-center justify-center px-4 py-6 overflow-y-auto"
				>
					<Empty
						icon={<MagnifyingGlassIcon size={32} className="text-kumo-inactive" />}
						title="Email analysis"
						description="Open an email to see summary, sentiment, and key entities."
					/>
				</div>
			)}

			{/* Messages */}
			<div
				ref={scrollRef}
				role="tabpanel"
				id="agent-panel-conversation"
				aria-live="polite"
				aria-relevant="additions text"
				aria-atomic="false"
				aria-label="Email agent conversation"
				hidden={agentPanelTab !== "conversation"}
				className="flex-1 overflow-y-auto px-3 py-4"
			>
				{messages.length === 0 ? (
					<div className="flex flex-col items-center justify-center h-full gap-4">
						<div
							className="flex h-12 w-12 items-center justify-center rounded-xl bg-kumo-brand/10"
							aria-hidden="true"
						>
							<RobotIcon size={24} weight="duotone" className="text-kumo-brand" />
						</div>
						<p className="text-xs text-kumo-subtle text-center leading-relaxed px-4">
							I can read emails, search conversations, and draft replies.
						</p>
						<div
							className="flex flex-col gap-1.5 w-full"
							role="group"
							aria-label="Suggested prompts"
						>
							{suggestedPrompts.map((prompt) => (
								<button
									key={prompt}
									type="button"
									onClick={() => sendMessage(prompt)}
									className="text-left px-3 py-2 rounded-lg border border-kumo-line text-xs text-kumo-strong hover:bg-kumo-tint hover:border-kumo-fill-hover transition-colors cursor-pointer bg-transparent focus:outline-none focus:ring-2 focus:ring-kumo-ring"
								>
									{prompt}
								</button>
							))}
						</div>
					</div>
				) : (
					<div className="flex flex-col gap-3">
						{messages.map((msg) => {
							const isLiveStreamingThisMsg =
								isStreamingLast && msg.id === lastAssistant?.id;
							const statsLine = isLiveStreamingThisMsg
								? liveStatsLine
								: msg.role === "assistant" && msg.finalTokens
								? `≈${msg.finalTokens} tokens`
								: null;
							const showFeedback =
								msg.role === "assistant" &&
								!isLiveStreamingThisMsg &&
								msg.content.length > 0;
							const myFeedback = feedbackByMsg[msg.id];
							return (
								<div key={msg.id} className="flex flex-col gap-1">
									<MessageBubble message={msg} />
									<div className="flex items-center gap-2 pl-8">
										{statsLine && (
											<span
												className="text-[10px] text-kumo-subtle font-mono tabular-nums"
												aria-live={isLiveStreamingThisMsg ? "polite" : "off"}
											>
												{statsLine}
											</span>
										)}
										{showFeedback && (
											<div className="flex items-center gap-0.5 ml-auto">
												<Tooltip content="Helpful" asChild>
													<button
														type="button"
														onClick={() => submitFeedback(msg.id, 1)}
														aria-label="Mark response as helpful"
														aria-pressed={myFeedback === 1}
														className={`h-5 w-5 flex items-center justify-center rounded transition-colors cursor-pointer bg-transparent border-0 focus:outline-none focus:ring-2 focus:ring-kumo-ring ${
															myFeedback === 1
																? "text-kumo-success"
																: "text-kumo-subtle hover:text-kumo-default hover:bg-kumo-tint"
														}`}
													>
														<ThumbsUpIcon
															size={12}
															weight={myFeedback === 1 ? "fill" : "regular"}
														/>
													</button>
												</Tooltip>
												<Tooltip content="Not helpful" asChild>
													<button
														type="button"
														onClick={() => submitFeedback(msg.id, -1)}
														aria-label="Mark response as not helpful"
														aria-pressed={myFeedback === -1}
														className={`h-5 w-5 flex items-center justify-center rounded transition-colors cursor-pointer bg-transparent border-0 focus:outline-none focus:ring-2 focus:ring-kumo-ring ${
															myFeedback === -1
																? "text-kumo-destructive"
																: "text-kumo-subtle hover:text-kumo-default hover:bg-kumo-tint"
														}`}
													>
														<ThumbsDownIcon
															size={12}
															weight={myFeedback === -1 ? "fill" : "regular"}
														/>
													</button>
												</Tooltip>
											</div>
										)}
									</div>
								</div>
							);
						})}
						{showThinkingDot && (
							<div className="flex gap-2" aria-label="Agent is thinking">
								<div
									className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-kumo-fill text-kumo-default"
									aria-hidden="true"
								>
									<RobotIcon size={12} weight="bold" />
								</div>
								<div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-kumo-elevated border border-kumo-line rounded-bl-sm">
									<Loader size="sm" />
									<span className="text-xs text-kumo-subtle">Thinking...</span>
								</div>
							</div>
						)}
					</div>
				)}
			</div>

			{/* Input */}
			<div
				className="shrink-0 border-t border-kumo-line px-3 py-2"
				hidden={agentPanelTab !== "conversation"}
			>
				{isStreaming ? (
					<div className="flex justify-center">
						<Button
							variant="secondary"
							size="sm"
							icon={<StopIcon size={14} weight="fill" />}
							onClick={handleStop}
						>
							Stop generating
						</Button>
					</div>
				) : (
					<div className="flex items-end gap-1.5">
						<textarea
							ref={inputRef}
							id="agent-chat-input"
							name="agent-chat-input"
							value={inputValue}
							onChange={(e) => setInputValue(e.target.value)}
							onKeyDown={handleKeyDown}
							placeholder="Ask your email agent..."
							rows={1}
							aria-label="Chat message input"
							className="flex-1 resize-none rounded-lg border border-kumo-line bg-kumo-control px-3 py-2 text-xs text-kumo-default placeholder:text-kumo-subtle focus:outline-none focus:ring-1 focus:ring-kumo-ring min-h-[36px] max-h-[100px]"
							style={{ height: "auto", overflow: "hidden" }}
							onInput={(e) => {
								const t = e.target as HTMLTextAreaElement;
								t.style.height = "auto";
								t.style.height = `${Math.min(t.scrollHeight, 100)}px`;
								t.style.overflow = t.scrollHeight > 100 ? "auto" : "hidden";
							}}
						/>
						<Button
							variant="primary"
							shape="square"
							size="sm"
							disabled={!inputValue.trim()}
							icon={<ArrowUpIcon size={14} weight="bold" />}
							onClick={handleSend}
							aria-label="Send message"
						/>
					</div>
				)}
			</div>
		</div>
	);
}
