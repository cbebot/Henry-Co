# Redesign Phase 1 — Unified Chrome + Token Consolidation — Design Spec

**Date:** 2026-07-08 · **Program:** Cross-Division Ecosystem Redesign (owner brief 2026-07-08)
**Phase 0 evidence:** live audit at 1440×900 — marketplace sticky chrome **194px (22% of viewport)**, studio 111px, learn 111px, hub 77px. Owner budget: **≤64px**, nothing floating over content.

## Findings that shape the phase (3-agent study, file-cited)

1. **The shared ≤64px chrome already exists.** `packages/ui/src/public-shell/public-chrome.tsx` (V3-PUBLIC-CHROME) is the modern engine: sticky single bar on `--home-*` tokens, scroll-condense to ~62px, ONE responsive search affordance, portal-safe division accents, shared nav registry (`public-shell/navigation/site-nav.<division>.ts`), BottomSheet mobile drawer, SkipLink, full i18n. Studio/learn are thin wrappers over it. **Phase 1 is adoption + slimming, not invention.**
2. **Marketplace never adopted it.** Its 194px chrome is app-local (`apps/marketplace/components/marketplace/public-header-client.tsx`): `px-3 pt-3` outer padding + floating `rounded-[2rem]` glass card + two-line brand lockup + decorative LIVE-CATALOG pill + TWO search affordances + second nav row with a static sentence. Real wiring that must survive: cart (`runtime.openCart()` + count), bell (unread count, guest-guarded), Vendor capability link, account chip identity/sign-out, the FIX-CHROME-01 BottomSheet drawer (untouched).
3. **The off-palette orange "Get started" is shared code** — `packages/ui/src/public/public-account-chip.tsx:322` hardcodes `bg-amber-600`. App-side `buttonClassName` override now; cross-division amber retirement is its own later PR.
4. **Token truth:** canonical layer = `--hc-*` (imported by all 11 apps; owned-type seam; motion/font already aliased by `--home-*`). Six accent spellings exist today; `packages/config/company.ts` division accents are the TS truth (a11y gate reads them) but nothing emits CSS from them. `--acct-*` is duplicated per-app with drifted values. No chrome-height token exists anywhere.

## The Phase-1 architecture

- **Canonical tokens:** extend `--hc-*` in place (never a 6th namespace). `--home-*` stays as the public/editorial register on top.
- **Accent truth:** `company.ts` → a shared injector setting `--accent/--accent-strong/--accent-text`; `--hc-accent*` repointed with today's values as fallbacks (pixel-identical until wired).
- **Chrome contract:** add `--hc-shell-topbar-height: 64px`; the shared chrome consumes only tokens.
- **Migration order (additive, zero breakage):** alias `--acct-*`/`--site-*` onto `--hc-*` in the shared layer (inert under app-local overrides) → accent injector app-by-app → per-division chrome adoption in redesign order (marketplace → studio → learn → hub → dashboards), deleting each app's local token block in the same PR → rewrite `PublicDesignTokens` class strings onto vars → retire `--site-*` inline style + standardize theme keying on `.dark`.

## Division PR #1 — Marketplace chrome demolition (this PR)

One file (`public-header-client.tsx` render tree), seven steps:
1. Kill the floating card: drop `px-3 pt-3` + the `market-panel rounded-[2rem]` wrapper → flat full-bleed sticky bar + hairline.
2. Kill row 2 (~60px): nav pills move into the single bar (xl+); the static `searchSummary` sentence dies; below xl the drawer already carries nav.
3. Collapse the brand lockup: 48px tile + two-line text → 32px monogram + one-line wordmark.
4. ONE search affordance: keep the local `GET /search` form at h-10 (Enter submits / icon submit); the hub-search link leaves the bar (already in the drawer — zero feature loss). `@henryco/search-ui` is never touched (marketplace has zero imports of it).
5. Delete the decorative LIVE-CATALOG pill (nothing wired to it).
6. Re-tone the signup CTA via `buttonClassName` to `--home-accent` bronze (same as the mobile "Join" already uses).
7. Preserve untouched: bell + guest guard, cart + count + `openCart`, Vendor link, account chip, the entire drawer + its theme re-scoping.

**Acceptance:** header `getBoundingClientRect().height ≤ 64` at 375/768/1024/1440, both themes, guest + signed-in paths compile; cart/bell wiring intact; `tsc`, `tone:check`, `i18n:check:strict` green (deleted strings may re-key the dated baseline — refresh if so).

## Later phases (order fixed by owner)
Studio (mostly a `dense` tune + strip audit) → learn → hub → user dashboard → owner dashboard last. Shared-layer follow-ups: `createDivisionPublicThemeStyle` factory, `<ChromeAnnouncementStrip>`, amber retirement in `public-account-chip`, `PublicChrome` `dense` prop, legacy `public-header.tsx`/`public-tokens.ts` deprecation.
