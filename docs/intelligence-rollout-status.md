# HenryCo intelligence rollout status (real monorepo)

This document tracks the **real integration status** of the intelligence layer in the production monorepo.

## Fully integrated in this pass

- **Shared package**: `@henryco/intelligence` now exists in `packages/intelligence` and is consumed by real apps.
- **Account support workflow**:
  - `apps/account/app/api/support/create/route.ts` now applies triage (`triageSupportInput`) and records triage metadata.
  - `apps/account/app/api/support/reply/route.ts` now applies triage on replies and emits intelligence events.
  - Both routes now emit structured intelligence events through `emitIntelligenceEvent`.
- **Account task center behavior**:
  - New task derivation logic in `apps/account/lib/intelligence-rollout.ts`.
  - New live tasks page: `apps/account/app/(account)/tasks/page.tsx`.
  - Dashboard action center now renders real generated tasks.
- **Account recommendations**:
  - Dashboard recommendations now use `buildAccountRecommendations` (real user trust/activity context).
  - Rollout is feature-flagged via `parseHenryFeatureFlags`.
- **Staff prioritization hooks**:
  - New staff intelligence aggregator: `apps/staff/lib/intelligence-data.ts`.
  - Staff dashboard now shows live task/queue/risk metrics.
  - Staff support page now shows a prioritized support queue instead of placeholder empty state.
  - Staff operations page now shows risk/anomaly routing visibility and queue metrics.
- **Production hardening upgrades**:
  - Account webhook now requires signed requests with timestamp freshness checks and idempotent receipts.
  - Account support create/reply routes now support idempotency keys and explicit side-effect degradation reporting.
  - Jobs and logistics cron routes now fail closed when `CRON_SECRET` is missing and reject unauthenticated requests.
  - Studio support reply route now requires authenticated and authorized user context.
  - Workspace auth fallback usage is now audited in `staff_navigation_audit`.

## Already real before this pass (kept, not replaced)

- Account notifications center and lifecycle controls (`customer_notifications` + message boards).
- Owner HQ metrics, signals, and weekly/monthly report generation (`apps/hub/lib/owner-data.ts`, `apps/hub/lib/owner-reporting.ts`).
- Owner operational queue surfaces (`apps/hub/app/owner/(command)/operations/*`).

## Feature flags used

`@henryco/intelligence` parser supports:

- `NEXT_PUBLIC_HENRY_FLAG_INTELLIGENCE_EVENTS`
- `NEXT_PUBLIC_HENRY_FLAG_INTELLIGENCE_RECOMMENDATIONS`
- `NEXT_PUBLIC_HENRY_FLAG_INTELLIGENCE_STAFF_QUEUES`
- `NEXT_PUBLIC_HENRY_FLAGS` comma-list aliases (`events`, `recommendations`, `staff_queues`)

Current pass gates recommendations on account dashboard with `intelligence_recommendations`.

## Still intentionally limited

- Dedicated persisted cross-division `customer_tasks` table is not yet added in this pass; task center currently derives from live account/support/wallet/trust state.
- Full LLM triage is still deferred; deterministic triage is used server-side for safety.
- Unified event ingest service endpoint is not added yet; event payloads are persisted via existing `customer_activity` pathway in account flows.
- Outbox worker for secondary side effects is not yet introduced; routes now report degraded side effects explicitly.

