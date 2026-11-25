import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ApiError } from "../app/services/api.ts";

describe("ApiError", () => {
	it("reads the message from a bare string error", () => {
		const error = new ApiError(400, { error: "Query parameter q is required" });
		assert.equal(error.message, "Query parameter q is required");
		assert.equal(error.code, "");
		assert.equal(error.status, 400);
	});

	it("reads the code and message from the mail server envelope", () => {
		const error = new ApiError(401, { success: false, error: { code: "LOGIN_REQUIRED", message: "관리자 로그인이 필요합니다" } });
		assert.equal(error.message, "관리자 로그인이 필요합니다");
		assert.equal(error.code, "LOGIN_REQUIRED");
	});

	it("falls back to the status when the body is not JSON or carries no message", () => {
		assert.equal(new ApiError(502, {}).message, "Request failed: 502");
		assert.equal(new ApiError(500, { error: { code: "INTERNAL_ERROR" } }).message, "Request failed: 500");
		assert.equal(new ApiError(500, { error: { code: "INTERNAL_ERROR" } }).code, "INTERNAL_ERROR");
	});
});
