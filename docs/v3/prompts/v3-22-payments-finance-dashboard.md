# V3-22 — Money & Identity Spine: Finance Dashboard

**Pass ID:** V3-22  ·  **Phase:** C (Money & Identity Spine)  ·  **Pillar:** P2 (Payments & Money), P8 (Partner & Enterprise)
**Dependencies:** V3-17 (ledger), V3-19 (refunds & reconciliation), V3-20 (subscriptions)  ·  **Effort:** L  ·  **Parallel-safe:** Y
**Owner gate:** none  ·  **Risk class:** — (read-only over money data; no money mutation)

---

## Role
You are the V3 finance-dashboard engineer for Henry Onyx. You execute exactly this one pass, then stop and report. You take the **existing owner finance surface** and elevate it from a hand-assembled snapshot into a complete, ledger-true, read-only finance instrument: revenue (gross + net) sliced by division / provider / country / time, refund + dispute rates, subscription MRR/churn/growth/LTV, reconciliation status, outstanding partner payouts, and tax owed — plus per-division operator views, charts, and watermarked CSV/PDF export. The line you must not cross: this dashboard is **strictly read-only**. It never mutates money, never moves a ledger entry, never changes a subscription. It is a mirror of money-truth, not a control panel.

## Project
| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/22-payments-finance-dashboard` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary
A finance surface **already exists** — this pass elevates it, it is not greenfield:

- **`apps/hub/app/owner/(command)/finance/`** ships today with `page.tsx` (a Finance Center), and sub-routes `revenue/`, `invoices/`, `expenses/`. The center renders recognized revenue, recorded outflow, wallet funding/withdrawal review lanes, revenue-by-division, finance alerts, and a recent-money-movement tail.
- Data comes from **`getFinanceCenterData()` in `apps/hub/app/owner/lib/owner-data.ts`** (and siblings); formatting from `apps/hub/app/owner/lib/format.ts` (`formatCurrencyAmount`, `formatDateTime`); locale from `getHubPublicLocale()`.
- UI primitives are **owner components**: `MetricCard`, `OwnerPanel`, `OwnerPageHeader`, `DivisionBadge`, `StatusBadge` (under `apps/hub/components/owner/`), with `RouteLiveRefresh` from `@henryco/ui` and copy via `translateSurfaceLabel(locale, …)` (Pattern B runtime DeepL).
- It already reads live money tables: `customer_wallet_funding_requests`, `customer_wallet_withdrawal_requests`, `customer_invoices`, and division revenue, all in integer kobo (`amount_kobo`).
- It sits inside the owner command center `apps/hub/app/owner/(command)/` (siblings: `dashboard`, `divisions`, `operations`, `staff`, `ai`, `messaging`, `brand`, `settings`) behind owner gating + `apps/hub/app/owner/login`.

**The gap this pass closes:** today's center is a curated snapshot wired before the ledger, refunds, and subscription engine existed. With V3-17 (double-entry ledger), V3-19 (refunds/disputes), V3-20 (subscriptions), and V3-21 (tax) now landed, the dashboard must become **ledger-true** — every number traceable to a reconciled ledger entry — and must gain the dimensions (by-provider, by-country, by-time), the subscription/refund/dispute/tax metrics, the per-division operator scoping, charts, and export that a real finance surface needs. **Extend `(command)/finance/`; do not fork a parallel dashboard.**

## Mandatory scope

### S1 — Elevate the owner finance center to ledger truth
In `apps/hub/app/owner/(command)/finance/page.tsx` (+ `owner-data.ts`), drive every figure from the **V3-17 ledger** rather than ad-hoc table sums. Add the dimensions:

- **Revenue (gross + net)** by **division**, by **provider** (paystack/flutterwave/stripe), by **country**, by **time bucket** (day / week / month / quarter / year) — selectable.
- **Refund rate + dispute rate** (from V3-19 data: refunds, chargebacks/disputes).
- **Subscription metrics** — **MRR, churn, growth, LTV** (initial computation from `customer_subscriptions` lifecycle events per V3-20; deep cohort stats deferred to V3-90).
- **Reconciliation status** — pass/fail, last-reconciled date + amount, from the V3-17 reconcile output.
- **Outstanding partner payouts** — render from V3-69 data **when shipped**; until then show an explicit "not yet available" empty state (never a fake zero), per V3-08 truthful-empty-state discipline.
- **Tax owed** — sum of the `tax_payable` ledger account (V3-21).

Each tile distinguishes "no data yet" vs "loading" vs "genuinely zero" (V3-08 rule), reusing the existing `MetricCard`/`OwnerPanel` primitives.

### S2 — Per-division operator view
A division-scoped finance view for division operators (not owner-only): revenue scoped to their division, open refunds, and provider payout schedule. Gate by the existing staff-role predicate (`is_staff_in('finance')` / division-operator role) so an operator sees **only** their division. Route under `apps/hub/app/owner/(command)/finance/divisions/[division]/` or the staff workspace equivalent — follow the established owner/staff routing convention in the repo.

### S3 — Per-staff filtered views
Finance-staff views filtered per `is_staff_in('finance')`. A non-finance staff member gets no access (RLS + route guard). Owner sees everything; finance staff see the finance scope; division operators see their division scope only.

### S4 — Charts
- **Time-series** for revenue trends — use a **lightweight, self-hosted chart** approach (e.g. inline SVG / a tiny in-repo chart util); **no third-party charting SaaS** and no heavy client bundle (CLS ≈ 0 budget).
- **Sparklines** per division card.
- Cohort/retention charts are **deferred to V3-90** (data-lake) — do not build them here.

### S5 — Export (watermarked, audited)
- **CSV + PDF** export. PDF via `@henryco/branded-documents` owner-report template (legal entity "Henry Onyx Limited").
- Every export is **watermarked** (owner identity + timestamp) per the anti-clone export posture.
- Export is a **sensitive action** — guard the route with `requireSensitiveAction`; audit every export with `@henryco/observability/audit-log`.

### S6 — Telemetry
Emit: `henry.finance.dashboard.viewed`, `henry.finance.export.generated`. Carry the scope (owner / division / staff) and the dimension selection (no raw PII).

## Out of scope
- **Predictive revenue forecasting** — V3-42 (staff intelligence dashboards).
- **A/B-test result analysis** — V3-91.
- **Cohort / retention deep stats** — V3-90 (data lake).
- **Any money mutation** — refunds/payouts/subscription changes are owned by V3-19/V3-69/V3-20; this dashboard only reads.
- **Partner payout *execution*** — V3-69 owns it; this pass only displays the outstanding balance once that data exists.

## Dependencies
Requires **V3-17** (ledger — the single source of money-truth), **V3-19** (refunds/disputes data), **V3-20** (subscription lifecycle for MRR/churn). Consumes **V3-21** (tax owed) and **V3-69** (payouts) data when shipped. Does not block downstream passes (read-only leaf), but is a primary consumer of the entire Phase C money spine.

## Inheritance
The existing `(command)/finance/` surface + `owner-data.ts` aggregators + owner components (`MetricCard`, `OwnerPanel`, `OwnerPageHeader`, `DivisionBadge`, `StatusBadge`), `@henryco/dashboard-shell` (command-center shell + role-gate), `@henryco/data` (extend the aggregator), `@henryco/branded-documents/owner-report` (PDF), `@henryco/ui` (`RouteLiveRefresh`), the V3-17 ledger, V3-19 refund/dispute records, V3-20 subscription lifecycle, V3-21 `tax_payable`, V3-02 sensitive-action guard, `@henryco/observability/audit-log`.

## Implementation requirements

### Files
- `apps/hub/app/owner/(command)/finance/page.tsx` — extend with the new dimensions + tiles (S1).
- `apps/hub/app/owner/(command)/finance/revenue/page.tsx` — by-provider / by-country / by-time slices + time-series chart (S1, S4).
- `apps/hub/app/owner/(command)/finance/divisions/[division]/page.tsx` — per-division operator view (S2).
- `apps/hub/app/owner/lib/owner-data.ts` — ledger-true aggregators (extend `getFinanceCenterData`; add MRR/churn/refund-rate/dispute-rate/tax-owed/reconciliation accessors).
- `apps/hub/app/owner/(command)/finance/export/route.ts` — CSV + PDF export (S5), `requireSensitiveAction`-guarded + audited.
- A small in-repo chart util (e.g. `apps/hub/components/owner/SparklineChart.tsx`, `TimeSeriesChart.tsx`) — no SaaS dependency (S4).

### Trust / safety / compliance
- **RLS + route guards enforce owner-only or finance-staff-only or division-scoped** access; a non-finance staff member reads nothing. Verify with RLS smoke.
- **Read-only**: no route in this pass writes to any money table; assert this in review.
- All amounts in **integer minor units**, formatted at render via `formatCurrencyAmount` — never float math in the aggregators.
- Numbers must **reconcile to the V3-17 ledger** — the dashboard never invents a figure outside reconciled truth.
- Export is **watermarked**, **sensitive-action-guarded**, and **audit-logged** on every generation.
- `@henryco/observability/audit-log` on every view and export (audit on read is required for a money surface).

### Mobile + desktop parity
Desktop: full drill-down. Mobile: a simplified view with the headline metrics (revenue, refund rate, MRR, reconciliation status, tax owed) and a CTA to desktop for deep drill. Responsive, CLS ≈ 0 (charts must reserve their box). No native-app surface in this pass.

### i18n
All labels, status, and error copy localized. The center currently uses Pattern B `translateSurfaceLabel(locale, …)` — keep that for dynamic operator labels, and where you add fixed structural copy, add typed keys under namespace `surface:finance` (Pattern A) so the spine is stable. Currency rendering follows the per-market rules (V3-84 when committed) via `@henryco/pricing` + `formatCurrencyAmount`. 12 locales; zero hardcoded user-facing strings.

### Brand & design system
Owner/operator surface uses the locked owner/command-center tokens (`--acct-*` token family already in use here) — **do not introduce a new token system**. PDF export legal entity = **"Henry Onyx Limited"** via `@henryco/config`; brand "Henry Onyx" never hardcoded; division labels "Henry Onyx <Division>" resolved from `@henryco/config`. No hardcoded domains — internal links via the config URL helpers. Light + dark, mobile + desktop, CLS ≈ 0, contrast not regressed (`pnpm a11y:contrast`).

## Validation gates
1. **Standard CI** — `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build` green; i18n hardcoded-string scanner green.
2. **RLS smoke** — a non-finance staff account cannot read any finance route or aggregator output; division operator sees only their division; owner sees all.
3. **Ledger reconciliation accuracy** — dashboard revenue/refund/tax figures match the V3-17 reconcile output exactly for a seeded fixture period.
4. **Subscription metrics** — MRR/churn/growth computed from V3-20 lifecycle events match a hand-verified fixture.
5. **Export e2e** — CSV + PDF generate, are watermarked, require the sensitive-action step, and write an audit-log entry.
6. **Truthful empty states** — payouts/tax tiles show explicit "not yet available" (not a fake zero) when the upstream data is absent.
7. **UI** — real-browser check, light + dark, mobile + desktop, charts reserve layout (CLS ≈ 0), `pnpm a11y:contrast` not regressed.

## Deployment gate
All gates green; V3-17 + V3-19 + V3-20 merged. **Owner reviews the dashboard before merge** (owner-only surface — owner is the primary user). **14-day soak** with the live money spine, confirming every figure stays reconciled to the ledger across a full reconcile cycle.

## Final report contract
`.codex-temp/v3-22-payments-finance-dashboard/report.md` with the standard 9 sections: exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification · telemetry baseline · deferred items · pass-closure assertion.

## Self-verification
- [ ] S1 elevates the existing `(command)/finance/` center to ledger truth with by-division/provider/country/time + refund/dispute + MRR/churn + reconciliation + payouts + tax-owed tiles.
- [ ] S2 per-division operator view scoped by role (operator sees only their division).
- [ ] S3 per-staff finance views gated by `is_staff_in('finance')`; non-finance staff get no access.
- [ ] S4 charts are self-hosted/lightweight (no SaaS), sparklines per division, CLS ≈ 0.
- [ ] S5 CSV + PDF export watermarked, sensitive-action-guarded, audit-logged; PDF legal entity "Henry Onyx Limited".
- [ ] S6 `henry.finance.dashboard.viewed` + `henry.finance.export.generated` emit with scope.
- [ ] Dashboard is strictly read-only (no money mutation anywhere in the pass).
- [ ] RLS proven; figures reconcile to the V3-17 ledger; truthful empty states for absent upstream data.
- [ ] No hardcoded domains/strings; owner token family reused (no new token system); brand via `@henryco/config`.
- [ ] Report written with all 9 sections.
