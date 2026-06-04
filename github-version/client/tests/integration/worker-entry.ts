// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

/**
 * Minimal worker entry point for integration tests.
 *
 * Exports only the Durable Object classes needed by integration tests,
 * avoiding imports that pull in Workers AI / @modelcontextprotocol/sdk / ajv
 * which use CJS require() patterns incompatible with the Workers runtime test env.
 */

export { MailboxDO } from "../../workers/durableObject";
export { AdminDO } from "../../workers/admin";

// Minimal fetch handler required by the Workers runtime
export default {
	async fetch(): Promise<Response> {
		return new Response("test worker", { status: 200 });
	},
};
