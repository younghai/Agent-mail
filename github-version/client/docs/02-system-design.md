# 02-System Design — Agentic Inbox (v0)

## 아키텍처 개요

```
┌──────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Browser    │────▶│  Hono Worker     │────▶│  MailboxDO      │
│  React SPA   │     │  (API + SSR)     │     │  (SQLite + R2)  │
│  Agent Panel │     │                  │     └─────────────────┘
└──────┬───────┘     │  /agents/* ──────┼────▶┌─────────────────┐
       │             │                  │     │  EmailAgent DO  │
       │ WebSocket   │                  │     │  (AIChatAgent)  │
       └─────────────┤                  │     │  Workers AI     │
                     │                  │────▶└─────────────────┘
                     │                  │
                     │                  │────▶┌─────────────────┐
                     │                  │     │  EmailMCP DO    │
                     │                  │     │  (MCP Server)   │
                     │                  │────▶└─────────────────┘
                     │                  │
                     │                  │────▶┌─────────────────┐
                     │                  │     │  AdminDO        │
                     └──────────────────┘     │  (CRM/Usage)    │
                                              └─────────────────┘
```

## 컴포넌트 정의

| 컴포넌트 | 기술 | 역할 |
|----------|------|------|
| Hono Worker | Hono + Cloudflare Workers | REST API, SSR, Email Routing 핸들러 |
| MailboxDO | Durable Object + SQLite | 메일박스별 이메일/폴리/첨부 저장 |
| EmailAgent | AIChatAgent + Workers AI | 자동 초안, 9개 이메일 툴 |
| EmailMCP | McpAgent | MCP 프로토콜 서버 |
| AdminDO | Durable Object + SQLite | 전역 CRM, 작업, 사용량 |
| R2 | Cloudflare R2 | 첨부파일 blob, 메일박스 설정 JSON |

## 데이터 흐름

### Flow 1: 수신 이메일 → AI 초안
```
[Email Routing] → Worker.fetch(email)
                        ↓
                  receiveEmail() → postal-mime 파싱
                        ↓
                  MailboxDO.createEmail() → SQLite INSERT
                        ↓
                  EmailAgent.handleNewEmail()
                        ↓
                  Workers AI (@cf/moonshotai/kimi-k2.5)
                        ↓
                  draft_reply 툴 → MailboxDO INSERT (drafts)
```

### Flow 2: MCP 외부 도구
```
[Claude Code] → POST /mcp → EmailMCP DO
                      ↓
                툴 호출 (list_emails, draft_reply 등)
                      ↓
                MailboxDO / EmailAgent 조작
```

## 기술 스택

| 계층 | 기술 | 선택 이유 |
|------|------|-----------|
| 프론트엔드 | React 19 + React Router v7 | SSR, 스트리밍, 현대적 React |
| 백엔드 | Hono + Cloudflare Workers | 에지 성능, lightweight |
| ORM | Drizzle ORM | SQLite 스키마 관리, 타입 안전 |
| AI | Workers AI (@cf/moonshotai/kimi-k2.5) | 엣지 추론, 별도 인프라 불필요 |
| 스토리지 | R2 | S3 호환, 엣지 캐싱 |
| 인증 | Cloudflare Access JWT | Zero Trust, 외부 IdP 통합 |
