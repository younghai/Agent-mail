# 2026-05-06 v0 UI/UX Update

## Scope

- Applied code changes only to `v0/agent-inbox`.
- Did not modify `v1-present` code in this update.
- Source of change: senior designer review of the mail-to-work user journey.

## User Journey Target

The primary journey is:

`Read email -> Review AI summary -> Convert request to task -> Draft reply -> Track timeline -> Operate from admin dashboard`

## v0 Applied Updates

| Area | Update | Reason |
| --- | --- | --- |
| Mail detail top menu | Added an Agent action bar above the email content with summary/timeline, task creation, draft reply, and result placement controls. | Keeps AI actions close to the email reading context instead of hiding them only in the right panel. |
| Agent result placement | Preserved the right-panel vs below-email choice, and added a stronger top-level control for it. | Lets operators choose between focused reading and side-by-side assistant work. |
| Request-to-task flow | Added a direct `Task 생성` / `Task로 전환` action from the selected email. | Shortens the path from email insight to operational work item. |
| AI result cards | Added request candidate, source evidence, and confidence labels in the below-email result section. | AI output becomes reviewable work, not an opaque answer. |
| Timeline UX | Kept thread timeline below the email and made it reachable from the top Agent menu. | Supports the user's preferred model of seeing summary/timeline/current status below the email. |
| Sidebar IA | Added Operations links: Requests, Tasks, Clients, Timeline, Draft Review, AI Agents, Reports. | Makes the product feel like an email operations system, not only a mailbox viewer. |
| Admin anchors | Added section anchors and hash scrolling for action queue, reports, AI usage, clients, timeline, and work queue. | Sidebar links now land on the correct operational section without creating risky new routes. |
| Demo clarity | Kept demo data behind explicit opt-in and added a persistent demo-data badge when enabled. | Prevents operators from confusing sample metrics with live operational data. |

## v1-present Notes - Not Applied

| Area | Recommendation | Status |
| --- | --- | --- |
| Backend APIs | Provide richer timeline/report/settings data for the v0 UI. | Not changed in this update. |
| Role model | Expose role/permission state so v0 can hide unsafe actions for viewer/operator roles. | Not changed in this update. |
| AI cost and DLQ | Surface DLQ, cost limit, and readiness summaries to the v0 Admin UI. | Not changed in this update. |

## Follow-up UX Backlog

1. Replace heuristic AI summary cards with backend-generated summary/request/confidence/source payloads.
2. Add role-based button visibility once the backend exposes the current actor role.
3. Add saved filters for Requests, Clients, Tasks, and Reports.
4. Add a dedicated AI Review Queue for low-confidence summaries and reply drafts waiting for approval.
5. Add Admin Settings tabs for mail connection, AI model, cost limit, webhook, DLQ, audit, retention, and backup.

## Verification

- Run `HOME=/private/tmp/codex-home npm run typecheck` from `v0/agent-inbox`.
- Run `npm run build` from `v0/agent-inbox`.
