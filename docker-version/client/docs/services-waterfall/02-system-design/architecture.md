# 2. 시스템 설계 (System Design)

> 워터폴 2단계 — 요구사항을 만족하는 시스템의 상위 구조를 정의한다. 컴포넌트 간 책임 경계, 데이터 흐름, 외부 통합점을 다룬다.

---

## 2.1 시스템 컨텍스트

```
                    ┌─────────────────────────────────────┐
                    │  운영자 (브라우저 — React SPA)        │
                    └───────────────┬─────────────────────┘
                                    │ HTTPS
                                    ▼
                    ┌─────────────────────────────────────┐
                    │        Vite Dev Server              │
                    │    (proxy: /api → localhost:8080)   │
                    └───────────────┬─────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
        ▼                           ▼                           ▼
┌───────────────┐        ┌─────────────────┐        ┌─────────────────┐
│  Mail Server  │◄──────►│   AI Agent      │        │  PostgreSQL     │
│  (Node.js)    │  HTTP  │   (Python)      │        │   (Primary)     │
│  :8080        │        │   :8000         │        │   :5432         │
└───────┬───────┘        └─────────────────┘        └─────────────────┘
        │
        │ reads/writes
        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           PostgreSQL                                 │
│  mailboxes │ folders │ emails │ attachments │ ai_conversations      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2.2 컴포넌트 구성

### Mail Server (`services/mail-server/`)

**기술**: Node.js 22 + Express + `pg` (node-postgres)
**포트**: 8080
**책임**:
- 모든 `/api/v1/*` REST 엔드포인트 제공
- PostgreSQL CRUD 연산
- AI Agent 호출 (auto-draft 트리거)

**주요 모듈**:
| 파일 | 역할 |
|------|------|
| `src/index.js` | Express 라우터, API 핸들러, 에러 처리 |
| `src/db.js` | PostgreSQL Pool 연결, 쿼리 유틸리티 |
| `src/seed.js` | 개발용 더미 데이터 삽입 |

### AI Agent (`services/ai-agent/`)

**기술**: Python 3.9+ + FastAPI + OpenAI SDK + `psycopg2-binary`
**포트**: 8000
**책임**:
- 이메일 자동 답변 초안 생성 (`/ai/draft`)
- 실시간 채팅 스트리밍 (`/ai/chat`, SSE)
- 메일박스별 프롬프트 로드

**주요 모듈**:
| 파일 | 역할 |
|------|------|
| `main.py` | FastAPI 앱, 라우터, OpenAI 호출, DB 조회 |

### 데이터베이스 (PostgreSQL)

**버전**: 16 (Alpine Docker 이미지)
**스키마**: `migrations/001_initial.sql`
**핵심 특성**:
- `emails` 테이블: `tsvector` + GIN 인덱스로 Full-Text Search
- `search_vector` 자동 업데이트 트리거
- 기본 메일박스 + 6개 시스템 폼더 시드 데이터 포함

---

## 2.3 데이터 흐름

### 이메일 수신 → Draft 생성 (v1 현재: 수동 트리거)

```
[Client Browser]
      │
      ▼ POST /api/v1/mailboxes/:id/test-autodraft
[Mail Server :8080]
      │
      ├──► PostgreSQL (email 조회)
      │
      └──► AI Agent :8000 /ai/draft
                │
                ├──► PostgreSQL (thread context, prompt)
                ├──► OpenAI API (gpt-4o-mini)
                └──► PostgreSQL (DRAFT 저장)
```

### 사용자 채팅 → AI 스트리밍 응답

```
[Client Browser]
      │
      ▼ SSE POST /api/v1/mailboxes/:id/ai/chat
[AI Agent :8000]
      │
      ├──► PostgreSQL (prompt 로드)
      ├──► OpenAI API (stream)
      └──► SSE chunks → Browser
```

---

## 2.4 배포 아키텍처

### 로컬 개발 (Docker Compose)

```
docker-compose.yml
├── postgres:16-alpine  (localhost:5432)
├── redis:7-alpine      (localhost:6379)
├── minio/minio         (localhost:9000)
├── mail-server         (localhost:8080)
└── ai-agent            (localhost:8000)
```

### 프로덕션 (Kubernetes) — 계획

```
K8s Cluster
├── Ingress (TLS termination)
├── Mail Server Deployment (3 replicas, HPA)
├── AI Agent Deployment (2 replicas, HPA)
├── PostgreSQL StatefulSet (primary + replica)
└── Redis Sentinel (3 pods)
```
