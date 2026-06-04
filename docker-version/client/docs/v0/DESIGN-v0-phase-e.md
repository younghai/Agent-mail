# DESIGN — v0 Agent Inbox Phase E (AI Structure)

> 작성일: 2026-05-31
> 모드: Claude (design) → GLM 5.1 (impl) → Claude (review)
> 의존 컨텍스트: Phase A + B + C + D 완료 (커밋 a7dd1b3..현재)

## 0. Goal / Non-Goals

### Goal
v0의 단일 `EmailAgent` 모놀리식 구조를 다단 파이프라인(Triager → DraftWriter → Reviewer)으로 분리하고, 답변에 인용 출처를 강제하며, Cloudflare Analytics Engine으로 운영 메트릭을 적재한다.

### Non-Goals
- LangGraph/외부 오케스트레이션 도입 (`ai` SDK + `streamText` 단계 분리로 충분)
- 벡터 검색·임베딩 (#13/#17은 보류 항목)
- 외부 MCP 서버 등록 UI (#16 보류)
- 새 인증/CORS 표면

## 1. Phase E 3개 항목 — 개요

| # | 항목 | 신규 마이그레이션 | 신규 바인딩 | 영향 영역 |
|---|------|------------------|------------|---------|
| 15 | Analytics Engine | 없음 | `ANALYTICS` (AE dataset) | Tail consumer + helper lib |
| 12 | Multi-agent split | 없음 | 없음 | `workers/agent/*` 리팩토링 |
| 14 | Citation tracking | **1건** (`13_add_email_citations`) | 없음 | DraftWriter + Drafts UI |

순차 위임 권장 순서:
1. **#15 Analytics Engine** — 가장 독립적, 관측성 표면만
2. **#12 Multi-agent split** — AI 코드 리팩토링, 데이터 영향 없음
3. **#14 Citation tracking** — #12 위에 빌드, 작은 schema 추가

## 2. 사전 컨텍스트 (Phase D와 동일 + 신규)

- 기존 `EmailAgent` (`workers/agent/index.ts`): `AIChatAgent` 상속, 9개 tools, `onChatMessage` SSE 스트림.
- 기존 `recordAgentUsage` (`workers/admin/cost-aggregation.ts` 또는 인접): operation/model/token/latency 기록. 이미 사용 중.
- 기존 `Tail consumer` (`workers/tail-consumer/handler.ts`, `wrangler.tail-consumer.jsonc`): exception → Sentry, outcome=exception → Slack 라우팅.
- 검증 명령:
  ```bash
  cd "/Users/young/Downloads/personal_project/using mail_AI/v0/agent-inbox"
  pnpm exec tsc -b
  pnpm test
  pnpm test:integration --run
  ```
- 목표 게이트: typecheck 0, node ≥ 206 baseline + N 신규, integration ≥ 23.

## 3. #15 Analytics Engine Integration

### 3.1 Scope
Cloudflare Analytics Engine에 운영 이벤트(AI cost/latency, agent feedback summary, SLA snapshot, rate-limit/cost-guard alert)를 적재. 기존 `recordAgentUsage`는 유지하고 AE 쓰기를 사이드카로 추가.

### 3.2 구현 위치
- `workers/lib/observability/analytics.ts` (신규)
- `wrangler.jsonc` `analytics_engine_datasets` 바인딩 — **GLM은 주석으로만 추가 + 비활성화 상태**. 실제 활성화는 Claude가 검토 후 별도 커밋. 코드 측은 `env.ANALYTICS?.writeDataPoint(...)` 형태로 옵셔널 호출.
- `workers/types.ts` `Env`에 `ANALYTICS?: AnalyticsEngineDataset` 추가
- 기존 `recordAgentUsage` 호출 지점들 (workers/agent/index.ts 등)에 `analytics.recordAiEvent(...)` 추가
- `workers/tail-consumer/handler.ts`에 outcome ok/exception 이벤트 적재

### 3.3 helper API
```ts
// workers/lib/observability/analytics.ts
export interface AiEventInput {
  mailboxId: string;
  operation: 'chat' | 'auto_draft' | 'triage' | 'draft' | 'review';
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  latencyMs: number;
  status: 'ok' | 'error' | 'blocked';
  errorCode?: string;
}

export function recordAiEvent(
  env: { ANALYTICS?: AnalyticsEngineDataset },
  input: AiEventInput,
): void;

export interface FeedbackEventInput {
  mailboxId: string;
  callId: string;
  score: 1 | -1;
}
export function recordFeedbackEvent(
  env: { ANALYTICS?: AnalyticsEngineDataset },
  input: FeedbackEventInput,
): void;

export interface TailEventInput {
  outcome: 'ok' | 'exception';
  scriptName?: string;
  durationMs?: number;
}
export function recordTailEvent(
  env: { ANALYTICS?: AnalyticsEngineDataset },
  input: TailEventInput,
): void;
```

모든 helper는 `env.ANALYTICS`가 없으면 no-op. (writeDataPoint API: `{indexes: string[], doubles: number[], blobs: string[]}`)

### 3.4 Tests
- `tests/analytics.test.ts` (≥ 4 cases):
  - no-op when binding absent
  - recordAiEvent shape validation (indexes/doubles/blobs)
  - recordFeedbackEvent shape
  - recordTailEvent shape

### 3.5 Worker 지침
- npm 의존성 추가 없음 (CF Workers 타입은 `@cloudflare/workers-types` 이미 있음)
- wrangler.jsonc 바인딩은 주석 처리된 채로 추가 + 코드는 옵셔널 호출 (운영 활성화는 Claude가 별도)

---

## 4. #12 Multi-agent Split

### 4.1 Scope
단일 `EmailAgent`를 3단계 파이프라인으로 분리: **Triager** (분류 + 인입 필터링) → **DraftWriter** (실제 답변 작성) → **Reviewer** (드래프트 검증 + verifyDraft 호출). 자동 답변 흐름(`handleNewEmail`)과 사용자 채팅 흐름은 별개 entry로 유지하되 내부에서 같은 파이프라인 재사용.

### 4.2 구현 위치
- `workers/agent/triager.ts` (신규) — 작은 모델 (`@cf/meta/llama-3.2-3b-instruct` 권장) 사용한 분류기. 출력: `{category: 'inquiry' | 'complaint' | 'transactional' | 'spam', skipDraft: boolean, reason: string}`
- `workers/agent/draft-writer.ts` (신규) — 기존 `kimi-k2.5` 사용. `triager` 결과를 system context로 받아 답변 작성.
- `workers/agent/reviewer.ts` (신규) — 기존 `verifyDraft` (workers/lib/ai.ts)를 호출하는 얇은 wrapper + 정책 위반 검사.
- `workers/agent/pipeline.ts` (신규) — 위 3개 단계를 직렬 호출하는 orchestrator. 각 단계마다 `recordAgentUsage` + `recordAiEvent` 호출. `operation: 'triage' | 'draft' | 'review'` 분리.
- `workers/agent/index.ts` 수정 — `handleNewEmail`이 pipeline.run(emailContext)을 호출하도록 변경. `onChatMessage`는 그대로 유지 (사용자 챗은 단일 패스).

### 4.3 인터페이스
```ts
// workers/agent/pipeline.ts
export interface PipelineInput {
  mailboxId: string;
  email: EmailFull;
  threadContext: string;
  systemPrompt: string;
}

export interface PipelineResult {
  triaged: {
    category: string;
    skipDraft: boolean;
    reason: string;
  };
  draft: {
    subject: string;
    body: string;          // sanitized via Reviewer.verify
    citations?: string[];  // only populated when #14 lands
  } | null;
  totalCostUsd: number;
  totalLatencyMs: number;
}

export async function runEmailPipeline(
  env: Env,
  input: PipelineInput,
): Promise<PipelineResult>;
```

### 4.4 Skip 조건
- `triaged.category === 'spam'` → skipDraft=true, draft=null, no further AI calls.
- `routing-rules` (#9) `skip_agent` 액션이 emails 테이블 컬럼이나 이벤트로 표시되어 있으면 Triager 직전에 short-circuit.

### 4.5 Tests
- `tests/agent-pipeline.test.ts` (≥ 5 cases):
  - happy path: triage → draft → review 직렬 호출 횟수 검증
  - spam 단락: triage만, draft/review 호출 안 됨
  - reviewer가 살균하면 draft.body가 sanitized 결과로 교체
  - 각 단계 cost 누계 검증 (totalCostUsd = sum of stages)
  - 단계 실패 시 (triager throws) draft=null 반환 + 에러 로그
- 기존 agent-tools 통합 테스트는 회귀 없어야 함.

### 4.6 시스템 프롬프트
- Triager: 분류용 짧은 프롬프트 (JSON 출력 강제 — `responseFormat: 'json'`). 50-100줄.
- DraftWriter: 기존 `DEFAULT_SYSTEM_PROMPT` 재사용 (그대로 import).
- Reviewer: "검토 전용. body를 받아 살균된 body 반환. agent 메타코멘터리 제거."

### 4.7 Worker 지침
- DO 마이그레이션 절대 추가 금지.
- npm 의존성 추가 금지 — 기존 `ai` SDK + `workers-ai-provider` 사용.
- `recordAgentUsage` operation 값 새로 추가: `'triage' | 'draft' | 'review'` (기존 `'chat' | 'auto_draft'` 외).
- 회귀 가드: `tests/full-mail-flow*.test.ts` 같은 e2e 테스트가 있으면 그대로 통과해야 함.

---

## 5. #14 Citation Tracking

### 5.1 Scope
DraftWriter가 답변 본문에 출처 마커 `[#email_id]`, `[#attachment_id]`를 강제 출력. DO 측에 citations 컬럼 추가, Drafts 탭 UI에 칩 형태로 노출 + 클릭 시 referenced 이메일 패널 오픈.

### 5.2 구현 위치
- DO 마이그레이션 13: `ALTER TABLE emails ADD COLUMN citations_json TEXT` (NULL allowed).
- `workers/db/schema.ts`: `citations_json: text("citations_json")` 추가.
- `workers/lib/citations.ts` (신규) — citation marker 파서 + 직렬화.
  ```ts
  export interface Citation {
    type: 'email' | 'attachment';
    id: string;
    snippet?: string;
  }
  export function extractCitations(body: string): { stripped: string; citations: Citation[] };
  ```
- DraftWriter system prompt 강화: "Every factual claim MUST be followed by `[#email:ID]` or `[#attachment:ID]`. End reply with a separated `Sources:` list (this list will be parsed out before delivery)."
- DraftWriter 결과 처리: extractCitations → stripped를 body, citations를 별도 컬럼.
- Drafts 탭 UI (`app/components/agent-panel/DraftsPanel.tsx` 신규 또는 기존 stub 활용)에 citations 칩 렌더. 클릭 시 `useUIStore.selectEmail(citation.id)` 호출.

### 5.3 인터페이스
```ts
// 기존 emails 테이블에 추가
citations_json: string | null;  // JSON.stringify(Citation[]) or null
```

### 5.4 Tests
- `tests/citations.test.ts` (≥ 5 cases):
  - email marker 파싱: `... [#email:abc-123] ...` → 1 citation
  - attachment marker 파싱
  - 여러 markers + 본문 내 위치 보존 (stripped 결과)
  - Sources: 블록 제거
  - 빈 citation → `[]` 반환, stripped=원본

### 5.5 Worker 지침
- 마이그레이션 SQL은 idempotent (CREATE TABLE IF NOT EXISTS 없으니 column add는 SQLite에서 한 번만 가능 — `ALTER TABLE ... ADD COLUMN`은 `d1_migrations` tracking으로 단 한 번 적용됨, OK)
- DraftWriter 프롬프트 변경 시 verifyDraft가 Sources 블록을 sanitize하지 않도록 주의 (parser가 먼저 제거)
- UI 칩은 kumo 토큰 사용. 클릭 a11y: button + aria-label

---

## 6. 진행 순서 + 워커 지침

각 항목당 IMPL-REPORT 별도 작성:
- `docs/v0/IMPL-REPORT-e1-analytics.md`
- `docs/v0/IMPL-REPORT-e2-multi-agent.md`
- `docs/v0/IMPL-REPORT-e3-citations.md`

각 IMPL-REPORT 필수 섹션은 Phase D와 동일 (Scope / Applied / Validation / Non-changes).

DO NOT git commit. Claude는 diff를 직독하고 자체 검증 후 커밋합니다.

## 7. Phase E 종합 게이트

3개 항목 모두 완료 시:
- typecheck: 0 errors
- node tests: ≥ 206 + ~14 신규 ≈ 220 pass
- integration: ≥ 23 pass
- 신규 마이그레이션 1건 (13)
- 신규 워커 라이브러리 3개 (analytics, pipeline, citations)
- 신규 워커 디렉터리 1개 (`workers/agent/{triager,draft-writer,reviewer,pipeline}.ts`)
- 신규 클라이언트 컴포넌트 1개 (Drafts 패널 — #21 stub 활용)

## 8. Phase E 이후

Phase E 종료 후 19/19 개선 항목 모두 완료. 통합 CHANGELOG (`docs/v0/CHANGELOG-2026-05.md`) 작성 가능.
