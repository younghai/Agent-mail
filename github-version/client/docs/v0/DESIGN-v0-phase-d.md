# DESIGN — v0 Agent Inbox Phase D (Operational Dashboards)

> 작성일: 2026-05-31
> 모드: Claude (design) → GLM 5.1 (impl) → Claude (review)
> 의존 컨텍스트: Phase A + B + C 완료 (커밋 a7dd1b3..154ba89)

## 0. Goal / Non-Goals

### Goal
v0에 운영 메트릭과 메일 관리 표면 추가. 모두 기존 데이터 기반 — 신규 마이그레이션 최소화.

### Non-Goals
- 새 DO 마이그레이션 추가 (모두 기존 컬럼 활용)
- 신규 의존성 추가
- 인증·CORS·Cost Guard 등 보안 표면 변경 (Claude만 처리)

## 1. Phase D 4개 항목 — 개요

| # | 항목 | 신규 마이그레이션 | 신규 라우트 | 신규 컴포넌트 |
|---|------|------------------|------------|---------------|
| 18 | Timeline dashboard | 없음 | 없음 (`admin/tasks` 재사용) | 1 (탭 보드) |
| 20 | Inbox Zero mode | 없음 | 1 (`/mailbox/:id/inbox-zero`) | 1 |
| 7 | Customer segmentation | 없음 (in-memory) | 1 (`/api/v1/.../segments`) | 1 (lib) + UI |
| 6 | SLA dashboard | 없음 (`emails.date` 기반) | 1 (`/api/v1/.../admin/sla`) | 1 라우트 페이지 |

각 항목은 **순차 위임**: 한 번에 한 항목씩 GLM에 위임 → Claude가 diff 리뷰 → 검증 통과 시 다음.

## 2. 사전 컨텍스트 (GLM 워커 필독)

### 2.1 기술 스택
- React 19 + React Router v7 + kumo design system + Phosphor icons
- tanstack-query for data fetching
- Cloudflare Workers + Hono + Durable Objects (SQLite via Drizzle)
- 테스트: `node --test` for unit, `vitest pool=workers` for integration

### 2.2 파일 위치 컨벤션
- 라우트 컴포넌트: `app/routes/<name>.tsx`
- 라우트 등록: `app/routes.ts`
- 공유 컴포넌트: `app/components/<Name>.tsx`
- 훅: `app/hooks/<useName>.ts`
- 쿼리: `app/queries/<name>.ts` + `app/queries/keys.ts`
- API client: `app/services/api.ts` (이미 listFolders, recordAgentFeedback 등 패턴 존재)
- 순수 라이브러리: `app/lib/<name>.ts` (`token-estimate.ts` 참고)
- 워커 라우트: `workers/index.ts`
- DO 메서드: `workers/durableObject/index.ts`
- 워커 라이브러리: `workers/lib/<name>.ts` (`routing-rules.ts`, `approval.ts` 참고)

### 2.3 검증 명령 (Worker는 자체 실행 후 IMPL-REPORT에 첨부)
```bash
cd "/Users/young/Downloads/personal_project/using mail_AI/v0/agent-inbox"
pnpm exec tsc -b
pnpm test
pnpm test:integration --run
```

목표 게이트:
- typecheck: 0 errors
- node test: ≥ 174 pass, 0 fail (현재 baseline)
- integration: 23 pass, 0 fail

## 3. #18 Timeline Dashboard

### 3.1 Scope
`admin/tasks` 라우트를 카드 그리드에서 Day/Week/Month 타임라인 보드로 전환. v2의 패턴 차용. **순수 프론트엔드 작업.**

### 3.2 변경 위치
- `app/routes/admin-task.tsx` 또는 `app/routes/admin.tsx` 내 tasks 탭
  - 먼저 정확한 위치 확인: `grep -n "tasks" app/routes/admin*.tsx`
- `app/admin/timeline.ts` 확장 또는 신규 `app/lib/task-timeline.ts`
- 신규 컴포넌트 `app/components/TaskTimelineBoard.tsx`

### 3.3 인터페이스
```ts
type TimelineTab = "today" | "week" | "month";

interface TimelineBucket {
  key: string;       // ISO date or week label
  label: string;     // 사용자 가시 라벨
  isToday?: boolean;
  isOverdue?: boolean;
  tasks: AdminTask[];
}

function groupTasksByTimeline(
  tasks: AdminTask[],
  tab: TimelineTab,
  now: Date,
): TimelineBucket[];
```

### 3.4 탭별 버킷 규칙
- **오늘**: 기한초과(과거) / 오늘 / 내일 / 이번 주 / 기한미정 (5열)
- **이번 주**: 월~일 7일 + 미정 (8열)
- **이번 달**: 1주차~5주차 + 미정 (6열)

### 3.5 UI 시각 규칙
- 현재 컬럼: 보라색 헤더 (`text-kumo-brand`)
- 기한초과 컬럼: 빨간 헤더 (`text-kumo-destructive` + `bg-kumo-tint`)
- 미정 컬럼: opacity 0.55
- 카드 hover: subtle shadow lift
- 긴급 태스크: 주황 좌측 보더 4px (`border-l-4 border-kumo-warning`)
- 기한초과 카드: 빨간 좌측 보더 + 연핑크 배경

### 3.6 Tests
신규 단위 테스트 `tests/task-timeline.test.ts` (≥ 8 cases):
- empty input → empty buckets
- today tab buckets correctly
- week tab labels Mon~Sun
- month tab assigns to week-of-month
- overdue tasks go to overdue bucket on today tab
- tasks without due date → "미정"
- urgent priority preserved
- now boundary respected (Date.UTC 사용으로 timezone 안전화)

### 3.7 Non-Changes
- DO나 워커는 건드리지 않음
- 백엔드 API 변경 없음
- 다른 admin 페이지 (cost, clients) 무관

---

## 4. #20 Inbox Zero Mode

### 4.1 Scope
미확인 이메일을 단일 카드 스택으로 표시 + 키보드 swipe 액션. 모바일 친화 신규 라우트.

### 4.2 변경 위치
- 신규 `app/routes/inbox-zero.tsx`
- `app/routes.ts`에 `route("mailbox/:mailboxId/inbox-zero", ...)` 등록
- Sidebar에 진입점 링크 추가 (`app/components/Sidebar.tsx`)
- 신규 컴포넌트 `app/components/InboxZeroCard.tsx`

### 4.3 동작
- 현재 mailbox의 unread inbox 이메일 1개씩 표시
- 키보드: `r` (reply), `a` (archive), `s` (snooze), `d` (delete), `j` (next), `k` (previous), `Escape` (exit)
- 액션 후 자동으로 다음 카드로
- 모든 카드 처리 시 "Inbox Zero!" empty state
- existing `useReplyToEmail`, `useMoveEmail`, `useDeleteEmail` 재사용

### 4.4 통합
- `useKeyboardShortcut` 훅 사용 (Phase B-1에서 추가됨)
- Snooze는 별도 폴더 이동 또는 starred 토글로 시뮬레이션 (스코프상 별도 컬럼 추가 금지)

### 4.5 Tests
- 카드 자동 진입/이동 통합 케이스 1개
- 키보드 액션 핸들러 단위 테스트 4개

---

## 5. #7 Customer Segmentation

### 5.1 Scope
발신자 도메인 + 빈도 기반 자동 라벨링 (VIP / Regular / New / Dormant). 신규 마이그레이션 없음 — emails 테이블에서 실시간 계산.

### 5.2 변경 위치
- 신규 `workers/lib/segmentation.ts` (순수 함수 — 평가만)
- DO 신규 메서드 `getCustomerSegments()` (emails 집계 → 발신자별 라벨)
- 라우트 `GET /api/v1/mailboxes/:id/segments`
- API client + queries
- `app/components/EmailPanel.tsx` 또는 `EmailPanelHeader.tsx`에 발신자 옆 badge
- (선택) `Sidebar.tsx`에 세그먼트 필터 — 작업 가중 시 생략 가능

### 5.3 세그먼트 규칙 (pure function)
```ts
interface SenderStats {
  email: string;
  domain: string;
  totalMessages: number;
  lastSeenAt: string;   // ISO
  firstSeenAt: string;
  starred: number;
}

type Segment = "vip" | "regular" | "new" | "dormant";

function classify(stats: SenderStats, now: Date): Segment {
  const lastDays = (now.getTime() - new Date(stats.lastSeenAt).getTime()) / 86400000;
  if (lastDays > 90) return "dormant";
  if (stats.totalMessages >= 5 && stats.starred >= 1) return "vip";
  if (stats.totalMessages >= 5) return "regular";
  return "new";
}
```

### 5.4 SQL 집계 (DO 메서드)
```ts
SELECT sender,
  COUNT(*) AS totalMessages,
  MAX(date) AS lastSeenAt,
  MIN(date) AS firstSeenAt,
  SUM(starred) AS starred
FROM emails
WHERE sender IS NOT NULL
GROUP BY sender
```

### 5.5 Tests
`tests/segmentation.test.ts` (≥ 6 cases): VIP/Regular/New/Dormant 분류, 경계값, 빈 도메인.

---

## 6. #6 SLA Dashboard

### 6.1 Scope
응답시간 메트릭 + 기한초과 카드 + 7일 트렌드. 기존 `emails` (수신/발송 쌍) + `agent_feedback`로 계산.

### 6.2 변경 위치
- DO 신규 메서드 `getSlaMetrics(window: '24h' | '7d' | '30d')`
- 라우트 `GET /api/v1/mailboxes/:id/admin/sla?window=7d`
- 신규 라우트 페이지 `app/routes/admin-sla.tsx`
- `app/routes.ts`에 `route("admin/sla", ...)` 등록 (mailbox nested)
- Sidebar 운영 섹션에 링크 추가

### 6.3 SLA 계산 로직
입력: 수신 이메일 + 같은 thread_id의 발송 이메일.
```
responseTimeMs = (sentDate - receivedDate) when sent.in_reply_to = received.id
```

응답:
```ts
interface SlaMetrics {
  window: string;            // "7d"
  generatedAt: string;
  totalReceived: number;
  totalReplied: number;
  unreplied: number;
  avgResponseHours: number;
  p50ResponseHours: number;
  p90ResponseHours: number;
  overdue: Array<{           // unanswered > 24h
    id: string;
    subject: string;
    sender: string;
    age_hours: number;
  }>;
  trend: Array<{             // 일별
    date: string;            // ISO date
    received: number;
    replied: number;
    avgHours: number;
  }>;
}
```

### 6.4 UI
- 4개 KPI 카드: Replied / Avg / P50 / P90
- Overdue 리스트 (max 10) — `EmailPanel`로 클릭 진입
- 7일 트렌드 — Inline SVG (`admin-cost.tsx` 패턴 차용)

### 6.5 Tests
- DO 집계 정확성 (1 case via vitest integration with fixture)
- 라우트 응답 shape (1 case)

---

## 7. Worker 위임 지침 (GLM)

각 항목당 별도 IMPL-REPORT 작성 권장:
- `docs/v0/IMPL-REPORT-d1-timeline.md`
- `docs/v0/IMPL-REPORT-d2-inbox-zero.md`
- `docs/v0/IMPL-REPORT-d3-segments.md`
- `docs/v0/IMPL-REPORT-d4-sla.md`

각 IMPL-REPORT 필수 섹션:
1. Scope (실제로 변경한 파일 절대경로 목록)
2. Applied changes (요점)
3. Validation 실제 실행 결과 (typecheck output + test counts)
4. Non-changes (의도적으로 손대지 않은 영역)

## 8. 진행 순서

1. #18 Timeline Dashboard (가장 독립적, 백엔드 없음)
2. #20 Inbox Zero (신규 라우트만, 기존 query 재사용)
3. #7 Customer Segmentation (DO 메서드 + 라우트 + UI)
4. #6 SLA Dashboard (가장 복잡, 집계 + 차트)

각 단계 완료 후 Claude가 review:
- diff 직독
- typecheck/test 결과 검토
- 회귀 / 스펙 누락 / 마이너 분류
- 통과 시 commit, 실패 시 GLM 재실행

## 9. 게이트 (Phase D 종합)

Phase D 4개 항목 모두 완료 시:
- typecheck: 0 errors
- node tests: ≥ 174 + 20 신규 ≈ 194 pass
- integration: ≥ 23 pass (신규 SLA 추가되면 24)
- 신규 라우트 3개 (`/inbox-zero`, `/admin/sla`)
- 신규 DO 메서드 6개 (templates는 phase C 별도, 여기는 segments + SLA + 이미 있는 routing/feedback 재사용)
- 신규 클라이언트 API 호출 메서드 5개

종료 후 `docs/v0/CHANGELOG-phase-d.md`로 통합 요약.
