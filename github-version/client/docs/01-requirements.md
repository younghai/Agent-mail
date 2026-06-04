# 01-Requirements — Agentic Inbox (v0)

## 기능 요구사항 (FR)

### FR-1 메일 관리
- FR-1.1: 메일박스 CRUD (R2 설정 JSON 저장)
- FR-1.2: 이메일 목록/조회/발송/삭제/이동
- FR-1.3: 스레드 조회 및 읽음 처리
- FR-1.4: 폴리 CRUD (Inbox, Sent, Drafts, Archive, Trash, Spam)
- FR-1.5: 전문 검색 (SQLite LIKE + 제한적)

### FR-2 AI 기능
- FR-2.1: 수신 이메일 자동 초안 (EmailAgent)
- FR-2.2: AI 챗 (WebSocket 스트리밍)
- FR-2.3: 메일박스별 시스템 프롬프트 설정
- FR-2.4: 프롬프트 인젝션 방지

### FR-3 MCP / 외부 도구
- FR-3.1: MCP 프로토콜 서버 (`/mcp`)
- FR-3.2: 외부 도구가 메일박스/이메일/초안/발송 조작

### FR-4 Admin CRM
- FR-4.1: 고객(클리이언트) 관리 (AdminDO)
- FR-4.2: 작업(Task) 관리
- FR-4.3: AI 사용량 추적

## 비기능 요구사항 (NFR)

| ID | 항목 | 요건 |
|----|------|------|
| NFR-1 | 성능 | 엣지 응답 TTFB < 100ms |
| NFR-2 | 가용성 | Cloudflare SLA 기반 |
| NFR-3 | 보안 | Access JWT, 프롬프트 인젝션 필터 |
| NFR-4 | 격리 | 메일박스별 DO 인스턴스 격리 |
| NFR-5 | 비용 | Workers AI 토큰당 과금 최적화 |

## 유스케이스

### UC-01 수신 이메일 처리
1. Cloudflare Email Routing이 Worker에 이메일 전달
2. `receiveEmail()`이 MIME 파싱 → MailboxDO 저장
3. EmailAgent가 자동 초안 생성 → Drafts 폴리 저장
4. 사용자가 React SPA에서 초안 확인 및 수정/발송

### UC-02 MCP를 통한 외부 도구 접근
1. Claude Code가 `https://<worker>/mcp`에 MCP 연결
2. `list_mailboxes`, `get_email`, `draft_reply` 툴 호출
3. EmailMCP DO가 요청 처리
