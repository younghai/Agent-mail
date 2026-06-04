# v0 Data Flow

## 1. 이메일 수신 플로우

```
[Sender] ──SMTP──> [Cloudflare Email Routing]
                            │
                            ▼
                    ┌───────────────┐
                    │  raw stream   │  (PostalMime로 파싱)
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │  receiveEmail │
                    │  (workers/)   │
                    └───────┬───────┘
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
        ┌─────────┐  ┌──────────┐  ┌──────────┐
        │ R2 저장  │  │MailboxDO │  │EmailAgent│
        │첨부파일  │  │INBOX 저장│  │/onNewMail│
        └─────────┘  └──────────┘  └────┬─────┘
                                        │
                                        ▼
                              ┌──────────────────┐
                              │ handleNewEmail() │
                              │  1. 프롬프트 인젝션 검사
                              │  2. 스레드 컨텍스트 로드
                              │  3. AI generateText()
                              │  4. draft_reply 도구 호출
                              │  5. DRAFT 폼더 저장
                              └──────────────────┘
```

## 2. 이메일 발신 플로우

```
[User Browser]
      │
      ▼ POST /api/v1/mailboxes/{id}/emails
┌──────────────────┐
│  validateSender  │  (도메인/주소 검증)
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  generateMessageId│
└────────┬─────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌───────┐ ┌──────────┐
│MailboxDO│ │  R2      │
│SENT 저장│ │첨부 저장  │
└───┬───┘ └──────────┘
    │
    ▼
┌──────────────────┐
│  sendEmail()     │  (Cloudflare Email Send binding)
│  (비동기 waitUntil)│
└──────────────────┘
```

## 3. AI 채팅 플로우

```
[User Browser]
      │
      ▼ WebSocket /agents/email-agent/{mailboxId}
┌──────────────────────┐
│ EmailAgent           │
│ onChatMessage()      │
│                      │
│ 1. systemPrompt 로드 │
│    (R2 > DEFAULT)    │
│ 2. streamText()      │
│    model: kimi-k2.5  │
│ 3. 도구 호출         │
│    → MailboxDO API   │
│ 4. UI 스트리밍 응답  │
└──────────────────────┘
```

## 4. 상태 저장소 접근 패턴

| 작업 | 읽기 | 쓰기 |
|------|------|------|
| 이메일 목록 조회 | MailboxDO SQLite | — |
| 이메일 상세 조회 | MailboxDO SQLite + R2 (첨부) | — |
| 이메일 수신 | — | MailboxDO SQLite + R2 |
| Draft 생성 | MailboxDO SQLite (thread) | MailboxDO SQLite (DRAFT) |
| 설정 조회 | R2 (`mailboxes/{id}.json`) | R2 |
| 채팅 히스토리 | EmailAgent DO state | EmailAgent DO state (자동) |
