# IMPL-REPORT — #18 Timeline Dashboard (Phase D-1)

## 1. Scope — changed/created files

| File | Action |
|------|--------|
| `/Users/young/Downloads/personal_project/using mail_AI/v0/agent-inbox/app/lib/task-timeline.ts` | **Created** — pure helper exporting `groupTasksByTimeline`, `TimelineTab`, `TimelineBucket` |
| `/Users/young/Downloads/personal_project/using mail_AI/v0/agent-inbox/app/components/TaskTimelineBoard.tsx` | **Created** — Day/Week/Month tab board component |
| `/Users/young/Downloads/personal_project/using mail_AI/v0/agent-inbox/tests/task-timeline.test.ts` | **Created** — 14 unit tests for `groupTasksByTimeline` |
| `/Users/young/Downloads/personal_project/using mail_AI/v0/agent-inbox/app/routes/admin.tsx` | **Modified** — replaced tasks table with `TaskTimelineBoard`; removed dead `updateTask`/`patchTask`/`latestTasks` |

## 2. Applied changes

- **`app/lib/task-timeline.ts`** — Timezone-safe date math using local `Date` methods (`getFullYear`, `getMonth`, `getDate`). Three grouping functions:
  - `groupByToday`: 5 buckets — 기한초과 / 오늘 / 내일 / 이번 주 / 미정
  - `groupByWeek`: 8 buckets — Mon–Sun + 미정 (week = Mon of current week → Sun)
  - `groupByMonth`: 6 buckets — W1–W5 (by `Math.ceil(day/7)`) + 미정
  - All accept a controlled `now: Date` parameter for testability.

- **`app/components/TaskTimelineBoard.tsx`** — React component with:
  - Day / Week / Month tab bar (`bg-kumo-brand text-white` active state)
  - Horizontal scrollable column layout per bucket
  - Visual rules from spec §3.5:
    - Today column: `text-kumo-brand` header
    - Overdue column: `text-kumo-destructive` header + `bg-kumo-tint` background
    - 미정 column: `opacity-55`
    - Urgent task cards: 4px left border `#d8b15f` (warning orange)
    - Overdue task cards: 4px left border `#ef4444` (destructive red) + `rgba(255,235,235,0.5)` pink background
    - Hover: `shadow-md` lift
  - Task cards show title (linked to detail page), client, owner, status, priority badge, due date, completion bar

- **`app/routes/admin.tsx`** — In the `#tasks` CollapsibleSection:
  - Replaced the 6-column `<table>` with `<TaskTimelineBoard>` (receives `filteredTasks`, `clients`, `isDemoMode`, `adminBase`)
  - Preserved filter controls (client filter, status filter) and CSV export button above the board
  - Removed `updateTask` mutation, `patchTask` helper, `latestTasks` memo (no longer needed without inline table editing)
  - Added import for `TaskTimelineBoard`

- **`tests/task-timeline.test.ts`** — 14 test cases covering:
  1. Empty input → correct bucket structure
  2. Today tab groups tasks to all 5 buckets
  3. Week tab labels Mon–Sun + 미정
  4. Month tab assigns tasks to W1–W5 by `ceil(day/7)`
  5. Overdue tasks → overdue bucket
  6. Tasks without due date → 미정 (all 3 tabs)
  7. Urgent priority preserved in bucket output
  8. Now boundary: task due exactly today at midnight and end-of-day
  9. Week tab assigns to correct day columns
  10. Week tab sends outside-week tasks to 미정
  11. Month tab sends outside-month tasks to 미정
  12. Today tab isOverdue/isToday flags
  13. Month tab marks current week with isToday
  14. Week tab marks today column with isToday

## 3. Validation

### Typecheck (0 errors)
```
$ pnpm exec tsc -b
(no output — exit 0)
```

### Unit tests (185 pass, 0 fail — 14 new)
```
$ pnpm test

ℹ tests 185
ℹ suites 8
ℹ pass 185
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ duration_ms 172.034334
```

### Integration tests (23 pass, 0 fail)
```
$ pnpm test:integration --run

 Test Files  8 passed (8)
      Tests  23 passed (23)
   Duration  1.65s
```

## 4. Non-changes

- No worker (`workers/`) changes
- No DO method or migration changes
- No backend API route changes
- No auth / CORS / cost-guard / security file changes
- `wrangler.jsonc`, `package.json`, `pnpm-lock.yaml` untouched
- No new npm dependencies
- Other admin pages (cost, clients) untouched
- Sidebar untouched
- Did NOT implement #20 (Inbox Zero), #7 (Segmentation), or #6 (SLA)
