# Agentic Inbox v0 — Project Overview

## 1. 프로젝트 개요

Agentic Inbox는 AI 에이전트가 이메일을 자동으로 분석하고 답변 초안을 생성하는 지능형 메일 서비스입니다. Cloudflare Workers 기반의 서버리스 아키텍처 위에서 동작하며, 별도의 AI API Key 없이 Cloudflare Workers AI 바인딩을 통해 `@cf/moonshotai/kimi-k2.5` 모델을 사용합니다.

## 2. 프로젝트 목표

- **자동 답변 초안 생성**: 새 이메일 도착 시 AI가 컨텍스트를 파악하여 답변 초안(Draft)을 자동으로 작성
- **멀티 텐넌트 메일박스 지원**: 여러 이메일 주소를 독립적인 메일박스로 관리
- **스레드 기반 대화 관리**: 이메일 스레드를 추적하여 맥락 있는 답변 생성
- **보안**: 프롬프트 인젝션 감지, draft 검증을 통한 안전한 AI 응답

## 3. 현재 아키텍처 요약

| 영역 | 기술 |
|------|------|
| **Runtime** | Cloudflare Workers (V8 Isolate) |
| **Framework** | Hono (API), React Router (SPA) |
| **Database** | Durable Object SQLite (per mailbox) |
| **Storage** | Cloudflare R2 |
| **AI** | Cloudflare Workers AI (`@cf/moonshotai/kimi-k2.5`) |
| **Email Routing** | Cloudflare Email Routing |
| **Auth** | Cloudflare Access (JWT) — production only |

## 4. 프로젝트 범위 (v0)

### In Scope
- 이메일 수신/발신/임시저장
- AI 기반 자동 답변 초안 생성
- 에이전트 채팅 UI (웹소켓 스트리밍)
- 첨부파일 업로드/다운로드
- 폼더 관리 (Inbox, Sent, Drafts, Trash, Archive, Spam)

### Out of Scope (v0)
- 캘린더 연동
- 다중 계정 SSO (Google, Microsoft)
- 이메일 템플릿 에디터
- 모바일 네이티브 앱

## 5. 이해관계자

| 역할 | 설명 |
|------|------|
| **운영자** | 메일박스 설정, AI 시스템 프롬프트 커스터마이징, draft 검토/발송 |
| **최종사용자** | 수신 이메일 확인, AI가 생성한 draft 확인 및 발송 |
| **개발팀** | Cloudflare Workers 기반 서비스 개발 및 배포 |

## 6. 핵심 용어

| 용어 | 정의 |
|------|------|
| **MailboxDO** | Durable Object. 하나의 메일박스 = 하나의 SQLite DB |
| **EmailAgent** | AIChatAgent를 상속한 Durable Object. 이메일 분석 및 draft 생성 |
| **EmailMCP** | AI 코딩 도구(Claude Code, Cursor 등)와 연동되는 MCP 서버 |
| **DO (Durable Object)** | Cloudflare의 상태ful 서버리스 컴퓨팅 단위 |
