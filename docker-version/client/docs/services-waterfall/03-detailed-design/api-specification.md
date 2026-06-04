# 3.2 API 명세 (API Specification)

> 워터폴 3단계 상세설계 — 외부/내부 인터페이스의 계약을 정의한다. 엔드포인트, 메서드, 요청/응답 형식, 에러 코드를 다룬다.

---

## 3.2.1 공통 규약

### Base URL

- **Local**: `http://localhost:8080/api/v1`
- **Docker Compose**: `http://mail-server:8080/api/v1`

### 공통 응답 형식

**성공**:
```json
{
  "success": true,
  "data": { ... }
}
```

**에러**:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "설명"
  }
}
```

### 인증

로컬 서비스 토큰(`LOCAL_SERVICE_TOKEN`)을 Bearer 헤더로 전달:
```
Authorization: Bearer <LOCAL_SERVICE_TOKEN>
```
`/health`, `/ready` 엔드포인트는 인증 생략.

### CORS

`CORS_ORIGINS` 환경변수로 허용 오리진 지정 (기본: `http://localhost:5173`).

---

## 3.2.2 엔드포인트 목록

### Config

#### `GET /api/v1/config`

**Response**:
```json
{
  "success": true,
  "data": {
    "domains": ["bizmatrixx.com"],
    "emailAddresses": []
  }
}
```

---

### Mailboxes

#### `GET /api/v1/mailboxes`

**Response**:
```json
{
  "success": true,
  "data": [
    { "id": "uuid", "email": "bzengage@example.com", "name": "bzengage@example.com" }
  ]
}
```

#### `POST /api/v1/mailboxes`

**Body**:
```json
{ "email": "new@bizmatrixx.com", "name": "New Mailbox", "settings": {} }
```

**Response**:
```json
{ "success": true, "data": { "id": "uuid", "email": "...", "name": "..." } }
```

**Side Effect**: 시스템 폼더 6개(Inbox, Sent, Drafts, Trash, Archive, Spam) 자동 생성 (트랜잭션)

#### `GET /api/v1/mailboxes/:mailboxId`

#### `PUT /api/v1/mailboxes/:mailboxId`

**Body**:
```json
{ "settings": { "ai_system_prompt": "..." } }
```

#### `DELETE /api/v1/mailboxes/:mailboxId`

---

### Emails

#### `GET /api/v1/mailboxes/:mailboxId/emails`

**Query Parameters**:
| 파라미터 | 타입 | 기본값 | 설명 |
|----------|------|--------|------|
| `folder` | string | | 폼더 ID/slug/name |
| `thread_id` | string | | 스레드 ID |
| `page` | number | 1 | 페이지 |
| `limit` | number | 20 | 페이지 크기 |
| `sortColumn` | string | received_at | 정렬 컬럼 |
| `sortDirection` | string | DESC | ASC / DESC |

**Response**:
```json
{
  "success": true,
  "data": {
    "emails": [ ... ],
    "totalCount": 42
  }
}
```

#### `POST /api/v1/mailboxes/:mailboxId/emails`

이메일 발신. `SENT` 폼더에 저장.

**Body**:
```json
{
  "to": ["recipient@example.com"],
  "subject": "Hello",
  "html": "<p>Hello</p>",
  "text": "Hello",
  "thread_id": "thread-uuid"
}
```

#### `GET /api/v1/mailboxes/:mailboxId/emails/:id`

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "subject": "...",
    "body_html": "...",
    "body_text": "...",
    "attachments": [ ... ]
  }
}
```

#### `PUT /api/v1/mailboxes/:mailboxId/emails/:id`

**Body**:
```json
{ "is_read": true, "is_starred": false }
```

#### `DELETE /api/v1/mailboxes/:mailboxId/emails/:id`

#### `POST /api/v1/mailboxes/:mailboxId/emails/:id/move`

**Body**:
```json
{ "folderId": "folder-uuid" }
```

---

### Drafts

#### `POST /api/v1/mailboxes/:mailboxId/drafts`

**Body**:
```json
{
  "to": "recipient@example.com",
  "subject": "Draft Subject",
  "body": "Draft body...",
  "in_reply_to": "original-email-id",
  "thread_id": "thread-uuid",
  "draft_id": "existing-draft-id"
}
```

---

### Threads

#### `GET /api/v1/mailboxes/:mailboxId/threads/:threadId`

스레드 내 이메일을 `received_at ASC`로 반환.

#### `POST /api/v1/mailboxes/:mailboxId/threads/:threadId/read`

스레드 내 모든 이메일의 `is_read`를 `true`로 설정.

---

### Folders

#### `GET /api/v1/mailboxes/:mailboxId/folders`

#### `POST /api/v1/mailboxes/:mailboxId/folders`

**Body**: `{ "name": "New Folder" }`

#### `PUT /api/v1/mailboxes/:mailboxId/folders/:id`

#### `DELETE /api/v1/mailboxes/:mailboxId/folders/:id`

`is_deletable = false`인 시스템 폼더는 삭제 불가.

---

### Search

#### `GET /api/v1/mailboxes/:mailboxId/search`

PostgreSQL `tsvector` + `plainto_tsquery` 기반 검색.

**Query Parameters**:
| 파라미터 | 타입 | 기본값 | 설명 |
|----------|------|--------|------|
| `q` | string | | 검색어 |
| `page` | number | 1 | 페이지 _(P1-2 추가)_ |
| `limit` | number | 20 | 페이지 크기 (최대 100) _(P1-2 추가)_ |

**Response**:
```json
{
  "success": true,
  "data": {
    "emails": [ ... ],
    "totalCount": 15
  }
}
```

---

### Attachments

#### `GET /api/v1/mailboxes/:mailboxId/emails/:emailId/attachments/:attachmentId`

`storage_key`가 있으면 MinIO presigned URL로 **302 리다이렉트** _(P3-1 완료)_.
`storage_key`가 없으면 메타데이터 JSON 반환.

**Response (storage_key 있음)**:
```
HTTP/1.1 302 Found
Location: https://minio.example.com/agentic-inbox/...?X-Amz-Expires=3600&...
```

**Response (storage_key 없음)**:
```json
{
  "success": true,
  "data": { "id": "uuid", "filename": "...", "content_type": "...", "size": 1024 }
}
```

---

### Webhooks _(신규, P2-2)_

#### `POST /api/v1/webhooks/email`

외부 MTA에서 수신한 이메일을 인바운드 처리.

**Headers**:
```
X-Webhook-Secret: <WEBHOOK_SECRET>
```

**Body**:
```json
{
  "mailboxId": "uuid",
  "sender": "from@example.com",
  "recipient": "to@example.com",
  "subject": "Hello",
  "bodyText": "Plain text body",
  "bodyHtml": "<p>HTML body</p>",
  "messageId": "<msg-id@example.com>",
  "inReplyTo": "<prev-msg-id@example.com>"
}
```

**Side Effect**: 이메일 저장 후 `email-events` Redis Stream에 `new_email` 이벤트 발행 → AI Agent가 자동 draft 생성.

---

### AI (Mail Server → AI Agent Proxy)

#### `POST /api/v1/mailboxes/:mailboxId/test-autodraft`

Mail Server가 AI Agent를 호출하여 자동 draft를 생성.

**Body**: `{ "emailId": "..." }`

---

## 3.2.3 AI Agent 전용 엔드포인트

Base URL: `http://localhost:8000/api/v1`

#### `POST /api/v1/mailboxes/:mailboxId/ai/draft`

동기 draft 생성.

**Body**:
```json
{
  "email_id": "uuid",
  "sender": "client@example.com",
  "subject": "...",
  "thread_id": "...",
  "body_text": "..."
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "draft_id": "uuid",
    "subject": "Re: ...",
    "body_text": "AI generated reply..."
  }
}
```

#### `POST /api/v1/mailboxes/:mailboxId/ai/chat`

SSE 스트리밍 채팅. 세션 히스토리 영속화 지원 _(P1-1 완료)_.

**Headers**: `Accept: text/event-stream`

**Body**:
```json
{ "message": "최신 이메일 5개 보여줘", "session_id": "uuid" }
```

`session_id` 생략 시 새 세션 자동 생성.

**Response (SSE)**:
```
event: message
data: {"type": "text", "content": "..."}

event: done
data: {"session_id": "uuid"}

event: error
data: {"error": "message"}
```

---

## 3.2.4 에러 코드

| HTTP Status | 코드 | 의미 | 예시 |
|-------------|------|------|------|
| 400 | `BAD_REQUEST` | Bad Request | 필수 파라미터 누락 |
| 401 | `UNAUTHORIZED` | 인증 실패 | 토큰 없음 또는 잘못된 Webhook Secret |
| 404 | `NOT_FOUND` | Not Found | 이메일/메일박스 없음 |
| 422 | `PROMPT_INJECTION` | 프롬프트 인젝션 탐지 | 요청 본문에 인젝션 패턴 포함 |
| 429 | `RATE_LIMIT` | Rate Limit 초과 | mailbox_id 기준 분당 20회 초과 |
| 500 | `INTERNAL_ERROR` | Internal Server Error | DB 연결 실패, AI API 오류 |
| 503 | `SERVICE_UNAVAILABLE` | Service Unavailable | AI Provider 키 미설정 |
