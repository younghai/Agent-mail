# IMPL-REPORT — Phase E-2: Multi-agent Split (#12)

> Date: 2026-05-31
> Worker: GLM 5.1
> Spec: `docs/v0/DESIGN-v0-phase-e.md` §4

## 1. Scope

### Created files
- `/Users/young/Downloads/personal_project/using mail_AI/v0/agent-inbox/workers/agent/triager.ts`
- `/Users/young/Downloads/personal_project/using mail_AI/v0/agent-inbox/workers/agent/draft-writer.ts`
- `/Users/young/Downloads/personal_project/using mail_AI/v0/agent-inbox/workers/agent/reviewer.ts`
- `/Users/young/Downloads/personal_project/using mail_AI/v0/agent-inbox/workers/agent/pipeline.ts`
- `/Users/young/Downloads/personal_project/using mail_AI/v0/agent-inbox/tests/agent-pipeline.test.ts`

### Modified files
- `/Users/young/Downloads/personal_project/using mail_AI/v0/agent-inbox/workers/agent/index.ts`
- `/Users/young/Downloads/personal_project/using mail_AI/v0/agent-inbox/workers/admin/types.ts`

## 2. Applied changes

- **triager.ts**: New stage — classifies incoming email via `@cf/meta/llama-3.2-3b-instruct`. Returns `{category, skipDraft, reason, usage}`. JSON output enforced via prompt. Falls back to `{category: "inquiry", skipDraft: false, reason: "ai_unavailable"}` when `env.AI` is absent. Internal errors return safe defaults (never throws).

- **draft-writer.ts**: New stage — generates reply draft via `@cf/moonshotai/kimi-k2.5` using the Vercel AI SDK `generateText`. Receives the resolved `systemPrompt` (custom or DEFAULT). Returns `{subject, body, usage}` or `null` when `triage.skipDraft` is true.

- **reviewer.ts**: New stage — calls existing `verifyDraft` from `workers/lib/ai.ts` then strips residual agent meta-commentary (`Draft created.`, `Here is`, `---` horizontal rules, `[Auto-triggered]` lines). Returns `{sanitizedBody, usage}`.

- **pipeline.ts**: New orchestrator — runs triager → drafter → reviewer in sequence. Records each stage via `recordAgentUsage` (operation: "triage"|"draft"|"review") AND `recordAiEvent`. Short-circuits on spam (`skipDraft=true`) — no further AI calls. On mid-pipeline error, catches, logs via `captureWorkerError`, and returns `draft=null`. Contains the `recordAgentUsage` function (moved from index.ts, operation type widened). Accepts optional `PipelineRunners` parameter for dependency injection in tests.

- **index.ts**: `handleNewEmail` now delegates to `runEmailPipeline` instead of calling `generateText` directly. Prompt injection checks, pre-read logic, draft saving, and chat message persistence preserved verbatim. `onChatMessage` completely unchanged. `recordAgentUsage` removed (now imported from pipeline.ts). Unused imports (`generateText`, `verifyDraft`, `captureWorkerError`) removed.

- **admin/types.ts**: Widened `AgentUsageEventInput.operation` union to include `"triage" | "draft" | "review"`.

- **agent-pipeline.test.ts**: 5 test cases with mock stage runners and ADMIN DO spy:
  1. Happy path: all stages called once, totalCostUsd = sum of stages
  2. Spam short-circuit: triage only, drafter/reviewer not called
  3. Reviewer sanitization replaces draft body
  4. Triager error: pipeline returns draft=null, no throw
  5. recordAgentUsage operations emitted in order (triage, draft, review)

## 3. Validation

### Typecheck
```
$ pnpm exec tsc -b
(no output — 0 errors)
```

### Unit tests
```
$ pnpm test

ℹ tests 218
ℹ suites 11
ℹ pass 218
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 439.9325
```

### Integration tests
```
$ pnpm test:integration --run

 Test Files  8 passed (8)
      Tests  23 passed (23)
   Duration  1.78s
```

## 4. Non-changes

- **No new DO migration** — as specified.
- **No new npm dependency** — as specified.
- **No change to onChatMessage** — behavior identical to pre-refactor.
- **No change to wrangler.jsonc, package.json, pnpm-lock.yaml**.
- **No change to auth/CORS/cost-guard/security files**.
- **No change to existing test files** — all 213 baseline tests pass unchanged.
- **No change to tools-factory.ts or tools.ts** — agent tools unchanged.
- **#14 (Citation tracking) and #15 (Analytics Engine) not touched** — #15 was already landed in a prior commit.
