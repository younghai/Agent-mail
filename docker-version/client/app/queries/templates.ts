// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "~/services/api";
import type { Template } from "~/types";
import { queryKeys } from "./keys";

export function useTemplates(mailboxId: string | undefined) {
	return useQuery<Template[]>({
		queryKey: mailboxId
			? queryKeys.templates.list(mailboxId)
			: ["templates", "_disabled"],
		queryFn: () => api.listTemplates(mailboxId!) as Promise<Template[]>,
		enabled: !!mailboxId,
	});
}

export function useCreateTemplate() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({
			mailboxId,
			input,
		}: {
			mailboxId: string;
			input: { name: string; subject?: string | null; body: string };
		}) => api.createTemplate(mailboxId, input),
		onSuccess: (_data, { mailboxId }) => {
			qc.invalidateQueries({ queryKey: queryKeys.templates.list(mailboxId) });
		},
	});
}

export function useUpdateTemplate() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({
			mailboxId,
			id,
			patch,
		}: {
			mailboxId: string;
			id: string;
			patch: { name?: string; subject?: string | null; body?: string };
		}) => api.updateTemplate(mailboxId, id, patch),
		onSuccess: (_data, { mailboxId }) => {
			qc.invalidateQueries({ queryKey: queryKeys.templates.list(mailboxId) });
		},
	});
}

export function useDeleteTemplate() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ mailboxId, id }: { mailboxId: string; id: string }) =>
			api.deleteTemplate(mailboxId, id),
		onSuccess: (_data, { mailboxId }) => {
			qc.invalidateQueries({ queryKey: queryKeys.templates.list(mailboxId) });
		},
	});
}

/**
 * Bump the updated_at timestamp so the picker can show recently used
 * templates first. Optimistic — does not block; cache is invalidated
 * on success but failures are silent.
 */
export function useTouchTemplate() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ mailboxId, id }: { mailboxId: string; id: string }) =>
			api.touchTemplate(mailboxId, id),
		onSuccess: (_data, { mailboxId }) => {
			qc.invalidateQueries({ queryKey: queryKeys.templates.list(mailboxId) });
		},
	});
}
