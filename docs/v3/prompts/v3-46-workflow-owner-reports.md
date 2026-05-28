# V3-46 — Workflow: Auto-Generate Owner Reports

**Pass ID:** V3-46 | **Phase:** F | **Pillar:** P5
**Deps:** V3-43 | **Effort:** M | **Parallel:** YES | **Owner gate:** none | **Risk:** —

## Role
V3 Owner-Reports engineer. Execute, then stop.

## Project
Standard.

## Audit summary
V3 vision: "Auto-generate owner reports." Existing `apps/hub/lib/owner-reporting.ts` produces some reports; this pass formalizes weekly + monthly + quarterly + custom.

## Mandatory scope

1. **Report types**: weekly, monthly, quarterly. Each with division breakdown + cross-division summary.

2. **Sections per report**:
   - Revenue + refunds + disputes.
   - User growth + retention.
   - Partner growth + payouts.
   - Support metrics + queue health.
   - KYC throughput + approval rate.
   - AI usage + margin.
   - Risk score trends.
   - Anomaly callouts.

3. **Delivery**:
   - Workflow handler generates report on schedule.
   - PDF via @henryco/branded-documents/owner-report.
   - Email to owner with signed-URL.
   - Persisted in `owner_reports` table.

4. **Custom report builder** (advanced):
   - Owner selects sections + date range; on-demand generation.

5. **Telemetry** — `henry.owner_report.scheduled_generated`, `henry.owner_report.custom_generated`, `henry.owner_report.opened`.

## Out of scope
- Per-division reports for division operators (separate).
- Public quarterly transparency report (V3-93 privacy + L7).

## Dependencies
V3-43.

## Inheritance
@henryco/branded-documents/owner-report (existing); @henryco/data aggregator.

## Trust / safety / compliance
- Owner-only access.
- Watermarked (ANTI-CLONE Principle 5).

## Mobile + desktop parity
PDF viewable anywhere.

## i18n
Owner-locale.

## Validation gates
1. Standard CI.
2. **Scheduled generation** — weekly, monthly, quarterly all fire on time.
3. **Custom generation** smoke.
4. **Watermarking enforced**.

## Deployment gate
- 1 full cycle (a month) soak.

## Final report contract
Standard.

## Self-verification
- [ ] 3 scheduled report types.
- [ ] Custom builder.
- [ ] Watermarked PDFs.
- [ ] 3 new telemetry events.
- [ ] Report written.
