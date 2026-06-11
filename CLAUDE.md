# HenryCo — agent instructions

Henry Onyx (legal: Henry Onyx Limited; code name "HenryCo") — a multi-division
platform monorepo (pnpm + Next.js apps under `apps/`, shared packages under
`packages/`). *Henry Onyx Limited is a space to think.*

## Company voice — applies to EVERYTHING you write

Every piece of written output — copy, microcopy, headings, CTAs, error
messages, notifications, emails, PDF documents, commit-facing user strings —
uses the company voice: **calm authority**. Plain, specific, confident
language. No hype, no manufactured urgency, no marketing superlatives, no
exclamation marks outside functional feedback ("Copied!").

| Instead of | Prefer |
|---|---|
| "Start your journey" | "Get started" |
| "Unlock powerful features" | "Access additional capabilities" |
| "Take control now" | "Manage your workspace" |
| "Revolutionize your workflow" | "Improve your workflow" |
| "Smart X" feature labels | "X" |
| "instantly" | the precise moment ("on booking", "in one step") |

- Canonical rule store: `packages/newsletter/src/voice.ts`
  (`DEFAULT_BANNED_PHRASES`) — extend it there, never fork a second list.
- **CI enforces this**: `pnpm tone:check` fails the required job on any
  banned phrasing. Run it before claiming any copy work done.
- Full standard: `docs/v3/public-voice-and-security.md` (Parts B + B2).
  Public marketing surfaces never name vendors/infrastructure (Part A).

## Brand

The brand is **"Henry Onyx"** — "Henry & Co." is retired; never write it into
anything user-facing. The code name "HenryCo" stays in code identifiers.

## Text & localization

All user-facing text lives in the typed copy modules (`packages/i18n/src/
*-copy.ts`, EN source of truth + per-locale partial overrides) or goes through
`translateSurfaceLabel`. **Never** hardcode user-facing strings in components;
**never** build a parallel text-token tree. When you edit an EN value, update
the locale overrides that carry it. Gates: `pnpm i18n:check:strict` (note: it
fingerprints by line, so className-only edits in a file with baselined gaps
re-key them — refresh the dated baseline in `docs/v3/i18n-gaps/` when that
happens).

## Typography (READING-01/02 — do not regress)

- `.hc-prose` owns the reading face + rhythm, **never colour** — ink is
  inherited from the host surface (forcing a colour token causes invisible
  text on hardcoded-dark panels).
- The `--hc-font-*` seam tokens compute at `:root`; to repoint them on a
  subtree, re-declare `--hc-font-*` themselves on the element carrying the
  `next/font` `.variable` classes (never just the inner `--font-*` var).
- Division landing/card structure stays sans; the serif reading face is for
  genuine reading prose only (hero ledes, section intros, FAQ answers, legal
  long-form). Standard: `docs/v3/reading-foundation.md` +
  `docs/v3/typography-language-ecosystem-findings.md`.

## Hard boundaries

- `packages/search-ui` is owner-reserved — never modify it.
- Payments: money invariants are absolute; status is provider-confirmed truth.
- Before claiming done: lint + typecheck the touched apps, run
  `pnpm i18n:check:strict` and `pnpm tone:check`, and verify visual changes in
  BOTH themes.
