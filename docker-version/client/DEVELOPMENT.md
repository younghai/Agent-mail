# v0 Agentic Inbox — 개발 가이드

> **목표**: 로컬 개발 서버를 5분 내로 실행하고, 주요 소스의 역할을 파악

---

## 1. 사전 준비

- Node.js 22+
- pnpm 10+
- Cloudflare 계정 (Workers AI, R2 사용을 위해)

---

## 2. 설치 및 실행

```bash
cd v0/agent-inbox
pnpm install

# Cloudflare 로그인 (최초 1회)
pnpm dlx wrangler login

# R2 버킷 생성 (최초 1회)
pnpm dlx wrangler r2 bucket create agentic-inbox

# 로컬 개발 변수 (Access 인증을 스킵. 값 비워두어도 됨)
cp .dev.vars.example .dev.vars

# 개발 서버 실행
pnpm run dev
```

브라우저에서 http://localhost:5173 접속.

---

## 3. 로컬 vs 배포 차이

| 기능 | 로컬 (`pnpm run dev`) | 배포 (Cloudflare) |
|------|----------------------|-------------------|
| Durable Objects | 로컬 SQLite 에뮬레이션 (`~/.wrangler/state/v3/do/...`) | 실제 DO 인스턴스 |
| R2 | **실제 원격 버킷** 연결 (preview) | 실제 버킷 |
| Workers AI | **실제 API 호출** (크레딧 소모) | 실제 API |
| 이메일 수신 | ❌ 불가 (Email Routing이 로컬을 가리킬 수 없음) | ✅ 가능 |
| 이메일 발송 | 제한적 (send_email 바인딩 에뮬레이션) | ✅ 가능 |
| Access 인증 | 자동 스킵 (`import.meta.env.DEV`) | ✅ Cloudflare Access JWT |

> ⚠️ **주의**: 로컬 개발 중에도 Workers AI와 R2는 **실제 리소스**를 사용하므로 비용이 발생할 수 있습니다.

---

## 4. 주요 스크립트

| 스크립트 | 명령어 | 설명 |
|----------|--------|------|
| `dev` | `react-router dev` | Vite + Wrangler 플러그인 로컬 개발 |
| `build` | `react-router build` | 프로덕션 빌드 |
| `deploy` | `pnpm run build && wrangler deploy` | 빌드 + 배포 |
| `preview` | 빌드 후 Vite preview | 로컬 프리뷰 |
| `cf-typegen` | `wrangler types` | `worker-configuration.d.ts` 자동 생성 |
| `typecheck` | 타입 체크 전체 | CI용 |
| `test` | `node --experimental-strip-types --test tests/*.test.ts` | 테스트 실행 |

---

## 5. 소스 코드 네비게이션

| 파일/폴리 | 역할 |
|-----------|------|
| `workers/app.ts` | 메인 Worker: 인증, MCP, API 마운트, 에이전트 WS, SSR 폴리백, 이메일 핸들러 |
| `workers/index.ts` | REST API: 메일박스, 이메일, 폴리, 스레드, 검색, 첨부파일, 관리자 CRM |
| `workers/durableObject/index.ts` | `MailboxDO`: 메일박스별 SQLite 스키마 및 CRUD |
| `workers/agent/index.ts` | `EmailAgent`: AIChatAgent, 9개 이메일 툴, Workers AI 연동 |
| `workers/mcp/index.ts` | `EmailMCP`: 외부 AI 도구용 MCP 서버 |
| `workers/admin/index.ts` | `AdminDO`: 전역 CRM, 작업, 사용량 분석 |
| `workers/email-sender.ts` | Cloudflare `send_email` 바인딩 래퍼 |
| `app/root.tsx` | React 루트: QueryClient, Kumo UI 프로바이더 |
| `app/routes.ts` | 프론트엔드 라우트 정의 |
| `wrangler.jsonc` | Cloudflare Workers 배포 설정 |

---

## 6. 테스트

```bash
npm test
```

현재 `tests/admin-logic.test.ts`에 4개의 단위 테스트가 있습니다.

---

## 7. 디버깅 팁

### 7.1 Wrangler 로그

```bash
pnpm dlx wrangler tail
# 실시간 로그. 로컬 dev 서버에서는 터미널에 직접 출력됨
```

### 7.2 Durable Object 로컬 상태 확인

```bash
# macOS 기준
ls ~/.wrangler/state/v3/do/
# SQLite 파일을 직접 열어서 데이터 확인 가능
```

### 7.3 Workers AI 응답 디버그

`workers/agent/index.ts`의 `onChatMessage`에서 `console.log` 추가.
로컬 dev 서버에서는 터미널에 스트리밍 응답이 실시간 출력됩니다.

### 7.4 프론트엔드 API 프록시

`vite.config.standalone.ts`를 참고하여, v1-present의 mail-server를 로컬 API로 사용할 수도 있습니다.

```ts
// vite.config.standalone.ts 예시
server: {
  proxy: {
    '/api': 'http://localhost:8080',
    '/agents': 'http://localhost:8000',
  }
}
```

---

## 8. CI/CD (GitHub Actions)

푸시 및 PR 시 자동으로 typecheck → test → build가 실행됩니다.

| 워크플로우 | 트리거 | 주요 동작 |
|------------|--------|----------|
| `ci.yml` | 모든 push, PR | typecheck + test + build (시크릿 불필요) |
| `deploy.yml` | main push, workflow_dispatch | typecheck + test + wrangler deploy (main + tail-consumer) |
| `preview.yml` | PR opened/sync/reopen (fork 제외) | typecheck + test + wrangler versions upload |

**필요한 GitHub 시크릿** (Settings > Secrets and variables > Actions):
- `CLOUDFLARE_API_TOKEN` — Workers:Edit 권한
- `CLOUDFLARE_ACCOUNT_ID` — Cloudflare 계정 ID

**권장 브랜치 보호**: main 브랜치에 `build-test` status check 필수 설정.

자세한 내용: `docs/change-logs/2026-05-08-v0-p0-github-actions-ci.md`

---

## 9. 알려진 제약사항

- **메일박스 삭제 시 데이터 정리**: Worker가 메일박스 설정 JSON, DO SQLite 데이터, R2 첨부파일 blob을 함께 정리합니다. 삭제 경로 변경 시 `workers/index.ts`와 `MailboxDO.listAttachmentKeys()`/`clearMailboxData()`를 같이 검증해야 합니다.
- **이메일 수신 테스트는 배포 후에만 가능**: Email Routing catch-all은 로컬호스트를 대상으로 할 수 없음
- **Workers AI 비용**: 로컬에서도 실제 과금됨. 테스트 시 짧은 프롬프트 사용 권장
