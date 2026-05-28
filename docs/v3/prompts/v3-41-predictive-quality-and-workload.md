# V3-41 — Predictive: Quality & Workload

**Pass ID:** V3-41 | **Phase:** E | **Pillar:** P6
**Deps:** V3-26 | **Effort:** L | **Parallel:** YES | **Owner gate:** none | **Risk:** —

## Role
V3 Quality + Workload predictor. Execute, then stop.

## Project
Standard.

## Audit summary
V3 vision: "Staff workload prediction; service quality warning; dispute likelihood; queue staffing recommendation."

## Mandatory scope

1. **Workload prediction**:
   - For each staff queue (support, KYC review, moderation, finance, refunds): predict incoming volume per hour for next 7 days.
   - Inputs: historical volumes + seasonality + recent trends.
   - Output: per-hour forecast + staffing recommendation.

2. **Service quality warning**:
   - For each ongoing service (booking, project, course enrollment): predict completion + satisfaction.
   - Inputs: provider history + service progress signals + customer signal patterns.
   - Output: at-risk flag for staff intervention.

3. **Dispute likelihood**:
   - For each transaction: predict likelihood of dispute/chargeback within X days.
   - Inputs: transaction features + buyer/seller history + service category.
   - Output: per-transaction risk score (separate from V3-40 fraud risk).

4. **Surfaces**:
   - Staff dashboards show forecasts + at-risk lists.
   - Operations dashboard surfaces queue health.

5. **Telemetry** — `henry.predictive.workload.computed`, `henry.predictive.quality.at_risk_flagged`, `henry.predictive.dispute.high_likelihood`.

## Out of scope
- Fraud (V3-40).
- Job match scoring (V3-71 employer suite).

## Dependencies
V3-26. Blocks V3-42, V3-47 (neglected queue detection).

## Inheritance
@henryco/intelligence; V3-90 data lake (once shipped).

## Trust / safety / compliance
- Model decisions audited.
- ANTI-CLONE Principle 1 + 10.

## Mobile + desktop parity
Server-side; surfaces are staff workspace.

## i18n
N/A (staff-only).

## Validation gates
1. Standard CI.
2. **Workload forecast accuracy** — back-tested.
3. **Quality at-risk detection** — precision/recall sampled.
4. **Dispute likelihood** — back-tested against historical disputes.

## Deployment gate
- 30-day shadow + owner approval.

## Final report contract
Standard.

## Self-verification
- [ ] 3 prediction services.
- [ ] Staff dashboards extended.
- [ ] 3 new telemetry events.
- [ ] Report written.
