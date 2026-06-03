# V3-08 — Foundation Lock: Empty Dashboard Truth

> **STATUS: SHIPPED — PR #164.** This pass is merged and certified on `main`. This document is the elevated canonical spec and closure record. The `## Mandatory scope` sections describe the module-state contract, the subscriptions/invoices truth-up, the owner-workspace freshness work, and the telemetry that LANDED. Residual work is limited to re-auditing any new module against the shipped state contract. Do **not** rebuild the contract — extend it.

**Pass ID:** V3-08  ·  **Phase:** B (Foundation Lock)  ·  **Pillar:** P12 (Global), P3 (Personalization)
**Dependencies:** V3-03  ·  **Effort:** M  ·  **Parallel-safe:** Y
**Owner gate:** none  ·  **Risk class:** —

---

## Role
You are the V3 Foundation engineer for Henry Onyx. You execute exactly this one pass, then stop and report. This pass kills dashboards that pretend to be active systems. Every KPI tile, chart, and "you have X" panel must distinguish "no data yet" from "loading" from "nothing for this account/role" — with no decorative modules and no sample data lingering in production. The line you must not cross: this is a *truth* pass over existing modules — you audit, truth-up, and remove fakes; you do **not** add new dashboard modules, re-lay-out the home (that is V3-34 personalized home), or change any money number (subscriptions/invoices read from the shared ledger; you make the *display* honest, never the *amount* optimistic).

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/08-empty-dashboard-truth` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary
The owner anti-pattern is "no empty dashboards pretending to be active systems." The Phase-A baseline (`docs/v3/AUDIT-BASELINE.md` §3.9) found the `dashboard-modules` registry pattern solid (each module is explicit about its data source) and the staff dashboard pulling real intelligence data, but flagged owner-workspace KPI tiles that show a zero-state without distinguishing "you have nothing yet" from "we haven't loaded yet," plus the `PRODUCT-GAP-LEDGER` finding that the subscriptions dashboard ships UI against a shared ledger with **0 `customer_subscriptions` rows** while the invoices dashboard reads a ledger with **2 `customer_invoices` rows**. The real surfaces this pass governs are the seven module packages — `@henryco/dashboard-modules-{account,building,hotel,marketplace,owner,staff,wallet}` — plus the shared `@henryco/dashboard-shell`. The gap this pass closed: a single typed module-state contract so every module renders distinctly across real-data / empty-yet / empty-no-match / loading / error, the subscriptions+invoices surfaces made honest about zero data, owner-workspace tiles given freshness + manual refresh, and decorative modules deleted. It inherits the four-state distinction codified in V3-05 (kill-loading-theater) and the notification-health module truth from V3-03.

## Mandatory scope

### S1 — Typed module-state contract + per-module audit (SHIPPED)
`packages/dashboard-shell/src/module-state-contract.ts` defines the state union every module must resolve to:
`"real" | "empty_yet" | "empty_no_match" | "loading" | "error"`. For each module registered in the seven `@henryco/dashboard-modules-*` packages, the audit identifies the data source (real query / derived / computed) and verifies the module renders visually distinct UI per state — `loading` uses the V3-05 `StructuredSkeleton` (`kpi-tile` variant for tiles), never warmup copy. The audit is persisted at `docs/v3/dashboard-module-state-audit.md` with a row per module.

### S2 — Subscriptions + invoices truth-up (SHIPPED)
The shared ledger has 0 `customer_subscriptions` and 2 `customer_invoices` rows in production. Each surface now shows the honest state:
- Subscriptions with zero rows → "You don't have any subscriptions yet" + a CTA to a **real, currently-shipping** purchase flow (not a decorative empty chart).
- Invoices render the real 2 rows; a zero-state shows honest copy, never an empty chart.

Amounts come from the shared ledger in integer minor units (kobo/cents) — the display is made honest; the money is never invented or optimistically rendered.

### S3 — Owner-workspace KPI freshness (SHIPPED)
Every KPI tile in `apps/hub/app/owner/(command)/dashboard/` shows the value plus a freshness indicator ("Last updated 12 min ago" — reflecting the actual query time, never a lie), a manual-refresh control, a distinct loading state during refresh, and a distinct error state on query failure.

### S4 — Decorative-module removal (SHIPPED)
Purely decorative modules — static "Trending" panels, "Recommended" panels not wired to recommendation logic, activity feeds showing invented/old entries — are removed. The workspace reads more credible empty than fake-bustling.

### S5 — Customer account overview cleanup (SHIPPED)
`apps/account/app/(account)/page.tsx` (the customer overview): every card validated against a real query; empty states honest; "Recently viewed" / "Saved items" / "Cart resume" (powered by V2-CART-01) verified truthful.

### S6 — Per-division account mini-dashboards (SHIPPED)
The editorial mini-dashboards under `apps/account/{care,jobs,learn,logistics,marketplace,property,studio}` each query real shared-ledger data scoped to the user via RLS; empty states are distinct from loading; "nothing yet" copy is styled with appropriate restraint (not buried, not blaring).

### S7 — Staff workspace truth (SHIPPED)
The staff dashboard already renders live intelligence data (per `intelligence-rollout-status.md`). Spot-checked: live task/queue/risk metrics are real (not stubbed), the support prioritized queue reflects actual triage state, and ops risk-routing reflects actual signals.

### S8 — Hidden-when-empty pattern (SHIPPED)
Modules with no value when empty (e.g. "Recent transactions" on an account with zero transactions) use a "hide when truly empty" pattern instead of an empty placeholder, with a "Show all modules" toggle so power users can still see everything. The workspace reads tighter without ghost cards.

### S9 — Telemetry (SHIPPED)
Events emit via `@henryco/observability`, named per `henry.<domain>.<noun>.<verb>`:
- `henry.dashboard.module.rendered` — `{ moduleId, state, source }`
- `henry.dashboard.module.refreshed` — `{ moduleId, freshnessSeconds }`
- `henry.dashboard.empty_state.cta_clicked` — `{ moduleId, ctaTarget }`

Feeds the owner-workspace "Module health" tile: modules stuck in an empty state >7 days (candidates for removal or a messaging fix).

## Out of scope
- **New dashboard modules** — existing modules are audited only.
- **Dashboard layout / ordering** — **V3-34** (personalized home).
- **Search palette** — `packages/search-ui/` is owner-reserved; never touched.
- **Loading-theater removal on public surfaces** — **V3-05** (this pass consumes its four-state contract).
- **Notification delivery-state machine** — **V3-03** (this pass only verifies the notification-health module is truthful).

## Dependencies
- **Deps:** V3-03 (notification-message-states) — the notification-health tile is one of the modules verified here.
- **Blocks:** V3-34 (personalized home) — modules must be honest before personalization reorders them. V3-94 (closure integration test) re-walks every dashboard surface.

## Inheritance
- `@henryco/dashboard-shell` — extended with the module-state contract (`module-state-contract.ts`).
- `@henryco/dashboard-modules-{account,building,hotel,marketplace,owner,staff,wallet}` — audited + fixed per module.
- `@henryco/data` — the aggregators extended with freshness metadata for S3.
- `@henryco/ui` `StructuredSkeleton` (`kpi-tile` variant) from V3-05 — the canonical loading state for tiles.
- PERF-01 `PublicRouteLoader` — preserved.

## Implementation requirements

### Files
- `packages/dashboard-shell/src/module-state-contract.ts` (the state union + types — shipped).
- `docs/v3/dashboard-module-state-audit.md` (the audit — shipped).
- Per-module fixes in `packages/dashboard-modules-*` and the per-app dashboard route files (`apps/hub/app/owner/(command)/dashboard/`, `apps/account/app/(account)/...`).
- Owner-workspace "Module health" tile fed by the S9 telemetry.
- **No schema migrations expected.** Subscriptions/invoices read existing shared-ledger tables; this pass does not write money rows. Any data-seeding question (does a user have subscriptions whose rows are missing?) is escalated to the owner as a data audit — never resolved by fabricating rows.

### Trust / safety / compliance
- Empty-state CTAs link only to **real, currently-shipping** flows — no "Coming soon" disguised as ready.
- "Last updated N min ago" always reflects the actual query timestamp — it never lies.
- RLS: every per-user module query is scoped to the authenticated user; a module never reveals another account's rows. Money figures (wallet, invoices, subscriptions) are read-only here and remain provider-confirmed money-truth — never optimistic UX.
- ANTI-CLONE: honest empty states reveal less about scale than fake-bustling ones.

### Mobile + desktop parity
- All five module states render correctly on web mobile + desktop; the hidden-when-empty pattern respects mobile screen real estate. Expo super-app dashboard parity is tracked in V3-87; this pass covers the web surfaces.

### i18n
- All new/changed copy routes through `@henryco/i18n` under `surface:dashboard` (empty-state lines, freshness label, refresh/retry actions, CTA labels). 12 locales; Pattern B fills non-en-US. Zero hardcoded user-facing strings.

### Brand & design system
- Any division label resolves from `@henryco/config` (Henry Onyx; "Henry Onyx <Division>"); legal entity on any invoice-adjacent copy is **Henry Onyx Limited**. No "Henry & Co." user-facing strings. Tiles/skeletons use locked design-system tokens (`--site-*` / `--accent`, per-division accent from `company.ts`) — light + dark, mobile + desktop, CLS ≈ 0, contrast not regressed (`pnpm a11y:contrast`).

## Validation gates
1. **CI** — typecheck + lint + test + build green.
2. **Module-state audit** — `docs/v3/dashboard-module-state-audit.md` complete; every module maps to the contract's five states.
3. **Live walk** — owner workspace + customer overview + staff workspace: each module renders the distinct state matching its data condition (force real / empty-yet / empty-no-match / loading / error).
4. **Production data check** — subscriptions surface shows honest zero-state (0 rows); invoices surface shows the real 2 rows; no decorative chart renders against zero data.
5. **RLS check** — per-user module queries return only the authenticated user's rows (verified with two fixture accounts).
6. **UI gates** — light + dark, mobile + desktop, CLS ≈ 0, `pnpm a11y:contrast` clean on every touched dashboard surface.

## Deployment gate
- All gates green; owner reviews the dashboard before/after; the "Module health" tile live. Behaviour-on-live-traffic pass → a short soak watching module-state telemetry for surfaces stuck empty unexpectedly before declaring closed.

## Final report contract
`.codex-temp/v3-08-empty-dashboard-truth/report.md` with the standard 9 sections (exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification · telemetry baseline · deferred items · pass-closure assertion), plus the module-state audit and before/after dashboard captures.

## Self-verification
- [ ] S1 — every module across the 7 `dashboard-modules-*` packages audited against the `module-state-contract.ts` five-state union.
- [ ] S2 — subscriptions (0 rows) + invoices (2 rows) surfaces honest about real data; no empty decorative charts; amounts read from the ledger.
- [ ] S3 — every owner-workspace KPI tile shows freshness + manual refresh + distinct loading/error.
- [ ] S4 — decorative/unwired modules removed.
- [ ] S5 — customer account overview cards validated against real queries.
- [ ] S6 — per-division account mini-dashboards verified truthful + RLS-scoped.
- [ ] S7 — staff workspace metrics verified live (not stubbed).
- [ ] S8 — hidden-when-empty applied with a "Show all modules" toggle.
- [ ] S9 — three `henry.dashboard.*` events emitting; "Module health" tile rendering.
- [ ] Brand via `@henryco/config` (Henry Onyx); copy via `@henryco/i18n` (`surface:dashboard`); tokens locked; CLS ≈ 0.
- [ ] Report written. Hand-off: Foundation-Lock close (V3-12) / V3-34 (personalized home).
