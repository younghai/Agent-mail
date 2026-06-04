#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example. Review local database and Redis settings."
fi

mkdir -p .runtime

if ! command -v pnpm >/dev/null 2>&1; then
  corepack enable
  corepack prepare pnpm@10.32.1 --activate
fi

if [ ! -d node_modules ] || [ ! -d mail-server/node_modules ] || [ ! -d client/node_modules ]; then
  if [ -f pnpm-lock.yaml ]; then
    pnpm install --frozen-lockfile
  else
    pnpm install
  fi
fi

if [ ! -d ai-agent/.venv ]; then
  python3 -m venv ai-agent/.venv
  ai-agent/.venv/bin/python -m pip install --upgrade pip
  ai-agent/.venv/bin/python -m pip install -r ai-agent/requirements.txt
fi

set -a
. ./.env
set +a

mail_port="${API_PORT:-${PORT:-5174}}"
client_port="${CLIENT_PORT:-5000}"
agent_port="${AI_AGENT_PORT:-5100}"
local_service_token="${LOCAL_SERVICE_TOKEN:-local-dev-token-change-me}"
client_origin="http://localhost:${client_port},http://127.0.0.1:${client_port}"
cors_origins="${CORS_ORIGINS:-${client_origin}}"

MAIL_SERVER_URL="http://localhost:${mail_port}" \
AI_AGENT_HEALTH_URL="http://localhost:${agent_port}" \
PORT="$mail_port" \
AI_AGENT_URL="http://127.0.0.1:${agent_port}" \
CORS_ORIGINS="$cors_origins" \
nohup pnpm --dir mail-server run dev > .runtime/mail-server.log 2>&1 &

APP_ENV="${APP_ENV:-local}" \
REDIS_URL="${REDIS_URL:-redis://127.0.0.1:6379}" \
nohup ai-agent/.venv/bin/python -m uvicorn main:app --app-dir ai-agent --host 127.0.0.1 --port "$agent_port" > .runtime/ai-agent.log 2>&1 &

VITE_API_BASE_URL="http://localhost:${mail_port}" \
VITE_LOCAL_SERVICE_TOKEN="$local_service_token" \
CLIENT_PORT="$client_port" \
nohup pnpm --dir client run dev --host 0.0.0.0 --port "$client_port" > .runtime/client.log 2>&1 &

sleep 3
MAIL_SERVER_URL="http://localhost:${mail_port}" AI_AGENT_HEALTH_URL="http://localhost:${agent_port}" scripts/healthcheck.sh
curl -fsS "http://localhost:${client_port}/" >/dev/null

echo "Logs:"
echo "  .runtime/mail-server.log"
echo "  .runtime/ai-agent.log"
echo "  .runtime/client.log"
echo "UI: http://localhost:${client_port}"
