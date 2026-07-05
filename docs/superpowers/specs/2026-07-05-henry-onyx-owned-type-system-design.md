# Henry Onyx Owned Type System — Design Spec

- **Status:** Draft for owner review
- **Date:** 2026-07-05
- **Base branch:** `onyx/owned-type-system` (off `origin/main` @ `c86c338e`)
- **Program owner:** Henry Chukwuemeka
- **Author:** Claude (Opus 4.8)

---

## 1. Purpose

Give Henry Onyx a **proprietary, owned typographic system** that renders in every
product surface — web, native, and rendered-outside-the-DOM (social images, email,
PDF) — so that **no default or system font ever appears in the product again**, in
any language. The type is part of how customers recognise us: it must be
self-hosted (we own the files), consistent across all apps, and used as a real
typographic *system* (roles + scale), not "one font everywhere".

The identity is a **commissioned bespoke superfamily** — a custom-drawn serif, sans,
and mono. Because the drawing takes months, the engineering is built **now** behind
a flag and the visible identity is **revealed** in one moment when the faces arrive.

### The hard promise
> **Not one letter of any alphabet falls back to the old/system style.**

This spec treats that promise as a machine-verified invariant, not an aspiration
(see §4).

---

## 2. Verified starting reality (2026-07-05)

Audited on the repo directly. Several premises from the original brief were **wrong**
and are corrected here so we build on truth.

**The seam exists and is coherent.** `packages/ui/src/styles/globals.css` defines
`--hc-font-body` (:189), `--hc-font-display` (:190), `--hc-font-reading` (:195 =
`var(--font-reading, var(--hc-font-display))`), `--hc-font-mono` (:350). `.hc-prose`
(:627) sets `font-family: var(--hc-font-reading)` and **never sets colour** (ink is
inherited — deliberate, so it is safe on any background).

**Only the *reading* leg is unwired.** `--font-reading` is set by **zero** apps
(0 definitions repo-wide), so reading prose currently falls through to the display
serif. The `--font-display` / `--font-body` legs *are* wired in several apps.

**There are 10 Next.js apps, not 13.** `apps/cms`, `apps/work`, `apps/command` **do
not exist**. The web apps are: `account`, `care`, `hub`, `jobs`, `learn`,
`logistics`, `marketplace`, `property`, `staff`, `studio`. Two more apps are
**Expo/React Native**: `company-hub`, `super-app`. **All 10 web apps already import
the UI globals** (each app's `globals.css:2` `@import`s it), so the seam/`.hc-prose`
is present everywhere — no app is missing it.

**Fonts today are inconsistent and mostly not owned.** Only `property` self-hosts
(2 local woff2, the sole `next/font/local` user). 5 apps hit the Google CDN via
`next/font/google` (marketplace=Fraunces+Manrope, jobs=Newsreader+Manrope,
studio=Space Grotesk+Plus Jakarta Sans, logistics=Manrope, hub=Fraunces+Manrope).
4 apps load no webfont at all (account, care, learn, staff → system stacks). There
is **no shared font package**.

**A real bug to fix en route.** `apps/studio/app/globals.css` maps
`--font-studio-sans: var(--hc-font-sans)` and `--font-studio-display:
var(--hc-font-serif)` — but **neither `--hc-font-sans` nor `--hc-font-serif` is
defined anywhere**, with no fallback, so studio's display/sans variables compute to
empty. (Reference by symbol, not line — the line numbers differ per branch.)

**Off-cascade surfaces are inconsistent; one already does it right.**
- **PDF** (`packages/branded-documents`) already embeds self-hosted brand buffers via
  `@react-pdf` `Font.register` (Newsreader/Inter/JetBrains → HenryCoSerif/Sans/Mono).
  **This is the model to copy.**
- **OG/social** (`packages/seo/src/og`) passes **no `fonts` array** to next/og
  `ImageResponse`; template `fontFamily` is `system-ui, sans-serif`. Not branded.
  It also still uses `display: inline-block`/`inline-flex`, which Satori forbids
  (0-byte-image risk) — fix while there.
- **Email** (`packages/email/layout.ts`) uses CSS name-stacks with **no
  `@font-face`** — falls to system fonts in any client that cannot fetch webfonts.
- **Markdown/chat** render into `.mt-bubble-body` (no `font-family`, inherits host),
  **not** `.hc-prose`. (The function `renderMessageMarkdown` does not exist; it is
  `renderBody`/`renderMarkdownBody` in `packages/messaging-thread`.)
- **`IntelligenceLauncher`** exists on `main` at `packages/ui/src/intelligence/` and
  is the primary AI-reply surface (uses `.hc-prose`).

**Governance is greenfield.** There is **no `tone:check` script** anywhere (the brief
was wrong — CI runs lint/typecheck/`i18n:check:strict`/test/build only), and **no
font guard**. `docs/v3/reading-foundation.md` (READING-01) exists and already sets
`--hc-measure:66ch`, `--hc-leading-prose:1.6`, `--hc-text-reading:18px` and the
philosophy that *structure stays sans; the serif is for genuine reading prose only*.
The referenced `typography-language-ecosystem-findings.md` does **not** exist.

### What this means
The mission is not "wire an unwired seam". It is **centralise + self-host +
de-Google + light up the reading leg + guarantee coverage + guard it**, then swap in
the bespoke faces behind a single flag. Because every app already imports the
globals and `.hc-prose` is font-only, the change is **one shared package + a
per-app one-line bridge**, not a component rewrite. Low blast radius.

---

## 3. Goals / Non-goals

### Goals
1. One owned superfamily (serif + sans + mono), self-hosted, rendering everywhere.
2. **Zero fallback to system fonts, machine-proven**, in every shipped language.
3. A face-agnostic **role + scale** token system (not blanket one-font).
4. A **single flag** that flips the whole ecosystem (web + RN) from current fonts to
   the bespoke identity — a config change, not a code change.
5. Off-cascade surfaces (OG, email, PDF) on the owned faces.
6. A **CI guard** that makes regression to system/Google fonts impossible.
7. Fix the studio undefined-token bug en route.

### Non-goals
- Redrawing the actual glyphs (that is the foundry's Track A; this spec defines the
  brief and the swap mechanism, not the type design).
- Changing copy, tone, or i18n content. No user-facing strings change.
- Touching money surfaces or `packages/search-ui` (owner-reserved).
- Restyling third-party embedded surfaces we cannot control (payment iframes) — these
  are documented exceptions, not targets.

---

## 4. The hard invariant: zero fallback, proven

A fallback stack that ends in a system font (`…Georgia, serif`) is *permission to use
a system font*. We remove that permission and replace hope with proof.

### 4.1 No system font in any stack
Every `--hc-font-*` chain contains **only owned, self-hosted families**:
```
--hc-font-serif: "HenryOnyxSerif", "HenryOnyxArabicSerif", "HenryOnyxCJKSerif", serif;
--hc-font-sans:  "HenryOnyxSans",  "HenryOnyxArabicSans",  "HenryOnyxCJKSans",  sans-serif;
--hc-font-mono:  "HenryOnyxMono",  "HenryOnyxCJKMono",     monospace;
```
The trailing generic keyword stays **only** as a theoretical last resort that the
coverage gate (§4.3) proves is unreachable. During the interim (pre-reveal) the first
family resolves to a **self-hosted placeholder** (see §8), never a system font — so
the product never touches a system font even before the bespoke faces arrive.

### 4.2 Owned non-Latin companions
Latin (incl. African-Latin diacritics) is bespoke. Non-Latin scripts render from
**self-hosted, preloaded owned companions** (Noto-class), composed behind the *same*
tokens via `@font-face` `unicode-range`, so `.hc-prose` "just works" in every
language without ever reaching a system font. Scripts in scope now: **Arabic** (`ar`)
and **Han/Simplified Chinese** (`zh`). A **Devanagari** slot is reserved for when
`hi` graduates from EN-fallback.

### 4.3 The Coverage Gate — the proof
A CI check `font:coverage` that runs on every commit and asserts, **two-tier**:

- **Tier 1 — our shipped copy (exact):** enumerate every shipped locale's copy
  (typed copy modules), compute the exact set of codepoints used, read each owned
  face's real glyph table (`cmap`, via `fontkit`), and assert
  `used_codepoints ⊆ owned_cmap`. **One** uncovered character → **CI red**.
- **Tier 2 — dynamic / user-generated content (block coverage):** assert the owned
  companions' `cmap` covers the **full Unicode blocks** for every supported script
  (Basic Latin, Latin-1 Supplement, Latin Extended-A/B + Additional, Arabic +
  Arabic Presentation Forms, CJK Unified Ideographs + common punctuation, etc.), so
  content we did not author (a buyer's Arabic message, a Chinese product title) still
  renders on an owned face.

This gate is what turns "not one letter" into a law. It also **forces the foundry
brief to be complete**: if the delivered bespoke cut is missing a Yorùbá tone mark or
a Han character we use, the gate fails in CI at reveal time — not in production.

### 4.4 The one honest exception — email
Some email clients strip webfonts before rendering; no code controls their engine.
We ship `@font-face` + a closest-owned-metric fallback and **document email as the
single best-effort channel**. We do not claim 100% where the medium makes it
impossible.

---

## 5. Locked decisions

| # | Decision | Choice |
|---|----------|--------|
| D1 | What "owned" means | **Commission a bespoke superfamily** (custom-drawn) |
| D2 | Rollout posture | **Engineer now, gate the reveal** behind one flag; prod keeps current fonts until flip |
| D3 | Face roster | **Serif + Sans + Mono** — matched superfamily |
| D4 | Scope | **Everything** — 10 web apps + OG/email/PDF/markdown + 2 RN apps |
| D5 | Packaging | **Extend `packages/ui` (web) + separate `packages/rn-type` (RN)**, mitigated to one flag + one guard |
| D6 | Base branch | **`main`** (AI-prose surfaces live there; per the stale-branch lesson) |
| D7 | Coverage | **Zero system fallback, proven by `font:coverage`** (§4) |

---

## 6. Architecture

### 6.1 Web — `packages/ui`
- `packages/ui/fonts/` — the **woff2** binaries (placeholder now; bespoke on reveal),
  plus owned non-Latin companion woff2.
- `packages/ui/src/styles/globals.css` — **extend** the `:root` seam to *define*
  `--hc-font-serif` / `--hc-font-sans` / `--hc-font-mono` (fixing the studio bug),
  add the role + scale tokens (§7), and add the `@font-face` `unicode-range`
  composition for companions.
- `packages/ui/src/fonts/brand-type.ts` — exports the **`next/font/local` config**
  (src paths, weights, `variable` names, `fallback`, `adjustFontFallback`,
  `preload`). The SWC transform must run in app code, so each app's `layout.tsx`
  calls `localFont(brandSerifConfig)` etc.; the package centralises everything
  except that call. *(Phase-1 spike: confirm `src` resolution from a package —
  likely `transpilePackages` + package-relative paths.)*
- `packages/ui/src/fonts/flag.ts` — the flip-flag resolver (reads
  `NEXT_PUBLIC_ONYX_TYPE_LIVE`).

### 6.2 React Native — `packages/rn-type`
`packages/ui` cannot be consumed by RN, so RN gets an honest, native home.
- `packages/rn-type/fonts/` — the **ttf** binaries (same drawing, RN-required format).
- expo-font asset map + `useFonts` registration for `company-hub` and `super-app`.
- RN text-style tokens mirroring the web role tokens (§7).
- Its own flag resolver reading the **same** `NEXT_PUBLIC_ONYX_TYPE_LIVE`.

### 6.3 Mitigating D5's downsides
- **One switch:** both packages read the same env flag. Two small resolvers, one
  value to flip → web + RN reveal together.
- **One guard:** a single `font:check` script allowlists `packages/ui/fonts` + the
  seam **and** `packages/rn-type`.
- **Not wasteful duplication:** web needs woff2, RN needs ttf — different renditions
  of the same face; the foundry delivers both.

---

## 7. The token system

### 7.1 Family tokens (face-agnostic; the flip repoints these)
`--hc-font-serif`, `--hc-font-sans`, `--hc-font-mono`.

### 7.2 Role → face matrix (preserves READING-01 philosophy — *not* all serif)

| Role tokens | Face | Used for |
|---|---|---|
| `--hc-font-display`, `--hc-font-reading` | **Serif** | hero ledes, section intros, long-form reading, FAQ/legal, editorial display |
| `--hc-font-body` + `h1–h4` / `ui` / `caption` roles | **Sans** | nav, buttons, labels, cards, forms, data, structural headings, body |
| `--hc-font-mono` | **Mono** | code, figures, tabular numbers, receipts, IDs |

### 7.3 Modular scale (minor-third ≈ 1.2; extends the existing READING-01 tokens)

| Role | Size | Line-height | Default weight | Face |
|---|---|---|---|---|
| caption | 13px | 1.4 | 500 | sans |
| ui | 14px | 1.45 | 500 | sans |
| body | 16px | 1.55 | 400 | sans |
| reading | 18px (`--hc-text-reading`) | 1.6 (`--hc-leading-prose`) | 400 | serif |
| h4 | 18px | 1.3 | 600 | sans |
| h3 | 22px | 1.3 | 600 | sans |
| h2 | 28px | 1.25 | 650 | sans |
| h1 | 36px | 1.2 | 700 | sans |
| display | `clamp(40px, 5vw, 64px)` | 1.05 | 600 | serif |

Measure stays `--hc-measure: 66ch`. Each role gets paired size / line-height /
weight / tracking tokens. **These values are a starting proposal**; the bespoke
optical sizes may retune them at reveal (a token edit, not a structural change).

### 7.4 Premium craft standard — what makes it *feel* expensive

Coverage makes the type correct; **craft** makes it feel like a premium,
professional company. These are enforceable defaults baked into the seam (so all 12
apps inherit the same taste), not left to each app:

- **Optical sizing on.** `font-optical-sizing: auto` (already on `.hc-prose`);
  display roles use the serif's `opsz` axis for refined high-contrast forms while
  small UI stays legible. The bespoke faces are commissioned with an optical axis /
  display + text cuts (§12).
- **Tabular, lining figures for money & data.** `font-feature-settings: "tnum" 1,
  "lnum" 1` on prices, ledgers, receipts, tables, IDs — numbers align in a column.
  (Misaligned figures are the #1 "cheap" tell.) Ship a `.hc-numeric` utility and
  adopt it in the money/table components.
- **Real ligatures + contextual alternates** (`liga`, `calt`) on reading/display;
  discretionary ligatures **off** by default (restraint).
- **No synthetic styles.** Ship real weights and **real italics**; the guard rejects
  faux-bold / faux-italic. Kerning on (`font-kerning: normal`).
- **Tracking discipline** (tokenised): display/h1 slightly tight
  (`--hc-track-display: -0.02em`), body neutral, all-caps / eyebrow labels open
  (`--hc-track-caps: 0.06em`). Tight-but-not-cramped display reads as premium.
- **Rhythm & no orphans.** `text-wrap: pretty` on prose (already) + `text-wrap:
  balance` on headings; consistent vertical rhythm; `--hc-measure: 66ch`. No lone
  widow on a heading.
- **Weight restraint.** A small, deliberate weight ladder (§7.3) — hierarchy from
  contrast, not from a pile of weights.
- **Load & reveal polish.** Preload the Latin face; metric-matched fallback so there
  is **no FOUT jank and no layout shift** — including on reveal day.
- **Contrast held.** Premium ≠ low-contrast grey mush; reading stays at a
  comfortable size and AA contrast (ink inherited, never forced — the `.hc-prose`
  rule).

Implemented as `font-feature-settings` + tracking / rhythm tokens in the seam. The
Phase-1 sample page and the reveal are reviewed through the **frontend-design**
skill, judged against these rules on real surfaces in both themes and on mobile.

---

## 8. The flip mechanism

Layouts always load the brand `localFont` (placeholder now, bespoke later). A
`data-onyx-type="live"` attribute — driven by `NEXT_PUBLIC_ONYX_TYPE_LIVE` at render
— toggles which family the tokens point at:

```css
:root                        { --hc-font-serif: <app's current serif>; /* … */ }
:root[data-onyx-type="live"] { --hc-font-serif: var(--font-brand-serif); /* … */ }
```

- **Prod stays on current fonts** until the flag flips (D2).
- **Staging previews** by setting the attribute — fully rehearsable.
- **Reveal day** flips one env value; **zero structural code moves**.

The interim placeholder faces are chosen to **approximate the bespoke vertical
metrics** (via `size-adjust` / `ascent-override` on the `@font-face`), so reveal-day
layout shift is near-zero. Placeholder proposal: self-hosted **Fraunces** (serif,
already de-facto), **Manrope** (sans, already de-facto UI), **JetBrains Mono** (mono,
already used by branded-documents). These are pure test scaffolding — they never
need to ship to prod-default; reveal flips straight to the bespoke files.

---

## 9. Off-cascade surfaces

| Surface | Change | Coverage guarantee |
|---|---|---|
| **OG / Satori** (`packages/seo`) | Feed brand + companion font **buffers** into `ImageResponse`; drop `system-ui` template; **fix `inline-block`/`inline-flex`** (Satori 0-byte bug) | Owned in every language (Latin + Arabic + CJK buffers) |
| **PDF** (`packages/branded-documents`) | **Align family names** to the owned brand names (already embeds self-hosted buffers) | Owned; smallest change |
| **Email** (`packages/email`) | Add `@font-face` (brand webfont) + preserve serif/sans fallback for MSO/no-webfont clients | **Best-effort — the one documented exception (§4.4)** |
| **Markdown / chat** (`messaging-thread`, `IntelligenceLauncher`) | Route rendered prose through role tokens via a shared **`<AiProse>`** primitive (serif reading face); reconcile the stale `.hc-prose` "no font-family" comment | Owned via the seam |

---

## 10. Migration phases (flag-safe)

Built on `main` (D6). Each phase is independently shippable; prod is unchanged until
reveal.

- **Phase 0 — Foundations & safety.** Fix studio undefined tokens (ungated
  correctness). Land `font:check` in **warn-mode** (repo still uses Google fonts
  until reveal, so error-mode would fail its own repo). Scaffold `font:coverage`.
- **Phase 1 — `packages/ui` foundation.** Fonts dir + placeholder faces +
  `brand-type.ts` config + define `--hc-font-serif/sans/mono` + role/scale tokens +
  companion `@font-face` + flag resolver + a sample page proving both themes.
  **No prod change.**
- **Phase 2 — Wire the web seam.** Apply the brand `.variable` and bridge
  `--font-reading`/`--font-body`/`--hc-font-*` in all 10 app layouts, gated by the
  flag. **No prod change.**
- **Phase 3 — Off-cascade.** OG (buffers + Satori fix), email (`@font-face`), PDF
  (name alignment), markdown/chat (`<AiProse>`).
- **Phase 4 — React Native.** `packages/rn-type` + expo-font in `company-hub` &
  `super-app` + RN text tokens.
- **Phase 5 — Enforcement & docs.** Harden `font:check`/`font:coverage` to
  error-mode (gated to reveal). Write the typography reference doc + a
  "text touchpoints" inventory + a CLAUDE.md typography rule.
- **Reveal (Track A-dependent).** Drop the bespoke woff2/ttf into `packages/ui/fonts`
  + `packages/rn-type/fonts`; run coverage against the real faces; flip
  `NEXT_PUBLIC_ONYX_TYPE_LIVE=1`.

---

## 11. The guards

Two new npm scripts + CI steps, alongside `i18n:check:strict` in `.github/workflows/ci.yml`.

### 11.1 `font:check` — no system/Google fonts outside the token layer
`scripts/font-guard.mjs` fails on, **outside the allowlist**:
- any raw `font-family` declaration,
- any system-font stack (`system-ui`, `-apple-system`, `Segoe`, `Arial`,
  `Helvetica`, `Times`, `Georgia`, …),
- any Google-Fonts `@import` or `next/font/google` call,
- any Tailwind `font-sans`/`font-serif` utility on a text surface.

**Allowlist:** `packages/ui/fonts` + the globals seam + `packages/rn-type` +
documented exceptions (email fallback stacks; payment iframes). **Warn-mode until
reveal, error-mode after.**

### 11.2 `font:coverage` — zero-fallback proof
The two-tier `cmap` check from §4.3.

---

## 12. Track A — the foundry brief (owner-driven, parallel)

Captured here so engineering and procurement do not block each other. The commission
is a **matched superfamily** (shared vertical metrics, rhythm, proportions so serif +
sans + mono mix on one page — e.g. a receipt with a serif heading, sans labels, mono
figures reads as one voice).

- **Serif:** display + reading. Optical range desirable (display vs text sizes).
- **Sans:** the workhorse — nav/UI/body; the largest share of every screen.
- **Mono:** full ASCII, box-drawing, tabular figures.
- **Weights (from §7 scale):** 400 / 500 / 600 / 650 / 700 minimum, plus italics for
  serif reading.
- **Latin coverage:** Western + African-Latin diacritics/tone marks — Yorùbá
  (ẹ ọ ṣ + tone marks), Igbo (ị ọ ụ ṅ), Hausa (ɓ ɗ ƙ). Cyrillic/Greek optional.
- **Deliverables:** woff2 (web) + ttf (RN) + source; ownership/licensing terms that
  make the files ours.
- **Non-Latin** (Arabic, CJK) is **not** bespoke — served by owned self-hosted
  companions behind the same tokens.

**Quality bar (this is where "premium" is ultimately drawn, §7.4):** true italics
(not obliqued), refined optical/display cuts, dense professional **kerning**, tabular
+ lining figures, OpenType features (`liga`, `calt`, `tnum`, `lnum`, `case`, `frac`
for prices, `ordn`), proper hinting for screen at small sizes, and typographic
punctuation (real quotes, dashes). The face must look intentional and expensive at
14px in a form label *and* at 64px in a hero — that range is the commission's job.

---

## 13. Verification (per phase)

- `i18n:check:strict` + lint + typecheck on every touched app.
- **Both themes** eyeballed on a sample surface.
- `font:check` (warn) + `font:coverage` green.
- No hardcoded user-facing strings.
- Money surfaces and `packages/search-ui` untouched.
- At reveal: `font:coverage` passes against the **real** bespoke faces before the
  flag flips.

**Premium acceptance (eyeball on the sample page + one surface per division, both
themes, desktop + mobile):** figures in a price table align in a column; no heading
leaves a widow; display type is tight, not loose; no faux-bold / faux-italic; reading
measure ≈ 66ch; the reveal produces no layout shift; and — the real test — a first-
time visitor reads it as an established, expensive, professional company.

---

## 14. Risks & open questions

1. **`next/font/local` from a package.** The SWC transform is app-local; loading
   font `src` from `packages/ui` may need `transpilePackages` + package-relative
   paths. **Phase-1 spike de-risks this before wiring 10 apps.**
2. **`adjustFontFallback` vs zero-system.** next/font can insert a system metric-match
   during load. We set `preload` + owned-only fallback and confirm the *settled*
   render is always owned; tune or disable `adjustFontFallback` per face.
3. **CJK file size.** Full Han coverage is large; use subsetting + `unicode-range` +
   `preload` only the Latin face, lazy-load companions by document language.
4. **CMS/UGC codepoints.** Covered by Tier-2 block coverage, not Tier-1 — documented.
5. **RN flag parity.** Two resolvers reading one env var must be tested to flip
   together.
6. **Reveal coordination.** Foundry delivery date is external; the flag decouples it
   from all engineering.

---

## 15. Success criteria

- Every web + RN surface renders the owned superfamily after reveal.
- `font:coverage` proves **0 uncovered codepoints** in shipped copy and full block
  coverage for supported scripts — i.e. *not one letter* falls back.
- `font:check` is error-mode and green — regression to system/Google fonts is
  impossible.
- The reveal is a single env flip with zero structural code change and near-zero
  layout shift.
- Reading surfaces render the editorial serif; structure/UI render the brand sans —
  the system reads as intentional, not "one font everywhere".
- **The felt outcome:** a first-time visitor, in any supported language, on any
  surface, experiences the product as an established, expensive, premium, professional
  company — and stays to keep reading. This is the point of the whole program.

---

## Appendix A — Verified surface inventory

- **Seam:** `packages/ui/src/styles/globals.css` (`--hc-font-*`, `.hc-prose`).
- **Web app layouts:** `apps/{account,care,hub,jobs,learn,logistics,marketplace,property,staff,studio}/app/layout.tsx` + each app's `globals.css` (`@import`s the seam at line 2).
- **RN apps:** `apps/company-hub`, `apps/super-app` (Expo/nativewind).
- **Studio bug:** `apps/studio/app/globals.css` (`--font-studio-sans`/`--font-studio-display` → undefined `--hc-font-sans`/`--hc-font-serif`).
- **OG:** `packages/seo/src/og/{template.tsx,route-handler.tsx}`, per-app `opengraph-image.tsx` / `twitter-image.tsx` (account is a hand-inlined copy).
- **Email:** `packages/email/layout.ts` (`HEADING_FONT_STACK`, `BODY_FONT_STACK`).
- **PDF:** `packages/branded-documents/src/fonts/`, `tokens.ts`, `render.ts`.
- **Markdown/chat:** `packages/messaging-thread/src/{markdown.tsx,thread.tsx,styles.css}`, `packages/ui/src/intelligence/IntelligenceLauncher.tsx`.
- **CI:** `.github/workflows/ci.yml` (`i18n:check:strict` present; no `tone:check`, no font guard).
- **Docs:** `docs/v3/reading-foundation.md` (READING-01) exists;
  `typography-language-ecosystem-findings.md` does **not** (dangling ref to remove).
