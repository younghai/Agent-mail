# 2026-06-01 localhost 5174 Vite stability

## Scope

v0 Agent Inbox local development server at `localhost:5174`.

## User journey or operational reason

The local browser showed an Application Error while loading the Agentic Inbox UI. The dev server log showed Vite optimized dependency files disappearing while the browser still requested stale chunk URLs.

## Applied changes

- Cleared and restarted the local Vite optimized dependency cache.
- Expanded `optimizeDeps.include` in `vite.config.ts` so the heavy UI/runtime dependencies are pre-bundled together instead of re-optimizing in waves during browser load.
- Defined the local browser service token for the 5174 dev bundle so first-load mailbox requests can authenticate without manual localStorage setup.
- Tightened the local AI draft plugin's chat completion response parsing so TypeScript handles provider JSON as `unknown` and narrows it before reading `choices`.

## Explicit non-changed areas

- No database schema or migration files changed.
- No production credentials, remote deployment, or production APIs were touched.
- The visible mail UI and mail data model were not redesigned in this fix.

## Verification performed

- `pnpm exec tsc -b --pretty false`
- `curl http://localhost:5174/?reload=stable-final`
- `curl -H 'Authorization: Bearer local-dev-token-change-me' http://localhost:5174/api/v1/mailboxes`
