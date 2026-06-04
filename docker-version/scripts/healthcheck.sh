#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

mail_url="${MAIL_SERVER_URL:-http://localhost:5174}"
agent_url="${AI_AGENT_HEALTH_URL:-http://localhost:5100}"

curl -fsS "$mail_url/ready" >/dev/null
curl -fsS "$agent_url/ready" >/dev/null

if [ -f .env ]; then
  set -a
  . ./.env
  set +a
  if [ -n "${LOCAL_SERVICE_TOKEN:-}" ]; then
    curl -fsS -H "Authorization: Bearer ${LOCAL_SERVICE_TOKEN}" "$mail_url/api/v1/mailboxes" >/dev/null
  fi
fi

echo "OK: Mail Server ready at $mail_url"
echo "OK: AI Agent ready at $agent_url"
