// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import assert from "node:assert/strict";
import { test } from "node:test";
import {
	applyMarkRead,
	resolveDraftConflict,
	isValidFolderTransition,
} from "../workers/lib/mailbox/operations.ts";

// ── applyMarkRead ─────────────────────────────────────────────────────────────

test("markRead: already-read email markRead=true is idempotent (no change)", () => {
	const result = applyMarkRead(true, true);
	assert.equal(result.changed, false);
	assert.equal(result.newRead, true);
});

test("markRead: already-unread email markRead=false is idempotent (no change)", () => {
	const result = applyMarkRead(false, false);
	assert.equal(result.changed, false);
	assert.equal(result.newRead, false);
});

test("markRead: unread → read returns changed=true and newRead=true", () => {
	const result = applyMarkRead(false, true);
	assert.equal(result.changed, true);
	assert.equal(result.newRead, true);
});

test("markRead: read → unread returns changed=true and newRead=false", () => {
	const result = applyMarkRead(true, false);
	assert.equal(result.changed, true);
	assert.equal(result.newRead, false);
});

test("concurrent markRead calls — same target read=true are all idempotent after first", () => {
	// Simulate a shared mutable store updated by each caller sequentially
	// (Cloudflare DO serialises calls; this models the serial execution order).
	let storedRead = false;
	const requests = [true, true, true];
	const results = requests.map((req) => {
		const r = applyMarkRead(storedRead, req);
		if (r.changed) storedRead = r.newRead;
		return r;
	});
	// Only the first call should be changed; subsequent ones are no-ops.
	assert.equal(results[0].changed, true);
	assert.equal(results[1].changed, false);
	assert.equal(results[2].changed, false);
	assert.equal(storedRead, true);
});

test("concurrent markRead calls — mixed read/unread settle on last writer", () => {
	let storedRead = false;
	const requests = [true, false, true];
	const results = requests.map((req) => {
		const r = applyMarkRead(storedRead, req);
		if (r.changed) storedRead = r.newRead;
		return r;
	});
	// Last write wins: final state should reflect last request (true).
	assert.equal(storedRead, true);
	const changedCount = results.filter((r) => r.changed).length;
	assert.ok(changedCount >= 1);
});

test("Promise.all markRead simulation — all results are structurally valid", async () => {
	// All calls run against the same snapshot of storedRead (false).
	// In a real DO they would be serialised; here we verify the helper
	// returns valid shapes for every input combination.
	const storedRead = false;
	const results = await Promise.all([
		Promise.resolve(applyMarkRead(storedRead, true)),
		Promise.resolve(applyMarkRead(storedRead, true)),
		Promise.resolve(applyMarkRead(storedRead, false)),
	]);
	for (const r of results) {
		assert.ok(typeof r.changed === "boolean");
		assert.ok(typeof r.newRead === "boolean");
	}
	const trueCount = results.filter((r) => r.changed && r.newRead).length;
	assert.ok(trueCount >= 1);
});

// ── resolveDraftConflict ──────────────────────────────────────────────────────

test("draftConflict: no existing draft → 'create'", () => {
	assert.equal(resolveDraftConflict(null, { updatedAt: 1000 }), "create");
});

test("draftConflict: incoming newer than existing → 'replace'", () => {
	assert.equal(
		resolveDraftConflict({ updatedAt: 500 }, { updatedAt: 1000 }),
		"replace",
	);
});

test("draftConflict: incoming same timestamp as existing → 'reject'", () => {
	assert.equal(
		resolveDraftConflict({ updatedAt: 1000 }, { updatedAt: 1000 }),
		"reject",
	);
});

test("draftConflict: incoming older than existing → 'reject'", () => {
	assert.equal(
		resolveDraftConflict({ updatedAt: 2000 }, { updatedAt: 1000 }),
		"reject",
	);
});

// ── isValidFolderTransition ───────────────────────────────────────────────────

test("folderTransition: same folder is rejected", () => {
	assert.equal(isValidFolderTransition("inbox", "inbox"), false);
});

test("folderTransition: normal inbox → sent is allowed", () => {
	assert.equal(isValidFolderTransition("inbox", "sent"), true);
});

test("folderTransition: inbox → trash is allowed", () => {
	assert.equal(isValidFolderTransition("inbox", "trash"), true);
});

test("folderTransition: trash → inbox is blocked (use restore API)", () => {
	assert.equal(isValidFolderTransition("trash", "inbox"), false);
});

test("folderTransition: trash → sent is blocked", () => {
	assert.equal(isValidFolderTransition("trash", "sent"), false);
});

test("folderTransition: trash → trash is rejected (same folder)", () => {
	assert.equal(isValidFolderTransition("trash", "trash"), false);
});
