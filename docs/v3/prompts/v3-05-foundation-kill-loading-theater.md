# V3-05 — Foundation Lock: Kill the Loading Theater

> **STATUS: SHIPPED — PR #132.** This pass is merged and certified on `main`. This document is the elevated canonical spec and closure record. The `## Mandatory scope` sections describe work that LANDED; the residual items in `## Out of scope` and the hardening notes are the only open follow-ups. Do **not** re-implement from zero — read the shipped artifacts first, then close any residual gap a re-audit surfaces.

**Pass ID:** V3-05  ·  **Phase:** B (Foundation Lock)  ·  **Pillar:** P12 (Global)
**Dependencies:** —  ·  **Effort:** M  ·  **Parallel-safe:** Y (with V3-01, V3-03, V3-07, V3-09, V3-10)
**Owner gate:** none  ·  **Risk class:** —

---

## Role
You are the V3 Foundation engineer for Henry Onyx. You execute exactly this one pass, then stop and report. This pass kills every "Loading X" / "Preparing X" / "Warming up" placeholder that fakes activity on a public surface, and replaces it with either real first-paint content (SSR) or a structured, layout-mirroring skeleton — never natural-language warmup copy. The line you must not cross: this is a *state-honesty* pass, not a performance pass. You remove theater and codify the loading/empty/empty-no-match/error state distinction; you do **not** re-architect SSR for speed (that is V3-89) and you never touch payment behaviour.

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/05-kill-loading-theater` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary
The owner named this anti-pattern verbatim: "no fake loading states, no refresh loops that lose context, no empty dashboards pretending to be active systems." The `PRODUCT-GAP-LEDGER` (2026-04-09) captured the live evidence this pass eliminates — warmup copy on the first response of every public division home:

- Fabric Care public: "Preparing the public Care experience"
- Learn public: "Loading your learning experience"
- Logistics public: "Loading logistics" + "Preparing shipping, tracking, and delivery services"
- Studio public: "Loading Henry Onyx Studio" + "Preparing your creative workspace"
- Marketplace public: "Loading marketplace" + "Preparing products, stores, and your personalized experience"
- Property public: a visible loading surface on first response

PERF-01 (memory `project_henryco_perf01_loading.md`) already established the canonical `PublicRouteLoader` for `loading.tsx` and a W3C-gated smooth-scroll block in `globals.css`. This pass builds directly on that: PERF-01 owns the route-segment loader; V3-05 owns removing the *in-content* theater copy and shipping the shared `StructuredSkeleton` primitive that replaces every spinner-with-copy. The shipped inventory lives at `docs/v3/loading-theater-inventory.md` (plus `docs/v3/loading-theater-property-account-care-inventory.md` for the account/care/property slice). The gap this pass closed: a user's first paint of any public division now renders real catalog/hero content or a layout-true skeleton — never a sentence pretending the system is "warming up."

## Mandatory scope

### S1 — Inventory every warmup-copy string (SHIPPED)
`scripts/v3/loading-theater-inventory.mjs` walks all 10 web apps + the shared packages and flags the warmup-copy patterns: `Loading <noun>`, `Preparing <noun>`, `Warming up`, `Just a moment`, `One moment please`, `Getting things ready`, `Working on it` (when not bound to real progress). Each hit is classified:
- **Class A** — covers a genuine in-flight fetch → replace with a `StructuredSkeleton` (no natural-language copy).
- **Class B** — decorative first-render before SSR has data → REMOVE; render real content on first paint.
- **Class C** — an error/empty state mis-coded as loading → FIX the state distinction (S4).

The catalog is persisted at `docs/v3/loading-theater-inventory.md` with per-`file:line` entries. Re-run the script before closing any residual work; the count must stay at zero Class-B in non-test code.

### S2 — Real first-paint content on the named PRODUCT-GAP-LEDGER surfaces (SHIPPED)
For each of the six named surfaces below, the SSR/CSR boundary that emitted the warmup copy was rewritten to render real content from the existing server query on first paint:
- **Fabric Care public** — Care home SSR returns hero + service list directly; warmup string removed.
- **Learn public** — Learn home SSR returns the course catalog.
- **Logistics public** — SSR uses the real logistics backend shipped in the V3 PASS 21 division rebuild.
- **Studio public** — SSR uses the real studio templates from the V3 PASS 21 studio rebuild (note: the brand label is **Henry Onyx Studio**, resolved from `@henryco/config`, never a hardcoded "HenryCo Studio" string).
- **Marketplace public** — product list SSRs.
- **Property public** — listings SSR.

Where a genuinely slow query remains, the surface uses a `StructuredSkeleton` from S3 — not warmup copy. Deliverable per surface: a diff showing the warmup copy gone and real content (or a layout-true skeleton) on first paint.

### S3 — Shared `StructuredSkeleton` primitive (SHIPPED)
`packages/ui/src/loading/structured-skeleton.tsx` ships `StructuredSkeleton` with variants `card-list`, `form`, `kpi-tile`, and `detail` (exported from `packages/ui/src/loading/index.ts`). The skeleton mirrors the layout the real data fills (rectangles for text, circles for media), animates subtly, supports `tone="onDark" | "onLight"`, and after a threshold (~3s) transitions to a "Still loading — this is unusual" message plus retry. Every prior spinner-with-copy usage was replaced with the appropriate variant. Do **not** fork this primitive; extend it if a new variant is genuinely needed.

### S4 — Four-state distinction: loading / empty-yet / empty-no-match / error (SHIPPED)
Every list view across the 10 apps renders four visually distinct states:
- **Loading** — a fetch is in-flight → `StructuredSkeleton`.
- **Empty (you have nothing yet)** — fetch succeeded, zero rows because the user has done nothing → "Nothing here yet" + first-item CTA.
- **Empty (no match)** — fetch succeeded, zero rows for valid filters → "No matches for your filters" + reset-filters CTA.
- **Error** — fetch failed → "Something went wrong — try again" + retry.

This contract carries forward into V3-08 (empty dashboard truth).

### S5 — No first-paint copy disguised as loading (SHIPPED)
Every `app/page.tsx` / `app/(public)/page.tsx` was audited for first-paint placeholder text. Where SSR can provide real content it does; where it genuinely cannot (highly personalized or stale-while-revalidate), a `StructuredSkeleton` is used — never a natural-language placeholder.

### S6 — Suspense boundaries with named fallbacks (SHIPPED)
Every `<Suspense>` boundary uses an explicit `StructuredSkeleton` fallback. No `fallback={<div>Loading…</div>}` remains in shipped code.

### S7 — Telemetry (SHIPPED)
Skeleton events emit via `@henryco/observability`, named per the `henry.<domain>.<noun>.<verb>` convention:
- `henry.ui.skeleton.shown` — `{ surface, variant, durationMs }`
- `henry.ui.skeleton.exceeded_threshold` — `{ surface, durationMs, query }`

These feed the owner-workspace "slow surface" radar tile. The static threshold/variant for a single skeleton mount is computed once at mount (no per-render churn).

## Out of scope
- New loading animations beyond the shipped `StructuredSkeleton` variants.
- Per-route SSR speed optimization, page-weight reduction, and performance-budget enforcement on PR — **V3-89** (observability-traces-slos-budgets).
- Empty-state design for *dashboard KPI tiles* (loading-vs-no-data-yet-vs-nothing distinction on tiles) — **V3-08** (empty-dashboard-truth) consumes the S4 contract.
- Operator/staff-surface warmup copy translation completeness — **V3-07b** (operator-surface-i18n).

## Dependencies
- **Deps:** none (Phase B wave-1 parallel pass).
- **Blocks:** V3-06 (dead-link sweep) — the live walk needs stable, real first-paint HTML to extract `href`s from. V3-08 (empty-dashboard-truth) — inherits the four-state contract. V3-94 (closure integration test) — re-walks every surface for residual theater.

## Inheritance
- `@henryco/ui` loading primitives (`packages/ui/src/loading/`) — `StructuredSkeleton` added here, alongside the existing `HenryCoActivityIndicator`, `HenryCoBrandedSpinner`, `ButtonPendingContent`, `FormPendingButton`.
- PERF-01 canonical `PublicRouteLoader` for `loading.tsx` and the W3C-gated smooth-scroll block in `globals.css` — preserved, not modified.
- `@henryco/observability` — telemetry sink.
- `@henryco/config` — division brand labels (Henry Onyx Studio etc.) resolved from `COMPANY`, never hardcoded.

## Implementation requirements

### Files
- `packages/ui/src/loading/structured-skeleton.tsx` (shipped — variants + tone + threshold) and the `index.ts` re-export.
- `scripts/v3/loading-theater-inventory.mjs` (shipped — the S1 scanner).
- `docs/v3/loading-theater-inventory.md` + `docs/v3/loading-theater-property-account-care-inventory.md` (shipped — the catalogs).
- Per-app first-paint fixes for the six S2 surfaces.
- `<Suspense>` fallback replacements across all apps (S6).
- Owner-workspace slow-surface tile fed by the S7 telemetry.
- **No migrations. No RLS changes. No env changes.**

### Trust / safety / compliance
- Removing copy must not regress accessibility: skeleton/loading transitions announce via ARIA live regions where a screen reader previously relied on the copy.
- ANTI-CLONE posture: real first-render content is fine to expose — we hide formulas and pricing logic, not the public catalog. Honest skeletons reveal less about scale than fake-bustling theater.
- Payment surfaces (`@henryco/payment-surface`) are behaviour-locked: a skeleton swap on a payment screen is style-only and must not alter any money state or status transition.

### Mobile + desktop parity
- Skeletons are responsive across viewports; mobile may render a single-column variant of `card-list`. Web mobile + desktop both verified. Expo super-app: the same `StructuredSkeleton` contract applies to shared screens; native-only screens are out of scope here (parity tracked in V3-87).

### i18n
- The only user-facing strings this pass introduces are the skeleton-threshold and error-recovery messages ("Still loading — this is unusual", "Try again", the four empty/error state lines). All route through `@henryco/i18n` under `surface:loading` (and the relevant per-list `surface:<area>` namespace for empty/error copy). No hardcoded text. 12 locales; Pattern B runtime DeepL fills non-en-US.

### Brand & design system
- Division labels in any rewritten copy (e.g. "Henry Onyx Studio") come from `@henryco/config` (`COMPANY.divisions[...].name`), never hardcoded. Stale "Henry & Co." / "HenryCo Studio" user-facing strings must not appear.
- Skeletons use locked design-system tokens (`--site-*` / `--accent`, per-division accent from `company.ts`) — no ad-hoc hex. Light + dark, mobile + desktop, CLS ≈ 0, contrast not regressed (`pnpm a11y:contrast`).

## Validation gates
1. **CI** — typecheck + lint + test + build green across the monorepo.
2. **Static evidence** — `scripts/v3/loading-theater-inventory.mjs` returns ZERO Class-B warmup-copy matches in non-test code; `grep -rE "Loading the|Preparing the|Warming up|Just a moment" apps/ packages/` returns no user-facing hits.
3. **Live evidence** — the production HTML of each of the six named surfaces does NOT contain its warmup string (e.g. the Care home response no longer contains "Preparing the public Care experience"). Fetch via `henryDomain('care')` etc.; no hardcoded domain in the check.
4. **State-distinction smoke** — for a representative list: no data, bad query, and network-offline each render a distinct one of the four S4 states.
5. **Skeleton-threshold smoke** — a simulated slow query shows the skeleton, then transitions to "Still loading" + retry after ~3s, emitting `henry.ui.skeleton.exceeded_threshold`.
6. **UI gates** — light + dark, mobile + desktop, CLS ≈ 0, `pnpm a11y:contrast` clean on every touched surface.

## Deployment gate
- All validation gates green; the six named surfaces verified clean on production; CI loading-theater scan wired so new warmup copy fails the build. Behaviour-only pass on live public traffic → a short soak with the slow-surface telemetry watched for regressions before declaring closed.

## Final report contract
`.codex-temp/v3-05-kill-loading-theater/report.md` with the standard 9 sections (exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification · telemetry baseline · deferred items · pass-closure assertion), plus the full loading-theater inventory and before/after captures of the six named surfaces.

## Self-verification
- [ ] S1 inventory regenerated; every warmup-copy hit classified; zero Class-B in non-test code.
- [ ] S2 — all six PRODUCT-GAP-LEDGER surfaces render real content (or a layout-true skeleton) on first paint on production.
- [ ] S3 — `StructuredSkeleton` (card-list / form / kpi-tile / detail, onDark/onLight) shipped from `@henryco/ui`; spinner-with-copy usages replaced.
- [ ] S4 — loading / empty-yet / empty-no-match / error render as four distinct states on every list view.
- [ ] S5 — no first-paint natural-language placeholder remains on any `page.tsx`.
- [ ] S6 — no `<Suspense fallback>` is warmup copy.
- [ ] S7 — `henry.ui.skeleton.shown` + `henry.ui.skeleton.exceeded_threshold` emitting; slow-surface tile rendering.
- [ ] Brand: any division label resolved from `@henryco/config` (Henry Onyx); zero "Henry & Co."/"HenryCo Studio" user-facing strings.
- [ ] i18n: threshold/empty/error copy under `surface:loading` / `surface:<area>`; zero hardcoded user-facing strings; zero hardcoded domains in checks.
- [ ] Report written. Hand-off named: V3-06 (dead-link sweep).
