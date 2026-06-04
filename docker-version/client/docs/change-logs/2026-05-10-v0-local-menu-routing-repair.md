# 2026-05-10 v0 Local Menu Routing Repair

## Scope

- Target: `v0/agent-inbox`
- Runtime: Cloudflare Workers local dev on `http://127.0.0.1:8787`
- User-facing area: sidebar mail folders and Operations/Admin navigation

## User Journey / Operational Reason

The local service was reachable on `127.0.0.1:8787`, but several visible menu entries appeared broken:

- Mail folders: Drafts, Archive, Trash, Spam
- Operations: Requests, Tasks, Clients, Timeline, Draft Review, AI Agents, Reports

The root cause was not a missing React route for those pages. Local Wrangler serves the production-built worker through `build/server/wrangler.json`, so `import.meta.env.DEV` is false even when the request is from `127.0.0.1`. Admin endpoints therefore treated local requests as unauthenticated and returned `403`, which made Operations screens fail after navigation.

Spam also existed in the mailbox folder API, but it was excluded from the sidebar's system folder list.

## Applied Changes

- Added loopback host detection for Admin API identity fallback in `workers/index.ts`.
- Kept production behavior fail-closed; only `localhost`, `127.0.0.1`, `::1`, or Vite dev mode get the local admin fallback.
- Added Spam to `SYSTEM_FOLDER_IDS`, folder tool descriptions, and sidebar system links.
- Added Rollup `maxParallelFileOps` in `vite.config.ts` to avoid macOS `ENFILE` build failures when many watcher processes are open.
- Narrowed the `cloudflare:test` Durable Object helper type in `tests/integration/cost-guard.spec.ts` so `pnpm run typecheck` completes without expanding an excessively deep generic type.

## Explicit Non-Changed Areas

- Did not change `v1-present`, `v1-new`, `insider-automation`, or other sibling services.
- Did not change production Cloudflare Access policy requirements.
- Did not alter mailbox data, R2 object layout, Durable Object storage, or admin dashboard data model.
- Did not remove or reinstall `node_modules`.

## Verification Performed

- `pnpm run build` passed and regenerated `build/server/wrangler.json`.
- `pnpm run test` passed: 140 tests.
- `pnpm run typecheck` passed.
- `pnpm run test:integration` passed: 8 files, 23 tests.
- Restarted Wrangler local dev on `http://127.0.0.1:8787`.
- Verified root HTML returns `200`.
- Verified Admin APIs return `200` locally:
  - `/api/v1/admin/overview`
  - `/api/v1/admin/clients`
  - `/api/v1/admin/tasks`
  - `/api/v1/admin/action-queue`
- Verified mailbox folders API includes `archive,draft,inbox,sent,spam,trash`.
- Verified folder data APIs return `200`:
  - `folder=draft`
  - `folder=archive`
  - `folder=trash`
  - `folder=spam`
- Verified SSR sidebar HTML contains links for Drafts, Archive, Spam, Trash, Operations, Requests, Tasks, Clients, Timeline, Draft Review, AI Agents, Reports, Settings, and Dashboard.
- Verified route URLs return `200`:
  - `/mailbox/bzengage@example.com/emails/draft`
  - `/mailbox/bzengage@example.com/emails/archive`
  - `/mailbox/bzengage@example.com/emails/trash`
  - `/mailbox/bzengage@example.com/emails/spam`
  - `/mailbox/bzengage@example.com/admin`
