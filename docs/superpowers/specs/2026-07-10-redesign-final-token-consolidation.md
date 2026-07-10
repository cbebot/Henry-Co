# Redesign — Final Token Consolidation (Phase 1b) — Spec + Record

**Date:** 2026-07-10 · **Program:** Cross-Division Ecosystem Redesign
**Predecessor:** `2026-07-08-redesign-phase1-design.md` (chrome adoption — SHIPPED
across PRs #443–#454: marketplace demolition, studio/learn, care/logistics/
property/jobs, motion doctrine, amber retirement).

## What the owner flagged

"The cross-division unification final design has not yet been done" — correct.
The per-division 64px chrome shipped, but the CONSOLIDATION core had not: the
token layers were still five layers with three duplication sites.

## Findings (2-agent map, 2026-07-10, file-cited)

1. `--hc-*` (canonical) and `--home-*` (public register) are sound and
   centralized in `packages/ui/src/styles/`; dashboard-shell's `CSS_VARS` is a
   semantic name map over `--hc-*`. **No drift in the shared layers.**
2. The real duplication: **seven near-identical `*_PUBLIC_THEME_STYLE`
   objects** (marketplace/care/studio/jobs/learn/property/logistics), each
   hand-maintaining the accent triplet + owned-type live/interim font switch +
   READING-01 seam bridge. Care had already forked (hardcoded cobalt hexes
   instead of reading company.ts).
3. `--accent-text-dark` (AA accent-as-text on the dark canvas) was hand-tuned
   in each app file and existed NOWHERE in config.
4. `--acct-*` is defined independently in account, hub, and marketplace
   (`.market-workspace-light`) — values identical today, structure drifted.
5. No chrome-height token existed anywhere; marketplace hardcoded `h-16`.
6. Theme keying differs: account/hub/jobs/care light-first `.dark`;
   property/learn/logistics dark-first with `.light` re-light / `[data-theme]`.
7. `HenryCoThemeBlocking` injects `--site-accent: #b2863b` as a generic
   fallback that can flash before the division accent hydrates.

## This PR (slice A — accent truth + theme recipe + chrome budget)

- **`company.ts` is now the ONE accent source including the dark variant:**
  `DivisionConfig.accentTextOnDark?` added; the seven hand-tuned values moved
  in verbatim.
- **`createDivisionPublicThemeStyle` (`@henryco/ui/public-shell`)** owns the
  provably-common core: accent triplet (config-read), owned-type live/interim
  display+sans switching, `--hc-font-*` seam bridge, display alias vars.
  Division-specific blocks (legacy `--<division>-*` aliases, `--hc-*` remap
  choices) stay app-local via `extra` — they diverge deliberately and
  unifying them would change pixels. Escape hatches document real divergence:
  `accentTextOverride` (jobs hand-tunes AA below config), `serifStackOverride`
  (property inserts "Cormorant Garamond").
- **Pixel-identity proof:** `division-public-theme.test.ts` transcribes every
  legacy literal as a fixture; the factory must emit them byte-equal. Care's
  fork is healed (config values are identical hexes).
- **Chrome budget token:** `--hc-shell-topbar-height: 64px` in
  `theme/tokens.css`; the marketplace bar consumes it
  (`h-[var(--hc-shell-topbar-height,4rem)]`). The shared PublicChrome is
  padding-derived and rests under the budget.

## Remaining slices (in redesign order)

- **B — `--acct-*` extraction:** shared `packages/ui/src/theme/account-tokens.css`
  (superset from apps/account incl. severity + division accents), imported by
  the shared layer; delete app-local duplicates app-by-app (hub first,
  account, then marketplace's scoped block). Inert by cascade: app-local
  definitions win until deleted.
- **C — `--site-*` handoff:** retire `--site-accent` from the blocking script
  (division accent must not flash); rewrite `PublicBrandTokens` surfaces onto
  `--home-*`; deprecate `public-tokens.ts` + legacy `public-header.tsx`.
- **D — theme keying:** standardize on light-first `:root` + `.dark` re-dark
  (property/learn/logistics currently invert).
- **E — studio editorial language as the shared layer** (Register-L
  primitives) — its own design pass.
- Hub homepage header to the 64 budget rides the hub redesign (owner order:
  command center LAST).
