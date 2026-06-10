# READING-01 — Editorial reading foundation

> **Status:** Slice A shipped on `v3/typography-reading-foundation`.
> **Owner-approved direction (2026-06-10):** *calm shared baseline + curated
> division display faces*, and *sans letterforms with fixed rhythm* (no serif
> body). This doc is the durable standard; the canonical implementation is the
> `READING-01` blocks in `packages/ui/src/styles/globals.css`.

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
| `--hc-leading-prose` | `1.7` | long-form body leading |
| `--hc-leading-snug` | `1.5` | headings inside prose |
| `--hc-text-reading` | `1.0625rem` (17px) | calm reading size |
| `--hc-text-reading-lg` | `1.1875rem` (19px) | marketing/editorial long-form |
| `--hc-prose-gap` | `1.1em` | paragraph-to-paragraph air (scales with size) |
| `--hc-font-body` | `var(--font-body, <system sans>)` | shared body face seam |
| `--hc-font-display` | `var(--font-display, "Fraunces", <system serif>)` | shared display face seam |

**Utilities:**
- `.hc-prose` — long-form reading container. Sets measure + 17px + 1.7 leading +
  `text-wrap: pretty`, and gives **automatic** paragraph rhythm via
  `> * + * { margin-top: var(--hc-prose-gap) }` (the "lobotomized owl" — no
  per-paragraph classes). Also tunes inside-prose headings, lists, and links.
- `.hc-prose-lg` — the 19px editorial step.
- `.hc-measure` / `.hc-measure-narrow` / `.hc-measure-wide` — width caps for
  non-prose reading blocks (hero sub-copy, card descriptions, section intros).

**One global nudge** (the only non-opt-in change): `.hc-body` leading 1.55→1.6,
`.hc-body-lg` 1.6→1.65. Leading only — adds air, doesn't reflow widths.

## Two load-bearing design rules (do not regress)

1. **`.hc-prose` owns rhythm, not colour or font-family.** It deliberately does
   **not** set `color` or `font-family` — both are **inherited**. This is what
   makes it safe to drop on *any* surface: token-driven light/dark **or** a
   hardcoded editorial panel (e.g. the company pages' warm-ink `#0a0807`
   surface). A utility that forced `color: var(--hc-text-primary)` would resolve
   to the wrong mode on a non-`.dark` hardcoded surface and produce **invisible
   text** — the exact bug class this codebase keeps hitting. The host surface
   owns colour; `.hc-prose` owns space.
2. **The `ch` measure self-corrects.** Because measure is in `ch` (the rendered
   font's "0" advance), `66ch` stays ~72 characters/line whatever face the
   type-identity pass later wires into `--hc-font-body`.

## Adopted so far

- `apps/hub/app/components/SectionBlock.tsx` — the single renderer for
  `/about`, `/privacy`, `/terms` long-form bodies + legal clauses. Section
  intro + legal item bodies now use `.hc-prose`.

## Verification

- The foundation was rendered against the **real** `globals.css` in headless
  Chromium, light + dark, before/after: `.codex-temp/reading-foundation/`
  (`harness.html` + `shoot.cjs` → `reading-foundation-before-after.png`). The
  dark panel confirms rule 1 (no invisible text).
- Slice A is CSS + className-string changes only — no TypeScript surface. Full
  build is gated in CI on PR (the shared working tree currently carries
  unrelated concurrent WIP, so a local `build:all` is a noisy signal).

## Roadmap (not yet done)

- **Slice B — type identity:** wire `--font-body` / `--font-display` per app via
  `next/font`, converging the five faces onto the shared seam (curated display
  exceptions kept). Per-division screenshot approval.
- **Slice C — language/tone:** calm the high-intensity *marketing* copy inside
  the existing `packages/i18n` typed-copy modules (hub-home hero/CTAs, division
  landings). Leave already-calm functional microcopy (`state-copy.ts`) alone.
  Respect the strict i18n gate (refresh the dated baseline; DeepL covers 8/12
  locales).
- **Rollout:** adopt `.hc-prose` / `.hc-measure` on the remaining reading-dense
  surfaces, audited in both themes per the full-surface-audit rule.
