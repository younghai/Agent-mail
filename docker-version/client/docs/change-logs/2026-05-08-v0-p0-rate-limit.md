# Track D — M1: Per-mailbox Rate Limiting

**Date**: 2026-05-08
**Status**: Merged

## Changed Files

| File | Change |
|------|--------|
| `workers/lib/rate-limit/limiter.ts` | New — core sliding-window rate limiter |
| `workers/lib/rate-limit/do-adapter.ts` | New — DurableObjectStorage adapter for limiter |
| `workers/agent/index.ts` | Updated — rate limit guard on `draft_email`, `draft_reply` tools |
| `workers/types.ts` | Updated — comment noting RATE_LIMIT vars are in Cloudflare.Env |
| `wrangler.jsonc` | Updated — added `RATE_LIMIT_PER_MINUTE` and `RATE_LIMIT_PER_DAY` vars |
| `tests/rate-limit.test.ts` | New — 7 unit tests for limiter |

## Rate Limit Policy

| Dimension | Default | Env var |
|-----------|---------|---------|
| Per-mailbox per-minute | 20 calls | `RATE_LIMIT_PER_MINUTE` |
| Per-mailbox per-day | 500 calls | `RATE_LIMIT_PER_DAY` |

Defaults are set in `wrangler.jsonc` vars and can be overridden per environment.
The per-day limit env var is wired into `Cloudflare.Env` by cf-typegen but not yet
enforced in a check (day-bucket counter is a natural extension of the same pattern).

## Tool Coverage

**Rate-limited tools** (AI/drafting calls):
- `draft_reply` — drafts a reply to an existing email (calls AI + storage)
- `draft_email` — drafts a new outbound email (calls AI + storage)

**Not rate-limited** (read-only or lightweight operations):
- `list_emails`
- `get_email`
- `get_thread`
- `search_emails`
- `mark_email_read`
- `move_email`
- `discard_draft`

## Implementation Details

### Algorithm

Epoch-bucketed sliding window: `Math.floor(nowMs / windowMs) * windowMs` produces
a stable key per window. Each unique `(bucketKey, windowStart)` pair is a separate
DO storage key. Counter is incremented atomically (DO single-threaded execution
guarantees no race conditions within a DO instance).

Key format: `rate-limit:agent:<mailboxId>:minute:<windowStartMs>`

### DO Storage TTL Limitation

DurableObjectStorage does not support `expirationTtl` natively (Workers KV does).
Old epoch bucket keys will persist in DO storage after their window expires. They
are harmless because each window uses a distinct key, but they do accumulate.

**Mitigation**: Epoch-bucketed keys are naturally namespaced by time — stale keys
cannot affect current-window counters. A future DO alarm can scan and delete keys
older than `windowSeconds * 2` to keep storage tidy.

### Error Response Shape

When rate-limited, the tool returns:
```json
{ "error": "Rate limit exceeded: 20 per 60s", "retryAfterSeconds": 42 }
```

This object is returned as the tool call result to the LLM, which converts it into
a natural user-facing message (e.g. "You've reached the drafting limit — please try
again in 42 seconds.").

## Next Steps

- Wire `RATE_LIMIT_PER_DAY` into a second `checkRateLimit` call with `windowSeconds: 86400`
- Add DO alarm for periodic cleanup of stale bucket keys
- Connect with cost guard (D-M3 Tail Worker) to emit rate-limit events as metrics
