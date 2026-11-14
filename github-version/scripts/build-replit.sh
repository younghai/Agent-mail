#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

# Compile only. Production schema changes belong to Replit's Publish flow.
CI=true pnpm install --frozen-lockfile --reporter=append-only
STANDALONE=true REPLIT_BUILD=true pnpm --dir client exec react-router build --config vite.config.replit.ts
test -f client/build-replit/client/index.html
echo "Replit production build is ready."
