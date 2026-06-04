# 2026-05-07 v0 Admin Refactor

## Scope

- Changed only `v0/agent-inbox`.
- Did not modify `insider-automation`, `v1-new`, or root workspace services.

## Why

The admin/dashboard UI had accumulated hardcoded section labels, inline demo data, repeated timeline logic, and operational cleanup gaps. That made the left navigation, dashboard panels, and worker data lifecycle harder to maintain safely.

## Changes

- Extracted admin section taxonomy, status labels, demo data, timeline builders, and design tokens into `app/admin/*`.
- Rewired the sidebar Operations menu to use the shared admin section taxonomy.
- Kept demo data behind explicit `VITE_ADMIN_DEMO_DATA=true`; live data is now the default path.
- Kept admin sections collapsible so Requests, Tasks, Clients, Timeline, Draft Review, AI Agents, and Reports do not all expand at once.
- Added a daily bar timeline and weekly line timeline using the shared timeline model.
- Updated mailbox deletion to clean attachment blobs, Durable Object SQLite rows, and mailbox settings together.
- Changed draft replacement to create the new draft first and delete the old draft only after the new draft exists.
- Updated stale local development/change notes for mailbox cleanup and current service test helper names.

## Verification

- `npm test`
- `npm run typecheck`
- `npm run build`
