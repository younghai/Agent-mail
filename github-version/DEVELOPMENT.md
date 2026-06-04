# v1-present Agent Mail — 개발 가이드

> **대상**: 로컬 개발자 및 신규 입 개발자
> **목표**: 5분 내로 전체 서비스를 로컬에 기동하고, API를 직접 테스트할 수 있도록 안내

---

## 1. 빠른 시작

```bash
# 1. 저장소 루트에서 v1-present 폴리로 이동
cd v1-present

# 2. 환경 설정
cp .env.example .env
# .env 파일을 열어 OPENAI_API_KEY, POSTGRES_PASSWORD, LOCAL_SERVICE_TOKEN 입력

# 3. 전체 서비스 기동
docker compose up --build -d

# 4. 상태 확인 (약 20~30초 소요)
curl http://localhost:8080/ready
curl http://localhost:8000/ready
```

모두 `{"status":"ready"...}`를 반환하면 성공입니다.

---

## 2. 서비스 포트 및 접속 URL

| 서비스 | URL | 용도 |
|--------|-----|------|
| Mail Server API | http://localhost:8080/api/v1 | 이메일, 폴리, 스레드, 검색, 관리자 |
| AI Agent API | http://localhost:8000/api/v1/ai | AI 초안, SSE 챗 |
| PostgreSQL | postgresql://agentic:비밀번호@localhost:5432/agentic_inbox | 직접 쿼리 |
| Redis | redis://localhost:6379 | CLI, Pub/Sub 확인 |
| MinIO S3 API | http://localhost:9000 | 프로그램 접근 |
| MinIO Console | http://localhost:9001 | 웹 UI (minioadmin / 비밀번호) |

---

## 3. 더미 데이터 시드

```bash
cd mail-server
pnpm install
node src/seed.js
```

`bzengage@example.com` 메일박스에 7개의 샘플 이메일(한국어/영어 혼합, 스레드 포함)이 삽입됩니다.

---

## 4. 주요 API 테스트 (curl)

### 4.1 메일박스 목록

```bash
curl -H "Authorization: Bearer $LOCAL_SERVICE_TOKEN" \
  http://localhost:8080/api/v1/mailboxes
```

### 4.2 이메일 목록

```bash
curl -H "Authorization: Bearer $LOCAL_SERVICE_TOKEN" \
  "http://localhost:8080/api/v1/mailboxes/<mailboxId>/emails?folder=inbox&limit=10"
```

### 4.3 이메일 발송

```bash
curl -X POST -H "Authorization: Bearer $LOCAL_SERVICE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"to":["test@example.com"],"subject":"테스트","body_text":"안녕하세요"}' \
  http://localhost:8080/api/v1/mailboxes/<mailboxId>/emails
```

### 4.4 AI 초안 생성

```bash
curl -X POST -H "Authorization: Bearer $LOCAL_SERVICE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email_id":"<emailId>","thread_id":"<threadId>","tone":"professional"}' \
  http://localhost:8000/api/v1/mailboxes/<mailboxId>/ai/draft
```

### 4.5 AI 챗 (SSE)

```bash
curl -X POST -H "Authorization: Bearer $LOCAL_SERVICE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"이 스레드를 요약해줘","session_id":"test-session"}' \
  http://localhost:8000/api/v1/mailboxes/<mailboxId>/ai/chat
```

### 4.6 전문 검색

```bash
curl -H "Authorization: Bearer $LOCAL_SERVICE_TOKEN" \
  "http://localhost:8080/api/v1/mailboxes/<mailboxId>/search?q=견적&limit=5"
```

---

## 5. Docker 없이 개별 서비스 개발

### 5.1 PostgreSQL + Redis + MinIO만 Docker로

```bash
docker compose up -d postgres redis minio
```

### 5.2 Mail Server (Node.js) 단독 실행

```bash
cd mail-server
pnpm install
export DATABASE_URL=postgresql://agentic:agentic-local-change-me@localhost:5432/agentic_inbox
export REDIS_URL=redis://localhost:6379
export AI_AGENT_URL=http://localhost:8000
export LOCAL_SERVICE_TOKEN=local-dev-token-change-me
export PORT=8080
export CORS_ORIGINS=http://localhost:5173
node src/index.js
```

### 5.3 AI Agent (Python) 단독 실행

```bash
cd ai-agent
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export DATABASE_URL=postgresql://agentic:agentic-local-change-me@localhost:5432/agentic_inbox
export OPENAI_API_KEY=sk-...
export LOCAL_SERVICE_TOKEN=local-dev-token-change-me
uvicorn main:app --reload --port 8000
```

---

## 6. 프론트엔드 연결

v1-present에는 프론트엔드가 포함되지 않습니다. 개발 시 `v0/agent-inbox/`의 React SPA를 사용합니다.

```bash
cd v0/agent-inbox
pnpm install
```

`v0/agent-inbox/vite.config.ts` 또는 `vite.config.standalone.ts`에서 proxy 설정:

```ts
server: {
  proxy: {
    '/api': 'http://localhost:8080',
    '/agents': 'http://localhost:8000',
  }
}
```

```bash
pnpm run dev -- --port 5173
```

브라우저에서 http://localhost:5173 접속 → `bzengage@example.com` 메일박스 선택.

---

## 7. 디버깅

### 7.1 로그 확인

```bash
# 실시간 전체 로그
docker compose logs -f

# 특정 서비스만
docker compose logs -f mail-server
docker compose logs -f ai-agent

# 최근 100줄
docker compose logs --tail=100 mail-server
```

### 7.2 데이터베이스 직접 접속

```bash
# 컨테이너 낮부에서
docker compose exec postgres psql -U agentic -d agentic_inbox

# 로컬 psql 사용 (PostgreSQL 클라이언트 설치 시)
psql postgresql://agentic:agentic-local-change-me@localhost:5432/agentic_inbox
```

유용한 쿼리:

```sql
-- 메일박스 목록
SELECT id, email, name, is_active FROM mailboxes;

-- 최근 이메일 10개
SELECT id, subject, sender, is_read, created_at FROM emails ORDER BY created_at DESC LIMIT 10;

-- AI 사용량 집계
SELECT model, COUNT(*), SUM(cost_usd) FROM admin_agent_usage_events GROUP BY model;
```

### 7.3 Redis 확인

```bash
docker compose exec redis redis-cli

# 스트림 확인
XINFO STREAM email-events
XREADGROUP GROUP ai-agent-group worker-1 COUNT 5 STREAMS email-events >

# Pub/Sub 테스트
SUBSCRIBE test-channel
```

### 7.4 MinIO 확인

웹 브라우저에서 http://localhost:9001 접속.
버킷 `agentic-inbox` 내 객체(첨부파일) 확인 가능.

### 7.5 Mail Server 디버그 모드

`NODE_ENV=development`로 설정 시 SQL 쿼리가 콘솔에 출력됩니다.

```bash
docker compose exec mail-server sh -c "NODE_ENV=development node src/index.js"
```

---

## 8. 테스트

### 8.1 mail-server 테스트

```bash
cd mail-server
npm test   # package.json: node --test tests/*.test.js
```

현재 `tests/` 디렉터리 내 테스트 파일이 별도로 존재하지 않을 수 있습니다. 추가 작성이 필요합니다.

### 8.2 ai-agent 테스트

```bash
cd ai-agent
pytest tests/test_utils.py -v
```

### 8.3 통합 테스트 시나리오

1. 메일박스 생성 → 이메일 수신 웹훅 → AI 초안 자동 생성 확인
2. 스레드 조회 → AI 챗 SSE 스트리밍 확인
3. 첨부파일 업로드 → presigned URL 리다이렉트 확인
4. 전문 검색 → `tsvector` 기반 결과 확인

---

## 9. 코드 변경 후 빠르게 확인

```bash
# mail-server 코드 수정 후
docker compose up --build -d mail-server

# ai-agent 코드 수정 후
docker compose up --build -d ai-agent
```

`--build`가 없으면 기존 이미지를 재사용하므로 코드 반영이 안 됩니다. 코드 변경 시 반드시 `--build`를 포함하세요.
