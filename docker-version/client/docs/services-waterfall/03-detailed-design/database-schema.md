# 3.1 데이터베이스 설계 (Database Schema)

> 워터폴 3단계 상세설계 — 데이터 모델, 인덱스, 제약조건, 마이그레이션 전략을 다룬다.

---

## 3.1.1 개요

- **DBMS**: PostgreSQL 16
- **스키마 파일**: `services/mail-server/migrations/001_initial.sql`
- **마이그레이션 방식**: SQL 파일 직접 실행 (`psql -f`)
- **확장**: `uuid-ossp` 확장 사용

---

## 3.1.2 ERD

```
┌─────────────┐       ┌──────────────────────────────────────────┐
│  mailboxes  │       │                  emails                  │
├─────────────┤       ├──────────────────────────────────────────┤
│ id (PK)     │◄──────┤ mailbox_id (FK)                          │
│ email       │       │ id (PK)                                  │
│ name        │       │ folder_id (FK)                           │
│ domain      │       │ thread_id                                │
│ settings    │       │ subject, sender, recipient, cc, bcc      │
│ ai_provider │       │ body_text, body_html                     │
│ ai_model    │       │ message_id, in_reply_to, email_references│
│ ai_system_  │       │ raw_headers                              │
│   prompt    │       │ is_read, is_starred, is_draft            │
│ is_active   │       │ search_vector (tsvector)                 │
└─────────────┘       │ email_date, received_at                  │
                      └────────────┬─────────────────────────────┘
                                   │
                          ┌────────┴────────┐
                          │   attachments   │
                          ├─────────────────┤
                          │ id (PK)         │
                          │ email_id (FK)   │
                          │ filename        │
                          │ mimetype        │
                          │ size_bytes      │
                          │ storage_key     │
                          └─────────────────┘

┌───────────────────┐
│ ai_conversations  │
├───────────────────┤
│ id (PK)           │
│ mailbox_id (FK)   │
│ session_id        │
│ role              │
│ content           │
│ tool_calls        │
│ metadata          │
└───────────────────┘
```

---

## 3.1.3 테이블 상세

### `mailboxes`

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | UUID | PK, default gen_random_uuid() | 메일박스 ID |
| `email` | TEXT | NOT NULL, UNIQUE | 이메일 주소 |
| `name` | TEXT | NOT NULL | 표시 이름 |
| `domain` | TEXT | NOT NULL DEFAULT 'bizmatrixx.com' | 소속 도메인 |
| `settings` | JSONB | DEFAULT '{}' | 추가 설정 |
| `ai_provider` | TEXT | DEFAULT 'openai' | AI Provider |
| `ai_model` | TEXT | DEFAULT 'gpt-4o' | AI 모델명 |
| `ai_system_prompt` | TEXT | | 커스텀 시스템 프롬프트 |
| `is_active` | BOOLEAN | NOT NULL DEFAULT true | 활성화 여부 |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | 생성일 |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | 수정일 |

**인덱스**: `idx_mailboxes_email`

---

### `folders`

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | UUID | PK | 폼더 ID |
| `mailbox_id` | UUID | NOT NULL, FK→mailboxes | 소속 메일박스 |
| `name` | TEXT | NOT NULL | 표시 이름 |
| `slug` | TEXT | NOT NULL DEFAULT 'custom' | 시스템 식별자 |
| `is_system` | BOOLEAN | NOT NULL DEFAULT false | 시스템 폼더 여부 |
| `is_deletable` | BOOLEAN | NOT NULL DEFAULT true | 삭제 가능 여부 |
| `sort_order` | INT | NOT NULL DEFAULT 0 | 정렬 순서 |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | 생성일 |

**인덱스**: `idx_folders_mailbox`
**유니크**: `(mailbox_id, name)`

**시스템 폼더 (Seed)**:
| slug | name | sort_order |
|------|------|-----------|
| inbox | Inbox | 0 |
| sent | Sent | 1 |
| draft | Drafts | 2 |
| trash | Trash | 3 |
| archive | Archive | 4 |
| spam | Spam | 5 |

---

### `emails`

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | UUID | PK | 이메일 ID |
| `mailbox_id` | UUID | NOT NULL, FK→mailboxes | 소속 메일박스 |
| `folder_id` | UUID | NOT NULL, FK→folders | 소속 폼더 |
| `thread_id` | TEXT | | 스레드 그룹핑 ID (v0 호환) |
| `subject` | TEXT | | 제목 |
| `sender` | TEXT | | 발신자 |
| `sender_name` | TEXT | | 발신자 이름 |
| `recipient` | TEXT | | 수신자 |
| `cc` | TEXT | | CC |
| `bcc` | TEXT | | BCC |
| `body_text` | TEXT | | Plain text 본문 |
| `body_html` | TEXT | | HTML 본문 |
| `message_id` | TEXT | | 원본 Message-ID |
| `in_reply_to` | TEXT | | 답장 대상 ID |
| `email_references` | JSONB | | 참조 메시지 ID 배열 |
| `raw_headers` | JSONB | | 원본 헤더 배열 |
| `is_read` | BOOLEAN | DEFAULT false | 읽음 여부 |
| `is_starred` | BOOLEAN | DEFAULT false | 중요 표시 |
| `is_draft` | BOOLEAN | DEFAULT false | Draft 여부 |
| `search_vector` | TSVECTOR | | Full-Text Search 인덱스 |
| `email_date` | TIMESTAMPTZ | DEFAULT now() | 이메일 날짜 |
| `received_at` | TIMESTAMPTZ | DEFAULT now() | 수신일 |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | 생성일 |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | 수정일 |

**인덱스**:
```sql
CREATE INDEX idx_emails_mailbox_folder ON emails(mailbox_id, folder_id, received_at DESC);
CREATE INDEX idx_emails_thread ON emails(thread_id, received_at DESC);
CREATE INDEX idx_emails_sender ON emails(sender);
CREATE INDEX idx_emails_date ON emails(received_at DESC);
CREATE INDEX idx_emails_search ON emails USING GIN(search_vector);
```

**트리거** (자동 `tsvector` 업데이트):
```sql
CREATE TRIGGER emails_search_vector_trigger
    BEFORE INSERT OR UPDATE ON emails
    FOR EACH ROW EXECUTE FUNCTION emails_search_vector_update();
```

---

### `attachments`

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | UUID | PK | 첨부 ID |
| `email_id` | UUID | NOT NULL, FK→emails | 소속 이메일 |
| `filename` | TEXT | NOT NULL | 파일명 |
| `mimetype` | TEXT | NOT NULL | MIME 타입 |
| `size_bytes` | BIGINT | NOT NULL | 크기 (bytes) |
| `storage_key` | TEXT | NOT NULL | S3/MinIO 오브젝트 키 |
| `content_id` | TEXT | | Content-ID |
| `disposition` | TEXT | DEFAULT 'attachment' | attachment / inline |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | 생성일 |

**인덱스**: `idx_attachments_email`

---

### `ai_conversations`

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | UUID | PK | 대화 ID |
| `mailbox_id` | UUID | NOT NULL, FK→mailboxes | 소속 메일박스 |
| `session_id` | UUID | NOT NULL | 브라우저 세션 |
| `role` | TEXT | NOT NULL CHECK | user / assistant / system |
| `content` | TEXT | NOT NULL | 메시지 내용 |
| `tool_calls` | JSONB | | 도구 호출 기록 |
| `metadata` | JSONB | DEFAULT '{}' | 추가 메타 |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | 생성일 |

**인덱스**:
```sql
CREATE INDEX idx_ai_conv_session ON ai_conversations(session_id, created_at DESC);
CREATE INDEX idx_ai_conv_mailbox ON ai_conversations(mailbox_id, created_at DESC);
```

---

## 3.1.4 마이그레이션 전략

### 최초 배포

```bash
# 1. DB 생성
psql postgres -c "CREATE DATABASE agentic_inbox OWNER agentic;"

# 2. 스키마 적용
psql -U agentic -d agentic_inbox -f services/mail-server/migrations/001_initial.sql

# 3. 검증
psql -U agentic -d agentic_inbox -c "\dt"
```

### 향후 마이그레이션

| 버전 | 파일 | 내용 |
|------|------|------|
| 001 | `001_initial.sql` | 초기 스키마 + 시드 데이터 |
| 002 | (예정) | `users` 테이블, OAuth 연동 |
| 003 | (예정) | `email_events` 감사 로그 테이블 |
| 004 | (예정) | 파티셔닝 (`emails_YYYY_MM`) |
