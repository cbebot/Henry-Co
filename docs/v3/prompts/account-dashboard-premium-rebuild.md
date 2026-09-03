# ACCOUNT-PREMIUM-01 — Customer Surface: Account Dashboard Inner-Page Premium Rebuild

> **STATUS: IN PROGRESS — legacy pre-numbered pass; foundation already landed, page-by-page rebuild arc remains.** The Phase-1 audit (`docs/v3/account-inner-page-audit-2026-05-23.md`), the shared interaction grammar (`docs/v3/account-design-language.md`), and the six surface primitives in `packages/dashboard-shell/src/surfaces/` (`HeroCard`, `NextStepRow`, `MetricStrip`, `TimelineCard`, `EmptyStateCard`, `DivisionLanding`) are SHIPPED. This prompt is the elevated canonical spec for the remaining arc: rebuild each account inner page onto those primitives, one curated slice per session, to a flagship bar. Do not re-author the audit or re-invent the primitives — consume them.

**Pass ID:** ACCOUNT-PREMIUM-01  ·  **Phase:** B-adjacent (Foundation polish / customer-surface rebuild)  ·  **Pillar:** P3 (Personalization) + P12 (Global UX)
**Dependencies:** V3-05 (StructuredSkeleton + ListStates), V3-09 (mobile primitives + safe-area), V3-10 (error boundaries + canonical `surface:error` i18n), V3-07 (i18n strict gate), V3-IDENTITY-01 (#188, brand truth = Henry Onyx)  ·  **Effort:** XL (multi-session arc; one curated page-slice per session)  ·  **Parallel-safe:** Y (no overlap with active V3 surface owners; one agent per page-slice)
**Owner gate:** Visual sign-off after EACH session — this is a quality bar, not a velocity sprint  ·  **Risk class:** —

---

## Role

You are the V3 Customer Surface engineer for Henry Onyx. You execute exactly one curated page-slice of this rebuild arc, then stop and report. Each account inner page must, above the fold, answer "what's happening with my stuff?" and "what should I do next?" with the user's REAL data and a real next action — rebuilt onto the six shared `@henryco/dashboard-shell` surface primitives, never a bespoke per-page hero. The line you must not cross: no hardcoded mock data, no placeholder card grids, no hardcoded user-facing copy, no decorative-only modules that pretend to be real. The customer account dashboard is the face of Henry Onyx to every paying customer; every detail compounds.

The owner directive, paraphrased: "Audit, read, understand how all the customer account dashboard inner pages work — the large hero cards, everything. Everything looks and feels real and standardised, no shallow work or hardcoding objects. From scratch, well-engineered. Ask yourself: 'if I were the user, how best do I expect it to be for maximum satisfaction and the most premium expensive feel?' Thunderous, wonderful, efficient, magnificent, productive, real, well-grounded. Second to none. Wow me."

The ten lens-questions to internalise on every surface you touch (not a checklist — a way of seeing):
1. If I were a returning customer landing here, what is the single most useful sentence I could read?
2. What is the next clearest action they want? Is it surfaced above the fold?
3. What metric would make them feel "this product knows me"?
4. What looks template-filled and should become curated?
5. What would I delete that adds noise without signal?
6. Where am I using "Loading…/Welcome…/generic" copy that could be their actual data + a personal next-step?
7. Where am I assuming a form/setup/connection is done — and what's the graceful path if it isn't?
8. Does this work as well in dark as light? Does the Henry Onyx division accent sit cleanly in both?
9. Does this feel cramped on a 360px mobile, or breathable?
10. If I had 8 seconds with this user before they got distracted, what should they walk away with?

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/account-premium-<page-slug>` (per page-slice) |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

Branch off `origin/main`. Use absolute paths. Do not auto-merge — owner reviews each session's deliverable visually before merge.

## Audit summary

The customer dashboard lives in `apps/account/app/(account)/`. The shell (`layout.tsx` + `AccountLayoutInner.tsx`) is governed by V3-09/THEME tokens and is **not** in scope except where a page integration requires it. The Phase-1 inventory (`docs/v3/account-inner-page-audit-2026-05-23.md`) enumerated every page-file under `apps/account/app/(account)/**/page.tsx` — `page.tsx` (root home), `activity`, `addresses`, `calendar`, `care`, `documents`, `invoices` + `invoices/[invoiceId]`, `jobs`, `learn`, `logistics`, `marketplace`, `messages`, `modules`, `notifications`, `payments`, `property`, `referrals`, `saved-items`, `security`, `settings`, `studio`, `subscriptions`, `support`, `tasks`, `verification`, `wallet` — scored each on real-data integrity / next-step clarity / premium feel / mobile parity, and rank-ordered the rebuild.

The foundation has landed: `packages/dashboard-shell/src/surfaces/` ships `HeroCard` (solo/paired/compact variants; replaces ~15 independent per-division hero implementations), `NextStepRow`, `MetricStrip`, `TimelineCard`, `EmptyStateCard`, `DivisionLanding`, plus `surfaces.css`. The interaction grammar is documented in `docs/v3/account-design-language.md`. **The gap this pass closes:** the page-files still render their old bespoke heroes, ad-hoc empty states, and (in places) hardcoded objects/static counts. This pass migrates each page onto the shared primitives with real typed data fetchers, a real above-the-fold next-step, and honest empty/loading/error states — one curated slice per session.

## Mandatory scope

### S1 — Select and re-audit the page-slice (3 pages per session)
Pick 3 pages that span the surface taxonomy and are highest on the audit's rebuild-priority rank and not yet migrated. The first reference slice is: **root home** (`apps/account/app/(account)/page.tsx`, overview type, hero lives here), **care landing** (`apps/account/app/(account)/care/page.tsx`, division overview), **messages inbox** (`apps/account/app/(account)/messages/page.tsx`, list type). Read each page end-to-end plus its primary data fetcher(s) before writing. Re-score against the four audit axes and capture the per-page "wow-bar gaps" you will close.

### S2 — Rebuild each page onto the shared primitives
For each page in the slice, replace the bespoke hero/empty-state/card JSX with compositions of `HeroCard` / `NextStepRow` / `MetricStrip` / `TimelineCard` / `EmptyStateCard` / `DivisionLanding` from `@henryco/dashboard-shell`. The primitive owns geometry, motion, light/dark adaptation, and breakpoints; **the host page owns all copy (via `@henryco/i18n`) and all data**. Each rebuilt page must:
- Replace every hardcoded object/static count with a typed server data fetcher (server-component first), OR document why the fetcher does not exist yet and propose its contract.
- Surface exactly one real next-step the user can act on, above the fold, via `NextStepRow`.
- Render an honest empty state via `EmptyStateCard` naming the actual missing thing + the actual next action (never "Nothing here yet.").
- Render the V3-10 canonical `error.tsx` fallback for unhandled throws, and a calm not-found surface (with a real onward link) for "not your record / 404".
- Render the V3-05 `StructuredSkeleton` shape (cards where cards will be — no generic spinner); transition to a "still loading — this is unusual" + retry affordance past ~3s.
- Render clean on a 360px viewport with no horizontal scroll and no clipped content.

After each rebuild, run the 10-question self-audit and record the answers in the report.

### S3 — Extend the rebuild hand-off spec
For each page NOT in this session's slice that you newly understood, append/refresh its mini-spec in `docs/v3/account-inner-page-rebuild-spec.md`: purpose (one sentence) · hero/anchor content algorithm (where the headline data comes from) · next-step picker (what action to surface) · primitive composition (which `HeroCard` variant + companions) · data-fetcher contract (server function → typed shape) · empty-state copy + CTA · error-state behaviour (→ V3-10 fallback). Successor agents execute one page at a time from this spec without redoing design work.

### S4 — New shared primitive (only if genuinely reusable)
If a rebuild needs a NEW reusable surface (e.g. a `<SubscriptionStatusCard />` used by both `subscriptions` and `wallet`), ship it in `packages/dashboard-shell/src/surfaces/` with the same contract discipline as the existing six (THEME tokens, light+dark, single responsive component, i18n-driven copy, a11y, telemetry hooks) — never as a one-off inside `apps/account/components/`.

## Out of scope
- `packages/search-ui/` — owner-reserved (memory `feedback_dashboard_search_engine_no_touch.md`); quality reference only.
- The account shell chrome (sidebar/topbar/theme toggle) — governed by V3-09 + chrome passes; edit only if a page integration strictly requires it.
- Search backend/relevance — owned by SEARCH-01.
- The marketplace mobile profile drawer — owned by DESIGN-01.
- Mobile Expo apps (`apps/super-app`, `apps/company-hub`) — separate stack; web mobile only here.
- Payment behaviour: `@henryco/payment-surface` primitives may be re-skinned for layout only; never change payment behaviour, amounts, or status logic.

## Dependencies
Depends on V3-05 (skeletons), V3-09 (mobile/safe-area), V3-10 (error + `surface:error`), V3-07 (i18n strict gate), V3-IDENTITY-01 (brand). This arc BLOCKS nothing downstream (it is customer-surface polish), but a clean, standardised account dashboard is the reference the personalization passes (V3-34 personalization-home) build their per-user layout on top of — coordinate primitive contracts with that pass.

## Inheritance
`@henryco/dashboard-shell/surfaces` (the six primitives + `surfaces.css`), `@henryco/dashboard-shell` (loading-skeleton, empty-state, error-boundary, page-header), `@henryco/i18n` (typed copy + DeepL Pattern B), `@henryco/observability/emitEvent`, `@henryco/config` (`COMPANY`, division accents, URL helpers), V3-05 `StructuredSkeleton`/`ListStates`, V3-09 `@henryco/ui/mobile` + `@henryco/ui/a11y`, V3-10 canonical `error.tsx`.

## Implementation requirements

### Files
- Per page-slice: `apps/account/app/(account)/<area>/page.tsx` (and its server fetcher module, typically a co-located `*.data.ts` or a `packages/*` query) rewritten onto the primitives.
- `docs/v3/account-inner-page-rebuild-spec.md` (create/extend) — per-page mini-specs.
- `packages/dashboard-shell/src/surfaces/*` — only if a genuinely reusable new primitive is required (+ its `index.ts` export + `surfaces.css` rule).
- Report at `.codex-temp/account-dashboard-premium-rebuild/report.md`.

### Trust / safety / compliance
Every data fetcher is server-first (no `useEffect` data fetching in pages), returns a typed shape, and respects the caller's RLS-scoped Supabase session — a customer sees only their own records. No service-role reads from a page. Any surface that renders money (wallet/invoices/subscriptions/payments) reads provider-confirmed money-truth and uses `@henryco/payment-surface` primitives unchanged. Telemetry on engagement-worthy surfaces only; no PII in event payloads.

### Mobile + desktop parity
Design for 360px first; desktop redistributes the same content with more breathing room (single responsive component, no per-viewport fork). Touch targets ≥44px (V3-09). The hero is the first thing on mobile — nothing eats the viewport above it. Safe-area insets via V3-09 helpers. Expo super-app is out of scope.

### i18n
All copy flows through `@henryco/i18n`. Page copy lives under the per-area surface namespace — `surface:account-home`, `surface:care`, `surface:messages`, etc. (Pattern A typed keys; Pattern B `translateSurfaceLabel` DeepL fallback). Empty-state copy, next-step labels, status pills, and error strings are all translated. Never introduce a new locale. `pnpm i18n:check:strict` must stay green.

### Brand & design system
Brand strings are **Henry Onyx** (user-facing) sourced from `@henryco/config` (`COMPANY.group.name`, division `name = "Henry Onyx <Division>"`) — never hardcode the brand, never the retired "Henry & Co.". Per-division accent comes from `company.ts` (`accent`/`accentStrong`/`accentText`/`dark`) — the `HeroCard` eyebrow/CTA tint reads it, no ad-hoc hex. Fraunces/serif for editorial headlines per the locked design system; THEME semantic tokens only (`bg-surface-base`, `text-ink-muted`, `border-subtle` — never raw `bg-gray-100`/`text-zinc-400`). Light + dark equally polished. Zero hardcoded domains — onward links go through `getAccountUrl()` / `henryDomain(division)` / `henryWebRoot()`.

## Validation gates
1. `pnpm i18n:check:strict` PASS (V3-07 strict gate).
2. Typecheck PASS across `@henryco/dashboard-shell` and `apps/account`; lint PASS.
3. `pnpm a11y:contrast` not regressed; keyboard-navigable, SR announcements, prefers-reduced-motion respected on every rebuilt page.
4. Each rebuilt page visually confirmed in BOTH modes on BOTH viewports (360px mobile + desktop), CLS ≈ 0, no horizontal scroll.
5. Each rebuilt page's 10-question self-audit answered in the report.
6. No new untyped fetcher, no `useEffect` data fetch, no hardcoded mock object remains on the rebuilt pages (grep-verified in the report).

## Deployment gate
All gates green. DRAFT PR opened, NOT auto-merged. Owner reviews the rebuilt pages visually (light + dark, mobile + desktop) before merge. One curated page-slice per session — resist rebuilding 15 pages at once; quality dies in bulk.

## Final report contract
`.codex-temp/account-dashboard-premium-rebuild/report.md` with the standard 9 sections (exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification · telemetry baseline · deferred items · pass-closure assertion), plus: the page-slice rebuilt, the primitives consumed, the rebuild-spec link, the screenshots-needed list, and the 10-question self-audit answers per rebuilt page.

## Self-verification
- [ ] Page-slice (3 pages) selected from the audit's rebuild-priority rank; re-scored against the 4 axes
- [ ] Each page rebuilt onto `@henryco/dashboard-shell/surfaces` primitives (no bespoke hero/empty-state JSX remains)
- [ ] Every hardcoded object/static count replaced by a typed server fetcher (or its contract documented)
- [ ] Each page surfaces one real above-the-fold next-step via `NextStepRow`
- [ ] Honest empty state (`EmptyStateCard`), calm not-found, V3-10 error fallback, V3-05 skeleton on each page
- [ ] `docs/v3/account-inner-page-rebuild-spec.md` extended for the pages newly understood
- [ ] Brand = Henry Onyx via `@henryco/config`; division accent from `company.ts`; THEME tokens only; zero hardcoded domains/strings
- [ ] Light + dark, 360px + desktop, CLS ≈ 0, `pnpm a11y:contrast` not regressed
- [ ] `pnpm i18n:check:strict` + typecheck + lint PASS
- [ ] 10-question self-audit answered per page in the report
- [ ] DRAFT PR opened, not auto-merged, with screenshots-needed list
