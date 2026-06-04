# 03-Detailed Design — Agent Mail (v1-present)

## API 명세 (Mail Server :8080)

### 인증
- `Authorization: Bearer <LOCAL_SERVICE_TOKEN>`
- `x-admin-user-email` / `cf-access-authenticated-user-email` (Admin RBAC)

### 주요 엔드포인트

| Method | Path | Auth | 설명 |
|--------|------|------|------|
| GET | `/api/v1/mailboxes` | Bearer | 메일박스 목록 |
| POST | `/api/v1/mailboxes` | Bearer | 메일박스 생성 |
| GET | `/api/v1/mailboxes/:id/emails` | Bearer | 이메일 목록 (폴리, 스레드 필터) |
| POST | `/api/v1/mailboxes/:id/emails` | Bearer | 이메일 발송 |
| GET | `/api/v1/mailboxes/:id/threads/:tid` | Bearer | 스레드 조회 |
| POST | `/api/v1/mailboxes/:id/drafts` | Bearer | 초안 저장/수정 |
| GET | `/api/v1/mailboxes/:id/search` | Bearer | 전문 검색 (`?q=`) |
| POST | `/api/v1/webhooks/email` | Webhook Secret | 수신 이메일 |
| GET | `/api/v1/admin/overview` | Admin | 대시보드 집계 |
| GET | `/api/v1/admin/clients` | Admin | 고객 목록 |
| POST | `/api/v1/admin/tasks` | Manager+ | 작업 생성 |

### AI Agent (:8000)

| Method | Path | 설명 |
|--------|------|------|
| POST | `/api/v1/mailboxes/:id/ai/draft` | 초안 생성 |
| POST | `/api/v1/mailboxes/:id/ai/chat` | SSE 스트리밍 챗 |

## 데이터베이스 스키마

### 핵심 테이블

```sql
-- 메일박스
CREATE TABLE mailboxes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  domain TEXT,
  settings JSONB DEFAULT '{}',
  ai_provider TEXT DEFAULT 'openai',
  ai_model TEXT DEFAULT 'gpt-4o-mini',
  ai_system_prompt TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 폴리
CREATE TABLE folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mailbox_id UUID REFERENCES mailboxes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  is_system BOOLEAN DEFAULT false,
  is_deletable BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0
);

-- 이메일
CREATE TABLE emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mailbox_id UUID REFERENCES mailboxes(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES folders(id),
  thread_id UUID,
  subject TEXT,
  sender TEXT,
  recipient TEXT[],
  cc TEXT[],
  bcc TEXT[],
  body_text TEXT,
  body_html TEXT,
  message_id TEXT,
  in_reply_to TEXT,
  email_references TEXT[],
  raw_headers JSONB,
  is_read BOOLEAN DEFAULT false,
  is_starred BOOLEAN DEFAULT false,
  is_draft BOOLEAN DEFAULT false,
  search_vector TSVECTOR,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 첨부파일 메타데이터
CREATE TABLE attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id UUID REFERENCES emails(id) ON DELETE CASCADE,
  filename TEXT,
  mimetype TEXT,
  size_bytes INT,
  storage_key TEXT,
  content_id TEXT,
  disposition TEXT
);

-- AI 대화
CREATE TABLE ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mailbox_id UUID REFERENCES mailboxes(id),
  session_id TEXT,
  role TEXT CHECK (role IN ('user','assistant','system')),
  content TEXT,
  tool_calls JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 관리자 CRM: 고객
CREATE TABLE admin_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  company TEXT,
  email TEXT,
  owner TEXT,
  status TEXT,
  tags JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 관리자 CRM: 작업
CREATE TABLE admin_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES admin_clients(id),
  title TEXT,
  type TEXT,
  status TEXT,
  priority TEXT,
  owner TEXT,
  due_date DATE,
  completion INT DEFAULT 0,
  mailbox_id UUID,
  request_email_id UUID,
  issue TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI 사용량
CREATE TABLE admin_agent_usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT,
  operation TEXT,
  model TEXT,
  input_tokens INT,
  output_tokens INT,
  cost_usd NUMERIC(10,6),
  latency_ms INT,
  status TEXT,
  error_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 감사 로그
CREATE TABLE admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT,
  entity_id UUID,
  action TEXT,
  actor_email TEXT,
  actor_role TEXT,
  before_json JSONB,
  after_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 인덱스

```sql
-- 전문 검색 GIN 인덱스
CREATE INDEX idx_emails_search ON emails USING GIN(search_vector);

-- 스레드/폴리 조회
CREATE INDEX idx_emails_mailbox_folder ON emails(mailbox_id, folder_id, created_at DESC);
CREATE INDEX idx_emails_thread ON emails(thread_id, created_at ASC);

-- 외래키 인덱스
CREATE INDEX idx_attachments_email ON attachments(email_id);
CREATE INDEX idx_tasks_client ON admin_tasks(client_id);
CREATE INDEX idx_usage_created ON admin_agent_usage_events(created_at);
```

## 주요 모듈 상세

### mail-server/src/index.js
- Express 앱 초기화, middleware (CORS, auth, async wrapper)
- 라우트 등록: config, admin, mailboxes, emails, drafts, folders, search, webhooks, health
- `asyncHandler` 패치: Express route handler의 비동기 예외를 global error middleware로 전달

### mail-server/src/db.js
- `pg.Pool` 관리, `query()` 래퍼 (개발 환경에서 SQL 로깅)
- `initDb()`: `RUN_MIGRATIONS=true` 시 `mail-server/migrations/*.sql`을 순서대로 적용하고, Docker entrypoint가 이미 적용한 기존 스키마는 `schema_migrations`에 baseline 처리

### mail-server/src/redis.js
- `ioredis` lazy connection, retry strategy
- `publishEmailEvent()`: `XADD email-events * event new_email ...`

### ai-agent/main.py
- Lifespan: Redis consumer group 백그라운드 태스크 시작
- `create_draft()`: thread context 로드 → prompt injection check → OpenAI → draft save
- `chat()`: SSE streaming, session history 관리
- Rate limiting: mailbox별 sliding window (Redis)
