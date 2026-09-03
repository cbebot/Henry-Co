# Architecture — The Platform Workflow Engine & Its Automations

> **⚠️ RE-GROUNDED 2026-07-24 — read [RE-GROUNDING-2026-07-24.md](./RE-GROUNDING-2026-07-24.md) first.** SA-2/SA-3/SA-4 are now MERGED on `origin/main @ 241f068a` (not design-only; the base was `8c9794b5`). Where this doc says the SA machine is design-only / the fork risk is prospective, the re-grounding file is authoritative.

**Pass:** V3-F-DESIGN-01 · Design only. Type shapes and SQL here are **design contracts**, not shipped code — written concretely so the build passes (V3-43…48) have no ambiguity. Anchored on `origin/main @ 241f068a` (re-grounded 2026-07-24; orig base 8c9794b5); trust the named symbols over line numbers.

Read [ENGINE-UNIFICATION.md](./ENGINE-UNIFICATION.md) first (the one-engine decision) and [REGROUNDING-LEDGER.md](./REGROUNDING-LEDGER.md) (what already exists). Money/AI rules live in [AI-IN-AUTOMATION.md](./AI-IN-AUTOMATION.md); suppression rules in [CAMPAIGNS-AND-SUPPRESSION.md](./CAMPAIGNS-AND-SUPPRESSION.md).

---

## 0. The one-paragraph shape

Phase F turns "≈18 hand-rolled cron routes that silently drop work" into **one observable durable-job rail** and five automations that ride it. The rail (`@henryco/workflow`, V3-43) is a **generalization of the `search_index_outbox` + `drainOutbox()` idiom already on main**: a Postgres job table (`workflow_jobs`) with at-least-once delivery, idempotent enqueue, bounded retry, dead-letter, and a single minute-drain cron — driven through the existing `CRON_SECRET` guard and `createAdminSupabase()` client, emitting through the existing `@henryco/observability` spine. On top of it: **auto-assign + escalation** (V3-44/47) route staff-queue work deterministically and page a human when SLAs breach; **reminders** (V3-45) nudge customers toward incomplete actions through one consent chokepoint; **owner reports** (V3-46) generate watermarked owner-only PDFs on a schedule; **campaigns** (V3-48) run post-event nurture sequences under absolute suppression governance. Every automation is a **domain saga on the shared rail** — its own state table, its handlers registered on the engine — never a rival drain loop.

```
 detection / events                @henryco/workflow (the rail)                consumers of the rail
 ──────────────────                ────────────────────────────                ──────────────────────
 emitEvent / persistEvent ──►  dispatchWorkflowFor(event) ─┐
 engagement-sweep signals                                  ▼
 division completion emitters   enqueue(key, payload, {idempotencyKey})
 cron schedules ───────────►    workflow_jobs (pending) ◄── unique(workflow_key, idempotency_key)
                                        │  every-minute drain cron (CRON_SECRET)
                                        ▼  claim_workflow_jobs (FOR UPDATE SKIP LOCKED)
                                   registry.resolve(key) → handler(ctx)
                                        │  complete_workflow_job → succeeded | failed(retry) | dead_letter
                                        ▼  workflow_runs (append-only) + writeAuditLog + henry.workflow.*
     ┌──────────────┬───────────────────┼────────────────────┬───────────────────┐
     ▼              ▼                   ▼                    ▼                   ▼
  auto-assign   escalation/          reminders            owner reports        campaigns
  (V3-44)       queue-health(V3-47)  (V3-45)              (V3-46)              (V3-48)
  → assigned_to → publishStaff…      → publish/email/SMS  → branded PDF        → email(stream)/
     + audit        + owner rung         (consent gate)      (watermark)          in-app/push (suppression)
```

---

## 1. The rail — `@henryco/workflow` (V3-43)

### 1.1 What it generalizes (not greenfield)
The rail is the **search-outbox idiom promoted to a division-agnostic package**. Mapping:

| search-outbox (exists on main) | `@henryco/workflow` (design) |
|---|---|
| `search_index_outbox` (attempts/attempted_at/last_error/completed_at) | `workflow_jobs` (attempts/next_attempt_at/status) |
| `enqueue_search_index_op()` secdef writer | `enqueue()` → `claim_workflow_jobs` / `complete_workflow_job` secdef RPCs |
| `drainOutbox()` (`packages/search-core`) batch-claim + `MAX_ATTEMPTS=8` + failure-class | `WorkflowEngine.drain()` + `retry-policy.ts` + `WorkflowResult.retryable` |
| hub `search-index-worker` cron `* * * * *` | hub `workflow-drain` cron `* * * * *` |
| `purge_completed_search_outbox()` | `purge_completed_jobs()` retention |
| indexing lag/dead-letter telemetry | `henry.workflow.*` telemetry + owner health tile |

**The search outbox becomes the first migrated client**: the whole `search-index-worker` route body (`drainOutbox` + `purge_completed_search_outbox` + backlog/dead-letter probes + `henry.search.indexing.*` telemetry) runs as one registered handler — proving the generalization without changing search behaviour (behaviour-lock wraps the full route, not just the `drainOutbox()` call).

### 1.2 Package shape (runtime-safe / server-only split)
Consumed as raw TS (monorepo convention: `exports → ./src/*`, `node:test` + `tsx`). Barrel is runtime-safe; DB-touching modules carry `import "server-only"` so a client bundle never drags them in (mirrors `@henryco/ai-gateway`'s exports-map boundary).

```
packages/workflow/src/
  index.ts            barrel — runtime-safe re-exports only
  types.ts            WorkflowKey, JobStatus, RetryPolicy, WorkflowHandler,
                      WorkflowContext, EnqueueOptions, DrainResult, WorkflowResult
  retry-policy.ts     exponential backoff + jitter; nextAttemptAt(attempt, policy); pure
  registry.ts         handler registry: register(key, handler), resolve(key)
  engine.ts           'server-only' — WorkflowEngine (enqueue/drain)
  primitives/         'server-only' — SHARED with SA-3 (see ENGINE-UNIFICATION §Shared primitives)
    cas-claim.ts        FOR UPDATE SKIP LOCKED claim helper
    hmac-callback.ts    owner-inbound-email handshake verifier (replay-window + monotonic seq)
    heartbeat.ts        visibility-timeout / stall detection
    event-log.ts        append-only run/event writer + writeAuditLog(correlationId) + emitEvent
  store/
    job-store.ts        'server-only' — durable Supabase-backed claim/complete/fail
    in-memory-job-store.ts  transactional test double mirroring the SQL RPC semantics
  triggers/
    cron.ts             'server-only' — drain entrypoint the workflow-drain route calls
    event.ts            HenryEventName → WorkflowKey map + dispatchWorkflowFor(event)
  telemetry.ts        JobStatus → EventOutcome for the henry.workflow.* events
```

`WorkflowResult = { status: "succeeded"; output? } | { status: "failed"; retryable: boolean; error }` — `retryable` drives reschedule-vs-dead-letter. A handler is `(ctx: WorkflowContext) => Promise<WorkflowResult>`.

### 1.3 State, triggers, retries, idempotency, failure, resumability
- **State (`workflow_jobs.status`):** `pending → claimed → running → succeeded | failed | dead_letter`. `failed` is retryable-and-scheduled; `dead_letter` is terminal + alerted.
- **Triggers (three):** (1) **cron** — the minute-drain plus schedule-seeded jobs; (2) **event** — `dispatchWorkflowFor(HenryEventName)` maps a domain event to a `WorkflowKey` and enqueues (seed the map typed-but-mostly-empty in V3-43; V3-44…48 fill it); (3) **direct enqueue** from app code.
- **Retries:** `retry-policy.ts` exponential backoff + jitter, `max_attempts` default 5 (generalizes search's `MAX_ATTEMPTS=8`). An uncaught throw is treated as `retryable:true` up to the cap.
- **Idempotency:** `enqueue` requires an idempotency key (caller-supplied or payload-derived); `unique (workflow_key, idempotency_key)` makes re-enqueue a no-op (at-least-once, not at-most-once). One poisoned job never aborts a batch (`drain` wraps each handler in try/catch).
- **Failure handling:** `retryable:false` → immediate dead-letter; `attempts+1 >= max_attempts` → dead-letter; a non-zero dead-letter count raises a `publishStaffNotification` (never silently swallowed).
- **Resumability:** claim is `FOR UPDATE SKIP LOCKED`; a claimed-but-never-completed job is reclaimable after a visibility timeout (the "crash-between-claim-and-complete" case) — the same primitive SA-3 needs for executor stall detection.

### 1.4 Schema + RPCs (design contract)
`workflow_jobs` + `workflow_runs` in `apps/hub/supabase/migrations/<ts>_workflow_engine_foundation.sql` (hub owns the cross-division schema, as it hosts owner/search crons). **Applied in-pass** (empty tables are inert until handlers enqueue). Mutated **only** via `SECURITY DEFINER` RPCs (`claim_workflow_jobs(p_limit)`, `complete_workflow_job(...)`) that mirror the ledger/search-outbox discipline: `payments_private`-style isolation is overkill here, but the RPCs are the sole write path, granted to `service_role` only. RLS read predicate = `public.is_platform_staff()` (owner + platform staff for the health tile); no anon; no client writes.

### 1.5 Composition with the spine
- **Observability:** every transition emits a `henry.workflow.*` event via `emitEvent` (log + Sentry), optionally `persistEvent` to `henry_events` for the data-lake (V3-90), and `writeAuditLog` (`add_audit_log_v2`, `correlationId = jobId`) for any state-mutating handler. **Note the three distinct paths** — `emitEvent` does not persist; `persistEvent` and `writeAuditLog` do. Add exactly five names to the compile-enforced `HenryEventName` union + `docs/event-taxonomy.md`: `henry.workflow.job.{enqueued,started,succeeded,failed,dead_letter}`.
- **Cron/auth:** `apps/hub/app/api/cron/workflow-drain/route.ts` reuses the `Authorization: Bearer ${CRON_SECRET}` guard (prefer the hardened `timingSafeEqual` variant), `runtime="nodejs"`, `dynamic="force-dynamic"`, `createAdminSupabase()`; schedule `* * * * *` in `apps/hub/vercel.json`.
- **AI gateway:** the rail itself makes **no** AI calls. A handler that needs AI goes through `runAiTaskWith` with the money directives ([AI-IN-AUTOMATION](./AI-IN-AUTOMATION.md)); the rail adds a **per-job AI-spend guard** so a runaway loop cannot compound cost.

### 1.6 Migrating the existing crons (behaviour-locked)
Each cron becomes a registered handler behind a thin `engine.enqueue(key, payload)` wrapper — schedule unchanged, behaviour unchanged, now retryable + dead-letter-protected. Order (lowest-risk first), **corrected to the real inventory** ([REGROUNDING-LEDGER §2.1](./REGROUNDING-LEDGER.md#21-cron--outbox-idiom-v3-43-substrate)):
1. `notification-purge` → `notification-redelivery` → `notification-email-fallback` (account)
2. `engagement-sweep`, `recovery-sweep`, `kyc-retention` (account — the prompt omits the last two)
3. `search-index-worker` (hub — the **whole route body**: `drainOutbox` + purge + backlog/dead-letter probes + lag telemetry becomes one handler, proving the generalization)
4. the **six** division `*-automation` sweeps: care, marketplace, property, learn, logistics, studio (**not jobs** — it has `jobs-alerts`, a bespoke matcher, not a sweep)
5. `owner-reports` (hub — the scheduled route; the unscheduled `owner-reporting/{weekly,monthly}` become handler entry points under V3-46)

Acceptance per migration: prior summary shape preserved; prior schedule preserved; now durable. **14-day soak** vs pre-migration baseline before the rail is authoritative.

---

## 2. Auto-assign & escalation (V3-44) — Register-D

**Goal:** every inbound staff-queue item (support thread, KYC review, moderation case, finance refund) is deterministically routed to the right queue + owner; risky/SLA-breaching items auto-escalate up an audited chain. Assignment is deterministic and auditable — no silent reassignment; every machine assignment and human override writes an audit row.

### 2.1 Substrate (re-grounded)
- Queue tables carry `assigned_to` but **no `assigned_at`** ([REGROUNDING-LEDGER §2.11](./REGROUNDING-LEDGER.md#211-staff-queues-substrate-v3-4447)). **V3-44 adds `assigned_at` + `assignment_reason` + `escalation_level` + `escalation_path[]`** idempotently to the four queue domains, plus a `workflow_queue_config` table (per-queue `sla_minutes`, `escalate_after_minutes`, `high_value_minor` BIGINT, `round_robin`, `active`). `workflow_queue_config` RLS: read `is_platform_staff()`, write owner/admin.
- `triageSupportStub` is invoked today **only to set support-thread priority** (`apps/account/app/api/support/{create,reply}` via `triageSupportInput`); **no code routes its `suggestedQueue` into an assignable staff queue** — V3-44 is that first queue-routing consumer. `SupportQueue = general|trust|finance`, escalate below `TRIAGE_CONFIDENCE_ESCALATE_THRESHOLD=0.55` (route to `general` **and** flag for human triage — never guess into trust/finance on low confidence).

### 2.2 Rule module (pure, in `packages/workflow/src/assignment/`)
`resolveSupportQueue(triage)`, `nextAssignee(roster, cursor)` (deterministic round-robin over a sorted roster + persisted cursor — no hidden randomness), `shouldEscalate(input)` (SLA breach | repeat offender | high-value ≥ `high_value_minor` BIGINT | high-severity `RiskSignal` | owner-only). Finance amounts are **BIGINT minor units**, never float.

### 2.3 Handlers + escalation chain
Registered on the rail, wired into the event-trigger map: `henry.support.thread.created → support.auto_assign`, `henry.trust.verification.submitted → kyc.auto_assign` (round-robin), moderation-created → `moderation.auto_assign`, and a periodic `assignment.escalation_sweep`. The chain — **consistent with the ratified SA-D2 posture** (never auto-advance a human decision) — is **queue manager → +2h staff lead → +4h owner**, each rung appending to `escalation_path`, writing `writeAuditLog(action='workflow.escalate')`, and paging via `publishStaffNotification` (extend `staff-event-types.ts` with `staff.queue.health_breach`). Manual override route `POST /api/staff/queues/[queue]/[id]/assign` is wrapped in `requireSensitiveAction` (the platform reauth guard), audited old/new, rejects self- and wrong-queue targets.

> **AI note:** V3-44's "AI-augmented escalation" (PASS-REGISTER wording) must stay on the **free deterministic stub** or route through the governed gateway as **internal non-billable** ([AI-IN-AUTOMATION §4](./AI-IN-AUTOMATION.md)). It never debits a customer wallet and never fills a money param. This is why V3-44 is risk-class **M (AI-adjacent)**.

### 2.4 Telemetry
`henry.workflow.{assigned,escalated,reassigned}` — payload carries `queue_key`, `assignment_reason`, `escalation_level`; actor ids only, redacted.

---

## 3. Neglected-queue detection (V3-47) — Register-D

**Goal:** a watchdog that measures every staff queue's health, detects SLA breach/staleness, escalates up the same chain, and offers a **human-gated** redistribution proposal. It **observes and alerts** — it never silently reassigns or mutates a queue item.

- **Monitor** `queue-health-monitor` registered on the rail, every 10 min, idempotent per (queue, division, run-window); computes a `QueueHealthSnapshot` (openCount, oldestItemAgeMinutes, itemsPerActiveAgent, slaBreachCount, slaAtRiskCount, health) per queue from the **real tables**, persisting to `queue_health_snapshots` for trend history (feeds V3-42). **No `assigned_at`** → age is proxied by `updatedAt` vs `staff_last_read_at` (the pattern staff-support already uses), unless V3-44's `assigned_at` has landed.
- **SLAs** in `queue_sla_config` (division-overridable; code defaults as fallback): support 4h / KYC 24h / moderation 2h-hi·24h-std / refunds 48h.
- **Escalation** reuses V3-44's chain and `queue_escalations` dedupe (one rung per breach episode — no re-page every tick).
- **Redistribution** is a **proposal** (`{itemId, fromAgent, suggestedAgent, reason}`) surfaced in the breach alert + on the Track-C `/modules/[slug]` surface (**not** the retired `(workspace)` route); a lead **accepts**, then V3-44's assignment path reassigns. This pass writes no `assigned_to` itself.
- **Graceful degrade:** `moderation_reports` is **absent on main**; V3-25 `platform_moderation_queue` and V3-19 refund tables **exist**. Guard on table existence and report "not yet present" rather than erroring.
- **Telemetry** `henry.queue.{health.computed,health.breached,escalation.sent,redistribution.proposed,redistribution.accepted}` — counts/ages only, no customer PII.

---

## 4. Auto-remind (V3-45) — Register-L, consent-gated

**Goal:** nudge users toward incomplete/expiring/abandoned actions across in-app, email, push, and (high-priority + opted-in only) SMS, with per-type cadence, quiet-hours, and per-channel/per-type opt-out. **Transactional consent-gated nudges, never marketing** — opt-out and quiet-hours are absolute.

- **Consumes V3-37 detection** (`abandoned_tasks` + `planRecoveryDispatch` cadence) and the engagement-sweep signals (`cart_abandoned`, `kyc_incomplete_after_signup`) that are **emitted-and-dropped today** — V3-45 is their consumer. (Correct the prompt's path: recovery logic is `packages/lifecycle/src/recovery`, not `packages/interactions`.)
- **Schema** `reminder_schedules` (one live schedule per actionable item, unique) + `reminder_dispatches` (per-channel, `suppressed_reason`), user-own RLS + cascade-delete on user removal (NDPR).
- **Catalog** ≥8 types with data-driven cadence (`packages/workflow/src/reminders/catalog.ts`): kyc_incomplete, cart_abandoned, booking_abandoned, saved_item_expiring, verification_pending, important_notification_unread, subscription_renewal, appointment_upcoming (SMS only when high-priority **and** `sms_enabled`).
- **The single consent chokepoint** `evaluateReminderGate(input)` (`reminders/gate.ts`) — every dispatch passes through it; returns `{allow:false, reason: quiet_hours|opted_out|channel_disabled}`. Rules read the confirmed `customer_preferences` columns: `muted_event_types`/`muted_divisions` → opted_out; push/SMS inside quiet hours (resolved against the **single** `quiet_hours_timezone`, default 22:00–07:00) → quiet_hours (in-app + email may still queue; push/SMS suppressed **and rescheduled** to the window edge); `sms_enabled=false` → channel_disabled; under `high_priority_only`, only high-priority types dispatch. Every suppression recorded — never silent.
- **Channel adapters** route through existing senders only: in-app → `publishNotification` (note: **no dedupe** — the `reminder_schedules` unique constraint + `step_index` are the idempotency, not the publisher); email → `sendTransactionalEmail` (**Postmark**, purpose per division, logged in `notification_delivery_log`); push → existing push path (severity gating: publisher only pushes `{urgent, security}` — reminders that need push must map to an appropriate severity); SMS → existing provider behind the gate. Schedule is **cancelled** when the action completes — never remind for a done thing.
- **Telemetry** `henry.reminder.{sent,acted_upon,opted_out}`.

> Reminders are **transactional**, so they do **not** call `evaluateSuppression` (that governs marketing) — but they **do** honor quiet-hours + per-type/channel opt-out. The line between "transactional nudge" (V3-45) and "marketing campaign" (V3-48) is the whole point; see [CAMPAIGNS-AND-SUPPRESSION §Boundary](./CAMPAIGNS-AND-SUPPRESSION.md#the-transactional-vs-marketing-boundary).

---

## 5. Owner reports (V3-46) — Register-D, owner-only

**Goal:** formalize the existing weekly/monthly machinery into scheduled weekly+monthly+**quarterly** + on-demand **custom** reports on the rail, each a **watermarked, owner-only PDF**, persisted. Internal financial truth — must never leak.

- **Re-grounded:** `OwnerReportKind` is already `daily|weekly|monthly` (a daily email-only morning brief was added — extend to `quarterly`+`custom` **without clobbering the daily path**, which builds no PDF). The report uses the **owned type** (HenryCoSerif/Sans/Mono), **not Fraunces**.
- **Missing pieces V3-46 builds:** an `owner_reports` persistence table (`is_owner()` RLS — owner-only, **not** `is_platform_staff()`), the `owner-reports` **storage bucket migration + policy** (no migration provisions it today — the upload silently degrades to HTML-only if the bucket is absent), the **watermark** (BrandedDocument supports a `watermark` prop that `OwnerReportDocument` never passes → PDFs are un-watermarked; wire it + add the ANTI-CLONE-P5 visible `${ownerId}.${timestamp}` string + HMAC metadata + `branded_document_exports` tracking).
- **On the rail:** register `owner_report.{weekly,monthly,quarterly}` handlers; the scheduled `owner-reports` cron becomes a thin enqueue wrapper (Lagos-TZ period boundaries preserved); idempotent per (kind, period) via the engine key. Custom builder `apps/hub/app/(owner)/reports/builder` + `POST /api/owner/reports/custom` — `is_owner()`-gated + rate-limited; delivery is a **short-lived signed URL**, never an object key; financial figures never leave the PDF (not in telemetry, logs, or the email body).
- **Graceful degradation:** a section whose source isn't live renders "not yet measured", never a fabricated zero (the V3-08 empty-state principle). Sources: ledger/refunds/AI-margin/queue-health degrade gracefully when absent.
- **Telemetry** `henry.owner_report.{scheduled_generated,custom_generated,opened}` — kind/period/section-count only, **no figures**.
- **Risk-class M (AI-adjacent):** if a report uses `composeMorningBriefNarrative` (AI narrative), it runs as **internal non-billable** AI ([AI-IN-AUTOMATION §4](./AI-IN-AUTOMATION.md)).

---

## 6. Follow-up campaigns (V3-48) — Register-L, marketing-governed

**Goal:** after a completed customer event (purchase, booking, service, course), run a multi-step nurture sequence across email/in-app/push. **Lifecycle/marketing class, never transactional** — every send passes `evaluateSuppression`, rides the marketing rail, honors opt-out + quiet-hours.

- **Re-grounded (critical):**
  1. The **completion events do not exist** — V3-48 must **add the emitters** (`order.completed`/`booking.completed`/`service.completed`/`course.completed`) into the division dispatchers before a sequencer has anything to subscribe to.
  2. The marketing "rail" is **Postmark Message Streams**, not Brevo. `resolvePostmarkStream` routes by `purpose`/`messageStream` only (**never `campaignClass`**), and only `purpose:'newsletter'` auto-maps to `marketing-broadcast`. So a `lifecycle_journey` campaign (class corrected from `"lifecycle"`) that wants a **division-branded sender** (`purpose:<division>`) MUST **also** pass an explicit `messageStream:'marketing-broadcast'` override, or it silently rides the division **transactional** stream — see [CAMPAIGNS-AND-SUPPRESSION SUP-3](./CAMPAIGNS-AND-SUPPRESSION.md#2-ci-rules). Every send passes `evaluateSuppression` first.
- **Schema** `campaign_enrollments` (UNIQUE on user+campaign+source-entity = the idempotency anchor), `campaign_step_sends` (dedupe per enrollment+step+channel), `campaign_opt_outs`; owner-only-own-row RLS.
- **Sequencer** on the rail: `campaign.enroll` (on completion event, idempotent) + `campaign.step_runner` (each step checks governance **at send time**, so an opt-out between steps halts the rest). Four declarative campaigns (`post_purchase`/`post_booking`/`post_service`/`post_course`), copy **by key only** (`surface:campaigns`, 12 locales), deterministic A/B arm (stable hash) until V3-91.
- **Governance = the hard invariant** — fully specified as **testable CI rules** in [CAMPAIGNS-AND-SUPPRESSION.md](./CAMPAIGNS-AND-SUPPRESSION.md). In short: email → `evaluateSuppression`/`scopeMatchesCampaign` before every send + marketing stream; in-app/push → `customer_preferences` muting + rate-limit + quiet-hours (deferred, not dropped); per-campaign opt-out writes a suppression entry honored on the next step.
- **Telemetry** `henry.campaign.step.{sent,opened,clicked,skipped}` (+ `skip_reason`) + `henry.campaign.conversion` — arm-attributable, PII-redacted.

---

## 7. Composition summary (how each automation touches each spine)

| Automation | Rail (V3-43) | Notifications | Email (Postmark) | Suppression | AI gateway | Money | Audit/telemetry |
|---|---|---|---|---|---|---|---|
| **Engine** (43) | — (is the rail) | dead-letter alert via `publishStaffNotification` | — | — | per-job AI-spend guard | never | `henry.workflow.*` + audit |
| **Assign/escalate** (44) | handlers + escalation sweep | `publishStaffNotification` (staff.queue.health_breach) | — | — | free stub / internal-only | reads amounts (BIGINT), no debit | `writeAuditLog` per assign/escalate/override |
| **Queue-health** (47) | 10-min monitor | staff notif rungs | — | — | — | — | `henry.queue.*` |
| **Reminders** (45) | schedule + dispatch sweep | `publishNotification` (in-app/push) | `sendTransactionalEmail` | quiet-hours + opt-out (not `evaluateSuppression`) | — | — | `henry.reminder.*` |
| **Owner reports** (46) | scheduled handlers | — | owner email (signed link) | — | internal narrative (optional) | reads truth, no mutation | `owner_report` audit + `henry.owner_report.*` |
| **Campaigns** (48) | enroll + step-runner | `publishNotification` | `marketing-broadcast` via explicit `messageStream` override + `evaluateSuppression` | **`scopeMatchesCampaign` before every send** | none (templated copy) | — | `henry.campaign.*` |

---

## 8. Where everything lands (integration table)

| Concern | Reuse / extend | Anchor on `main` |
|---|---|---|
| Durable job rail | **new** `@henryco/workflow` + `workflow_jobs`/`workflow_runs` | generalizes `search_index_outbox` + `drainOutbox()` (`packages/search-core`) |
| Drain cron | **new** `apps/hub/app/api/cron/workflow-drain` | `apps/hub/app/api/cron/search-index-worker` + `CRON_SECRET` guard |
| Shared saga primitives (CAS/HMAC/heartbeat/event) | **new** `packages/workflow/src/primitives/*` | `owner-inbound-email` HMAC, `founder_action_proposals` CAS, search-outbox retry |
| Assignment substrate | **extend** queue tables (+`assigned_at`/reason/escalation) + **new** `workflow_queue_config` | `assigned_to` on support/marketplace/moderation tables |
| Triage | **reuse** `triageSupportStub` (first consumer) | `packages/intelligence/src/index.ts` |
| Reminder/campaign consent | **reuse** `evaluateReminderGate` (new) + `evaluateSuppression`/`scopeMatchesCampaign` | `packages/newsletter/src/suppression.ts`, `customer_preferences` |
| Channel sends | **reuse** `publishNotification`/`sendTransactionalEmail` | `packages/notifications`, `packages/email` (Postmark) |
| Owner report persistence + watermark | **new** `owner_reports` table + bucket policy + watermark wiring | `owner-reporting.ts`, `@henryco/branded-documents` (`watermark` prop) |
| AI in a step | **reuse** `runAiTaskWith` (internal non-billable) | `packages/ai-gateway`, `ai_free_spend_ledger` |
| Observability | **reuse** `emitEvent`/`persistEvent`/`writeAuditLog` | `packages/observability` |
| Studio saga (future) | **register** `studio.orchestrator.tick` on the rail | `docs/v3/studio-agency/ARCHITECTURE.md §3` (design) |
