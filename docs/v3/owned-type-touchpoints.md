# Owned Type — Text Touchpoints, Guarantees & Exceptions

Every surface that renders text, its font source, and whether the owned-type flip
(`data-onyx-type="live"` web / `EXPO_PUBLIC_ONYX_TYPE_LIVE` native) reaches it.

## Guaranteed (routes through `--hc-font-*` → the brand faces at reveal)

| Surface | Source | Notes |
|---|---|---|
| All 10 web app UIs | `--hc-font-*` seam via `brandFontVariables` on `<html>` + the `[data-onyx-type="live"]` cascade | reading/display/body/inputs + `.hc-prose`, `.hc-font-*`, `.hc-numeric` |
| `apps/account` + `packages/dashboard-shell` | `--acct-font-display/-sans` → **now `var(--hc-font-serif/sans)`** | fixed in Phase 5 (was a hardcoded system stack — the one real customer-facing leak) |
| studio display/sans | `--font-studio-display/-sans` → `var(--hc-font-serif/sans)` | mapped in Phase 1 |
| logistics portal, dashboard-shell surfaces | `var(--hc-font-display, …)` etc. | token-FIRST; the trailing system name is an unreachable fallback (`font:check` flags it as a false positive) |
| AI replies (studio copilot/brief, marketplace verify/draft/chat, Intelligence launcher) | `<AiProse>` / `.hc-prose` | reading serif |
| OG social images | self-hosted serif buffers (`packages/seo/src/og/fonts`) | owned; no CDN at render |
| PDFs | self-hosted buffers (`packages/branded-documents`) | owned |
| React Native (super-app, company-hub incl. Paper theme + nativewind) | `packages/rn-type` `brandType()` / `brandFontAssets` | flag-gated |

## Interim (correct at reveal; not a system-font leak)

- **Per-app `next/font/google`** (marketplace/jobs/studio/logistics/hub load Fraunces/Manrope/Newsreader, etc.). These feed `--font-display/-body`, which the flip's role-token override supersedes — so at reveal every surface is the **brand** face regardless. They are the interim face provider **and cannot be removed pre-reveal** without the pre-reveal UI falling to system fonts (that would break flag-dark). They are removed/replaced by the bespoke self-hosted faces **at reveal**.

## Documented EXCEPTIONS (cannot be fully guaranteed)

- **Email** (`packages/email`, `packages/newsletter`, `apps/jobs/lib/jobs/notifications.ts`, `apps/hub/lib/owner-reporting.ts`). Email HTML uses hardcoded font stacks (brand-genre serif/sans + system fallback) because **most email clients strip `@font-face`/webfonts before rendering** — no code controls their engine. Options: (a) host a stable public URL for the brand woff and add `@font-face` for the minority of capable clients (Apple Mail); (b) accept the named-face + system-fallback stack. **Decision: documented as the known exception** — the fallback stacks already name brand-genre faces; a hosted `@font-face` is an optional enhancement, not a guarantee.
- **`apps/work` + `apps/command`** — internal **staging** surfaces (`robots: noindex`, "no live data"). They use a separate `--cc-*` (command-surface) token system + a Google `@import`, not `--hc-font-*`. Not customer-facing; route them through `--hc-font-*` when they graduate from staging.
- **Third-party embedded surfaces** (payment iframes, provider widgets) — we cannot restyle another origin's fonts.

## Why `font:check` / `font:coverage` are NOT `--strict` yet (REVEAL-gated)

Flipping both guards to error-mode **now** is not possible without either failing CI on the legitimate interim state or breaking flag-dark:

1. **`font:coverage --strict` fails on the INTERIM faces.** The interim Fraunces/Manrope Latin subset does not cover Latin Extended (African diacritics) or CJK; the interim Noto CJK is a subset. Only the **bespoke superfamily** (commissioned to cover everything) makes coverage green. Coverage-strict is therefore **inherently a reveal-time flip** — and that is a feature: it forces the foundry cut to be complete before it can go live.
2. **`font:check --strict` would flag the interim `next/font/google`**, which cannot be removed pre-reveal (see Interim above). Its removal happens **at reveal** when the bespoke self-hosted faces take over.

**Activation at reveal (one step):** when the bespoke woff2/ttf are dropped in and the flag flips, add `-- --strict` to the `font:check` + `font:coverage` CI steps. Coverage then proves the real cut covers every shipped codepoint, and `font:check` blocks any system-font/Google regression permanently.

## Not-yet-guaranteed, honestly

- Email in webfont-stripping clients (above).
- `apps/work` + `apps/command` staging surfaces (above).
- Native pixels (RN) are compile-verified, not device-verified in this environment.
- The `--strict` guarantee lands at reveal, with the bespoke faces (above).
