# SP2 — `/v3` Story Page + Earning Map — Design Spec

**Date:** 2026-07-07 · **Sub-project:** SP2 of the V3 Launch Showcase · **Depends on:** SP1 (`@henryco/interactions`, PR #440)
**Governing docs:** V3-96 S2.1 + S2.3, the doctrine (Principles 9/11/12/14, Part III Earning Map), `feedback_no_giant_hero_text.md`.

## Purpose

The two signature public surfaces of the showcase, hosted in the hub `(site)` subtree (inherits `PublicSiteShell`, Fraunces display via `--font-fraunces`, `public-design.css`):

1. **`/v3` — the story page (S2.1).** 8-second comprehension of what Henry Onyx is. **Self-verifying claims:** instead of static screenshots + footnotes to internal reports, every claim row deep-links to the LIVE surface that proves it (`henryDomain(...)`) — the honesty audit as a feature. Capability evidence above the fold; no giant hero text; ONE primary action (Principle 9).
2. **`/v3/how-we-earn` — the Earning Map (S2.3).** Part III of the doctrine rendered as a public surface: the three tests every revenue moment must pass, then division-by-division *mechanism + what you get in exchange*. **No invented numbers** — mechanisms only; rows where a division's monetization is still early say so explicitly ("published here before it turns on"). The platform fee is named with the canonical explainer ("supports verification, dispute resolution, and 24/7 support").

## Honesty reconciliation (vs. the full V3-96 S2.1)

The V3-96 spec's 12-pillar story with per-pass closure-report footnotes presumes the 95-pass program is complete. It is not; a page claiming that would be vaporware, which the doctrine forbids. SP2 therefore ships the **present-tense honest version**: what is live today, provable by clicking. When the program closes, the pillar/footnote layer extends this page — it does not replace it.

## Implementation

- **Files:** `apps/hub/app/(site)/v3/page.tsx`, `apps/hub/app/(site)/v3/how-we-earn/page.tsx`.
- **Composition:** `@henryco/ui/public-design` primitives only (`Section`, `SectionHeader`, `Eyebrow`, `DisplayHeading`, `Lede`, `EditorialList`, `EditorialRow`, `Card`, `PublicCTA`, `Hairline`) — zero invented chrome.
- **Brand/URLs:** names from `COMPANY` / `getDivisionConfig`; links via `henryDomain` / `getDivisionUrl` / relative hub paths. Zero hardcoded domains or brand strings.
- **Copy:** new `v3: { story, earn }` namespace in `packages/i18n/src/hub-public-copy.ts` — EN baseline exhaustive; native fr/es/pt/ar/de/it/zh partials; hi/ig/yo/ha EN-fallback-by-omission (repo convention; never machine-xlat).
- **Telemetry:** server-side `emitEvent({ name: "henry.v3.showcase.viewed", ... })` per the `(site)/services` precedent, with `surface` payload (`v3_story` / `v3_earning_map`). (The event was added to the typed union in SP1.)
- **Metadata:** `generateMetadata` with localized title/description + canonical alternates, mirroring `(site)/about`.
- **Rendering:** server components; `Promise.allSettled`-style resilience where fetchers appear (none needed in v1 — both pages are config+copy-driven, so no loading theater at all).

## Acceptance

- Typecheck green (hub + i18n); `pnpm i18n:check` introduces no new GAPs.
- One primary CTA above the fold on each page; secondary affordances demoted (`secondary`/`ghost`).
- No invented testimonials, rates, or screenshots; every claim row resolves to a live URL.
- AA contrast inherited from tokens; hit targets ≥44px via `PublicCTA`/row padding; RTL unaffected (logical properties come from the shared shell).
