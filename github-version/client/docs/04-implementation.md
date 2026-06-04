# 04-Implementation — Agentic Inbox (v0)

## 구현 현황

| 모듈 | 상태 | 파일 | 비고 |
|------|------|------|------|
| Hono Worker | ✅ 완료 | `workers/app.ts` | 메인 엔트리, 이메일 핸들러 |
| REST API | ✅ 완료 | `workers/index.ts` | 전체 CRUD 엔드포인트 |
| MailboxDO | ✅ 완료 | `workers/durableObject/index.ts` | SQLite + Drizzle |
| EmailAgent | ✅ 완료 | `workers/agent/index.ts` | 9개 툴, AIChatAgent |
| EmailMCP | ✅ 완료 | `workers/mcp/index.ts` | MCP 서버 |
| AdminDO | ✅ 완료 | `workers/admin/index.ts` | CRM, 사용량 |
| React SPA | ✅ 완료 | `app/` | React Router v7, SSR |
| Email Sender | ✅ 완료 | `workers/email-sender.ts` | `send_email` 바인딩 |
| Tests | 🔶 부분 | `tests/admin-logic.test.ts` | 4개 단위 테스트 |

## 코드 구조

```
v0/agent-inbox/
├── wrangler.jsonc              # Workers 배포 설정
├── package.json                # React, Hono, Wrangler 의존성
├── vite.config.ts              # Vite + Wrangler 플러그인
├── workers/
│   ├── app.ts                  # 메인 Worker
│   ├── index.ts                # REST API 라우트
│   ├── email-sender.ts         # 발송 래퍼
│   ├── durableObject/
│   │   └── index.ts            # MailboxDO
│   ├── agent/
│   │   └── index.ts            # EmailAgent
│   ├── mcp/
│   │   └── index.ts            # EmailMCP
│   ├── admin/
│   │   └── index.ts            # AdminDO
│   └── db/
│       └── schema.ts           # Drizzle ORM 스키마
├── app/                        # React SPA
│   ├── root.tsx
│   ├── routes.ts
│   └── routes/                 # 페이지 컴포넌트
├── shared/
│   ├── dates.ts                # 날짜 포맷 유틸
│   └── folders.ts              # 폴리 상수
└── tests/
    └── admin-logic.test.ts
```

## 환경 설정

```bash
cd v0/agent-inbox
npm install
npx wrangler login
npx wrangler r2 bucket create agentic-inbox
cp .dev.vars.example .dev.vars
npm run dev
```

## 주요 스크립트

| 스크립트 | 명령 | 설명 |
|----------|------|------|
| `dev` | `react-router dev` | 로컬 개발 서버 (:5173) |
| `build` | `react-router build` | 프로덕션 빌드 |
| `deploy` | `npm run build && wrangler deploy` | 빌드 + 배포 |
| `cf-typegen` | `wrangler types` | `worker-configuration.d.ts` 생성 |
| `test` | `node --experimental-strip-types --test tests/*.test.ts` | 테스트 |

## 의존성 버전

| 패키지 | 버전 | 용도 |
|--------|------|------|
| hono | ^4.x | 웹 프레임워크 |
| react | ^19.0.0 | UI |
| react-router | ^7.x | 라우팅 + SSR |
| drizzle-orm | ^0.x | SQLite ORM |
| @cloudflare/ai-chat | ^0.x | AIChatAgent |
| @cloudflare/vite-plugin | ^0.x | Vite 통합 |
| wrangler | ^4.x | CLI |
