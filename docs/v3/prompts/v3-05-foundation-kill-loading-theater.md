# V3-05 — Foundation: Kill the Loading Theater

**Pass ID:** V3-05
**Phase:** B (FOUNDATION LOCK)
**Pillar:** P12 (Global)
**Dependencies:** Phase A audit
**Effort:** M (1–2 weeks)
**Parallel-safe:** YES (with V3-01, V3-03, V3-07, V3-09, V3-10)
**Owner gate:** None
**Risk class:** None

---

## Role

You are the V3 Foundation engineer for HenryCo. You execute exactly this one pass, then stop and report.

This pass kills every "Loading X" + "Preparing X" + "Warming up" placeholder copy that fakes activity. The owner has named this anti-pattern verbatim: "no fake loading states". Replace with plain-state, low-drama status language OR genuine progress indicators tied to real fetches.

---

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/05-kill-loading-theater` |
| Deploy | Vercel (10 web projects) |
| OS context | Windows + bash; pnpm 9.15.5; Node 24.x |

---

## Audit summary (lifted from AUDIT-BASELINE.md §3.5 + §3.8 + PRODUCT-GAP-LEDGER)

> ### 3.5 Live data (vs fake loading / empty dashboards)
> - **PRODUCT-GAP-LEDGER 2026-04-09 evidence (likely still partially true):**
>   - Care live HTML: "Preparing the public Care experience"
>   - Learn live HTML: "Loading your learning experience"
>   - Logistics live HTML: "Loading logistics" + "Preparing shipping..."
>   - Studio live HTML: "Loading HenryCo Studio" + "Preparing your creative workspace"
>   - Marketplace live HTML: "Loading marketplace" + "Preparing products..."
>   - Property live HTML: visible loading surface on first response

> ### 3.8 Fake loading / fake state
> - **Documented (PRODUCT-GAP-LEDGER):** "Loading X" first-render placeholders on 6+ public surfaces
> - **Solid:** PERF-01 canonical PublicRouteLoader for `loading.tsx` per memory `project_henryco_perf01_loading.md`

PERF-01 (memory `project_henryco_perf01_loading.md`) established a canonical `PublicRouteLoader` for `loading.tsx` files and a W3C-gated smooth-scroll block in `globals.css`. This pass extends PERF-01 by replacing all remaining warmup/preparing copy.

Owner anti-pattern: "no fake loading states, no refresh loops that lose context, no empty dashboards pretending to be active systems".

---

## Mandatory scope

### S1 — Inventory every "Loading X" / "Preparing X" string

Grep across all 10 web apps + 33 packages for these patterns:
- `"Loading"` (followed by any noun)
- `"Preparing"` (followed by any noun)
- `"Warming up"`
- `"Just a moment"`
- `"One moment please"`
- `"Getting things ready"`
- `"Working on it"` (when not tied to real progress)

For each match, classify:
- **Class A** — covers an actual loading state (acceptable; replace with plain "Loading" or division-neutral status)
- **Class B** — covers a fake/decorative first-render before SSR has data (REMOVE; the page should render real content immediately or a structured skeleton, not theater copy)
- **Class C** — covers an error or empty state miscoded as loading (FIX the state distinction)

Persist the inventory at `docs/v3/loading-theater-inventory.md` with per-file:line entries.

### S2 — Replace per PRODUCT-GAP-LEDGER's named surfaces

For each of these surfaces, audit the first-render HTML and rewrite:

**Care public** — "Preparing the public Care experience"
- Find the SSR/CSR boundary that emits this.
- Replace with real first-render content from the SSR query (the Care home query already returns hero + service list).
- If true loading state is needed (slow query), use a structured skeleton — not warmup copy.

**Learn public** — "Loading your learning experience"
- Same audit + rewrite. Learn home should SSR the course catalog directly.

**Logistics public** — "Loading logistics" + "Preparing shipping, tracking, and delivery services"
- Same audit + rewrite. Logistics V3 PASS 21 already shipped real backend; verify SSR uses it.

**Studio public** — "Loading HenryCo Studio" + "Preparing your creative workspace"
- Same audit + rewrite. V3 PASS 21 studio rebuild shipped real templates; verify SSR uses them.

**Marketplace public** — "Loading marketplace" + "Preparing products, stores, and your personalized experience"
- Same audit + rewrite. Marketplace product list should SSR.

**Property public** — visible loading surface on first response
- Same audit + rewrite. Property listings should SSR.

For each, the deliverable is a PR-diff showing the warmup copy gone + real content rendering on first paint.

### S3 — Structured skeleton standard

For unavoidable loading states (long queries, large lists), use a structured skeleton — not a spinner-with-copy. The skeleton:
- Mirrors the layout the real data will fill (rectangles where text goes, circles where images go).
- Animates subtly (existing `@henryco/ui/loading` primitives — `loading/`).
- Stays for max 3 seconds; after that, switch to "Still loading — this is unusual" + retry button.

Implementation:
- Extend `@henryco/ui/loading` with `<StructuredSkeleton variant="card-list" />`, `<StructuredSkeleton variant="form" />`, `<StructuredSkeleton variant="detail" />` primitives.
- Replace existing spinner-with-copy usage.

### S4 — Distinguish "loading" from "empty" from "error"

Many surfaces conflate these states. Audit each:

- **Loading** — a fetch is in-flight; structured skeleton or progressive content rendering.
- **Empty (you have nothing yet)** — the fetch succeeded with zero results; show "Nothing here yet" + CTA to add the first item.
- **Empty (we have nothing for you)** — the fetch succeeded with zero matching results; show "No matches for your filters" + reset filters CTA.
- **Error** — the fetch failed; show "Something went wrong — try again" + retry button.

For every list view across all 10 apps, ensure these 4 states are distinguishable.

### S5 — No "first-paint copy" disguised as loading

Some apps render a hero with "Loading..." text on first paint, then swap in real content. This breaks the trust bar.

Implementation:
- Audit every `app/page.tsx` and `app/(public)/page.tsx` for first-paint placeholder text.
- Where SSR can provide real content, use it.
- Where SSR cannot (highly personalized or stale-while-revalidate), use the structured skeleton from S3 — never natural-language placeholders.

### S6 — Suspense boundaries with named fallbacks

Every `<Suspense>` boundary has an explicit fallback that's NOT warmup copy. Replace any `fallback={<div>Loading...</div>}` with a structured skeleton from S3.

### S7 — Telemetry

Events:
- `henry.ui.skeleton.shown` (surface, variant, duration)
- `henry.ui.skeleton.exceeded_threshold` (surface, duration, query)

This builds the "slow surface" radar for the owner-workspace tile.

---

## Out of scope

- Adding new loading animations (use existing).
- Performance-budget enforcement (V3-89).
- Per-route SSR optimization beyond removing theater copy (V3-89 handles deeper perf).
- Page weight reduction (V3-89).

---

## Dependencies

- Phase A audit complete.

Blocks:
- V3-06 (dead-link sweep) — fast follow once content rendering is correct.
- V3-08 (empty dashboard truth) — state distinction (S4) carries forward.

---

## Inheritance

- `@henryco/ui/loading` — extend.
- PERF-01 canonical `PublicRouteLoader` from memory — preserve.
- W3C-gated smooth-scroll block in globals.css — preserve.

---

## Implementation requirements

### Files

- `packages/ui/src/loading/structured-skeleton.tsx` (new — variants per S3)
- `docs/v3/loading-theater-inventory.md` (new — the catalog from S1)
- Per-app fixes for the 7+ surfaces in S2
- Audit + fix every `<Suspense>` fallback per S6
- `apps/hub/app/owner/(command)/dashboard/slow-surface-tile.tsx` (new — per S7 telemetry)

### No migrations.

### No integration changes.

### Telemetry events wired in `@henryco/observability`.

---

## Trust / safety / compliance

- Removing copy never breaks accessibility (verify screen-reader announcements use ARIA live regions where needed).
- ANTI-CLONE: real first-render content is fine; we don't need to hide our content from competitors. Hide formulas, not catalog.

## Mobile + desktop parity

- Skeletons responsive across viewports.
- Mobile may have a different skeleton variant (single-column).

## i18n

- Skeleton-related strings ("Still loading — this is unusual", "Try again") via `@henryco/i18n`.

---

## Validation gates

1. Standard CI.
2. **Static evidence:** `grep -r "Loading the\|Preparing the\|Warming up\|Just a moment" apps/ packages/` returns ZERO matches (in non-test code) after the pass.
3. **Live evidence:** `curl https://care.henrycogroup.com/` HTML response does NOT contain "Preparing the public Care experience" or equivalent. Repeat for the other 6 named surfaces.
4. State-distinction smoke: visit a list with no data + with bad query + with network offline — verify 4 distinct states render appropriately.
5. Skeleton-threshold smoke: simulate a slow query; verify skeleton transitions to "Still loading" message after 3s.

## Deployment gate

- All gates pass.
- 7 named surfaces verified clean on production.
- 48-hour soak.

## Final report contract

`.codex-temp/v3-05-kill-loading-theater/report.md` with the standard 9 sections + the full loading-theater inventory + before/after screenshots of the 7 named surfaces.

---

## Self-verification

- [ ] Inventory complete; every warmup copy classified.
- [ ] 7 named PRODUCT-GAP-LEDGER surfaces clean on live.
- [ ] Structured skeleton primitives shipped.
- [ ] 4-state distinction (loading/empty-yet/empty-no-match/error) consistent.
- [ ] No `<Suspense>` fallback is warmup copy.
- [ ] Telemetry events emitting.
- [ ] Owner-workspace slow-surface tile rendering.
- [ ] Report written. Hand-off named: V3-06 (dead-link sweep).
