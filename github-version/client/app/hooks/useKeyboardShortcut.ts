// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { useEffect } from "react";

/**
 * Tiny shortcut hook for global keybindings.
 *
 * Shortcut syntax: "<modifier>+<key>", combinable with "+":
 *   - "mod"   = ⌘ on Mac, Ctrl elsewhere
 *   - "shift" / "alt"
 *   - bare key for unmodified shortcuts (e.g. "j", "Escape")
 *
 * Examples:  "mod+k"  "shift+?"  "Escape"  "j"
 *
 * Shortcuts NEVER fire when the user is typing in an editable element
 * (input, textarea, select, contentEditable) unless the modifier set
 * includes "mod" — operators expect ⌘K etc. to always work.
 */

export type Shortcut = string;

interface Options {
	enabled?: boolean;
	allowInInputs?: boolean;
}

function isEditableTarget(target: EventTarget | null): boolean {
	if (!(target instanceof HTMLElement)) return false;
	const tag = target.tagName;
	if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
	if (target.isContentEditable) return true;
	return false;
}

function parseShortcut(shortcut: string) {
	const parts = shortcut.toLowerCase().split("+").map((p) => p.trim());
	const key = parts.pop() ?? "";
	return {
		key,
		mod: parts.includes("mod"),
		shift: parts.includes("shift"),
		alt: parts.includes("alt"),
	};
}

export function useKeyboardShortcut(
	shortcut: Shortcut,
	handler: (e: KeyboardEvent) => void,
	options: Options = {},
): void {
	const { enabled = true, allowInInputs = false } = options;

	useEffect(() => {
		if (!enabled || typeof window === "undefined") return;

		const onKey = (e: KeyboardEvent) => {
			const { key, mod, shift, alt } = parseShortcut(shortcut);
			const modPressed = e.metaKey || e.ctrlKey;
			if (mod !== modPressed) return;
			if (shift !== e.shiftKey) return;
			if (alt !== e.altKey) return;
			if (e.key.toLowerCase() !== key && e.code.toLowerCase() !== key) return;

			// Allow ⌘-modifier shortcuts everywhere; gate unmodified ones in editors.
			if (!mod && !allowInInputs && isEditableTarget(e.target)) return;

			handler(e);
		};

		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [shortcut, handler, enabled, allowInInputs]);
}
