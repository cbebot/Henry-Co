# V3-52 — Product Expansion: Marketplace Discovery + Ranking at Scale

**Pass ID:** V3-52  ·  **Phase:** G (Product Expansion)  ·  **Pillar:** P1 (Product Expansion), P3 (Personalisation)
**Dependencies:** V3-12 (Foundation Lock acceptance — CERTIFIED, PR #168)  ·  **Effort:** XL (4+ weeks across 5 sub-PRs)  ·  **Parallel-safe:** Y (with other Phase G passes after V3-12)
**Owner gate:** none  ·  **Risk class:** —

---

## Role

You are the V3 Marketplace Discovery engineer for Henry Onyx. You execute exactly this one pass — split into **5 sub-PRs** — then stop and report. This pass makes Henry Onyx Marketplace findable at scale: a density-aware grid that replaces the big-card-only browse, a server-side merit-weighted ranking with a diversity guard so no single seller dominates, anonymous + signed-in re-rank, staff editorial curation, and discovery telemetry with a staff analytics surface. The owner's framing (V5-5): *"when the marketplace grows wide are those long big cards still needed? When thousands of goods are there it will not be easy for users to find their choice. The system should know or guess what user might need intelligently — not randomly shuffle like a fool. The higher the trust the luckier to show users."* The line it must not cross: the **ranking formula is a data moat** — it lives server-only and is never client-exposed or fully derivable from the API (ANTI-CLONE Principle 1); the **diversity guard is non-negotiable** — trust-weighting must never produce a winner-takes-all homepage; and this pass ships **marketplace discovery only** — Property and Jobs ranking mirror this pattern in their own later passes.

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/52-product-marketplace-discovery-and-ranking` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary

The marketplace is not greenfield. `apps/marketplace/supabase/migrations/20260402180000_marketplace_init.sql` ships `marketplace_products` and `marketplace_vendors` — the latter carrying the exact trust signals this pass ranks on: `verification_level`, `trust_score numeric(5,2)`, `fulfillment_rate`, `dispute_rate`, `review_score`, `followers_count`, `response_sla_hours`, `badges[]`, `status`. `marketplace_recommendation_signals` (PASS-21) already persists normalised `[0,1]` directional signals (`co_purchase`, `co_view`, `frequently_bought_together`, `similar_category`, `similar_attributes`, `trending_in_region`), recomputed nightly by the `marketplace-automation` cron from `marketplace_behavior_events` + `marketplace_order_items`. `marketplace_deals_curation` (slots `today`/`feature`/`rotation`, staff-curated with an algorithmic fallback) is the proven editorial-override pattern this pass extends to category pinning. The browse UI today is `apps/marketplace/components/marketplace/product-card-client.tsx` (one big-card shape) + `search-experience.tsx` + `recommendation-rail.tsx`, rendered through the shared `@henryco/search-core` rail (collections in `packages/search-core/src/collections.ts`, ranking in `ranking.ts`, per-IP rate limit in `rate-limit.ts`). The gaps: (1) one card density only — big cards don't scale to thousands of SKUs; (2) ranking is search-relevance-only, not merit-weighted by seller trust + freshness + conversion + stock; (3) no diversity guard, so a high-trust seller could dominate; (4) no cold-start boost for new listings; (5) no personalisation re-rank; (6) staff can curate deals but not pin a listing to a category top; (7) discovery telemetry + a ranking-health dashboard don't exist. This pass closes all seven across 5 sub-PRs.

> **Note on V3-34:** density persistence ideally lives in `user_home_layouts` (V3-34 Personalization Home). If V3-34 has not yet merged when this pass runs, persist density in a minimal `marketplace_user_prefs` row (or signed cookie for anonymous) and **migrate the read to `user_home_layouts` when V3-34 lands** — do not block on it, and do not fork a competing layout-prefs system that V3-34 would have to reconcile.

## Mandatory scope (5 sub-PRs)

### Sub-PR A — Compact card variant + density toggle + responsive grid

- Add a **compact** card variant beside the existing card in `product-card-client.tsx` (image + title + price + trust badge; no long body) plus a **comfortable** and **spacious** variant.
- User-toggleable density (`compact` / `comfortable` / `spacious`), persisted per the V3-34 note above (`user_home_layouts` when available, else `marketplace_user_prefs` / signed cookie). Default = `comfortable`.
- Responsive grid: 1-col mobile / 2-col tablet / 3–4-col desktop with correct breakpoints; safe-area aware (V3-09); CLS ≈ 0 (reserve image aspect-ratio boxes so density switching doesn't reflow-jank).
- A11y: density toggle is a labelled control; cards are keyboard-navigable; contrast clean (`pnpm a11y:contrast`).

### Sub-PR B — Merit-weighted ranking + diversity guard + cold-start logic

- Server-side ranking formula in a new submodule `packages/search-core/src/marketplace-ranking.ts` (server-only). Inputs: seller `trust_score` / `verification_level` (from `marketplace_vendors`), listing freshness (`created_at`), conversion rate, in-stock signal (`marketplace_inventory_movements`), and the `marketplace_recommendation_signals` score.
- The **formula is proprietary** (ANTI-CLONE Principle 1) — it lives server-only, is never serialised to a client response, and the client receives only the ordered result list + a coarse reason code (never the score components or weights).
- **Diversity guard:** enforce a category/seller mix so a single seller's listings cannot occupy more than a configured share of the first N positions, even when they rank highest. This is a hard cap, not a tie-breaker — the homepage is never winner-takes-all. The cap is config-driven (`@henryco/config`), not hardcoded.
- **Cold-start:** brand-new listings (and new verified sellers) get a bounded, time-decaying boost so they gather signal; the boost expires automatically and is logged (`henry.marketplace.discovery.cold_start_boost`).
- Ranking is **A/B-testable** via the V3-91 framework (gated — for this pass, ship a single deterministic, versioned formula; expose only `ranking_formula_version` so a future A/B holdout can compare).

### Sub-PR C — Personalisation re-rank (anonymous + signed-in)

- **Anonymous re-rank** from session signals (recently viewed, current search terms) held in a signed, short-lived cookie — no account, no PII persisted.
- **Signed-in re-rank** with cross-division signals: a user who booked Care or completed a Learn course gets contextually relevant marketplace items surfaced, using the V3-34 personalization context (graceful no-op if V3-34 hasn't merged — fall back to the deterministic Sub-PR B order).
- The re-rank is a **post-pass over the Sub-PR B order**, server-side; it never overrides the diversity guard.
- Optional V3-26 AI call for **explainable reason codes only** ("because you viewed X", "popular with verified sellers near you") — the AI never computes the ranking math, only narrates the why; gated behind V3-26 availability with a deterministic reason-code fallback.

### Sub-PR D — Editorial overlays + staff curation UI

- Staff-only UI (under `apps/marketplace/app/operations/` or `moderation/`, matching the existing staff workspace pattern) to **pin a listing to the top of a category**, extending the proven `marketplace_deals_curation` slot model to category pinning (new table `marketplace_category_curation` keyed on `(category_slug, product_id, slot, window)` with the same staff-write / public-read-active RLS).
- Editorial badges: "Editor's pick", "New from verified seller" — copy from `@henryco/i18n`, never hardcoded.
- **Curation overrides ranking but never breaks the diversity guard** — a curated pin is injected into the result, then the diversity guard runs over the combined list. Pins are audited (`@henryco/observability/audit-log`).

### Sub-PR E — Discovery telemetry + staff ranking-health dashboard

- Events added to the `HenryEventName` union in `packages/observability/src/events.ts` (an unmapped event is a compile error), emitted server-side:
  ```
  henry.marketplace.search.executed
  henry.marketplace.listing.impressed
  henry.marketplace.listing.clicked
  henry.marketplace.discovery.cold_start_boost
  ```
  No PII — product slug, category, `ranking_formula_version`, position, division only.
- Staff dashboard (a `dashboard-modules-marketplace` module, owner/staff-scoped): search analytics (top queries, zero-result queries), live `ranking_formula_version`, diversity-guard activations, cold-start boosts in flight, top under-performing categories (high impression / low click). A future V3-91 A/B holdout result panel is stubbed.

## Out of scope

- Property listing ranking (mirrors this pattern) — its own later Property pass (per V3-53 family).
- Jobs ranking (similar pattern) — its own later Jobs pass.
- The personalization-home layout engine + `user_home_layouts` schema — **V3-34** (this pass consumes it, with a fallback).
- The A/B testing framework itself — **V3-91** (this pass only versions the formula and stubs the holdout panel).
- The AI provider router + usage billing for the reason-code narration — **V3-26 / V3-27** (this pass calls it optionally, with a deterministic fallback).
- The recommendation-signal computation cron — already shipped (`marketplace-automation`); this pass *consumes* `marketplace_recommendation_signals`, it does not rebuild the signal pipeline.

## Dependencies

- **Requires:** V3-12 (Foundation Lock acceptance — CERTIFIED).
- **Soft-uses (with fallback):** V3-34 (`user_home_layouts` for density + personalization context), V3-26 (reason-code narration), V3-91 (A/B holdout).
- **Blocks:** the Property and Jobs discovery passes (they reuse `marketplace-ranking.ts`'s pattern), V3-63 (local discovery layers geo on top of this ranking).

## Inheritance

- `marketplace_products`, `marketplace_vendors` (trust signal columns), `marketplace_recommendation_signals` (normalised signals), `marketplace_deals_curation` (the curation/override pattern), `marketplace_inventory_movements` (in-stock signal).
- `apps/marketplace/components/marketplace/` — `product-card-client.tsx`, `search-experience.tsx`, `recommendation-rail.tsx`.
- `@henryco/search-core` — `collections.ts`, `ranking.ts`, `rate-limit.ts`, `query.ts`; this pass adds `marketplace-ranking.ts` beside them.
- `@henryco/config` (diversity-guard caps, cold-start bounds — config-driven, not hardcoded), `@henryco/i18n`, `@henryco/observability` (telemetry + audit), `dashboard-modules-marketplace` (the staff dashboard module).

## Implementation requirements

### Files

`product-card-client.tsx` + new compact/comfortable/spacious variants + density toggle (Sub-PR A); `packages/search-core/src/marketplace-ranking.ts` (server-only) + diversity-guard + cold-start (Sub-PR B); the anonymous/signed-in re-rank pass + optional V3-26 reason-code call (Sub-PR C); `marketplace_category_curation` migration + staff curation UI (Sub-PR D); the four events in `packages/observability/src/events.ts` + the staff ranking-health dashboard module (Sub-PR E); `docs/v3/marketplace-discovery-architecture.md` (the ranking-inputs map + diversity-guard policy + formula-secrecy posture). If V3-34 hasn't merged: a minimal `marketplace_user_prefs` migration (to be reconciled into `user_home_layouts` later).

### Trust / safety / compliance

ANTI-CLONE Principle 1 — the ranking formula and weights are server-only, never in any client response or bundle; the client gets ordered results + coarse reason codes only. Principle 2 — discovery results behind the existing public product RLS (draft/retired products never surface). Principle 9 — per-IP rate limit on search (reuse `search-core/rate-limit.ts`, do not weaken it) so the catalog can't be scraped wholesale. The **diversity guard prevents trust-based ranking from creating a winner-takes-all homepage** — this is a correctness requirement with an explicit test. Staff curation pins are audited. No PII in telemetry. Anonymous personalisation uses a signed short-lived cookie, never a persisted profile.

### Mobile + desktop parity

The density toggle and responsive grid are mobile-first (1-col phone, larger touch targets per `docs/v3/mobile-touch-target-violations.md`, safe-area aware). The Expo super-app marketplace browse consumes the same ranked result endpoint — no native ranking fork; the compact variant is the native default. CLS ≈ 0 across density switches on both web and native.

### i18n

All copy through `@henryco/i18n`. New typed-copy namespace **`surface:discovery`** for density-toggle labels (compact/comfortable/spacious), editorial badge copy ("Editor's pick", "New from verified seller"), reason-code strings ("because you viewed…", "popular near you"), empty/zero-result-search copy, and staff-dashboard labels. Product/category names render through `resolveLocalizedDynamicField` (Pattern B, 12 locales). Zero hardcoded user-facing strings; the hardcoded-text CI gate stays green.

### Brand & design system

Division label is **"Henry Onyx Marketplace"**, platform brand **"Henry Onyx"** — both read from `@henryco/config` (`getDivisionConfig('marketplace').name`, `COMPANY.group.name`), never hardcoded; "Henry & Co." must not appear (note: the legacy `marketplace_deals_curation` migration comment contains a stale "Henry & Co." reference — do not propagate it into any new copy). Fraunces display where editorial + locked `--site-*`/`--accent` tokens (Marketplace accent from `company.ts`); light + dark, mobile + desktop, CLS ≈ 0, `pnpm a11y:contrast` not regressed. Every URL via `@henryco/config` helpers — no `henrycogroup.com` literal in the diff.

## Validation gates

1. Standard CI: typecheck, lint, test, build (`Lint, typecheck, test, build`).
2. **Density toggle**: switches compact/comfortable/spacious, persists across reload, defaults to comfortable; no CLS jank on switch (real-browser, mobile + desktop, light + dark).
3. **Ranking** unit suite (~10 cases): merit formula ordering by trust + freshness + conversion + stock; assert the formula/weights appear in **no** client response payload.
4. **Diversity guard** test (explicit): a single high-trust seller with the top 20 listings cannot occupy more than the configured share of the first N positions — proves no winner-takes-all.
5. **Cold-start**: a brand-new listing receives a bounded, decaying boost that expires; the boost is logged.
6. **Personalisation re-rank**: anonymous (session-cookie) and signed-in (V3-34 context, with deterministic fallback) re-order results without violating the diversity guard.
7. **Curation**: staff pin lifts a listing to category top, is audited, and the diversity guard still holds over the combined list.
8. **Telemetry**: four events in the union, emitted server-side, no PII; staff ranking-health dashboard renders with live `ranking_formula_version`.
9. **RLS + rate limit**: only active products surface; search is per-IP rate-limited; staff curation write is staff-only.
10. **i18n + brand gates green**; `surface:discovery` namespace; no hardcoded string; no `henrycogroup.com` literal.

## Deployment gate

All gates green; the only required check (`Lint, typecheck, test, build`) passing; branch `v3/52-product-marketplace-discovery-and-ranking` off `origin/main` → PR → squash-merge (no force-push, no branch-protection bypass). Owner reviews `docs/v3/marketplace-discovery-architecture.md` and the diversity-guard + formula-secrecy posture. Each sub-PR ships and soaks independently where feasible. **14-day soak** on the live discovery surface (ranked grid + telemetry) confirming the diversity guard activates as designed, cold-start boosts expire, and no scrape/abuse before the Property and Jobs discovery passes reuse the pattern.

## Final report contract

`.codex-temp/v3-52-product-marketplace-discovery-and-ranking/report.md` with the standard 9 sections (exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification · telemetry baseline · deferred items · pass-closure assertion) + the ranking-inputs map, the diversity-guard policy, and the formula-secrecy assertion.

## Self-verification

- [ ] All 5 sub-PRs shipped.
- [ ] Compact/comfortable/spacious card variants + density toggle; persisted (V3-34 `user_home_layouts` or fallback, reconcilable); responsive grid; CLS ≈ 0.
- [ ] Server-only merit-weighted ranking in `marketplace-ranking.ts`; formula never client-exposed; cold-start boost bounded + decaying.
- [ ] Diversity guard is a hard cap with an explicit no-winner-takes-all test; config-driven, not hardcoded.
- [ ] Personalisation re-rank (anonymous session-cookie + signed-in V3-34) never violates the diversity guard; optional V3-26 reason codes with deterministic fallback.
- [ ] Staff category curation UI; pins audited; diversity guard holds over curated+ranked list.
- [ ] Four `henry.marketplace.*` discovery events in the union, server-side, no PII; staff ranking-health dashboard.
- [ ] `surface:discovery` i18n namespace; brand from `@henryco/config` ("Henry Onyx Marketplace" / "Henry Onyx"); no "Henry & Co."; no hardcoded domain; search rate limit intact.
- [ ] Report written. Hand-off: Property + Jobs discovery passes, V3-63 (local discovery).
