// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

/**
 * Auto-routing rules — pure evaluator.
 *
 * A rule fires when ALL of its match predicates evaluate true (logical AND).
 * Operators compose multiple rules to cover OR cases.  Rules are evaluated in
 * descending priority order and the first match wins.  The evaluator never
 * mutates the email or the rule; the caller decides how to apply the action.
 *
 * Designed to run on Edge (no Node deps, no I/O), so MailboxDO.createEmail can
 * call it inline against the incoming row.
 */

export type RuleField = "sender" | "subject" | "recipient" | "body";

export type RuleOperator =
	| "contains"
	| "equals"
	| "startsWith"
	| "endsWith"
	| "regex";

export interface RuleMatch {
	field: RuleField;
	op: RuleOperator;
	value: string;
	caseSensitive?: boolean;
}

export type RuleActionType =
	| "move"
	| "mark_read"
	| "star"
	| "skip_agent";

export interface RuleAction {
	type: RuleActionType;
	/** Required when type = "move"; the folder id (slug for system folders). */
	folderId?: string;
}

export interface RoutingRule {
	id: string;
	name: string;
	priority: number;
	enabled: boolean;
	match: RuleMatch[];
	action: RuleAction;
}

export interface RoutableEmail {
	sender?: string | null;
	recipient?: string | null;
	subject?: string | null;
	body?: string | null;
}

export interface RuleMatchResult {
	rule: RoutingRule;
	action: RuleAction;
}

function fieldValue(email: RoutableEmail, field: RuleField): string {
	switch (field) {
		case "sender": return email.sender ?? "";
		case "recipient": return email.recipient ?? "";
		case "subject": return email.subject ?? "";
		case "body": return email.body ?? "";
	}
}

function applyOp(
	target: string,
	pattern: string,
	op: RuleOperator,
	caseSensitive: boolean,
): boolean {
	if (op === "regex") {
		try {
			const re = new RegExp(pattern, caseSensitive ? "" : "i");
			return re.test(target);
		} catch {
			// Invalid regex never matches — rule authoring error, fail-safe.
			return false;
		}
	}
	const t = caseSensitive ? target : target.toLowerCase();
	const p = caseSensitive ? pattern : pattern.toLowerCase();
	switch (op) {
		case "contains": return t.includes(p);
		case "equals": return t === p;
		case "startsWith": return t.startsWith(p);
		case "endsWith": return t.endsWith(p);
	}
}

export function matchesRule(email: RoutableEmail, rule: RoutingRule): boolean {
	if (!rule.enabled) return false;
	if (rule.match.length === 0) return false;
	for (const m of rule.match) {
		const target = fieldValue(email, m.field);
		const ok = applyOp(target, m.value, m.op, m.caseSensitive ?? false);
		if (!ok) return false;
	}
	return true;
}

/**
 * Evaluate rules in descending priority. Returns the first matching rule's
 * action plus the rule itself, or null when no rule fires.
 *
 * Stable: ties in priority resolve by array order (caller controls).
 */
export function evaluateRules(
	email: RoutableEmail,
	rules: RoutingRule[],
): RuleMatchResult | null {
	const ordered = [...rules].sort((a, b) => b.priority - a.priority);
	for (const rule of ordered) {
		if (matchesRule(email, rule)) {
			return { rule, action: rule.action };
		}
	}
	return null;
}
