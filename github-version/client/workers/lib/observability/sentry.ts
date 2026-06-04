// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

/**
 * Workers-side Sentry instrumentation helpers.
 *
 * Design principles:
 * - No-op when SENTRY_DSN is absent (local dev / CI without secrets).
 * - The real @sentry/cloudflare import is kept out of this module so tests
 *   that inject a mock via __setSentryClient never pull in the SDK at all.
 * - wrapWorkerFetch is implemented in workers/app.ts using withSentry directly,
 *   because withSentry wraps the whole default export object.
 */

export interface SentryClient {
	captureException(err: unknown, context?: Record<string, unknown>): void;
}

// Internal singleton — null until __setSentryClient or SDK init sets it.
let _client: SentryClient | null = null;

/**
 * Test-only setter. Injects a mock SentryClient without touching the real SDK.
 * Production code never calls this; workers/app.ts sets the client via
 * initSentryClient() after SDK initialisation.
 */
export function __setSentryClient(mock: SentryClient | null): void {
	_client = mock;
}

/**
 * Called from workers/app.ts after @sentry/cloudflare is loaded to wire up
 * the real captureException function as the client.
 */
export function initSentryClient(client: SentryClient): void {
	_client = client;
}

/**
 * Explicitly capture an error with optional context bag and severity.
 * No-op when Sentry is not initialised (DSN absent or test did not inject mock).
 *
 * When severity is 'fatal', also attempts a Slack alert via notifySlack.
 * The Slack notification failure never propagates to the caller.
 *
 * Use in email handler, Durable Objects, and Tail Workers (M3).
 */
export function captureWorkerError(
	err: unknown,
	context?: Record<string, unknown>,
	severity: "error" | "fatal" | "warning" = "error",
): void {
	_client?.captureException(err, context);

	if (severity === "fatal") {
		const message =
			err instanceof Error ? err.message : String(err);
		// Import is deferred inline to avoid circular dependency at module load time.
		// Failure is swallowed — Slack alert must never break the caller's flow.
		import("./slack-alert.js")
			.then(({ notifySlack }) =>
				notifySlack({
					severity: "fatal",
					title: "Fatal Worker Error",
					message,
					context,
				}),
			)
			.catch(() => {
				// Intentionally swallowed.
			});
	}
}
