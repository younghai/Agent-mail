# M2: Slack Alert Module — Change Log

**Date**: 2026-05-08
**Milestone**: v0 P0 M2 — Slack alert notification with dedup

---

## Changed Files

| File | Change |
|------|--------|
| `workers/lib/observability/slack-alert.ts` | **New** — Slack alert module |
| `workers/lib/observability/sentry.ts` | Added optional `severity` param; fatal→notifySlack hook |
| `workers/app.ts` | Added `initSlackAlert(env)` call in `withSentry` env callback |
| `workers/types.ts` | Added `SLACK_ALERT_WEBHOOK_URL?: string` |
| `wrangler.jsonc` | Added `SLACK_ALERT_DEDUP_TTL_MINUTES: "30"` to `vars` |
| `.dev.vars.example` | Added `SLACK_ALERT_WEBHOOK_URL=` placeholder |
| `tests/slack-alert.test.ts` | **New** — 8 unit tests |

---

## Environment Variables

### Secret (not in `vars` — inject via `wrangler secret put`)
```
SLACK_ALERT_WEBHOOK_URL=https://hooks.slack.com/services/...
```
Absent in local dev → all calls are silent no-ops. Never committed.

### Var (in `wrangler.jsonc` `vars`, default `"30"`)
```
SLACK_ALERT_DEDUP_TTL_MINUTES=30
```
Parsed at `initSlackAlert()` time. Controls the in-memory dedup TTL.

---

## Module Design (`workers/lib/observability/slack-alert.ts`)

### Public interface

```ts
notifySlack(payload: AlertPayload): Promise<NotifyResult>
initSlackAlert(env): void            // wires real client from env
__setSlackAlertClient(client): void  // test seam (same pattern as sentry.ts)
```

### AlertPayload
```ts
{
  severity: 'error' | 'fatal' | 'warning'
  title: string
  message: string
  context?: Record<string, unknown>
  fingerprint?: string  // omit to always-send (no dedup)
}
```

### Slack message format
Block Kit with attachment color by severity:
- `fatal` → `#FF0000`
- `error` → `#FF6600`
- `warning` → `#FFCC00`

---

## Dedup Behaviour

- Keyed on `fingerprint`. Payloads without `fingerprint` are **never deduped** (always sent).
- Default TTL: **30 minutes** (configurable via `SLACK_ALERT_DEDUP_TTL_MINUTES`).
- State lives in **`Map<string, number>` per `DefaultSlackAlertClient` instance**.
- **Scope limitation**: in-memory per Worker isolate. If Cloudflare spins up a new isolate, dedup resets. Cross-isolate persistent dedup via KV is deferred to a future milestone.

---

## Sentry Integration (`workers/lib/observability/sentry.ts`)

`captureWorkerError` signature extended:
```ts
captureWorkerError(
  err: unknown,
  context?: Record<string, unknown>,
  severity: 'error' | 'fatal' | 'warning' = 'error',
): void
```
- Existing callers (`app.ts:140`) pass no `severity` argument — they default to `'error'` and are unaffected.
- When `severity === 'fatal'`, `notifySlack` is called via dynamic `import()` to avoid circular dependency at module load time. Failure is swallowed.

---

## Test Results

```
pnpm typecheck  →  0 errors
pnpm test       →  17 passed (existing 9 + new 8), 0 failed
```

New tests (`tests/slack-alert.test.ts`):
1. `notifySlack is no-op when SLACK_ALERT_WEBHOOK_URL is absent`
2. `same fingerprint within TTL is deduped and fetch is called only once`
3. `different fingerprints are not deduped — each triggers its own fetch`
4. `after TTL expires the same fingerprint is sent again`
5. `HTTP error response returns sent:false and does not throw`
6. `network failure returns sent:false and does not throw`
7. `payload without fingerprint is never deduped`
8. `__setSlackAlertClient mock receives calls via notifySlack`

---

## M3 (Tail Worker) Integration Points

- **`captureWorkerError`** is already the correct call-site for Tail Worker error capture. Pass `severity: 'fatal'` for critical Tail Worker errors to trigger Slack alerts.
- **`initSlackAlert(env)`** must be called in the Tail Worker's `fetch`/`tail` handler setup (same pattern as `app.ts`).
- Consider adding `fingerprint` based on error type + handler name to control alert volume in high-traffic Tail Workers.
- KV-backed dedup (persistent across isolates) should be evaluated for M3 or M4 once Tail Worker alert volume is measured.
