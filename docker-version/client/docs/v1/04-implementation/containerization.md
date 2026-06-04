# v1 Containerization Guide

## 1. 서비스별 Dockerfile

### 1.1 Mail Server Service

```dockerfile
# services/mail-server/Dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

EXPOSE 8080
CMD ["node", "dist/main.js"]
```

### 1.2 AI Agent Service

```dockerfile
# services/ai-agent/Dockerfile
FROM python:3.12-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y gcc && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

FROM python:3.12-slim AS runner
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
COPY --from=builder /root/.local /root/.local
COPY . .
ENV PATH=/root/.local/bin:$PATH

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 1.3 Frontend (React)

```dockerfile
# services/frontend/Dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 1.4 User Service

```dockerfile
# services/user-service/Dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 8081
CMD ["node", "dist/main.js"]
```

## 2. Docker Compose (개발 환경)

```yaml
# docker-compose.yml
version: "3.8"

services:
  # --- Infrastructure ---
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: agentic
      POSTGRES_PASSWORD: agentic
      POSTGRES_DB: agentic_inbox
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./migrations:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U agentic"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

  minio:
    image: minio/minio:latest
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data
    command: server /data --console-address ":9001"

  # --- Application Services ---
  mail-server:
    build: ./services/mail-server
    ports:
      - "8080:8080"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://agentic:agentic@postgres:5432/agentic_inbox
      - REDIS_URL=redis://redis:6379
      - S3_ENDPOINT=http://minio:9000
      - S3_ACCESS_KEY=minioadmin
      - S3_SECRET_KEY=minioadmin
      - S3_BUCKET=agentic-inbox
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started
      minio:
        condition: service_started
    volumes:
      - ./services/mail-server:/app
      - /app/node_modules

  ai-agent:
    build: ./services/ai-agent
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://agentic:agentic@postgres:5432/agentic_inbox
      - REDIS_URL=redis://redis:6379
      - MAIL_SERVER_URL=http://mail-server:8080
      - MAIL_SERVER_API_KEY=dev-key
      - OPENAI_API_KEY=${OPENAI_API_KEY:-}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY:-}
      - OLLAMA_BASE_URL=http://ollama:11434
    depends_on:
      - postgres
      - redis
      - mail-server
    volumes:
      - ./services/ai-agent:/app

  user-service:
    build: ./services/user-service
    ports:
      - "8081:8081"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://agentic:agentic@postgres:5432/agentic_inbox
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=dev-jwt-secret-change-in-production
      - OAUTH_GOOGLE_CLIENT_ID=${OAUTH_GOOGLE_CLIENT_ID:-}
      - OAUTH_GOOGLE_CLIENT_SECRET=${OAUTH_GOOGLE_CLIENT_SECRET:-}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started

  frontend:
    build: ./services/frontend
    ports:
      - "3000:80"
    environment:
      - VITE_API_URL=http://localhost:8080/api/v1
    depends_on:
      - mail-server
      - user-service

  # --- Optional: Ollama for local AI ---
  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    profiles:
      - ollama

  # --- SMTP Inbound ---
  haraka:
    build: ./services/haraka
    ports:
      - "25:25"
      - "587:587"
    environment:
      - MAIL_SERVER_WEBHOOK=http://mail-server:8080/api/v1/webhooks/email
      - WEBHOOK_SECRET=webhook-secret
    depends_on:
      - mail-server

volumes:
  postgres_data:
  redis_data:
  minio_data:
  ollama_data:
```

## 3. Multi-stage Build 최적화

| 서비스 | Builder Stage | Runner Stage | 최종 크기 |
|--------|---------------|--------------|-----------|
| Mail Server | `node:22` | `node:22-alpine` | ~180MB |
| AI Agent | `python:3.12-slim` | `python:3.12-slim` | ~450MB |
| Frontend | `node:22` | `nginx:alpine` | ~25MB |
| User Service | `node:22` | `node:22-alpine` | ~170MB |

## 4. 환경별 설정

### 4.1 개발 (Development)

```bash
docker-compose up --build
```

- Hot reload 활성화
- 볼륨 마운트로 코드 변경 즉시 반영
- 로그 레벨: `debug`

### 4.2 스테이징 (Staging)

```bash
docker-compose -f docker-compose.yml -f docker-compose.staging.yml up --build
```

- 프로덕션과 동일한 설정
- 테스트 데이터로 시드
- 로그 레벨: `info`

### 4.3 프로덕션 (Production)

- Kubernetes 배포 (별도 문서 참조)
- 이미지 Registry: ECR / GCR / Docker Hub
- 로그 레벨: `warn`

## 5. Health Check

각 서비스는 `/health` 엔드포인트를 제공합니다:

```json
// Mail Server
{
  "status": "healthy",
  "checks": {
    "database": "ok",
    "redis": "ok",
    "s3": "ok"
  },
  "timestamp": "2026-04-15T09:30:00Z"
}

// AI Agent
{
  "status": "healthy",
  "checks": {
    "database": "ok",
    "redis": "ok",
    "ai_provider": "ok"
  },
  "timestamp": "2026-04-15T09:30:00Z"
}
```

## 6. 로컬 개발 워크플로우

```bash
# 1. Clone & Install
git clone <repo>
cd agentic-inbox-v1

# 2. 환경 변수 설정
cp .env.example .env
# .env 파일 편집 (API keys 등)

# 3. 인프라 시작
docker-compose up -d postgres redis minio

# 4. 마이그레이션
npm run migrate

# 5. 서비스별 개발 (각 터미널에서)
# Terminal 1: Mail Server
cd services/mail-server && npm run dev

# Terminal 2: AI Agent
cd services/ai-agent && uvicorn main:app --reload

# Terminal 3: Frontend
cd services/frontend && npm run dev

# 6. 전체 스택 (선택)
docker-compose up --build
```
