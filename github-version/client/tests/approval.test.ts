import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isTerminal, nextApprovalState } from "../workers/lib/approval.ts";

describe("nextApprovalState", () => {
	it("submits null → pending", () => {
		assert.equal(nextApprovalState(null, "submit"), "pending");
	});

	it("submits pending → pending (idempotent)", () => {
		assert.equal(nextApprovalState("pending", "submit"), "pending");
	});

	it("refuses submit from terminal states", () => {
		assert.equal(nextApprovalState("approved", "submit"), null);
		assert.equal(nextApprovalState("rejected", "submit"), null);
	});

	it("approves pending → approved", () => {
		assert.equal(nextApprovalState("pending", "approve"), "approved");
	});

	it("rejects pending → rejected", () => {
		assert.equal(nextApprovalState("pending", "reject"), "rejected");
	});

	it("refuses approve / reject from non-pending", () => {
		assert.equal(nextApprovalState(null, "approve"), null);
		assert.equal(nextApprovalState("approved", "reject"), null);
		assert.equal(nextApprovalState("rejected", "approve"), null);
	});
});

describe("isTerminal", () => {
	it("approved and rejected are terminal", () => {
		assert.equal(isTerminal("approved"), true);
		assert.equal(isTerminal("rejected"), true);
	});

	it("pending and null are not terminal", () => {
		assert.equal(isTerminal("pending"), false);
		assert.equal(isTerminal(null), false);
	});
});
