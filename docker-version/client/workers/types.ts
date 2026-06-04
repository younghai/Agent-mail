// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

export interface Env extends Cloudflare.Env {
	POLICY_AUD: string;
	TEAM_DOMAIN: string;
	// AI binding. The wrangler.jsonc declaration is commented out for local
	// development (avoids the Cloudflare API auth requirement), so cf-typegen
	// does not include AI in Cloudflare.Env. We declare it here as required
	// because production always has the binding; the runtime guard in
	// EmailAgent.onChatMessage handles the local-dev no-AI case with a 503.
	AI: Ai;
	// Analytics Engine binding — optional (commented out in wrangler.jsonc for
	// local dev). When present, the analytics helpers in
	// workers/lib/observability/analytics.ts write operational metrics.
	ANALYTICS?: AnalyticsEngineDataset;
	// SENTRY_DSN, SLACK_ALERT_WEBHOOK_URL, SENTRY_ENVIRONMENT, SLACK_DEDUP_KV,
	// DAILY_BUDGET_USD, MONTHLY_BUDGET_USD, RATE_LIMIT_PER_MINUTE, and
	// RATE_LIMIT_PER_DAY are all declared in wrangler.jsonc and auto-generated
	// into Cloudflare.Env by cf-typegen — no override needed here. Empty
	// strings for vars (e.g. SENTRY_DSN="") are treated as absent by the
	// observability layer which already uses truthiness checks.
}
