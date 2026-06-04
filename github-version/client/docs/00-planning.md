# 00-Planning — Agentic Inbox (v0)

## 프로젝트 개요

Cloudflare Workers 기반의 AI 이메일 클라이언트. 수신 이메일을 Durable Objects SQLite에 저장하고, Workers AI로 자동 초안을 생성하며, React SPA로 이메일을 관리합니다.

## 핵심 목표

1. **에지 네이티브**: 전 세계 엣지에서 지연 시간 최소화
2. **AI 자동 초안**: 수신 즉시 초안 생성 (단, 자동 발송 없음)
3. **MCP 통합**: 외부 AI 도구(Cursor, Claude Code)가 메일함에 접근

## MVP 범위 (In)

- 메일박스별 Durable Objects 격리 저장
- 이메일 수신/발송/스레드/폴리/검색
- Workers AI 기반 자동 초안
- MCP 서버 (외부 도구 연동)
- Admin CRM (클리이언트, 작업, 사용량)

## Out of Scope

- 첨부파일 대용량 업로드 (R2 100MB 제한)
- 오프라인 동기화
- 다중 도메인 완전 격리

## 이해관계자

| 역할 | 설명 |
|------|------|
| 최종 사용자 | 이메일 확인 및 AI 초안 검토 |
| 관리자 | AdminDO 대시보드 접근, 설정 변경 |
| AI 도구 | MCP 클라이언트 (Cursor 등) |

## KPI

- 엣지 응답 시간: < 100ms (전 세계)
- AI 초안 생성 시간: < 3초
- 메일박스당 격리 보장: 100%
