# V3-47 — Automation & Workflow: Neglected Queue Detection

**Pass ID:** V3-47  ·  **Phase:** F (Automation & Workflow)  ·  **Pillar:** P5 (Automation)
**Dependencies:** V3-43 (workflow engine foundation), V3-44 (auto-assign / escalate)  ·  **Effort:** M  ·  **Parallel-safe:** Y
**Owner gate:** none  ·  **Risk class:** —

---

## Role
You are the V3 queue-health engineer for Henry Onyx. You execute exactly this one pass, then stop and report. You build the watchdog that catches operational neglect before a customer feels it: a scheduled monitor that measures the health of every staff work queue (support, KYC review, content moderation, finance refunds), detects SLA breach and staleness, and escalates up a defined chain — queue manager, then staff lead, then owner — with an optional load-redistribution proposal. The line you must not cross: this pass **observes and alerts**; it never silently reassigns a customer's case or mutates queue items. Redistribution is a **proposal** a human accepts — automation surfaces the problem, a person owns the fix.

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/47-workflow-neglected-queue-detection` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary
The staff workspace and its queues already exist; what is missing is a health watchdog over them.

- **Staff app:** `apps/staff/` with `app/(workspace)/{support,kyc,finance,care,marketplace,studio,...}` route groups and APIs at `app/api/{support,kyc,newsletter}`. Auth + scoping is `getStaffViewer()` (`apps/staff/lib/staff-auth.ts`), exposing `viewer.permissions` and `viewer.divisions`; service-role writes go through `createStaffAdminSupabase()` (`apps/staff/lib/supabase/admin.ts`).
- **Queue substrate:** `support_threads` / `support_messages` (columns include `division`, `assigned_to`, `subject`, `user_id`, status), the KYC review surface (`apps/staff/app/api/kyc/review/route.ts` + `apps/staff/lib/kyc-data.ts`), the moderation framework landing in **V3-25**, and the finance/refunds surface (`apps/staff/app/(workspace)/finance`, refunds engine in **V3-19**).
- **Staff notifications:** `@henryco/notifications` ships `publishStaffNotification(StaffPublishInput)` with a staff event registry (`packages/notifications/staff-event-types.ts`) already defining `staff.support.thread.assigned`, `staff.kyc.review.queued`, `staff.system.alert`, `staff.security.incident`, each with a default severity + deep-link template + payload allow-list, plus rate-limiting (`packages/notifications/rate-limit.ts`).
- **Scheduled-job pattern:** the account app's cron routes (`apps/account/app/api/cron/{engagement-sweep,notification-redelivery,notification-email-fallback,notification-purge}`) are the canonical model — `CRON_SECRET` Bearer auth, `createAdminSupabase()`, idempotent runs that dedupe via partial unique index, structured summary response.
- **Workflow engine (V3-43, dependency):** unifies cron + outbox + retry + idempotency into a reusable, observable engine. This pass schedules its monitor **on V3-43's engine**, not as a one-off cron route.

**The gap:** nobody watches the queues. An item can sit unassigned or unanswered past its SLA with no signal until a customer complains. This pass adds the per-queue health computation, configurable SLAs, a time-based escalation chain, and a human-gated redistribution proposal — all observable and audited.

## Mandatory scope

### S1 — Queue-health monitor (scheduled on the V3-43 engine)
Register a workflow job `queue-health-monitor` on the V3-43 engine, running every **10 minutes**, idempotent per (queue, division, run-window). Implement the computation in a new package module **`@henryco/workflow/queue-health`** (`packages/workflow/src/queue-health/`), consumed by a staff-app worker route `apps/staff/app/api/workflow/queue-health/route.ts` (the engine's invoker, `CRON_SECRET`-guarded like the existing cron routes).

For each monitored queue, compute a `QueueHealthSnapshot`:

```ts
export type QueueId = "support" | "kyc_review" | "moderation" | "finance_refunds";

export type QueueHealthSnapshot = {
  queue: QueueId;
  division: string | null;        // null = cross-division aggregate
  openCount: number;
  oldestItemAgeMinutes: number;   // age of the oldest unresolved item
  itemsPerActiveAgent: number;    // load proxy
  slaBreachCount: number;         // items already past their SLA
  slaAtRiskCount: number;         // items within the warn-window of breach
  health: "ok" | "at_risk" | "breached";
  computedAt: string;             // ISO
};
```

Source rows from the real tables: support from `support_threads` where unresolved; KYC from the KYC review queue; moderation from the V3-25 moderation queue (degrade gracefully to a no-op if V3-25 has not landed — guard on table existence and report "moderation queue not yet present"); refunds from the V3-19 refund-request surface (same graceful guard). "Active agent" count derives from staff division memberships via `getStaffViewer` data / the staff directory, not a hardcoded number.

Persist each snapshot to a new `queue_health_snapshots` table for trend history (S5 telemetry + future V3-42 dashboards consume it). The monitor never writes to the source queues.

### S2 — Per-queue SLAs (configurable, division-overridable)
Define default SLAs in `packages/workflow/src/queue-health/sla.ts`, overridable per division via a `queue_sla_config` table (service-role-managed, owner/lead-editable):

| Queue | Default response/resolution SLA | Warn window |
|---|---|---|
| `support` | 4 h first-response | 1 h before breach |
| `kyc_review` | 24 h | 4 h |
| `moderation` | 2 h (high-priority) / 24 h (standard) | 30 m / 4 h |
| `finance_refunds` | 48 h | 8 h |

A queue is `at_risk` when any item is within its warn window, `breached` when any item is past SLA. Config is read-through with the table overriding the code defaults; missing config falls back to the defaults (never undefined behavior).

### S3 — Escalation chain (time-based, audited)
On a `breached` queue, run the escalation ladder, each rung gated on the prior rung being unresolved for the dwell time:

1. **Initial alert → queue manager** (the division's queue owner; resolved from staff roles/permissions).
2. **+2 h unresolved → staff lead** (division lead / `workspace.manage` permission holder).
3. **+4 h unresolved → owner** (the owner notification channel).

Each rung fires `publishStaffNotification(...)` using the existing staff event registry — extend `packages/notifications/staff-event-types.ts` with `staff.queue.health_breach` (deep-link to the affected `(workspace)/<queue>` route, severity `warning`/`critical`). "Unresolved" means the snapshot for that queue is still `breached` at the next monitor tick; resolution clears the ladder state. Escalation state is tracked in a `queue_escalations` table so a single breach does not re-page the same rung every 10 minutes (dedupe per breach episode). Every rung fire writes `writeAuditLog(...)` from `@henryco/observability/audit-log`.

### S4 — Redistribution proposal (human-gated, never auto-applied)
When a queue is `breached` **and** `itemsPerActiveAgent` is skewed (one agent overloaded while others have capacity), compute a redistribution **proposal**: a list of `{ itemId, fromAgent, suggestedAgent, reason }`. Surface it in the breach alert payload and on the queue's workspace surface as an accept/dismiss action. **The proposal is never auto-applied** — a staff lead with the right permission accepts it, and only then does the existing assignment path (V3-44) reassign. This pass writes no `assigned_to` changes directly.

### S5 — Telemetry
Emit via `emitEvent(...)` from `@henryco/observability`, naming `henry.<domain>.<noun>.<verb>`:
- `henry.queue.health.computed` (every monitor tick, per queue — carries the snapshot)
- `henry.queue.health.breached` (a queue transitions ok/at_risk → breached)
- `henry.queue.escalation.sent` (a ladder rung fires — carries rung + recipient role)
- `henry.queue.redistribution.proposed`
- `henry.queue.redistribution.accepted` (a human accepted the proposal)

Payloads carry `{ queue, division, health, slaBreachCount, oldestItemAgeMinutes, rung? }`, PII-redacted per `@henryco/observability/redaction` (no customer identifiers in queue-health telemetry — counts and ages only).

## Out of scope
- Staffing/hiring recommendations and the advanced trend/anomaly dashboards (V3-42 staff dashboards — this pass produces the `queue_health_snapshots` trend data they consume).
- The actual assignment/escalation **mechanics** of reassigning an item (V3-44 owns the assignment path; this pass proposes, V3-44 executes).
- Per-queue operator UIs themselves (V3-44 wires the queues; this pass adds the health banner + proposal action only).
- Workload **prediction** (V3-41 — this pass uses present-state measurement, not learned forecasting; it inherits V3-41 signals when available).

## Dependencies
**Blocks on:** V3-43 (the monitor schedules on its engine; do not build a standalone cron), V3-44 (assignment path the redistribution proposal hands off to). Soft-depends on V3-19 (refunds queue) and V3-25 (moderation queue) — degrade gracefully if either is absent.
**This pass blocks:** nothing hard; feeds V3-42 staff dashboards with trend data.

## Inheritance
- `@henryco/workflow` (V3-43) — engine, scheduling, idempotency, observability hooks.
- `@henryco/notifications` — `publishStaffNotification`, `staff-event-types.ts` registry, rate-limiting.
- `@henryco/observability` — `emitEvent`, `writeAuditLog`, `redaction`.
- `apps/staff/lib/{staff-auth.ts,roles.ts,supabase/admin.ts}` — staff identity, permission/role resolution, service-role client.
- The existing cron-route pattern (`CRON_SECRET` Bearer, `createAdminSupabase`, idempotent summary) as the worker-route shape.
- V3-41 workload prediction (consume its signals as a redistribution input when available; do not block on it).

## Implementation requirements

### Files
- New package: `packages/workflow/src/queue-health/{index.ts,sla.ts,compute.ts,escalation.ts,redistribution.ts}` + `__tests__`.
- New staff route: `apps/staff/app/api/workflow/queue-health/route.ts` (engine invoker, `CRON_SECRET`-guarded).
- New staff UI: a health banner + redistribution accept/dismiss action on each `app/(workspace)/<queue>` surface (small additive components; reuse `@henryco/dashboard-modules-staff` patterns).
- Changed: `packages/notifications/staff-event-types.ts` (+`staff.queue.health_breach`).
- Migrations: `supabase/migrations/<ts>_v3_47_queue_health.sql` — `queue_health_snapshots`, `queue_sla_config`, `queue_escalations`, with RLS.
- V3-43 engine registration: register the `queue-health-monitor` job (every 10 min).

### Trust / safety / compliance
- **Read-only over source queues.** This pass never writes `assigned_to`, never resolves an item, never mutates `support_threads`/KYC/moderation/refund rows. Redistribution is proposal-only.
- **RLS:** `queue_health_snapshots` + `queue_escalations` readable only by staff with the relevant division/permission (via the staff RLS model); writes are service-role from the monitor route. `queue_sla_config` editable only by `workspace.manage` permission holders.
- **Idempotency:** monitor runs dedupe per (queue, division, run-window); escalation rungs dedupe per breach episode via `queue_escalations` so no rung re-pages every tick.
- **Audit:** `writeAuditLog` on every escalation fire and every accepted redistribution.
- **Auth:** worker route `CRON_SECRET` Bearer; UI actions gated by `getStaffViewer` permissions; redistribution accept requires the assignment permission.

### Mobile + desktop parity
Staff workspace is desktop-primary but responsive; the health banner + proposal action must work on the staff app's mobile breakpoint (no horizontal overflow, tap targets ≥ 44px). Alerts reach staff via the existing in-app staff notification channel (and email/push where the staff member opted in) — no new channel invented. No super-app surface in this pass.

### i18n
Staff-facing copy flows through `@henryco/i18n`. Introduce namespace **`surface:queue-health`** for banner labels, health states ("On track" / "At risk" / "Breached"), escalation-notice copy, and the redistribution proposal action. Staff notifications/emails localize to the staff member's locale via the existing notification/email locale resolution. No hardcoded strings; staff-internal log lines that surface to humans are translated per V3-07b's operator-surface posture.

### Brand & design system
Staff banners and notifications use the staff workspace design system (`@henryco/dashboard-shell` / `dashboard-modules-staff` tokens) — light + dark, no ad-hoc hex. Any brand string is **Henry Onyx** / division "Henry Onyx <Division>" sourced from `@henryco/config`. No hardcoded domains — any deep link via `getStaffHqUrl()` / `henryWebRoot()`.

## Validation gates
1. **CI:** `pnpm -F staff typecheck && lint && test && build`; `pnpm -F @henryco/workflow typecheck && test`; `pnpm -F @henryco/notifications typecheck && test`; root build green.
2. **Health computation unit tests (~12):** synthetic queues at varied ages/loads produce the correct `health` and `slaBreach`/`slaAtRisk` counts; SLA config override beats code default; missing config falls back to default.
3. **SLA breach smoke:** a synthetic queue aged past SLA → next monitor tick computes `breached` → `staff.queue.health_breach` notification fires to the queue manager → `henry.queue.health.breached` + `henry.queue.escalation.sent` emitted → audit row written.
4. **Escalation-chain test:** breach unresolved → +2 h escalates to staff lead → +4 h to owner; each rung fires exactly once per breach episode (no re-page on every tick); resolution clears ladder state.
5. **Redistribution test:** skewed load → proposal computed and surfaced; accept → hands off to V3-44 assignment path; this pass writes no `assigned_to` itself.
6. **Graceful-degrade test:** moderation (V3-25) and refunds (V3-19) tables absent → monitor skips them, reports "queue not present", does not error.
7. **RLS verification:** staff outside a division cannot read that division's `queue_health_snapshots`/`queue_escalations`; non-`workspace.manage` cannot edit `queue_sla_config`.

## Deployment gate
- All validation gates green.
- **14-day soak** in the staff workspace with real queues: confirm alerts fire on genuine breaches, no false-positive paging storms (rate-limit + episode-dedupe verified against production cadence), and the escalation ladder reaches the owner only on genuinely stuck queues.
- Queue managers + staff lead confirm the alert routing maps to the correct humans before owner-rung escalation is enabled.

## Final report contract
`.codex-temp/v3-47-workflow-neglected-queue-detection/report.md` with the standard 9 sections (exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification · telemetry baseline · deferred items · pass-closure assertion). Record the final SLA defaults shipped, the escalation dwell times, the queues live at merge vs gracefully-degraded, and the 14-day soak observations (breach count, false-positive rate, owner-rung reaches).

## Self-verification
- [ ] S1 monitor runs on the V3-43 engine every 10 min, idempotent, computing a `QueueHealthSnapshot` per queue from real tables; persists to `queue_health_snapshots`; writes nothing to source queues.
- [ ] S2 SLAs configurable per division via `queue_sla_config`, code defaults as fallback; `at_risk` / `breached` thresholds correct.
- [ ] S3 escalation ladder (queue manager → +2h staff lead → +4h owner) fires once per breach episode via `queue_escalations` dedupe; every rung audited.
- [ ] S4 redistribution is a human-gated proposal; accept hands off to V3-44; this pass writes no `assigned_to`.
- [ ] S5 all 5 `henry.queue.*` telemetry events emit with redacted, customer-PII-free payloads.
- [ ] Graceful degrade when V3-25 moderation / V3-19 refunds queues are absent.
- [ ] RLS verified on all three new tables; `CRON_SECRET` on the worker route; permission gates on UI actions.
- [ ] Staff copy via `@henryco/i18n` (`surface:queue-health`); brand "Henry Onyx" via `@henryco/config`; zero hardcoded domains/strings; staff dashboard tokens, light + dark, mobile-safe.
- [ ] 14-day soak passed; report written with the 9 standard sections.
