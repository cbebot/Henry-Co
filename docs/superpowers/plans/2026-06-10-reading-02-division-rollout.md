# READING-02 Division Rollout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bridge the canonical `--hc-font-*` seam onto every division's public subtree and adopt the editorial reading grammar (`.hc-prose` / `.hc-font-reading` / measure caps) on division long-form pages.

**Architecture:** Each division's `*_PUBLIC_THEME_STYLE` object (which already carries the `next/font` `.variable` classes and `--home-font-*` declarations after PR #260) gains a 3-line re-declaration of `--hc-font-display/-body/-reading` — re-declared *there* because the `:root`-computed `--hc-font-*` tokens freeze their inner `var()` at `:root` (the root-resolution gotcha). Long-form pages then adopt the reading utilities, which resolve to the loaded Fraunces through the bridge. Spec: `docs/v3/reading-02-division-rollout.md`.

**Tech Stack:** Next.js app router, CSS custom properties, `packages/ui/src/styles/globals.css` utilities, pnpm workspace.

**Worktree:** `C:\Users\HP VICTUS\HenryCo\.claude\worktrees\reading-02-division-rollout` (branch `worktree-reading-02-division-rollout` off `main` @ `48ee2b85`). All commands run from the worktree root.

---

## The two reusable code blocks

**THE BRIDGE TRIO** — added inside a `*_PUBLIC_THEME_STYLE` object, immediately after its `["--home-font-display" as string]: …` line:

```ts
  // READING-01 seam bridge: the --hc-font-* tokens compute at :root (their
  // inner var() freezes there), so the canonical seam must be re-declared on
  // THIS element — where the next/font .variable classes live — for .hc-prose /
  // .hc-font-display / .hc-font-reading to render the loaded faces.
  ["--hc-font-display" as string]: "var(--home-font-display)",
  ["--hc-font-body" as string]: "var(--home-font-sans)",
  ["--hc-font-reading" as string]: "var(--home-font-display)",
```

**THE ADOPTION GRAMMAR** — for each target page, classify every *user-visible flowing text block* (skip nav, buttons, forms, badges, tables, metadata):

1. **Long-form flow** (≥2 consecutive paragraphs / legal clauses / narrative
   bodies rendered from one container): put `hc-prose` on the container,
   delete the ad-hoc sizing it replaces (`text-base`, `text-sm`, `leading-*`,
   `max-w-*` on that container/its paragraphs). Never add a `text-*` colour
   class to the container that wasn't already there — ink is host-owned.

   ```tsx
   // BEFORE
   <div className="max-w-2xl space-y-4 text-base leading-[1.7] text-[color:var(--home-ink-70)]">
     <p>{intro}</p>
     <p>{body}</p>
   </div>
   // AFTER  (hc-prose owns measure/size/leading/rhythm; keep the ink class)
   <div className="hc-prose text-[color:var(--home-ink-70)]">
     <p>{intro}</p>
     <p>{body}</p>
   </div>
   ```

   Note: `hc-prose` supplies paragraph rhythm via `> * + *`, so an existing
   `space-y-*` on that container should be dropped too.

2. **Single editorial paragraph that keeps its own tuned size** (section
   intro, FAQ answer, hero sub-copy): add `hc-font-reading text-pretty`, keep
   existing size, ensure a width cap exists (`max-w-prose` or `hc-measure`),
   and apply the **ink-lift**: if its ink class is the app's ink-50/55/60
   equivalent, lift to the ink-70 equivalent (serif reads lighter than sans).

   ```tsx
   // BEFORE
   <p className="mt-4 max-w-prose text-base leading-relaxed text-[color:var(--home-ink-55)]">
   // AFTER
   <p className="hc-font-reading text-pretty mt-4 max-w-prose text-base leading-relaxed text-[color:var(--home-ink-70)]">
   ```

3. **Leave untouched:** kickers/eyebrows, headings (already display-face via
   `--home-font-display` consumers), list-card titles, CTA labels, form
   copy, anything rendered by shared `packages/ui` primitives.

Per-task definition of done: bridge applied + every target page classified
(it is fine for a page to have zero category-1 blocks — record that), app
typecheck + lint green, one commit per app.

---

### Task 1: Fix READING-01 doc-rot in packages/ui

**Files:**
- Modify: `packages/ui/src/styles/globals.css:607-621` (the section header comment)

- [ ] **Step 1: Replace the stale header comment.** The block currently claims
  "The lever is RHYTHM, not the typeface: body letterforms are unchanged" and
  "`.hc-prose` deliberately does NOT set `font-family`" — both false since the
  serif-reading pivot (`.hc-prose` sets `font-family: var(--hc-font-reading)`
  at line 628). Replace lines 607–621 with:

```css
/* ─────────────────────────────────────────────────────────── */
/*  READING-01 — Editorial reading utilities                   */
/*                                                             */
/*  Calm, spacious long-form reading. `.hc-prose` sets the     */
/*  editorial SERIF reading face (--hc-font-reading → the      */
/*  loaded Fraunces where an app bridges the seam) plus        */
/*  measure, size, leading, and automatic paragraph rhythm     */
/*  (the `* + *` owl — no per-paragraph classes). Apply it to  */
/*  a container whose children are flowing block elements      */
/*  (p, h2/h3/h4, ul, ol, blockquote).                         */
/*                                                             */
/*  COLOUR is still inherited, never forced — the host         */
/*  surface owns ink (see the rule inside `.hc-prose`).        */
/* ─────────────────────────────────────────────────────────── */
```

- [ ] **Step 2: Verify nothing else changed.**

Run: `git diff --stat`
Expected: exactly `packages/ui/src/styles/globals.css | 15 +++++++-------` (±line counts)

- [ ] **Step 3: Commit**

```bash
git add packages/ui/src/styles/globals.css
git commit -m "READING-02: fix stale .hc-prose header comment (serif pivot doc-rot)"
```

---

### Task 2: Marketplace — bridge + long-form adoption (reference implementation)

**Files:**
- Modify: `apps/marketplace/components/marketplace/marketplace-public-theme.ts` (~line 44, after `--home-font-display`)
- Modify: `apps/marketplace/app/(public)/policies/[slug]/page.tsx`
- Modify: `apps/marketplace/app/(public)/help/page.tsx`
- Modify: `apps/marketplace/app/(public)/trust/page.tsx`

- [ ] **Step 1: Add THE BRIDGE TRIO** (code block above) to
  `MARKETPLACE_PUBLIC_THEME_STYLE`, immediately after the
  `["--home-font-display" as string]: SERIF_STACK,` line. First confirm the
  Fraunces + Manrope `.variable` classes are applied on the same element as
  this style object (grep the importing shell/layout for `fraunces.variable`).

- [ ] **Step 2: Apply THE ADOPTION GRAMMAR** to the three pages. Known
  hotspots: policies `[slug]/page.tsx` renders clause bodies with
  `max-w-2xl text-base leading-[1.7]` (~line 99) and `max-w-3xl text-sm
  leading-8` (~line 160) → category 1 (`hc-prose`); help/trust section intros
  → category 2.

- [ ] **Step 3: Typecheck + lint**

Run: `pnpm --filter @henryco/marketplace typecheck && pnpm --filter @henryco/marketplace lint`
Expected: both exit 0

- [ ] **Step 4: Commit**

```bash
git add apps/marketplace
git commit -m "READING-02(marketplace): hc-font seam bridge + editorial reading on policies/help/trust"
```

---

### Task 3: Studio — bridge + long-form adoption

**Files:**
- Modify: `apps/studio/components/studio/studio-public-theme.ts` (~line 61, after `--home-font-display`)
- Modify: `apps/studio/app/(public)/about/page.tsx`
- Modify: `apps/studio/app/(public)/faq/page.tsx`
- Modify: `apps/studio/app/(public)/policies/page.tsx`
- Modify: `apps/studio/app/(public)/policies/[slug]/page.tsx`
- Modify: `apps/studio/app/(public)/process/page.tsx`
- Modify: `apps/studio/app/(public)/services/page.tsx`
- Modify: `apps/studio/app/(public)/services/[slug]/page.tsx`
- Modify: `apps/studio/app/(public)/trust/page.tsx`

- [ ] **Step 1: Add THE BRIDGE TRIO** to `STUDIO_PUBLIC_THEME_STYLE` after its
  `["--home-font-display" as string]: SERIF_STACK,` line (keep the existing
  `--font-studio-display` line — `.studio-display`/`.studio-heading` read it
  directly). Confirm the `.variable` classes accompany the style object in
  BOTH mounts: `app/(public)/layout.tsx` AND `app/request/layout.tsx`.

```ts
  // READING-01 seam bridge: the --hc-font-* tokens compute at :root (their
  // inner var() freezes there), so the canonical seam must be re-declared on
  // THIS element — where the next/font .variable classes live — for .hc-prose /
  // .hc-font-display / .hc-font-reading to render the loaded faces.
  ["--hc-font-display" as string]: "var(--home-font-display)",
  ["--hc-font-body" as string]: "var(--home-font-sans)",
  ["--hc-font-reading" as string]: "var(--home-font-display)",
```

- [ ] **Step 2: Apply THE ADOPTION GRAMMAR** to the eight pages. Known
  hotspots: about `text-base leading-[1.7]` (~39), `text-sm leading-7`
  (~79, 91) → category 1 where multi-paragraph; faq answers → category 2.

- [ ] **Step 3: Typecheck + lint**

Run: `pnpm --filter @henryco/studio typecheck && pnpm --filter @henryco/studio lint`
Expected: both exit 0

- [ ] **Step 4: Commit**

```bash
git add apps/studio
git commit -m "READING-02(studio): hc-font seam bridge + editorial reading on public long-form"
```

---

### Task 4: Care — bridge + long-form adoption

**Files:**
- Modify: `apps/care/lib/care-public-theme.ts` (~line 59, after `--home-font-display`)
- Modify: `apps/care/app/(public)/about/page.tsx`
- Modify: `apps/care/app/(public)/services/page.tsx`
- Modify: `apps/care/app/(public)/pricing/page.tsx`

- [ ] **Step 1: Add THE BRIDGE TRIO** to `CARE_PUBLIC_THEME_STYLE` after the
  `["--home-font-display" as string]: SERIF_STACK,` line. **Keep** the
  existing `["--font-display" as string]: SERIF_STACK,` line — care's own CSS
  consumes `var(--font-display)` directly per-element, which resolves fine;
  only the `--hc-font-*` tokens need the re-declaration.

```ts
  // READING-01 seam bridge: the --hc-font-* tokens compute at :root (their
  // inner var() freezes there), so the canonical seam must be re-declared on
  // THIS element — where the next/font .variable classes live — for .hc-prose /
  // .hc-font-display / .hc-font-reading to render the loaded faces.
  ["--hc-font-display" as string]: "var(--home-font-display)",
  ["--hc-font-body" as string]: "var(--home-font-sans)",
  ["--hc-font-reading" as string]: "var(--home-font-display)",
```

- [ ] **Step 2: Apply THE ADOPTION GRAMMAR** to the three pages (category 1
  for multi-paragraph narratives, category 2 + ink-lift for section intros).

- [ ] **Step 3: Typecheck + lint**

Run: `pnpm --filter @henryco/care typecheck && pnpm --filter @henryco/care lint`
Expected: both exit 0

- [ ] **Step 4: Commit**

```bash
git add apps/care
git commit -m "READING-02(care): hc-font seam bridge + editorial reading on about/services/pricing"
```

---

### Task 5: Learn — bridge + long-form adoption

**Files:**
- Modify: `apps/learn/components/learn/learn-public-theme.ts` (~line 63, after `--home-font-display`)
- Modify: `apps/learn/app/(public)/help/page.tsx`
- Modify: `apps/learn/app/(public)/academy/page.tsx`
- Modify: `apps/learn/app/(public)/trust/page.tsx`

- [ ] **Step 1: Add THE BRIDGE TRIO** to `LEARN_PUBLIC_THEME_STYLE` after its
  `["--home-font-display" as string]: SERIF_STACK,` line.

```ts
  // READING-01 seam bridge: the --hc-font-* tokens compute at :root (their
  // inner var() freezes there), so the canonical seam must be re-declared on
  // THIS element — where the next/font .variable classes live — for .hc-prose /
  // .hc-font-display / .hc-font-reading to render the loaded faces.
  ["--hc-font-display" as string]: "var(--home-font-display)",
  ["--hc-font-body" as string]: "var(--home-font-sans)",
  ["--hc-font-reading" as string]: "var(--home-font-display)",
```

- [ ] **Step 2: Apply THE ADOPTION GRAMMAR** to the three pages. Keep the
  functional sequencing copy ("Lessons unlock in sequence…") byte-identical —
  this increment changes zero strings.

- [ ] **Step 3: Typecheck + lint**

Run: `pnpm --filter @henryco/learn typecheck && pnpm --filter @henryco/learn lint`
Expected: both exit 0

- [ ] **Step 4: Commit**

```bash
git add apps/learn
git commit -m "READING-02(learn): hc-font seam bridge + editorial reading on help/academy/trust"
```

---

### Task 6: Property — bridge + long-form adoption

**Files:**
- Modify: `apps/property/components/property/property-public-theme.ts` (~line 48, after `--home-font-display`)
- Modify: `apps/property/app/(public)/faq/page.tsx`
- Modify: `apps/property/app/(public)/trust/page.tsx`

- [ ] **Step 1: Add THE BRIDGE TRIO** to `PROPERTY_PUBLIC_THEME_STYLE` after
  its `["--home-font-display" as string]: SERIF_STACK,` line.

```ts
  // READING-01 seam bridge: the --hc-font-* tokens compute at :root (their
  // inner var() freezes there), so the canonical seam must be re-declared on
  // THIS element — where the next/font .variable classes live — for .hc-prose /
  // .hc-font-display / .hc-font-reading to render the loaded faces.
  ["--hc-font-display" as string]: "var(--home-font-display)",
  ["--hc-font-body" as string]: "var(--home-font-sans)",
  ["--hc-font-reading" as string]: "var(--home-font-display)",
```

- [ ] **Step 2: Apply THE ADOPTION GRAMMAR** to faq + trust (FAQ answers =
  category 2 + ink-lift; any multi-paragraph trust narrative = category 1).

- [ ] **Step 3: Typecheck + lint**

Run: `pnpm --filter @henryco/property typecheck && pnpm --filter @henryco/property lint`
Expected: both exit 0

- [ ] **Step 4: Commit**

```bash
git add apps/property
git commit -m "READING-02(property): hc-font seam bridge + editorial reading on faq/trust"
```

---

### Task 7: Jobs — bridge + long-form adoption

**Files:**
- Modify: `apps/jobs/components/jobs-public-theme.ts` (~line 68, after `--home-font-display`)
- Modify: `apps/jobs/app/help/page.tsx`
- Modify: `apps/jobs/app/trust/page.tsx`
- Modify: `apps/jobs/app/careers/page.tsx`

- [ ] **Step 1: Add THE BRIDGE TRIO** to the jobs public theme style after its
  `["--home-font-display" as string]: SERIF_STACK,` line (keep the existing
  `--font-jobs-display` pointing — same pattern as studio's local var).

```ts
  // READING-01 seam bridge: the --hc-font-* tokens compute at :root (their
  // inner var() freezes there), so the canonical seam must be re-declared on
  // THIS element — where the next/font .variable classes live — for .hc-prose /
  // .hc-font-display / .hc-font-reading to render the loaded faces.
  ["--hc-font-display" as string]: "var(--home-font-display)",
  ["--hc-font-body" as string]: "var(--home-font-sans)",
  ["--hc-font-reading" as string]: "var(--home-font-display)",
```

  Jobs' help/trust/careers routes are NOT under a `(public)` group — verify
  each page renders inside the shell that applies the theme style (grep for
  the public shell import); if a page is outside the themed subtree, bridge
  coverage must be confirmed before adopting reading classes there (otherwise
  `.hc-prose` falls back to the system serif — acceptable, but record it).

- [ ] **Step 2: Apply THE ADOPTION GRAMMAR** to the three pages.

- [ ] **Step 3: Typecheck + lint**

Run: `pnpm --filter @henryco/jobs typecheck && pnpm --filter @henryco/jobs lint`
Expected: both exit 0

- [ ] **Step 4: Commit**

```bash
git add apps/jobs
git commit -m "READING-02(jobs): hc-font seam bridge + editorial reading on help/trust/careers"
```

---

### Task 8: Logistics — normalize bridge + long-form adoption

**Files:**
- Modify: `apps/logistics/lib/logistics-public-theme.ts:74` (existing `--hc-font-display` line)
- Modify: `apps/logistics/app/(public)/support/page.tsx`
- Modify: `apps/logistics/app/(public)/coverage/page.tsx`

- [ ] **Step 1: Normalize the existing bridge.** Line 74 already declares
  `["--hc-font-display" as string]: SERIF_STACK` — replace that single line
  with the full trio in the canonical `var(--home-font-display)` form (keep
  its preceding `.log-pf` comment):

```ts
  // The portal `.log-pf` module renders its serif via --hc-font-display; re-point
  // it at Fraunces so the home + track editorial headings adopt the shared face.
  // READING-01 seam bridge: the --hc-font-* tokens compute at :root (their
  // inner var() freezes there), so the canonical seam must be re-declared on
  // THIS element — where the next/font .variable classes live — for .hc-prose /
  // .hc-font-display / .hc-font-reading to render the loaded faces.
  ["--hc-font-display" as string]: "var(--home-font-display)",
  ["--hc-font-body" as string]: "var(--home-font-sans)",
  ["--hc-font-reading" as string]: "var(--home-font-display)",
```

- [ ] **Step 2: Apply THE ADOPTION GRAMMAR** to support + coverage.

- [ ] **Step 3: Typecheck + lint**

Run: `pnpm --filter @henryco/logistics typecheck && pnpm --filter @henryco/logistics lint`
Expected: both exit 0

- [ ] **Step 4: Commit**

```bash
git add apps/logistics
git commit -m "READING-02(logistics): normalize hc-font seam bridge + editorial reading on support/coverage"
```

---

### Task 9: Visual proof harness (both themes, all divisions)

**Files:**
- Create: `.codex-temp/reading-02/harness.html`
- Create: `.codex-temp/reading-02/shoot.cjs`

- [ ] **Step 1: Build a static harness** that imports the REAL
  `packages/ui/src/styles/globals.css`, declares the per-division
  `--home-font-display`/`--home-font-sans` + THE BRIDGE TRIO inline on a
  wrapper per division (mirroring each theme object), loads Fraunces +
  Manrope from Google Fonts CDN (stand-in for next/font — same families), and
  renders for each of the 7 divisions: an `.hc-prose` legal panel + an
  `hc-font-reading text-pretty` intro panel, on a light card and a dark
  (`.dark`) card. (Pattern: `.codex-temp/reading-foundation/` from READING-01,
  which is proven on this machine with installed `@playwright/test` +
  chromium.)

- [ ] **Step 2: Screenshot.** `shoot.cjs` launches headless chromium, loads
  `harness.html`, waits for `document.fonts.ready`, captures
  `reading-02-divisions.png` (full page).

Run: `node .codex-temp/reading-02/shoot.cjs`
Expected: PNG written; visually confirm (Read the PNG): serif reading face on
every division panel (NOT a system serif — Fraunces has a distinctive
single-story g), no invisible text on the dark cards, measure ≈66ch.

- [ ] **Step 3: Do not commit `.codex-temp`** (gitignored working artifacts);
  reference the PNG in the PR body via the verification note.

---

### Task 10: Gates, push, PR

- [ ] **Step 1: String-change guard.** This increment must change ZERO strings:

Run: `git diff main --stat -- packages/i18n` → expected: empty
Run: `pnpm i18n:check` → expected: exit 0 (no new gaps)

- [ ] **Step 2: Full diff review.** `git diff main --stat` — confirm only:
  `packages/ui/src/styles/globals.css`, 7 theme files, the 22 target pages,
  2 docs, this plan. ZERO diffs under any `(staff)`, `workspace`, `admin`,
  `dashboard` path or `packages/search-ui`.

- [ ] **Step 3: Push + PR**

```bash
git push -u origin worktree-reading-02-division-rollout
gh pr create --title "READING-02: division reading rollout — hc-font seam bridge + editorial long-form rhythm" --body "<summary per PR template: what/why, the root-resolution gotcha, adoption grammar, verification incl. harness PNG + both-theme audit, out-of-scope pointer to docs/v3/typography-language-ecosystem-findings.md §5>"
```

Expected: PR opens against main; the required "Lint, typecheck, test, build" check runs (~15m).
