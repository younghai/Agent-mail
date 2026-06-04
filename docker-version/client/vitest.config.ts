// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

// @cloudflare/vitest-pool-workers v0.16.x — uses cloudflareTest plugin API
// (no /config subpath in this version; defineWorkersConfig is not available)
import { cloudflareTest } from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

const poolOptions = {
	// Minimal test entry: exports only MailboxDO + AdminDO, avoids EmailMCP/EmailAgent
	// which pull in @modelcontextprotocol/sdk → ajv → CJS require() patterns that
	// fail in the Workers runtime.
	main: "./tests/integration/worker-entry.ts",
	miniflare: {
		compatibilityDate: "2025-11-28",
		compatibilityFlags: ["nodejs_compat"],
		// Inline bindings — avoids parsing wrangler.jsonc which references
		// tail_consumers (external service) and send_email that miniflare can't emulate.
		kvNamespaces: ["SLACK_DEDUP_KV"],
		r2Buckets: ["BUCKET"],
		// DO bindings reference classes exported from worker-entry.ts.
		// useSQLite: true enables ctx.storage.sql for SQLite-backed DOs.
		durableObjects: {
			MAILBOX: { className: "MailboxDO", useSQLite: true },
			ADMIN: { className: "AdminDO", useSQLite: true },
		},
		bindings: {
			DOMAINS: "test.example.com",
			EMAIL_ADDRESSES: "[]",
			ADMIN_EMAILS: "",
			SENTRY_ENVIRONMENT: "test",
			SLACK_ALERT_DEDUP_TTL_MINUTES: "30",
			RATE_LIMIT_PER_MINUTE: "20",
			RATE_LIMIT_PER_DAY: "500",
			DAILY_BUDGET_USD: "10",
			MONTHLY_BUDGET_USD: "200",
		},
		migrations: [
			{ tag: "v1", new_sqlite_classes: ["MailboxDO"] },
			{ tag: "v4", new_sqlite_classes: ["AdminDO"] },
		],
	},
};

export default defineConfig({
	plugins: [cloudflareTest(poolOptions)],
	test: {
		include: ["tests/integration/**/*.spec.ts"],
	},
});
