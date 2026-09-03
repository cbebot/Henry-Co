# Henry & Co. Homepage Rebuild — Design Spec

- **Date:** 2026-05-31
- **Status:** Awaiting owner review (no implementation has started — planning artifact written during the Studio `/request` CI/merge window)
- **Surface:** The company homepage — `apps/hub` root route, live at `henrycogroup.com/` (the hub app's `app/(site)/page.tsx` → `HubHomeClient`).
- **Scope anchor (owner directives, verbatim):**
  - "this is the company landing page so you have to use far more effort than this studio work because this will welcome the user."
  - "nuke all those cards, you need a lot of work here, because the homepage is just like a textbook."
  - "build from scratch, arrange the engines, rebuild the full frontend of the page from scratch."
  - "no excuses not to beat this 100/100, be honest, do no nonsense."

This is the company's front door — the first impression that decides how confident a visitor feels before anything else. It is a **structural from-scratch rebuild of one route**, not a cosmetic pass, and it must clear a higher bar than the (already deep) Studio `/request` rebuild.

**Prerequisite (hard gate):** Do NOT begin implementation until the Studio `/request` rebuild is merged to `main` and live on Vercel production. This spec is the planning deliverable the owner authorized writing during that wait.

---

## 1. Why the current homepage reads as "a textbook"

Verified against `apps/hub/app/(site)/HubHomeClient.tsx` (≈2k lines) and the research catalogs:

| Symptom | Root cause |
|---|---|
| **Card-grid everywhere** | Divisions, value props, and ecosystem points are all rendered as the same rounded-surface card. A grid of equal cards reads as a *catalog of equals* — generic, startup-y, no spine. The owner's "nuke all those cards" targets exactly this. |
| **Adjectives where proof belongs** | The fallback content model (`app/lib/homepage.ts`) leads with "Corporate-grade trust", "Scalable publishing model", "Built for structured growth" — claims, not evidence. Premium reads as *shown*, not *asserted*. |
| **No hierarchy** | Every section weighs the same; nothing tells the eye where to go first. A holding group needs a clear spine: standard → engines → proof. |
| **Generic chrome** | The hero/stats/sections feel like a template the divisions were poured into, rather than a bespoke front door built for this company. |

The bones are not the problem — the *data* is excellent (real live counts, real divisions, clean i18n). The **presentation** is textbook. We keep the engine, rebuild the body.

---

## 2. Verified ground truth (the design rests on these facts — all confirmed firsthand)

- **The homepage owns its entire chrome.** `apps/hub/app/components/PublicSiteShell.tsx:107,116-118`: `const isHomepage = pathname === "/"` → renders `children` ALONE. No shared `PublicHeader`, no footer, no `<main id>`. The homepage inherits only: the `--accent` CSS var (= `brand_accent`), `<PaletteHost/>`, theme/locale providers, and body-level `SupportAssist`/`ConsentNotice`/analytics. **We must build header, primary nav, skip-link, `<main>`, and footer ourselves.** This is also the blast-radius guarantee: a bespoke chrome here touches no other route.
- **Sacred server→client contract.** `app/(site)/page.tsx` passes exactly these props to the client; the rebuilt client MUST accept them verbatim (shape unchanged):
  `brandTitle, brandSub, brandAccent (#C9A227 default), brandLogoUrl (string|null), brandFooterBlurb, intro (brand description), initialDivisions (localized, coming_soon already filtered out), initialFaqs (localized), divisionStats (Record<key, DivisionLiveStat>), hasServerError (boolean), copy (getHubHomeCopy(locale)), locale, accountChip ({user, loginHref, signupHref, accountHref}), heroWelcome (string|null)`.
- **Server owns SEO + data.** `page.tsx` emits Organization + WebSite JSON-LD and the page `metadata` (title/description/OG/twitter), fetches `getCompanySettings` + `getPublishedDivisions` + `getHomeFaqs` + `getDivisionLiveStats` in parallel, and localizes every dynamic string via `resolveLocalizedDynamicField` (DeepL). **The rebuild is client-side only** — we do not touch the server fetch, JSON-LD, or metadata except to pass new copy.
- **coming_soon divisions are excluded server-side** (`page.tsx:105`, CHROME-01B FIX 10). The client never sees them. Design for active operating businesses only; do not invent "coming soon" tiles.
- **Honesty is enforced by data.** `getDivisionLiveStats` (`app/lib/division-stats.ts`) returns best-effort anon Supabase counts; on RLS denial it returns `metric: null`. The UI must show the *designed phrase*, never a fabricated number. Real proof points available:
  - Marketplace → "{n} products live" · Property → "{n} curated listings" · Learn → "{n} programs open" · Logistics → "Serving {n} regions" · Studio → "{n} capabilities live".
  - Care, Building, Hotels, Jobs → **no live count** — show the CTA verb only ("Book a service", "Talk to the team", "Plan a stay", "Find work").
  - Page-level aggregates (Divisions / Active now / Sectors served) derive from the division list itself.
- **Divisions + routing.** Divisions come from the DB (`getPublishedDivisions`, type `DivisionRow`), with a static registry fallback in `packages/config/company.ts`. Each division links out to its subdomain via `getDivisionUrl(key)` → `https://<subdomain>.<baseDomain>` (dev → `http://<slug>.localhost:3000`). The hub itself is `/`.
- **Design tokens already exist** (`--site-*`, injected pre-hydration by `HenryCoThemeBlocking`, dark default): bg `#050816`, surface `rgba(255,255,255,.05/.08)`, border `rgba(255,255,255,.10)`, text `#F5F1E8` / soft `#C9C2B6` / muted `#8A857C`, header-bg `rgba(5,8,22,.82)`, accent `#b2863b`; radii `.5→1.5rem`; card-shadow `0 24px 100px rgba(0,0,0,.24)`. Brand gold (shared): `--hc-accent #C9A227` (dark `#D4AF37`). Motion tokens: durations 120/180/260ms; easings `cubic-bezier(.22,1,.36,1)` standard, `cubic-bezier(.34,1.40,.64,1)` emphasized.
- **Type system:** no `next/font` on the public site. CSS stacks: `--acct-font-display` = *Iowan Old Style, Baskerville, Palatino, serif* (our editorial display face), `--acct-font-sans` = system stack (UI), `--hc-font-mono` (stats/labels).
- **Motion + 3D capability.** `framer-motion ^12.35` is the motion library; the gating idiom is JS-level `useReducedMotion()` (the CSS reduced-motion kill-switch does NOT stop framer's inline styles). Stagger is done with **manual incrementing `delay`**, not `staggerChildren`. The hub **already ships real WebGL** — `three ^0.183`, `@react-three/fiber ^9.5`, `@react-three/drei ^10.7` — so genuine 3D ambient depth is available (to be used with restraint and always reduced-motion/mobile gated). Reusable: `HubParticles.tsx` (2D canvas field, self-bails on mobile + reduced-motion), `ThreeHero.tsx` (framer glass panel + blur orbs), `CompanyPageClient.tsx` (editorial-hero motion cadence reference).
- **Verification:** `@henryco/hub` has `typecheck` (`tsc --noEmit`) + `lint` (`eslint .`), **no unit-test harness** — `tsc` is the proof, identical to studio. CI gates that apply: Lint/typecheck/test/build (required), static dead-link scan, i18n hardcoded-text scan, and **PNH baseline + contrast matrix + headers** (a real accessibility/contrast gate — this surface must pass it).
- **Preview-env caveat** (memory `project_henryco_vercel_preview_env_gap`): the hub app **500s on Vercel preview deployments** because Supabase env vars are scoped production-only. Preview cannot fully boot the data path. Flow verification must lean on local reasoning + production-after-merge, not preview. State this explicitly; do not claim a green preview as proof.

---

## 3. The unifying idea

**One standard, many engines.**

Henry & Co. is not a catalog of unrelated businesses — it is *one operating standard* expressed through many divisions. The homepage must say that in its structure, not its adjectives:

1. **The Standard** (above the fold) — a calm, confident statement of what Henry & Co. is, immediately backed by **real, live proof** (aggregate counts pulled from the divisions) and one clear way in. Capability evidence, not headline size.
2. **The Index of Engines** — the divisions, presented as an **editorial directory** (row-based, typographic, departures-board hierarchy), not a card grid. Each engine shows its live proof point or its action verb, and routes to its own world. This is the literal "arrange the engines."
3. **The Operating Standard** — an editorial through-line explaining *why* every engine feels the same: consistent trust, calm presentation, honest delivery. Replaces the value-card grid with a single confident statement + quiet supporting structure.
4. **Proof & Make** — honest signals (live recap, the maker's mark "built in-house by HenryCo Studio"), no fabricated metrics.
5. **Questions** — a calm FAQ accordion from `company_faqs`.

The spine reads top-to-bottom as **standard → engines → why → proof → questions**. Hierarchy is the whole point: the eye always knows what matters most.

---

## 4. Architecture — sections & component tree

All new client work lives under `apps/hub/app/(site)/home/` (co-located with the route, scoped to the public site). `HubHomeClient.tsx` becomes a thin orchestrator that owns the chrome and composes the sections; each section is its own file so no single file balloons.

```
app/(site)/page.tsx           (UNCHANGED server contract — passes the 14 props)
app/(site)/HubHomeClient.tsx  → rebuilt: owns chrome + composes sections, consumes the 14 props verbatim
app/(site)/home/
  home-chrome.tsx             → HomeHeader (sticky glass: wordmark, slim nav, account chip, locale, theme) + skip-link + <main id>
  home-footer.tsx             → full premium footer: engine directory, company pages, legal, socials, brand blurb, locale/theme
  home-standard.tsx           → above-the-fold: restrained statement + live aggregate proof rail + one way in + ambient depth
  home-index.tsx              → THE centerpiece: row-based engine directory (no cards), hover preview, live stat / CTA verb → getDivisionUrl
  home-operating-standard.tsx → editorial through-line (replaces value cards)
  home-proof.tsx              → honest signals + maker's mark
  home-faq.tsx                → calm accordion from initialFaqs
  home-ambient.tsx            → reduced-motion/mobile-gated atmosphere (orbs / particles / optional restrained R3F layer)
  home-motion.ts             → useHomeMotion() + variants (mirrors apps/studio/lib/studio/motion.ts; JS reduced-motion gate)
```

**Chrome details (because the homepage owns it):**
- **Header:** sticky, glass (`--site-header-bg`, backdrop-blur), 64–72px. Left: wordmark (brandTitle as text, brandLogoUrl if present). Center/right: a *slim* nav — "Divisions" (jump to the index), "Standard" (the why), "Contact"/"About" (existing `(site)/contact`, `(site)/about` routes). Far right: account chip (from `accountChip`: signed-in name or login/signup), locale switch, theme toggle. Collapses to a calm sheet on mobile.
- **Skip-link + `<main id="henryco-main" tabIndex={-1}>`** restored (the non-homepage branch has them; the homepage must supply its own for a11y/keyboard parity).
- **Footer:** the engine directory (every division → subdomain), company pages (About, Contact, Privacy, Terms, Newsletter), socials (from settings), brand blurb (`brandFooterBlurb`), copyright, locale/theme. This is also where `getDivisionUrl` links live for SEO/crawlability.

---

## 5. The Index of Engines — the centerpiece (anti-card)

This is where the "nuke the cards" intent is realized and where most of the effort goes.

- **Form:** a full-width, typographic **directory** — one row per engine, stacked with rules/hairlines, like the contents page of a serious annual report or a premium departures board. NOT a grid of boxes.
- **Each row contains:** the engine name (display serif, large but not screaming), a one-line value (the localized `tagline`), and a right-aligned **proof slot** — the live stat ("1,240 products live") when present, else the action verb ("Book a service"). A quiet category/sector tag may sit under the name.
- **Hierarchy:** the eye scans names down the left like an index; proof points align on the right. The rhythm itself communicates "many engines, one standard."
- **Hover/focus (precise, not playful):** the active row lifts its contrast, an accent hairline sweeps in (`--accent`/brand gold), and an ambient preview resolves — a tasteful wash or the division's color/sigil — hinting at the world behind the link. Reduced-motion: the contrast/accent change still applies; no movement.
- **Action:** the whole row is one link to `getDivisionUrl(key)` (opens that division's site). Keyboard-navigable, large hit target, `aria-label` with name + proof.
- **Honesty:** a division with `metric: null` shows its verb, never a zero or a fake count. `hasServerError` → the index still renders every engine with verbs (graceful, never blank).
- **Order:** active engines first; a stable, intentional order (the registry order in `packages/config/company.ts`), not alphabetical-by-accident.

---

## 6. Design language

- **Voice:** calm, concrete, premium. No hype, no fake enthusiasm, no invented product/persona names. Sentences a confident operator would say out loud. Proof over adjectives.
- **Type:** display serif (`--acct-font-display`) for the standard statement, engine names, and section leads — editorial gravity. System sans for nav/body/controls. Mono (`--hc-font-mono`) for live numbers and small labels (gives the proof a "real instrument readout" feel).
- **No giant hero text** (standing directive `feedback_no_giant_hero_text`): the above-the-fold leads with capability evidence — a restrained statement + live proof rail — not a viewport-filling headline. Premium = shown capability, not font size.
- **Color:** the dark `--site-*` palette is the canvas; brand gold (`--hc-accent`) is the single accent, used sparingly (hairlines, active states, the proof numbers). Restraint is the luxury.
- **Space:** generous negative space; the layout breathes. Density only where it earns it (the proof rail, the index).
- **Depth via motion, used with restraint:** ambient orbs / particle field / optional restrained R3F layer in the background of the Standard section, always `useReducedMotion()` + mobile gated (HubParticles already self-bails). Scroll-reveals use manual-stagger fades (the `CompanyPageClient` cadence). Index hover is the one "crafted" interaction. **Never busy. No layout shift.** Every animated node renders its final state when reduced-motion is on.

---

## 7. i18n, honesty & money invariants (held)

- **All authored copy** flows through the existing copy model: extend `getHubHomeCopy(locale)` (`packages/i18n` `hub-home-copy.ts`) with keys for the new sections (chrome nav labels, the standard statement, the operating-standard prose, proof labels, footer). Keep EN + the existing FR map; other locales fall back through the established pipeline. Dynamic DB strings (division name/tagline, FAQ Q&A) stay localized server-side via `resolveLocalizedDynamicField` — unchanged.
- **No fabricated numbers, ever** — `metric: null` → designed phrase. This honesty is the premium signal.
- **No money/pricing/auth changes.** The homepage is marketing surface; it links to divisions and account but owns no money path.
- **No token edits to shared `globals.css`** beyond additive motion/layout utilities — reuse `--site-*` + `--hc-*`.

---

## 8. Accessibility (must pass the PNH contrast/headers gate)

- Own skip-link → `<main id="henryco-main">`; logical heading order (one `<h1>` = the standard statement; sections use `<h2>`).
- All text/accent pairs meet AA on the dark canvas (brand gold text uses the AA-safe `--hc-accent-text` where on light, gold-on-dark `#D4AF37` for accents). Verify against the contrast matrix gate.
- Full keyboard path: header nav → standard CTA → every engine row → footer. Visible focus rings. Index rows are real links.
- `prefers-reduced-motion`: JS-gated (framer) AND honors the CSS kill-switch; no parallax/auto-motion that can't be stopped.

---

## 9. Verification

- `pnpm --filter @henryco/hub typecheck` + `pnpm --filter @henryco/hub lint` clean (tsc is the correctness proof; no unit harness).
- `node scripts/v3/hardcoded-text-scan.mjs --check` — no new hardcoded strings (all copy via the copy model).
- `pnpm run dead-link:check` — every header/footer/index link resolves (engine links via `getDivisionUrl`; company pages exist under `(site)/`).
- **PNH baseline + contrast matrix + headers** gate green — this surface is the reason that gate exists.
- Preview caveat: hub previews 500 (Supabase env production-only). Verify structure/types locally; confirm the live data path on production after merge. Do not present a preview as proof.
- Ship as a squash PR → `main`, commit style "Hub: <imperative>"; Vercel auto-deploys production.

---

## 10. Risks & open questions (for owner steer before/while building)

1. **Index vs. cards — confirm the direction.** This spec replaces the division card grid with a typographic row directory. If the owner pictures something else (e.g., a full-bleed scroll-through, one engine per panel), say so before Stage 3 — it's the highest-leverage decision.
2. **WebGL ambient — how far?** The 3D libs are present. Proposal: restrained ambient depth only (orbs/particles, optional subtle R3F field), never a heavy hero scene that costs LCP or battery. Confirm appetite.
3. **Aggregate proof rail — which numbers above the fold?** Proposal: divisions live + the strongest real counts (products, listings, regions, programs). All honest-null-safe. Owner can pick the headline set.
4. **Scope of chrome reuse.** Proposal: build bespoke `home-chrome`/`home-footer` rather than retrofitting `PublicHeader` (which is built for the non-homepage branch and carries search/breadcrumb baggage). Confirm we're not expected to share that header.
5. **Copy ownership.** New section copy will be drafted in-spec (calm/premium voice) and added to `hub-home-copy.ts`; owner reviews wording at Stage 2/4.

---

## 11. Out of scope

- Server data flow, JSON-LD, metadata, and the division/FAQ/stats fetch (kept verbatim).
- The division subdomain sites themselves (the homepage only links out).
- Pricing, payments, auth, account.
- coming_soon division presentation (excluded server-side by design).
- The non-homepage `(site)/*` pages (about/contact/privacy/etc.) — they keep the shared `PublicSiteShell` chrome; only the homepage owns bespoke chrome.
