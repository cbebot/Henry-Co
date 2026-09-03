# Henry & Co. Homepage Rebuild — Implementation Plan

> **For agentic workers:** Steps use checkbox (`- [ ]`) syntax for tracking. `apps/hub` has **no unit-test harness** — `pnpm --filter @henryco/hub typecheck` (`tsc --noEmit`) IS the correctness proof, plus `lint`. Pure logic is written side-effect-free so `tsc` proves it. Two extra gates apply to THIS surface specifically: the **`hardcoded-text-scan`** (every authored string must come from the copy model) and the **PNH baseline + contrast matrix + headers** gate (a real accessibility/contrast check — the homepage is the reason that gate exists). The hub **500s on Vercel preview** (Supabase env is production-only — memory `project_henryco_vercel_preview_env_gap`); verify structure/types locally and confirm the data path on **production after merge**, never present a green preview as proof.

> **This is not a studio clone.** The discipline here (staged, checkboxed, `tsc`-gated, squash-to-main) is borrowed from the `/request` rebuild so it ships cleanly through CI. The *ambition* is deliberately far beyond it: bespoke from-scratch chrome, a genuine WebGL ambient layer (studio shipped none), a signature anti-card "Index of Engines" interaction, a richer motion vocabulary, and scroll choreography. Studio is the floor for rigor, never the ceiling for craft. Every stage should clear a higher bar than the equivalent studio stage did.

**Goal:** Replace the textbook card-grid homepage of `apps/hub` (`/`) with a bespoke, from-scratch front door built on the thesis **"One standard, many engines."** It owns its entire chrome (the homepage renders `children` alone — no shared header/footer), leads above the fold with restrained capability evidence + honest live proof (no giant hero text), presents the divisions as a typographic **editorial directory** rather than cards, and threads an editorial "operating standard" + honest proof + calm FAQ beneath. Merged to `main`, live on Vercel production. The bar is an honest 100/100 — proof over adjectives, restraint as the luxury.

**Architecture:** The server contract is **frozen**. `app/(site)/page.tsx` keeps fetching `getCompanySettings` + `getPublishedDivisions` (coming_soon excluded server-side) + `getHomeFaqs` + `getDivisionLiveStats` in parallel, emitting Organization/WebSite JSON-LD + metadata, and passes **exactly 14 props** to the client. `HubHomeClient.tsx` is rebuilt into a **thin orchestrator** that owns the chrome (header, skip-link, `<main id>`, footer) and composes one section component per spine beat. Each section is its own file under `app/(site)/home/` so nothing balloons. A bespoke `home-motion.ts` supplies the JS-reduced-motion-gated vocabulary; a genuine, restrained R3F ambient layer + 2D particle fallback provides depth. Honesty is structural: every live number flows from `divisionStats[key].metric: string | null` — a component literally cannot render a fabricated count.

**Spine (top→bottom):** chrome → **The Standard** (above-the-fold statement + live aggregate proof rail + one way in + ambient depth) → **The Index of Engines** (the centerpiece: row-based editorial directory, signature hover/preview, each row → its division) → **The Operating Standard** (editorial through-line — why every engine feels the same) → **Proof & Make** (honest signals + the in-house maker's mark) → **Questions** (calm FAQ accordion) → footer.

**Tech Stack:** Next 16 App Router (RSC + server actions), React 19, `framer-motion ^12.35` (JS `useReducedMotion()` gate — the CSS kill-switch does NOT stop framer inline styles), **genuine WebGL via `three ^0.183` + `@react-three/fiber ^9.5` + `@react-three/drei ^10.7`** (restrained, reduced-motion/mobile gated), Tailwind v4 + the existing `--site-*` / `--hc-*` tokens, `@henryco/i18n` (`getHubHomeCopy` static copy + `resolveLocalizedDynamicField` for DB strings). No `next/font` on the public site (CSS font stacks).

**Branch/merge:** Build in an isolated worktree off `origin/main` (owner runs parallel sessions on a shared tree — re-check state before any destructive op, stage files by name). Commits "Hub: <imperative>". Squash PR → `main`; merge is gated on CI green; Vercel auto-deploys `main` to production.

**Prerequisite (hard gate):** Do NOT begin Stage 0 until the Studio `/request` rebuild is **merged to `main` and live on Vercel production**. This plan is the artifact authorized during that wait.

---

## Ground rules / invariants (LOAD-BEARING — verified firsthand; do not regress)

1. **The homepage owns its entire chrome.** `app/components/PublicSiteShell.tsx:107,116-118`: `isHomepage = pathname === "/"` → renders `children` ALONE. No shared `PublicHeader`, no footer, no `<main id>`. The homepage inherits only the `--accent` var, `<PaletteHost/>`, theme/locale providers, and body-level `SupportAssist`/`ConsentNotice`/analytics. **We build header, primary nav, skip-link, `<main>`, and footer ourselves.** This is also the blast-radius guarantee: bespoke chrome here touches no other route. Do NOT retrofit `PublicHeader` (it carries search/breadcrumb baggage built for the non-home branch).
2. **The 14-prop server→client contract is frozen.** The rebuilt `HubHomeClient` MUST accept these verbatim (shape unchanged), or `page.tsx` breaks:
   `brandTitle, brandSub, brandAccent (#C9A227 default), brandLogoUrl (string|null), brandFooterBlurb, intro, initialDivisions (localized, coming_soon excluded), initialFaqs (localized), divisionStats (Record<key, DivisionLiveStat>), hasServerError (boolean), copy (getHubHomeCopy(locale)), locale, accountChip ({user, loginHref, signupHref, accountHref}), heroWelcome (string|null)`.
   We do NOT touch the server fetch, JSON-LD, metadata, or the prop list. New copy is threaded through `copy` (extend the copy model), never by adding props.
3. **Honesty is structural.** `divisionStats[key]` = `{ key, cta, metric: string | null }` (`app/lib/division-stats.ts:4`). `metric` is `null` on any RLS denial / missing env. The UI shows the designed phrase or the CTA verb, **never** a fabricated or zero number. `hasServerError` → render every engine with its verb (graceful, never blank). This is the premium signal — do not add a fake-number fallback.
4. **`coming_soon` divisions are excluded server-side** (`page.tsx:105`). The client never sees them. Design for active operating businesses only; invent no "coming soon" tiles.
5. **Division identity + routing.** Rows read `name`/`tagline`/`accent`/`categories`/`logo_url` from `initialDivisions` (`DivisionRow`, `app/lib/divisions.ts:6`) and `cta`/`metric` from `divisionStats[key]`. Each row links out via `getDivisionUrl(key)` (`packages/config/company.ts:501`) → `https://<subdomain>.<baseDomain>` (dev → `http://<slug>.localhost:3000`). The hub itself is `/` and is NOT an engine row.
6. **All authored copy through the copy model.** `HubHomeCopy` (`packages/i18n/src/hub-home-copy.ts:7`) is a typed object; the EN base defines the type, locale maps deep-merge as **partial** overrides (missing keys fall back to EN — so adding keys to the type + EN base cannot break other locales' typecheck). New section copy = add keys to the type + EN base + FR overrides. The `hardcoded-text-scan` gate fails on new literal UI strings.
7. **No money / pricing / auth / account logic.** Marketing surface only; it links to divisions + account, owns no money path. (Money-truth invariants are absolute — memory `feedback_payments_money_truth`.)
8. **No giant hero text** (memory `feedback_no_giant_hero_text`). Above-the-fold leads with capability evidence (statement + live proof rail), not a viewport-filling headline. Premium = shown capability, not font size.
9. **`packages/search-ui/` is OFF-LIMITS** (memory `feedback_dashboard_search_engine_no_touch`) — quality reference only, never modify.
10. **No edits to shared `globals.css`** beyond additive, homepage-scoped motion/layout utilities. Reuse `--site-*` + `--hc-*`. Do not change shared tokens.

---

## File Structure

**New — all client work co-located under `apps/hub/app/(site)/home/`** (scoped to the public site; nothing leaks to other routes):
- `home-motion.ts` — `useHomeMotion()` + the bespoke variant vocabulary (richer than studio: reveal/rise/stagger/countUp/sweep/magnetic/parallax/ambientDrift; JS reduced-motion gate).
- `home-chrome.tsx` — `HomeHeader` (sticky glass: wordmark, slim scroll-spy nav, account chip, locale, theme; mobile sheet) + skip-link + the `<main id>` wrapper.
- `home-footer.tsx` — full premium footer (engine directory, company pages, legal, socials, brand blurb, locale/theme).
- `home-standard.tsx` — above-the-fold: restrained statement + live aggregate proof rail + one way in.
- `home-ambient.tsx` — depth layer: restrained R3F field (drei) behind The Standard, `HubParticles` 2D fallback, hard reduced-motion/mobile bail.
- `home-index.tsx` — THE centerpiece: row-based engine directory (no cards), signature hover/focus interaction, live stat / CTA verb → `getDivisionUrl`.
- `home-index-row.tsx` — one engine row (extracted so the signature interaction is isolated + testable by `tsc`).
- `home-operating-standard.tsx` — editorial through-line (replaces the value-card grid).
- `home-proof.tsx` — honest live recap + the "built in-house by HenryCo Studio" maker's mark.
- `home-faq.tsx` — calm accordion from `initialFaqs`.

**Changed:**
- `app/(site)/HubHomeClient.tsx` — rebuilt into a thin orchestrator: owns chrome + `<main>`, consumes the 14 props verbatim, composes the section components. The ~2k-line card implementation is replaced wholesale.
- `packages/i18n/src/hub-home-copy.ts` — extend `HubHomeCopy` type + EN base + FR overrides with new section keys (the standard statement, operating-standard prose, proof labels, maker's mark, any new nav/footer labels). Reuse existing keys (`nav`, `directory`, `stats`, `footer`, `faq`) where they already fit.

**Reused untouched:**
- `app/(site)/page.tsx` (server contract), `app/lib/division-stats.ts`, `app/lib/divisions.ts`, `getDivisionUrl` (`packages/config/company.ts`), `app/(site)/HubParticles.tsx` (read for reuse inside `home-ambient`), `resolveLocalizedDynamicField`.

**Never touch:** `packages/search-ui/`, shared `globals.css` tokens, the server fetch / JSON-LD / metadata / 14-prop list, money/auth/account.

---

## Stage 0 — Foundation: bespoke motion vocabulary + copy model

**Files:** Create `app/(site)/home/home-motion.ts`. Modify `packages/i18n/src/hub-home-copy.ts`.

- [ ] **Step 0.1 — `home-motion.ts` (richer than studio's `motion.ts`).** A homepage-specific vocabulary, every variant gated on `useReducedMotion()` (when reduced: `hidden === visible`, durations → 0, elements render final state, zero transform/layout shift). Beyond studio's reveal/messageIn/stagger/countUp, add the interactions the design calls for:

```ts
"use client";
import { useMemo } from "react";
import { useReducedMotion, type Transition, type Variants } from "framer-motion";

const EASE_OUT: Transition["ease"] = [0.22, 1, 0.36, 1];       // standard
const EASE_EMPHASIZED: Transition["ease"] = [0.34, 1.4, 0.64, 1]; // overshoot, for the "crafted" beat

export type HomeMotion = {
  enabled: boolean;
  /** Section/element fade + rise on scroll-reveal. */
  reveal: Variants;
  /** Parent that staggers reveal children (manual delay, not staggerChildren-only). */
  stagger: Variants;
  /** Live proof number recompute / mount pop. */
  countUp: Variants;
  /** Accent hairline that sweeps across on an Index row hover/focus (scaleX 0→1). */
  sweep: Variants;
  /** Magnetic lift for the active Index row (y + subtle scale, emphasized ease). */
  magnetic: Variants;
  /** Ambient depth drift for orbs/particles wrapper (slow, never on reduced-motion). */
  ambientDrift: Variants;
  /** Helper: a per-item reveal transition at a manual incrementing delay. */
  revealAt: (index: number) => Transition;
};

const STAGGER_STEP = 0.06;

export function useHomeMotion(): HomeMotion {
  const reduce = useReducedMotion() ?? false;
  return useMemo(() => {
    const d = (full: number) => (reduce ? 0 : full);
    return {
      enabled: !reduce,
      reveal: {
        hidden: reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 },
        visible: { opacity: 1, y: 0, transition: { duration: d(0.5), ease: EASE_OUT } },
      },
      stagger: { hidden: {}, visible: { transition: { staggerChildren: d(STAGGER_STEP), delayChildren: d(0.04) } } },
      countUp: {
        hidden: reduce ? { opacity: 1, scale: 1 } : { opacity: 0.5, scale: 0.94 },
        visible: { opacity: 1, scale: 1, transition: { duration: d(0.34), ease: EASE_OUT } },
      },
      sweep: {
        rest: { scaleX: reduce ? 1 : 0, opacity: reduce ? 1 : 0 },
        active: { scaleX: 1, opacity: 1, transition: { duration: d(0.32), ease: EASE_EMPHASIZED } },
      },
      magnetic: {
        rest: { y: 0, scale: 1 },
        active: reduce ? { y: 0, scale: 1 } : { y: -2, scale: 1.005, transition: { duration: d(0.26), ease: EASE_EMPHASIZED } },
      },
      ambientDrift: {
        rest: { x: 0, y: 0 },
        drift: reduce ? { x: 0, y: 0 } : { x: [0, 12, -8, 0], y: [0, -10, 6, 0], transition: { duration: 26, repeat: Infinity, ease: "linear" } },
      },
      revealAt: (i: number) => ({ duration: d(0.5), delay: reduce ? 0 : i * STAGGER_STEP, ease: EASE_OUT }),
    };
  }, [reduce]);
}
```

- [ ] **Step 0.2 — Extend the copy model.** In `hub-home-copy.ts`: add keys to the `HubHomeCopy` type and the EN base object, then mirror into the FR override map (other locales fall back to EN via `deepMergeMessages`, so they need no change to typecheck). **Reuse existing sections** where they fit (`nav`, `directory`, `stats`, `footer`, `faq`, `status`); add NEW keys only for genuinely new copy. Proposed additions (calm/premium voice — owner reviews wording):
  - `standard`: `{ statement, sub, ctaPrimary, ctaPrimaryHref?, proofRailLabel }` — the above-the-fold statement + the "one way in" CTA label. No giant headline; a confident operator's sentence.
  - `operatingStandard`: `{ kicker, lead, body }` — the editorial through-line replacing value cards.
  - `proof`: `{ kicker, makersMark }` — honest-signals lead + "Built in-house by HenryCo Studio".
  - `index`: `{ kicker, lead, ariaRowSuffix }` — the Index-of-Engines section header + a11y row label suffix (e.g. "— open {name}"). (Division verbs/metrics come from `divisionStats`, NOT hardcoded here.)
  - Add nav labels for the new scroll-spy targets to the existing `nav` object if missing (e.g. `nav.standard`, `nav.engines`).
- [ ] **Step 0.3 — Verify + commit.** `pnpm --filter @henryco/i18n typecheck` (or workspace typecheck) clean. Commit `Hub: add homepage motion vocabulary + copy-model keys`.

---

## Stage 1 — Bespoke chrome + orchestrator skeleton (the contract guard)

**Files:** Create `home-chrome.tsx`, `home-footer.tsx`. Rebuild `HubHomeClient.tsx` (skeleton only this stage).

- [ ] **Step 1.1 — Pin the contract.** Open the current `HubHomeClient.tsx`, copy its **exact props interface** verbatim into the rebuilt file (all 14 props, exact names/types) before writing any UI — this is the single thing that must not drift. Add a one-line comment: `// 14-prop contract — mirrors app/(site)/page.tsx; do not change shape.` Keep `"use client"`.
- [ ] **Step 1.2 — `home-chrome.tsx`.** Build the sticky glass `HomeHeader` from scratch (the homepage has no shared header):
  - Sticky, `backdrop-blur`, background `--site-header-bg`, hairline bottom border, 64–72px tall, condenses slightly on scroll (`useScroll`/`useMotionValueEvent`, reduced-motion → static).
  - **Left:** wordmark — `brandLogoUrl` image if present, else `brandTitle` as display-serif text.
  - **Center:** slim nav with **scroll-spy** — links to `#standard`, `#engines`, `#standard-why`, plus the existing `(site)/about` + `(site)/contact` routes. Active section gets an accent underline (`sweep`). Labels from `copy.nav`.
  - **Right:** account chip from `accountChip` (signed-in name + `accountHref`, else login/signup), locale switch, theme toggle (reuse the existing hub locale/theme controls — read how the non-home branch wires them).
  - **Mobile:** collapses to a calm full-height sheet (focus-trapped, ESC closes, body scroll lock), not a cramped dropdown.
  - Export the skip-link (`href="#henryco-main"`) and a `<main id="henryco-main" tabIndex={-1}>` wrapper helper so the orchestrator restores a11y/keyboard parity the shared shell would otherwise provide.
- [ ] **Step 1.3 — `home-footer.tsx`.** Full premium footer: the **engine directory** (every division → `getDivisionUrl`, crawlable links for SEO), company pages (About, Contact, Privacy, Terms, Newsletter — link only those that exist under `(site)/`), socials from settings, `brandFooterBlurb`, copyright with `brandTitle`, locale/theme. Copy via `copy.footer` + `copy.companyPages`.
- [ ] **Step 1.4 — Orchestrator skeleton.** Rebuild `HubHomeClient` body: `<HomeHeader … />`, skip-link, `<main id="henryco-main">` containing **placeholder `<section>` slots** (`#standard`, `#engines`, `#standard-why`, proof, faq — empty bordered blocks with their `id`s for now), then `<HomeFooter … />`. Wire `useHomeMotion()` at the top. This stage proves the chrome + the 14-prop contract compile and render before any section work.
- [ ] **Step 1.5 — Verify + commit.** `pnpm --filter @henryco/hub typecheck` + `lint` clean. Manually confirm `page.tsx` still passes exactly the 14 props (no TS error at the call site = contract intact). Commit `Hub: build bespoke homepage chrome + orchestrator skeleton`.

---

## Stage 2 — The Standard (above the fold) + genuine ambient depth

**Files:** Create `home-standard.tsx`, `home-ambient.tsx`. Compose into the orchestrator's `#standard` slot.

- [ ] **Step 2.1 — `home-standard.tsx`.** Above-the-fold, no giant hero:
  - A restrained **statement** (`copy.standard.statement` in display serif, `--acct-font-display`, gravity not size) + a one-line sub.
  - A **live aggregate proof rail** — derived honestly: count of `initialDivisions` ("N divisions"), "Active now" from the division list, plus the strongest real `divisionStats` metrics (products / listings / regions / programs / capabilities) shown in mono (`--hc-font-mono`) like an instrument readout. Each number animates via `countUp` (reduced-motion → static). Any `metric: null` is simply omitted — never a zero.
  - **One way in:** a single primary CTA (`copy.standard.ctaPrimary`) — e.g. jump to `#engines` (the directory) — plus the account chip already in the header. Restraint: one CTA, not a button farm.
  - `heroWelcome` (e.g. "Signed in · {firstName}") shown as a quiet line when present.
  - Reveal cadence: `motion.section` with `reveal`, children at `revealAt(i)`.
- [ ] **Step 2.2 — `home-ambient.tsx` (genuine WebGL, restrained).** A depth layer behind The Standard:
  - **Hard gate first:** if `useReducedMotion()` OR a mobile/`matchMedia` small-viewport check OR `prefers-reduced-data` → render nothing (or a static CSS gradient). Never run R3F on those.
  - When allowed: a **restrained R3F `<Canvas>`** (drei) — slow-drifting points/orbs in the brand palette at low opacity behind the statement, `frameloop="demand"` or low DPR cap, `dpr={[1, 1.5]}`, `pointer-events: none`, `aria-hidden`, positioned `absolute inset-0 -z-10`. NO heavy hero mesh, NO scene that costs LCP/battery. Lazy-load the Canvas (`next/dynamic`, `ssr:false`) so it never blocks first paint or SSR.
  - **Fallback:** reuse `HubParticles` (2D canvas, self-bails on mobile/reduced-motion) as the lighter option if R3F proves heavy. Wrap drift in the `ambientDrift` variant.
  - This is the clearest "far beyond studio" beat — studio shipped zero 3D. Keep it tasteful: depth, not spectacle.
- [ ] **Step 2.3 — Verify + commit.** `typecheck` + `lint` clean. Reduced-motion + mobile bail confirmed by reading the gate (no R3F mounts). Commit `Hub: build The Standard above-the-fold + restrained ambient depth`.

---

## Stage 3 — The Index of Engines (the centerpiece, anti-card)

**Files:** Create `home-index.tsx`, `home-index-row.tsx`. Compose into `#engines`. This is where most of the effort goes — split into structure (3A) then the signature interaction (3B).

- [ ] **Step 3.1 (3A) — Directory structure.** `home-index.tsx`: a full-width **typographic directory**, one row per active engine, stacked with hairline rules — the contents page of a serious annual report / a premium departures board, NOT a grid of boxes.
  - Section header from `copy.index` (kicker + lead).
  - **Order:** intentional registry order (`sort_order` / `is_featured` first from `initialDivisions`), never accidental-alphabetical.
  - Map `initialDivisions` → `<HomeIndexRow>`; pass `division` (name/tagline/accent/categories from `DivisionRow`) + `stat = divisionStats[division.key]` (cta + null-safe metric) + `href = getDivisionUrl(division.key)` + motion + index.
  - **Verb localization:** read how the CURRENT `HubHomeClient` localizes division CTAs and reuse that exact pattern (prefer localized copy; `divisionStats[key].cta` is the English fallback). `metric` always comes from `divisionStats` and is rendered only when non-null. Do not introduce new English literals (hardcoded-text gate).
- [ ] **Step 3.2 — `home-index-row.tsx`.** One row = one large hit-target link to `href`:
  - **Left:** engine `name` (display serif, large but not screaming) with a quiet category/sector tag (`categories[0]`) beneath.
  - **Center:** the one-line `tagline`.
  - **Right (proof slot):** the live `metric` in mono when present ("1,240 products live"), else the action verb ("Book a service"). Right-aligned so proof points form a scannable column.
  - Whole row is the link: `aria-label` = `{name} — {metric ?? cta}{copy.index.ariaRowSuffix}`, visible focus ring, keyboard-navigable.
- [ ] **Step 3.3 (3B) — The signature interaction (precise, not playful).** On hover/focus of a row (`whileHover`/`whileFocus` or controlled `rest`/`active` state):
  - The active row lifts contrast (text → `--site-text`, dim the others slightly for focus-pull).
  - An **accent hairline sweeps in** under the row (`sweep` variant, `transformOrigin: left`, color = the division's `accent` or brand gold).
  - A subtle **magnetic lift** (`magnetic` variant) + an **ambient preview wash** resolves — a low-opacity gradient/sigil tinted by `division.accent` hinting at the world behind the link (use `accent`/`cover_url` if present; never load heavy images eagerly — CSS tint or a tiny blurred layer).
  - **Reduced-motion:** the contrast + accent-color change still applies (it's informative); NO movement/sweep animation (variant collapses to final state).
- [ ] **Step 3.4 — Honesty + resilience.** `metric: null` → verb only, never a zero/fake. `hasServerError === true` → still render every row with verbs (the directory is never blank). Empty `initialDivisions` (shouldn't happen post-fetch) → a calm one-line "Divisions are loading" from copy, not a broken grid.
- [ ] **Step 3.5 — Verify + commit.** `typecheck` + `lint` + `hardcoded-text-scan --check` clean. Tab through every row by keyboard (real links, visible focus). Commit `Hub: build the Index of Engines editorial directory`.

---

## Stage 4 — The Operating Standard (editorial through-line)

**Files:** Create `home-operating-standard.tsx`. Compose into `#standard-why`.

- [ ] **Step 4.1 — Replace the value-card grid with prose + quiet structure.** A single confident editorial statement (`copy.operatingStandard.kicker/lead/body`, display serif lead) explaining *why* every engine feels the same — consistent trust, calm presentation, honest delivery. Supporting structure is a quiet set of typographic points (hairline-separated lines, NOT cards), each a concrete commitment, not an adjective. Generous negative space. Reveal via `reveal` + `stagger`. This is the "nuke the cards" intent applied to the value section.
- [ ] **Step 4.2 — Verify + commit.** `typecheck` + `lint` + hardcoded-text clean. Commit `Hub: build the operating-standard editorial section`.

---

## Stage 5 — Proof & Make

**Files:** Create `home-proof.tsx`. Compose into the proof slot.

- [ ] **Step 5.1 — Honest signals + maker's mark.** A restrained band: an honest live recap (reuse the real aggregates from Stage 2's rail — divisions live, strongest real counts; all null-safe) and the **maker's mark** — `copy.proof.makersMark` ("Built in-house by HenryCo Studio"), optionally linking to the studio division via `getDivisionUrl("studio")`. No testimonials we don't have, no invented logos, no fabricated metrics. The proof is that the numbers are real and the work is in-house.
- [ ] **Step 5.2 — Verify + commit.** `typecheck` + `lint` + hardcoded-text clean. Commit `Hub: build the honest proof + maker's-mark section`.

---

## Stage 6 — Questions (FAQ)

**Files:** Create `home-faq.tsx`. Compose into the faq slot.

- [ ] **Step 6.1 — Calm accordion.** Render `initialFaqs` (already localized server-side) as an accessible accordion: `<button aria-expanded aria-controls>` + region, one open at a time or independent (independent is calmer), keyboard operable, reduced-motion-safe height transition (or instant when reduced). Header from `copy.faq`. If `initialFaqs` is empty, fall back to `copy.faqFallback` (already exists in the copy model). Hairline-separated rows, no cards.
- [ ] **Step 6.2 — Verify + commit.** `typecheck` + `lint` + hardcoded-text clean. Commit `Hub: build the calm FAQ accordion`.

---

## Stage 7 — Choreography, depth & accessibility (the polish that earns 100/100)

**Files:** Touch all `home-*` sections + the orchestrator. No new sections.

- [ ] **Step 7.1 — Scroll choreography.** Wire section reveals on scroll-into-view (framer `whileInView` with `viewport={{ once: true, margin: "-10%" }}`), each section using `reveal`/`stagger`, every animated node rendering its final state under reduced motion (verify by toggling the OS setting / `useReducedMotion` true-path: no transform, no layout shift, content fully present). One — and only one — "crafted" emphasized beat (the Index hover). Everything else calm.
- [ ] **Step 7.2 — Depth & rhythm pass.** Confirm vertical rhythm and generous negative space across the spine; the dark `--site-*` canvas with brand gold (`--hc-accent`) used sparingly (hairlines, active states, proof numbers). No busy backgrounds; ambient stays behind The Standard only.
- [ ] **Step 7.3 — Accessibility / contrast gate.** One `<h1>` (the standard statement); sections use `<h2>`; logical heading order. Full keyboard path: skip-link → header nav → standard CTA → every engine row → operating-standard → proof → faq → footer, all with visible focus. All text/accent pairs meet **AA on the dark canvas** — verify against the **PNH baseline + contrast matrix + headers** gate locally before pushing (this surface is the reason that gate exists). Fix any contrast miss by using the AA-safe accent token, not by lowering the bar.
- [ ] **Step 7.4 — Verify + commit.** `typecheck` + `lint` + `hardcoded-text-scan --check` + `dead-link:check` (every header/footer/index link resolves) clean. Commit `Hub: scroll choreography, depth pass + AA accessibility`.

---

## Stage 8 — Ship

- [ ] **Step 8.1 — Full local gate:** `pnpm --filter @henryco/hub typecheck` + `lint`; `node scripts/v3/hardcoded-text-scan.mjs --check`; `pnpm run dead-link:check`. Fix all. (No unit harness — `tsc` is the proof.)
- [ ] **Step 8.2 — PR:** push the worktree branch, open a **squash** PR → `main`. Title ≤70 chars (e.g. "Hub: rebuild the company homepage — one standard, many engines"). Body: Summary (the thesis + what changed) + Test plan (the local gates + the production-verify note).
- [ ] **Step 8.3 — CI gate:** wait for the **required** "Lint, typecheck, test, build" context green (merge is gated). The dead-link, hardcoded-text, and **PNH contrast/headers** gates must also be green for this surface. Refresh the i18n hardcoded-scan baseline date only if it legitimately trips (recent commits show this maintenance pattern).
- [ ] **Step 8.4 — Preview caveat, stated honestly:** the hub **500s on Vercel preview** (Supabase env production-only). Do NOT claim a green preview as proof. Verify structure/types via the local gates; confirm the live data path (real division counts, engine links, account chip) on **production after merge**.
- [ ] **Step 8.5 — Merge → `main`; confirm Vercel auto-deploys production and `/` is live**, then walk the production page: chrome + scroll-spy, the proof rail shows real numbers, every engine row routes to its division, reduced-motion renders calm, mobile sheet works. Report live URL.

---

## Self-Review

**Spine coverage:** chrome (own header/footer/main) → Stage 1 ✅ · The Standard + ambient → Stage 2 ✅ · Index of Engines (anti-card centerpiece + signature interaction) → Stage 3 (3A structure / 3B interaction) ✅ · Operating Standard (replaces value cards) → Stage 4 ✅ · Proof & maker's mark → Stage 5 ✅ · FAQ → Stage 6 ✅ · choreography + a11y/contrast → Stage 7 ✅ · ship → Stage 8 ✅.

**Why this exceeds studio (not a clone):** genuine R3F ambient depth (studio: none) → Stage 2.2; a bespoke signature row interaction (sweep + magnetic + ambient preview wash) → Stage 3.3; from-scratch chrome the route must own → Stage 1; a richer motion vocabulary (sweep/magnetic/parallax/ambientDrift beyond studio's reveal set) → Stage 0.1; scroll choreography + a dedicated contrast-gate stage → Stage 7. Nine stages (0–8) with the centerpiece split, vs studio's seven.

**Contract & invariants held:** 14-prop interface copied verbatim before any UI (Stage 1.1); server fetch/JSON-LD/metadata/prop-list untouched; new copy threaded through the copy model only (Stage 0.2, never new props); honesty structural — `metric: string | null`, no fabricated numbers, `hasServerError` graceful (Stages 2/3/5); `coming_soon` never rendered; no money/auth/account; no giant hero; `globals.css` tokens + `packages/search-ui/` untouched.

**Type consistency:** `useHomeMotion(): HomeMotion` defined once (0.1), imported by every section; `DivisionRow` (initialDivisions) + `DivisionLiveStat` (divisionStats) are the existing exports reused read-only; `getDivisionUrl(key)` is the only link source; `HubHomeCopy` extended additively so locale maps stay valid via deep-merge.

**Open questions for owner steer (flagged in the design spec §10):** Index-as-directory vs an alternative (full-bleed per-engine panels) — confirm before Stage 3; R3F ambient appetite (restrained depth only) — Stage 2.2; which real numbers headline the proof rail — Stage 2.1; bespoke chrome (not retrofitted `PublicHeader`) — Stage 1; new copy wording — review at Stage 0.2 / 4.1. None block starting Stages 0–1.

**Hard gate:** implementation does not begin until Studio `/request` is merged to `main` + live on production.
