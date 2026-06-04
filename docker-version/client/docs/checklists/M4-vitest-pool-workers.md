# M4 — v0 vitest `pool=workers` 실 DO 통합 테스트

> 시작: 2026-05-09
> 완료: 2026-05-09
> 워크플로우: plan → code → test → verify → checklist update
> 의존: F-M3 완료 (v0 127 passed, mock 기반 통합)

---

## 목표

Mock 기반 테스트만 있는 현재 상태에 `@cloudflare/vitest-pool-workers`로 **실제 Workers/DO/R2 환경의 통합 테스트**를 도입. 메일박스 DO의 실 SQLite 동작, R2 storage_key 라이프사이클, ai_chat agent 트리거를 작은 happy-path 시나리오로 검증.

---

## 계획 (Plan)

### 의존성 / 설정
- [x] `pnpm add -D vitest @cloudflare/vitest-pool-workers` 설치 (v4.1.5, v0.16.3)
- [x] `vitest.config.ts` 신규 — `cloudflareTest()` 플러그인, miniflare inline bindings
- [x] `tests/integration/env.d.ts` — `/// <reference path>` cloudflare:test 타입 선언
- [x] `package.json` scripts — 기존 `test`(Node native runner)는 유지, 신규 `test:integration` 추가

### 테스트 디렉토리
- [x] `tests/integration/` 신규 — vitest로 동작
- [x] 기존 `tests/*.test.ts` (127 passed)는 Node native에 그대로 (회귀 보호)

### 통합 테스트 시나리오 (≥6)
- [x] DO + SQLite happy path: mailbox 이메일 저장 → 읽기 → 마킹 → metrics
- [x] DO 동시성: Promise.all로 같은 이메일에 updateEmail 동시 호출 → 최종 상태 일관
- [x] R2 storage_key 라이프사이클: PUT → GET → DELETE → null
- [x] rate-limit 통합: Workers KV storage 기반 rate-limit helper 검증
- [x] Cost guard 통합: admin DO `recordCostAndCheck` 호출 → CostCheckResult 반환
- [x] Tail handler 시나리오: mock TraceItem[] → processTailEvents → exception 카운트 일치

---

## 테스트 코드 (Test)

각 시나리오 1 spec 파일:
- [x] `tests/integration/mailbox-do.spec.ts` — DO + SQLite (3 tests)
- [x] `tests/integration/r2-attachment.spec.ts` — R2 라이프사이클 (3 tests)
- [x] `tests/integration/agent-rate-limit.spec.ts` — rate limit 통합 (3 tests)
- [x] `tests/integration/cost-guard.spec.ts` — admin DO recordCostAndCheck (3 tests)
- [x] `tests/integration/tail-handler.spec.ts` — tail consumer 통합 (4 tests)
- [x] `tests/integration/concurrency.spec.ts` — DO concurrency (3 tests)

기준: 6 specs, 각 spec ≥1 테스트, 합계 ≥10. → **19 passed** ✅

---

## 검증 (Verify)

```bash
cd "/Users/young/Downloads/personal_project/using mail_AI/v0/agent-inbox"
pnpm install        # ✅ Done in 4.2s
pnpm typecheck      # ✅ 0 errors
pnpm test           # ✅ 127 passed (회귀 0)
pnpm test:integration  # ✅ 19 passed (6 files)
```

기준:
- [x] typecheck 0 errors
- [x] 기존 127 tests 그대로 passed
- [x] 신규 통합 테스트 ≥10 passed (실제: 19 passed)
- [x] 빌드 (`pnpm build`) — vitest config는 별도 파일이므로 빌드 영향 없음

---

## 체크리스트 종료 정리

- [x] `docs/change-logs/2026-05-09-v0-vitest-pool-workers.md`
- [x] MILESTONE-PROGRESS-2026-05-09.md M4 ⏳→✅ 갱신
- [x] 누적 게이트 표 갱신
- [x] 본 체크리스트 모든 박스 [x]

---

## 결과 (Result)

- 신규 spec 수: **6**
- 신규 테스트 수: **19**
- 기존 테스트 회귀: **0** (127 passed)
- typecheck: **0 errors**
- 보고서: `docs/change-logs/2026-05-09-v0-vitest-pool-workers.md`
