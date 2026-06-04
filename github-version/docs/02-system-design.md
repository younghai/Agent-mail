# 02-System Design — Agent Mail (v1-present)

## 아키텍처 개요

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│  Mail       │────▶│  AI Agent   │
│  (React SPA)│     │  Server     │     │  (FastAPI)  │
│             │◀────│  :8080      │◀────│  :8000      │
└─────────────┘     └──────┬──────┘     └──────┬──────┘
                           │                    │
              ┌────────────┴────────────────────┤
              ▼                                 ▼
      ┌──────────────┐                ┌──────────────┐
      │  PostgreSQL  │                │    Redis     │
      │   (data)     │                │   (events)   │
      └──────────────┘                └──────────────┘
              │
              ▼
      ┌──────────────┐
      │    MinIO     │
      │ (attachments)│
      └──────────────┘
```

## 컴포넌트 정의

| 컴포넌트 | 기술 | 역할 |
|----------|------|------|
| Mail Server | Node.js 22 + Express | REST API Gateway, Admin CRUD, 이메일/폴리/스레드 관리 |
| AI Agent | Python 3.12 + FastAPI | OpenAI 연동, SSE 챗, Redis Stream 소비자 |
| PostgreSQL | 16 Alpine | 관계형 데이터 저장 (emails, folders, tasks, usage) |
| Redis | 7 Alpine | 이벤트 스트림 (`email-events`), 캐시 |
| MinIO | latest | S3 호환 오브젝트 스토리지 (첨부파일 blob) |

## 데이터 흐름

### Flow 1: 수신 이메일 → AI 초안 (비동기)

```
[Email Webhook] → Mail Server (insert DB)
                          ↓
                   XADD email-events
                          ↓
                   AI Agent (XREADGROUP)
                          ↓
                   OpenAI API (draft generation)
                          ↓
                   INSERT emails (is_draft=true)
```

### Flow 2: 사용자 AI 챗 (동기)

```
[User] → POST /ai/chat → AI Agent
                              ↓
                       Load thread_context (PostgreSQL)
                              ↓
                       OpenAI SSE streaming
                              ↓
                       Persist turn (ai_conversations)
```

### Flow 3: 첨부파일

```
[Upload] → Mail Server → MinIO (putObject)
                              ↓
                       metadata → PostgreSQL (attachments)
[Download] → GET /attachments/:id → 302 presigned URL → MinIO
```

## 기술 스택

| 계층 | 기술 | 선택 이유 |
|------|------|-----------|
| API (Mail) | Express 4.x | Node.js 생태계, 비동기 I/O, 개발 속도 |
| API (AI) | FastAPI | Python AI 라이브러리, 자동 OpenAPI 문서, SSE 지원 |
| DB | PostgreSQL 16 | ACID, JSONB, TSVECTOR 풀텍스트 검색 |
| Cache/Event | Redis | Stream (consumer group), Pub/Sub, 경량 |
| Storage | MinIO | S3 API 호환, 로컬/프로덕션 동일 인터페이스 |
| AI | OpenAI gpt-4o-mini | 비용 대비 성능, Function Calling |
