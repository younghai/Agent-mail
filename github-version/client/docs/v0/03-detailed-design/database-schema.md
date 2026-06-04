# v0 Database Schema

## 개요

v0에서는 **MailboxDO당 하나의 SQLite 데이터베이스**를 사용합니다. Durable Object의 SQLite는 자동으로 영속화되며, Drizzle ORM으로 스키마를 관리합니다.

## 테이블 정의

### `folders`

메일박스 내 폼더 목록입니다. 기본 폼더는 애플리케이션 시작 시 자동 생성됩니다.

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | TEXT | PK | 폼더 ID (`inbox`, `sent`, `trash`, `archive`, `spam`, `draft`) |
| `name` | TEXT | NOT NULL, UNIQUE | 표시 이름 |
| `is_deletable` | INTEGER | NOT NULL DEFAULT 1 | 삭제 가능 여부 (0=시스템, 1=사용자 생성) |

```sql
CREATE TABLE folders (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    is_deletable INTEGER NOT NULL DEFAULT 1
);
```

### `emails`

이메일 본문과 메타데이터를 저장합니다.

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | TEXT | PK | 이메일 UUID |
| `folder_id` | TEXT | FK → folders.id ON DELETE CASCADE | 소속 폼더 |
| `subject` | TEXT | | 제목 |
| `sender` | TEXT | | 발신자 (소문자) |
| `recipient` | TEXT | | 수신자 |
| `date` | TEXT | | ISO 8601 날짜 |
| `read` | INTEGER | DEFAULT 0 | 읽음 여부 |
| `starred` | INTEGER | DEFAULT 0 | 중요 표시 |
| `body` | TEXT | | HTML 본문 |
| `in_reply_to` | TEXT | | 답장 대상 메시지 ID |
| `email_references` | TEXT | | JSON 문자열 (참조 메시지 ID 배열) |
| `thread_id` | TEXT | | 스레드 그룹핑 ID |
| `message_id` | TEXT | | 원본 Message-ID 헤더 |
| `raw_headers` | TEXT | | JSON 문자열 (헤더 배열) |
| `cc` | TEXT | | CC |
| `bcc` | TEXT | | BCC |

```sql
CREATE TABLE emails (
    id TEXT PRIMARY KEY,
    folder_id TEXT NOT NULL,
    subject TEXT,
    sender TEXT,
    recipient TEXT,
    date TEXT,
    read INTEGER DEFAULT 0,
    starred INTEGER DEFAULT 0,
    body TEXT,
    in_reply_to TEXT,
    email_references TEXT,
    thread_id TEXT,
    message_id TEXT,
    raw_headers TEXT,
    cc TEXT,
    bcc TEXT,
    FOREIGN KEY(folder_id) REFERENCES folders(id) ON DELETE CASCADE
);
```

**인덱스:**

```sql
CREATE INDEX idx_emails_thread_id ON emails(thread_id);
CREATE INDEX idx_emails_in_reply_to ON emails(in_reply_to);
CREATE INDEX idx_emails_folder_id ON emails(folder_id);
CREATE INDEX idx_emails_date ON emails(date);
CREATE INDEX idx_emails_folder_date ON emails(folder_id, date DESC);
```

### `attachments`

첨부파일 메타데이터를 저장합니다. 실제 바이너리는 R2에 저장됩니다.

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | TEXT | PK | 첨부파일 UUID |
| `email_id` | TEXT | FK → emails.id ON DELETE CASCADE | 소속 이메일 |
| `filename` | TEXT | NOT NULL | 파일명 |
| `mimetype` | TEXT | NOT NULL | MIME 타입 |
| `size` | INTEGER | NOT NULL | 파일 크기 (bytes) |
| `content_id` | TEXT | | Content-ID (inline용) |
| `disposition` | TEXT | | `attachment` 또는 `inline` |

```sql
CREATE TABLE attachments (
    id TEXT PRIMARY KEY,
    email_id TEXT NOT NULL,
    filename TEXT NOT NULL,
    mimetype TEXT NOT NULL,
    size INTEGER NOT NULL,
    content_id TEXT,
    disposition TEXT,
    FOREIGN KEY(email_id) REFERENCES emails(id) ON DELETE CASCADE
);
```

### `d1_migrations`

Drizzle ORM 마이그레이션 이력입니다.

```sql
CREATE TABLE d1_migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    applied_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

## ERD

```
┌─────────────┐       ┌──────────────────────────────────────────┐
│   folders   │       │                  emails                  │
├─────────────┤       ├──────────────────────────────────────────┤
│ id (PK)     │◄──────┤ folder_id (FK)                           │
│ name        │       │ id (PK)                                  │
│ is_deletable│       │ subject, sender, recipient, date...      │
└─────────────┘       │ thread_id, in_reply_to, message_id       │
                      │ body, raw_headers...                     │
                      └────────────┬─────────────────────────────┘
                                   │
                                   │
                      ┌────────────▼─────────────┐
                      │       attachments        │
                      ├──────────────────────────┤
                      │ id (PK)                  │
                      │ email_id (FK)            │
                      │ filename, mimetype, size │
                      └──────────────────────────┘
```

## 스키마 제약 및 특성

1. **Soft delete 없음**: `emails`와 `attachments`는 실제 DELETE로 제거됩니다. Trash 폼더 이동만으로 관리합니다.
2. **Thread ID 자동 생성**: `thread_id`는 `in_reply_to` > `references[0]` > `message_id` 우선순위로 결정됩니다.
3. **Sender 소문자 정규화**: 모든 sender/recipient는 소문자로 저장됩니다.
4. **Date ISO 8601**: `new Date().toISOString()` 형식으로 저장됩니다.
