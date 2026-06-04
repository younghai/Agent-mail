// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { Badge, Button, Input, Loader, useKumoToastManager } from "@cloudflare/kumo";
import {
	RobotIcon,
	ArrowCounterClockwiseIcon,
	ArrowsClockwiseIcon,
	CheckCircleIcon,
	WarningCircleIcon,
	XCircleIcon,
	MinusCircleIcon,
} from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useMailboxParams } from "~/hooks/useMailboxParams";
import api from "~/services/api";
import { useMailbox, useUpdateMailbox } from "~/queries/mailboxes";

type AIProvider = "kimi" | "codex" | "openai" | "workers-ai";

const PROMPT_PLACEHOLDER = `You are an email assistant that helps manage this inbox. You read emails, draft replies, and help organize conversations.\n\nWrite like a real person. Short, direct, flowing prose. Plain text only.\n\n(Leave empty to use the full built-in default prompt)`;

type ServiceStatus = "ok" | "error" | "offline" | "unknown" | "missing_key" | "unavailable";

function StatusDot({ status }: { status: ServiceStatus }) {
	if (status === "ok") {
		return <CheckCircleIcon size={16} weight="fill" className="text-kumo-success shrink-0" />;
	}
	if (status === "missing_key") {
		return <WarningCircleIcon size={16} weight="fill" className="text-kumo-warning shrink-0" />;
	}
	if (status === "error" || status === "offline") {
		return <XCircleIcon size={16} weight="fill" className="text-kumo-destructive shrink-0" />;
	}
	return <MinusCircleIcon size={16} weight="fill" className="text-kumo-subtle shrink-0" />;
}

function statusLabel(status: ServiceStatus): string {
	switch (status) {
		case "ok": return "Connected";
		case "missing_key": return "API key missing";
		case "offline": return "Offline";
		case "error": return "Error";
		case "unavailable": return "Unavailable";
		default: return "Unknown";
	}
}

function statusVariant(status: ServiceStatus): "success" | "outline" | "destructive" | "secondary" {
	if (status === "ok") return "success";
	if (status === "missing_key" || status === "unavailable") return "outline";
	if (status === "error" || status === "offline") return "destructive";
	return "secondary";
}

function ConnectionStatusCard() {
	const {
		data,
		isFetching,
		refetch,
		dataUpdatedAt,
	} = useQuery({
		queryKey: ["system-status"],
		queryFn: () => api.getStatus(),
		staleTime: Infinity,
		retry: false,
	});

	const services = data
		? [
				{ key: "mailServer", ...data.mailServer },
				{ key: "database",   ...data.database },
				{ key: "aiAgent",    ...data.aiAgent },
				{ key: "openai",     ...data.openai },
				{ key: "redis",      ...data.redis },
		  ]
		: null;

	const lastChecked = dataUpdatedAt
		? new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(new Date(dataUpdatedAt))
		: null;

	return (
		<div className="rounded-lg border border-kumo-line bg-kumo-base p-5">
			<div className="flex items-center justify-between mb-4">
				<div className="flex items-center gap-2">
					<span className="text-sm font-medium text-kumo-default">Connection Status</span>
					{lastChecked && (
						<span className="text-xs text-kumo-subtle">checked {lastChecked}</span>
					)}
				</div>
				<Button
					variant="ghost"
					size="xs"
					icon={<ArrowsClockwiseIcon size={13} className={isFetching ? "animate-spin" : ""} />}
					onClick={() => refetch()}
					disabled={isFetching}
					aria-label="Refresh status"
				>
					Refresh
				</Button>
			</div>

			{!services ? (
				<div className="flex items-center gap-2 py-2 text-xs text-kumo-subtle">
					<Loader size="sm" />
					<span>Checking services…</span>
				</div>
			) : (
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
					{services.map(({ key, label, status }) => (
						<div
							key={key}
							className="flex items-center justify-between gap-3 rounded-lg border border-kumo-line bg-kumo-recessed px-3 py-2.5"
						>
							<div className="flex items-center gap-2 min-w-0">
								<StatusDot status={status as ServiceStatus} />
								<span className="text-sm text-kumo-default truncate">{label}</span>
							</div>
							<Badge variant={statusVariant(status as ServiceStatus)}>
								{statusLabel(status as ServiceStatus)}
							</Badge>
						</div>
					))}
				</div>
			)}

			<p className="mt-3 text-xs text-kumo-subtle">
				Click Refresh to check current status. AI Agent must be running on port 8200 for AI features to work.
			</p>
		</div>
	);
}

export default function SettingsRoute() {
	const { mailboxId } = useMailboxParams();
	const toastManager = useKumoToastManager();
	const { data: mailbox } = useMailbox(mailboxId);
	const updateMailboxMutation = useUpdateMailbox();

	const [displayName, setDisplayName] = useState("");
	const [agentPrompt, setAgentPrompt] = useState("");
	const [aiProvider, setAiProvider] = useState<AIProvider>("kimi");
	const [kimiApiKey, setKimiApiKey] = useState("");
	const [codexToken, setCodexToken] = useState("");
	const [openaiKey, setOpenaiKey] = useState("");
	const [isSaving, setIsSaving] = useState(false);

	useEffect(() => {
		if (mailbox) {
			setDisplayName(mailbox.settings?.fromName || mailbox.name || "");
			setAgentPrompt(mailbox.settings?.agentSystemPrompt || "");
			setAiProvider((mailbox.settings?.aiProvider as AIProvider) || "kimi");
			setKimiApiKey(mailbox.settings?.kimiApiKey || "");
			setCodexToken(mailbox.settings?.codexToken || "");
			setOpenaiKey(mailbox.settings?.openaiKey || "");
		}
	}, [mailbox]);

	const handleSave = async () => {
		if (!mailbox || !mailboxId) return;
		setIsSaving(true);
		const settings = {
			...mailbox.settings,
			fromName: displayName,
			agentSystemPrompt: agentPrompt.trim() || undefined,
			aiProvider,
			kimiApiKey: kimiApiKey.trim() || undefined,
			codexToken: codexToken.trim() || undefined,
			openaiKey: openaiKey.trim() || undefined,
		};
		try {
			await updateMailboxMutation.mutateAsync({ mailboxId, settings });
			toastManager.add({ title: "Settings saved!" });
		} catch {
			toastManager.add({ title: "Failed to save settings", variant: "error" });
		} finally {
			setIsSaving(false);
		}
	};

	const handleResetPrompt = () => {
		setAgentPrompt("");
	};

	if (!mailbox) {
		return (
			<div className="flex justify-center py-20">
				<Loader size="lg" />
			</div>
		);
	}

	const isCustomPrompt = agentPrompt.trim().length > 0;

	return (
		<div className="max-w-2xl px-4 py-4 md:px-8 md:py-6 h-full overflow-y-auto">
			<h1 className="text-lg font-semibold text-kumo-default mb-6">Settings</h1>

			<div className="space-y-6">
				{/* Connection Status */}
				<ConnectionStatusCard />

				{/* Account */}
				<div className="rounded-lg border border-kumo-line bg-kumo-base p-5">
					<div className="text-sm font-medium text-kumo-default mb-4">Account</div>
					<div className="space-y-3">
						<Input
							label="Display Name"
							value={displayName}
							onChange={(e) => setDisplayName(e.target.value)}
						/>
						<Input label="Email" type="email" value={mailbox.email} disabled />
					</div>
				</div>

				{/* Agent System Prompt */}
				<div className="rounded-lg border border-kumo-line bg-kumo-base p-5">
					<div className="flex items-center justify-between mb-4">
						<div className="flex items-center gap-2">
							<RobotIcon size={16} weight="duotone" className="text-kumo-subtle" />
							<span className="text-sm font-medium text-kumo-default">AI Agent Prompt</span>
							{isCustomPrompt ? (
								<Badge variant="primary">Custom</Badge>
							) : (
								<Badge variant="secondary">Default</Badge>
							)}
						</div>
						{isCustomPrompt && (
							<Button
								variant="ghost"
								size="xs"
								icon={<ArrowCounterClockwiseIcon size={14} />}
								onClick={handleResetPrompt}
							>
								Reset to default
							</Button>
						)}
					</div>
					<p className="text-xs text-kumo-subtle mb-3">
						Customize how the AI agent behaves for this mailbox. Leave empty to use the built-in default prompt.
					</p>
					<textarea
						value={agentPrompt}
						onChange={(e) => setAgentPrompt(e.target.value)}
						placeholder={PROMPT_PLACEHOLDER}
						rows={12}
						className="w-full resize-y rounded-lg border border-kumo-line bg-kumo-recessed px-3 py-2 text-xs text-kumo-default placeholder:text-kumo-subtle focus:outline-none focus:ring-1 focus:ring-kumo-ring font-mono leading-relaxed"
					/>
					<p className="text-xs text-kumo-subtle mt-2">
						The prompt is sent as the system message to the AI model. It controls the agent's personality, writing style, and behavior rules.
					</p>
				</div>

				{/* AI Provider Settings */}
				<div className="rounded-lg border border-kumo-line bg-kumo-base p-5">
					<div className="flex items-center gap-2 mb-4">
						<RobotIcon size={16} weight="duotone" className="text-kumo-subtle" />
						<span className="text-sm font-medium text-kumo-default">AI Provider</span>
					</div>
					<p className="text-xs text-kumo-subtle mb-4">
						Choose which AI service to use for generating email drafts and responses.
					</p>

					<div className="space-y-4">
						<div>
							<label className="block text-xs font-medium text-kumo-default mb-2">Provider</label>
							<select
								value={aiProvider}
								onChange={(e) => setAiProvider(e.target.value as AIProvider)}
								className="w-full rounded-lg border border-kumo-line bg-kumo-recessed px-3 py-2 text-sm text-kumo-default focus:outline-none focus:ring-1 focus:ring-kumo-ring"
							>
								<option value="kimi">Kimi (Moonshot AI)</option>
								<option value="codex">Codex OAuth</option>
								<option value="openai">OpenAI-compatible</option>
								<option value="workers-ai">Cloudflare Workers AI</option>
							</select>
						</div>

						{aiProvider === "kimi" && (
							<div>
								<label className="block text-xs font-medium text-kumo-default mb-2">Kimi API Key</label>
								<Input
									type="password"
									value={kimiApiKey}
									onChange={(e) => setKimiApiKey(e.target.value)}
									placeholder="sk-..."
								/>
								<p className="text-xs text-kumo-subtle mt-1">
									Get your API key from <a href="https://platform.moonshot.cn" target="_blank" rel="noopener noreferrer" className="text-kumo-brand hover:underline">platform.moonshot.cn</a>
								</p>
							</div>
						)}

						{aiProvider === "codex" && (
							<div>
								<label className="block text-xs font-medium text-kumo-default mb-2">Codex OAuth Token</label>
								<Input
									type="password"
									value={codexToken}
									onChange={(e) => setCodexToken(e.target.value)}
									placeholder="your_codex_token"
								/>
								<p className="text-xs text-kumo-subtle mt-1">
									Enter your Codex OAuth token
								</p>
							</div>
						)}

						{aiProvider === "openai" && (
							<div>
								<label className="block text-xs font-medium text-kumo-default mb-2">OpenAI API Key</label>
								<Input
									type="password"
									value={openaiKey}
									onChange={(e) => setOpenaiKey(e.target.value)}
									placeholder="sk-..."
								/>
								<p className="text-xs text-kumo-subtle mt-1">
									Compatible with OpenAI, local Ollama, or other OpenAI-compatible APIs
								</p>
							</div>
						)}

						{aiProvider === "workers-ai" && (
							<div className="p-3 rounded-lg bg-kumo-recessed border border-kumo-line">
								<p className="text-xs text-kumo-subtle">
									Cloudflare Workers AI will be used. Requires deployment to Cloudflare Workers.
								</p>
							</div>
						)}
					</div>
				</div>

				{/* Save */}
				<div className="flex justify-end">
					<Button variant="primary" onClick={handleSave} loading={isSaving}>
						Save Changes
					</Button>
				</div>
			</div>
		</div>
	);
}
