# HenryCo Public Design System

_V3-PUBLIC-DESIGN-01 · the shared visual language for every Henry & Co. **public**
(marketing / landing) surface. Pioneered on the hub homepage, formalised here, proven
on the hub pilot. This document is the **handoff contract**: the Phase-2 per-site
agents consume it verbatim. If something here is ambiguous, fix the doc — do not guess._

- **Token layer:** `packages/ui/src/styles/public-design.css` (the `--home-*` system)
- **Components:** `@henryco/ui/public-design` (`packages/ui/src/public-design/`)
- **Display font:** Fraunces (self-hosted via `next/font`, see §6)
- **Reference implementation:** the hub — `apps/hub/app/(site)/*`

---

## 1. Philosophy — Confident Restraint

Nine principles. They are decided, not optional. Every public surface obeys them.

1. **One breath per section.** Each section makes ONE point with ONE focal element.
   If you can't state its single purpose in a sentence, cut or merge it.
2. **Words are expensive.** Short, human headlines; one lede. A visitor grasps each
   section in ~3 seconds. Aim to roughly halve existing copy while saying more.
3. **Space is the luxury signal.** Generous whitespace, never cramped.
4. **Hierarchy by scale and distance, not colour noise.** Big/small, near/far, a
   restrained palette, ONE confident accent.
5. **Show the real thing.** Concrete proof and real numbers over adjectives.
6. **Warm, not corporate.** Language a real person says; benefit-first; Nigerian-human.
7. **One spine, ten expressions.** Every site shares this skeleton + these tokens; each
   division gets personality WITHIN the system (via its accent + copy + imagery).
8. **Motion that serves.** Reveals/micro-interactions that guide or reward — never lag.
9. **Mobile is the main stage.** Design thumb-first; desktop is the enhancement.

**The narrative arc** (cut anything that doesn't serve it):
`Hook → What it is → The one reason it's better → Real proof → How it works (only if
needed) → One clear invitation.`

> The Phase-1 audit (`.codex-temp/v3-public-design/01-audit.md`) found the platform
> averaging ~60/100, failing the same five ways everywhere: text-bloat, kicker-overuse
> flattening hierarchy, no narrative climax / uniform spacing, adjectives over proof,
> and divergent token systems. This system is the root fix for all five.

## 2. Two systems — pick the right one

| System | File | Use for |
|---|---|---|
| **`--hc-*`** | `packages/ui/src/styles/globals.css` | DASHBOARD / app chrome — dense, functional, inside authenticated product. |
| **`--home-*`** | `packages/ui/src/styles/public-design.css` | **PUBLIC** landings + public routes — editorial, spacious, warm. **This doc.** |

They deliberately share primitives via `var()` aliases (mono font, easing curves) so
motion + numerals read identically platform-wide. Never paint a public marketing page
with raw `--hc-*` dashboard tokens, and never hardcode hex on a public surface.

## 3. Colour tokens (`--home-*`)

Warm near-black ink on warm paper (light, the primary theme) ⇄ paper ink on near-black
(dark). Both themes flip automatically via `next-themes` (`.dark`); **author once, no
per-class `dark:` variants.**

**Canvas / surfaces:** `--home-canvas`, `--home-canvas-deep` (sunken bands/footer),
`--home-sheet` (raised), `--home-glass` / `--home-glass-strong` (frosted chrome).

**Ink ramp (primary → faintest):** `--home-ink`, then `--home-ink-92 / -90 / -85 / -80
/ -75 / -70 / -65 / -60 / -55 / -50 / -35 / -30`. Guidance: **headings** `-92/-90`,
**body** `-75/-70`, **secondary** `-65/-60`, **captions/eyebrows** `-50`. (`-50` is the
faintest that still clears AA for normal text; never go below it for real copy.)

**Hairlines:** `--home-line` (+ `-08 / -12 / -15`). **Tint surfaces:** `--home-surface`
(+ `-02 / -04 / -07 / -10`).

**Accent ramp (the one confident accent):**
`--home-accent` (fills/dividers/focal mark) · `--home-accent-strong` (hover/pressed,
derived) · `--home-accent-soft` (tints/chips, derived) · `--home-accent-ring`
(focus halo, derived) · `--home-accent-ink` (text/icon ON an accent fill — dark-on-gold,
8.6:1) · `--home-accent-text` (accent rendered AS text on the canvas — AA-safe).

**Accessibility:** the inline ratios in `public-design.css` document each default pair
at AA. The CI contrast gate (`scripts/a11y/contrast-matrix.mjs`) only reads `company.ts`
division accents, not these CSS tokens — so this layer can't regress the gate; AA here is
held by design. Any new accent you introduce must clear AA as accent-text on the canvas.

## 4. Typography

**Families:** display = **Fraunces** (`--home-font-display`, serif→serif fallback);
body = **system sans** (`--home-font-sans`, zero web-font cost); numerals = **mono**
(`--home-font-mono`, tabular — shared with the platform). Distinctiveness lives in the
display + the spatial system; body stays system-sans for mobile speed.

**The scale** (utility classes; sizes are fluid `clamp()` capped to honour "gravity, not
size" — no viewport-filling hero):

| Class | Role | Family | Notes |
|---|---|---|---|
| `.home-eyebrow` | section kicker | sans | 11px upper, tracked. **Max 2–3 per page.** |
| `.home-display-xl` | the rare top statement | serif | clamp → 3.25rem cap |
| `.home-display` | section statement | serif | clamp → 2.5rem cap |
| `.home-headline` | sub-section | serif | |
| `.home-title` | card / row title | serif | 600 |
| `.home-lede` | the ONE sub-line | sans | one sentence |
| `.home-body` / `.home-body-sm` | reading copy | sans | 1.6–1.65 line-height |
| `.home-caption` | metadata/footnote | sans | `-50` ink |
| `.home-num` | figures, IDs | mono | tabular |

Or use the React wrappers (`Eyebrow`, `DisplayHeading` with decoupled `level`+`size`,
`Lede`, `Body`) so the document outline and the visual tier stay independent.

**Do** pair exactly one display tier + one lede per section. **Don't** open every
section with an eyebrow (kicker fatigue), and **don't** let a section head render larger
than the page H1 (the inverted-scale fault).

## 5. Spacing & section rhythm — the "expensive" lever

Tokens (mobile-first clamps): `--home-gutter` (page padding), `--home-shell` (72rem
measure) / `--home-shell-prose` (44rem reading) / `--home-shell-wide`, and the rhythm
ladder `--home-section-y` / `-tight` / `-hero`.

Use the **`Section`** component (or `.home-section` + `.home-shell`): one rhythm band +
one centered measure. Vary the rhythm — give the hook and the proof beat more air than
the rest; don't stack N identical `space-y` gaps (the "no climax" fault). Mark a chapter
with `tone="sunken"` sparingly. Default container language is the **hairline-divided
list** (`EditorialList`/`EditorialRow`), not a card grid.

## 6. The display font (Fraunces) — self-hosted, subset, CLS-safe

Wire it with `next/font/google` in the app's **public** layout only (so it never loads on
dashboards), exposing `--font-fraunces`:

```tsx
// app/(public)/layout.tsx  (hub: app/(site)/layout.tsx)
import { Fraunces } from "next/font/google";
const fraunces = Fraunces({
  subsets: ["latin", "latin-ext"],   // Latin-script locales
  display: "swap",
  variable: "--font-fraunces",
  fallback: ["Iowan Old Style", "Palatino Linotype", "Baskerville", "Times New Roman", "Times", "serif"],
  adjustFontFallback: true,          // size-adjust/ascent-override → CLS ≈ 0 across the swap
});
// …then wrap the public subtree: <div className={fraunces.variable}>{children}</div>
```

`next/font` self-hosts the file (no runtime Google dependency), subsets it, preloads it,
swaps with a serif→serif fallback, and tunes fallback metrics so the swap doesn't shift
layout. **Do not** add `<link>` font tags or a runtime Google Fonts CSS URL.

## 7. Components — `@henryco/ui/public-design`

Server-safe, themeable, i18n-ready (all copy via props). Import the token CSS once
(below) and these compose the narrative arc:

- `Section`, `SectionHeader`, `Hairline`, `Reveal` — the scaffold + motion wrapper.
- `Eyebrow`, `DisplayHeading`, `Lede`, `Body` — typography.
- `PublicCTA` — one accent-aware button system (`primary` / `secondary` / `ghost`);
  renders `<a>` with `href`, else `<button>`. One dominant primary per surface.
- `PublicProofRail` — the **honest** proof rail: drops null/empty values and renders
  `null` if nothing real remains, so a fabricated/zero figure can never appear.
- `EditorialList` / `EditorialRow` — the hairline list (default over cards).
- `Card` — for genuine discrete-object moments only; calm, optional one-step lift.

```tsx
import { Section, SectionHeader, PublicCTA, PublicProofRail } from "@henryco/ui/public-design";

<Section id="standard" rhythm="hero" width="prose">
  <SectionHeader level={1} size="xl" eyebrow={t.eyebrow} title={t.statement} lede={t.sub} />
  <PublicCTA href="#how" variant="secondary">{t.cta}</PublicCTA>
  <PublicProofRail label={t.proofLabel} items={[{ value: stats.live, label: t.live }]} />
</Section>
```

## 8. Motion

CSS-only, SSR-safe, reduced-motion-aware (no JS dependency in the shared package):
`.home-rise` (one-time load entrance; stagger with `.home-delay-1..6`), `.home-reveal`
(scroll-triggered via `animation-timeline: view()` — progressive enhancement), `.home-lift`
(calm hover). The hidden state lives only inside the keyframe, so no-JS / unsupported /
reduced-motion users are never shown blank content. Easing aliases the platform curve
(`--home-ease` = `--hc-ease-standard`). Rich choreography (stagger/magnetic) remains
bespoke per surface (e.g. the hub homepage's framer-motion `useHomeMotion`).

---

## 9. ACCENT PARAMETERISATION RECIPE  ⟵ (Phase-2 contract)

> "One spine, ten expressions." A division changes the system's accent by setting **one
> or two CSS variables** on its public subtree. Everything else (`-strong`, `-soft`,
> `-ring`) is derived via `color-mix`; the ink ramp, type, and spacing are shared.

**Step 1 — read the division's accent from config (never hardcode).** Every division
already defines AA-verified accents in `packages/config/company.ts`:

```ts
const d = getDivisionConfig("care");
// d.accent      → "#6B7CFF"  (the colour soul; fills/dividers)
// d.accentText  → "#4F5BD0"  (AA-safe accent-as-text on a light surface)
// d.dark        → "#09112B"  (the division's deep canvas, if a custom dark is wanted)
```

**Step 2 — set the hooks on the public subtree** (the public layout wrapper, or the
shell that already sets `--accent`):

```tsx
<div
  className={fraunces.variable}
  style={{
    ["--accent" as string]: d.accent,          // → drives --home-accent (+ derived ramp)
    ["--accent-text" as string]: d.accentText, // → AA accent-as-text on the light canvas
    // optional, only if the light default isn't legible for this hue on the dark canvas:
    ["--accent-text-dark" as string]: "#E5C870",
  } as CSSProperties}
>
  {children}
</div>
```

That is the entire per-division colour change. `--home-accent`,
`--home-accent-strong/-soft/-ring`, every `PublicCTA`, focus ring, divider, and
`accent-text` now reflect the division. **The hub** sets only `--accent` (via
`PublicSiteShell`, from `brand_accent`) and relies on the gold AA defaults
(`--accent-text` falls back to `#8A6F00` light / `#E5C870` dark) — so it doesn't even
need step 2's `--accent-text`.

**Rules:**
- The accent is for ONE focal thing per section — don't paint every icon/kicker/bullet
  with it (the audit's "accent as decoration" fault).
- `--home-accent-text` must clear **AA (≥4.5:1) on `--home-canvas`** for the hue. The
  `company.ts` `accentText` values are already gate-verified; use them.
- Never set `--home-*` values directly in an app; only the `--accent*` hooks.

---

## 10. PHASE-2 MIGRATION GUIDE  ⟵ (Phase-2 contract)

For each of the 9 remaining sites (marketplace, property, care, jobs, learn, logistics,
studio, account-auth, staff-no-access). Do them one site at a time; keep CI green.

**A. Adopt the token layer + font**
1. In the app's `app/globals.css`, after the shared `globals.css` import, add:
   `@import "../../../packages/ui/src/styles/public-design.css";`
2. Wire Fraunces in the app's **public** layout exactly as §6 (scope it to public routes,
   not dashboards). Wrap the public subtree in `<div className={fraunces.variable}>`.
3. Set the division accent per §9 on that wrapper (read from `company.ts`).

**B. Retire the local token system progressively**
- Map the site's bespoke public tokens (`--market-*`, `--property-*`, `--care-*`,
  `--jobs-*`, `--learn-*`, `--logistics-*`, `--studio-*`, `.log-pf`, etc.) onto `--home-*`.
  Easiest path: alias them (`--market-bg: var(--home-canvas)`, `--market-ink:
  var(--home-ink)`, …) so existing components keep working while you migrate, then delete
  the aliases once components reference `--home-*`/the components directly.
- **Delete hardcoded hex** on public surfaces (e.g. permanent-dark `bg-[#…]`); the system
  is theme-aware — let it flip.

**C. Rebuild to the bar (apply the philosophy + the per-site audit)**
- Replace card-walls with `EditorialList`/`EditorialRow`; reserve `Card` for true tiles.
- Impose the narrative arc with `Section`/`SectionHeader`; one display tier + one lede
  per section; **cap eyebrows at 2–3 per page**.
- Cut copy ~half **at the `@henryco/i18n` typed-copy source** (so all 12 locales inherit
  the trim). Convert multi-sentence bodies to one line; strip adjective inflation.
- Promote real numbers to an early `PublicProofRail` (it self-suppresses if unreal).
- One dominant `PublicCTA variant="primary"` per surface; demote the rest.
- Give each route a DISTINCT focal silhouette — don't ship one hero template ×N pages.
- Route every `/pay/[id]` through the shared `@henryco/payment-surface` (already DRY).

**D. Preserve (do not regress)**
- The branded `error.tsx`, i18n foundation, `/api/health`, truthful empty states,
  structured logging, capped heroes (no giant text), single-accent discipline.
- Domains via `@henryco/config` helpers (`getDivisionUrl`, `getAccountUrl`, …) — **zero
  hardcoded domains**. Strings via `@henryco/i18n` — **zero hardcoded user-facing text**.
- Footer legal entity = **"Henry Holdings Limited"** (`COMPANY.group.legalName`); brand
  in copy = **"Henry & Co."**.

**E. Per-site verification (every site)**
`pnpm --filter @henryco/<site> typecheck && lint && build` clean · `pnpm a11y:contrast`
no-regress · Playwright mobile+desktop, light+dark, no console errors / hydration
mismatch · grep: zero hardcoded domains/strings introduced. Match the hub pilot.

### Do / Don't (quick reference)

| Do | Don't |
|---|---|
| One point + one focal element per `Section` | Stack 6–8 equal-weight sections |
| One eyebrow tier, ≤3 per page | Open every section with a kicker |
| `home-ink-75/70` body, `-50` captions | Body text below `-50` (fails AA) |
| Real numbers via `PublicProofRail` | "calmer/cleaner/premium" adjective lists |
| Hairline `EditorialList` by default | Walls of equal glass cards |
| Theme-aware `--home-*` | Hardcoded `bg-[#0a0807]` permanent dark |
| One primary CTA per surface | Three co-equal primary CTAs |
| Cut copy at the i18n source | Edit one locale, leave 11 long |
