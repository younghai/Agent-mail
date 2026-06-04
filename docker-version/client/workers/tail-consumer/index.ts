// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

/**
 * Tail Worker entrypoint.
 *
 * Deployed separately from the main Worker (wrangler.tail-consumer.jsonc).
 * The main Worker lists this service in tail_consumers[] in wrangler.jsonc.
 *
 * Initialisation mirrors workers/app.ts:
 *   - initSlackAlert(env) always runs (needs webhook URL + dedup TTL).
 *   - initSentryClient only runs when SENTRY_DSN is present.
 */

import { withSentry, captureException } from "@sentry/cloudflare";
import type { TraceItem } from "@cloudflare/workers-types/experimental";
import type { Env } from "../types";
import { initSentryClient, captureWorkerError } from "../lib/observability/sentry";
import { initSlackAlert, notifySlack } from "../lib/observability/slack-alert";
import { processTailEvents } from "./handler";
import { recordTailEvent } from "../lib/observability/analytics.ts";

export default withSentry(
	(env: Env) => {
		initSlackAlert(env);
		if (!env.SENTRY_DSN) return undefined;
		initSentryClient({ captureException });
		return {
			dsn: env.SENTRY_DSN,
			environment: env.SENTRY_ENVIRONMENT,
			tracesSampleRate: 0.1,
		};
	},
	{
		async tail(events: TraceItem[], env: Env, _ctx: ExecutionContext) {
			const result = await processTailEvents(events, {
				capture: (err, ctx) => captureWorkerError(err, ctx),
				alert: (payload) => notifySlack(payload),
				recordTailAnalytics: (input) => recordTailEvent(env, { outcome: input.outcome as "ok" | "exception", scriptName: input.scriptName, durationMs: input.durationMs }),
			});
			console.log("[tail-consumer] processed", result);
		},
	},
);
