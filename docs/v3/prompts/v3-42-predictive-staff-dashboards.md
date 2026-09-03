# V3-42 — Predictive: Advanced Staff Dashboards

**Pass ID:** V3-42  ·  **Phase:** E (Personalization & Predictive)  ·  **Pillar:** P6 (Predictive Intelligence)
**Dependencies:** V3-40 (fraud & risk), V3-41 (quality & workload)  ·  **Effort:** M  ·  **Parallel-safe:** Y
**Owner gate:** none  ·  **Risk class:** —

---

## Role
You are the V3 advanced staff-dashboards engineer for Henry Onyx. You execute exactly this one pass, then stop and report. This pass turns the raw predictive output of V3-40 (risk) and V3-41 (quality/workload) into per-role *intelligence* dashboards — trend, anomaly, recommendation, drill-down — so trust, finance, support, and moderation staff act on patterns, not just present-tense queues. The line you must not cross: every chart and drill-down respects per-role RLS, no dashboard exposes a customer-visible prediction or score, and recommendation cards *propose* — a human always accepts/dismisses; nothing here auto-acts.

## Project
| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/42-predictive-staff-dashboards` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary
The staff dashboard substrate is mature. `packages/dashboard-shell/src` provides the shell, `role-gate.ts`, `staff-register.ts`, command palette, surfaces, and tokens; `packages/dashboard-modules-staff/src` provides per-division/per-function modules (`staff-finance-operator`, `staff-moderation`, `staff-support`, `staff-overview`, …) plus the `shared/queue-shell.tsx` + `shared/sla.ts` primitives. Staff today see live queues, tasks, and SLA via these surfaces. V3-40 now persists `risk_scores` / `risk_enforcement_log`; V3-41 persists `workload_forecasts` / `quality_assessments` / `dispute_likelihoods` — all staff/service-role RLS only.

What does NOT exist: anything that reads that history *longitudinally*. There is no risk-trend-by-entity-type view, no statistical anomaly banner, no recommendation card ("forecast says hire two more support agents next week"), and no chart→entity drill-down. Staff have the data points but no instrument to see movement, outliers, or suggested action. This pass builds that instrument as per-role dashboards on top of the existing shell — pure read + recommendation, consuming V3-40/V3-41 output, adding no new scoring.

## Mandatory scope

### S1 — Per-role advanced dashboards (`packages/dashboard-modules-staff/src/staff-intelligence/`)
A new module rendering a role-scoped advanced dashboard, gated by `packages/dashboard-shell` `role-gate.ts`:
- **Trust/risk staff:** risk-score trend by `entity_type`; top-risk listings/users (latest `risk_scores`); enforcement-action volume over time (from `risk_enforcement_log`).
- **Finance staff:** revenue / refunds / disputes / reconciliation trend (reads finance aggregates + V3-41 `dispute_likelihoods` watch-list).
- **Support staff:** 7-day queue forecast (V3-41 `workload_forecasts`) + agent performance + SLA-compliance trend.
- **Moderation staff:** queue health + decision-accuracy + report-volume trend.
Each dashboard composes from a shared `<PredictiveDashboard>` primitive (chart grid + anomaly banner slot + recommendation rail + drill-down handler) so the four roles share structure and only differ in data bindings.

### S2 — Statistical anomaly detection (`packages/intelligence/src/predictive/anomaly.ts`)
A transparent statistical detector (z-score / robust MAD over a rolling window — explainable, no LLM) over the same series the dashboards chart: sudden spike in refund requests, dispute rate, support volume, enforcement actions, report volume.
```ts
export interface AnomalyResult {
  series: string;                 // 'refund_requests' | 'dispute_rate' | 'support_volume' | ...
  detected: boolean;
  observed: number;
  expected: number;
  deviation: number;              // standardized
  band: "watch" | "alert";
  windowDescription: string;      // for the human-readable banner
}
export function detectAnomalies(series: SeriesPoint[], opts?: AnomalyOpts): AnomalyResult[];
```
Detected anomalies render as dismissible banners on the relevant role dashboard. Deterministic and back-testable.

### S3 — Recommendation cards (`packages/dashboard-modules-staff/src/staff-intelligence/recommendations.ts`)
Derive actionable recommendations from forecasts + anomalies + risk trend:
- "Consider staffing +2 support agents next week (forecast +30% volume)." (from V3-41 workload)
- "An auto-deny rule for pattern X would have prevented 12 disputes last month." (from V3-40/V3-41 history)
- "Refund requests in <division> are 3σ above baseline — investigate." (from S2 anomaly)
Each card has **accept / dismiss / snooze** with persisted state. Acceptance is a *recommendation acknowledgement* + optional deep-link into the action surface — it never auto-applies a rule or auto-staffs. New table `public.staff_recommendation_state (id, recommendation_key, role_scope, status text check (status in ('open','accepted','dismissed','snoozed')), actor uuid, acted_at, snooze_until, created_at)`, staff/service-role RLS, action audited.

### S4 — Drill-down
Every chart drills into the underlying entities (a spike in `dispute_rate` → the actual transactions; a risk-trend point → the scored accounts). Drill-down reuses the existing queue-shell list and **respects per-role RLS** — a support-staff drill-down cannot reach trust-staff-only risk rows. Per-staff drill-down (agent performance) is scoped so a staff member sees only what their role permits.

### S5 — Telemetry + audit
Register in `HenryEventNames` and emit: `henry.staff_dashboard.viewed`, `henry.staff_dashboard.recommendation.accepted`, `henry.staff_dashboard.recommendation.dismissed`, `henry.staff_dashboard.anomaly.shown`. Every recommendation accept/dismiss/snooze writes `@henryco/observability/audit-log` with actor + role + recommendation key. No PII in event properties.

## Out of scope
- Producing the predictive scores themselves — **V3-40** (risk) and **V3-41** (quality/workload). This pass only reads/visualizes/recommends.
- The owner-only cross-division finance dashboard — **V3-22** (this pass is staff-role-scoped, not owner-global).
- Auto-applying any recommendation (auto-staffing, auto-rule-creation) — recommendations are human-accepted only; automation lives in **V3-43/V3-44/V3-47**.

## Dependencies
Depends on **V3-40** (`risk_scores`, `risk_enforcement_log`) and **V3-41** (`workload_forecasts`, `quality_assessments`, `dispute_likelihoods`). Does not block a downstream pass; feeds operator intuition that V3-44/V3-47 later automate.

## Inheritance
- `packages/dashboard-shell` — shell, `role-gate.ts`, `staff-register.ts`, tokens, surfaces, command palette.
- `packages/dashboard-modules-staff` — `shared/queue-shell.tsx`, `shared/sla.ts`, existing role modules (drill-down reuses the queue list).
- `packages/intelligence` — V3-40/V3-41 output reads; analytics envelope; `HenryEventNames`; the new `anomaly.ts`.
- `@henryco/observability/audit-log` — on every recommendation action.

## Implementation requirements
### Files
- `packages/dashboard-modules-staff/src/staff-intelligence/` (new module: `index.tsx`, `dashboard.tsx`, `recommendations.ts`, `bindings/{trust,finance,support,moderation}.ts`)
- `packages/intelligence/src/predictive/anomaly.ts` (new) + index export + tests
- `packages/dashboard-shell/src` — register the advanced dashboards in `staff-register.ts`
- `apps/hub/supabase/migrations/<ts>_staff_recommendation_state.sql` (new — table + staff/service-role RLS)
- Drill-down route handlers reusing the queue-shell list
- Operator i18n copy under `surface:staff_intelligence`

### Trust / safety / compliance
- Per-role RLS enforced on every chart query and every drill-down — a role cannot reach another role's restricted rows; prove the matrix.
- No customer-visible prediction/score; staff-only surface.
- Recommendations are advisory; acceptance acknowledges + optionally deep-links — never auto-acts.
- Every recommendation accept/dismiss/snooze is audited with actor + role.
- ANTI-CLONE Principle 12 (governance — operator intelligence stays internal, audited).

### Mobile + desktop parity
Dashboards are desktop-first (dense charts). Provide a mobile-summary variant (key trend + anomaly banners + open-recommendations count) consistent with the sibling `(workspace)` modules' mobile behavior — full drill-down is desktop.

### i18n
Operator namespace `surface:staff_intelligence`. Chart titles, anomaly banner copy, recommendation card text + rationale, drill-down labels — all via `@henryco/i18n` following the V3-07b operator-surface posture. No hardcoded operator strings.

### Brand & design system
`packages/dashboard-shell` tokens only; any brand string via `@henryco/config`; zero `henrycogroup.com` literals; cross-links via `henryDomain()`. Light + dark, desktop + mobile-summary, CLS ≈ 0, charts legible and contrast-green in both themes.

## Validation gates
1. **Standard CI** — typecheck, lint, test, build green.
2. **Per-role dashboard smoke** — trust, finance, support, moderation each render a functional advanced dashboard with real V3-40/V3-41 data bindings.
3. **Anomaly detection** — a synthetic spike injected into a series triggers the correct band (`watch`/`alert`) and a banner; back-test confirms low false-positive rate on stable series.
4. **Recommendation lifecycle** — accept/dismiss/snooze persists, audits, and (for accept) deep-links; snooze re-surfaces after `snooze_until`.
5. **Drill-down RLS matrix** — each role drills only into its permitted entities; a support drill-down cannot reach trust-only risk rows; SQL/e2e-proven.
6. **Real-browser UI** — charts + banners + recommendation rail render light + dark, desktop + mobile-summary, CLS ≈ 0, contrast green.

## Deployment gate
All gates green; the drill-down RLS matrix verified across all four roles (this is the load-bearing safety check). PR squash-merged to `main` via CI; no branch-protection bypass. 14-day soak monitoring `henry.staff_dashboard.viewed` adoption and recommendation accept/dismiss ratios to tune which cards are worth surfacing.

## Final report contract
`.codex-temp/v3-42-predictive-staff-dashboards/report.md` with the standard 9 sections (exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification · telemetry baseline · deferred items · pass-closure assertion) — including the per-role drill-down RLS matrix evidence.

## Self-verification
- [ ] Four per-role advanced dashboards from one shared `<PredictiveDashboard>` primitive, role-gated.
- [ ] Transparent statistical anomaly detector with dismissible banners; back-tested.
- [ ] Recommendation cards with accept/dismiss/snooze persisted in `staff_recommendation_state` (staff RLS), audited, never auto-acting.
- [ ] Chart→entity drill-down reusing queue-shell; per-role RLS matrix proven across all four roles.
- [ ] Four telemetry events registered + emitted; recommendation actions audited.
- [ ] Operator i18n via `surface:staff_intelligence`; tokens only; zero hardcoded domains/strings.
- [ ] Consumes V3-40/V3-41 output only — produces no new scores.
- [ ] Drill-down RLS matrix evidence + report written.
