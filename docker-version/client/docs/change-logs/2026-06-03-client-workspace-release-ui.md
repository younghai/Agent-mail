# Client Workspace Release UI

- Scope: `client` package integration inside the `github-version` release bundle.
- User journey or operational reason: initial GitHub install should open the full Agent Mail React UI with the left mailbox menu instead of an API-only or placeholder inbox page.
- Applied changes: added the React client as a workspace package, aligned standalone Vite defaults to UI port `5000` and API port `5174`, added root inbox redirect loading through the authenticated mailbox API, and updated local environment defaults for the release bundle.
- Explicit non-changed areas: Cloudflare Worker production deployment code and historical design docs were not reworked.
- Verification performed: ran workspace `pnpm install`, `node --check mail-server/src/index.js`, `pnpm --filter agentic-inbox-mail-server test`, `pnpm --filter @agent-mail/client typecheck`, and root `pnpm build`.
