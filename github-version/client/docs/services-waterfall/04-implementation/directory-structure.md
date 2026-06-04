# 4.1 디렉토리 구조 (Directory Structure)

> 워터폴 4단계 구현 — 프로젝트의 디렉토리 구조와 파일 배치를 정의한다.

---

## 4.1.1 최상위 구조

```
agentic-inbox/
├── app/                          # v0 React SPA (Cloudflare Workers)
│   ├── app.tsx                   # React Router + Suspense
│   ├── components/
│   │   ├── layout/               # SidePanel, TopBar, ContentPanel
│   │   ├── modals/               # ComposeModal, DraftModal, AIChatModal
│   │   ├── ui/                   # shadcn/ui 기반 UI 컴포넌트
│   │   └── ...
│   ├── hooks/
│   │   ├── use-emails.ts
│   │   ├── use-mailboxes.ts
│   │   └── use-websocket.ts
│   ├── lib/
│   │   ├── api.ts                # HTTP 클라이언트 (axios/fetch)
│   │   ├── store.ts              # 상태 관리
│   │   └── utils.ts              # 유틸리티
│   └── vite.config.ts            # (수정됨) proxy 설정 포함
│
├── docs/                         # 프로젝트 문서
│   ├── v0/                       # Cloudflare Workers 설계 문서
│   ├── v1/                       # v1 독립 서비스 설계 문서
│   └── services-waterfall/       # v1 서비스 개발/운영 문서 ← 현재 작성 중
│       ├── 00-planning/
│       ├── 01-requirements/
│       ├── 02-system-design/
│       ├── 03-detailed-design/
│       ├── 04-implementation/
│       ├── 05-testing/
│       ├── 06-deployment/
│       └── 07-operations/
│
├── services/
│   ├── mail-server/              # Mail Server (Node.js/Express)
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── index.js          # Express 앱, 라우터
│   │   │   ├── db.js             # PostgreSQL Pool
│   │   │   └── seed.js           # 개발용 더미 데이터
│   │   ├── migrations/
│   │   │   └── 001_initial.sql   # 초기 스키마
│   │   └── .env                  # (gitignore) MAIL_SERVER_PORT
│   │
│   └── ai-agent/                 # AI Agent (Python/FastAPI)
│       ├── Dockerfile
│       ├── requirements.txt
│       ├── .env                  # (gitignore) OPENAI_API_KEY
│       └── main.py               # FastAPI 앱
│
├── workers/                      # v0 Cloudflare Workers (원본 보존)
│   ├── index.ts                  # DO Worker 진입점
│   ├── database.ts               # DO SQLite ORM
│   ├── routes/
│   │   ├── config.ts
│   │   ├── emails.ts
│   │   ├── folders.ts
│   │   ├── threads.ts
│   │   └── ai.ts
│   └── types.ts
│
├── .env.example                  # 환경변수 템플릿 (v1용)
├── .env                          # (gitignore) 실제 환경변수
├── docker-compose.yml            # v1 전체 스택
├── package.json                  # v0 + v1 공통 의존성
├── vite.config.ts               # v1 dev proxy 설정 (원본: vite.config.v0.ts)
├── vite.config.v0.ts            # v0 원본 백업
├── wrangler.jsonc               # v0 Cloudflare Workers 설정
├── tsconfig.json                # TypeScript 설정
├── tailwind.config.ts           # Tailwind 설정
└── README.md / README.v1.md     # 메인 README
```

---

## 4.1.2 v0 vs v1 파일 구분

| 환경 | 실행 파일 | 데이터 저장소 |
|------|----------|---------------|
| **v0** (Cloudflare) | `workers/index.ts` | Durable Object SQLite |
| **v1** (Independent) | `services/mail-server/src/index.js` + `services/ai-agent/main.py` | PostgreSQL |

### 스위칭 방법

```bash
# v0 실행 (Cloudflare Workers)
cp vite.config.v0.ts vite.config.ts
pnpm run dev -- --port 8787

# v1 실행 (Independent Services)
# (vite.config.ts는 이미 proxy 설정됨)
pnpm run dev -- --port 5173
```

---

## 4.1.3 중요 파일 설명

### `services/mail-server/src/db.js`

- PostgreSQL Connection Pool 관리
- 환경변수 `DATABASE_URL`에서 연결 문자열 읽기
- `initDb()`로 마이그레이션 자동 실행

### `services/mail-server/migrations/001_initial.sql`

- 단일 파일로 스키마 + 시드 데이터 통합
- 향후 버전은 `002_xxx.sql`, `003_xxx.sql` 형태로 추가

### `services/ai-agent/main.py`

- 단일 파일로 MVP 구현 (향후 모듈 분리 예정)
- FastAPI 라우터, OpenAI 호출, DB 조회 모두 포함

### `.env.example`

```env
# v1 환경변수 템플릿
DATABASE_URL=postgresql://postgres:paperclip@localhost:5432/agentic_inbox
OPENAI_API_KEY=sk-...
MAIL_SERVER_PORT=8080
AI_AGENT_PORT=8000
POSTGRES_PASSWORD=paperclip
```
