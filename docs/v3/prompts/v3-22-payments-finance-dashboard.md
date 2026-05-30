# V3-22 — Payments: Finance Dashboard

**Pass ID:** V3-22 | **Phase:** C | **Pillar:** P2, P8
**Deps:** V3-17, V3-19, V3-20 | **Effort:** L | **Parallel:** YES | **Owner gate:** none | **Risk:** —

## Role
V3 Finance Dashboard engineer. Execute, then stop.

## Project
Standard.

## Audit summary
V3 vision P2: "Finance dashboard for staff/owner." Read-only views over ledger + payments + refunds + disputes + subscriptions.

## Mandatory scope

1. **Owner finance dashboard** at `apps/hub/app/owner/(command)/finance/`:
   - Revenue (gross + net) by division, by provider, by country, by time (day/week/month/quarter/year).
   - Refunds + dispute rate.
   - Subscription metrics: MRR, churn, growth, LTV (initial computation; deep stats in V3-90 data lake).
   - Reconciliation status (pass/fail; last reconciled date + amount).
   - Outstanding payouts to partners (V3-69 data when shipped).
   - Tax owed (sum of tax_payable ledger entries).

2. **Per-division finance view** for division operators:
   - Revenue scoped to their division.
   - Open refunds.
   - Provider payout schedule.

3. **Per-staff filtered views** for finance staff.
   - ⚠️ **V3-15 finding (load-bearing — do NOT inherit the broken predicate):** `is_staff_in('finance')` is **silently always-false** — `'finance'` is a ROLE, not a division, so the call denies every finance read. V3-22 must NOT gate on it. Use a real finance-scoped predicate (e.g. a finance-role check, or extend `is_staff_in` to accept role args) and PROVE a finance-staff user can read while a non-finance staff cannot (the validation gate below).
   - ⚠️ **Tighten the V3-15 interim grant:** `payment_intents` + `payment_attempts` SELECT RLS currently uses the broad `public.is_platform_staff()` (hub/staff/account/security × owner/admin/superadmin) because it was the only working sensitive-data reader at V3-15 time — broader than finance by design, as a deliberate interim. V3-22 owns narrowing both policies to the real finance-scoped predicate. Confirm the migration deviation note (`20260529120000_payment_intents.sql`) before changing.

4. **Charts**:
   - Time-series for revenue trends (use lightweight chart library; no third-party SaaS).
   - Sparklines per division card.
   - Cohort views deferred to V3-90.

5. **Export**:
   - CSV + PDF (via @henryco/branded-documents owner-report template).
   - Watermarked per ANTI-CLONE Principle 5.

6. **Telemetry** — `henry.finance.dashboard.viewed`, `henry.finance.export.generated`.

## Out of scope
- Predictive revenue forecasting (V3-42 staff dashboards).
- A/B test result analysis (V3-91).

## Dependencies
V3-17, V3-19, V3-20.

## Inheritance
@henryco/dashboard-shell, @henryco/data aggregator (extend), @henryco/branded-documents/owner-report.

## Trust / safety / compliance
- RLS enforces owner-only or finance-staff-only access.
- Sensitive-action guard on export (V3-02).
- ANTI-CLONE Principle 5 (watermarks) + 12 (audit log on every view).

## Mobile + desktop parity
Mobile: simplified view with key metrics + CTA to desktop for deep drill.

## i18n
Currency rendering per V3-84; labels via @henryco/i18n.

## Validation gates
1. Standard CI.
2. **RLS smoke (both directions)** — a finance-staff user CAN read `payment_intents`/`payment_attempts` AND a non-finance staff user CANNOT. The positive case is the one the broken `is_staff_in('finance')` predicate silently fails (see scope item 3), so it must be asserted explicitly, not assumed.
3. **Reconciliation status accurate** — dashboard shows match with V3-17 reconcile output.
4. **Export e2e** — CSV + PDF generated + watermarked.

## Deployment gate
- Owner reviews dashboard before merging.
- 14-day soak.

## Final report contract
Standard.

## Self-verification
- [ ] Owner dashboard live.
- [ ] Per-division views.
- [ ] Charts + sparklines.
- [ ] Export with watermarks.
- [ ] 2 new telemetry events.
- [ ] Report written.
