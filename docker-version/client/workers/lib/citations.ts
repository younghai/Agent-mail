// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

/**
 * Citation extraction and parsing for AI-generated drafts.
 *
 * Parses inline markers in two forms:
 *   [#email:ID]        → type "email"
 *   [#attachment:ID]   → type "attachment"
 *
 * Also parses a trailing "Sources:" block (separated by an empty line or
 * "---") that lists one citation per line. The stripped output:
 *   - drops the Sources: block in full
 *   - leaves inline markers in place
 *
 * Deduplicates citations by (type, id).
 * Empty input or no markers → {stripped: body, citations: []}.
 */

// ── Types ─────────────────────────────────────────────────────────────

export interface Citation {
	type: "email" | "attachment";
	id: string;
	snippet?: string;
}

export interface ExtractCitationsResult {
	stripped: string;
	citations: Citation[];
}

// ── Regex patterns ────────────────────────────────────────────────────

/** Inline citation markers: [#email:ID] or [#attachment:ID] */
const INLINE_CITATION_RE = /\[#(email|attachment):([^\]]+)\]/g;

/** Sources block: starts with "Sources:" (optionally preceded by blank line or ---) */
const SOURCES_BLOCK_RE = /\n*(?:---\s*\n)?\n*Sources:\s*\n[\s\S]*$/i;

// ── Implementation ────────────────────────────────────────────────────

export function extractCitations(body: string): ExtractCitationsResult {
	if (!body || !body.trim()) {
		return { stripped: body, citations: [] };
	}

	// Collect inline citations
	const inlineCitations: Citation[] = [];
	let match: RegExpExecArray | null;
	const inlineRe = new RegExp(INLINE_CITATION_RE.source, "g");

	while ((match = inlineRe.exec(body)) !== null) {
		inlineCitations.push({
			type: match[1] as "email" | "attachment",
			id: match[2],
		});
	}

	// Collect citations from the Sources: block
	const sourcesCitations: Citation[] = [];
	let stripped = body;

	// Check for Sources: block and remove it
	const sourcesMatch = body.match(SOURCES_BLOCK_RE);
	if (sourcesMatch) {
		const sourcesBlock = sourcesMatch[0];
		stripped = body.slice(0, body.length - sourcesBlock.length).trimEnd();

		// Parse individual source lines from the block
		const lines = sourcesBlock.split("\n").slice(1); // skip "Sources:" line
		for (const line of lines) {
			const trimmed = line.trim();
			if (!trimmed) continue;

			// Check for inline-style markers in the sources block
			const srcMatch = trimmed.match(/^\[#(email|attachment):([^\]]+)\]/);
			if (srcMatch) {
				sourcesCitations.push({
					type: srcMatch[1] as "email" | "attachment",
					id: srcMatch[2],
				});
			} else {
				// Plain ID lines — treat as email type by default if they
				// look like IDs (not empty). They're just extra reference
				// entries that don't have an explicit marker prefix.
				// We skip these since the spec only defines [#email:ID] and
				// [#attachment:ID] formats.
			}
		}
	}

	// Merge and deduplicate by (type, id)
	const seen = new Set<string>();
	const citations: Citation[] = [];

	for (const c of [...inlineCitations, ...sourcesCitations]) {
		const key = `${c.type}:${c.id}`;
		if (!seen.has(key)) {
			seen.add(key);
			citations.push(c);
		}
	}

	return { stripped, citations };
}
