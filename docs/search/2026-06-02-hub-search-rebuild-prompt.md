# Build Prompt — Henry & Co. Hub `/search`, Rebuilt From Scratch

**Date:** 2026-06-02
**Route:** `apps/hub/app/(site)/search/page.tsx` (company hub, `henrycogroup.com/search`)
**Status of the thing we are replacing:** a thin page delegating to the shared `CrossDivisionSearchExperience`, which client-filters a *static* catalog and is themed against `--public-*` (warm cream/ink) tokens that **do not exist on the hub** — so it renders as a cream editorial page inside the hub's dark-navy shell. The live, Typesense-backed `/api/search` engine sits unused.

> This document is the build brief. It is self-contained: anyone (or any agent) should be able to build the flagship hub search from this alone, against real contracts, with no further discovery.

---

## 1. The mission in one line

Make `/search` the **front door to everything Henry & Co. operates** — a single, living, keyboard-driven instrument that searches *across all divisions* in real time, looks unmistakably like the company, and earns respect on first load. Search is already a first-class IA destination (it is in the hub primary nav). Treat it as the company's command deck, not a utility page.

## 2. Aesthetic direction (commit fully)

**"The operating-company instrument."** Calm, premium, architectural. Dark navy canvas, a single brass-gold accent, editorial type rhythm, and motion that *tracks the real engine* (the search is genuinely live, so let latency and counts read as instrumentation, never decoration). Refined-minimal maximalism: restraint in color, generosity in space and craft. It must feel like the same hand that built the hub homepage — and then go further, because this page *does something the homepage only gestures at*.

Non-negotiable brand truths (from the live system — do not re-derive, do not violate):

- **Canvas & color.** `bg-[#050816]` (token `--site-bg`), white text at a calibrated alpha ladder: `white/90 /82 /78 /72 /68 /55 /45 /36`. Borders `border-white/10` lifting to `white/22` on hover. Surfaces `bg-white/[0.03]`–`[0.06]` or `bg-black/18`–`30`. **One** accent, the brass gold the shell injects as `--accent` (default `#C9A227`); consume via `text-[color:var(--accent)]`, `bg-[color:var(--accent)]`, focus `ring-[color:var(--accent)]`. The multi-color rainbow was deliberately retired company-wide — honor that restraint. Per-division hues exist (see §6) and may tint *individual* result accents/dots, but the page's chrome stays mono-gold.
- **Type.** No Fraunces on the hub. Match the homepage: display headings in **system-sans**, `font-semibold`, large `text-[…]` sizes with negative tracking (`tracking-[-0.015em]` → `-0.035em`). The signature triad, reused verbatim every section:
  - eyebrow: `flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.28em] text-white/55` + a 3.5px accent lucide icon
  - heading (H2): `text-[1.7rem] sm:text-[2rem] leading-[1.15] tracking-[-0.015em]`
  - body: `text-sm leading-7 text-white/68`
  - The only serif anywhere is the SVG wordmark (`HenryCoWordmark` / `HenryCoLogo`). Do not introduce a serif text font.
- **Atmosphere.** Echo the homepage backdrop so the page belongs: a fixed, `pointer-events-none`, `-z-10` layer = accent radial wash from top-left (`rgba(201,162,39,0.18)`) + a soft base horizon glow + a 32px dotted grid (`radial-gradient(circle at 1px 1px …) [background-size:32px_32px] opacity-50`). Particles are optional and must bail on mobile + reduced-motion (the homepage `HubParticles` is the reference; a lighter CSS-only shimmer is acceptable).
- **Container.** The shell (`PublicSiteShell` → `PublicHeader` + footer) is already mounted. The page owns only `<main>` content, which has **no padding or max-width of its own**. Every section: `mx-auto max-w-7xl px-4 sm:px-6 lg:px-8`. Provide top spacing below the floating header. Do **not** re-mount header/footer or the `HenryCoSearchBreadcrumb` (the header already has it).
- **Dark-first.** The hub shell is effectively always-dark and hides the theme toggle. Design for the navy. Shared primitives carry their own `dark:` parity if a light theme is ever active.
- **Tailwind v4, CSS-first.** Tokens are CSS variables consumed through arbitrary-value syntax (`bg-[var(--site-bg,#050816)]`, `text-[color:var(--accent)]`). `cn()` from `@henryco/ui`. Reduced motion is enforced globally; still gate JS motion explicitly.

## 3. The single biggest upgrade: make it actually search

Bind the UI to the **live engine**, with the static catalog as a graceful floor.

- **Live source.** `GET /api/search?q=<q>&division=<csv>&limit=<n>&cursor=<c>` → `SearchOutput`:
  ```ts
  interface SearchOutput {
    query: string;
    hits: UnifiedSearchResult[];      // ranked, paginated slice
    next_cursor: string | null;        // opaque; null = no more pages
    total: number;                     // candidate count after dedupe/diversity
    facets: Record<string, number>;    // keyed by Typesense COLLECTION name; {} when Typesense unconfigured
    took_ms: number;                   // server elapsed ms — show it
  }
  ```
  The route **always returns 200** (it try/catches to an empty `SearchOutput`); it resolves the Supabase user from cookies (signed-in → `context:'account'`, more results; anon → `context:'public'`, rate-limited by IP). Same-origin `fetch` — no auth wiring needed in the page.
- **Hit shape.** `UnifiedSearchResult extends CrossDivisionSearchResult` and adds `resolution: 'indexed'|'catalog'|'workflow'` and `score: number`. Fields to render: `id`, `division` (`hub|account|care|marketplace|jobs|learn|logistics|property|studio|staff`), `type`, `title`, `subtitle?`, `description?`, `url` (absolute), `authRequirement` (`none|account|staff`), `badge?`, `icon` (22-member union — map to lucide), `priority` (0–100), `tags: string[]`, `metadata?` (read `metadata.updated_at` for recency), `resolution`, `score`.
- **Facets → division counts.** `facets` is keyed by Typesense *collection* name, not division, and is `{}` in preview/dev. **Derive the division facet rail from `hits[].division`** (and, when present, enrich from `facets`). Never depend on Typesense being configured.
- **Fetcher.** Re-implement fresh (do **not** import from the reserved `packages/search-ui`): a debounced (≈160ms), **abortable** (`AbortController`, cancel prior) hook exposing `{ hits, total, tookMs, nextCursor, loading, error, refetch }`. `enabled`-gate so we don't fetch on an empty first paint when we already have an SSR seed.
- **URL is state.** Push `?q=` and `?division=` via `router.replace(…, { scroll: false })` so results are shareable, deep-linkable, and SSR-seedable. Seed `initialQuery`/`initialDivision` from `searchParams` on the server.
- **Static floor.** Server-seed the first paint and the offline/empty path from `@henryco/intelligence`: `getHubSearchCatalog({ signedIn })`, ranked with `searchCrossDivisionResults(catalog, q, { limit })`, grouped via `groupSearchResultsByDivision`. When the live API returns zero hits (e.g. Typesense down) **and** there is a query, fall back to client-side catalog filtering so the page is never dead. For anon users, surface that more exists behind sign-in using the existing `buildHubSearchSignInHref(query)` from `@/lib/search`.
- **Pagination.** Cursor-based. "Load more" (or auto on scroll) using `next_cursor`; stop when `null`. Append, don't blank.
- **Telemetry parity.** On submit/click/zero/auth-redirect, build the signal with `buildSearchSignal({ kind, query, context, resultCount, result? })` and dispatch `window.dispatchEvent(new CustomEvent('henryco:search-signal', { detail }))` with the raw `query` **stripped** from `detail` (privacy) — exactly as the old component did, so existing listeners keep working. `context` = `'account'` when signed in, else `'public'`.

## 4. Interaction & a11y craft (the gold standard, re-implemented)

This is what separates a flagship from a form. The reserved `search-ui` palette is the bar; rebuild these fresh:

- **Full keyboard model on the page itself.**
  - Input is `role="combobox"` `aria-expanded` `aria-controls={listboxId}` `aria-activedescendant={activeRowId}`.
  - Results are `role="listbox"`; each row `role="option"` `aria-selected` with a stable `id`.
  - `ArrowDown`/`ArrowUp` move a highlight clamped to `[0, n-1]` (auto-clamp when the list shrinks mid-type); `Enter` navigates the highlighted row; `Home`/`End` optional.
  - `/` focuses the search box unless focus is already in an input/textarea/select/contenteditable.
  - A visually-hidden `role="status" aria-live="polite"` region announces `"<N> results"` / `"No results for <q>"` and the highlighted title.
  - `onMouseDown`-preventDefault on rows so clicking never steals input focus.
- **Match highlighting.** Bold/accent-tint the typed substring inside the title (first occurrence, case-insensitive) — port the `HighlightedText` idea.
- **Scope chips, not a checkbox wall.** A horizontal `role="tablist"` rail: a leading **All** chip + one per active division, each `role="tab"` `aria-selected`. Active = accent fill + black text; inactive = `border-white/12 bg-white/[0.06] text-white/74 hover:bg-white/10`. Selecting maps to `?division=` (single scope is fine; multi-select optional). Show the per-division hit count as a subtle mono number on each chip.
- **Sort control.** Relevance (default, by `score`/`priority`) · Recent (`metadata.updated_at` desc) · Urgency (`priority` desc).
- **Result row anatomy.** `1.5rem | 1fr | auto` grid: leading lucide icon (by `icon`/`division`, turns gold when active); center = highlighted title (single-line ellipsis) + a `· `-joined `subtitle`/`type`/host meta line; trailing = optional `badge` chip, a division pill (tinted with the division accent), and an `ArrowUpRight`. **Active/focused row = a 2px gold left bar + `--accent`-soft background. Never a scale transform** (it jitters every keystroke) — use a fast background/opacity fade only.
- **States.**
  - *Loading:* show a calm "Searching across Henry & Co.…" only when the list is empty; once rows exist, never blank them on refetch — show a thin top progress shimmer / spinner in the input instead.
  - *Empty (no query):* teach the system. Real example-prompt chips ("marketplace orders", "track a delivery", "book a care pickup", "wallet withdrawal", "interview prep"), a curated cross-division "start here" set from the catalog, optional recents from `localStorage` (scoped key, deduped, ≤8), and a cycling placeholder hint.
  - *Zero-results (query, no hits):* `No results for "<q>"` + a single-keyword nudge + the curated fallbacks + (anon) the sign-in nudge.
  - *Error:* a calm **anchored** banner (not a toast), `role="status" aria-live="polite"`, with humane verb-first copy mapped from the failure (network → "Check your connection, then retry.", 401/403 → "Your session expired. Refresh the page.", 429 → "Too many searches — slow down a moment.", 5xx → "Our search service is reconnecting.") — **never leak status codes** — and a Retry that re-issues the query. (Note: the API rarely errors since it returns 200-empty; handle network/abort/parse and the `{ rate_limited: 1 }` facet.)
- **Motion.** framer-motion, every animation gated by `useReducedMotion()`. Signature entrance = a hand-authored delay ladder (eyebrow 0 → H1 0.04 → input 0.06 → scope rail 0.09 → results 0.12), `opacity 0→1`, `y 12–16→0`, `dur 0.4–0.5`. Hover-lift on cards via Tailwind (`-translate-y-0.5`, `hover:border-white/22`). `useDeferredValue` for responsive typing. No layout-shifting spinners.

## 5. Page composition (top → bottom, inside `<main>`)

1. **Hero band.** Eyebrow ("Henry & Co. · Universal search" with a Compass/Sparkles accent icon) → a restrained display H1 (e.g. *"Search everything Henry & Co. operates."*) → one-line body. Keep it tight; capability evidence (the live input + scope rail + counts) sits right under it, not a viewport-filling headline (owner rule: no giant hero text).
2. **The instrument — search field + status line.** A single prominent input: `h-14 rounded-2xl border border-white/12 bg-black/30 pl-11 pr-12`, leading `Search` icon, trailing clear `X`, `focus:border-[color:var(--accent)]` + brand focus ring; a `/` kbd hint. Directly under it, a thin **status line**: result count · `took_ms` ("answered in 23 ms") · active scope — instrumentation that proves it is live. While the index is unconfigured (preview), say so honestly ("Browsing the curated catalog") rather than faking timing.
3. **Scope rail.** All + per-division chips with counts (§4).
4. **Results.** The `listbox`. In query mode: a single ranked feed (with optional division group headers). In browse mode (no query): the curated cross-division "start here", grouped by division with hairline section headers (`H2` + count + `flex-1` rule), echoing the homepage directory rhythm. Per-division accent tints the row's dot/pill only.
5. **Sign-in nudge (anon).** An editorial left-rule ribbon (`border-l-2 border-[color:var(--accent)]/55 pl-5`), not an amber alert: "More Henry & Co. routes open after sign in" + a couple of locked example pills + the `buildHubSearchSignInHref` link.
6. **Pagination / load-more.** Cursor-driven (§3).
7. No footer — the shell supplies it.

## 6. Division identity (for per-result accenting and chip labels)

Build a `DIVISION_META` map covering all 10 search divisions (the hit `division` union is broader than the config `DivisionKey`, so include `account` and `staff` here too). Labels + accent hues (static config ramp `accent` is canonical; `accentText` is the AA-safe text sibling):

| key | label | accent | accentText |
|---|---|---|---|
| hub | Hub | #C9A227 | #8A6F00 |
| account | Account | #C9A227 | #8A6F00 |
| care | Fabric Care | #6B7CFF | #4F5BD0 |
| marketplace | Marketplace | #B2863B | #7E5E1F |
| property | Property | #B06C3E | #7A4924 |
| logistics | Logistics | #D06F32 | #9D4F1F |
| studio | Studio | #4AC1C5 | #1F7375 |
| jobs | Jobs | #0E7C86 | #0E7C86 |
| learn | Learn | #3C8C7A | #2E6E5F |
| staff | Staff HQ | #8A857C | #8A857C |

Icon per division (lucide): hub→Compass, account→Wallet, care→LifeBuoy, marketplace→ShoppingBag, jobs→Briefcase, learn→GraduationCap, logistics→Truck, property→Building2, studio→Palette, staff→Users. The 22-member `icon` union maps to lucide too (compass, building, sparkles, shopping-bag, briefcase, graduation-cap, truck, palette, wallet, bell, receipt, life-buoy, shield, settings, message-square, map-pin, package, search, layout-dashboard, file-text, users, headphones) with a `Layers3` fallback.

Company identity (`import { COMPANY } from "@henryco/config"`): group name "Henry & Co.", mission "A premium operating company built on clarity, trust, and operational excellence.", promise "Every Henry & Co. division should feel premium, dependable, and beautifully structured." Voice = premium / dependable / clarity / trust / operational excellence / beautifully structured.

## 7. Architecture & files

- `apps/hub/app/(site)/search/page.tsx` — **server component** (replace entirely). `export const dynamic = 'force-dynamic'`. `export const metadata` via `createDivisionMetadata('hub', { title: 'Search', path: '/search', … })` (or a plain object with `alternates.canonical: '/search'`). Resolve `searchParams` (`q`, `division`), `getHubPublicChipUser()` (signed-in?), seed the static catalog (`getHubSearchCatalog`, ranked) for the first paint + no-JS, and render `<HubSearchExperience … />`. Emit a `SearchAction`/`WebSite` JSON-LD `potentialAction` for SEO.
- `apps/hub/app/(site)/search/HubSearchExperience.tsx` — **client component** (`'use client'`). The whole instrument: live fetcher, URL sync, scope rail, sort, keyboard model, highlighting, motion, atmosphere, states, telemetry, pagination, sign-in nudge.
- Optional `apps/hub/app/(site)/search/_parts.tsx` (or inline) — `ResultRow`, `ScopeChip`, `HighlightedText`, `DIVISION_META`, icon maps, `useLiveSearch`, `humaniseError`, recents helpers. Keep it cohesive; split only for readability.
- **Do not** modify `packages/ui/src/search/CrossDivisionSearchExperience.tsx` (still used by `apps/account/(account)/search`). **Do not** import from or modify `packages/search-ui` (reserved). Leave `@/lib/search` helpers intact and reuse them.

## 8. Acceptance criteria

1. The hub `/search` is visually **of the dark-navy hub** — no cream/`--public-*` fallback, tokens are `--site-*` / `--accent` / white-alpha. Side-by-side with the homepage it reads as the same product.
2. Typing returns **live results from `/api/search`** (verified against the real route), debounced + abortable, with `took_ms` and counts shown; falls back to the curated catalog when the index is unconfigured or returns empty — never a dead page, never a 500 surfaced.
3. Full keyboard operation: `/` focuses, `↑/↓` move, `Enter` opens, `aria-activedescendant` + `aria-live` wired; screen-reader-announced; visible brand focus ring.
4. Scope chips filter via `?division=`; `?q=`/`?division=` are in the URL and deep-linkable/SSR-seeded; back/forward works.
5. Match highlighting, sort (Relevance/Recent/Urgency), teaching empty state (+ recents), humane anchored error, anon sign-in nudge, cursor pagination — all present.
6. Motion is `useReducedMotion`-gated; respects the global reduced-motion rule; no keystroke jitter (no row scale transforms).
7. `account` search still compiles and works (shared component untouched). `search-ui` untouched.
8. **Verified**: `pnpm --filter @henryco/hub typecheck`, lint, and `build` pass; account search typecheck unaffected. No shallow claims — paste the command output.

## 9. Out of scope / guardrails

- No new dependencies (framer-motion, lucide-react, tailwind-merge already present).
- No server-role / Typesense provisioning changes; consume the existing route only.
- No copy that invents metrics; show real `took_ms`/counts or an honest "curated catalog" line.
- Keep the diff to the hub app + this doc; do not touch other divisions, `search-ui`, or the shared cross-division component.
