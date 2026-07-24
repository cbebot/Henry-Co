# Engine Unification — Does the platform engine generalize SA-3?

> **⚠️ RE-GROUNDED 2026-07-24 — read [RE-GROUNDING-2026-07-24.md](./RE-GROUNDING-2026-07-24.md) first.** SA-2/SA-3/SA-4 are now MERGED on `origin/main @ 241f068a` (not design-only; the base was `8c9794b5`). Where this doc says the SA machine is design-only / the fork risk is prospective, the re-grounding file is authoritative.

**Pass:** V3-F-DESIGN-01 · Design only. This document answers the one architectural question that decides Phase F's shape, and shows the composition + migration path so no builder is guessing.

> **Verification status (re-grounded 2026-07-24):** the substrate this doc names (`search_index_outbox` + minute-cron + `founder_action_proposals` + `owner-inbound-email` HMAC) is real and on prod. **The premise "SA-3 is design-only on main" is NO LONGER TRUE** — SA-2/SA-3/SA-4 are merged (`#512`/`#523`/`#524`), so the migration below is a **retrofit of shipped code**, not a prospective seam. The thesis (generalize at the rail) is unchanged and stronger; [RE-GROUNDING §2](./RE-GROUNDING-2026-07-24.md) tables the shipped duplications (two ticks, two lock tables, two internal-spend counters) V3-43 must absorb.

---

## The question

SA-3 (design) builds an **orchestration coordinator** for studio build jobs: a `studio_build_jobs` state table with a 15-stage lifecycle, advanced by a `CRON_SECRET`-gated `/api/agency/tick` with CAS claim, HMAC executor callbacks, bounded retry, stall detection, and a decisions inbox. Phase F (V3-43) calls for a **platform** workflow engine: one durable job rail that unifies the scattered crons and carries auto-assign, escalation, reminders, reports, and campaigns.

Two engines that both look like "Postgres table + cron drain + retry + idempotency." **Do we build one, or two?** The brief's constraint: *do not ship two competing engines.*

## The answer

**Generalize at the RAIL layer. SA-3's build-job lifecycle stays a domain _saga_ that runs ON the shared rail — it does not become a second engine, and it is not flattened into a generic queue.**

> **One rail. Many process definitions. Zero rival drain loops.**

Concretely:
- **`@henryco/workflow` (V3-43)** owns the **rail**: the durable at-least-once job substrate (`workflow_jobs`/`workflow_runs`, `claim_workflow_jobs`/`complete_workflow_job`, retry-policy, dead-letter, idempotency, the single minute-drain cron, `henry.workflow.*` telemetry, audit correlation). This is a **generalization of the `search_index_outbox` + `drainOutbox()` idiom that already exists on main** — not a new queue.
- **Studio build orchestration (SA-2/SA-3)** is a **domain saga**: `studio_build_jobs` keeps its 15 domain stages and its money/executor/human-gate concerns, because those are *not* generic task state. Its **tick becomes a registered handler on the rail** (`"studio.orchestrator.tick"`), and its side-effects (executor dispatch, notify, deploy-check, aftercare) become **jobs enqueued on the rail**. The saga does the *thinking*; the rail does the *running*.

This is "SA-3 becomes one workflow definition on a shared engine" — read precisely: SA-3 is a **client + a process definition** on the shared engine, not a table folded into `workflow_jobs`.

## Why generalize at the rail, not the state

The two are **congruent in substrate but different in altitude**:

| | Platform rail (`@henryco/workflow`) | Studio build saga (`studio_build_jobs`) |
|---|---|---|
| **Abstraction** | generic durable job: enqueue → drain → retry → dead-letter | a specific business process with 15 named stages |
| **Lifetime** | seconds–minutes per job; at-least-once | **days**; long-lived, human-gated, resumable |
| **State** | `pending/claimed/running/succeeded/failed/dead_letter` | `queued/dispatching/building/qa/client_review/owner_review/approved_for_deploy/deploying/live/aftercare/…` |
| **Actors** | one handler | client + owner + external sandboxed executor + orchestrator |
| **Money** | none | budget envelope, deploy is irreversible, refund policy |
| **Who may know its stages** | nobody (opaque payload) | studio domain only |

A generic queue **must not** encode studio stages (that couples the platform to one division). A studio saga **must not** re-invent the drain loop (that is the second engine we're forbidding). So the correct cut is: **the rail is shared; the state machine is the domain's.**

The same cut applies to Phase F's own automations — they are *also* domain sagas on the shared rail, not rows in `workflow_jobs`:

| Process definition | Domain state table | Runs on the rail via |
|---|---|---|
| studio build (SA-2/3) | `studio_build_jobs` | `studio.orchestrator.tick` handler + side-effect jobs |
| escalation ladder (V3-44/47) | `workflow_queue_config` + `queue_escalations` | `assignment.escalation_sweep` / `queue-health-monitor` handlers |
| reminder cadence (V3-45) | `reminder_schedules` / `reminder_dispatches` | `reminder.schedule` / `reminder.dispatch_sweep` handlers |
| campaign sequence (V3-48) | `campaign_enrollments` / `campaign_step_sends` | `campaign.enroll` / `campaign.step_runner` handlers |
| owner reports (V3-46) | `owner_reports` | `owner_report.{weekly,monthly,quarterly}` handlers |

`workflow_jobs` is the **unit of durable execution**; the domain tables are the **units of business state**. One rail carries them all.

## The "two competing engines" risk is real — and NOW PRESENT (re-grounded 2026-07-24)

**~~Because SA-3 is not built yet, the risk is a *future* fork.~~** That is no longer true. SA-2/SA-3/SA-4 are **merged**, so the estate **already ships two bespoke agency drain loops** — `/api/agency/tick` (studio, `runAgencyTick`) **and** `/api/cron/operator-tick` (hub, SA-4 `runOperatorTick`) — plus **two** single-flight lock tables (`studio_agency_tick_lock`, `ai_operator_tick_lock`) and **two** internal-spend counters. A third drain loop from V3-43 would make it three. The fix is no longer preventive; it is a **retrofit V3-43 must perform** (see [RE-GROUNDING §2](./RE-GROUNDING-2026-07-24.md)). If instead V3-43 and the SA ticks stay independent, the estate keeps:

- two drain loops (`/api/cron/workflow-drain` **and** `/api/agency/tick`),
- two CAS-claim conventions (`workflow_jobs.claimed_by` **and** `studio_build_jobs.claimed_by`),
- two retry policies, two dead-letter conventions, two heartbeat/stall implementations,
- two telemetry namespaces for "a background job ran."

That **is** two engines. The fix is to define the seam now.

## Shared primitives to extract once (so SA-3 consumes, not reinvents)

SA-3's design already hand-rolls several primitives the rail should own. V3-43 must ship these as reusable, `server-only` building blocks so the studio saga (and every Phase F saga) binds to them:

1. **CAS-claim helper** — `update … set claimed_by = :worker where claimed_by is null … for update skip locked`. Both the rail's `claim_workflow_jobs` and SA-3's tick claim use it.
2. **HMAC callback verifier** — the **shipped** `owner-inbound-email` handshake (`HMAC_SHA256(secret, "${timestamp}.${body}")` in `x-henry-timestamp`/`x-henry-signature` headers, with a 5-min **replay-window**; `apps/hub/lib/owner-inbox/signature.ts`). SA-3's `executor-callback` needs this **plus** a per-`(jobId, attempt)` **monotonic-sequence** rejection — an SA-3 *design* addition (studio `ARCHITECTURE §2.4`), **not** in the shipped verifier. Expose the shipped verifier and the monotonic-seq check together as one shared primitive.
3. **Heartbeat / visibility-timeout** — the rail's "crash-between-claim-and-complete → reclaimable after a timeout" is the same mechanism as SA-3's "no heartbeat for 10 min → stalled." One implementation.
4. **Append-only event log helper** — `workflow_runs` and `studio_build_events` are the same shape (job/attempt/kind/payload/ts); one writer, one `writeAuditLog(correlationId = jobId)` convention, one `henry.workflow.*`/`henry.studio.build.*` telemetry emit.
5. **Idempotency contract** — dedup on `(workflow_key, idempotency_key)` / `(jobId, attempt)` with `ON CONFLICT DO NOTHING` replay semantics.

## Migration / composition path

### Case A — V3-43 lands first (the natural program order)
Phase F sits after Phases D+E; V3-43 is Wave F.1. When SA-2/SA-3 build, they are authored **directly against the engine**:
- `studio_build_jobs` is a domain saga table (unchanged design), but its tick is registered as `"studio.orchestrator.tick"` on the engine and enqueued by the platform drain — there is **no** `/api/agency/tick` cron.
- executor dispatch, notify, deploy-check, aftercare are `engine.enqueue(...)` jobs.
- SA-3 imports the shared CAS/HMAC/heartbeat/event primitives. **Zero retrofit.**

### Case B — SA-3 lands first (studio-agency is an active workstream)
Real risk: studio-agency may ship before Phase F. To keep it a client-in-waiting rather than a rival:
- SA-3 authors its coordinator as a **plain async function** `runStudioOrchestratorTick(deps)` (not wired to a bespoke cron drain), so V3-43 can wrap it as a handler with a **~1-file adapter** (`registerHandler("studio.orchestrator.tick", runStudioOrchestratorTick)`), retiring `/api/agency/tick`.
- SA-3 uses the **same conventions** the rail will standardize: `claimed_by` CAS with `skip locked`, the `owner-inbound-email` HMAC handshake, `(jobId, attempt)` idempotency, `henry.studio.build.*` names in the canonical union, `writeAuditLog(correlationId = jobId)`.
- **Action for this pass:** add a short **reconciliation note to `docs/v3/studio-agency/PHASED-PLAN.md §SA-3`** stating that the coordinator tick is authored as an engine-registerable handler and reuses the shared primitives — cheap now, expensive as a retrofit. (Documentation only; no code.)

### What we explicitly do NOT do
- We do **not** move `studio_build_jobs` rows into `workflow_jobs` (a days-long, money-bearing, human-gated saga is not a generic task; flattening it loses RLS projection, stage semantics, and the review gates).
- We do **not** build a second generic queue for studio.
- We do **not** make `@henryco/workflow` import studio types (dependency points the wrong way — studio depends on workflow, never the reverse).
- We do **not** touch `search-ui`/search indexing behaviour — the search outbox is *read as prior art* and *migrated as the first rail client*, behaviour-locked.

## Dependency direction (the invariant that keeps it one engine)

```
                 ┌─────────────────────────────┐
   depends on →  │  @henryco/workflow (rail)   │   ← owns: workflow_jobs, drain, retry,
                 │  generic, division-agnostic │      dead-letter, idempotency, CAS/HMAC/
                 └──────────────┬──────────────┘      heartbeat primitives, henry.workflow.*
                                │ registered handlers + enqueued jobs
   ┌───────────────┬───────────┴───────────┬──────────────────┬─────────────────┐
   ▼               ▼                       ▼                  ▼                 ▼
 studio build   assignment/           reminders (V3-45)   owner reports    campaigns
 saga (SA-2/3)  escalation (V3-44/47)  reminder_schedules  (V3-46)          (V3-48)
 studio_build_* workflow_queue_config  reminder_dispatches owner_reports    campaign_*
```

Every arrow points **into** the rail. No arrow points out of it into a division. That is the structural guarantee that there is one engine.

## One-line answer for the report

> **The platform workflow engine GENERALIZES SA-3 — by promoting the existing `search_index_outbox`/`drainOutbox` idiom into one shared durable-job rail, on which SA-3's studio build lifecycle runs as a registered domain saga (not a second engine, not a flattened queue). Re-grounded 2026-07-24: because SA-2/SA-3/SA-4 are now MERGED, the seam is a RETROFIT of shipped code (V3-43 retires `/api/agency/tick` + `/api/cron/operator-tick` onto the rail and reconciles the two lock tables + two internal-spend counters), not a prospective design; the domain-state boundary is documented above.**
