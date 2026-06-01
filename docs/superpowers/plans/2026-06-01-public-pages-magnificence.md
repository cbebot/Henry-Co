# Public Pages Magnificence — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan stage-by-stage (inline, single session, per-stage commit checkpoints). Steps use checkbox (`- [ ]`) syntax for tracking. This is coupled frontend craft work — execute inline, not via parallel subagents.

**Goal:** Rebuild the Henry & Co. **hub** public pages (homepage + every `(site)` route) and the **care** `/book` page into a premium, accessible, "magnificent" experience — while preserving every backend/data/routing/i18n contract.

**Architecture:** Audit-first, then surgical rebuild in 5 commit-sized stages (A→B→C→D→E). Foundation tokens first, then the shared chrome both surfaces sit on, then the flagship homepage, then the editorial sub-pages, then the independent care booking flow. Each stage is `tsc`/lint-verified and committed independently so the branch is always shippable and resumable.

**Tech Stack:** Next.js App Router, React 19, Tailwind CSS v4, framer-motion, pnpm@9.15.5 workspace, `@henryco/i18n` (12-locale DeepL pipeline), `@henryco/ui` (`public-shell`), `@henryco/config`, Supabase (SSR).

**Worktree / branch:** `rebuild/public-pages-magnificent` (off `origin/main` @ `715b8dc4`) at `.claude/worktrees/public-pages-magnificent`.

**Owner decisions (locked):** Chrome = **scroll-aware condense** (roomy/transparent at top → slim solid blurred bar on scroll, always visible; unify the two headers + two footers into one). Sequence = **A → B → C → D → E**, commit per stage. Verification = **code-level** (owner does visual review; I run `tsc`/lint).

---

## Design language (constraints every stage honors)

**Hub public site (Stages A–D):** dark navy base `#050816`, gold accent `var(--accent)` `#C9A227`. Capability-evidence-forward — **no giant hero text** (h1 caps well below filling the viewport; substance above the fold). Editorial hierarchy — rows, hairlines, prose, typographic rhythm, varied structure — **never** equal card grids or "long-card" footers. All user-facing strings flow through `@henryco/i18n` copy.

**Care `/book` (Stage E):** light airy base `--care-bg #eef2fb`, **cobalt** `--care-accent #6b7cff` + **teal** `--care-accent-secondary #33d3c7`, deep navy ink, soft glassy surfaces, serif display font. Gold reserved for focus ring/chips only. Use the existing `.care-*` primitives. **Remove off-brand emerald.**

---

## Non-negotiable preserves (ALL stages — do not break)

- **Contact server action** `submitContactMessage` (`(site)/contact/actions.ts`): validation + HTML-escaping + `sendTransactionalEmail` routing + 3 result states (sent/skipped/error).
- **Care booking server action** `createPublicBookingAction` (`care/app/(public)/book/actions.ts`). The page submits here — **not** the `/api/care/book*` REST routes (legacy; leave untouched). Preserve verbatim: 8 named inputs (`customer_name, phone, email, pickup_address, return_address, pickup_date, pickup_slot, special_instructions`) + 4 hidden JSON fields (`booking_mode, selected_items_json, service_booking_json, payment_plan`); server-side required validation; dual quote recompute (`calculateCleaningQuote`; treatment 500/1000/700; urgent `round(base*0.2)`); the `[service_booking]` marker; the email/WhatsApp/staff side-effect fan-out; the terminal `/track?code=…&booked=1&phone=…` redirect; `revalidate=60`; localized `generateMetadata`; `getBookingIdentity` prefill + saved addresses.
- **Newsletter/preferences APIs:** `/api/newsletter/subscribe` payload + suppression + consent gate; `/api/newsletter/preferences` PATCH (pause vs unsubscribe distinction, token); `unsubscribeByToken`; `loadPreferencesByToken` 3-state branching.
- **Company-pages resilience:** `getCompanyPage` + `Promise.allSettled` + `createFallbackCompanyPage` static fallback (preview-env survival); `localizeCompanyPage` SSR translation; realtime `company_pages` subscription.
- **Preferences consent persistence:** dual localStorage (`henryco-ecosystem-consent`) + shared-domain cookie (`henryco_ecosystem_consent`) via `getSharedCookieDomain`; the `/api/locale` → `/api/profile/update` ordering; RTL + `next-themes` wiring.
- **Search:** `getHubPublicChipUser` → locked-results auth gate + sign-in href. The `@henryco/ui` `CrossDivisionSearchExperience` and `packages/search-ui/` are **owner-reserved** — page-level metadata only, never restyle the experience.
- **Legal content:** every clause + section **anchor ID** in `company-pages.ts` (privacy 17 sections, terms 25 sections). Rebuild the *rendering*, never the wording.
- Routing, `force-dynamic`/`revalidate` directives, and division data fetching across all pages.

## Per-stage verify gate

1. Typecheck the touched app(s): `pnpm -C apps/hub exec tsc --noEmit` (and `apps/care` for Stage E; `packages/ui` build for Stage B).
2. Lint the touched app(s): `pnpm -C apps/hub run lint` (confirm script name; fall back to `pnpm -C apps/hub exec eslint .`).
3. Self-review the diff against this plan's preserve list + design language.
4. Commit (do NOT push unless asked). Conventional message, end with the Claude co-author trailer.

---

### Stage A — Foundation (lean, low-risk, high-leverage)

**Why first:** establishes the AA-tuned text-token scale that C & D apply, and clears two correctness defects (broken canonical, raw HTML-entity literals) cheaply and globally.

**Files:**
- Modify: `apps/hub/app/globals.css` (add `--site-*` token scale)
- Modify (canonical): `apps/hub/app/(site)/about/page.tsx`, `contact/page.tsx`, `privacy/page.tsx`, `terms/page.tsx`, `search/page.tsx`, `newsletter/page.tsx`, `newsletter/preferences/page.tsx`, `newsletter/unsubscribe/page.tsx`, `preferences/page.tsx`
- Modify (entity bugs): `apps/hub/app/(site)/newsletter/NewsletterSignupClient.tsx`, `apps/hub/app/(site)/newsletter/preferences/NewsletterPreferencesClient.tsx`, `apps/hub/app/(site)/preferences/page.tsx`

- [ ] **A1 — AA text-token scale.** In `apps/hub/app/globals.css` `:root`, define tokens tuned for white-on-`#050816` (computed contrast vs `#050816`):
  ```css
  :root {
    --site-bg: #050816;
    --site-text: rgba(255, 255, 255, 0.96);        /* ~18:1  — headings/primary */
    --site-text-soft: rgba(255, 255, 255, 0.74);   /* ~9.5:1 — body */
    --site-text-muted: rgba(255, 255, 255, 0.64);  /* ~7:1   — meta/eyebrows/labels (passes AA at ≤12px) */
    --site-line: rgba(255, 255, 255, 0.12);
    --site-line-strong: rgba(255, 255, 255, 0.20);
    --site-header-bg: rgba(5, 8, 22, 0.85);
    --site-footer-bg: rgba(0, 0, 0, 0.22);
  }
  ```
  (These back-fill the `var(--site-text-soft, …)` references already present in `PublicSiteShell`/`public-header`. Application of the tokens to ad-hoc `text-white/45…/68` happens in C & D where markup is being rebuilt anyway.)
- [ ] **A2 — Per-page canonical (fixes CC-1).** Each sub-page currently inherits `canonical = "/"` from `(site)/layout.tsx`. Add an explicit `alternates: { canonical: "<path>" }` (and `openGraph.url: "<path>"`) to each page's `metadata`/`generateMetadata`: `/about`, `/contact`, `/privacy`, `/terms`, `/search`, `/newsletter`, `/newsletter/preferences`, `/newsletter/unsubscribe`, `/preferences`. For token-gated/transactional pages (`/newsletter/preferences`, `/newsletter/unsubscribe`, `/preferences`, `/search`) also add `robots: { index: false, follow: true }`.
- [ ] **A3 — Entity-literal fixes.** Replace raw `&rsquo;`/`&ldquo;`/`&rdquo;` sequences rendered inside JSX `{…}` expressions with real characters (`’`/`“`/`”`) or `{"'"}`. Known sites: `NewsletterSignupClient.tsx:~107` (`You&rsquo;re subscribed`), `NewsletterPreferencesClient.tsx:~183`, `preferences/page.tsx:~31,~183`. Grep `&rsquo;|&ldquo;|&rdquo;` under `(site)/` to catch all.
- [ ] **A4 — Verify + commit.** `pnpm -C apps/hub exec tsc --noEmit` (expect clean); lint; commit `feat(hub-public): A — AA text tokens, per-page canonical, entity-literal fixes`.

---

### Stage B — Chrome unification (owner's #2 ask)

**Why second:** the homepage and sub-pages both render inside this chrome; unifying it now means C & D build on one source of truth.

**Current state:** Two headers — homepage bespoke `TopBar` (`HubHomeClient.tsx:1249`, `sticky top-0 z-40`, + mobile chip-rail) and shared `PublicHeader` (`packages/ui/src/public-shell/public-header.tsx`, `sticky top-0 z-50`, BottomSheet drawer). Two footers — homepage `PageFooter` (`HubHomeClient.tsx:1378`) and shared `PublicSiteShell` footer (`PublicSiteShell.tsx:190`). `PublicSiteShell.tsx:116` bypasses the shell chrome on `isHomepage`.

**Target:** ONE scroll-aware condensing chrome on every public page (homepage included), and ONE editorial footer. Preserve the shared header's a11y (`SkipLink`, `aria-controls/expanded/current`, BottomSheet focus-trap), nav config (`getSiteNavigationConfig("hub")`), account chip, and i18n.

**Stage brief (expanded into bite-sized steps at execution):**
- [ ] **B1** — Add scroll-aware condense behavior to the shared `PublicHeader` (or a hub wrapper): a `useScrollCondensed()` hook (passive scroll listener, `requestAnimationFrame`, gated on a threshold ~24px; respect `prefers-reduced-motion` by snapping). At top: taller, transparent/low-chrome. Scrolled: slim, solid `--site-header-bg`, `backdrop-blur`, hairline border. CSS transitions only (no layout-shifting); keep `sticky top-0`.
- [ ] **B2** — Make the homepage use the shared chrome: in `PublicSiteShell.tsx`, stop bypassing on `isHomepage` for the header/footer; pass the homepage's nav links/CTAs through the shared `PublicHeader` props. Retire `TopBar`/`PageFooter` from `HubHomeClient` (or reduce `HubHomeClient` to page body only). Carry over the homepage's mobile section chip-rail as an optional `prepend`/`afterBrand` slot if still wanted.
- [ ] **B3** — Unify the footer: one editorial footer (rows + hairlines + prose, not a 3/4-col card block), token-driven, used everywhere. Reconcile the two footers' link sets (Company / Henry & Co. / Legal + contact).
- [ ] **B4** — Verify (`tsc` hub + `packages/ui` build) + lint + commit `feat(hub-public): B — unified scroll-aware chrome + single editorial footer`.

---

### Stage C — Homepage (flagship)

**Files:** `apps/hub/app/(site)/HubHomeClient.tsx` (2303 lines), `apps/hub/app/(site)/HubParticles.tsx`, `apps/hub/app/components/ThreeHero.tsx` (remove — dead), `apps/hub/app/(site)/page.tsx` (server, untouched data).

**Stage brief:**
- [ ] **C1** — Migrate ad-hoc `text-white/45…/68` → `--site-text(-soft/-muted)` tokens throughout (contrast pass).
- [ ] **C2** — Hero refinement: cap the `lg:text-[4.75rem]` h1 to a measured scale (e.g. `clamp` topping ~`3.2rem`) while keeping the evidence-forward layout (divisions grid + stat rail). Tighten copy/CTA hierarchy.
- [ ] **C3** — Perf: lazy-load `HubParticles` via `next/dynamic({ ssr: false })`; delete unused `ThreeHero.tsx` (imported nowhere).
- [ ] **C4** — Editorial polish: richer section rhythm/transitions; ensure each section reads as varied editorial hierarchy (already strong — enhance, don't churn). Elevate the homepage footer per Stage B.
- [ ] **C5** — Verify + commit `feat(hub-public): C — homepage magnificence (contrast, hero, perf, editorial)`.

---

### Stage D — Sub-pages editorial rebuild

**D1 — privacy + terms (biggest move).** Files: `(site)/privacy/page.tsx`, `(site)/terms/page.tsx`, `apps/hub/app/components/SectionBlock.tsx` (+ a new legal-renderer). Replace the `SectionBlock` equal-card grid (80+ cards) with numbered legal editorial hierarchy: serif section numerals, hairline definition tables (term | detail) for lawful-bases/categories/sub-processors/retention, a **promoted "— In plain English" callout** treatment (left gold hairline), and a **sticky ToC** with active-section tracking. Preserve every clause + anchor ID. Add `PrivacyPolicy`/`BreadcrumbList` JSON-LD.

**D2 — about + contact.** Files: `(site)/about/page.tsx`, `AboutHonestBlock.tsx`, `CompanyPageClient.tsx`, `(site)/contact/page.tsx`, `ContactHeroForm.tsx`, `ContactHeroLayout.tsx`. About: replace the dashed empty-avatar founder placeholder + `"—"` fallbacks; rebuild "By the numbers" as a hairline stat ledger; lead with operating-standard evidence. Contact: add explicit `id`+`htmlFor` + `aria-describedby` per field (preserve the server action); turn the hero bullets into a "how to reach us" inbox ledger from `LEGAL.contacts`. Add `AboutPage`/`ContactPage` JSON-LD.

**D3 — newsletter family + preferences.** Files: `(site)/newsletter/*`, `(site)/preferences/*`. Extract all hardcoded strings into `@henryco/i18n` (new `hubNewsletter` block) and convert static `metadata` → localized `generateMetadata` (CC-6); use `/newsletter/unsubscribe` as the reference pattern. Fix `PreferenceCard` a11y (`role="switch"` + `aria-checked` + visible focus ring). Make "What we promise" a hairline manifesto; preferences → calm single-column editorial ledger. Preserve all API/consent contracts.

**D4 — search (metadata only).** File: `(site)/search/page.tsx`. Convert `metadata` → localized `generateMetadata` through `getHubPublicCopy`; `robots: noindex`. Do NOT touch the reserved search experience component.

- [ ] Each of D1–D4: verify + commit separately (`feat(hub-public): D1 …` etc.).

---

### Stage E — Care `/book` (care brand)

**Files:** `apps/care/components/care/BookPickupForm.tsx` (2066 lines — salvage all logic), `apps/care/app/(public)/book/page.tsx`, new components (`BookingStepper`, `BookingSummaryRail`, `BookingMobileActionBar`, `CareField`, restyled `ModeCard`/`ServiceTypeCard`/`PackageCard`/`AddonCard`, `TrustBlock`). Reuse: `createPublicBookingAction`, `BookingSuccessNotice`, `PendingSubmitButton`, `calculateCleaningQuote`, `normalizeCleaningBookingPayload`, care `.care-*` primitives.

**Stage brief (presentation + orchestration rewrite around the §preserve contract):**
- [ ] **E1** — Care-token editorial frame + drop the giant glass form-card; adopt `.care-card`/`.care-input`/`.care-button-*`; remove emerald → cobalt/teal selection states.
- [ ] **E2** — 3-step flow (Choose service → Details & options → Review & submit) via client step state, **single `<form>`** with all named inputs + 4 hidden JSON fields always in the DOM at submit. `BookingStepper` header (cobalt active / teal complete / gold focus).
- [ ] **E3** — Sticky `BookingSummaryRail` (≥lg, live total + CTA) + `BookingMobileActionBar` (`env(safe-area-inset-bottom)`).
- [ ] **E4** — A11y: `CareField` enforces `<label htmlFor>` + required mark + `aria-invalid`/`aria-describedby`; `MessageCard` → `role="alert"` + focus on error; `BookingSuccessNotice` → `role="status"`. Fix placeholder/`zinc-400` contrast at the token level.
- [ ] **E5** — Trust block (reviews/guarantees) near CTA. Replace the fragile `useEffect` cascade with derived state/reducer producing the **same** hidden-JSON payloads.
- [ ] **E6** — Verify (`pnpm -C apps/care exec tsc --noEmit` + lint) + a guard test asserting the rendered form still contains all 8 named + 4 hidden field names; commit `feat(care): E — premium care-branded /book booking flow`.

---

## Self-review log
- Spec coverage: A (tokens/canonical/entities) ✓, B (chrome) ✓, C (homepage) ✓, D1–D4 (sub-pages) ✓, E (care book) ✓ — all owner-requested surfaces mapped.
- Each stage has explicit files, concrete moves grounded in the audits, a verify gate, and a commit.
- Preserve list is centralized and referenced by every stage.
