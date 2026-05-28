# V3-43 — Workflow Engine Foundation

**Pass ID:** V3-43
**Phase:** F (AUTOMATION & WORKFLOW)
**Pillar:** P5 (Automation & Workflow Engine)
**Dependencies:** V3-10 (logs/states/fallbacks)
**Effort:** L (2–4 weeks)
**Parallel-safe:** NO (foundation for Phase F)
**Owner gate:** None
**Risk class:** None

---

## Role

You are the V3 Workflow engineer. Execute this one pass, then stop.

This pass generalizes the scattered cron handlers + triage logic + reminders into a coherent workflow engine. Every Phase F pass (auto-assign, auto-remind, owner reports, campaigns) plugs into this engine.

---

## Project, audit, anti-patterns

Audit lift from AUDIT-BASELINE.md §2.13 + intelligence-rollout-status:

> Cron handlers exist (notification-purge, engagement-sweep, search-index-worker, email-fallback) plus studio cron (milestone reminder, invoice reminder, proposal expiry, weekly digest). Pattern not unified. No outbox worker for secondary side effects.

---

## Mandatory scope

### S1 — `@henryco/workflow` package

```
packages/workflow/
  src/
    index.ts
    types.ts               — Job, Trigger, Workflow, RetryPolicy
    engine.ts              — main engine
    triggers/
      cron.ts              — Vercel cron + supabase-cron adapter
      event.ts             — listen to `henry.*` events
      webhook.ts           — incoming webhook trigger
    storage/
      job-queue.ts         — durable job queue (Supabase-backed)
      retry-policy.ts      — exponential backoff + dead-letter
    handlers/
      registry.ts          — workflow handler registry
    observability/
      telemetry.ts
```

### S2 — `workflow_jobs` + `workflow_runs` schema

```sql
CREATE TABLE workflow_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_key TEXT NOT NULL,
  trigger_at TIMESTAMPTZ NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','running','succeeded','failed','dead_letter')),
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE workflow_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES workflow_jobs NOT NULL,
  attempt_no INTEGER NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  outcome TEXT,
  error JSONB,
  output JSONB
);

-- RLS: workflow-engine SECURITY DEFINER access only via the engine; reads by owner + finance-staff
```

### S3 — Engine

```typescript
export class WorkflowEngine {
  registerHandler(workflowKey: string, handler: WorkflowHandler): void;
  async enqueue(workflowKey: string, payload: unknown, options?: { triggerAt?: Date; idempotencyKey?: string }): Promise<string>;
  async drain(maxJobs: number = 50): Promise<DrainResult>;
}
```

### S4 — Cron orchestrator

A single cron `*/1 * * * *` in `apps/hub/vercel.json` calls `apps/hub/app/api/cron/workflow-drain/route.ts` which:
- Calls `engine.drain(50)`.
- Returns counts.

Replaces individual scattered crons over time (existing crons preserved during migration; new workflows use the engine).

### S5 — Migrate existing crons

For each existing cron:
- `notification-purge` → workflow handler.
- `engagement-sweep` → workflow handler.
- `email-fallback` → workflow handler.
- `search-index-worker` → workflow handler.
- Studio cron (milestone, invoice, proposal-expiry, weekly-digest) → workflow handlers.

Each migration: keep the existing cron route as a thin wrapper that calls `engine.enqueue` for the equivalent workflow.

### S6 — Event triggers

Subscribe to `henry.*` events from `@henryco/observability/emitEvent`:
- Map event names to workflow triggers.
- e.g., `henry.support.conversation.opened` → triggers `auto-assign-support-ticket` workflow.

### S7 — Telemetry

- `henry.workflow.job.enqueued`
- `henry.workflow.job.started`
- `henry.workflow.job.succeeded`
- `henry.workflow.job.failed`
- `henry.workflow.job.dead_letter`

Owner tile: "Workflow health" — daily jobs run, success rate, dead-letter count.

---

## Out of scope

- Specific automation workflows (V3-44 through V3-48).
- Newsletter engine (V3-61).

## Dependencies / Inheritance / Trust / Mobile / i18n / Gates / Deployment / Report

Standard pattern.

Key trust requirement: idempotency-key on every enqueue; SECURITY DEFINER access to workflow_jobs prevents user manipulation; dead-letter queue alerts staff via notification.

---

## Self-verification

- [ ] Package shipped with engine + triggers + storage.
- [ ] Schema applied with RLS.
- [ ] Cron orchestrator live.
- [ ] All existing crons migrated to workflow handlers.
- [ ] Event triggers subscribing.
- [ ] 5 new telemetry events.
- [ ] Owner tile rendering.
- [ ] Report written. Hand-off: V3-44..V3-48 parallel.
