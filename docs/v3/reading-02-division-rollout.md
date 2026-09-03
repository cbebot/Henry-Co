# READING-02 — Division reading rollout (seam bridge + long-form rhythm)

> **Status:** Spec for the increment on branch `worktree-reading-02-division-rollout`
> (off `main` @ `48ee2b85`). Continues the READING-01 train (#258 foundation →
> #259 hub homepage → #260 public faces). Ecosystem context + the full
> migration plan: `docs/v3/typography-language-ecosystem-findings.md`.

## Goal

Make the canonical three-role font seam **real on every division's public
surface** and roll the editorial reading grammar onto division long-form
pages — so `.hc-prose` / `.hc-font-reading` / `.hc-font-display` render the
*loaded* Fraunces (not a system serif) everywhere, and policies/about/faq/
trust/help pages read with the same calm rhythm the hub already has.

## A1 — Seam bridge (7 division public themes)

In each `*_PUBLIC_THEME_STYLE` object (the element that also carries the
`next/font` `.variable` classes and declares `--home-font-*`), add the trio:

```ts
// READING-01 seam bridge: the --hc-font-* tokens compute at :root, so they
// must be re-declared HERE (not the inner --font-* vars) for the loaded
// faces to reach .hc-prose / .hc-font-display / .hc-font-reading.
["--hc-font-display" as string]: "var(--home-font-display)",
["--hc-font-body" as string]: "var(--home-font-sans)",
["--hc-font-reading" as string]: "var(--home-font-display)",
```

Files: `apps/{marketplace,jobs,learn,property,care,logistics,studio}` public
theme modules. logistics already bridges display (normalize to the var form);
care's existing `--font-display` line stays (it feeds direct `var(--font-display)`
consumers). hub needs **no change** (root layout wires the seam at `:root`;
`(site)` layout already re-declares `--hc-font-reading`).

Verify per app that the Fraunces + Manrope `.variable` classes are applied on
the same element as the style object (PR #260 wired this; confirm, don't assume).

## A2 — Long-form adoption (division public routes only)

Apply the established grammar (#258/#259 precedents — hub SectionBlock,
hub home-faq):

1. **True long-form flows** (legal/policy clauses, about narratives, process
   descriptions): wrap the flowing block container in `.hc-prose`
   (`.hc-prose-lg` only for feature editorial), and **remove** the ad-hoc
   `max-w-* / text-base / leading-[1.7]`-class stacks it replaces. Ink stays
   host-owned.
2. **Editorial paragraphs with their own tuned size** (FAQ answers, section
   intros, hero sub-copy): `hc-font-reading text-pretty` + width cap
   (`hc-measure` or existing `max-w-prose`). **Ink-lift rule:** if current ink
   is ≤ the app's ink-60 equivalent, lift one step (→ ink-70).
3. **Do not touch:** dense UI, forms, tables, nav, buttons, state/empty/
   loading copy, dashboards, operator/auth routes, `packages/search-ui`.

Target route groups (enumerate exact files during implementation):
marketplace `(public)/{policies,help,trust}` · studio `(public)/{about,faq,
policies,process,services,trust}` · care `(public)/{about,services,pricing}` ·
learn `(public)/{help,academy,trust}` · property `(public)/{faq,trust}` ·
jobs `{help,trust,careers}` · logistics `(public)` long-form (support/coverage).

## A3 — Fix doc-rot in `packages/ui/src/styles/globals.css`

The READING-01 header comment (~lines 607–621) still says the utilities change
"RHYTHM, not the typeface" and that `.hc-prose` "does NOT set `font-family`" —
contradicted by the serif-reading pivot (line 628 sets
`font-family: var(--hc-font-reading)`). Rewrite the header to document the
serif reading face + keep the (still-true) colour-inherit rule.

## Safety invariants (reviewers reject violations)

- `.hc-prose`/reading utilities never gain `color` — host owns ink.
- Bridges re-declare `--hc-font-*` themselves on the font-bearing element.
- No `next/font` `variable:` renames (CSS refs depend on existing names).
- No global `body { font-family: … }` default added to packages/ui.
- Public-subtree changes only; zero diffs under dashboards/operator routes.
- No copy/string changes in this increment (className + CSS comments + theme
  objects only) → i18n baseline untouched.

## Out of scope (queued in the findings doc, §5)

Tone edits (B) · account build-out (C) · bare-string wrap + ESLint guard (D) ·
PDF/email (E) · jobs AA fix (F) · native apps (G) · authenticated chrome faces.

## Verification

- Targeted typecheck + lint for each touched app; full required CI check on PR.
- `pnpm i18n:check` (must be no-op — no strings change).
- Playwright-headless screenshot harness (the proven `.codex-temp` pattern)
  rendering the real `globals.css` + per-division accents, light AND dark:
  prose panel + face-only panel per division, before/after.
- Adversarial per-app review: bridge correctness (gotcha), no colour forcing,
  ink-lift applied, no out-of-scope diffs.
