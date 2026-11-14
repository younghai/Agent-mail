// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { withSentry, captureException } from "@sentry/cloudflare";
import { routeAgentRequest } from "agents";
import { Hono } from "hono";
import { createRequestHandler } from "react-router";
import { app as apiApp, receiveEmail } from "./index";
import { EmailMCP } from "./mcp";
import type { Env } from "./types";
import { initSentryClient, captureWorkerError } from "./lib/observability/sentry";
import { initSlackAlert } from "./lib/observability/slack-alert";
import { createAccessMiddleware, type AccessContext } from "./lib/access";

export { MailboxDO } from "./durableObject";
export { EmailAgent } from "./agent";
export { EmailMCP } from "./mcp";
export { AdminDO } from "./admin";

declare module "react-router" {
	export interface AppLoadContext {
		cloudflare: {
			env: Env;
			ctx: ExecutionContext;
		};
	}
}

const requestHandler = createRequestHandler(
	() => import("virtual:react-router/server-build"),
	import.meta.env.MODE,
);

// Main app that wraps the API and adds React Router fallback
const app = new Hono<AccessContext>();
app.use("*", createAccessMiddleware(import.meta.env.DEV));

// MCP server endpoint — used by AI coding tools (ProtoAgent, Claude Code, Cursor, etc.)
// Must be before API routes and React Router catch-all
const mcpHandler = EmailMCP.serve("/mcp", { binding: "EMAIL_MCP" });
app.all("/mcp", async (c) => {
	return mcpHandler.fetch(c.req.raw, c.env, c.executionCtx as ExecutionContext);
});
app.all("/mcp/*", async (c) => {
	return mcpHandler.fetch(c.req.raw, c.env, c.executionCtx as ExecutionContext);
});

// Mount the API routes
app.route("/", apiApp);

// Agent WebSocket routing - must be before React Router catch-all
app.all("/agents/*", async (c) => {
	const response = await routeAgentRequest(c.req.raw, c.env);
	if (response) return response;
	return c.text("Agent not found", 404);
});

// React Router catch-all: serves the SPA for all non-API routes
app.all("*", (c) => {
	return requestHandler(c.req.raw, {
		cloudflare: { env: c.env, ctx: c.executionCtx as ExecutionContext },
	});
});

// Export the Hono app as the default export with an email handler.
// withSentry wraps the whole ExportedHandler — when SENTRY_DSN is absent the
// optionsCallback returns undefined and the SDK stays uninitialised (no-op).
export default withSentry(
	(env: Env) => {
		// Wire Slack alert client regardless of whether Sentry DSN is present.
		initSlackAlert(env);
		if (!env.SENTRY_DSN) return undefined;
		// Wire the captureException helper so captureWorkerError() works in all
		// handlers (email, Durable Objects, Tail Workers) without importing
		// @sentry/cloudflare directly from those modules.
		initSentryClient({ captureException });
		return {
			dsn: env.SENTRY_DSN,
			environment: env.SENTRY_ENVIRONMENT,
			tracesSampleRate: 0.1,
		};
	},
	{
		fetch: app.fetch,
		async email(
			event: { raw: ReadableStream; rawSize: number },
			env: Env,
			ctx: ExecutionContext,
		) {
			try {
				await receiveEmail(event, env, ctx);
			} catch (e) {
				// Capture to Sentry before re-throwing so the error is tracked.
				captureWorkerError(e, { handler: "email" });
				console.error("Failed to process incoming email:", (e as Error).message, (e as Error).stack);
				// Re-throw so Cloudflare's email routing can retry delivery or bounce the message.
				// Swallowing the error would silently drop the email.
				throw e;
			}
		},
	},
);
