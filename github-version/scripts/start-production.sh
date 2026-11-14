#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

: "${DATABASE_URL:?A production PostgreSQL database is required}"
: "${SESSION_SECRET:?SESSION_SECRET must be available to the published app}"

# A single HTTP service. No Vite, local MinIO, Redis, SMTP, or database DDL.
export NODE_ENV=production APP_ENV=production REPLIT_WEB_ENABLED=true
export RUN_MIGRATIONS=false SMTP_INBOUND_ENABLED=false
export PORT="${PORT:-5000}"
exec node mail-server/src/index.js
