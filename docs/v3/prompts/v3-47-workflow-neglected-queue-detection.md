# V3-47 — Workflow: Neglected Queue Detection

**Pass ID:** V3-47 | **Phase:** F | **Pillar:** P5
**Deps:** V3-43, V3-44 | **Effort:** M | **Parallel:** YES | **Owner gate:** none | **Risk:** —

## Role
V3 Queue-Health engineer. Execute, then stop.

## Project
Standard.

## Audit summary
V3 vision: "Auto-detect neglected queues; auto-notify queue manager."

## Mandatory scope

1. **Queue-health monitor**:
   - Every 10 minutes via V3-43 workflow: compute per-queue staleness (oldest item age + items per agent + SLA compliance).
   - Threshold breach → alert queue manager + staff lead.

2. **Per-queue SLAs**:
   - Support: 4h response.
   - KYC review: 24h.
   - Moderation: 2h for high-priority, 24h standard.
   - Finance refunds: 48h.
   - Configurable per division.

3. **Escalation chain**:
   - Initial alert → queue manager.
   - 2h post-alert if unresolved → staff lead.
   - 4h post-alert → owner.

4. **Auto-redistribute**:
   - When queue stales, propose redistribution among other staff with capacity.

5. **Telemetry** — `henry.queue.stale_detected`, `henry.queue.alert_sent`, `henry.queue.redistributed`.

## Out of scope
- Hiring recommendations (V3-42 staff dashboards).
- Specific queue UIs (V3-44 already wires).

## Dependencies
V3-43, V3-44.

## Inheritance
V3-41 workload prediction (when available).

## Trust / safety / compliance
- Escalation audited.
- ANTI-CLONE Principle 12.

## Mobile + desktop parity
Alerts via standard notification channels.

## i18n
Staff-only; N/A external.

## Validation gates
1. Standard CI.
2. **SLA breach smoke** — synthetic queue stales → alert fires.
3. **Escalation chain** — unresolved alert escalates per timeline.
4. **Redistribute** suggestion.

## Deployment gate
- 14-day soak.

## Final report contract
Standard.

## Self-verification
- [ ] Health monitor.
- [ ] SLAs configured.
- [ ] Escalation chain.
- [ ] Redistribute proposals.
- [ ] 3 new telemetry events.
- [ ] Report written.
