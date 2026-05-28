# V3-44 — Workflow: Auto-Assign & Escalate

**Pass ID:** V3-44 | **Phase:** F | **Pillar:** P5, P7
**Deps:** V3-43 | **Effort:** M | **Parallel:** YES | **Owner gate:** none | **Risk:** —

## Role
V3 Auto-Assign engineer. Execute, then stop.

## Project
Standard.

## Audit summary
V3 vision: "Auto-assign support tickets. Auto-escalate risky cases." intelligence-rollout-status: staff prioritization hooks exist; this pass adds assignment + escalation logic.

## Mandatory scope

1. **Auto-assignment per queue**:
   - Support: by intent (from `triageSupportStub`) → queue (general/trust/finance).
   - KYC review: round-robin among trust staff.
   - Moderation: by content type → moderation queue.
   - Finance: by amount range.

2. **Escalation rules**:
   - SLA breach: escalate to senior.
   - Repeat offender: auto-route to specialist.
   - High-value or high-risk transaction: auto-escalate.
   - Owner-only items: route to owner.

3. **Assignment data model**: extend `support_threads`, `kyc_submissions`, `moderation_decisions`, etc. with `assigned_to`, `assigned_at`, `escalation_path`.

4. **Workflow handlers** registered via V3-43.

5. **Telemetry** — `henry.workflow.assigned`, `henry.workflow.escalated`, `henry.workflow.reassigned`.

## Out of scope
- Reminder workflows (V3-45).
- Neglected queue detection (V3-47).

## Dependencies
V3-43. Blocks V3-47.

## Inheritance
@henryco/intelligence triageSupportStub; @henryco/workflow.

## Trust / safety / compliance
- Sensitive-action guard on manual reassignment.
- ANTI-CLONE Principle 12.

## Mobile + desktop parity
Staff queues primarily desktop.

## i18n
N/A.

## Validation gates
1. Standard CI.
2. **Assignment smoke** — support ticket assigned to correct queue per intent.
3. **Escalation smoke** — SLA breach triggers escalation.
4. **Reassignment trail** — manual changes audited.

## Deployment gate
- 14-day soak.

## Final report contract
Standard.

## Self-verification
- [ ] Per-queue assignment.
- [ ] Escalation rules.
- [ ] Data model extended.
- [ ] Workflow handlers.
- [ ] 3 new telemetry events.
- [ ] Report written.
