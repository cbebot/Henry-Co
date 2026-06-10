# Typography, Language System & Tone — ecosystem findings

> **Status:** Phase-1 audit complete (2026-06-10), verified against `main` at
> `48ee2b85` (post READING-01 #258/#259/#260). This is the durable record of
> the full-ecosystem discovery behind the typography/language/tone refactor:
> what exists, what is already done, what is genuinely missing, and the
> sequenced migration plan. The first implementation increment is specified in
> `docs/v3/reading-02-division-rollout.md`.

## How this was produced

An eight-agent read-only fan-out (fonts/seam per app · type tokens + adoption ·
i18n architecture · UI content patterns · brand voice/divisions/AA · hype-copy
sweep · hardcoded-text audit · completeness critic), each finding verified
against source. Facts below were re-verified against merged `main` after the
parallel READING-01 PRs landed mid-audit — numbers quoted are current.

## 1 · Typography: the system exists; the unification is partial

**Three-role font seam** (canonical, `packages/ui/src/styles/globals.css`):

| Role | Token | Resolves to | Used by |
|---|---|---|---|
| Display serif | `--hc-font-display` → `var(--font-display, …)` | Fraunces | `.hc-font-display`, division display heads |
| Reading serif | `--hc-font-reading` → `var(--font-reading, var(--hc-font-display))` | Fraunces (opsz) | `.hc-prose`, `.hc-font-reading` |
| UI sans | `--hc-font-body` → `var(--font-body, …)` | Manrope | `.hc-font-body`, body/UI copy |

**State per surface (at `48ee2b85`):**

- **hub** — fully wired. Root layout sets `--font-display`/`--font-body` on
  `<html>` (so the `:root`-computed `--hc-font-*` resolve correctly app-wide);
  the `(site)` layout additionally re-declares `--hc-font-reading` on the
  public subtree (see the root-resolution gotcha below).
- **7 division apps** (marketplace, jobs, studio, property, care, learn,
  logistics) — PR #260 loads Fraunces (`--font-fraunces`) + Manrope
  (`--font-manrope-public`) per app and themes the public subtree via
  `--home-font-display`/`--home-font-sans`. **But the canonical `--hc-font-*`
  trio is NOT bridged** (logistics bridges display only), so `.hc-prose` /
  `.hc-font-reading` / `.hc-font-display` on those subtrees fall back to
  *system* serifs — `next/font` registers hashed family names, so the literal
  `"Fraunces"` in the seam's fallback stack can never match the loaded font.
- **account / staff** (authenticated) — no web fonts; system stacks
  (`--acct-font-display` = Iowan-class serif). Deliberately untouched by the
  public passes; any body-face change here is owner-screenshot-gated.
- **dashboard-shell** — its own seam (`--font-source-serif`/`--font-inter`
  from the superseded May pass, plus a hardcoded `--acct-font-display`
  default), partially seam-aware (already consumes `--hc-font-mono`). Bridge,
  don't replace.
- **email** (`packages/email`) — independent inline-style stacks
  (serif display + sans body), localized, already says "Henry Onyx". Cannot
  consume CSS custom properties the web way; align by value, not by var.
- **PDF** (`packages/branded-documents`) — fourth independent type system
  (`HenryCoSerif/Sans/Mono`), **zero i18n**, imports the stale
  `@henryco/brand` registry on a live render path.
- **native** (company-hub, super-app — Expo/NativeWind) — unaudited blind
  spot; the web seam cannot apply. Separate track.

**The root-resolution gotcha (load-bearing):** `--hc-font-*` values contain
`var(…)` and are declared at `:root`, so they are *computed at `:root`* and
descendants inherit the computed result. Setting the inner `--font-display` /
`--font-reading` on a subtree does **nothing** to the inherited `--hc-font-*`.
Bridges must re-declare `--hc-font-*` themselves, on the same element that
carries the `next/font` `.variable` classes (so the inner `var(--font-…)`
resolves there). Hub's `(site)` layout is the reference implementation.

**Adoption grammar** (established by #258/#259):

- `.hc-prose` / `.hc-prose-lg` — full reading container (serif face, 18/20px,
  1.6 leading, 66ch measure, owl rhythm) for true long-form flows.
- `.hc-font-reading` + `text-pretty` — face-only, for editorial paragraphs
  that keep their own tuned size/measure (FAQ answers, section intros).
  **Ink-lift rule:** when a muted paragraph (≤ ink-60) gains the serif face,
  lift its ink one step (→ ink-70) — serif glyphs are lighter than sans at
  equal size and muted grays drop below comfortable contrast.
- `.hc-measure` / `-narrow` / `-wide` — width caps for non-prose reading.
- **Invariant (never regress):** `.hc-prose` owns face + rhythm, **never
  colour** — ink is inherited from the host. Forcing a colour token would
  resolve to the wrong mode on hardcoded-dark panels (e.g. the company pages'
  `#0a0807`) and reproduce the invisible-text bug class.

**Adoption state:** hub only (SectionBlock long-form + homepage editorial
paragraphs). All division long-form (policies/about/faq/trust/help) still
hardcodes `max-w-* text-base leading-[1.7]`-style stacks — 136+ hardcoded
leading occurrences across 40+ files (lower bound).

## 2 · Text system: already built — do not build a parallel `text.*` tree

`packages/i18n` is a mature two-pattern system: **Pattern A** = ~45 typed copy
modules (`*-copy.ts`, typed shape + `getXxxCopy(locale)`, EN source of truth,
12-locale partial overrides via `deepMergeMessages`); **Pattern B** = runtime
`translateSurfaceLabel` + DeepL with a Postgres cache (8/12 locales; ig/yo/ha
fall back to EN; ar is RTL). CI enforcement: `scripts/v3/hardcoded-text-scan.mjs`
(`pnpm i18n:check --strict`) diffs against a dated baseline + `exempt.json`;
only NEW gaps fail.

**Every requested `text.*` namespace already has a home:** hero/nav/stats/
footer/faq → `hub-home-copy.ts` et al.; loading/empty/error/confirm →
`state-copy.ts`; errors → `error-fallback-copy.ts` + `account-copy.errorBoundary`;
dashboard/divisions → `account-copy.ts`; ai → `hub-owner-ai-copy.ts`;
enterprise → `logistics-business-copy.ts` + division blocks; forms/labels →
surface copy + caller-supplied. **A parallel token tree would fork the EN
source of truth, duplicate 12-locale definitions, bypass override+DeepL, and
orphan the CI gate — it is rejected.** Genuine small gaps worth new typed
modules in the same pattern: a shared **buttons/actions** vocabulary, a
**system-notice** group, an **onboarding** group.

**Real hardcoded-text debt (the actual Phase-4 work):**

| Surface | Density | Note |
|---|---|---|
| `apps/account` | **High** | Customer copy fully hardcoded; `account-copy.ts` exists but is **unconsumed**; needs a build-out, not a wrap |
| studio secondary public pages | Medium | Homepage wrapped; about/process/pricing/teams/trust/work leak bare kickers/headings |
| marketplace forms/search/cart | Medium | `<option>` labels + form field labels — a structurally distinct miss class |
| hub newsletter + search pockets | Low | Isolated |
| care/jobs/learn/logistics/property public | Low | Consistently wrapped (Pattern B); thin alt/aria tail |
| PDF (`branded-documents`) | Total | Zero i18n machinery |
| Internal staff/owner/admin | High | **Out of scope by decision** — operator surfaces |

## 3 · Tone: already calm — verified, not assumed

The full hype lexicon (revolutionize/unlock-the-power/take-control/10x/
limited-time/urgency/exclamations…) returns **zero matches** across all ~38
copy modules and all public components. Hub copy literally encodes *"Calm,
credible, premium"* and uses "Get started". The only exclamation in the
ecosystem is the "Copied!" toast (functional — keep). The heavy "unlock" usage
is real product gating (trust tiers, lesson sequencing, milestones) — **not**
hype; excluded from any tone pass.

Residue (full list — public-surface polish candidates, Increment B):

| Where | Before | After |
|---|---|---|
| `logistics-business-copy.ts:106` | "Premium experience under operational stress" | "Quality that holds under operational stress" |
| `logistics-quote-copy.ts:97` | "Quote returned instantly" | "Quote returned in one step" |
| `logistics-business-copy.ts:121` | "Tracking codes are issued instantly" | "Tracking codes are issued on booking" |
| `account-copy.ts:2162` | "Smart Recommendations" | "Recommendations" (confirm not a product name) |
| `care-copy.ts:387/471` | "Smart alerts" / "Smart expense red flags" | "Alerts" / "Expense red flags" (internal — optional) |
| `jobs-copy.ts:696` | "…see the best version of you" | "…see a complete, accurate profile" |

**Tone governance already exists in code:** `packages/newsletter/src/voice.ts`
(`DEFAULT_BANNED_PHRASES` + scoring `runGuard`) encodes the calm-tone rules.
Any tone standard must **extend voice.ts as the single rule store** — a second
lexicon would drift, the same duplication harm as a parallel token tree.

## 4 · Hazards any increment must honour

1. **Brand split-brain (fenced out of type/tone passes):** email already says
   "Henry Onyx"; this tree's `COMPANY.group.name`, division names, i18n copy
   and PDF tokens still say "Henry & Co."; the documented `toBrandName`
   normalizer does not exist in source. Sequence the config-level rename
   consciously; never guess-fix it inside a type branch.
2. **`packages/brand` is stale but LIVE** — `branded-documents/src/tokens.ts`
   imports it on the PDF render path (receipts/invoices = money surface). Do
   not delete/quarantine until that migration ships.
3. **jobs accentText AA failure:** `#0E7C86` is both accent and accentText
   (~3.9:1 on white), the only division violating the config's stated WCAG
   contract. Darken (≈`#0B5F66`) before type work leans on it.
4. **`.hc-prose` colour-inherit invariant** (see §1) — reviewers must reject
   any "fix" that adds `color` to prose utilities; fix the host ink instead.
5. **ListStates is dark-locked** (`text-white/80` etc.) — unsafe on light
   hosts; reconcile before consolidating empty-states.
6. **i18n gate coverage hole:** the scanner sees web source only — email/PDF/
   native strings can silently regress.

## 5 · Migration plan

| # | Increment | Scope | Risk |
|---|---|---|---|
| **A** | **READING-02 division rollout** (this branch — see spec) | Bridge `--hc-font-*` on 7 division public themes; adopt `.hc-prose`/`.hc-font-reading`/`.hc-measure` on division long-form; fix globals.css doc-rot | Low — additive |
| B | Tone polish | §3 table edits inside i18n modules + extend `voice.ts` as canonical tone store; locale-override updates; refresh dated baseline | Low |
| C | account copy build-out | Wire unconsumed `account-copy.ts` into account components (incl. aria/placeholder tail) | Medium |
| D | Bare-string wrap + guard | studio inner pages, marketplace forms/`<option>`s, hub pockets; ESLint `jsx-no-literals` scoped to public/customer with allowlists | Low |
| E | PDF/email alignment | Migrate `branded-documents` off `@henryco/brand` → `@henryco/config` (unblocks brand quarantine); PDF localization decision; optional email face alignment | Medium — money surface |
| F | AA + exceptions | jobs accentText fix; ratify studio (sans display) and any division exceptions in writing | Trivial |
| G | Native type/i18n track | expo-font + copy audit for company-hub/super-app | Separate effort |

Sequencing rules: brand rename lands independently (it gates nothing here but
makes screenshots honest); B–D respect the i18n gate (register new accessors
in the scanner, refresh the baseline); E precedes any `packages/brand`
deletion; every visual increment is verified per-surface in BOTH themes before
a "done" claim.

## 6 · Validation checklist (applies to every increment)

- [ ] No new bare user-facing literals (run `pnpm i18n:check`)
- [ ] No `color`/forced ink added to `.hc-prose` or reading utilities
- [ ] Seam bridges re-declare `--hc-font-*` (never only the inner var)
- [ ] Serif-on-muted-ink paragraphs got the ink-lift (≥ ink-70)
- [ ] Touched surfaces screenshot-verified light + dark
- [ ] No dashboards/operator/auth surfaces restyled in a public pass
- [ ] tsc/lint/build green on touched apps; CI required check green on PR
- [ ] Copy edits stay inside `packages/i18n` modules; locale overrides updated
- [ ] No edits to owner-reserved `packages/search-ui`
