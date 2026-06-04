// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { Button, Dialog, Empty, Input } from "@cloudflare/kumo";
import {
	BookmarksSimpleIcon,
	FileTextIcon,
	PlusIcon,
	TrashIcon,
} from "@phosphor-icons/react";
import { type FormEvent, useMemo, useState } from "react";
import {
	useCreateTemplate,
	useDeleteTemplate,
	useTemplates,
	useTouchTemplate,
} from "~/queries/templates";
import type { Template } from "~/types";

interface TemplatePickerProps {
	mailboxId: string | undefined;
	currentSubject: string;
	currentBody: string;
	onApply: (template: Template) => void;
}

export default function TemplatePicker({
	mailboxId,
	currentSubject,
	currentBody,
	onApply,
}: TemplatePickerProps) {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const [showCreate, setShowCreate] = useState(false);
	const [newName, setNewName] = useState("");

	const { data: templates = [], isLoading } = useTemplates(mailboxId);
	const createMutation = useCreateTemplate();
	const deleteMutation = useDeleteTemplate();
	const touchMutation = useTouchTemplate();

	const filtered = useMemo<Template[]>(() => {
		const q = query.trim().toLowerCase();
		if (!q) return templates;
		return templates.filter(
			(t) =>
				t.name.toLowerCase().includes(q) ||
				(t.subject || "").toLowerCase().includes(q),
		);
	}, [templates, query]);

	const handleApply = (template: Template) => {
		onApply(template);
		if (mailboxId) {
			touchMutation.mutate({ mailboxId, id: template.id });
		}
		setOpen(false);
	};

	const handleDelete = (id: string) => {
		if (!mailboxId) return;
		if (!window.confirm("Delete this template?")) return;
		deleteMutation.mutate({ mailboxId, id });
	};

	const handleCreate = async (e: FormEvent) => {
		e.preventDefault();
		if (!mailboxId || !newName.trim()) return;
		if (!currentBody.replace(/<[^>]+>/g, "").trim()) return;
		await createMutation.mutateAsync({
			mailboxId,
			input: {
				name: newName.trim(),
				subject: currentSubject || null,
				body: currentBody,
			},
		});
		setNewName("");
		setShowCreate(false);
	};

	const bodySnapshotHasContent = Boolean(
		currentBody.replace(/<[^>]+>/g, "").trim(),
	);

	return (
		<>
			<Button
				type="button"
				variant="ghost"
				size="sm"
				icon={<BookmarksSimpleIcon size={14} />}
				onClick={() => setOpen(true)}
				disabled={!mailboxId}
			>
				Templates
			</Button>

			<Dialog.Root open={open} onOpenChange={setOpen}>
				<Dialog size="lg" className="p-0 overflow-hidden">
					<div className="px-4 py-3 border-b border-kumo-line">
						<Dialog.Title className="text-base font-semibold">
							Reply templates
						</Dialog.Title>
						<p className="text-xs text-kumo-subtle mt-0.5">
							Insert a saved reply or save the current draft as a template.
						</p>
					</div>

					<div className="px-4 py-2 border-b border-kumo-line">
						<Input
							type="text"
							size="sm"
							placeholder="Search templates…"
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							aria-label="Search templates"
						/>
					</div>

					<div className="max-h-[360px] overflow-y-auto">
						{isLoading ? (
							<div className="px-4 py-8 text-center text-xs text-kumo-subtle">
								Loading templates…
							</div>
						) : filtered.length === 0 ? (
							<div className="px-4 py-8">
								<Empty
									icon={<FileTextIcon size={32} className="text-kumo-inactive" />}
									title={query ? "No matching templates" : "No templates yet"}
									description={
										query
											? "Try a different search term."
											: "Save your current draft as a template to reuse it later."
									}
								/>
							</div>
						) : (
							<ul role="list" className="py-1">
								{filtered.map((template) => (
									<li
										key={template.id}
										className="flex items-center justify-between px-4 py-2 hover:bg-kumo-tint group"
									>
										<button
											type="button"
											onClick={() => handleApply(template)}
											className="flex-1 text-left bg-transparent border-0 cursor-pointer min-w-0 focus:outline-none focus:ring-2 focus:ring-kumo-ring rounded"
										>
											<div className="text-sm font-medium text-kumo-default truncate">
												{template.name}
											</div>
											{template.subject && (
												<div className="text-xs text-kumo-subtle truncate">
													{template.subject}
												</div>
											)}
										</button>
										<Button
											type="button"
											variant="ghost"
											shape="square"
											size="sm"
											icon={<TrashIcon size={14} />}
											onClick={() => handleDelete(template.id)}
											aria-label={`Delete template ${template.name}`}
											className="opacity-0 group-hover:opacity-100 transition-opacity"
										/>
									</li>
								))}
							</ul>
						)}
					</div>

					<div className="px-4 py-3 border-t border-kumo-line bg-kumo-fill/30">
						{showCreate ? (
							<form onSubmit={handleCreate} className="flex items-center gap-2">
								<Input
									type="text"
									size="sm"
									placeholder="Template name"
									value={newName}
									onChange={(e) => setNewName(e.target.value)}
									required
									aria-label="New template name"
									className="flex-1"
								/>
								<Button
									type="submit"
									variant="primary"
									size="sm"
									loading={createMutation.isPending}
									disabled={!newName.trim() || !bodySnapshotHasContent}
								>
									Save
								</Button>
								<Button
									type="button"
									variant="secondary"
									size="sm"
									onClick={() => {
										setShowCreate(false);
										setNewName("");
									}}
								>
									Cancel
								</Button>
							</form>
						) : (
							<Button
								type="button"
								variant="secondary"
								size="sm"
								icon={<PlusIcon size={14} />}
								onClick={() => setShowCreate(true)}
								disabled={!bodySnapshotHasContent}
								title={
									bodySnapshotHasContent
										? "Save current draft as a template"
										: "Write something first to save as a template"
								}
							>
								Save current as template
							</Button>
						)}
					</div>
				</Dialog>
			</Dialog.Root>
		</>
	);
}
