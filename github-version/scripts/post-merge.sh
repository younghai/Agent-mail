#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

command -v pnpm >/dev/null
command -v uv >/dev/null
command -v python >/dev/null

echo "Installing Node dependencies from the committed workspace lockfile..."
CI=true pnpm --dir "$ROOT/github-version" install --frozen-lockfile --reporter=append-only

echo "Synchronizing Python dependencies in Replit's existing package environment..."
# Do not create a separate .venv or build the root placeholder Python package.
UV_PROJECT_ENVIRONMENT="$ROOT/.pythonlibs" uv sync \
  --locked --inexact --no-install-project --python "$(command -v python)"

"$ROOT/.pythonlibs/bin/python" -c \
  'import fastapi, uvicorn, asyncpg, redis, openai; print("Python service dependencies are available.")'

# Workflow reconciliation restarts Agent Mail. Its existing launcher owns
# migrations and local-service startup; do not run a second copy here.
echo "Dependency setup complete; Agent Mail startup will apply pending migrations."
