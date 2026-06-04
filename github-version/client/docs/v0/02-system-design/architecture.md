# v0 System Architecture

## 1. 전체 아키텍처 다이어그램

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Browser                          │
│                     (React Router SPA)                          │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS
┌──────────────────────────▼──────────────────────────────────────┐
│                    Cloudflare Workers                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Hono Router                           │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐   │   │
│  │  │ /api/v1  │  │ /agents  │  │ /* (React Router)    │   │   │
│  │  │   REST   │  │  WebSocket│  │     SPA Fallback     │   │   │
│  │  └────┬─────┘  └────┬─────┘  └──────────────────────┘   │   │
│  │       │             │                                     │   │
│  │       ▼             ▼                                     │   │
│  │  ┌──────────────────────────────────────────────┐        │   │
│  │  │              Durable Objects                 │        │   │
│  │  │  ┌─────────────┐  ┌──────────────────────┐   │        │   │
│  │  │  │  MailboxDO  │  │    EmailAgent        │   │        │   │
│  │  │  │  (SQLite)   │  │  (AIChatAgent)       │   │        │   │
│  │  │  │  per inbox  │  │  per mailbox         │   │        │   │
│  │  │  └─────────────┘  └──────────────────────┘   │        │   │
│  │  └──────────────────────────────────────────────┘        │   │
│  └──────────────────────────────────────────────────────────┘   │
│                          │                                      │
│       ┌──────────────────┼──────────────────┐                   │
│       ▼                  ▼                  ▼                   │
│  ┌─────────┐      ┌──────────┐      ┌───────────┐              │
│  │   R2    │      │ Workers  │      │  Email    │              │
│  │ Storage │      │    AI    │      │  Send     │              │
│  └─────────┘      └──────────┘      └───────────┘              │
└─────────────────────────────────────────────────────────────────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌─────────┐  ┌─────────┐  ┌─────────┐
        │  Email  │  │   AI    │  │  Blob   │
        │ Routing │  │  Model  │  │ Storage │
        └─────────┘  └─────────┘  └─────────┘
```

## 2. 컴포넌트 설명

### 2.1 Hono Router (`workers/app.ts`, `workers/index.ts`)
- Cloudflare Workers의 entry point
- `/api/v1/*`: REST API 라우팅
- `/agents/*`: AIChatAgent WebSocket 라우팅
- `/*`: React Router SPA fallback
- `/mcp/*`: MCP 서버 엔드포인트 (AI 코딩 도구 연동)

### 2.2 MailboxDO (`workers/durableObject/index.ts`)
- **수명**: 메일박스당 1개 (이메일 주소 기반 idFromName)
- **저장소**: SQLite (Drizzle ORM)
- **역할**:
  - 이메일 CRUD
  - 폼더 관리
  - 스레드 그룹핑
  - 첨부파일 메타데이터 관리

### 2.3 EmailAgent (`workers/agent/index.ts`)
- **수명**: 메일박스당 1개
- **상태**: 채팅 메시지 히스토리 (DO 상태에 자동 저장)
- **역할**:
  - `onChatMessage`: 사용자와 실시간 채팅 (streamText)
  - `handleNewEmail`: 새 메일 도착 시 자동 draft 생성 (generateText)
  - 도구 호출을 통해 MailboxDO와 상호작용

### 2.4 EmailMCP (`workers/mcp/index.ts`)
- **역할**: Claude Code, Cursor 등 AI 코딩 도구가 이메일 데이터에 접근할 수 있도록 하는 MCP 서버

## 3. 데이터 저장소

| 저장소 | 용도 | 기술 |
|--------|------|------|
| **DO SQLite** | 이메일, 폼더, 첨부파일 메타데이터 | SQLite (Durable Object) |
| **R2** | 첨부파일 바이너리, 메일박스 설정 JSON | Cloudflare R2 |
| **DO State** | EmailAgent의 채팅 히스토리 | Durable Object in-memory |

## 4. 통신 흐름

### 4.1 이메일 수신 → 자동 Draft 생성

```
Cloudflare Email Routing
        │
        ▼
workers/app.ts::email()
        │
        ▼
receiveEmail()
        │
        ├──► MailboxDO.createEmail(INBOX)
        │
        └──► EmailAgent.fetch("/onNewEmail")
                    │
                    ▼
            handleNewEmail()
                    │
                    ├──► isPromptInjection() (Llama 3.1)
                    ├──► getThreadEmails() (MailboxDO)
                    ├──► generateText() (kimi-k2.5)
                    └──► draft_reply tool → MailboxDO.createEmail(DRAFT)
```

### 4.2 사용자 채팅 → 도구 호출

```
Browser WebSocket
        │
        ▼
/agents/email-agent/{mailboxId}
        │
        ▼
EmailAgent.onChatMessage()
        │
        ├──► streamText(kimi-k2.5)
        │         └── tool call
        │               └── draft_reply / get_email / etc.
        │                     └── MailboxDO API
        │
        └──► Streaming response to browser
```

## 5. 보안 아키텍처

```
Production:
  Client → Cloudflare Access (JWT) → Workers → Services

Local Dev:
  Client ────────────────> Workers → Services
          (JWT skip via import.meta.env.DEV)

AI Safety:
  Incoming email → Llama 3.1 prompt injection scan → OK → AI processing
                                        ↓ BLOCK
  Thread context → Llama 3.1 scan → OK → AI processing
                                        ↓ BLOCK
  AI output → Llama 4 Scout verify → OK → Draft saved
                              ↓ Sanitize or Discard
```
