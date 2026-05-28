# V3-82 — Platform: Analytics Exports

**Pass ID:** V3-82 | **Phase:** I | **Pillar:** P11, P12
**Deps:** V3-90 | **Effort:** M | **Parallel:** YES | **Owner gate:** none | **Risk:** —

## Role
V3 Analytics Export engineer. Execute, then stop.

## Project
Standard.

## Audit summary
V3 vision P11: "Analytics exports — CSV + JSON + scheduled deliveries; partner-scoped data access."

## Mandatory scope

1. **Export types**:
   - CSV — flat data per entity (orders, products, bookings, transactions).
   - JSON — structured with relations.
   - Both columns per scope.

2. **Scheduled delivery**:
   - Partner subscribes to daily/weekly/monthly delivery.
   - Email or S3-bucket push or webhook.

3. **Partner-scoped access**:
   - Partner only sees data they own.
   - RLS enforced at query time.

4. **Privacy-redacted by default**:
   - PII redaction unless explicit "include PII" scope.

5. **Telemetry** — `henry.analytics.export.requested`, `henry.analytics.export.delivered`.

## Out of scope
- Data lake itself (V3-90).
- BI tools (partner brings their own).

## Dependencies
V3-90.

## Inheritance
V3-90 data lake; V3-76 gateway.

## Trust / safety / compliance
- PII redaction (V3-26 redactor).
- L14 DPA enforced.

## Mobile + desktop parity
N/A.

## i18n
N/A.

## Validation gates
1. Standard CI.
2. **CSV + JSON exports** smoke.
3. **Scheduled delivery** smoke.
4. **PII redaction** verified.

## Deployment gate
- 14-day soak.

## Final report contract
Standard.

## Self-verification
- [ ] Export types.
- [ ] Scheduled delivery.
- [ ] Partner-scoped + PII-redacted.
- [ ] 2 new telemetry events.
- [ ] Report written.
