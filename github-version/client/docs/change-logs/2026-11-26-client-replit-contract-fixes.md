# 2026-11-26 Replit build: contract fixes, first-run path and capability gating

## Scope

- Applied to the React client as it ships in the Replit production build (`vite.config.replit.ts`) and, where the same code runs, the Replit dev preview.
- Paired with server changes in `mail-server/` (see the repository's root README, section 2.1). Several client fixes only work together with them.
- Source of change: a quality audit of the 2026-11-03 package, in which every finding was reproduced against the shipped server before being changed.

## User journey or operational reason

The campaign review flow (Summary, Draft reply, Requirement, Make campaign) was sound, but a new operator could not reach it: nothing created the sample campaigns, and the only documented way was a script pasted into the browser console. Around it, most of the ordinary inbox did not work in this build: searching always failed and showed "No results", starring and marking read were undone, a reopened draft had no body, saving a draft twice created two, Compose did nothing outside the inbox, and Send and the AI chat were offered although the server refuses them here.

## Applied changes

| Area | Change | Reason |
| --- | --- | --- |
| Empty inbox | The empty inbox offers "샘플 캠페인 9건 불러오기", loads the samples through `POST …/demo-campaigns/seed`, refreshes the list and folder counts, and names the next step. | Reaching the product's main flow must not require the developer console. |
| Capabilities | `app/lib/capabilities.ts` states what the build can do (`sendMail`, `aiAssistant`, `workersAi`, `sessionLogin`). Components ask for a capability. | The UI promised actions the server answers with 403 or 503 in this build. One place now answers the question. |
| Capability gating | Hidden where the capability is off: Send in the composer and on drafts, the AI draft action, the agent side panel, the embedded chat in the thread workspace, the command palette's agent action, the right-hand placement toggle, the Workers AI provider option. | Only what is dead is hidden. |
| Composer | "Save as Draft" becomes the primary action with a one-line reason; `handleSend` refuses with a message. | Sending is off, so saving is the only valid outcome and should look like it. |
| Compose everywhere | `ComposeDialog` opens the one composer as a dialog on views without a split pane (Settings, admin pages, Inbox Zero). `ComposeEmail` and the legacy modal state are removed. | The sidebar's Compose and Inbox Zero's Reply did nothing on those views. |
| Drafts | The composer remembers the row its first Save creates and sends `draft_id` from then on; `api.saveDraft` is typed as returning `{ id }`. | Every Save of a new message added a draft. |
| Thread drafts | Drafts in a thread are recognised by `is_draft` (`Email.is_draft` added), so they show Edit and Discard. | `folder_id` is a UUID and never equalled the slug "draft". |
| Email rows | The client reads `read`, `starred`, `date` and `body` on every row, which the server now provides from one serializer. Inbox Zero fetches the message it shows; the Drafts panel falls back to the snippet. | Only the list carried those fields, so the detail panel showed no star state and no date. |
| Search | The client sends the free text as `q`; the parser's operators are now honoured by the server. The results page has an error state with a retry and prints no count while failed. | Every search returned 400 and rendered as "No results found". |
| Errors | `ApiError` carries `code`; the error body is parsed once at the boundary. | `typecheck` failed on main at this line, and the 401 redirect read into an untyped body. |
| Admin forms | One small hook (`useSave`) keeps what was typed and shows why a save failed. | A refused save left the form silent. |
| Cost Dashboard | `admin/cost` exists under the mailbox as well as at the top level. | The Dashboard's link went to a 404. |
| Templates | Removed: `TemplatePicker`, `queries/templates.ts`, five API functions, the `Template` type. | The mail server defines no templates routes; the picker was always empty and saving failed without a message. |
| Dead code | `useUpdateFolder` removed; `wrangler.jsonc.bak`, `vite.config.v0.ts`, `.githooks/`, `@types/dompurify` removed. | Nothing in either build target referenced them. |
| Empty states | Spam and Sent explain what belongs there; Sent no longer promises that sent mail will appear in a build that sends nothing. Compose is not offered in the Inbox and Sent empty states when sending is off. | Findings of the first-run audit. |

## Explicit non-changed areas

- `workers/`, `wrangler.jsonc`, the Cloudflare `vite.config.ts`, `.dev.vars.example`: the Cloudflare Workers deployment target is preserved. `wrangler.jsonc` names a production domain and eighteen client unit tests exercise that code; retiring it is an owner's decision.
- The Settings page's other AI provider options and key fields.
- The sidebar structure: it still has 18 links in three groups. The first-run audit flags this against a budget of 8; it is reported, not redesigned.
- The Workers-side integration tests and the `test:integration` script.
- Search operators' semantics beyond what the server now filters (`from`, `to`, `subject`, `in`, `is:read/unread/starred`, `has:attachment`, `before`, `after`).

## Verification performed

- `pnpm typecheck` (was failing on main), 233 client unit tests, including new tests for `ApiError`, `parseSearchQuery` and a guard that `capabilities.ts` is the only file reading `VITE_REPLIT_PRODUCTION`.
- The mail server's contract suite runs the shipped production server against a real PostgreSQL and sends the requests this client sends (15 tests).
- The production build was driven in a browser against the real server on a throwaway database: login, loading samples from an empty inbox, marking read (Inbox badge 9 to 8), starring surviving a full reload, the detail panel's star and date, search with and without operators, a forced search failure and retry, Compose on Settings with a saved draft, Reply saving a draft with `in_reply_to`, the thread showing "2 messages, 1 draft" with Edit and Discard, the Cost Dashboard route, the admin client form's failed and successful save, and the provider list without Workers AI.
- First-run audit on a mailbox that had never held mail: every folder view, the search page, the core journey from an empty inbox to a saved reply draft, and the active sidebar item.

Not verified: hardware-level pointer input (the in-app browser used for checks did not deliver pointer events, so clicks were dispatched in the page), the command palette's Compose and agent entries, the task form in the browser, and the Cloudflare build after the file removals.
