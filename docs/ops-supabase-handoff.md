# Ops Supabase Handoff

This document records the database, RLS, audit, and escalation work still required to complete the HenryCo staff workspace model without turning the current pass into a migration project.

## Application Files Already Prepared

- `apps/staff/lib/workspace-data.ts`
- `apps/staff/lib/support-desk.ts`
- `apps/staff/app/(workspace)/**/*.tsx`
- `apps/staff/app/(workspace)/support/actions.ts`
- `apps/staff/lib/staff-auth.ts`
- `apps/staff/lib/roles.ts`
- `apps/hub/lib/owner-data.ts`
- `apps/hub/lib/owner-reporting.ts`

These files already consume live role memberships, support threads, queue failures, audit logs, invoices, payouts, studio projects/leads, and owner rollups. New DB objects should be added to support these application-layer adapters, not replace them.

## Missing Database Objects

| Object type | Proposed name | Required fields / outputs | Needed by |
| --- | --- | --- | --- |
| Table | `care_role_memberships` | `id`, `user_id`, `normalized_email`, `role`, `scope_type`, `scope_id`, `is_active`, timestamps | explicit care RBAC in `staff-auth.ts` |
| Table | `jobs_role_memberships` | same contract as other division membership tables | explicit Jobs RBAC in `staff-auth.ts` |
| Table | `logistics_shipments` or equivalent dispatch queue | shipment/ref, rider, assignment, status, promised window, proof-of-delivery, escalation state | real logistics workspace instead of fallback |
| Table | `logistics_dispatch_events` | shipment id, actor, action, before/after state, note, evidence | dispatch audit and owner visibility |
| Table | `support_thread_internal_notes` | thread id, author id, note body, note type, visibility, timestamps | internal-only notes in support and queue detail |
| Table | `ops_escalations` | entity type/id, division, severity, owner, state, opened_by, resolved_by, timestamps | cross-division escalation ledger |
| Table | `ops_follow_up_tasks` | escalation id or entity ref, assignee, due_at, status, resolution note | assignment/reassignment/follow-up workflows |
| View | `owner_queue_health_rollup` | division, queue, open_count, stale_count, unread_count, failed_count, last_event_at | faster owner reporting and dashboard rollups |
| View | `notification_failure_rollup` | division, channel, provider, failed_count, skipped_count, last_failure_at | Staff HQ settings and owner messaging drilldowns |
| View | `staff_governance_risk_rollup` | actor id, repeated_change_count, invite_count, last_change_at, severity | stronger workforce/settings oversight |
| Function / RPC | `log_staff_action(...)` | actor, role, division, entity, action, reason, before/after, metadata | consistent audit writes from server actions |
| Function / RPC | `open_ops_escalation(...)` | entity, division, severity, reason, evidence | deterministic escalation pathway from staff actions |

## Required State Transitions

### Support

- thread status changes should write both customer-facing state and internal audit trail
- assignment / reassignment should write actor, previous owner, new owner, timestamp
- internal note creation should not notify customers

### Logistics

- `new -> assigned -> in_transit -> delivered`
- exception branches: `failed_attempt`, `returned`, `blocked`, `escalated`
- every exception needs actor, note, and optional evidence attachment metadata

### Escalations

- `open -> acknowledged -> in_progress -> resolved -> closed`
- reopen path: `resolved -> open`
- escalation record must keep `opened_by`, `resolved_by`, `resolution_type`, `resolution_note`

## Audit Requirements

- Sensitive staff actions must land in one consistent audit sink rather than ad-hoc table-specific conventions.
- Required payload: actor id, actor role/family, division, route, entity type/id, action, reason, before values, after values, metadata, timestamp.
- Support desk reply, assignment, status, and priority updates should all emit audit rows through the shared sink.
- Finance-sensitive actions need explicit outcome fields: `approved`, `rejected`, `released`, `held`, `refunded`.

## RLS Expectations

| Area | Required rule |
| --- | --- |
| Division membership tables | users can read only their own rows; privileged staff/owner roles can read scoped rows for governance views |
| Support internal notes | customer users must never read internal notes; staff read/write depends on division membership |
| Escalations | only scoped staff, managers, command roles, and owners may read; create/update restricted by division + seniority |
| Dispatch tables | riders/drivers limited to assigned shipments; dispatch/fleet/owner roles can read broader queue views |
| Rollup views | owner and executive roles read company-wide; division managers read only their divisions |

## Trigger / Derived Data Expectations

- maintain `last_staff_activity_at` and `last_customer_activity_at` on support threads
- write queue health counters or materialized summaries for owner reporting if live aggregation becomes too expensive
- emit escalation signal rows when thresholds are crossed instead of recalculating every alert path independently
- keep notification failure rollups updated from care/marketplace/jobs/studio comms sources

## Current Platform Gaps To Preserve In UI Until Fixed

- Logistics dispatch remains a documented gap; do not fake a shipment backoffice before the table and RLS exist.
- Wallet funding and wallet withdrawal review remain in owner finance until Staff HQ gets a dedicated queue source.
- Jobs and Care should not be treated as fully explicit-RBAC divisions until their membership tables exist.
