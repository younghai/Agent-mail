# Scope

- Folder: `using mail_AI/v0/agent-inbox`
- User journey or operational reason: keep the `v0` package workflow aligned with the workspace-wide `pnpm` standard so installs reuse the shared store instead of recreating isolated `npm` trees

## Applied Changes

- Added `packageManager: pnpm@10.32.1`
- Added local `.npmrc` pointing at the shared `personal_project/.pnpm-store`
- Switched script chaining from `npm run` to `pnpm run` where this package shells back into itself
- Planned lockfile migration from `package-lock.json` to `pnpm-lock.yaml`

## Explicit Non-Changed Areas

- No `v1-present` or `v1-new` source files were modified by this change log entry
- No product behavior or UX flow was intentionally changed

## Verification Performed

- `pnpm install` completed at the package root
- `pnpm build` completed at the package root
