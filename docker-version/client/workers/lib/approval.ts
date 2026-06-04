// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

/**
 * HITL approval state machine for agent-generated drafts.
 *
 * Transitions:
 *   null      →  pending         (agent submits for review)
 *   pending   →  approved        (human approves)
 *   pending   →  rejected        (human rejects)
 *   pending   →  pending         (idempotent re-submit; no-op)
 *
 * Approved / rejected are terminal — re-transitioning is rejected so the
 * audit trail in approval_meta_json stays meaningful.
 */

export type ApprovalState = "pending" | "approved" | "rejected";
export type ApprovalAction = "submit" | "approve" | "reject";

export interface ApprovalMeta {
	decided_by?: string;
	decided_at?: string;
	comment?: string | null;
	submitted_at?: string;
}

export function nextApprovalState(
	current: ApprovalState | null,
	action: ApprovalAction,
): ApprovalState | null {
	if (action === "submit") {
		if (current === null || current === "pending") return "pending";
		return null; // refuse re-submit of terminal state
	}
	if (current !== "pending") return null;
	if (action === "approve") return "approved";
	if (action === "reject") return "rejected";
	return null;
}

export function isTerminal(state: ApprovalState | null): boolean {
	return state === "approved" || state === "rejected";
}
