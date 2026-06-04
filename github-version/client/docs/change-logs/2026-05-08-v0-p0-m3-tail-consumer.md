# M3: Cloudflare Tail Worker — Change Log

**Date**: 2026-05-08
**Milestone**: v0 P0 M3
**Status**: Complete (unit tests passing, typecheck clean)

---

## Overview

Added a Cloudflare Tail Worker (`agentic-inbox-tail`) that receives trace events from the main Worker (`agentic-inbox`) and:
1. Forwards every exception to Sentry via the existing `captureWorkerError` helper (M1).
2. When the worker outcome is `'exception'`, sends a fatal Slack alert via `notifySlack` (M2).

The main Worker is unaffected — it lists the tail consumer via `tail_consumers` in `wrangler.jsonc` but does not call it directly.

---

## New Files

| File | Purpose |
|------|---------|
| `workers/tail-consumer/handler.ts` | Pure `processTailEvents` function — no Worker context dependencies |
| `workers/tail-consumer/index.ts` | Tail Worker entrypoint; wires Sentry + Slack then delegates to handler |
| `wrangler.tail-consumer.jsonc` | Separate wrangler config for the tail consumer deploy unit |
| `tests/tail-consumer.test.ts` | 7 unit tests (mock-based, no real I/O) |

---

## Modified Files

| File | Change |
|------|--------|
| `wrangler.jsonc` | Added `tail_consumers: [{ service: "agentic-inbox-tail" }]` |
| `package.json` | Added `deploy:tail-consumer` script |

---

## Handler Logic Flow

```
Cloudflare Tail runtime
  └─► tail(events: TraceItem[], env, ctx)
        ├─ initSlackAlert(env)          // wires Slack client (M2)
        ├─ initSentryClient(...)         // wires Sentry if SENTRY_DSN present (M1)
        └─► processTailEvents(events, deps)
              for each TraceItem:
                if exceptions.length > 0:
                  for each exception:
                    deps.capture(new Error(exc.message), context)  → Sentry
                  if outcome === 'exception':
                    deps.alert({ severity:'fatal', ... })           → Slack
                    (alert failure is swallowed — never propagates)
```

Events are processed sequentially (not `Promise.all`) to preserve in-memory dedup consistency in `DefaultSlackAlertClient` — the Map check-then-set is not safe under concurrent awaits.

---

## wrangler Configuration

**`wrangler.jsonc`** (producer — main Worker):
```jsonc
"tail_consumers": [
  { "service": "agentic-inbox-tail" }
]
```

**`wrangler.tail-consumer.jsonc`** (consumer — separate deploy):
- `name`: `agentic-inbox-tail`
- `main`: `./workers/tail-consumer/index.ts`
- Same `vars` block: `SENTRY_ENVIRONMENT`, `SLACK_ALERT_DEDUP_TTL_MINUTES`
- Secrets injected separately: `SENTRY_DSN`, `SLACK_ALERT_WEBHOOK_URL`

---

## Test Results

24 tests total (17 existing + 7 new), all passing.

### New tests (`tests/tail-consumer.test.ts`)

| # | Test name | Assertion |
|---|-----------|-----------|
| 1 | no exceptions — capture and alert are not called | `capture=0, alert=0` |
| 2 | one exception — capture called once with Error object | `capture=1`, arg is `Error` |
| 3 | multiple exceptions in one event — capture called once per exception | `capture=N` for N exceptions |
| 4 | outcome=exception — alert called once with fatal severity | `alert=1`, `severity='fatal'` |
| 5 | outcome=ok with exceptions — capture fires, alert skipped | `capture=1, alert=0` |
| 6 | alert rejection — processTailEvents does not throw | completes, `alertsSent=0` |
| 7 | returned counts match exceptions forwarded and alerts sent | exact count assertions |

```
ℹ tests 24
ℹ pass 24
ℹ fail 0
```

---

## Typecheck

```
pnpm typecheck → exit 0, 0 errors
tsc -b --noEmit → exit 0, 0 errors
```

---

## Next Steps: Deploying the Tail Worker

### 1. Deploy the tail consumer first

```bash
# Inject secrets into the tail consumer
wrangler secret put SENTRY_DSN --config wrangler.tail-consumer.jsonc
wrangler secret put SLACK_ALERT_WEBHOOK_URL --config wrangler.tail-consumer.jsonc

# Deploy the tail consumer Worker
pnpm run deploy:tail-consumer
```

### 2. Deploy the main Worker (activates tail_consumers binding)

```bash
pnpm run deploy
```

### 3. Verify in Cloudflare dashboard

- Go to **Workers & Pages** → `agentic-inbox` → **Tail Workers** tab
- Confirm `agentic-inbox-tail` appears as active consumer
- Trigger a test error and check Sentry + Slack receive the event

### Notes

- The tail consumer is billed separately (it is its own Worker invocation per trace batch).
- Dedup state in the tail consumer is per-isolate and not shared across instances — same limitation as M2.
- KV-backed cross-isolate dedup remains deferred to a future milestone.
