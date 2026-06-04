# IMPL-REPORT — Phase D-4: SLA Dashboard (#6)

> Worker: GLM 5.1
> Date: 2026-05-31

## 1. Scope

### Created files
- `/Users/young/Downloads/personal_project/using mail_AI/v0/agent-inbox/workers/lib/sla.ts`
- `/Users/young/Downloads/personal_project/using mail_AI/v0/agent-inbox/app/queries/sla.ts`
- `/Users/young/Downloads/personal_project/using mail_AI/v0/agent-inbox/app/routes/mailbox-admin-sla.tsx`
- `/Users/young/Downloads/personal_project/using mail_AI/v0/agent-inbox/tests/sla.test.ts`

### Modified files
- `/Users/young/Downloads/personal_project/using mail_AI/v0/agent-inbox/workers/durableObject/index.ts`
- `/Users/young/Downloads/personal_project/using mail_AI/v0/agent-inbox/workers/index.ts`
- `/Users/young/Downloads/personal_project/using mail_AI/v0/agent-inbox/app/services/api.ts`
- `/Users/young/Downloads/personal_project/using mail_AI/v0/agent-inbox/app/queries/keys.ts`
- `/Users/young/Downloads/personal_project/using mail_AI/v0/agent-inbox/app/routes.ts`
- `/Users/young/Downloads/personal_project/using mail_AI/v0/agent-inbox/app/components/Sidebar.tsx`

## 2. Applied changes

### Backend
- **`workers/lib/sla.ts`**: Pure helper exporting `SlaWindow` type, `SlaMetrics` interface, and `computeSlaMetrics()` function. Computes avg/P50/P90 response times, overdue list (max 10, >24h, sorted by age desc), and daily trend buckets from received/reply email arrays. Pairs replies to received by `in_reply_to === id`. Percentile uses `floor(n*p)` linear method.
- **`MailboxDO.getSlaMetrics(window)`**: New DO method that queries received emails (NOT in 'sent' folder) and sent replies (in 'sent' folder, non-null `in_reply_to`) within the window cutoff, then delegates to `computeSlaMetrics()`. No new migration — uses existing `emails.date` column.
- **REST route**: `GET /api/v1/mailboxes/:mailboxId/admin/sla?window=7d` with window validation (defaults to "7d", accepts "24h"/"30d").

### Frontend
- **`app/queries/sla.ts`**: `useSlaMetrics(mailboxId, window)` React Query hook with 60s refetch, following the segments.ts pattern.
- **`app/queries/keys.ts`**: Added `queryKeys.sla.metrics(mailboxId, window)`.
- **`app/services/api.ts`**: Added `getSlaMetrics(mailboxId, window?)` API client method.
- **`app/routes/mailbox-admin-sla.tsx`**: Full SLA dashboard page with:
  - Window selector buttons (24h / 7d / 30d)
  - 4 KPI stat cards: Replied count, Avg hours, P50 hours, P90 hours
  - Inline SVG trend chart (received vs replied lines, mirroring admin-cost.tsx viewBox/role/aria-label pattern)
  - Overdue list (max 10) with click-to-navigate (uses `selectEmail` + navigate to inbox)
- **`app/routes.ts`**: Registered `route("admin/sla", "routes/mailbox-admin-sla.tsx")` under mailbox nested group.
- **`app/components/Sidebar.tsx`**: Added SLA link with ClockIcon under "Admin & Settings" section, added ClockIcon to phosphor import.

### Tests
- **`tests/sla.test.ts`**: 7 test cases (spec requires ≥6):
  1. Empty input → zeroes
  2. Average response time across multiple reply pairs
  3. P50 / P90 calculation on 10-item dataset
  4. Overdue inclusion (no reply, >24h old)
  5. Overdue exclusion (replied OR <24h old)
  6. Daily trend bucketing with mixed days
  7. Overdue cap at 10, sorted by age descending

## 3. Validation

### Typecheck (0 errors)
```
$ pnpm exec tsc -b
(no output — 0 errors)
```

### Unit tests (206 pass, 0 fail)
```
ℹ tests 206
ℹ suites 11
ℹ pass 206
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 283.768
```

Baseline was 199, now 199 + 7 new = 206. ✅

### Integration tests (23 pass, 0 fail)
```
Test Files  8 passed (8)
     Tests  23 passed (23)
  Duration  2.01s
```

## 4. Non-changes

- No new DO migration (computed on-the-fly from `emails.date`)
- No new npm dependencies
- No changes to auth/CORS/cost-guard/security files
- No changes to `wrangler.jsonc`, `package.json`, `pnpm-lock.yaml`
- No changes to existing tests (all pre-existing tests still pass unchanged)
- No git commit (Claude will review and commit)
