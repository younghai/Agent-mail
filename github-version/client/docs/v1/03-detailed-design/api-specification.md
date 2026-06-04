# v1 API Specification

## 1. API Gateway

**Base URL**: `https://api.agentic-inbox.example.com`
**Version Prefix**: `/api/v1`
**Authentication**: `Authorization: Bearer <JWT>`

## 2. 공통 규약

### 2.1 응답 형식

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

### 2.2 에러 응답

```json
{
  "success": false,
  "error": {
    "code": "EMAIL_NOT_FOUND",
    "message": "Email with id 'xxx' not found",
    "details": { ... }
  }
}
```

## 3. 엔드포인트 목록

### 3.1 Auth

#### `POST /api/v1/auth/login`
OAuth 로그인 URL 발급

**Response:**
```json
{
  "success": true,
  "data": {
    "authorization_url": "https://accounts.google.com/o/oauth2/v2/auth?..."
  }
}
```

---

#### `POST /api/v1/auth/callback`
OAuth 콜백 처리

**Body:**
```json
{ "code": "oauth-auth-code", "provider": "google" }
```

**Response:**
```json
{
  "success": true,
  "data": {
    "access_token": "jwt-token",
    "refresh_token": "refresh-token",
    "expires_in": 3600,
    "user": { "id": "...", "email": "...", "name": "..." }
  }
}
```

---

#### `POST /api/v1/auth/refresh`
토큰 갱신

### 3.2 Users

#### `GET /api/v1/users/me`
현재 사용자 정보

#### `PUT /api/v1/users/me`
프로필 수정

### 3.3 Mailboxes

#### `GET /api/v1/mailboxes`
메일박스 목록 (소유 + 공유)

**Query:** `?page=1&limit=20`

---

#### `POST /api/v1/mailboxes`
메일박스 생성

**Body:**
```json
{
  "email": "sales@bizmatrixx.com",
  "name": "Sales Team",
  "ai_provider": "openai",
  "ai_model": "gpt-4o",
  "ai_system_prompt": "You are a professional sales assistant..."
}
```

---

#### `GET /api/v1/mailboxes/:id`
메일박스 상세

---

#### `PUT /api/v1/mailboxes/:id`
메일박스 수정

---

#### `DELETE /api/v1/mailboxes/:id`
메일박스 삭제 (소프트 삭제)

### 3.4 Emails

#### `GET /api/v1/mailboxes/:mailboxId/emails`
이메일 목록

**Query Parameters:**
| 파라미터 | 타입 | 기본값 | 설명 |
|----------|------|--------|------|
| `folder_id` | UUID | | 폼더 필터 |
| `thread_id` | UUID | | 스레드 필터 |
| `q` | string | | 전문검색 쿼리 |
| `is_read` | boolean | | 읽음 필터 |
| `is_starred` | boolean | | 중요 필터 |
| `date_from` | ISO date | | 시작 날짜 |
| `date_to` | ISO date | | 종료 날짜 |
| `page` | number | 1 | 페이지 |
| `limit` | number | 20 | 페이지 크기 (max 100) |
| `sort` | string | `-received_at` | 정렬 (`+subject`, `-date`) |

**Response:**
```json
{
  "success": true,
  "data": {
    "emails": [
      {
        "id": "uuid",
        "subject": "...",
        "sender": "...",
        "sender_name": "...",
        "recipient": "...",
        "is_read": false,
        "is_starred": true,
        "received_at": "2026-04-15T09:30:00Z",
        "folder": { "id": "...", "name": "Inbox", "slug": "inbox" },
        "thread": { "id": "...", "subject": "..." },
        "attachment_count": 2,
        "snippet": "안녕하세요, 견적 문의드립니다..."
      }
    ]
  },
  "meta": { "page": 1, "limit": 20, "total": 156 }
}
```

---

#### `GET /api/v1/mailboxes/:mailboxId/emails/:id`
이메일 상세

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "subject": "...",
    "body_html": "<html>...</html>",
    "body_text": "plain text...",
    "sender": "...",
    "recipient": "...",
    "cc": "...",
    "message_id": "<msg-id>",
    "in_reply_to": "<parent-msg-id>",
    "references": ["<msg-1>", "<msg-2>"],
    "raw_headers": [{"key": "From", "value": "..."}],
    "attachments": [
      {
        "id": "uuid",
        "filename": "file.pdf",
        "mimetype": "application/pdf",
        "size_bytes": 245760,
        "download_url": "https://s3.../presigned-url"
      }
    ],
    "folder": { ... },
    "thread": { ... }
  }
}
```

---

#### `POST /api/v1/mailboxes/:mailboxId/emails`
이메일 발신

**Body:**
```json
{
  "to": ["recipient@example.com"],
  "cc": ["cc@example.com"],
  "bcc": [],
  "subject": "Hello",
  "body_html": "<p>Hello</p>",
  "body_text": "Hello",
  "attachments": [
    {
      "filename": "file.pdf",
      "content_base64": "base64...",
      "mimetype": "application/pdf"
    }
  ],
  "in_reply_to": "original-email-id",
  "thread_id": "thread-uuid"
}
```

---

#### `PUT /api/v1/mailboxes/:mailboxId/emails/:id`
이메일 상태 변경 (read, starred)

**Body:**
```json
{ "is_read": true, "is_starred": false }
```

---

#### `DELETE /api/v1/mailboxes/:mailboxId/emails/:id`
이메일 삭제 (소프트 삭제 → Trash)

---

#### `POST /api/v1/mailboxes/:mailboxId/emails/:id/move`
폼더 이동

**Body:**
```json
{ "folder_id": "archive-folder-uuid" }
```

---

#### `POST /api/v1/mailboxes/:mailboxId/emails/:id/reply`
답장

---

#### `POST /api/v1/mailboxes/:mailboxId/emails/:id/forward`
전달

### 3.5 Drafts

#### `POST /api/v1/mailboxes/:mailboxId/drafts`
Draft 생성/수정

**Body:**
```json
{
  "to": "...",
  "subject": "...",
  "body_html": "...",
  "body_text": "...",
  "in_reply_to": "...",
  "thread_id": "...",
  "draft_id": "existing-draft-uuid"
}
```

### 3.6 Threads

#### `GET /api/v1/mailboxes/:mailboxId/threads`
스레드 목록

**Query:** `?page=1&limit=20&is_read=false`

---

#### `GET /api/v1/mailboxes/:mailboxId/threads/:id`
스레드 상세 (이메일 목록 포함)

---

#### `POST /api/v1/mailboxes/:mailboxId/threads/:id/read`
스레드 전체 읽음 처리

### 3.7 Folders

#### `GET /api/v1/mailboxes/:mailboxId/folders`
폼더 목록

---

#### `POST /api/v1/mailboxes/:mailboxId/folders`
폼더 생성

---

#### `PUT /api/v1/mailboxes/:mailboxId/folders/:id`
폼더 수정

---

#### `DELETE /api/v1/mailboxes/:mailboxId/folders/:id`
폼더 삭제 (시스템 폼더 제외)

### 3.8 AI Agent

#### `POST /api/v1/mailboxes/:mailboxId/ai/chat`
AI 채팅 (스트리밍 SSE)

**Headers:**
```
Accept: text/event-stream
Content-Type: application/json
```

**Body:**
```json
{
  "message": "최신 이메일 5개 보여줘",
  "session_id": "browser-session-uuid"
}
```

**Response (SSE):**
```
event: message
data: {"type": "text", "content": "최신 이메일 5개를 조회하겠습니다."}

event: tool_call
data: {"type": "tool_call", "tool": "list_emails", "arguments": {"limit": 5}}

event: message
data: {"type": "text", "content": "조회 결과입니다: ..."}

event: done
data: {}
```

---

#### `POST /api/v1/mailboxes/:mailboxId/ai/draft`
특정 이메일에 대한 답변 초안 생성 (동기)

**Body:**
```json
{ "email_id": "target-email-uuid" }
```

**Response:**
```json
{
  "success": true,
  "data": {
    "draft_id": "draft-uuid",
    "subject": "Re: ...",
    "body_html": "...",
    "body_text": "..."
  }
}
```

---

#### `GET /api/v1/mailboxes/:mailboxId/ai/conversations`
AI 대화 히스토리

### 3.9 Attachments

#### `GET /api/v1/attachments/:id/download`
첨부파일 다운로드 (Presigned URL 발급, 302 Redirect)

### 3.10 Webhooks (Inbound Email)

#### `POST /api/v1/webhooks/email`
외부 SMTP 서비스로부터 이메일 수신

**Headers:**
```
X-Webhook-Secret: shared-secret
```

**Body (multipart/form-data 또는 JSON):**
```json
{
  "mailbox_email": "inbox@bizmatrixx.com",
  "from": "sender@example.com",
  "to": ["inbox@bizmatrixx.com"],
  "subject": "...",
  "body_html": "...",
  "body_text": "...",
  "attachments": [
    { "filename": "...", "content_base64": "...", "mimetype": "..." }
  ]
}
```

## 4. Rate Limiting

| 엔드포인트 | 제한 |
|-----------|------|
| `POST /api/v1/auth/*` | 10req/min per IP |
| `GET /api/v1/mailboxes/*/emails` | 100req/min per user |
| `POST /api/v1/mailboxes/*/emails` | 30req/min per mailbox |
| `POST /api/v1/mailboxes/*/ai/*` | 60req/min per user |
| `POST /api/v1/webhooks/email` | 1000req/min per source IP |
