# DESIGN — v0 Agent Inbox Tier-Improvements

> 작성일: 2026-05-31
> 범위: v0/agent-inbox 19개 개선 항목 (#4–#25, 단 #13, #16, #17 제외)
> 기준 브랜치: `feature/m1-m8-saga-monitoring-and-ci`

## 0. Goal / Non-Goals

### Goal
v0의 운영 UX 격차와 구조적 약점을 해소한다. v2의 성숙 패턴 중 Edge 환경에 맞는 것만 선별 적용한다.

### Non-Goals
- Vectorize / Workers AI 임베딩 통합 (#13, #17)
- 외부 MCP 등록 UI (#16)
- JSON 파일 store 백포팅 (DO/R2 네이티브로 재설계)

## 1. 19개 항목 — 단계별 구현 계획

### Phase A — 비파괴 UI/UX 기반 (Tier 0)

| # | 항목 | 변경 위치 | 검증 |
|---|------|----------|------|
| 4 | Draft 자동저장 | `app/components/ComposePanel.tsx`, `app/hooks/useDraftAutosave.ts` (신규), `workers/index.ts` 신규 endpoint | localStorage 즉시 + 30s 디바운스 서버 sync, 새로고침 후 복원 테스트 |
| 5 | Suspense + Error Boundary | `app/root.tsx`, `app/components/ErrorFallback.tsx` (신규) | Sentry 캡처 유지하면서 빈 화면 → fallback 카드 |
| 24 | Phosphor 아이콘 일관화 | `app/components/Header.tsx`, `Sidebar.tsx` 등 | 직접 SVG → `@phosphor-icons/react` 통일. 시각적 회귀 없음 |
| 25 | a11y (focus trap + aria-live) | `app/components/AgentPanel.tsx`, `app/components/dialog/*` | 스크린리더 chat stream 읽기, Tab 키 Dialog 내 순환 |

### Phase B — UI 신규 (Tier 1 UI)

| # | 항목 | 변경 위치 | 검증 |
|---|------|----------|------|
| 19 | Command Palette (⌘K) | `app/components/CommandPalette.tsx` (신규), `app/hooks/useKeyboardShortcut.ts` (신규), `app/root.tsx` | ⌘K 오픈, fuzzy 매칭, 메일박스 전환·라벨·액션 실행 |
| 22 | Streaming token viz | `app/components/AgentPanel.tsx`, `workers/agent/index.ts` (toolCallStreamId 기반 메타데이터 추가) | 생성 중 토큰/sec · 누적 토큰 · 예상 비용 인라인 표시 |
| 21 | AgentPanel 4탭 (대화/분석/Draft/검증) | `app/components/AgentPanel.tsx` 리팩토링 + `agent-panel/{Conversation,Analysis,Drafts,Verification}.tsx` 신규 | 컨텍스트 전환 시 대화 손실 없음, 탭 상태 URL 동기화 |
| 23 | 모바일 split-view 개선 | `app/components/MailboxSplitView.tsx`, 신규 `BottomSheet.tsx` | iOS swipe-back 충돌 해결, 하단 sheet로 EmailPanel 표시 |

### Phase C — 데이터/라우트 신규 (Tier 1 백엔드)

| # | 항목 | 변경 위치 | 검증 |
|---|------|----------|------|
| 8 | 답장 템플릿 라이브러리 | `workers/db/schema.ts` (templates 테이블), `workers/durableObject/migrations.ts`, `workers/lib/templates.ts`, `app/components/TemplatePicker.tsx` | DO migration `005_templates`, ComposePanel `/` 슬래시 트리거 |
| 10 | 👍/👎 AI 피드백 | `workers/db/schema.ts` (agent_feedback 테이블), `workers/agent/index.ts` (응답 metadata), `app/components/AgentPanel.tsx` | 클릭 → DO 기록, Admin에 응답 품질 집계 |
| 9 | 자동 라우팅 규칙 | `workers/lib/routing-rules.ts` (신규), `workers/lib/email-ingest/processor.ts` 통합, Settings UI | 발신자/도메인 → 폴더/담당자 매핑, evaluation order 보장 |
| 11 | HITL 승인 워크플로우 | `workers/durableObject/index.ts` (`approval_state` 컬럼), `workers/lib/approval.ts`, `app/components/agent-panel/Verification.tsx` | Draft → pending → approved/rejected/edited 상태 전이, 알림 |

### Phase D — 운영 대시보드 (Tier 1 표면)

| # | 항목 | 변경 위치 | 검증 |
|---|------|----------|------|
| 6 | SLA 대시보드 | `workers/admin/sla.ts` (신규), `app/routes/mailbox-admin-sla.tsx` (신규) | avg/P90 응답시간, overdue 카드, 7일 트렌드 |
| 7 | 고객 세그먼테이션 | `workers/lib/segmentation.ts` (신규), `app/components/Sidebar.tsx` 필터, EmailPanel 뱃지 | VIP/신규/휴면/일반 자동 라벨 + 수동 오버라이드 |
| 18 | Timeline Dashboard | `app/routes/mailbox-admin.tsx`에 탭 추가, `app/admin/timeline.ts` 확장 | 오늘/이번 주/이번 달 보드 |
| 20 | Inbox Zero 모드 | `app/routes/inbox-zero.tsx` (신규), Header 토글 | 미확인 단일 카드 스택 + swipe action |

### Phase E — AI 구조 (Tier 2)

| # | 항목 | 변경 위치 | 검증 |
|---|------|----------|------|
| 12 | 멀티 에이전트 분리 | `workers/agent/{supervisor,triager,draftWriter,reviewer}.ts` (신규), `workers/agent/index.ts` 디스패처 변환 | Triager → DraftWriter → Reviewer 직렬 호출, 각 단계 cost 분리 기록 |
| 14 | Citation tracking | `workers/agent/draftWriter.ts` citation 강제, `workers/lib/schemas.ts` citation 스키마, `app/components/agent-panel/Drafts.tsx` 출처 칩 | 답변에 `[#email_id]` `[#attachment_id]`, 클릭 시 패널 오픈 |
| 15 | Analytics Engine 연동 | `workers/lib/observability/analytics.ts` (신규), `workers/tail-consumer/handler.ts` 통합 | AE에 cost/latency/feedback 적재, admin 대시보드 SQL 조회 |

## 2. DO Schema 변경 (Drizzle migration)

```
migrations/005_templates.ts        — templates(id, mailbox_id, name, body, variables_json, created_at, updated_at)
migrations/006_agent_feedback.ts   — agent_feedback(id, mailbox_id, agent_call_id, score, comment, created_at)
migrations/007_routing_rules.ts    — routing_rules(id, mailbox_id, priority, match_json, action_json, enabled)
migrations/008_approval_state.ts   — emails ADD COLUMN approval_state TEXT DEFAULT NULL, approval_meta_json TEXT
migrations/009_segmentation.ts     — client_segments(domain, mailbox_id, segment, manual_override, updated_at)
migrations/010_drafts_autosave.ts  — draft_autosaves(id, mailbox_id, payload_json, updated_at)
```

R2 또는 KV로 빼낼 항목 없음. 모두 DO SQLite에서 처리.

## 3. 신규 API 표면

```
GET    /api/v1/mailboxes/:id/templates
POST   /api/v1/mailboxes/:id/templates
DELETE /api/v1/mailboxes/:id/templates/:tid

POST   /api/v1/mailboxes/:id/agent-feedback         (call_id, score, comment?)

GET    /api/v1/mailboxes/:id/routing-rules
PUT    /api/v1/mailboxes/:id/routing-rules

POST   /api/v1/mailboxes/:id/drafts/:eid/approval   (action: approve|reject|edit)

GET    /api/v1/mailboxes/:id/admin/sla              (?from, ?to)
GET    /api/v1/mailboxes/:id/admin/segments
PUT    /api/v1/mailboxes/:id/admin/segments/:domain (manual override)

POST   /api/v1/mailboxes/:id/draft-autosaves        (payload)
GET    /api/v1/mailboxes/:id/draft-autosaves/latest
```

모든 라우트는 기존 `withAccessJWT` middleware + cost guard 적용.

## 4. UI 스토어 변경

`useUIStore.ts` 확장:
```ts
isCommandPaletteOpen: boolean;
agentPanelTab: 'conversation' | 'analysis' | 'drafts' | 'verification';
inboxZeroMode: boolean;
draftAutosaveStatus: 'idle' | 'saving' | 'saved' | 'error';
```

## 5. 비용/관측성 고려

- 새 에이전트 단계마다 `recordAgentUsage` 호출 → DO 기록
- Triager는 작은 모델(`@cf/meta/llama-3.2-3b-instruct`) 사용, DraftWriter는 기존 `kimi-k2.5`
- Analytics Engine 적재로 admin-cost.tsx 추후 trend 차트 가능

## 6. 테스트 전략

- 신규 DO migration → `tests/do-concurrency.test.ts` 패턴 차용
- 라우팅 규칙 평가 → `workers/lib/routing-rules.ts`의 순수 함수 단위 테스트
- HITL 상태 전이 → 정적 상태 머신 케이스
- vitest pool=workers integration: 템플릿·피드백·SLA·승인 라우트 한 케이스씩

## 7. Implementation Order (의존성 기반)

```
Phase A (4, 5, 24, 25)  — 독립, 병렬 가능
  ↓
Phase C 우선 (8, 10) → Phase B (19, 22, 21, 23) 순서로
  ↓
Phase C (9, 11) → Phase D (6, 7, 18, 20)
  ↓
Phase E (12, 14, 15)
```

## 8. Worker 지침 (GLM 위임 시)

- 각 Phase는 별도 IMPL-REPORT-<phase>.md로 작성
- 검증 명령: `pnpm typecheck && pnpm test --run && pnpm test:integration --run`
- 검증 출력 첨부 의무, 회귀 발생 시 Phase 즉시 중단

## 9. Validation 명령 (전체)

```bash
cd v0/agent-inbox
pnpm typecheck
pnpm test --run
pnpm test:integration --run
```

목표 게이트: typecheck 0 errors, Node 142 + N신규 passed, vitest 23 + N신규 passed.
