# V3-41 — Predictive: Quality & Workload

**Pass ID:** V3-41  ·  **Phase:** E (Personalization & Predictive)  ·  **Pillar:** P6 (Predictive Intelligence)
**Dependencies:** V3-26 (ai-provider-router)  ·  **Effort:** L  ·  **Parallel-safe:** Y
**Owner gate:** none (D3 — AI provider — recorded for V3-26; confirm, don't re-litigate)  ·  **Risk class:** —

---

## Role
You are the V3 quality & workload prediction engineer for Henry Onyx. You execute exactly this one pass, then stop and report. This pass gives operations three forecasts the platform does not have today: per-queue incoming volume (so staffing is planned, not reactive), per-service at-risk detection (so a failing booking/project/enrolment is caught before the customer complains), and per-transaction dispute likelihood (so disputes are pre-empted). The line you must not cross: these are **advisory operator signals** — they recommend staff intervention, they never auto-act on a customer's account, never block a payment, and never expose a prediction to the customer.

## Project
| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/41-predictive-quality-and-workload` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary
The staff workspace exists with real queues. `apps/staff/app/(workspace)/` hosts `support`, `kyc`, `finance`, `moderation`, `operations`, `logistics`, `care`, etc., backed by `packages/dashboard-modules-staff/src` (the `shared/queue-shell.tsx`, `shared/sla.ts`, `shared/generic-queue.tsx` primitives). `packages/intelligence` carries `triageSupportStub` (intent classification + escalation) and the analytics envelope. V3-26 supplies the governed AI provider router.

What does NOT exist: any *forward-looking* operations signal. Queues show present load and SLA, but nobody can see next week's forecasted support volume, no ongoing service carries an at-risk flag before it actually fails, and no transaction is scored for dispute likelihood until a dispute is already filed. Staffing is reactive; quality problems are discovered by the customer; disputes are pure surprise. This pass adds three prediction services and surfaces their output on the existing staff/operations dashboards. It is deliberately **separate from V3-40 fraud risk** — this is operational quality, not adversarial fraud — and stops short of building the advanced trend/anomaly/drill-down dashboards (V3-42) and job-match scoring (V3-71).

## Mandatory scope

### S1 — Workload (queue-volume) forecaster (`packages/intelligence/src/predictive/workload.ts`)
For each staff queue (`support`, `kyc_review`, `moderation`, `finance`, `refunds`, `logistics_ops`), forecast incoming volume per hour for the next 7 days.
```ts
export type QueueKey = "support" | "kyc_review" | "moderation" | "finance" | "refunds" | "logistics_ops";
export interface WorkloadForecast {
  queue: QueueKey;
  horizonHours: number;                  // 168
  perHour: { at: string; predicted: number; lowerCI: number; upperCI: number }[];
  staffingRecommendation: { date: string; recommendedAgents: number; rationale: string }[];
}
export function forecastWorkload(input: { queue: QueueKey; history: QueueObservation[] }): WorkloadForecast;
```
Inputs: historical per-hour volumes + day-of-week/hour-of-day seasonality + recent trend. Start with a transparent statistical model (seasonal-naive / EWMA + trend with confidence interval) — explainable and back-testable; an LLM is NOT required for this and must not be used for the core forecast (reserve V3-26 only for narrative rationale text, optional). Staffing recommendation derives from forecast vs. per-agent throughput config.

### S2 — Service-quality at-risk detector (`packages/intelligence/src/predictive/quality.ts`)
For each ongoing service unit (care booking, studio project, learn enrolment, marketplace order in fulfilment), predict completion + satisfaction risk.
```ts
export type ServiceUnitType = "care_booking" | "studio_project" | "learn_enrolment" | "marketplace_order";
export interface QualityAssessment {
  unitType: ServiceUnitType;
  unitId: string;
  atRisk: boolean;
  riskBand: "low" | "elevated" | "high";
  reasons: string[];                     // explainable: "no provider message in 72h", "milestone overdue"
  suggestedIntervention?: string;        // staff-facing, advisory
}
export function assessQuality(input: { unitType: ServiceUnitType; signals: QualitySignals }): QualityAssessment;
```
Inputs: provider history (completion rate, response latency), progress signals (milestone overdue, message silence, payment stall), customer signal patterns (low engagement, prior complaint). Output is an **at-risk flag for staff** — never a customer-visible label and never an automated action.

### S3 — Dispute-likelihood scorer (`packages/intelligence/src/predictive/dispute.ts`)
For each transaction, predict the likelihood of a dispute/chargeback within a configurable window.
```ts
export interface DisputeLikelihood {
  transactionId: string;
  likelihood: number;                    // 0–1
  band: "low" | "watch" | "high";
  windowDays: number;
  topFactors: { factor: string; weight: number }[];
}
export function scoreDisputeLikelihood(input: { transactionId: string; features: DisputeFeatures }): DisputeLikelihood;
```
Inputs: transaction features (amount, category, provider/buyer history, prior dispute rate, delivery confirmation gap). This is **distinct from V3-40 fraud risk** — a clean buyer can still file a delivery dispute. Output feeds staff watch-lists; it never holds or blocks the transaction (enforcement is V3-40's domain, and even there only via staff-reviewed tiers).

### S4 — Persistence + daily batch
New migration `apps/hub/supabase/migrations/<ts>_predictive_quality_workload.sql`:
- `public.workload_forecasts (queue, generated_at, horizon_hours, payload jsonb, model_version, primary key (queue, generated_at))`
- `public.quality_assessments (unit_type, unit_id, assessed_at, at_risk, risk_band, reasons jsonb, model_version, primary key (unit_type, unit_id, assessed_at))`
- `public.dispute_likelihoods (transaction_id, scored_at, likelihood numeric, band, top_factors jsonb, model_version, primary key (transaction_id, scored_at))`
All three **staff/service-role RLS only** — never end-user readable. A daily (workload + quality) and per-event (dispute, on transaction create/update) batch writes these via the existing cron + idempotency convention. Emit telemetry per batch.

### S5 — Staff/operations surfaces
Extend the existing staff dashboards (reuse `packages/dashboard-modules-staff/src/shared` + `packages/dashboard-shell`):
- Each queue module surfaces its 7-day forecast + staffing recommendation.
- An at-risk list per division surfaces high/elevated `quality_assessments` with the suggested intervention.
- The operations dashboard surfaces a dispute watch-list (high/watch bands).
No new top-level route is required — these are panels on existing surfaces; the *advanced* dashboards are V3-42.

### S6 — Telemetry + audit
Register in `HenryEventNames` and emit: `henry.predictive.workload.computed`, `henry.predictive.quality.at_risk_flagged`, `henry.predictive.dispute.high_likelihood`. Each model run records its `model_version`; any operator action taken on a surfaced flag is audited via `@henryco/observability/audit-log`. No PII in event properties (ids + bands only).

## Out of scope
- Fraud/adversarial risk scoring + enforcement — **V3-40**.
- Advanced trend/anomaly/recommendation/drill-down staff dashboards — **V3-42** (consumes this pass's output).
- Job-candidate match scoring — **V3-71** (employer suite).
- Neglected-queue SLA-breach escalation automation — **V3-47** (consumes the workload forecast).

## Dependencies
Depends on **V3-26** (router — optional, narrative-only here). BLOCKS **V3-42** (advanced dashboards) and **V3-47** (neglected-queue detection consumes the workload forecast). D3 (AI provider) already recorded in `docs/v3/DECISIONS-REQUIRED.md` — confirm, don't re-litigate.

## Inheritance
- `packages/intelligence` — `triageSupportStub`, analytics envelope, `HenryEventNames`, `HenryDivision`.
- `packages/dashboard-modules-staff` + `packages/dashboard-shell` — queue shell, SLA primitives, role-gate for the surfaces.
- **V3-26** AI provider router — optional narrative-rationale only; the core forecasts/scores are transparent statistical models.
- `@henryco/observability` — telemetry + audit-log.
- V3-90 data lake — consumed as a richer feature source once shipped; degrade gracefully to Postgres aggregates until then.

## Implementation requirements
### Files
- `apps/hub/supabase/migrations/<ts>_predictive_quality_workload.sql` (new — three tables + staff/service-role RLS)
- `packages/intelligence/src/predictive/workload.ts`, `quality.ts`, `dispute.ts` (new) + index exports
- `packages/intelligence/src/predictive/__tests__/*.test.ts` (new — back-tests)
- Cron handlers for daily (workload, quality) + per-event (dispute) scoring
- Panel wiring in `packages/dashboard-modules-staff` queue modules + operations dashboard
- Operator i18n copy under `surface:staff_predictive`

### Trust / safety / compliance
- Advisory only: no automated customer-facing action; no payment hold/block (that is V3-40, staff-gated).
- Predictions are staff/service-role visible only (RLS); never exposed to the customer or provider being assessed.
- Model decisions and any operator action taken on them are audited (`@henryco/observability/audit-log`); each output carries its `model_version` for reproducibility.
- Core forecasts/scores are transparent statistical models (back-testable); LLM use is confined to optional narrative text via the governed V3-26 router.
- ANTI-CLONE Principles 1 (server-side) + 10 (the historical operational signal is a proprietary data moat).

### Mobile + desktop parity
Prediction is server-side. Surfaces are staff workspace — desktop-first with the mobile-summary view the sibling `(workspace)` modules already provide. No public/customer surface.

### i18n
Operator namespace `surface:staff_predictive`. Forecast labels, at-risk reasons, staffing-recommendation rationale, dispute-factor descriptions — all via `@henryco/i18n`, following the V3-07b operator-surface i18n posture. No hardcoded operator strings.

### Brand & design system
Staff surfaces use `packages/dashboard-shell` tokens; any brand string via `@henryco/config`; zero `henrycogroup.com` literals; cross-links via `henryDomain()`. Light + dark, desktop + mobile-summary, CLS ≈ 0, contrast green.

## Validation gates
1. **Standard CI** — typecheck, lint, test, build green.
2. **Workload back-test** — forecaster back-tested against a historical window; MAPE/coverage of the confidence interval reported; seasonal patterns captured.
3. **Quality at-risk precision/recall** — sampled against known good/bad outcomes; reasons are explainable and accurate.
4. **Dispute back-test** — scored against historical disputes; AUC/precision-at-k reported; confirmed distinct from V3-40 fraud signal.
5. **RLS verification** — all three tables staff/service-role only; no end-user access; SQL-proven.
6. **Surface smoke** — each queue shows its forecast; at-risk and dispute watch-lists render with explainable reasons.
7. **Advisory-only assertion** — no code path lets a prediction auto-act on a customer account or a payment.

## Deployment gate
All gates green; **30-day shadow run + owner approval** before staffing recommendations are presented as authoritative (forecasts may render as advisory immediately, but the "recommended agents" figure is owner-ratified after the shadow window validates accuracy). PR squash-merged to `main` via CI; no branch-protection bypass.

## Final report contract
`.codex-temp/v3-41-predictive-quality-and-workload/report.md` with the standard 9 sections (exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification · telemetry baseline · deferred items · pass-closure assertion) — plus the back-test accuracy appendices for all three models.

## Self-verification
- [ ] Workload forecaster (6 queues, 7-day per-hour + CI + staffing rec); back-tested.
- [ ] Quality at-risk detector (4 service-unit types) with explainable reasons; precision/recall sampled.
- [ ] Dispute-likelihood scorer; back-tested; provably distinct from V3-40 fraud risk.
- [ ] Three persistence tables, staff/service-role RLS only, SQL-proven; daily/per-event idempotent batch.
- [ ] Surfaces wired into existing staff/operations dashboards (no auto-action on customers/payments).
- [ ] Three telemetry events registered + emitted; model_version stamped; operator actions audited.
- [ ] Operator i18n via `surface:staff_predictive`; zero hardcoded domains/strings.
- [ ] Back-test accuracy appendices + report written.
