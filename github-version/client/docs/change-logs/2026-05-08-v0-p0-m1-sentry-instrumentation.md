# M1 — Sentry Instrumentation

**Date:** 2026-05-08
**Milestone:** v0-p0-m1 (Sentry init/wrapping + unit tests)

---

## Changed Files

| File | Change |
|------|--------|
| `/Users/young/Downloads/personal_project/using mail_AI/v0/agent-inbox/workers/types.ts` | Added `SENTRY_DSN?: string` to `Env` interface (secret, not in generated types) |
| `/Users/young/Downloads/personal_project/using mail_AI/v0/agent-inbox/workers/lib/observability/sentry.ts` | **New** — `SentryClient` interface, `__setSentryClient`, `initSentryClient`, `captureWorkerError` |
| `/Users/young/Downloads/personal_project/using mail_AI/v0/agent-inbox/workers/app.ts` | Wrapped default export with `withSentry`; added `captureWorkerError` in email handler before re-throw |
| `/Users/young/Downloads/personal_project/using mail_AI/v0/agent-inbox/app/lib/observability/sentry.ts` | **New** — `initBrowserSentry` (lazy `@sentry/react` init, no-op without `VITE_SENTRY_DSN`) |
| `/Users/young/Downloads/personal_project/using mail_AI/v0/agent-inbox/app/root.tsx` | Added `initBrowserSentry()` call at module scope (before component definitions) |
| `/Users/young/Downloads/personal_project/using mail_AI/v0/agent-inbox/wrangler.jsonc` | Added `SENTRY_ENVIRONMENT: "production"` to `vars` |
| `/Users/young/Downloads/personal_project/using mail_AI/v0/agent-inbox/.dev.vars.example` | Added `SENTRY_DSN=` placeholder |
| `/Users/young/Downloads/personal_project/using mail_AI/v0/agent-inbox/tests/sentry.test.ts` | **New** — 5 unit tests for the workers observability module |

---

## Added Dependencies

| Package | Version |
|---------|---------|
| `@sentry/cloudflare` | `10.52.0` |
| `@sentry/react` | `10.52.0` |

---

## Integration Points

### Workers (Hono + Cloudflare)

**`workers/app.ts` — default export (line ~112)**

```ts
export default withSentry(
  (env: Env) => {
    if (!env.SENTRY_DSN) return undefined; // no-op in local dev
    initSentryClient({ captureException });
    return { dsn: env.SENTRY_DSN, environment: env.SENTRY_ENVIRONMENT, tracesSampleRate: 0.1 };
  },
  { fetch: app.fetch, async email(...) { ... captureWorkerError(e, { handler: "email" }); ... } }
);
```

- `withSentry` wraps the full `ExportedHandler` object (both `fetch` and `email`).
- `captureWorkerError` is called in the `email` handler's catch block before re-throwing.

### React (Browser)

**`app/root.tsx` — module scope (line ~14)**

```ts
import { initBrowserSentry } from "~/lib/observability/sentry";
initBrowserSentry();
```

- `initBrowserSentry` guards with `typeof window === "undefined"` — no SSR execution.
- Reads `import.meta.env.VITE_SENTRY_DSN`; no-op when absent.

---

## Injecting the DSN in Production

```bash
# Workers (server-side)
wrangler secret put SENTRY_DSN

# React (browser — set in Cloudflare Pages environment variables)
VITE_SENTRY_DSN=https://xxxx@oXXX.ingest.sentry.io/YYYY
```

---

## Test Results

```
pnpm test → 9 passed, 0 failed

  Original tests (admin-logic.test.ts):
    ✔ calculateCompletionRate treats done and closed as complete
    ✔ groupTasksByStatus includes every operational status
    ✔ terminal status helper matches reporting semantics
    ✔ usage buckets add all tracked operations counters

  New tests (sentry.test.ts):
    ✔ captureWorkerError is no-op when no Sentry client is set
    ✔ handler result is returned unchanged when no DSN is configured
    ✔ captureWorkerError calls captureException once on the injected client
    ✔ initSentryClient wires up the client for subsequent captureWorkerError calls
    ✔ setting client to null disables capture again
```

```
pnpm typecheck → 0 errors
```

---

## M2 Connectivity (Slack Alert)

The `captureWorkerError` function in `workers/lib/observability/sentry.ts` is the integration hook for M2.

M2 (Slack alert) will call `captureWorkerError` with a context bag carrying `{ alertChannel: "slack", ... }` — or add a parallel `notifySlack(err, context)` helper in the same `observability/` directory. The `SentryClient` interface is easily extended or composed.

The `initSentryClient` setter pattern also makes it trivial to add `beforeSend` hooks in M2 that forward events to a Slack webhook.
