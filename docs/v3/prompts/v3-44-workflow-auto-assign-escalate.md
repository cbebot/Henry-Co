# V3-44 — Automation & Workflow: Auto-Assign & Escalate

**Pass ID:** V3-44  ·  **Phase:** F (Automation & Workflow)  ·  **Pillar:** P5 (Automation & Workflow Engine), P7 (Trust, Safety, Identity)
**Dependencies:** V3-43 (workflow engine foundation)  ·  **Effort:** M  ·  **Parallel-safe:** Y (with V3-45/46/48)
**Owner gate:** none  ·  **Risk class:** —

---

## Role

You are the V3 Auto-Assign engineer for Henry Onyx. You execute exactly this one pass, then stop and report. This pass registers the **assignment + escalation handlers** on the V3-43 workflow engine: every inbound staff-queue item (support thread, KYC review, moderation case, finance refund) is deterministically routed to the correct queue and owner, and risky/SLA-breaching items auto-escalate up a defined chain. It builds on `@henryco/intelligence`'s existing `triageSupportStub` rather than inventing a classifier. The line it must not cross: assignment is **deterministic and auditable** — no item is silently reassigned; every machine assignment and every human override writes an audit row, and a human override always requires the V3-02 sensitive-action guard.

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/44-workflow-auto-assign-escalate` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary

The staff side already has the raw materials. `@henryco/intelligence` exports `triageSupportStub({ message })` → `SupportTriageResult` with an intent and a target `SupportQueue` (`"general" | "trust" | "finance"`), plus `TRIAGE_CONFIDENCE_ESCALATE_THRESHOLD = 0.55` — the seam for "low-confidence → escalate to human." On the data side, marketplace queue tables already carry assignment columns (`marketplace_support_threads`, `marketplace_disputes`, `marketplace_moderation_cases`, `marketplace_reports` have `assigned_to` / `assigned_at` foreign keys to `auth.users`), so the column pattern exists but the **assignment is manual** — a staffer picks an item off a list. There is no rule that puts a new support thread in the trust queue because its intent is a trust issue, no round-robin across reviewers, no SLA-breach escalation, and no audited escalation chain. V3-43 now provides the durable engine: an event-triggered handler can fire on `henry.support.thread.created` and assign. The gap this pass closes: convert "manual triage off a flat list" into "deterministic auto-assignment per queue + audited escalation when an item is risky, repeat, high-value, or SLA-breaching."

## Mandatory scope

### S1 — Assignment columns + queue-config schema

Migration `apps/hub/supabase/migrations/<ts>_workflow_assignment.sql`. Normalise assignment across the four queue domains. Where the columns already exist (marketplace tables), reuse them; where they don't (the cross-division `support_threads`, the trust/KYC review surface, the finance-refund queue), add them idempotently:

```sql
-- Applied additively per target table (idempotent add column if not exists):
--   assigned_to uuid references auth.users(id) on delete set null
--   assigned_at timestamptz
--   assignment_reason text         -- 'auto:intent' | 'auto:round_robin' | 'manual' | 'escalation'
--   escalation_level smallint not null default 0
--   escalation_path text[] not null default '{}'  -- audit breadcrumb of staff ids walked

create table public.workflow_queue_config (
  queue_key text primary key,         -- 'support.general' | 'support.trust' | 'support.finance'
                                       -- | 'kyc.review' | 'moderation' | 'finance.refund'
  division text,
  sla_minutes integer not null,       -- response SLA used by V3-47 too
  escalate_after_minutes integer not null,
  high_value_minor bigint,            -- finance: amount above which auto-escalate (BIGINT minor units)
  round_robin boolean not null default false,
  active boolean not null default true,
  updated_at timestamptz not null default timezone('utc', now())
);
```

RLS: `workflow_queue_config` is staff-config — read via `public.is_platform_staff()`, write via owner/admin only. Assignment columns inherit each host table's existing RLS.

### S2 — `@henryco/workflow/assignment` rule module

Pure, deterministic, individually-testable assignment logic (runtime-safe; no DB) under the V3-43 package:

```typescript
// packages/workflow/src/assignment/queue-router.ts
export type QueueKey = "support.general" | "support.trust" | "support.finance"
  | "kyc.review" | "moderation" | "finance.refund";

// Support: intent (from triageSupportStub) decides the queue.
export function resolveSupportQueue(triage: SupportTriageResult): QueueKey;
// Round-robin within a queue: deterministic over a stable staff roster (sorted ids + rotating cursor).
export function nextAssignee(roster: readonly string[], cursor: number): { assignee: string; nextCursor: number };
// Escalation decision: SLA breach | repeat offender | high-value | high-risk | owner-only.
export function shouldEscalate(input: EscalationInput): EscalationDecision;
```

- **Support** → `resolveSupportQueue(triageSupportStub({ message }))`; below `TRIAGE_CONFIDENCE_ESCALATE_THRESHOLD`, route to `support.general` AND flag for human triage (never guess into trust/finance on low confidence).
- **KYC review** → round-robin among the active trust-staff roster (`nextAssignee`).
- **Moderation** → by content type to the moderation queue (round-robin within).
- **Finance refund** → by amount range against `workflow_queue_config.high_value_minor` (BIGINT minor units, never float).

### S3 — Workflow handlers (registered on V3-43)

Register on the V3-43 engine and wire the V3-43 event-trigger map:
- `henry.support.thread.created` → `"support.auto_assign"` handler → `resolveSupportQueue` → set `assigned_to` / `assigned_at` / `assignment_reason='auto:intent'`.
- KYC submission event (`henry.trust.verification.submitted`) → `"kyc.auto_assign"` → round-robin.
- Moderation case created → `"moderation.auto_assign"`.
- A periodic `"assignment.escalation_sweep"` handler (enqueued by the V3-43 cron) evaluates `shouldEscalate` for open items against `workflow_queue_config`, bumps `escalation_level`, appends to `escalation_path`, reassigns to the next tier (senior → lead → owner), and notifies.

### S4 — Escalation rules

`shouldEscalate` fires on any of: **SLA breach** (open longer than `sla_minutes`), **repeat offender** (same actor with a prior resolved-against case → route to a specialist), **high-value/high-risk** transaction (amount ≥ `high_value_minor`, or a high-severity `RiskSignal` from `@henryco/intelligence`), **owner-only items** (route to owner). Each escalation appends to `escalation_path` and writes an audit row — the chain is fully reconstructable.

### S5 — Manual override (sensitive-action gated)

A staffer can reassign an item, but the route (`POST apps/hub/app/api/staff/queues/[queue]/[id]/assign`) is wrapped in the V3-02 sensitive-action guard (`requireSensitiveAction` server-side) and writes `assignment_reason='manual'` + an audit row with old/new assignee. Self-reassignment and reassignment to an inactive/wrong-queue staffer are rejected.

### S6 — Telemetry

Add to the `HenryEventName` union in `packages/observability/src/events.ts` (compile-enforced) + `docs/event-taxonomy.md`:

```
henry.workflow.assigned     henry.workflow.escalated     henry.workflow.reassigned
```

Payload carries `queue_key`, `assignment_reason`, and (for escalation) `escalation_level` — no PII beyond actor ids, redacted by the logger.

## Out of scope

- The workflow engine itself (V3-43 — this pass only registers handlers).
- Reminder workflows (V3-45). Neglected-queue / SLA-health monitoring + redistribution proposals (V3-47 — this pass writes the SLA config V3-47 consumes).
- AI-trained classification beyond the existing `triageSupportStub` (Phase D/E own learned models).
- Queue UI redesign — assignment surfaces in the existing staff queue lists.

## Dependencies

- **Requires:** V3-43 (engine + event-trigger bridge + `workflow_queue_config` lives alongside the engine schema).
- **Blocks:** V3-47 (consumes `workflow_queue_config.sla_minutes` + the assignment state for neglected-queue detection).

## Inheritance

- `@henryco/intelligence` — `triageSupportStub`, `SupportQueue`, `SupportTriageResult`, `TRIAGE_CONFIDENCE_ESCALATE_THRESHOLD`, `RiskSignal` / `RiskSeverity`.
- `@henryco/workflow` (V3-43) — engine, handler registry, event-trigger bridge, `buildWorkflowAuditInput`.
- `@henryco/observability/audit-log` — `writeAuditLog` on every assignment + escalation + override.
- V3-02 sensitive-action guard (`requireSensitiveAction`) on the manual-reassign route.

## Implementation requirements

### Files

The migration (S1); `packages/workflow/src/assignment/*` (S2); the registered handlers + event-map wiring (S3/S4); `apps/hub/app/api/staff/queues/[queue]/[id]/assign/route.ts` (S5); the `events.ts` union additions + taxonomy doc (S6).

### Trust / safety / compliance

Every machine assignment writes an audit row (`action='workflow.assign.auto'`); every escalation writes one (`action='workflow.escalate'`, `reason` required); every manual override writes one (`action='workflow.assign.manual'`, old/new captured) behind `requireSensitiveAction`. Assignment is deterministic — round-robin uses a stable sorted roster + a persisted cursor, so the same inputs always assign the same staffer (auditable, no hidden randomness). Finance amounts are BIGINT minor units. No assignment logic ever runs client-side.

### Mobile + desktop parity

Staff queues are primarily desktop; the assign/escalate surfaces inherit the existing responsive staff-workspace chrome (usable on mobile, not a dedicated mobile build). No Expo super-app surface (staff-only). N/A for end-user mobile.

### i18n

Queue labels, assignment-reason labels, and escalation-status copy on the staff surface route through `@henryco/i18n`, namespace **`surface:staff-queues`**. Queue keys and reason codes are internal identifiers (`exempt.json` if scanned). Staff surfaces are operator-facing — Pattern B runtime DeepL covers non-English staff per the V3-07b posture.

### Brand & design system

No new public surface. The staff queue chrome uses design-system tokens (light + dark, mobile + desktop, CLS ≈ 0). Any brand string in an escalation notification reads from `@henryco/config` (Henry Onyx); any link resolves via `getStaffHqUrl()` / `getHqUrl()` — zero hardcoded domains.

## Validation gates

1. Standard CI: typecheck, lint, test, build (`Lint, typecheck, test, build`).
2. **Assignment suite** (`pnpm --filter @henryco/workflow test`): `resolveSupportQueue` per intent (incl. low-confidence → general + flag), round-robin determinism over a stable roster, finance amount-range routing, every `shouldEscalate` branch.
3. **Assignment smoke** — a synthetic support thread fires `henry.support.thread.created`; the handler assigns it to the correct queue with `assignment_reason='auto:intent'`.
4. **Escalation smoke** — a synthetic item past `sla_minutes` is escalated by the sweep, `escalation_level` bumped, `escalation_path` appended, notification sent.
5. **Reassignment trail** — a manual override through the assign route requires `requireSensitiveAction`, writes an audit row with old/new assignee, and rejects self/wrong-queue assignment.
6. **RLS** — `workflow_queue_config` readable by `is_platform_staff()`, writable by owner/admin only.

## Deployment gate

All gates green; required check passing; branch `v3/44-workflow-auto-assign-escalate` off `origin/main` → PR → squash-merge (no force-push). **14-day soak** confirming auto-assignment matches the human-triage distribution and no item is mis-escalated, before the rule set is treated as authoritative.

## Final report contract

`.codex-temp/v3-44-workflow-auto-assign-escalate/report.md` with the standard 9 sections (exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification · telemetry baseline · deferred items · pass-closure assertion).

## Self-verification

- [ ] Assignment columns + `workflow_queue_config` applied; RLS staff-read / owner-write.
- [ ] `resolveSupportQueue` / `nextAssignee` / `shouldEscalate` pure + fully tested (low-confidence, round-robin determinism, amount-range, every escalation branch).
- [ ] Auto-assign handlers registered on the V3-43 engine + wired into the event-trigger map.
- [ ] Escalation sweep walks the chain (senior → lead → owner), appends `escalation_path`, audits each step.
- [ ] Manual reassign route gated by `requireSensitiveAction`, audited old/new, rejects invalid targets.
- [ ] Three `henry.workflow.{assigned,escalated,reassigned}` events added to the typed union + taxonomy doc.
- [ ] Report written. Hand-off: V3-47 consumes `workflow_queue_config` + assignment state.
