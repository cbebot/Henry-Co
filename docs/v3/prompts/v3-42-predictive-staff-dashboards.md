# V3-42 — Predictive: Advanced Staff Dashboards

**Pass ID:** V3-42 | **Phase:** E | **Pillar:** P6
**Deps:** V3-40, V3-41 | **Effort:** M | **Parallel:** YES | **Owner gate:** none | **Risk:** —

## Role
V3 Staff Dashboards engineer. Execute, then stop.

## Project
Standard.

## Audit summary
V3 vision: "Advanced staff intelligence dashboards." Per intelligence-rollout-status, staff sees live task/queue/risk; this pass adds trend + anomaly + recommendation + drill-down.

## Mandatory scope

1. **Per-role advanced dashboards**:
   - Trust staff: risk trend by entity type; anomaly detection; top-risk listings/users.
   - Finance staff: revenue + refunds + disputes + reconciliation trends.
   - Support staff: queue forecast + agent performance + SLA compliance.
   - Moderation staff: queue health + decision-accuracy + report-volume trends.

2. **Anomaly detection**:
   - Statistical detection of unusual patterns (sudden spike in refund requests, dispute rate, support volume).
   - Surfaces on dashboards as banners.

3. **Recommendation cards**:
   - "Consider hiring 2 more support agents for next week (forecasted +30% volume)."
   - "Auto-deny rule for X pattern would have prevented 12 disputes last month."
   - Each recommendation has accept/dismiss/snooze.

4. **Drill-down**:
   - Every chart drills into the underlying entities.
   - Per-staff drill-down respects RLS.

5. **Telemetry** — `henry.staff_dashboard.viewed`, `henry.staff_dashboard.recommendation.accepted`, `henry.staff_dashboard.recommendation.dismissed`.

## Out of scope
- Predictive scoring (V3-40, V3-41).
- Owner-only finance dashboard (V3-22).

## Dependencies
V3-40, V3-41.

## Inheritance
@henryco/dashboard-shell; existing staff dashboards.

## Trust / safety / compliance
- RLS per role + drill-down scoping.
- ANTI-CLONE Principle 12.

## Mobile + desktop parity
Staff dashboards primarily desktop; mobile-summary version.

## i18n
N/A staff.

## Validation gates
1. Standard CI.
2. **Per-role dashboard smoke** — 4 roles each have functional dashboard.
3. **Anomaly detection** — synthetic spike triggers banner.
4. **Recommendation lifecycle**.

## Deployment gate
- 14-day soak.

## Final report contract
Standard.

## Self-verification
- [ ] 4 role dashboards.
- [ ] Anomaly detection.
- [ ] Recommendation cards.
- [ ] Drill-down.
- [ ] 3 new telemetry events.
- [ ] Report written.
