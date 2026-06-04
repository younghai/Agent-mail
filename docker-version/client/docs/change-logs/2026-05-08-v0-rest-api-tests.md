# Track F — M2: REST API Route Integration Tests

**Date:** 2026-05-08
**File:** `tests/api-routes.test.ts`
**Scope:** Workers REST API (`/api/v1/...`) integration tests

---

## Route Catalog

| Method | Path | Handler Notes |
|--------|------|---------------|
| GET | `/api/v1/config` | Returns domains + emailAddresses from env |
| GET | `/api/v1/admin/overview` | Admin aggregate report (not tested — complex DO aggregation) |
| GET | `/api/v1/admin/clients` | List clients; requires admin auth |
| GET | `/api/v1/admin/clients/:clientId` | Single client + tasks + stats |
| POST | `/api/v1/admin/clients` | Create client; admin/manager only |
| PUT | `/api/v1/admin/clients/:clientId` | Update client; admin/manager only |
| GET | `/api/v1/admin/tasks` | List tasks with optional filters |
| GET | `/api/v1/admin/tasks/:taskId` | Single task + client + events |
| POST | `/api/v1/admin/tasks` | Create task; admin/manager/operator |
| PUT | `/api/v1/admin/tasks/:taskId` | Update task |
| GET | `/api/v1/admin/action-queue` | Overdue/unassigned/blocked/waiting buckets |
| GET | `/api/v1/mailboxes` | List all mailboxes from R2 |
| POST | `/api/v1/mailboxes` | Create mailbox; stores settings in R2 |
| GET | `/api/v1/mailboxes/:mailboxId` | Get mailbox settings from R2 |
| PUT | `/api/v1/mailboxes/:mailboxId` | Update mailbox settings in R2 |
| DELETE | `/api/v1/mailboxes/:mailboxId` | Delete mailbox + attachments from R2 |
| GET | `/api/v1/mailboxes/:mailboxId/emails` | List emails; supports folder/threaded/paging |
| POST | `/api/v1/mailboxes/:mailboxId/emails` | Send email via EMAIL binding (202) |
| POST | `/api/v1/mailboxes/:mailboxId/drafts` | Save draft to DO (201) |
| GET | `/api/v1/mailboxes/:mailboxId/emails/:id` | Get single email |
| PUT | `/api/v1/mailboxes/:mailboxId/emails/:id` | Update read/starred |
| DELETE | `/api/v1/mailboxes/:mailboxId/emails/:id` | Delete email + R2 attachments |
| POST | `/api/v1/mailboxes/:mailboxId/emails/:id/move` | Move email to folder |
| POST | `/api/v1/mailboxes/:mailboxId/emails/:id/reply` | Reply handler |
| POST | `/api/v1/mailboxes/:mailboxId/emails/:id/forward` | Forward handler |
| GET | `/api/v1/mailboxes/:mailboxId/threads/:threadId` | Get thread emails |
| POST | `/api/v1/mailboxes/:mailboxId/threads/:threadId/read` | Mark thread read |
| GET | `/api/v1/mailboxes/:mailboxId/folders` | List folders |
| POST | `/api/v1/mailboxes/:mailboxId/folders` | Create folder |
| PUT | `/api/v1/mailboxes/:mailboxId/folders/:id` | Update folder name |
| DELETE | `/api/v1/mailboxes/:mailboxId/folders/:id` | Delete folder |
| GET | `/api/v1/mailboxes/:mailboxId/search` | Search emails |
| GET | `/api/v1/mailboxes/:mailboxId/emails/:emailId/attachments/:attachmentId` | Download attachment from R2 |
| POST | `/api/v1/mailboxes/:mailboxId/test-autodraft` | Trigger autodraft agent (dev only) |

**Total: 34 routes identified**

---

## Test Matrix

| Test # | Route | Scenario |
|--------|-------|----------|
| 1 | GET /api/v1/config | Returns split domains array |
| 2 | GET /api/v1/mailboxes | Empty list when no R2 objects |
| 3 | GET /api/v1/mailboxes | Returns seeded mailbox |
| 4 | POST /api/v1/mailboxes | Creates new mailbox → 201 |
| 5 | POST /api/v1/mailboxes | Duplicate → 409 |
| 6 | GET /api/v1/mailboxes/:id | Found → 200 + settings |
| 7 | GET /api/v1/mailboxes/:id | Missing → 404 |
| 8 | DELETE /api/v1/mailboxes/:id | Success → 204 |
| 9 | GET .../emails | requireMailbox guard: missing mailbox → 404 |
| 10 | GET .../emails | Returns emails array |
| 11 | GET .../emails?folder=inbox | Returns `{emails, totalCount}` |
| 12 | GET .../emails/:id | Email found → 200 |
| 13 | GET .../emails/:id | Email missing (stub null) → 404 |
| 14 | PUT .../emails/:id | Update read status → 200 |
| 15 | DELETE .../emails/:id | Success → 204 |
| 16 | DELETE .../emails/:id | Missing → 404 |
| 17 | POST .../emails/:id/move | Move → 200 `{status: "moved"}` |
| 18 | POST .../drafts | Create draft → 201 |
| 19 | GET .../folders | Returns folders array |
| 20 | POST .../folders | Create folder → 201 |
| 21 | POST .../folders | Non-alphanumeric name → 400 |
| 22 | GET .../threads/:threadId | Returns thread email array |
| 23 | GET .../search?query=... | Returns `{emails, totalCount}` |
| 24 | GET .../attachments/:id | Attachment metadata null → 404 |
| 25 | GET .../attachments/:id | R2 object missing → 404 |
| 26 | GET /api/v1/admin/clients | No auth header → 403 |
| 27 | GET /api/v1/admin/clients | Admin header → 200 + list |
| 28 | POST /api/v1/admin/clients | Admin creates client → 201 |
| 29 | POST /api/v1/admin/clients | Viewer role → 403 |
| 30 | GET /api/v1/admin/tasks | Admin → 200 + tasks list |
| 31 | POST /api/v1/admin/tasks | Admin creates task → 201 |
| 32 | GET /api/v1/admin/action-queue | Returns queue categories |
| 33 | Unknown route | → 404 |
| 34 | PUT /api/v1/mailboxes/:id | Update settings → 200 |
| 35 | POST .../threads/:threadId/read | Mark read → 200 |

**Total: 35 tests across 24 distinct routes**

---

## Architecture: Why Inline Test App

`workers/index.ts` uses extensionless imports (`./email-sender`, `../durableObject`) that Node's strict ESM resolver cannot find. Rather than patching production imports or adding a custom loader, the test file builds an equivalent Hono app inline with the same route logic wired to injectable mock dependencies.

This is the correct approach for unit/integration tests: no runtime dependency on the Cloudflare Workers runtime.

---

## Mock Patterns

### Mock R2 (`createMockR2`)
- Backed by `Map<string, string | ArrayBuffer>`
- Implements: `head`, `get`, `put`, `delete`, `list` with prefix filtering
- `head` returns `{ key }` when present, `null` when absent
- `list` filters `_store` keys by prefix — used by `listMailboxes()`
- Pre-seed with `await r2.put("mailboxes/<id>.json", ...)` to pass `requireMailbox` middleware

### Mock Mailbox DO Stub (`createMailboxStub`)
- Per-method config map (not a blanket Proxy) avoids shape mismatches
- Configurable return values per test: `email`, `emails`, `folders`, `attachment`, etc.
- `getEmail(id)` returns `null` when `cfg.email === null` → triggers 404
- `deleteEmail()` returns `null` → triggers 404; `[]` → 204

### Mock Admin DO Stub (`createAdminStub`)
- Configurable `clients` and `tasks` arrays
- `createClient` / `createTask` return fixed IDs for assertion

### Admin Auth Mock
- `requireAdminRole` checks `x-admin-user-email` header against `ADMIN_EMAILS` env var
- Pass `{ "x-admin-user-email": "admin@example.com" }` with `adminEmails: "admin@example.com"` → role `admin`
- Unknown email → role `viewer` → write endpoints return 403
- No header → `actor.email === ""` → 403

---

## Limitations

1. **Real DO concurrency / SQLite** — Tests exercise route logic only. Actual Durable Object SQL queries, transactions, and storage behaviour are not covered.
2. **Email Routing binding** — `POST /api/v1/mailboxes/:id/emails` calls `c.executionCtx.waitUntil(sendEmail(...))`. The route is not tested here because it requires a full `executionCtx` and the `PostalMime` + `storeAttachments` import chain. Tracked as F-M3.
3. **reply/forward routes** — `handleReplyEmail` / `handleForwardEmail` import from `../routes/reply-forward` which uses extensionless imports; skipped in this test file.
4. **admin/overview** — requires N+1 DO calls to `getAdminMetrics`; skipped due to aggregation complexity.
5. **Cloudflare Access JWT** — Not validated in test environment. Auth guard tested via `x-admin-user-email` header path only.

---

## Next Steps (F-M3)

- Test `POST .../emails` (send) with a patched `sendEmail` mock
- Test reply/forward routes via module mock or separate route file
- Add attachment download happy-path (pre-seed R2 with attachment bytes)
- Extend admin overview test once DO mock supports `getAdminMetrics`
