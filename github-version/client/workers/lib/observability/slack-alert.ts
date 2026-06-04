// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

/**
 * Slack alert module for Workers-side observability.
 *
 * Design principles:
 * - No-op when SLACK_ALERT_WEBHOOK_URL is absent (local dev / CI without secrets).
 * - Dedup storage is pluggable: in-memory (default) or KV-backed (persistent across isolates).
 *   Pass a KV binding via env.SLACK_DEDUP_KV to opt into KV persistence.
 * - The real fetch call is kept inside the client so tests can inject a mock
 *   via __setSlackAlertClient without touching globalThis.fetch.
 * - fetch failures never propagate to callers (swallowed, returns sent:false).
 */

/** Pluggable storage for dedup timestamps — in-memory or KV-backed. */
export interface DedupStorage {
	get(fingerprint: string): Promise<number | undefined>;
	put(fingerprint: string, lastSentMs: number): Promise<void>;
}

/** In-memory DedupStorage — default when no KV binding is provided. */
export function memoryDedupStorage(): DedupStorage {
	const m = new Map<string, number>();
	return {
		async get(fp) { return m.get(fp); },
		async put(fp, ts) { m.set(fp, ts); },
	};
}

/** KV-backed DedupStorage — persistent across isolate restarts. */
export function kvDedupStorage(kv: KVNamespace, ttlMinutes: number): DedupStorage {
	return {
		async get(fp) {
			const raw = await kv.get(`slack-dedup:${fp}`);
			return raw ? parseInt(raw) : undefined;
		},
		async put(fp, ts) {
			await kv.put(`slack-dedup:${fp}`, String(ts), { expirationTtl: ttlMinutes * 60 + 60 });
		},
	};
}

export interface AlertPayload {
	severity: "error" | "fatal" | "warning";
	title: string;
	message: string;
	context?: Record<string, unknown>;
	fingerprint?: string;
}

export interface NotifyResult {
	sent: boolean;
	deduped: boolean;
}

export interface SlackAlertClient {
	notify(payload: AlertPayload): Promise<NotifyResult>;
}

/** Options accepted by the default (real-fetch) client. */
export interface DefaultClientOptions {
	webhookUrl: string;
	dedupTtlMs: number;
	/** Pluggable dedup storage — defaults to in-memory. */
	storage?: DedupStorage;
	/** Injectable clock — defaults to Date.now. Used in tests to advance time. */
	now?: () => number;
}

const SEVERITY_COLOR: Record<AlertPayload["severity"], string> = {
	fatal: "#FF0000",
	error: "#FF6600",
	warning: "#FFCC00",
};

/** Build a Slack Block Kit message body for the given payload. */
function buildSlackBody(payload: AlertPayload): unknown {
	const color = SEVERITY_COLOR[payload.severity];
	const contextFields = payload.context
		? Object.entries(payload.context)
				.map(([k, v]) => `*${k}*: ${String(v)}`)
				.join("\n")
		: null;

	return {
		attachments: [
			{
				color,
				blocks: [
					{
						type: "section",
						text: {
							type: "mrkdwn",
							text: `*[${payload.severity.toUpperCase()}] ${payload.title}*\n${payload.message}`,
						},
					},
					...(contextFields
						? [
								{
									type: "section",
									text: {
										type: "mrkdwn",
										text: contextFields,
									},
								},
							]
						: []),
					{
						type: "context",
						elements: [
							{
								type: "mrkdwn",
								text: `Severity: *${payload.severity}*${payload.fingerprint ? ` | Fingerprint: \`${payload.fingerprint}\`` : ""}`,
							},
						],
					},
				],
			},
		],
	};
}

/**
 * Default production client. Uses fetch + pluggable dedup storage.
 * When no storage is provided, falls back to in-memory Map (isolate-scoped).
 * Pass a KV-backed storage for cross-isolate persistence.
 */
export class DefaultSlackAlertClient implements SlackAlertClient {
	private readonly webhookUrl: string;
	private readonly dedupTtlMs: number;
	private readonly now: () => number;
	private readonly storage: DedupStorage;

	constructor(opts: DefaultClientOptions) {
		this.webhookUrl = opts.webhookUrl;
		this.dedupTtlMs = opts.dedupTtlMs;
		this.now = opts.now ?? (() => Date.now());
		this.storage = opts.storage ?? memoryDedupStorage();
	}

	async notify(payload: AlertPayload): Promise<NotifyResult> {
		// Dedup check — only applies when a fingerprint is provided.
		if (payload.fingerprint !== undefined) {
			const lastSent = await this.storage.get(payload.fingerprint);
			const nowMs = this.now();
			if (lastSent !== undefined && nowMs - lastSent < this.dedupTtlMs) {
				return { sent: false, deduped: true };
			}
		}

		try {
			const resp = await fetch(this.webhookUrl, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(buildSlackBody(payload)),
			});

			if (!resp.ok) {
				return { sent: false, deduped: false };
			}

			// Record successful send time for dedup.
			if (payload.fingerprint !== undefined) {
				await this.storage.put(payload.fingerprint, this.now());
			}
			return { sent: true, deduped: false };
		} catch {
			// Network-level failure — swallow, never propagate.
			return { sent: false, deduped: false };
		}
	}
}

/** No-op client used when webhook URL is absent. */
const NO_OP_CLIENT: SlackAlertClient = {
	async notify(_payload: AlertPayload): Promise<NotifyResult> {
		return { sent: false, deduped: false };
	},
};

// Internal singleton — null until initSlackAlert or __setSlackAlertClient sets it.
let _client: SlackAlertClient = NO_OP_CLIENT;

/**
 * Test-only setter. Injects a mock SlackAlertClient without touching fetch.
 * Production code never calls this.
 */
export function __setSlackAlertClient(client: SlackAlertClient): void {
	_client = client;
}

/** Environment bindings consumed by initSlackAlert. */
export interface AlertEnv {
	SLACK_ALERT_WEBHOOK_URL?: string;
	SLACK_ALERT_DEDUP_TTL_MINUTES?: string;
	/** Optional KV namespace for persistent cross-isolate dedup. */
	SLACK_DEDUP_KV?: KVNamespace;
}

/**
 * Called from workers/app.ts with the resolved Env to wire up the real client.
 * When SLACK_ALERT_WEBHOOK_URL is absent this is a no-op (sets the no-op client).
 * When SLACK_DEDUP_KV is bound, uses KV-backed dedup storage; otherwise in-memory.
 */
export function initSlackAlert(env: AlertEnv): void {
	if (!env.SLACK_ALERT_WEBHOOK_URL) {
		_client = NO_OP_CLIENT;
		return;
	}

	const ttlMinutes = Number(env.SLACK_ALERT_DEDUP_TTL_MINUTES ?? "30");
	const resolvedTtl = Number.isFinite(ttlMinutes) ? ttlMinutes : 30;
	const dedupTtlMs = resolvedTtl * 60_000;
	const storage = env.SLACK_DEDUP_KV
		? kvDedupStorage(env.SLACK_DEDUP_KV, resolvedTtl)
		: memoryDedupStorage();

	_client = new DefaultSlackAlertClient({
		webhookUrl: env.SLACK_ALERT_WEBHOOK_URL,
		dedupTtlMs,
		storage,
	});
}

/**
 * Send a Slack alert. Delegates to the current singleton client.
 * No-op (returns {sent:false, deduped:false}) when not initialised.
 * Never throws — any failure is caught and returned as sent:false.
 */
export async function notifySlack(
	payload: AlertPayload,
): Promise<NotifyResult> {
	try {
		return await _client.notify(payload);
	} catch {
		return { sent: false, deduped: false };
	}
}
