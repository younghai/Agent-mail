#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example. Review secrets before production use."
fi

if command -v docker-compose >/dev/null 2>&1; then
  docker-compose up --build -d
elif docker compose version >/dev/null 2>&1; then
  docker compose up --build -d
else
  echo "Docker Compose is required for scripts/start-docker.sh." >&2
  exit 1
fi

scripts/healthcheck.sh
