#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

: "${DATABASE_URL:?The PostgreSQL connection is required}"
: "${SESSION_SECRET:?The workspace session secret is required}"

# Keep credentials server-side; Vite authenticates proxied development requests.
export LOCAL_SERVICE_TOKEN="$SESSION_SECRET"
export MINIO_ROOT_USER="agent-mail"
export MINIO_ROOT_PASSWORD="$SESSION_SECRET"
export S3_ACCESS_KEY="$MINIO_ROOT_USER"
export S3_SECRET_KEY="$MINIO_ROOT_PASSWORD"
export S3_ENDPOINT="http://127.0.0.1:9000"
export S3_BUCKET="agentic-inbox"
export REDIS_URL="redis://127.0.0.1:6379"
export APP_ENV=local NODE_ENV=development RUN_MIGRATIONS=true
export AI_AGENT_URL="http://127.0.0.1:5100"
export VITE_API_BASE_URL="http://127.0.0.1:5174"
export CORS_ORIGINS="http://localhost:5000,http://127.0.0.1:5000"
export CLIENT_PORT=5000 STANDALONE=true
unset VITE_LOCAL_SERVICE_TOKEN

mkdir -p .runtime/redis .runtime/minio
pids=()
cleanup() {
  trap - EXIT INT TERM
  kill "${pids[@]}" 2>/dev/null || true
  wait "${pids[@]}" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

redis-server --bind 127.0.0.1 --port 6379 --dir "$PWD/.runtime/redis" --appendonly yes &
pids+=("$!")
minio server "$PWD/.runtime/minio" --quiet --address 127.0.0.1:9000 --console-address 127.0.0.1:9001 &
pids+=("$!")

for attempt in {1..30}; do
  if redis-cli ping >/dev/null 2>&1 && curl -fsS http://127.0.0.1:9000/minio/health/live >/dev/null 2>&1; then
    break
  fi
  sleep 1
done
redis-cli ping >/dev/null
curl -fsS http://127.0.0.1:9000/minio/health/live >/dev/null

pnpm --dir mail-server run migrate
(cd mail-server && node --input-type=module -e 'import {ensureBucket} from "./src/storage.js"; await ensureBucket();')
RUN_MIGRATIONS=false HOST=127.0.0.1 PORT=5174 pnpm --dir mail-server run start &
pids+=("$!")
python -m uvicorn main:app --app-dir ai-agent --host 127.0.0.1 --port 5100 &
pids+=("$!")
pnpm --dir client run dev --host 0.0.0.0 --port 5000 &
pids+=("$!")

if [ -z "${OPENAI_API_KEY:-}" ]; then
  echo "OPENAI_API_KEY is not configured: AI generation is unavailable."
fi
wait -n "${pids[@]}"
echo "A service stopped; shutting down the development stack." >&2
exit 1
