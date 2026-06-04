# M5 — v0 Admin UI 비용 대시보드

> 시작: 2026-05-09
> 워크플로우: plan → code → test → verify → checklist update
> 의존: D-M3 (cost guard), M4 (vitest pool=workers)

---

## 목표

현재 cost guard는 **임계 초과 시 alert만** 보내고, 운영자가 누적 추세나 모델별 분포를 보려면 별도 도구 필요. 본 마일스톤은 Admin UI에 **누적 비용 그래프 + 모델별 분포 + 일/월 사용 현황**을 표시.

---

## 계획 (Plan)

### 데이터 소스
- [x] `recordAgentUsage` 호출이 admin DO storage에 누적 — `agent_usage_events` SQL 테이블 활용
- [x] cost guard `recordAndCheck`이 일/월 키로 누적 — `cost:day:YYYY-MM-DD`, `cost:month:YYYY-MM` 키
- [x] 두 데이터를 admin DO에서 조회하는 메서드 신규: `getDailyCostSeries`, `getMonthlyCostSeries`, `getModelUsageBreakdown`

### 백엔드 라우트
- [x] `workers/admin/index.ts`의 AdminDO에 다음 메서드 추가:
  - `async getDailyCostSeries(days: number = 30): Promise<DailyCostPoint[]>`
  - `async getMonthlyCostSeries(months: number = 6): Promise<MonthlyCostPoint[]>`
  - `async getModelUsageBreakdown(days: number = 7): Promise<ModelUsageRow[]>`
- [x] `workers/index.ts`에 endpoint 추가 (`/api/v1/admin/` prefix 통일):
  - `GET /api/v1/admin/cost/daily?days=30`
  - `GET /api/v1/admin/cost/monthly?months=6`
  - `GET /api/v1/admin/cost/models?days=7`

### 프론트엔드 (React Router v7)
- [x] `app/routes/admin-cost.tsx` 신규 — Dashboard 페이지 (inline SVG line chart, progress bar, model table)
- [x] 차트 라이브러리: 없음 확인 → 추가 의존성 없이 SVG/HTML로 구현
- [x] `app/routes/admin.tsx` 헤더에 "Cost Dashboard" 링크 추가
- [x] `app/routes.ts`에 `route("admin/cost", "routes/admin-cost.tsx")` 등록

### 컴포넌트
- [x] `DailyCostChart` (admin-cost.tsx 내 inline) — SVG line chart + bar sparklines
- [x] `MonthlyCostChart` (admin-cost.tsx 내 inline) — progress bar per month
- [x] `ModelUsageTable` (admin-cost.tsx 내 inline) — model/operation/count/tokens table

---

## 테스트 코드 (Test)

### 단위 테스트 (Node native, 13개)
- [x] `tests/admin-cost-aggregation.test.ts`:
  - buildDailyCostSeries returns chronological series for exact count of days
  - buildDailyCostSeries pads zero for missing days
  - buildDailyCostSeries includes dailyLimitUsd on every point
  - buildDailyCostSeries with empty data returns all-zero series
  - buildDailyCostSeries with partial data fills in gaps correctly
  - buildDailyCostSeries with days=1 returns single point for endDay
  - buildMonthlyCostSeries returns chronological series for exact count of months
  - buildMonthlyCostSeries pads zero for missing months
  - buildMonthlyCostSeries includes monthlyLimitUsd on every point
  - buildMonthlyCostSeries wraps correctly across year boundary
  - aggregateModelUsage groups by model+operation and sums tokens
  - aggregateModelUsage sorts by count descending
  - aggregateModelUsage returns empty array for empty input

### 통합 테스트 (vitest, 3개)
- [x] `tests/integration/admin-cost.spec.ts`:
  - getDailyCostSeries returns a series with correct length and fields
  - getMonthlyCostSeries returns a series with correct length and fields
  - getModelUsageBreakdown returns grouped rows from agent_usage_events

---

## 검증 (Verify)

```bash
cd "/Users/young/Downloads/personal_project/using mail_AI/v0/agent-inbox"
pnpm typecheck 2>&1 | tail -10
pnpm test 2>&1 | tail -10
pnpm test:integration 2>&1 | tail -10
```

기준:
- [x] typecheck 0 errors
- [x] 기존 127 Node tests + 신규 13 = 140 passed
- [x] 기존 19 integration + 신규 3 = 22 passed
- [x] 회귀 0

---

## 체크리스트 종료 정리

- [x] `docs/change-logs/2026-05-09-v0-admin-cost-dashboard.md`
- [x] 통합 progress 트래커 M5 ⏳→✅ (`docs/MILESTONE-PROGRESS-2026-05-09.md`)
- [x] 누적 게이트 표 갱신
- [x] 본 체크리스트 모든 박스 [x]

---

## 결과 (Result)

- 신규 단위 테스트 수: 13
- 신규 통합 테스트 수: 3
- 변경 파일 수: 9
- 보고서: `docs/change-logs/2026-05-09-v0-admin-cost-dashboard.md`
