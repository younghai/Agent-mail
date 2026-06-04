# v0 API Specification

## Base URL

- **Local**: `http://localhost:8787`
- **Production**: `https://<worker-domain>`

## 인증

| 환경 | 방식 |
|------|------|
| Local | 없음 (`import.meta.env.DEV` skip) |
| Production | Cloudflare Access JWT (`cf-access-jwt-assertion` 헤더) |

## API 엔드포인트

### 메일박스 관리

#### `GET /api/v1/config`
시스템 설정 반환 (도메인, 이메일 주소 목록)

**Response:**
```json
{
  "domains": ["bizmatrixx.com"],
  "emailAddresses": []
}
```

---

#### `GET /api/v1/mailboxes`
메일박스 목록 조회

---

#### `POST /api/v1/mailboxes`
메일박스 생성

**Body:**
```json
{
  "email": "new@bizmatrixx.com",
  "name": "Sales Mailbox",
  "settings": { "agentSystemPrompt": "..." }
}
```

---

#### `GET /api/v1/mailboxes/{mailboxId}`
메일박스 상세 조회

---

#### `PUT /api/v1/mailboxes/{mailboxId}`
메일박스 수정 (시스템 프롬프트 등)

---

#### `DELETE /api/v1/mailboxes/{mailboxId}`
메일박스 삭제

### 이메일 관리

#### `GET /api/v1/mailboxes/{mailboxId}/emails`
이메일 목록 조회

**Query Parameters:**
| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `folder` | string | 폼더 ID (`inbox`, `sent`, etc.) |
| `thread_id` | string | 특정 스레드만 조회 |
| `threaded` | boolean | 스레드 그룹핑 여부 |
| `page` | number | 페이지 번호 |
| `limit` | number | 페이지 크기 |
| `sortColumn` | string | 정렬 컬럼 |
| `sortDirection` | ASC/DESC | 정렬 방향 |

**Response:**
```json
{
  "emails": [...],
  "totalCount": 42
}
```

---

#### `POST /api/v1/mailboxes/{mailboxId}/emails`
이메일 발신

**Body (SendEmailRequestSchema):**
```json
{
  "to": "recipient@example.com",
  "cc": "cc@example.com",
  "bcc": null,
  "from": "bzengage@bizmatrixx.com",
  "subject": "Hello",
  "html": "<p>Hello</p>",
  "text": "Hello",
  "attachments": [
    {
      "content": "base64encoded...",
      "filename": "file.pdf",
      "type": "application/pdf",
      "disposition": "attachment"
    }
  ],
  "in_reply_to": "prev-msg-id",
  "references": ["msg-1", "msg-2"],
  "thread_id": "thread-abc"
}
```

**Response:**
```json
{
  "id": "uuid",
  "status": "sent"
}
```

---

#### `GET /api/v1/mailboxes/{mailboxId}/emails/{id}`
이메일 상세 조회

---

#### `PUT /api/v1/mailboxes/{mailboxId}/emails/{id}`
이메일 수정 (read, starred 등)

---

#### `DELETE /api/v1/mailboxes/{mailboxId}/emails/{id}`
이메일 삭제

---

#### `POST /api/v1/mailboxes/{mailboxId}/emails/{id}/move`
폼더 이동

**Body:**
```json
{ "folder": "archive" }
```

---

#### `POST /api/v1/mailboxes/{mailboxId}/emails/{id}/reply`
답장 (SENT 폼더에 저장 + 실제 발신)

---

#### `POST /api/v1/mailboxes/{mailboxId}/emails/{id}/forward`
전달

### Draft 관리

#### `POST /api/v1/mailboxes/{mailboxId}/drafts`
Draft 생성/수정

**Body:**
```json
{
  "to": "recipient@example.com",
  "subject": "Draft Subject",
  "body": "Draft body...",
  "in_reply_to": "original-email-id",
  "thread_id": "thread-abc",
  "draft_id": "existing-draft-id"  // 수정 시
}
```

### 스레드 관리

#### `GET /api/v1/mailboxes/{mailboxId}/threads/{threadId}`
스레드 내 모든 이메일 조회

---

#### `POST /api/v1/mailboxes/{mailboxId}/threads/{threadId}/read`
스레드 전체 읽음 처리

### 폼더 관리

#### `GET /api/v1/mailboxes/{mailboxId}/folders`
폼더 목록 조회

---

#### `POST /api/v1/mailboxes/{mailboxId}/folders`
폼더 생성

---

#### `PUT /api/v1/mailboxes/{mailboxId}/folders/{id}`
폼더 이름 수정

---

#### `DELETE /api/v1/mailboxes/{mailboxId}/folders/{id}`
폼더 삭제 (is_deletable=1인 경우만)

### 검색

#### `GET /api/v1/mailboxes/{mailboxId}/search`
이메일 검색

**Query Parameters:**
| 파라미터 | 설명 |
|----------|------|
| `q` | 검색어 |

### 첨부파일

#### `GET /api/v1/mailboxes/{mailboxId}/emails/{emailId}/attachments/{attachmentId}`
첨부파일 다운로드 (R2에서 바이너리 스트리밍)

### AI 에이전트 (WebSocket)

#### `/agents/email-agent/{mailboxId}`
EmailAgent와의 WebSocket 연결. 스트리밍 채팅을 지원합니다.

#### `/mcp`
MCP 서버 엔드포인트 (AI 코딩 도구 연동)
