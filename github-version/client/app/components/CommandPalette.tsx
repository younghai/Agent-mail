// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { Dialog } from "@cloudflare/kumo";
import { capabilities } from "~/lib/capabilities";
import {
	ArchiveIcon,
	EnvelopeSimpleIcon,
	FileIcon,
	FolderIcon,
	GearSixIcon,
	MagnifyingGlassIcon,
	PaperPlaneTiltIcon,
	PencilSimpleIcon,
	RobotIcon,
	TrashIcon,
	TrayIcon,
} from "@phosphor-icons/react";
import {
	type KeyboardEvent,
	type ReactNode,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { useNavigate } from "react-router";
import { Folders } from "shared/folders";
import { encodeMailboxSlug } from "~/lib/mailbox-slug";
import { useFolders } from "~/queries/folders";
import { useMailboxes } from "~/queries/mailboxes";
import { useMailboxParams } from "~/hooks/useMailboxParams";
import { useUIStore } from "~/hooks/useUIStore";

interface CommandAction {
	id: string;
	label: string;
	hint?: string;
	icon: ReactNode;
	keywords?: string[];
	run: () => void;
}

const FOLDER_ICONS: Record<string, ReactNode> = {
	[Folders.INBOX]: <TrayIcon size={16} weight="regular" />,
	[Folders.SENT]: <PaperPlaneTiltIcon size={16} weight="regular" />,
	[Folders.DRAFT]: <FileIcon size={16} weight="regular" />,
	[Folders.ARCHIVE]: <ArchiveIcon size={16} weight="regular" />,
	[Folders.TRASH]: <TrashIcon size={16} weight="regular" />,
};

/**
 * Simple ranking:
 *   exact label match    → 100
 *   label startsWith q   → 60
 *   any keyword match    → 30
 *   label contains q     → 10
 *   else                 → 0  (filtered out)
 */
function scoreAction(action: CommandAction, q: string): number {
	if (!q) return 1;
	const label = action.label.toLowerCase();
	if (label === q) return 100;
	if (label.startsWith(q)) return 60;
	if (action.keywords?.some((k) => k.toLowerCase().includes(q))) return 30;
	if (label.includes(q)) return 10;
	return 0;
}

export default function CommandPalette() {
	const { isCommandPaletteOpen, closeCommandPalette, toggleAgentPanel, startCompose } =
		useUIStore();
	const navigate = useNavigate();
	const [query, setQuery] = useState("");
	const [activeIndex, setActiveIndex] = useState(0);
	const inputRef = useRef<HTMLInputElement>(null);
	const listRef = useRef<HTMLDivElement>(null);

	const { mailboxId, mailboxSlug } = useMailboxParams();
	const { data: mailboxes = [] } = useMailboxes();
	const { data: folders = [] } = useFolders(mailboxId);

	useEffect(() => {
		if (isCommandPaletteOpen) {
			setQuery("");
			setActiveIndex(0);
			// Defer focus until Dialog has mounted
			requestAnimationFrame(() => inputRef.current?.focus());
		}
	}, [isCommandPaletteOpen]);

	const actions = useMemo<CommandAction[]>(() => {
		const out: CommandAction[] = [];

		for (const mb of mailboxes) {
			out.push({
				id: `mailbox:${mb.id}`,
				label: `Open ${mb.email}`,
				hint: "Mailbox",
				icon: <EnvelopeSimpleIcon size={16} weight="regular" />,
				keywords: ["mailbox", "open", mb.email, mb.name || ""],
				run: () => {
					navigate(`/mailbox/${encodeMailboxSlug(mb.id)}/emails/inbox`);
					closeCommandPalette();
				},
			});
		}

		if (mailboxSlug) {
			for (const folder of folders) {
				const systemIcon = FOLDER_ICONS[folder.id];
				out.push({
					id: `folder:${folder.id}`,
					label: `Go to ${folder.name}`,
					hint: "Folder",
					icon: systemIcon ?? <FolderIcon size={16} weight="regular" />,
					keywords: ["folder", "navigate", folder.name, folder.id],
					run: () => {
						navigate(`/mailbox/${mailboxSlug}/emails/${folder.id}`);
						closeCommandPalette();
					},
				});
			}
		}

		// Actions
		if (mailboxSlug) {
			out.push({
				id: "compose:new",
				label: "Compose new email",
				hint: "Action",
				icon: <PencilSimpleIcon size={16} weight="regular" />,
				keywords: ["compose", "new", "write", "email"],
				run: () => {
					startCompose({ mode: "new" });
					closeCommandPalette();
				},
			});
			if (capabilities.aiAssistant) {
				out.push({
					id: "agent:toggle",
					label: "Toggle email agent panel",
					hint: "Action",
					icon: <RobotIcon size={16} weight="regular" />,
					keywords: ["agent", "ai", "panel", "toggle"],
					run: () => {
						toggleAgentPanel();
						closeCommandPalette();
					},
				});
			}
			out.push({
				id: "settings:mailbox",
				label: "Open settings",
				hint: "Action",
				icon: <GearSixIcon size={16} weight="regular" />,
				keywords: ["settings", "preferences", "config"],
				run: () => {
					navigate(`/mailbox/${mailboxSlug}/settings`);
					closeCommandPalette();
				},
			});
			out.push({
				id: "admin:overview",
				label: "Open admin overview",
				hint: "Action",
				icon: <GearSixIcon size={16} weight="regular" />,
				keywords: ["admin", "overview", "dashboard"],
				run: () => {
					navigate(`/mailbox/${mailboxSlug}/admin`);
					closeCommandPalette();
				},
			});
		}

		return out;
	}, [mailboxes, folders, mailboxSlug, navigate, closeCommandPalette, startCompose, toggleAgentPanel]);

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		const ranked = actions
			.map((a) => ({ action: a, score: scoreAction(a, q) }))
			.filter((x) => x.score > 0)
			.sort((a, b) => b.score - a.score)
			.slice(0, 12)
			.map((x) => x.action);
		return ranked;
	}, [actions, query]);

	useEffect(() => {
		setActiveIndex(0);
	}, [query]);

	useEffect(() => {
		const item = listRef.current?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`);
		item?.scrollIntoView({ block: "nearest" });
	}, [activeIndex]);

	const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "ArrowDown") {
			e.preventDefault();
			setActiveIndex((i) => Math.min(filtered.length - 1, i + 1));
		} else if (e.key === "ArrowUp") {
			e.preventDefault();
			setActiveIndex((i) => Math.max(0, i - 1));
		} else if (e.key === "Enter") {
			e.preventDefault();
			const action = filtered[activeIndex];
			if (action) action.run();
		} else if (e.key === "Escape") {
			closeCommandPalette();
		}
	};

	return (
		<Dialog.Root open={isCommandPaletteOpen} onOpenChange={(open: boolean) => !open && closeCommandPalette()}>
			<Dialog size="lg" className="p-0 overflow-hidden">
				<Dialog.Title className="sr-only">Command palette</Dialog.Title>
				<div className="flex items-center gap-2 px-3 py-2 border-b border-kumo-line">
					<MagnifyingGlassIcon size={16} className="text-kumo-subtle shrink-0" />
					<input
						ref={inputRef}
						type="text"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						onKeyDown={onKeyDown}
						placeholder="Type a command, mailbox, or folder…"
						aria-label="Command palette search"
						className="flex-1 bg-transparent text-sm text-kumo-default placeholder:text-kumo-subtle focus:outline-none"
					/>
					<kbd className="text-[10px] text-kumo-subtle font-mono">ESC</kbd>
				</div>
				<div
					ref={listRef}
					role="listbox"
					aria-label="Command palette results"
					className="max-h-[360px] overflow-y-auto py-1"
				>
					{filtered.length === 0 ? (
						<div className="px-3 py-6 text-center text-xs text-kumo-subtle">
							No matching commands.
						</div>
					) : (
						filtered.map((action, idx) => (
							<button
								key={action.id}
								type="button"
								role="option"
								aria-selected={idx === activeIndex}
								data-index={idx}
								onMouseEnter={() => setActiveIndex(idx)}
								onClick={action.run}
								className={`w-full flex items-center gap-3 px-3 py-2 text-left text-sm bg-transparent border-0 cursor-pointer ${
									idx === activeIndex
										? "bg-kumo-fill text-kumo-default"
										: "text-kumo-strong hover:bg-kumo-tint"
								}`}
							>
								<span className="text-kumo-subtle shrink-0" aria-hidden="true">
									{action.icon}
								</span>
								<span className="flex-1 truncate">{action.label}</span>
								{action.hint && (
									<span className="text-[10px] text-kumo-subtle uppercase tracking-wider shrink-0">
										{action.hint}
									</span>
								)}
							</button>
						))
					)}
				</div>
				<div className="flex items-center justify-between px-3 py-1.5 border-t border-kumo-line text-[10px] text-kumo-subtle">
					<span>
						<kbd className="font-mono">↑↓</kbd> navigate&nbsp;&nbsp;
						<kbd className="font-mono">↵</kbd> select
					</span>
					<span>
						<kbd className="font-mono">⌘K</kbd> open
					</span>
				</div>
			</Dialog>
		</Dialog.Root>
	);
}
