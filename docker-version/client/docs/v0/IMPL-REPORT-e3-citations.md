# IMPL-REPORT — Phase E-3: Citation Tracking (#14)

> Date: 2026-05-31
> Worker: GLM 5.1
> Spec: `docs/v0/DESIGN-v0-phase-e.md` §5

## Scope

Add citation tracking to AI-generated draft replies:
- Parse inline citation markers (`[#email:ID]`, `[#attachment:ID]`) and trailing `Sources:` blocks from draft bodies
- Persist parsed citations as JSON in a new `citations_json` column
- Expose citations in the Drafts tab UI as clickable chips

## Applied

### Migration & Schema
- **`workers/durableObject/migrations.ts`** — Added migration `13_add_email_citations`: `ALTER TABLE emails ADD COLUMN citations_json TEXT`
- **`workers/db/schema.ts`** — Added `citations_json: text("citations_json")` to emails table definition

### Citation Parser (new)
- **`workers/lib/citations.ts`** — New module with:
  - `Citation` interface: `{ type: "email" | "attachment"; id: string; snippet?: string }`
  - `extractCitations(body)`: parses inline `[#email:ID]` / `[#attachment:ID]` markers, removes trailing `Sources:` block, deduplicates by `(type, id)`
  - Returns `{ stripped: string; citations: Citation[] }`

### Pipeline Integration
- **`workers/agent/draft-writer.ts`** — Appended citation requirements to the system prompt, instructing the model to use `[#email:ID]` / `[#attachment:ID]` markers and include a `Sources:` block
- **`workers/agent/pipeline.ts`** — After `runDraftWriter`, calls `extractCitations()` on the draft body; passes `stripped` body to `runReviewer`; records `citations: Citation[]` in `PipelineResult.draft`
- **`workers/agent/index.ts`** — In `handleNewEmail`, passes `citations_json: JSON.stringify(citations)` when saving the draft via `createEmail`
- **`workers/durableObject/index.ts`** — Extended `EmailData` interface with `citations_json`; added field to Drizzle insert in `createEmail`

### UI
- **`app/components/agent-panel/DraftsPanel.tsx`** (new) — Queries Drafts folder via `useQuery` + `api.listEmails`; renders cards with sender, subject, body preview; parses `citations_json` and renders clickable kumo Badge chips with `aria-label="Source: <type> <id>"`; email citation clicks call `useUIStore.selectEmail(citation.id)`; attachment clicks are no-op with TODO comment; empty state uses kumo Empty
- **`app/components/AgentPanel.tsx`** — Replaced the combined analysis/drafts stub with separate panels: `DraftsPanel` for drafts tab, kumo Empty for analysis tab
- **`app/types/index.ts`** — Added `citations_json?: string | null` to Email interface

### Tests (new)
- **`tests/citations.test.ts`** — 7 test cases:
  1. `[#email:abc-123]` inline marker → 1 email citation
  2. `[#attachment:att-1]` inline marker → type "attachment"
  3. Multiple inline markers + Sources: block → all parsed, block removed
  4. Sources: block at EOF without trailing newline → removed
  5. Empty body → `{stripped: body, citations: []}`
  6. Body with no markers → `{stripped: body, citations: []}`
  7. Duplicate `(type, id)` deduplicated

## Validation

```
$ pnpm exec tsc -b
# 0 errors

$ pnpm test
# tests 225 | pass 225 | fail 0

$ pnpm test:integration --run
# Test Files  8 passed (8)
# Tests  23 passed (23)
```

Gate results:
- typecheck: **0 errors** ✓
- node tests: **225 pass** (218 baseline + 7 new), **0 fail** ✓
- integration: **23 pass**, **0 fail** ✓

## Non-changes

- No new npm dependencies
- No changes to `wrangler.jsonc`, `package.json`, or `pnpm-lock.yaml`
- No changes to auth, CORS, cost-guard, or security files
- No changes to existing tests (all 218 baseline + 23 integration pass unchanged)
- `PipelineResult.draft.citations` type changed from `string[]` to `Citation[]` — no downstream consumers existed yet
