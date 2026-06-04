# v0 Technology Stack

## Runtime & Platform

| 영역 | 기술 | 버전 | 용도 |
|------|------|------|------|
| **Runtime** | Cloudflare Workers | V8 Isolate | 서버리스 컴퓨팅 |
| **Compatibility Date** | 2025-11-28 | — | Workers API 호환성 |
| **Deploy Tool** | Wrangler | v4.74.0 | CLI 배포/로컬 개발 |

## Framework & Libraries

| 영역 | 기술 | 버전 | 용도 |
|------|------|------|------|
| **API Framework** | Hono | latest | 경량 HTTP 라우터 |
| **Frontend Framework** | React Router (v7) | latest | SPA + SSR |
| **Bundler** | Vite | latest | 빌드/개발 서버 |
| **CSS** | Tailwind CSS v4 | latest | 유틸리티 CSS |
| **ORM** | Drizzle ORM | latest | SQLite 쿼리 빌더 |
| **Schema Validation** | Zod | latest | 요청 본문 검증 |
| **Email Parsing** | postal-mime | latest | 이메일 MIME 파싱 |
| **AI SDK** | ai (Vercel AI SDK) | v6 | streamText, generateText |
| **Workers AI Provider** | workers-ai-provider | latest | Cloudflare AI 연동 |
| **AI Chat Agent** | @cloudflare/ai-chat | latest | AIChatAgent 베이스 클래스 |
| **Auth** | jose | latest | JWT 검증 |
| **CORS** | hono/cors | built-in | CORS 미들웨어 |

## Cloudflare Services

| 서비스 | 바인딩 | 용도 |
|--------|--------|------|
| **Workers AI** | `env.AI` | AI 모델 추론 (kimi-k2.5, Llama 등) |
| **R2** | `env.BUCKET` | 첨부파일, 메일박스 설정 저장 |
| **Durable Objects** | `env.MAILBOX`, `env.EMAIL_AGENT`, `env.EMAIL_MCP` | 상태ful 컴퓨팅 |
| **Email Send** | `env.EMAIL` | 발신 이메일 전송 |
| **Email Routing** | — | 수신 이메일 수신 (Workers 트리거) |

## AI Models

| 모델 | 용도 | 크레딧 |
|------|------|--------|
| `@cf/moonshotai/kimi-k2.5` | 메인 AI (채팅, 답변 생성) | Workers AI 무료 할당량 내 |
| `@cf/meta/llama-3.1-8b-instruct-fast` | 프롬프트 인젝션 검사 | Workers AI 무료 할당량 내 |
| `@cf/meta/llama-4-scout-17b-16e-instruct` | Draft 검증/정제 | Workers AI 무료 할당량 내 |

## 개발 환경

| 도구 | 버전 | 용도 |
|------|------|------|
| Node.js | v24.6.0 | 런타임 |
| npm | 11.5.1 | 패키지 매니저 |
| TypeScript | latest | 타입 시스템 |

## 폴더 구조

```
agentic-inbox/
├── app/                    # React Router 프론트엔드
├── workers/                # Cloudflare Workers 백엔드
│   ├── app.ts              # 메인 entry (Hono + Email Handler)
│   ├── index.ts            # API 라우트 정의
│   ├── agent/              # EmailAgent (AIChatAgent)
│   │   └── index.ts
│   ├── durableObject/      # MailboxDO
│   │   └── index.ts
│   ├── lib/                # 공유 유틸리티
│   │   ├── ai.ts           # 인젝션/검증
│   │   ├── attachments.ts  # 첨부파일 처리
│   │   ├── email-helpers.ts
│   │   ├── schemas.ts      # 타입/검증
│   │   ├── tools.ts        # AI 도구 구현
│   │   └── mailbox.ts      # 미들웨어
│   ├── routes/             # 라우트 핸들러
│   │   └── reply-forward.ts
│   ├── mcp/                # MCP 서버
│   └── types.ts            # 전역 타입
├── shared/                 # 프론트/백 공유 코드
│   └── folders.ts
├── docs/                   # 프로젝트 문서
├── wrangler.jsonc          # Workers 설정
└── vite.config.ts          # Vite 설정
```

## 주의사항

1. **Vite dedupe**: `react`, `react-dom`, `react-router`의 dedupe 설정 필수 (SSR/클라이언트 React 인스턴스 중복 방지)
2. **AI 바인딩**: 로컬 개발에서도 `env.AI`는 원격 Cloudflare API를 호출함 (`AI bindings always access remote resources`)
3. **Durable Object SQLite**: 로컬에서는 `~/.wrangler/state/v3/` 또는 `.wrangler/state/v3/`에 저장됨
