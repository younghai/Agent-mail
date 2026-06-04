# GitHub Actions CI/CD Pipeline

**Date**: 2026-05-08
**Track**: D — M2 (GitHub Actions)
**Status**: Implemented

## Summary

Three GitHub Actions workflows added to automate typecheck, test, build, and Cloudflare Workers deployment.

## Workflows Added

### `.github/workflows/ci.yml`
Triggers on every push and pull_request. Runs:
1. `pnpm install --frozen-lockfile`
2. `pnpm typecheck`
3. `pnpm test`
4. `pnpm build` (NODE_ENV=production)

No secrets required. Safe to run on all branches and forks.

### `.github/workflows/deploy.yml`
Triggers on push to `main` and `workflow_dispatch`. Runs typecheck + test, then deploys both workers via `cloudflare/wrangler-action@v3`:
- Main worker: `wrangler deploy`
- Tail-consumer worker: `wrangler deploy --config wrangler.tail-consumer.jsonc`

Requires secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.

### `.github/workflows/preview.yml`
Triggers on `pull_request_target` (opened, synchronize, reopened). Runs typecheck + test, then uploads a versioned preview via `wrangler versions upload`. Fork PRs are excluded via `head.repo.full_name == github.repository` check to prevent secret exposure.

Requires secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.

## Required GitHub Repository Secrets

Set these in **Settings > Secrets and variables > Actions**:

| Secret | Required by | Description |
|--------|------------|-------------|
| `CLOUDFLARE_API_TOKEN` | deploy.yml, preview.yml | Cloudflare API token with Workers:Edit permission |
| `CLOUDFLARE_ACCOUNT_ID` | deploy.yml, preview.yml | Cloudflare account ID |
| `SENTRY_DSN` | (optional) wrangler secret | Set via `wrangler secret put SENTRY_DSN` post-deploy |
| `SLACK_ALERT_WEBHOOK_URL` | (optional) wrangler secret | Set via `wrangler secret put SLACK_ALERT_WEBHOOK_URL` |

Note: `SENTRY_DSN` and `SLACK_ALERT_WEBHOOK_URL` are Cloudflare Worker secrets (not GitHub secrets) — inject them with `wrangler secret put`, not via Actions.

## Recommended Branch Protection (main)

In **Settings > Branches > Add branch ruleset** for `main`:
- Require status check: `build-test` (from ci.yml) before merging
- Require branches to be up to date before merging
- Block direct pushes (require PR)

## First-Run Checklist

Before the first pipeline run succeeds:

- [ ] Add `CLOUDFLARE_API_TOKEN` to GitHub repo secrets
- [ ] Add `CLOUDFLARE_ACCOUNT_ID` to GitHub repo secrets
- [ ] Verify Cloudflare API token has `Workers Scripts:Edit` and `Workers Tail:Edit` permissions
- [ ] Confirm R2 bucket `agentic-inbox` exists in the Cloudflare account
- [ ] Confirm Durable Object migrations have been applied (run `wrangler deploy` manually once if first time)
- [ ] Enable branch protection on `main` requiring `build-test` status check

## Environment

- Node.js: 22
- pnpm: 10 (matches `packageManager: pnpm@10.32.1` in package.json)
- wrangler-action: v3
- actions/checkout: v4
- pnpm/action-setup: v4
- actions/setup-node: v4
