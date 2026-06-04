# 2026-05-09 — v0 Admin Cost Dashboard (M5)

## Summary

Added an Admin UI cost dashboard exposing AI spend trends, budget progress, and per-model usage distribution. Data comes from existing `cost:day:*` / `cost:month:*` DO storage keys (written by `recordCostAndCheck`) and the `agent_usage_events` SQL table (written by `recordAgentUsage`). No schema changes required.

## Changed Files

| File | Change |
|---|---|
| `workers/admin/cost-aggregation.ts` | NEW — pure helper functions: `buildDailyCostSeries`, `buildMonthlyCostSeries`, `aggregateModelUsage` |
| `workers/admin/index.ts` | NEW methods: `getDailyCostSeries`, `getMonthlyCostSeries`, `getModelUsageBreakdown` |
| `workers/index.ts` | NEW REST endpoints: `GET /api/v1/admin/cost/daily`, `GET /api/v1/admin/cost/monthly`, `GET /api/v1/admin/cost/models` |
| `app/routes/admin-cost.tsx` | NEW React page: daily line chart, monthly bar+progress, model usage table |
| `app/routes/admin.tsx` | Added "Cost Dashboard" nav link in header |
| `app/routes.ts` | Registered `admin/cost` route |
| `app/services/api.ts` | Added `getAdminCostDaily`, `getAdminCostMonthly`, `getAdminCostModels` API methods |
| `tests/admin-cost-aggregation.test.ts` | NEW — 13 node unit tests for pure aggregation helpers |
| `tests/integration/admin-cost.spec.ts` | NEW — 3 vitest integration tests for AdminDO cost methods |

## New Endpoints

- `GET /api/v1/admin/cost/daily?days=30` — daily USD spend series with limit
- `GET /api/v1/admin/cost/monthly?months=6` — monthly USD spend series with limit
- `GET /api/v1/admin/cost/models?days=7` — per-model/operation usage aggregation

Auth: same `requireAdminRole(c, ["admin", "manager", "operator", "viewer"])` as other admin read endpoints.

## Implementation Notes

- Cost series data read from `ctx.storage.list({ prefix: "cost:day:" })` / `ctx.storage.list({ prefix: "cost:month:" })` — keys set by existing `recordAndCheck` in `budget.ts`
- Model breakdown queries `agent_usage_events` SQL table with `GROUP BY model, operation` — reuses existing data, zero schema change
- `getDailyCostSeries` / `getMonthlyCostSeries` accept optional `now` parameter (mirrors `recordAndCheck` pattern) for testability
- React page uses inline SVG line chart for daily trend, HTML table + progress bars for monthly/model views — no chart library dependency added

## Test Results

- Unit (node native): 127 existing + 13 new = **140 passed, 0 failed**
- Integration (vitest pool=workers): 19 existing + 3 new = **22 passed, 0 failed**
- Typecheck: **0 errors**
- Regressions: **0**
