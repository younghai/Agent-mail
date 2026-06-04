# v1 Database Schema

## 1. 설계 원칙

- **PostgreSQL 15+** 사용
- **UUID v7**를 기본 키로 사용 (시간 기반 정렬 가능)
- **JSONB**로 유연한 메타데이터 저장
- **파티셔닝**으로 대용량 이메일 테이블 관리 (월간/메일박스별)
- **전문검색 (Full-Text Search)** 내장 지원 (`tsvector`)

## 2. 테이블 정의

### 2.1 `users`

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255),
    avatar_url TEXT,
    oauth_provider VARCHAR(50),  -- 'google', 'github', 'oidc'
    oauth_subject VARCHAR(255),
    role VARCHAR(50) NOT NULL DEFAULT 'user',  -- 'superadmin', 'admin', 'user', 'viewer'
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_oauth ON users(oauth_provider, oauth_subject);
```

### 2.2 `mailboxes`

```sql
CREATE TABLE mailboxes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    domain VARCHAR(255) NOT NULL,
    settings JSONB DEFAULT '{}',
    -- AI 설정
    ai_provider VARCHAR(50) DEFAULT 'openai',  -- 'openai', 'anthropic', 'ollama'
    ai_model VARCHAR(100) DEFAULT 'gpt-4o',
    ai_system_prompt TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_mailboxes_owner ON mailboxes(owner_id);
CREATE INDEX idx_mailboxes_domain ON mailboxes(domain);
CREATE INDEX idx_mailboxes_active ON mailboxes(is_active) WHERE is_active = true;
```

### 2.3 `folders`

```sql
CREATE TABLE folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mailbox_id UUID NOT NULL REFERENCES mailboxes(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,  -- 'inbox', 'sent', 'trash', 'archive', 'spam', 'draft'
    is_system BOOLEAN NOT NULL DEFAULT false,
    is_deletable BOOLEAN NOT NULL DEFAULT true,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(mailbox_id, slug)
);

CREATE INDEX idx_folders_mailbox ON folders(mailbox_id);
```

### 2.4 `emails` (파티셔닝)

```sql
CREATE TABLE emails (
    id UUID NOT NULL,
    mailbox_id UUID NOT NULL REFERENCES mailboxes(id) ON DELETE CASCADE,
    folder_id UUID NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
    thread_id UUID,

    -- Envelope
    subject TEXT,
    sender VARCHAR(255) NOT NULL,
    sender_name VARCHAR(255),
    recipient TEXT NOT NULL,
    cc TEXT,
    bcc TEXT,

    -- Content
    body_text TEXT,
    body_html TEXT,

    -- Headers
    message_id VARCHAR(500),
    in_reply_to VARCHAR(500),
    references JSONB,
    raw_headers JSONB,

    -- Flags
    is_read BOOLEAN NOT NULL DEFAULT false,
    is_starred BOOLEAN NOT NULL DEFAULT false,
    is_draft BOOLEAN NOT NULL DEFAULT false,

    -- Search
    search_vector TSVECTOR,

    -- Timestamps
    email_date TIMESTAMPTZ NOT NULL,  -- 이메일 헤더의 Date
    received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    PRIMARY KEY (id, received_at)
) PARTITION BY RANGE (received_at);

-- 월간 파티션 생성 예시
CREATE TABLE emails_2026_04 PARTITION OF emails
    FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
CREATE TABLE emails_2026_05 PARTITION OF emails
    FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');

-- 인덱스
CREATE INDEX idx_emails_mailbox_folder ON emails(mailbox_id, folder_id, received_at DESC);
CREATE INDEX idx_emails_thread ON emails(thread_id, received_at DESC);
CREATE INDEX idx_emails_sender ON emails(sender);
CREATE INDEX idx_emails_search ON emails USING GIN(search_vector);

-- Full-text search 트리거
CREATE OR REPLACE FUNCTION emails_search_vector_update() RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('simple', COALESCE(NEW.subject, '')), 'A') ||
        setweight(to_tsvector('simple', COALESCE(NEW.sender_name, '')), 'B') ||
        setweight(to_tsvector('simple', COALESCE(NEW.body_text, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER emails_search_vector_trigger
    BEFORE INSERT OR UPDATE ON emails
    FOR EACH ROW EXECUTE FUNCTION emails_search_vector_update();
```

### 2.5 `attachments`

```sql
CREATE TABLE attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email_id UUID NOT NULL,
    email_received_at TIMESTAMPTZ NOT NULL,
    filename VARCHAR(500) NOT NULL,
    mimetype VARCHAR(255) NOT NULL,
    size_bytes BIGINT NOT NULL,
    storage_key VARCHAR(500) NOT NULL,  -- S3/MinIO object key
    content_id VARCHAR(500),
    disposition VARCHAR(50) DEFAULT 'attachment',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    FOREIGN KEY (email_id, email_received_at) REFERENCES emails(id, received_at) ON DELETE CASCADE
);

CREATE INDEX idx_attachments_email ON attachments(email_id);
```

### 2.6 `threads`

```sql
CREATE TABLE threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mailbox_id UUID NOT NULL REFERENCES mailboxes(id) ON DELETE CASCADE,
    subject TEXT,
    participants JSONB NOT NULL DEFAULT '[]',
    email_count INT NOT NULL DEFAULT 0,
    last_email_at TIMESTAMPTZ,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_threads_mailbox ON threads(mailbox_id, last_email_at DESC);
CREATE INDEX idx_threads_unread ON threads(mailbox_id, is_read) WHERE is_read = false;
```

### 2.7 `ai_conversations`

```sql
CREATE TABLE ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mailbox_id UUID NOT NULL REFERENCES mailboxes(id) ON DELETE CASCADE,
    session_id UUID NOT NULL,  -- 브라우저 세션/탭 단위
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    tool_calls JSONB,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_conv_session ON ai_conversations(session_id, created_at DESC);
CREATE INDEX idx_ai_conv_mailbox ON ai_conversations(mailbox_id, created_at DESC);
```

### 2.8 `email_events` (Audit Log)

```sql
CREATE TABLE email_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email_id UUID NOT NULL,
    event_type VARCHAR(50) NOT NULL,  -- 'received', 'read', 'moved', 'deleted', 'sent'
    user_id UUID REFERENCES users(id),
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_email_events_email ON email_events(email_id, created_at DESC);
CREATE INDEX idx_email_events_type ON email_events(event_type, created_at DESC);
```

## 3. ERD

```
┌──────────┐     ┌─────────────┐     ┌───────────┐
│  users   │◄────┤  mailboxes  │◄────┤  folders  │
└──────────┘     └──────┬──────┘     └─────┬─────┘
                        │                    │
                        │              ┌─────┘
                        │              │
                   ┌────┴────┐    ┌────┴────┐
                   │ threads │    │  emails │
                   └────┬────┘    └────┬────┘
                        │              │
                        └──────────────┘
                                       │
                              ┌────────┴────────┐
                              │   attachments   │
                              └─────────────────┘

┌───────────────────┐
│ ai_conversations  │
└───────────────────┘

┌───────────────────┐
│   email_events    │
└───────────────────┘
```

## 4. v0 → v1 스키마 변경사항

| 변경 | v0 (SQLite) | v1 (PostgreSQL) | 이유 |
|------|-------------|-----------------|------|
| PK 타입 | TEXT (UUID v4) | UUID v7 | 시간 기반 정렬, 인덱스 효율 |
| 이메일 테이블 | 단일 테이블 | 파티셔닝 (월간) | 대용량 데이터 관리 |
| 검색 | 애플리케이션 레벨 | `tsvector` + GIN 인덱스 | 고성능 전문검색 |
| 첨부파일 | email_id FK만 | (email_id, received_at) 복합 FK | 파티셔닝 대응 |
| 이벤트 로그 | 없음 | `email_events` 테이블 추가 | 감사 추적 |
| AI 대화 | DO state (휘발) | `ai_conversations` 테이블 | 영속화, 분석 |
| 설정 | R2 JSON | `mailboxes.settings` JSONB | DB 트랜잭션 내 일관성 |
| 소프트 삭제 | 없음 (실제 DELETE) | `is_deleted` + `deleted_at` | 복구 가능 |

## 5. 마이그레이션 스크립트 개요

```bash
# 1. 스키마 생성
psql -f migrations/001_initial_schema.sql

# 2. v0 SQLite 데이터 추출
sqlite3 mailbox.sqlite '.mode json' 'SELECT * FROM emails;' > emails.json

# 3. PostgreSQL로 로드
python scripts/migrate_v0_to_v1.py \
  --sqlite-db mailbox.sqlite \
  --pg-host localhost \
  --pg-db agentic_inbox

# 4. R2 → S3 객체 복제
rclone sync r2:agentic-inbox s3:agentic-inbox-v1

# 5. 검증
python scripts/validate_migration.py
```
