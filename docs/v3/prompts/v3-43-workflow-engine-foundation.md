# V3-43 — Automation & Workflow: Workflow Engine Foundation

**Pass ID:** V3-43  ·  **Phase:** F (Automation & Workflow)  ·  **Pillar:** P5 (Automation & Workflow Engine)
**Dependencies:** V3-10 (logs/states/fallbacks)  ·  **Effort:** L  ·  **Parallel-safe:** N (foundation — every other Phase F pass plugs into it)
**Owner gate:** none  ·  **Risk class:** —

---

## Role

You are the V3 Workflow engineer for Henry Onyx. You execute exactly this one pass, then stop and report. This pass builds **`@henryco/workflow`** — the one durable job engine (trigger → enqueue → drain → retry → dead-letter) that unifies the eleven scattered cron handlers and ad-hoc reminder logic into a single observable rail. It ships the engine, the durable Supabase-backed queue, the cron orchestrator, the event-trigger bridge, and migrates the existing crons onto it behind thin wrappers. The line it must not cross: it builds **no concrete automation** (assignment, reminders, reports, campaigns are V3-44 through V3-48) and it must never break an existing cron — every migrated handler keeps its current behaviour, just routed through the engine.

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/43-workflow-engine-foundation` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary

Automation today is a pile of independent cron routes with no shared contract. The real inventory on disk: `apps/account/app/api/cron/{engagement-sweep,notification-email-fallback,notification-purge,notification-redelivery}`, `apps/hub/app/api/cron/{owner-reporting,owner-reports,search-index-worker}`, and one `*-automation` route per division (`apps/care/.../care-automation`, plus marketplace, property, jobs, learn, logistics, studio). Every one repeats the same hand-rolled shape: `runtime = "nodejs"`, `isAuthorized()` checking `Authorization: Bearer ${CRON_SECRET}`, a try/catch, a JSON summary. Division logic lives in `apps/<div>/lib/automation/<div>-automation.ts` exposing `run<Div>AutomationSweep(date)`. There is **no durable job queue, no retry policy, no dead-letter, no outbox** — a transient failure mid-sweep is simply lost, and a secondary side effect (send the email, write the audit row) that fails after the primary effect succeeds has no replay path. `@henryco/observability` (`emitEvent` with the typed `HenryEventName` union, `writeAuditLog`, the structured `logger`) is wired across all 10 apps and is the observability spine this engine emits through. The gap this pass closes: turn "N hand-rolled crons that silently drop work" into "one engine with at-least-once delivery, idempotency, bounded retry, dead-letter, and an owner-visible health tile" that V3-44–48 build their automations on.

## Mandatory scope

### S1 — `@henryco/workflow` package

New workspace package `packages/workflow/`, consumed as raw TypeScript source (monorepo convention: `exports` → `./src/*`, no build step; tests run on `node:test` + `tsx`). Split runtime-safe (pure logic, client-importable) from `server-only` (DB-touching) modules so the barrel never drags `server-only` into a client bundle.

```
packages/workflow/src/
  index.ts                  barrel — runtime-safe re-exports only (never a server-only module)
  types.ts                  WorkflowKey, JobStatus, RetryPolicy, WorkflowHandler,
                            WorkflowContext, EnqueueOptions, DrainResult — pure types
  retry-policy.ts           exponential backoff + jitter; nextAttemptAt(attempt, policy); pure
  registry.ts               in-memory handler registry: register(key, handler), resolve(key)
  engine.ts                 'server-only' — WorkflowEngine (enqueue/drain) over the job store
  store/
    job-store.ts            'server-only' — durable Supabase-backed claim/complete/fail over the RPCs in S2
    in-memory-job-store.ts  transactional test double mirroring the SQL RPC semantics (drain/retry/dead-letter)
  triggers/
    cron.ts                 'server-only' — drain entrypoint a Vercel/Supabase cron route calls
    event.ts                event-name → WorkflowKey map + dispatch() bridge from emitEvent
  telemetry.ts              pure maps: JobStatus → EventOutcome for the five henry.workflow.* events
  audit.ts                  buildWorkflowAuditInput — folds job context into an AuditLogInput
  __tests__/*.test.ts       engine drain order, retry math, idempotency, dead-letter, crash-between-claim-and-complete
```

`WorkflowKey` is a string-literal union seeded with the migrated handlers (`"notification.purge"`, `"notification.email_fallback"`, `"engagement.sweep"`, `"search.index_worker"`, `"owner_report.weekly"`, etc.) and extended (additively) by each downstream pass. A handler is `(ctx: WorkflowContext) => Promise<WorkflowResult>` where `WorkflowResult = { status: "succeeded"; output? } | { status: "failed"; retryable: boolean; error }` — the `retryable` flag drives whether the engine reschedules or dead-letters.

### S2 — `workflow_jobs` + `workflow_runs` schema (committed + applied)

Migration `apps/hub/supabase/migrations/<ts>_workflow_engine_foundation.sql`. The hub app owns the workflow schema (it already hosts the cross-division owner/search crons). This migration **is applied** in this pass (unlike the dormant payments rail) — the engine is inert until handlers enqueue, so applying the empty tables is safe.

```sql
create table public.workflow_jobs (
  id uuid primary key default gen_random_uuid(),
  workflow_key text not null,
  trigger_at timestamptz not null default timezone('utc', now()),
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending'
    check (status in ('pending','claimed','running','succeeded','failed','dead_letter')),
  attempts integer not null default 0,
  max_attempts integer not null default 5,
  next_attempt_at timestamptz,
  idempotency_key text,
  claimed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (workflow_key, idempotency_key)        -- at-least-once dedup (A1 analogue)
);
create index workflow_jobs_drain_idx
  on public.workflow_jobs (status, trigger_at) where status in ('pending','failed');

create table public.workflow_runs (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.workflow_jobs(id) on delete cascade,
  attempt_no integer not null,
  started_at timestamptz not null default timezone('utc', now()),
  finished_at timestamptz,
  outcome text check (outcome in ('succeeded','failed','dead_letter')),
  error jsonb,
  output jsonb
);
```

- **`claim_workflow_jobs(p_limit int)`** — `SECURITY DEFINER` RPC that atomically selects up to `p_limit` due rows (`status in ('pending','failed') and coalesce(next_attempt_at, trigger_at) <= now()`) using `for update skip locked`, flips them to `claimed`, stamps `claimed_at`, and returns them. `skip locked` makes concurrent drains safe.
- **`complete_workflow_job(p_id uuid, p_outcome text, p_output jsonb, p_error jsonb, p_retryable bool, p_next_at timestamptz)`** — `SECURITY DEFINER`: inserts the `workflow_runs` row, then sets the job to `succeeded`, or to `dead_letter` when `attempts + 1 >= max_attempts` or `p_retryable = false`, else back to `failed` with `next_attempt_at = p_next_at` and `attempts = attempts + 1`.
- **RLS:** `workflow_jobs` / `workflow_runs` are engine-internal — no client writes. Enable RLS, grant only the `SECURITY DEFINER` RPCs mutation; read predicate = `public.is_platform_staff()` (owner + platform staff read for the health tile; the established sensitive-data reader). No anon access.

### S3 — `WorkflowEngine`

`engine.ts` (`server-only`) is the only thing app code constructs. It composes a `JobStore` + the `registry`:

```typescript
export class WorkflowEngine {
  registerHandler(key: WorkflowKey, handler: WorkflowHandler): void;
  // Idempotent: a duplicate (key, idempotencyKey) is a no-op returning the existing job id.
  enqueue(key: WorkflowKey, payload: unknown, opts?: EnqueueOptions): Promise<{ jobId: string; deduped: boolean }>;
  // Claims up to maxJobs, runs each handler, records the run, applies retry/dead-letter. Never throws.
  drain(maxJobs?: number): Promise<DrainResult>; // DrainResult = { claimed, succeeded, failed, deadLettered }
}
```

`drain` wraps each handler in try/catch so one poisoned job never aborts the batch; an uncaught throw is treated as `{ retryable: true }` up to `max_attempts`, then dead-lettered. Every transition emits the S7 telemetry and writes a `workflow_runs` row — the run table is the at-least-once audit trail.

### S4 — Cron orchestrator

One minute-resolution cron drives the engine. Add `"*/1 * * * *"` → `/api/cron/workflow-drain` in `apps/hub/vercel.json`, and `apps/hub/app/api/cron/workflow-drain/route.ts` that: authorises via the established `Authorization: Bearer ${CRON_SECRET}` guard (identical to every existing cron route), constructs the engine over an admin Supabase client, calls `engine.drain(50)`, and returns the `DrainResult` JSON. `runtime = "nodejs"`, `dynamic = "force-dynamic"`.

### S5 — Migrate existing crons (behaviour-locked)

Each existing cron becomes a registered workflow handler **without changing what it does**. The migration pattern: extract the route's current work into a `WorkflowHandler`, register it, and replace the route body with a thin `engine.enqueue(key, payload)` wrapper so the existing Vercel cron schedule keeps firing but now flows through the durable queue. Migrate, in this order (lowest-risk first): `notification-purge`, `notification-redelivery`, `notification-email-fallback`, `engagement-sweep`, `search-index-worker`, then each division `*-automation` sweep (care/marketplace/property/jobs/learn/logistics/studio — these already delegate to `run<Div>AutomationSweep(date)`, so the handler simply calls that), and the owner-reporting weekly/monthly routes. Acceptance per migration: the route still returns its prior summary shape; the work is now retryable + dead-letter-protected; no schedule changes.

### S6 — Event triggers

`triggers/event.ts` maps `HenryEventName` values to `WorkflowKey`s and exposes `dispatchWorkflowFor(event)` that the emit path calls so a domain event can enqueue a workflow. Seed the map empty-but-typed in this pass (e.g. reserve `henry.support.thread.created` → `"support.auto_assign"` as a commented forward-reference for V3-44) — V3-44–48 fill it. The bridge is the seam; this pass proves it compiles and dispatches a test event to a no-op handler.

### S7 — Telemetry + owner health tile

Add these five names to the `HenryEventName` union in `packages/observability/src/events.ts` (the union is compile-enforced — an unmapped name fails typecheck) and update `docs/event-taxonomy.md`:

```
henry.workflow.job.enqueued    henry.workflow.job.succeeded    henry.workflow.job.dead_letter
henry.workflow.job.started     henry.workflow.job.failed
```

Owner workspace tile "Workflow health" (in `packages/dashboard-modules-owner` / `apps/hub`): jobs run in 24h, success rate, retry count, dead-letter count, oldest pending age — sourced from `workflow_jobs` / `workflow_runs` via `is_platform_staff()` RLS. A non-zero dead-letter count raises a staff notification.

## Out of scope

- Concrete automations: auto-assign/escalate (V3-44), auto-remind (V3-45), owner reports formalisation (V3-46), neglected-queue detection (V3-47), follow-up campaigns (V3-48).
- Newsletter engine (V3-61); analytics data-lake sink (V3-90); A/B framework (V3-91).
- Changing any migrated cron's actual behaviour — this pass only re-routes them through the engine.

## Dependencies

- **Requires:** V3-10 (logs/states/fallbacks — the degraded-side-effect envelope + `@henryco/observability` adoption this engine emits through).
- **Blocks:** V3-44, V3-45, V3-46, V3-47, V3-48 (every Phase F automation registers handlers on this engine), and V3-90 (observability data-lake reads `workflow_runs`).

## Inheritance

- `@henryco/observability` — `emitEvent` + the `HenryEventName` union (extended additively), `writeAuditLog` / `add_audit_log_v2`, the structured `logger`.
- The established cron-auth convention (`Authorization: Bearer ${CRON_SECRET}`, `runtime = "nodejs"`) and the per-division `run<Div>AutomationSweep(date)` sweep functions.
- `public.is_platform_staff()` — the sensitive-data read predicate for the job tables and health tile.

## Implementation requirements

### Files

The `packages/workflow/` tree (S1); the migration + RPCs (S2); `apps/hub/app/api/cron/workflow-drain/route.ts` + the `apps/hub/vercel.json` schedule (S4); the migrated cron routes (S5); the `events.ts` union additions + `docs/event-taxonomy.md` (S7); the owner health tile; `docs/v3/workflow-engine-architecture.md` (the handler-registration map V3-44–48 read).

### Trust / safety / compliance

`enqueue` requires an idempotency key (caller-supplied or derived from the payload) — the `unique (workflow_key, idempotency_key)` constraint makes re-enqueue a no-op (at-least-once, not at-most-once). Job tables are mutated **only** via `SECURITY DEFINER` RPCs — no client can manipulate the queue. Drain claims rows with `for update skip locked` so overlapping cron ticks never double-run a job. The cron route is `CRON_SECRET`-gated. Handler execution that mutates state writes a `writeAuditLog` row via `buildWorkflowAuditInput`. Dead-letter is alerted, never silently swallowed.

### Mobile + desktop parity

The engine is server-side and headless — no UI beyond the owner-workspace health tile, which inherits responsive owner-dashboard chrome (mobile + desktop). N/A for Expo super-app (no end-user surface).

### i18n

The only user-facing strings are the owner health-tile labels and the dead-letter staff notification, routed through `@henryco/i18n`, namespace **`surface:owner-workflow`** (tile labels) and the existing staff-notification namespace (alert copy). Job keys, statuses, and error payloads are internal identifiers — never user-facing, listed in `exempt.json` if the scanner flags them.

### Brand & design system

The owner health tile uses design-system tokens only (`--site-*` / `--accent`, Fraunces where the owner dashboard uses it), light + dark, mobile + desktop, CLS ≈ 0. Any brand string in the dead-letter notification reads from `@henryco/config` (Henry Onyx), never hardcoded. The engine emits no domains; any URL in a notification resolves via `@henryco/config` helpers (`getHqUrl()`).

## Validation gates

1. Standard CI: typecheck, lint, test, build (the only required branch-protection context: `Lint, typecheck, test, build`).
2. **Engine suite** (≈30+ specs, `pnpm --filter @henryco/workflow test` on `node:test` + `tsx`, against `in-memory-job-store`): drain order (due jobs only), retry math + jitter bounds, dead-letter at `max_attempts`, `retryable:false` → immediate dead-letter, idempotent re-enqueue, and the crash-between-claim-and-complete case (a claimed-but-never-completed job is reclaimable after a visibility timeout).
3. **Schema + RLS** verified against the applied migration: `claim_workflow_jobs` is atomic under concurrent callers (`skip locked`), no client can write the job tables, staff read via `is_platform_staff()`.
4. **Cron orchestrator live**: `workflow-drain` returns a `DrainResult`; an enqueued no-op job runs within one tick.
5. **Migration parity**: every migrated cron still returns its prior summary shape and runs on its prior schedule (regression-tested route-by-route).
6. **Telemetry**: the five `henry.workflow.*` events emit on the corresponding transitions; the owner tile renders real counts.

## Deployment gate

All gates green; the only required check (`Lint, typecheck, test, build`) passing; branch `v3/43-workflow-engine-foundation` off `origin/main` → PR → squash-merge (no force-push, never bypass branch protection). Because crons are migrated, run a **14-day soak** confirming zero dropped jobs vs the pre-migration baseline and a flat dead-letter count before declaring the rail authoritative. Owner reviews `docs/v3/workflow-engine-architecture.md`.

## Final report contract

`.codex-temp/v3-43-workflow-engine-foundation/report.md` with the standard 9 sections (exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification · telemetry baseline · deferred items · pass-closure assertion) + the engine architecture diagram + the cron-migration parity table.

## Self-verification

- [ ] `@henryco/workflow` shipped with the S1 tree; barrel is runtime-safe (no `server-only` leak).
- [ ] `workflow_jobs` / `workflow_runs` applied with the `claim_workflow_jobs` / `complete_workflow_job` `SECURITY DEFINER` RPCs and `is_platform_staff()` read RLS.
- [ ] `WorkflowEngine.enqueue` is idempotent (`unique (workflow_key, idempotency_key)`); `drain` retries/dead-letters via `retry-policy.ts`; one poisoned job never aborts a batch.
- [ ] `workflow-drain` cron live on `*/1 * * * *`, `CRON_SECRET`-gated.
- [ ] Every existing cron migrated to a registered handler behind a thin enqueue wrapper, behaviour-locked.
- [ ] Event-trigger bridge typed + dispatching to a handler; map seeded for V3-44–48.
- [ ] Five `henry.workflow.*` events added to the typed union + taxonomy doc; owner "Workflow health" tile renders.
- [ ] Report written. Hand-off: V3-44, V3-45, V3-46, V3-47, V3-48 register handlers on this engine in parallel.
