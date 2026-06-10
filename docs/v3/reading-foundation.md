# READING-01 — Editorial reading foundation

> **Status:** Slice A (reading foundation) + Slice B (hub type identity)
> shipped on `v3/typography-reading-foundation` (6 commits; not yet a PR).
> Adversarially audited (5 readers) before the type-identity commit; findings
> folded in or logged below.
> **Owner-approved direction (2026-06-10):** *calm shared baseline + curated
> display faces*. **Manrope** for UI/app body; **Fraunces** for display heads;
> **a serif for long-form reading** (`.hc-prose`) — matching the editorial
> reference the owner shared (Tiempos-style serif body, generous rhythm). This
> doc is the durable standard; the canonical implementation is the `READING-01`
> blocks in `packages/ui/src/styles/globals.css`.

## The problem this solves

The platform already had a good type **scale** and semantic type utilities, but
**no reading-comfort layer**: no capped line length (*measure*), prose leading
was 1.5–1.6 (functional, not editorial), and there was no paragraph-rhythm
system. Body copy therefore ran wide and slack on long-form surfaces. Separately,
each of the 10 apps loaded its **own** fonts (Fraunces, Newsreader, Space Grotesk,
Manrope, system serif…) with **no shared `--hc-font-*` token** — so "the editorial
serif" meant five different things.

Calm, premium reading is a function of **rhythm, not weight**. Three levers:
a capped **measure**, generous **leading**, predictable paragraph **gap**.

## What Slice A adds (all in `packages/ui/src/styles/globals.css`)

**Tokens** (mode-independent — no `.dark` override needed):

| Token | Value | Purpose |
|---|---|---|
| `--hc-measure` | `66ch` | reading-column cap (~72 chars/line — the editorial sweet spot) |
| `--hc-measure-narrow` | `54ch` | asides, form help, captions |
| `--hc-measure-wide` | `76ch` | looser marketing columns |
| `--hc-leading-prose` | `1.6` | long-form serif reading leading |
| `--hc-leading-snug` | `1.5` | headings inside prose |
| `--hc-text-reading` | `1.125rem` (18px) | calm editorial serif reading size |
| `--hc-text-reading-lg` | `1.25rem` (20px) | feature editorial long-form |
| `--hc-prose-gap` | `1.1em` | paragraph-to-paragraph air (scales with size) |
| `--hc-font-body` | `var(--font-body, <system sans>)` | shared body (UI/app) face seam |
| `--hc-font-display` | `var(--font-display, "Fraunces", <system serif>)` | shared display face seam |
| `--hc-font-reading` | `var(--font-reading, var(--hc-font-display))` | long-form reading serif (defaults to the display serif; uses Fraunces' opsz axis) |

**Utilities:**
- `.hc-prose` — long-form reading container. Sets the **serif reading face**
  (`--hc-font-reading`, optical-sized) + measure + 18px + 1.6 leading +
  `text-wrap: pretty`, and gives **automatic** paragraph rhythm via
  `> * + * { margin-top: var(--hc-prose-gap) }` (the "lobotomized owl" — no
  per-paragraph classes). Also tunes inside-prose headings, lists, and links.
- `.hc-prose-lg` — the 19px editorial step.
- `.hc-measure` / `.hc-measure-narrow` / `.hc-measure-wide` — width caps for
  non-prose reading blocks (hero sub-copy, card descriptions, section intros).

**One global nudge** (the only non-opt-in change): `.hc-body` leading 1.55→1.6,
`.hc-body-lg` 1.6→1.65. Leading only — adds air, doesn't reflow widths.

## Two load-bearing design rules (do not regress)

1. **`.hc-prose` owns the reading face + rhythm, never colour.** It sets the
   serif reading face (`--hc-font-reading`) + measure + leading, but deliberately
   does **not** set `color` — ink is **inherited**. This is what makes it safe to
   drop on *any* surface: token-driven light/dark **or** a hardcoded editorial
   panel (e.g. the company pages' warm-ink `#0a0807` surface). A utility that
   forced `color: var(--hc-text-primary)` would resolve to the wrong mode on a
   non-`.dark` hardcoded surface and produce **invisible text** — the exact bug
   class this codebase keeps hitting. The host surface owns colour; `.hc-prose`
   owns the reading face + space. **Links inside prose inherit ink too**
   (underline + weight, never a theme-flipping token) for the same reason — a
   gold `--hc-accent-text` link fails AA (~4.1:1) on a hardcoded-dark panel.
2. **The `ch` measure self-corrects.** Because measure is in `ch` (the rendered
   font's "0" advance), `66ch` stays ~72 characters/line whatever face the
   type-identity pass later wires into `--hc-font-body`.

## What Slice B adds (hub type identity)

The font seam pays off: two edits in the clean `apps/hub/app/layout.tsx` give the
**whole hub** an editorial identity.
- **Fraunces** (editorial serif) + **Manrope** (calm humanist body) load as
  **variable** fonts via `next/font` (no `weight` array — keeps Fraunces's
  optical-size axis; one file per family; matches marketplace/jobs/logistics),
  exposed as `--font-display` / `--font-body`. The seam (`--hc-font-*`) is
  declared on `:root` and `next/font` sets `--font-*` on `<html>` (= `:root`,
  same element), so the tokens resolve to the loaded faces platform-wide.
- `<body>` carries `.hc-font-body`, so every hub surface adopts Manrope body.
- `.hc-font-display` lands on **display moments only**: the hub hero h1 + 5
  section heads, and the company-page hero h1 + section heads + footer h2. Dense
  card/UI headings stay sans (the serif-for-display / sans-for-UI rule).

## Adopted so far

- `apps/hub/app/components/SectionBlock.tsx` — long-form bodies + legal clauses
  use `.hc-prose`; section heads use `.hc-font-display`.
- `apps/hub/app/components/CompanyPageClient.tsx` — page hero + footer titles use
  `.hc-font-display`. (`/about`, `/privacy`, `/terms`, `/contact`.)
- `apps/hub/app/(site)/HubHomeClient.tsx` — hero + section heads use
  `.hc-font-display`.
- `apps/hub/app/layout.tsx` — the Fraunces/Manrope seam wiring.

## Verification

- Rendered against the **real** `globals.css` + the **real** faces (Fraunces +
  Manrope) in headless Chromium, light + dark, before/after:
  `.codex-temp/reading-foundation/` (`harness.html`/`shoot.cjs` →
  `reading-foundation-before-after.png`; `flagship.html`/`shoot-flagship.cjs` →
  `flagship-before-after.png`). Dark panels confirm rule 1 (no invisible text).
- **Adversarial audit (5 readers)** before the Slice B commit confirmed: next/font
  wiring build-safe, seam resolves, `.hc-font-body` beats the hub `body{}` rule,
  no nested `<html>/<body>`, `.hc-mono` tabular data unaffected, no AA/sizing
  regression in `.hc-prose` bodies. It drove four fixes (variable fonts, link
  ink-inherit, prose color-inherit committed, section-head consistency).
- Changes are CSS + className + a next/font wiring (a pattern already proven in
  marketplace/jobs/logistics). Full build is gated in CI on PR (the shared tree
  carries unrelated concurrent WIP, so a local `build:all` is a noisy signal).

## Known follow-ups (audited, non-blocking)

- **Owner sign-off:** the body change converges owner/workspace/account hub chrome
  from system-ui to Manrope (one calm body face platform-wide) — a real visual
  change to authenticated surfaces. Defensible (similar humanist metrics, token-
  sized layouts), but per the per-surface-approval rule it wants an owner
  screenshot before merge.
- **Workspace double-load:** `apps/hub/app/workspace/layout.tsx` instantiates its
  own Manrope (`--workspace-font-sans`); now redundant with the root `--font-body`.
  Drop the local instance and inherit the seam (keep its mono). Payload cleanup.
- **Dead rule:** the hub `body { font-family: var(--acct-font-sans) }` font-family
  line is now inert (the `.hc-font-body` class wins). Left untouched because
  `apps/hub/app/globals.css` is mid-edit in a concurrent session; tidy later.
- **Brand debt (pre-existing):** `layout.tsx` `generateMetadata` title still ships
  the retired `"Henry & Co."`. The documented normalizer (`toBrandName`) does **not
  exist in code** (docs-only); `COMPANY.group.name` literally stores `"Henry & Co."`.
  Belongs to the brand sweep, not this typography branch — do not guess-fix.

## Roadmap (not yet done)

- **Slice B rollout:** wire the same seam in the other division apps' `next/font`,
  converging the five faces (curated display exceptions kept). Per-division
  screenshot approval.
- **Slice C — language/tone:** calm the high-intensity *marketing* copy inside the
  existing `packages/i18n` typed-copy modules (hub-home hero/CTAs, division
  landings). Leave already-calm functional microcopy (`state-copy.ts`) alone.
  Respect the strict i18n gate (refresh the dated baseline; DeepL covers 8/12).
- **Rollout:** adopt `.hc-prose` / `.hc-measure` on the remaining reading-dense
  surfaces, audited in both themes per the full-surface-audit rule.
