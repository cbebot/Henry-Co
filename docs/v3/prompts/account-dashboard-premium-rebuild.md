# ACCOUNT-PREMIUM-01 — Customer Account Dashboard Inner-Page Rebuild

**Pass ID:** ACCOUNT-PREMIUM-01
**Phase:** Polish + capability rebuild
**Pillar:** P3 (Personalization) + P12 (Global UX) + brand
**Dependencies:** Wave B.1 + close-out merged (THEME-01 Light/Dark/System tokens, DESIGN-01 BottomSheet, V3-05 StructuredSkeleton + ListStates, V3-09 mobile primitives, V3-10 error boundaries + canonical surface:error i18n, V3-07 i18n strict gate, SEARCH-01 indexing + ranking, MODULES-01 viewerCanUseCustomerSurface helper, FIX-MOBILE-CLICKS touch-action: manipulation)
**Effort:** XL (3–5 sessions to land the full set; this prompt covers a multi-session arc)
**Parallel-safe:** YES (no overlap with active V3 surface owners)
**Owner gate:** Visual sign-off after EACH session — this is a quality bar, not a velocity sprint
**Risk class:** None

---

## Role

You are the V3 Customer Surface engineer assigned to ACCOUNT-PREMIUM-01. The owner directive, paraphrased from a long-form ask:

> "Audit, read, understand how the whole dashboard inner pages work — all of the customer account dashboard inner pages, all those large hero cards, etc. Everything looks and feels real and standardised, no shallow work or hardcoding objects. From scratch, well-engineered. All those pages will be rebuilt for good. First work through them and ask yourself questions: 'if I were the user, how best do I expect it to be to make the maximum satisfaction and the most premium expensive feel?' Thunderous, wonderful, efficient, magnificent, productive, real, well-grounded work. Second to none. Premium expensive feel. Wow me — I hired you to do the difficult task."

**The owner's bar:**
- "User knows what to do next" — every page surfaces the user's likely next action, not a static template
- "Looks and feels real" — every number, every name, every image is real data the user owns
- "Standardised" — a shared visual + interaction language across the whole inner-shell
- "No shallow work or hardcoding objects" — no `const FAKE_USER = {...}`, no hard-coded copy that should read from `@henryco/i18n`, no placeholder card grids
- "From scratch well-engineered" — when a page is rebuilt, its data layer is reviewed AND the JSX is rewritten against the new design language
- "Most premium expensive feel" — the quality bar of Stripe, Linear, Notion, Apple Wallet, Things 3 — not a corporate dashboard template
- "Maximum satisfaction" — every interaction is considered: when the user lands on a page, the first thing they see should answer "what's happening with my stuff?"; the second thing should answer "what should I do next?"

**Quality questions the engineer asks themself BEFORE writing code (and re-asks AFTER):**

1. If I were a returning customer landing on this page right now, what is the single most useful sentence I could read?
2. What is the next clearest action they probably want to take? Is it surfaced above the fold?
3. What metric, if any, would make them feel "this product knows me"?
4. What part of this page currently looks like it was filled by a template — and what should replace it with something curated?
5. What would I delete on this page that adds noise without adding signal?
6. Where am I using "Loading…" / "Welcome…" / generic copy that could be replaced with their actual data + a personal next-step?
7. Where am I assuming the user has filled a form / completed a setup / connected an account — and what's the graceful path if they haven't?
8. Does this page work as well in dark mode as light mode? Does the active brand-gold accent sit cleanly on the page surface in both?
9. Does this page feel cramped on a 360px-wide mobile, or breathable?
10. If I had 8 seconds with this user before they got distracted, what would I want them to walk away with?

These questions are NOT in a checklist; they're the lens. The agent must internalise them and use them on every surface they touch.

---

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `feat/account-dashboard-premium-rebuild` |
| Worktree (absolute) | `C:/Users/HP VICTUS/HenryCo/.worktree/account-premium` |
| Branch base | `main @ <latest>` — post Wave B.1 + close-out merges |
| OS context | Windows + bash; pnpm 9.15.5; Node 24.x |

Use ABSOLUTE PATHS. For Bash, first call `cd "C:/Users/HP VICTUS/HenryCo/.worktree/account-premium"`. For git, prefer `git -C "<path>" <cmd>`. DO NOT touch the parent repo or sibling worktrees.

---

## Surfaces in scope

Every page under `apps/account/app/(account)/**/page.tsx`. The shell at `apps/account/app/(account)/layout.tsx` + `AccountLayoutInner.tsx` is in scope for what each page renders WITHIN — but the shell chrome itself (sidebar, topbar, theme toggle) is governed by THEME-01 / DESIGN-01 / V3-09 patterns and only edits if a surface integration requires it.

Mapped pages (incomplete — the agent's Phase 1 audit produces the canonical list):

- `/` — root account home (high-traffic, hero card lives here)
- `/activity` — cross-division activity stream
- `/addresses` — saved addresses
- `/calendar` — appointments + bookings
- `/care/*` — care division landing + per-booking detail
- `/documents` — files + invoices
- `/invoices` + `/invoices/[invoiceId]` — billing
- `/jobs/*` — jobs candidate surface + interview sessions
- `/learn` — learn enrolment + progress
- `/logistics` — shipments + tracking
- `/marketplace` — shopping account
- `/messages/*` — multi-source inbox (activity / notification / security threads)
- `/modules/[...slug]` — catch-all module router (MODULES-01 already fixed the viewer-gate; the LANDING content per module is still in scope)
- `/notifications` — full notification inbox
- `/studio/*` — studio briefs + projects
- `/wallet` — wallet balance + transactions
- `/settings/*` — preferences, privacy, payment methods, notification preferences

The Phase 1 audit must enumerate every page-file, document its current render, classify it (overview / list / detail / form / empty-state-only / hybrid), and rank-order by user-traffic + business value.

---

## Hard out-of-scope (preserve, do NOT modify)

- **`packages/search-ui/`** — owner-reserved. Quality reference renderer only.
- **Brand identity** — gold accent, serif headlines (`Newsreader`/`Iowan Old Style` per existing config), monogram. Preserve in both modes.
- **THEME-01 token system** — extend if a new token is truly needed; do NOT fork.
- **Recent commits to mobile thread header (#114–#117)** — preserve.
- **PERF-01 PublicRouteLoader + globals.css smooth-scroll** — preserve.
- **i18n architecture (12 locales, Pattern A + Pattern B DeepL fallback)** — extend via existing utilities. No new locales.
- **Mobile apps (Expo)** — `apps/super-app` + `apps/company-hub` separate stack.

If a rebuild requires a NEW primitive that's reusable across surfaces, ship it in `packages/dashboard-shell/` (already the design-system home for account chrome) — not as a one-off component inside `apps/account/components/`.

---

## Mandatory scope (multi-phase, owner-quality gates at each)

### Phase 1 — Inner-shell audit (this is the foundation; do not skip)

For every page-file under `apps/account/app/(account)/**/page.tsx`:

1. Read the file end-to-end + its primary data fetcher(s).
2. Classify the page (overview / list / detail / form / empty-state / hybrid).
3. Score on 4 axes (1–5 scale):
   - **Real-data integrity** — does the page actually render the user's data, or does it have placeholder/static sections that look like data but aren't?
   - **Next-step clarity** — does the page tell the user what they likely want to do next?
   - **Premium feel** — does it read as a $20/mo product or a free dashboard template?
   - **Mobile parity** — does it feel as considered on a 360px viewport as on desktop?
4. List 2–4 specific "Wow-bar gaps" — concrete things that would make a returning user say "this is the best dashboard I've used".
5. Identify any hardcoded objects (placeholder arrays, mock fixtures, static counts) that should be data-fetched.

Output: `docs/v3/account-inner-page-audit-2026-05-23.md` — per-page section with the 4-axis scores, current-state-summary, gap list, rebuild-priority rank.

**Quality bar for the audit itself:** the audit document IS the second deliverable of this session. The owner reads it; it shapes the rebuild phases. Write it like a Linear product-design doc — short headlines, evidence per claim, decisive recommendations. Not a bullet-list summary.

### Phase 2 — Design language (semantic + interaction tokens)

After the audit reveals the actual patterns the customer dashboard uses, define a SHARED language. Two artifacts:

**a) Surface primitives** in `packages/dashboard-shell/src/surfaces/` (new folder):

- `<HeroCard />` — the canonical hero card. Composed of an eyebrow + greeting + status sentence + 1–2 primary CTAs + optional progress strip. Renders user's actual data; never hardcoded greeting copy. Three layout variants: `solo` (full-width, default), `paired` (with secondary metric tile), `compact` (when the page already has another anchor).
- `<NextStepRow />` — a row component that surfaces a single "this is what you do next" action with context. Used on the root home + division landings.
- `<MetricStrip />` — a horizontal strip of 3–5 metrics with optional sparkline. Reads from a typed data source; no static numbers.
- `<TimelineCard />` — for activity / orders / messages. Composes existing primitives (avatar, status pill, copy line) into a consistent row.
- `<EmptyStateCard />` — the canonical empty state. Eyebrow + headline + body + CTA + optional illustration slot. Replaces every ad-hoc empty state.
- `<DivisionLanding />` — page-level composer that takes a division (care / marketplace / jobs / learn / logistics / property / studio / wallet) and renders a standardised layout (hero + metric strip + next-steps + recent timeline). Each division landing becomes a thin caller of this primitive with division-specific data.

Each primitive:
- Consumes THEME-01 semantic tokens; no hardcoded hex
- Light + Dark mode equally polished
- Mobile + desktop responsive (single component, no per-viewport fork)
- i18n via `@henryco/i18n` — strings flow through Pattern A typed copy + Pattern B DeepL fallback
- Accessible: keyboard-navigable, screen-reader announcements, prefers-reduced-motion respected
- Telemetry hooks via `@henryco/observability/emitEvent` where engagement matters

**b) Interaction grammar** — a short doc (`docs/v3/account-design-language.md`) capturing:
- The "next-step" surfacing pattern (where it lives on the page, how it picks its content)
- The data-loading contract (when to use StructuredSkeleton from V3-05 vs server-rendered content vs optimistic optimism)
- The "this-was-empty-yesterday" pattern (graceful empty states that don't shame the user)
- The hero-card content algorithm: pick the most useful sentence per-user per-page

### Phase 3 — Rebuild the canonical pages (this session)

Pick 3 reference pages that span the surface taxonomy:
1. **Root home** (`apps/account/app/(account)/page.tsx`) — overview type, hero card lives here
2. **Care landing** (`apps/account/app/(account)/care/page.tsx`) — division overview, mid-traffic
3. **Messages inbox** (`apps/account/app/(account)/messages/page.tsx`) — list type, real activity

Rebuild each USING the Phase 2 primitives. Each rebuild:
- Replaces every hardcoded object with a real data fetcher (or documents why a fetcher doesn't exist yet + proposes the contract).
- Has a clear next-step the user can act on.
- Looks magnificent in BOTH modes.
- Has a clear empty state for first-time visitors.
- Has a clear error state (V3-10 error.tsx canonical).
- Has a clear loading state (V3-05 StructuredSkeleton primitive).
- Renders correctly on a 360px mobile viewport WITHOUT horizontal scroll.

After each rebuild, run the agent's own 10-question self-audit. Document the answers in the report.

### Phase 4 — Hand-off spec for the remaining pages (this session)

Author `docs/v3/account-inner-page-rebuild-spec.md` — a per-page mini-spec for every remaining page. Each mini-spec includes:
- The page's purpose (one sentence)
- The hero/anchor content algorithm (where the headline data comes from)
- The next-step picker (what action to surface)
- The primitive composition (which `<HeroCard />` variant + companions to use)
- The data fetcher contract (what server function returns what shape)
- The empty-state copy + CTA
- The error-state behavior (default → V3-10 fallback)

This spec is the foundation for sessions 2/3 — successor agents read it and execute one page at a time without re-doing the design work.

### Phase 5 — Verify + ship (this session)

- `pnpm i18n:check:strict` PASS (V3-07 strict gate)
- Typecheck PASS across `@henryco/dashboard-shell`, `@henryco/account`
- Lint PASS
- All 3 canonical pages rendered + visually confirmed in BOTH modes on BOTH viewports
- DRAFT PR opened, body lists: pages rebuilt this session, primitives shipped, audit doc link, rebuild-spec link, screenshots-needed list, the agent's self-audit answers for the 3 pages

Report at `.codex-temp/account-dashboard-premium-rebuild/report.md`.

---

## Design principles (owner-quality)

### P1. Premium = restraint, not maximalism

- Less but better. A single well-tuned metric strip with REAL numbers beats a 4×4 grid of "—" placeholders.
- Whitespace is editorial. Don't fear empty space; fill it only when there's something true to say.
- Type sizes settle at 5 tokens: caption, body-sm, body, h3, h2. Anything bigger is a special case, justified.

### P2. Data is the design

- Every numeric surface is real. If the data doesn't exist yet, the surface says "set up tracking → CTA" not "0.0".
- Every name surface is real. If first name isn't available, show "Welcome back" not "Welcome USER_NAME".
- Every empty state names the actual thing missing + the actual next action. Not "Nothing here yet."

### P3. Brand quietly

- Gold (HenryCo accent) appears on intentional surfaces: primary CTA, active state, brand mark. Not on every divider, not in the chrome.
- Serif (Newsreader / Iowan Old Style) is for editorial headlines. The rest is the sans (Manrope / similar).
- Don't recreate the brand on every page — let it rest, then strike at moments that matter.

### P4. Motion is purposeful

- Page-to-page navigation: instant for known transitions, choreographed for the hero card pivot.
- Open/close: spring-eased, capped at 280ms (DESIGN-01 standard).
- Reduced-motion: respected universally; the motion strips to opacity-only fades.

### P5. Mobile is the primary canvas

- Design for 360px first. Desktop is just "you have more room — distribute the same content with more breathing room".
- Touch targets ≥44px (V3-09 enforced).
- The hero card on mobile is the FIRST thing the user sees — no nav above it eating the viewport.

### P6. Every page answers two questions before scroll

1. "What's happening with my stuff?" (hero)
2. "What should I do next?" (next-step row)

Everything below the fold is secondary. Audit ruthlessly for content above the fold.

### P7. Errors stay calm

- V3-10 error.tsx handles unhandled throws.
- For "404 / not found / not your record" — render a calm, brand-coherent surface with a clear next step ("Browse all your bookings"). Don't fail to a vague "Not found".

### P8. Loading is honest

- V3-05 StructuredSkeleton renders the shape the data will fill (cards where cards will be, not generic spinners).
- If a query is slow (>3s), the skeleton transitions to "Still loading — this is unusual" + retry button.

---

## Anti-patterns (HARD stops — owner-quality bar)

- **NO hardcoded mock data** — every array literal of "fake user data", every static metric `value: 12,847`, every placeholder image must go. If real data isn't available, surface the truth: "Set up X to see this".
- **NO Lorem-ipsum copy** anywhere. Even in dev-only comments.
- **NO generic Tailwind palette colors** (`bg-gray-100`, `text-zinc-400`, `border-slate-200`) where a THEME-01 semantic token exists. Use `bg-surface-base`, `text-ink-muted`, `border-subtle` etc.
- **NO new untyped data fetchers.** Every server function returns a typed shape; the page consumes it via that type.
- **NO `useEffect` for data fetching** in pages — server-component first. Client only for true interactivity.
- **NO touching `packages/search-ui/`.** Owner-reserved.
- **NO touching mobile Expo apps** (`super-app`, `company-hub`).
- **NO new locales** — extend via the existing 12-locale typed-copy + DeepL Pattern B.
- **NO breaking the V3-07 strict `pnpm i18n:check:strict` gate** — every JSX string flows through `@henryco/i18n`.
- **NO `git push --force`** — use `--force-with-lease` only when necessary (this is a fresh branch; plain push should work).
- **NO PR auto-merge.** Owner reviews each session's deliverable visually before any merge.
- **NO scope explosion** within a session. 3 reference pages this session, hand-off spec for the rest. Resist the urge to rebuild 15 pages in one go — quality dies.

---

## Self-verification checklist

- [ ] `docs/v3/account-inner-page-audit-2026-05-23.md` covers every page-file with 4-axis scores + gap list + rank
- [ ] `packages/dashboard-shell/src/surfaces/` has the 6 primitives: HeroCard, NextStepRow, MetricStrip, TimelineCard, EmptyStateCard, DivisionLanding
- [ ] `docs/v3/account-design-language.md` documents the interaction grammar
- [ ] 3 canonical pages rebuilt: root home + care landing + messages inbox
- [ ] Each rebuilt page passes the agent's own 10-question self-audit (documented in report)
- [ ] `docs/v3/account-inner-page-rebuild-spec.md` covers every remaining page with a mini-spec
- [ ] Light + Dark mode visual parity on the 3 rebuilt pages
- [ ] 360px mobile viewport renders clean (no horizontal scroll, no clipped content)
- [ ] `pnpm i18n:check:strict` PASS
- [ ] Typecheck + lint PASS
- [ ] DRAFT PR opened with screenshots-needed list

---

You're Opus 4.7 max. The owner said "wow me, I hired you to do the difficult task". This is the difficult task. The customer dashboard is the face of the product to every paying customer — every detail compounds. Don't rush. Don't cheat with placeholder data. Don't ship "good enough". Ship what you'd want to use if you were the customer.

If at any point you find yourself reaching for hardcoded data, stop and ask: "Is there a data fetcher I should build instead?" If the answer is yes, build the fetcher (server-component first, typed return). If the answer is "the data genuinely doesn't exist yet because the feature isn't shipped" — surface the truth in the empty state. Never lie with mocks.

Session 1 closes when the audit + design language + 3 reference pages + hand-off spec are all landing-quality. Then stop, report, hand off to session 2.
