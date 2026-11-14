# 03-Detailed Design — Agentic Inbox (v0)

## API 명세

### 인증
- 프로덕션: `cf-access-jwt-assertion`의 서명·issuer·audience·만료를 검증하고 JWT의 `email`로 사용자 식별 (이메일 헤더는 신뢰하지 않음)
- 개발: `import.meta.env.DEV` 시 Access 스킵

### 주요 엔드포인트

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/v1/config` | 허용 도메인/이메일 |
| GET/POST | `/api/v1/mailboxes/*` | 메일박스 CRUD |
| GET/POST | `/api/v1/mailboxes/:id/emails/*` | 이메일 관리 |
| GET | `/api/v1/mailboxes/:id/threads/:tid` | 스레드 조회 |
| POST | `/api/v1/mailboxes/:id/drafts` | 초안 저장 |
| GET | `/api/v1/mailboxes/:id/search` | 검색 |
| POST | `/api/v1/webhooks/email` | 수신 이메일 (Worker `email` 핸들러) |
| GET | `/api/v1/admin/*` | CRM 대시보드 |
| GET | `/mcp` | MCP 서버 (SSE) |
| WS | `/agents/*` | EmailAgent WebSocket |

### Workers & DO 바인딩

```jsonc
// wrangler.jsonc
{
  "durable_objects": {
    "bindings": [
      { "name": "MAILBOX", "class_name": "MailboxDO" },
      { "name": "EMAIL_AGENT", "class_name": "EmailAgent" },
      { "name": "EMAIL_MCP", "class_name": "EmailMCP" },
      { "name": "ADMIN", "class_name": "AdminDO" }
    ]
  },
  "r2_buckets": [{ "binding": "BUCKET", "bucket_name": "agentic-inbox" }],
  "ai": { "binding": "AI" },
  "send_email": [{ "name": "EMAIL", "remote": true }]
}
```

## 데이터베이스 스키마 (MailboxDO SQLite)

```sql
-- Drizzle ORM 기준 (workers/db/schema.ts)
CREATE TABLE folders (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  is_system INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE emails (
  id TEXT PRIMARY KEY,
  folder_id TEXT REFERENCES folders(id),
  thread_id TEXT,
  subject TEXT,
  sender TEXT,
  recipient TEXT,
  cc TEXT,
  bcc TEXT,
  body_text TEXT,
  body_html TEXT,
  message_id TEXT,
  in_reply_to TEXT,
  email_references TEXT,
  raw_headers TEXT,
  is_read INTEGER DEFAULT 0,
  is_starred INTEGER DEFAULT 0,
  is_draft INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE attachments (
  id TEXT PRIMARY KEY,
  email_id TEXT REFERENCES emails(id),
  filename TEXT,
  mimetype TEXT,
  size_bytes INTEGER,
  storage_key TEXT,
  content_id TEXT,
  disposition TEXT
);
```

## 주요 모듈 상세

### workers/app.ts
- Hono 앱 생성, Access JWT 미들웨어
- `/mcp` → EmailMCP 핸들러
- `/api/v1/*` → REST API 라우트
- `/agents/*` → `routeAgentRequest()` (WebSocket)
- `*` → React Router SSR
- `email` 핸들러 → `receiveEmail()`

### workers/durableObject/index.ts (MailboxDO)
- Drizzle ORM으로 SQLite 스키마 관리
- `applyMigrations()`로 자동 마이그레이션
- 메서드: `getEmails`, `createEmail`, `searchEmails`, `getThreadEmails`, `markThreadRead` 등

### workers/agent/index.ts (EmailAgent)
- `AIChatAgent` 상속
- 모델: `createWorkersAI(env.AI)` → `@cf/moonshotai/kimi-k2.5`
- 9개 툴: `list_emails`, `get_email`, `get_thread`, `search_emails`, `draft_reply`, `draft_email`, `mark_email_read`, `move_email`, `discard_draft`
- `handleNewEmail()`: 수신 이메일 → thread context → AI 초안 생성

### workers/mcp/index.ts (EmailMCP)
- `McpAgent` 상속
- 툴: `list_mailboxes`, `list_emails`, `get_email`, `get_thread`, `search_emails`, `draft_reply`, `draft_email`, `update_draft`, `delete_email`, `send_reply`, `send_email`, `mark_email_read`, `move_email`

### workers/admin/index.ts (AdminDO)
- 테이블: `clients`, `tasks`, `task_events`, `agent_usage_events`, `audit_logs`
- 역할 기반 접근: `ADMIN_EMAILS`로 write 권한 제어
