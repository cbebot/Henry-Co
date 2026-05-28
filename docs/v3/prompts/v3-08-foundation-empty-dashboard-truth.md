# V3-08 — Foundation: Empty Dashboard Truth

**Pass ID:** V3-08
**Phase:** B (FOUNDATION LOCK)
**Pillar:** P12 (Global), P3 (Personalisation)
**Dependencies:** V3-03 (notification message states)
**Effort:** M (1–2 weeks)
**Parallel-safe:** YES
**Owner gate:** None
**Risk class:** None

---

## Role

You are the V3 Foundation engineer for HenryCo. You execute exactly this one pass, then stop and report.

This pass kills empty dashboards that pretend to be active systems. Every KPI tile, every chart, every "you have X" panel — must distinguish "no data yet" from "loading" from "you have nothing in this account/role". No decorative dashboards. No hardcoded sample data lingering in production.

---

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/08-empty-dashboard-truth` |
| Deploy | Vercel (10 web projects) |
| OS context | Windows + bash; pnpm 9.15.5; Node 24.x |

---

## Audit summary (lifted from AUDIT-BASELINE.md §3.9 + PRODUCT-GAP-LEDGER)

> ### 3.9 Empty dashboards
> - **Solid:** dashboard-modules registry pattern means modules are explicit about their data source
> - **Solid:** staff dashboard pulls real intelligence-data per intelligence-rollout-status
> - **Gap:** owner workspace dashboard data freshness varies; some KPI tiles may show zero-state without "you have nothing yet vs we haven't loaded yet" distinction
> - **Gap (PRODUCT-GAP-LEDGER):** subscriptions dashboard ships UI but no rows exist in production

From PRODUCT-GAP-LEDGER:
> The subscriptions dashboard is wired to real shared-ledger tables, but the live shared ledger currently has `0` `customer_subscriptions` rows.
> The invoices dashboard is wired to real shared-ledger tables, and the live shared ledger currently has `2` `customer_invoices` rows.

Owner anti-pattern: "no empty dashboards pretending to be active systems".

---

## Mandatory scope

### S1 — Module-by-module state audit

For each module registered in `@henryco/dashboard-modules-{account,building,hotel,marketplace,owner,staff,wallet}`:
- Identify the data source (real query, derived, computed).
- Classify each module's possible states:
  - **Real data** — live query returns rows.
  - **Empty (yet)** — query returns zero rows because user has done nothing yet.
  - **Empty (none for you)** — query returns zero rows for valid filters.
  - **Loading** — query in-flight.
  - **Error** — query failed.
- Verify the module renders distinctly different UI for each state.

Output `docs/v3/dashboard-module-state-audit.md`.

### S2 — Subscriptions + Invoices truth-up

Per PRODUCT-GAP-LEDGER:
- `customer_subscriptions`: 0 rows in production.
- `customer_invoices`: 2 rows.

Two options per row:
- **Option A:** Surface honest state — "You don't have any subscriptions yet" with CTA to learn more. Don't show empty charts.
- **Option B:** Seed real subscriptions if any users have them but data is missing (verify with owner; data audit needed).

Implementation:
- Audit each existing subscription/invoice surface.
- Replace decorative-chart-with-no-data with honest empty-state copy.
- Add CTA "Browse premium plans" or similar that points to a real, currently-shipping purchase flow.

### S3 — Owner-workspace dashboard freshness

Every KPI tile on the owner workspace:
- Shows the data point + a freshness indicator ("Last updated 12 min ago").
- Has a manual refresh option.
- Has a clear loading state during refresh.
- Has a clear error state if the query failed.

Audit + update every tile in `apps/hub/app/owner/(command)/dashboard/`.

### S4 — Decorative module removal

Any module that's purely decorative (e.g., a chart with sample data that never reflects real account state):
- REMOVE.
- Owner workspace looks more credible empty than fake.

Specifically audit:
- "Trending" panels that show static suggestions.
- "Recommended" panels that aren't wired to recommendation logic.
- Activity feeds that show old or invented entries.

### S5 — Customer account dashboard cleanup

`apps/account/app/(account)/page.tsx` — the customer overview:
- Every card validated against real query.
- Empty states honest.
- "Recently viewed" / "Saved items" / "Cart resume" — all powered by V2-CART-01 — verify they're truthful.

### S6 — Per-division mini-dashboards in account

Recent commits shipped editorial rebuilds for `apps/account/{care,jobs,learn,logistics,marketplace,property,studio}` mini-dashboards. Verify:
- Each mini-dashboard's modules query real shared-ledger data scoped to the user.
- Empty states are distinct from loading.
- The "you have nothing yet" copy is appropriately styled (not buried, not blaring).

### S7 — Staff workspace truth

Staff dashboard already shows live intelligence-data per intelligence-rollout-status.md. Spot-check:
- Live task/queue/risk metrics are real (not stub).
- Staff support prioritized queue reflects actual triage state.
- Staff operations risk-routing visibility reflects actual signals.

### S8 — Hidden-when-empty pattern

For modules that have no value when empty (e.g., a "Recent transactions" card on an account with zero transactions), use a "hide when truly empty" pattern instead of showing an empty placeholder. The owner workspace looks tighter without ghost cards.

But: provide a "Show all modules" toggle so power users can see everything.

### S9 — Telemetry

Events:
- `henry.dashboard.module.rendered` (module_id, state, source)
- `henry.dashboard.module.refreshed` (module_id, freshness_seconds)
- `henry.dashboard.empty_state.cta_clicked` (module_id, cta_target)

Owner-workspace tile: "Module health" — list of modules that have been in empty state for >7 days (candidates for removal or messaging fix).

---

## Out of scope

- New dashboard modules (existing modules audited only).
- Dashboard layout changes (V3-34 personalized home).
- Search palette modifications (search-ui reserved).

---

## Dependencies

- V3-03 (notification message states) — the notification health tile is one of the modules to verify.

Blocks:
- V3-34 (personalized home) — empty modules are pre-personalization; need to be honest first.

---

## Inheritance

- `@henryco/dashboard-shell` — extend module-state contract.
- `@henryco/dashboard-modules-*` — audit + fix each.
- `@henryco/data` — extend aggregator with freshness metadata.
- PERF-01 PublicRouteLoader — preserve.

---

## Implementation requirements

### Files

- `docs/v3/dashboard-module-state-audit.md` (new)
- `packages/dashboard-shell/src/module-state-contract.ts` (new — types for module states)
- Per-module fixes in `packages/dashboard-modules-*` and per-app dashboard route files
- `apps/hub/app/owner/(command)/dashboard/module-health-tile.tsx` (new per S9)

### No migrations expected.

### Telemetry events wired in `@henryco/observability`.

---

## Trust / safety / compliance

- Empty-state CTAs link to real, currently-shipping flows (no fake "Coming soon" CTAs disguised as ready).
- "Last updated N min ago" never lies — always reflects the actual query time.
- ANTI-CLONE: honest empty states reveal less about scale than fake-bustling ones.

## Mobile + desktop parity

- All module states render correctly on mobile.
- Hidden-when-empty pattern respects mobile screen real estate.

## i18n

- All new copy via `@henryco/i18n` namespace `surface:dashboard`.

---

## Validation gates

1. Standard CI.
2. Module state audit complete + reviewed.
3. Live walk of owner workspace + customer dashboard + staff workspace — every module shows distinct state per data condition.
4. Production data check: tiles displaying expected counts (which may be zero — that's fine, just must show honest empty state).

## Deployment gate

- All gates pass.
- Owner reviews the dashboard before/after.
- 48-hour soak.

## Final report contract

`.codex-temp/v3-08-empty-dashboard-truth/report.md` with the standard 9 sections + module audit + before/after dashboard screenshots.

---

## Self-verification

- [ ] Every dashboard module audited for state distinction.
- [ ] Subscriptions + invoices surfaces honest about zero data.
- [ ] Owner-workspace tiles all show freshness + manual-refresh.
- [ ] Decorative modules removed.
- [ ] Per-division mini-dashboards verified truthful.
- [ ] Staff workspace verified live.
- [ ] Hidden-when-empty pattern applied appropriately.
- [ ] 3 new telemetry events emitting.
- [ ] Report written.
