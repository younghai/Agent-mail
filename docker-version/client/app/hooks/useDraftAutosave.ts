// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { useEffect, useRef, useState } from "react";

/**
 * Compose autosave is a localStorage-only safety net. The authoritative draft
 * lives on the server via "Save as Draft". Autosave protects the operator from
 * losing work on accidental refresh or tab close while composing.
 *
 * - Key: `compose:${mailboxId}:${draftId|"new"}`
 * - Debounced 1s after any field change
 * - Snapshots expire after 24h
 * - Cleared on send/discard via clearAutosave()
 */

export interface AutosavePayload {
	to: string;
	cc: string;
	bcc: string;
	subject: string;
	body: string;
}

export type AutosaveStatus = "idle" | "saving" | "saved" | "error";

interface StoredSnapshot extends AutosavePayload {
	savedAt: number;
}

const STORAGE_VERSION = 1;
const TTL_MS = 24 * 60 * 60 * 1000; // 24h
const DEBOUNCE_MS = 1000;

function storageKey(mailboxId: string, draftId: string | undefined): string {
	return `compose:v${STORAGE_VERSION}:${mailboxId}:${draftId ?? "new"}`;
}

function isEmptyPayload(p: AutosavePayload): boolean {
	const stripped = (p.body || "").replace(/<[^>]+>/g, "").trim();
	return !p.to && !p.cc && !p.bcc && !p.subject && !stripped;
}

export function readAutosave(
	mailboxId: string | undefined,
	draftId: string | undefined,
): AutosavePayload | null {
	if (!mailboxId || typeof window === "undefined") return null;
	try {
		const raw = window.localStorage.getItem(storageKey(mailboxId, draftId));
		if (!raw) return null;
		const parsed = JSON.parse(raw) as StoredSnapshot;
		if (!parsed || typeof parsed.savedAt !== "number") return null;
		if (Date.now() - parsed.savedAt > TTL_MS) {
			window.localStorage.removeItem(storageKey(mailboxId, draftId));
			return null;
		}
		return {
			to: parsed.to ?? "",
			cc: parsed.cc ?? "",
			bcc: parsed.bcc ?? "",
			subject: parsed.subject ?? "",
			body: parsed.body ?? "",
		};
	} catch {
		return null;
	}
}

export function clearAutosave(
	mailboxId: string | undefined,
	draftId: string | undefined,
): void {
	if (!mailboxId || typeof window === "undefined") return;
	try {
		window.localStorage.removeItem(storageKey(mailboxId, draftId));
	} catch {
		// ignore quota / disabled storage
	}
}

export function useDraftAutosave(
	mailboxId: string | undefined,
	draftId: string | undefined,
	payload: AutosavePayload,
	enabled: boolean = true,
): AutosaveStatus {
	const [status, setStatus] = useState<AutosaveStatus>("idle");
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		if (!enabled || !mailboxId || typeof window === "undefined") return;
		if (isEmptyPayload(payload)) return;

		setStatus("saving");
		if (timerRef.current) clearTimeout(timerRef.current);
		timerRef.current = setTimeout(() => {
			try {
				const snapshot: StoredSnapshot = { ...payload, savedAt: Date.now() };
				window.localStorage.setItem(
					storageKey(mailboxId, draftId),
					JSON.stringify(snapshot),
				);
				setStatus("saved");
			} catch {
				setStatus("error");
			}
		}, DEBOUNCE_MS);

		return () => {
			if (timerRef.current) clearTimeout(timerRef.current);
		};
	}, [
		enabled,
		mailboxId,
		draftId,
		payload.to,
		payload.cc,
		payload.bcc,
		payload.subject,
		payload.body,
	]);

	return status;
}
