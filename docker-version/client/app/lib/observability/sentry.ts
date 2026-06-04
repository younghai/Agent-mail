// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

/**
 * Browser-side Sentry instrumentation.
 *
 * - Uses VITE_SENTRY_DSN env var (set in .env.local / Cloudflare Pages env).
 * - No-op when the DSN is absent — safe in local development.
 * - Guard with import.meta.env.SSR so this never runs in the Workers SSR context.
 */

let _browserInitialised = false;

/**
 * Initialise Sentry in the browser.
 * Call once at app entry point (app/root.tsx module scope).
 * Safe to call without VITE_SENTRY_DSN — returns without initialising.
 */
export function initBrowserSentry(): void {
	// Only run in the browser, not during SSR in the Worker.
	if (typeof window === "undefined") return;
	if (_browserInitialised) return;

	const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
	if (!dsn) return;

	// Lazy dynamic import keeps @sentry/react out of the SSR bundle.
	import("@sentry/react").then(({ init }) => {
		init({
			dsn,
			environment: (import.meta.env.VITE_SENTRY_ENVIRONMENT as string | undefined) ?? "production",
			tracesSampleRate: 0.1,
		});
		_browserInitialised = true;
	}).catch((err) => {
		// Never let Sentry initialisation crash the app.
		console.warn("[sentry] Failed to initialise:", err);
	});
}

/**
 * Capture an unhandled error in the browser and return the Sentry eventId
 * so the UI can surface it (Error ID shown to the user for support).
 * No-op when Sentry is not initialised — resolves to undefined.
 */
export async function captureBrowserError(error: unknown): Promise<string | undefined> {
	if (typeof window === "undefined") return undefined;
	try {
		const sentry = await import("@sentry/react");
		return sentry.captureException(error);
	} catch {
		return undefined;
	}
}

/**
 * Reset initialisation state — for testing only.
 * @internal
 */
export function __resetBrowserSentry(): void {
	_browserInitialised = false;
}
