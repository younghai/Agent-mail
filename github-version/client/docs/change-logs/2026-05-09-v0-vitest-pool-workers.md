# 2026-05-09 — M4: v0 vitest-pool-workers 통합 테스트 도입

## 변경 파일 목록

| 파일 | 변경 종류 |
|------|-----------|
| `vitest.config.ts` | 신규 — cloudflareTest 플러그인 설정 (miniflare inline bindings) |
| `tests/integration/worker-entry.ts` | 신규 — 테스트용 최소 Worker 엔트리 (MailboxDO + AdminDO만 export) |
| `tests/integration/env.d.ts` | 신규 — cloudflare:test 타입 선언 (/// reference path) |
| `tests/integration/mailbox-do.spec.ts` | 신규 — MailboxDO SQLite happy path 3 tests |
| `tests/integration/r2-attachment.spec.ts` | 신규 — R2 라이프사이클 3 tests |
| `tests/integration/cost-guard.spec.ts` | 신규 — AdminDO recordCostAndCheck 3 tests |
| `tests/integration/agent-rate-limit.spec.ts` | 신규 — rate-limit helper in Workers runtime 3 tests |
| `tests/integration/tail-handler.spec.ts` | 신규 — processTailEvents in Workers runtime 4 tests |
| `tests/integration/concurrency.spec.ts` | 신규 — MailboxDO concurrency 3 tests |
| `tests/integration/__stubs__/ajv-stub.ts` | 신규 — ajv stub (사용되지 않음, 잔류 파일) |
| `package.json` | 수정 — `test:integration` script 추가 |
| `tsconfig.cloudflare.json` | 수정 — 변경 없음 (최종 원복) |

## 통합 테스트 매트릭스

| 파일 | 시나리오 | Workers 헬퍼 | 결과 |
|------|---------|-------------|------|
| `mailbox-do.spec.ts` | createEmail → getEmails (SQLite happy path) | `env`, `runInDurableObject` | ✅ pass |
| `mailbox-do.spec.ts` | updateEmail read=true → getEmails 검증 | `env`, `runInDurableObject` | ✅ pass |
| `mailbox-do.spec.ts` | getAdminMetrics 카운트 반영 | `env`, `runInDurableObject` | ✅ pass |
| `r2-attachment.spec.ts` | PUT → GET 바이트 동일 | `env` (BUCKET) | ✅ pass |
| `r2-attachment.spec.ts` | DELETE → GET null 반환 | `env` (BUCKET) | ✅ pass |
| `r2-attachment.spec.ts` | storeAttachments helper → R2 round-trip | `env` (BUCKET) | ✅ pass |
| `cost-guard.spec.ts` | recordCostAndCheck 첫 호출 CostCheckResult | `env`, `runInDurableObject` | ✅ pass |
| `cost-guard.spec.ts` | 누적 비용 합산 | `env`, `runInDurableObject` | ✅ pass |
| `cost-guard.spec.ts` | 일일 예산 초과 → withinDailyBudget=false | `env`, `runInDurableObject` | ✅ pass |
| `agent-rate-limit.spec.ts` | 첫 호출 허용, remaining=limit-1 | `env` (SLACK_DEDUP_KV) | ✅ pass |
| `agent-rate-limit.spec.ts` | 한도 초과 → denied | `env` (SLACK_DEDUP_KV) | ✅ pass |
| `agent-rate-limit.spec.ts` | 다른 key는 독립 | `env` (SLACK_DEDUP_KV) | ✅ pass |
| `tail-handler.spec.ts` | 예외 없음 → capture/alert 미호출 | Workers runtime (vi.fn) | ✅ pass |
| `tail-handler.spec.ts` | 예외 1개 → capture 1회 | Workers runtime (vi.fn) | ✅ pass |
| `tail-handler.spec.ts` | outcome=exception → alert 전송 | Workers runtime (vi.fn) | ✅ pass |
| `tail-handler.spec.ts` | 다중 이벤트 → 카운트 누적 | Workers runtime (vi.fn) | ✅ pass |
| `concurrency.spec.ts` | Promise.all createEmail 5개 → 일관 저장 | `env`, `runInDurableObject` | ✅ pass |
| `concurrency.spec.ts` | 동시 updateEmail → 최종 상태 일관 | `env`, `runInDurableObject` | ✅ pass |
| `concurrency.spec.ts` | 병렬 insert → metrics 일관 | `env`, `runInDurableObject` | ✅ pass |

**합계: 6 spec 파일, 19 tests passed**

## 설정 핵심 결정

### 1. wrangler.jsonc 대신 inline bindings 사용
`wrangler.jsonc`에는 `tail_consumers` (외부 서비스 참조)와 `send_email` (miniflare 미지원)이 있어 파싱 시 startup 오류가 발생. `cloudflareTest()` 플러그인의 `miniflare.*` 옵션에 직접 binding을 인라인으로 정의해 해결.

### 2. 최소 Worker 엔트리 (`worker-entry.ts`)
`workers/app.ts`를 main으로 쓰면 `EmailMCP` → `@modelcontextprotocol/sdk` → `ajv` CJS `require('./core')` 패턴이 Workers 런타임에서 실패. `MailboxDO` + `AdminDO`만 export하는 최소 엔트리를 별도로 작성해 회피.

### 3. `useSQLite: true` + migrations 필수
miniflare DO 바인딩에 `useSQLite: true`를 설정하지 않으면 `ctx.storage.sql`이 비활성화되어 MailboxDO 생성자의 `applyMigrations()` 호출이 실패.

### 4. `cloudflare:test` 타입 선언
`@cloudflare/vitest-pool-workers` v0.16.3에는 루트 타입 export가 없음. `types/cloudflare-test.d.ts`를 `/// <reference path="...">` 로 직접 참조.

## 한계 (실 Cloudflare 의존성)

| 기능 | 이유 | 대안 |
|------|------|------|
| Workers AI (env.AI) | miniflare가 AI binding을 에뮬레이션하지 않음 | staging 환경 e2e (M5 이후) |
| Email Routing (send_email) | miniflare 미지원 | staging 배포 후 실제 메일 수신 테스트 |
| Tail Consumer 서비스 바인딩 | 외부 서비스 참조 | staging의 두 Worker 동시 배포 후 검증 |
| EmailAgent AI 흐름 | Workers AI 의존 | staging 환경 e2e (M5 이후) |

## 다음 단계 (M5 이후)

- staging 환경에서 Workers AI 바인딩 포함 EmailAgent 통합 테스트
- Email Routing 실제 catch-all 수신 검증
- Tail Consumer ↔ 메인 Worker 서비스 바인딩 e2e
- vitest-pool-workers 시나리오 확장 (threads, search, folder lifecycle)
