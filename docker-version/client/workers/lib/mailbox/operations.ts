// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

/**
 * Pure-logic guards for MailboxDO operations.
 *
 * These functions encode invariants that the DO methods enforce (or should
 * enforce) without depending on Cloudflare Worker runtime types.  They are
 * designed to be unit-tested in plain Node.js and to document the intended
 * semantics for future DO refactors.
 *
 * NOTE: These helpers are additive — they are not yet wired into the DO
 * methods.  Integration is left as a follow-up.
 */

/**
 * Determine whether a markRead operation would change state and what the new
 * read flag should be.  Callers can use this to make markRead idempotent and
 * to skip unnecessary DB writes.
 */
export function applyMarkRead(
	currentRead: boolean,
	requested: boolean,
): { changed: boolean; newRead: boolean } {
	if (currentRead === requested) return { changed: false, newRead: currentRead };
	return { changed: true, newRead: requested };
}

/**
 * Resolve the outcome when a draft save arrives and a draft for the same
 * parent email may already exist.
 *
 * - 'create'  — no existing draft; insert a new row
 * - 'replace' — incoming draft is newer; overwrite the existing row
 * - 'reject'  — incoming draft is stale; discard it (last-write-wins guard)
 */
export function resolveDraftConflict(
	existing: { updatedAt: number } | null,
	incoming: { updatedAt: number },
): "create" | "replace" | "reject" {
	if (!existing) return "create";
	if (incoming.updatedAt > existing.updatedAt) return "replace";
	return "reject";
}

/**
 * Validate whether moving an email between folders is a legal transition.
 *
 * Rules:
 * - Moving to the same folder is a no-op (rejected to avoid spurious writes).
 * - Emails in the trash folder can only stay in trash; restoration is handled
 *   by a dedicated restore API, not a generic move.
 */
export function isValidFolderTransition(from: string, to: string): boolean {
	if (from === to) return false;
	if (from === "trash" && to !== "trash") return false;
	return true;
}
