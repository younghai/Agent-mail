# Agent Mail Docker Version

This package is the Docker-oriented release of Agent Mail. It mirrors the GitHub package while emphasizing server handoff and Docker Compose operation.

Agent Mail is a self-hosted email operations workspace with a React inbox UI, a Node.js Mail Server API, a Python AI Agent, PostgreSQL, Redis, and optional MinIO object storage.

## Runtime Ports

- React UI: `http://localhost:5000`
- Mail Server API: `http://localhost:5174`
- AI Agent API: `http://localhost:5100`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`
- MinIO API: `localhost:9000`
- MinIO Console: `http://localhost:9001`

## Docker Service Flow

```mermaid
flowchart TB
  browser[Browser] --> client[React Client container<br/>host :5000]
  client --> mail[Mail Server container<br/>host :5174 / container :8080]
  mail --> postgres[(PostgreSQL container<br/>host :5432)]
  mail --> redis[(Redis container<br/>host :6379)]
  mail --> minio[(MinIO container<br/>host :9000 / :9001)]
  mail --> agent[AI Agent container<br/>host :5100 / container :8000]
  mail --> smtp[SMTP / Webhook integration]
  agent --> postgres
  agent --> redis
  agent --> llm[OpenAI-compatible LLM]
```

## Mail Processing Flow

```mermaid
sequenceDiagram
  participant UI as React UI
  participant API as Mail Server
  participant DB as PostgreSQL
  participant Queue as Redis
  participant Agent as AI Agent
  participant LLM as LLM Provider

  UI->>API: Request mailbox, folder, and thread data
  API->>DB: Read emails, threads, folders, drafts, tasks
  API->>Queue: Publish mail or agent events
  API->>Agent: Request summary, timeline, or reply draft
  Agent->>DB: Load thread context
  Agent->>LLM: Generate agent output
  Agent->>DB: Save draft and usage metadata
  API->>UI: Return mail detail and agent output
```

## Quick Start

```bash
cp .env.example .env
pnpm install
pnpm build
scripts/start-docker.sh
```

Open the UI:

```text
http://localhost:5000/
```

Run health checks:

```bash
scripts/healthcheck.sh
```

## Configuration

Update `.env` before production use:

- `LOCAL_SERVICE_TOKEN`
- `ADMIN_EMAILS`
- `APP_DOMAINS`
- `WEBHOOK_SECRET`
- `OPENAI_API_KEY`
- `POSTGRES_PASSWORD`
- `S3_ACCESS_KEY`
- `S3_SECRET_KEY`

Do not commit `.env`.

## API Authentication

Most API routes require:

```text
Authorization: Bearer $LOCAL_SERVICE_TOKEN
```

Readiness routes:

```bash
curl http://localhost:5174/ready
curl http://localhost:5100/ready
```

## Update Contents

- English Docker README prepared for server handoff.
- Mermaid service architecture and mail processing diagrams added.
- Runtime ports, startup commands, configuration, and authentication documented.
- Docker Compose package kept synchronized with the GitHub package.

## Verification Commands

```bash
bash -n scripts/start-docker.sh scripts/start-local.sh scripts/healthcheck.sh
docker-compose config
scripts/healthcheck.sh
```
