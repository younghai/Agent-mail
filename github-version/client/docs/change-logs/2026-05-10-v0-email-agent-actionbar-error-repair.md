# 2026-05-10 v0 Email Agent Action Bar Error Repair

## Scope

- `v0/agent-inbox`
- Email detail agent action bar
- Admin request/task creation API used by `Task 생성`
- Agent result panel loading and render safety

## User journey or operational reason

The mail detail action bar exposes `요약/타임라인 보기`, `Task 생성`, `답장 초안`, `메일 하단`, and `오른쪽`. `Task 생성` was calling `/api/v1/admin/requests/from-email`, but the Worker did not implement that POST route, so the app fell through to the React Router not-found handler and returned a screen-level `405 Method Not Allowed` error. Agent panel placement changes could also mount `AgentPanel` without a local render boundary, allowing panel render failures to break the mail screen instead of staying contained.

## Applied changes

- Added `POST /api/v1/admin/requests/from-email` to the Worker API.
- The route validates mailbox/email input, loads the selected email, matches or creates a client from sender/domain context, and creates an admin request task linked to `mailboxId` and `requestEmailId`.
- Made task creation idempotent for the same mailbox/email by returning the existing task instead of creating duplicates.
- Added an `AgentPanelErrorBoundary` around dynamically loaded `AgentPanel` so right-side and below-mail agent panel render failures show a local fallback instead of crashing the whole mail screen.
- Added route coverage in `tests/api-routes.test.ts` for creating a request task from an email and returning an existing task for repeated requests.

## Explicit non-changed areas

- Did not change `v1-present`, `v1-new`, `insider-automation`, or sibling service folders.
- Did not change the `답장 초안` compose flow beyond keeping it on the existing mail action bar.
- Did not replace the existing Cloudflare Workers/Durable Object local runtime.
- Did not add new dependencies.

## Verification performed

- `pnpm run test` passed: 142 tests.
- `pnpm run test:integration` passed: 8 files, 23 tests.
- `pnpm run typecheck` passed.
- `pnpm run build` passed.
- Restarted local Wrangler dev server on `http://127.0.0.1:8787`.
- Verified `GET /` returns `200 OK`.
- Verified `GET /api/v1/mailboxes` returns `bzengage@example.com`.
- Verified `GET /api/v1/mailboxes/bzengage@example.com/emails?folder=inbox&limit=5` returns `sam-15-e5`.
- Verified `GET /api/v1/mailboxes/bzengage@example.com/emails/sam-15-e5` returns `200 OK`.
- Verified first `POST /api/v1/admin/requests/from-email` for `sam-15-e5` returns `201 Created` with a linked request task.
- Verified repeated `POST /api/v1/admin/requests/from-email` for the same email returns `200 OK` with the existing task.
- Verified `GET /api/v1/admin/tasks` includes the task created from `sam-15-e5`.
- Verified `GET /assets/AgentPanel-B7Yc4rtf.js` returns `200 OK`.
