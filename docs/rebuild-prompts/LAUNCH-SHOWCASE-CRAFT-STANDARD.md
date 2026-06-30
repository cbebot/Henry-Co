# V3 Launch Showcase — Cinematic Craft Standard

**The bar:** the best public launch experience that exists, anywhere. Henry Onyx is a real
company pushing for global recognition — every public page is rebuilt, page by page, to that
standard. This document is the **shared craft layer every division rebuild prompt inherits**
(`logistics.md`, `care.md`, `property.md`, `jobs.md`, `learn.md`, `marketplace.md`,
`studio.md`, `hub.md`). Read it FIRST and IN FULL, then read your division prompt. The
division prompt says *what* to rebuild and *what contracts to preserve*; this says *to what
standard of craft*.

**Engine:** Claude Opus 4.8, ultracode, max effort. You were chosen for this over every
alternative. Hold that.

**Canonical + inherited (not a side doc):** this craft layer is inherited *verbatim* by the
final V3 showcase pass — `docs/v3/prompts/v3-96-closure-v3-showcase.md` (the capstone, "Inherited
craft layer" section) — and by every division rebuild prompt in this directory. It is the single
source of cinematic craft for the launch; keep it here and keep it current.

---

## 0. The charter — read this before you touch a file

This is a **page-by-page rebuild, restructure, and redesign** — not a re-skin, not a patch,
not a "good enough" pass. The following are non-negotiable, and breaking them brings shame to
the team:

1. **Take the whole prompt in. Do not split it into shallow shards.** Read the division
   prompt and this standard end-to-end before writing code. Build a complete mental model of
   the surface, its data contracts, and its motion choreography. An executor who skims and
   ships fragments produces fragments.
2. **No shallow work. Ever.** Every page is finished to the last hairline, the last focus
   ring, the last reduced-motion fallback, the last locale. "Mostly done" is not done. If you
   are tempted to leave a `TODO`, a placeholder, a stubbed section, or an un-themed color —
   stop and finish it.
3. **Leave nothing unclean.** No dead code, no commented-out blocks, no orphaned imports, no
   hardcoded strings, no console noise, no `any`-casts you didn't justify. The diff reads like
   it was authored by one exacting hand.
4. **Preserve every contract the division prompt names** (server actions, payloads, routing,
   i18n keys, data fetching, money invariants). Rebuild the *rendering and motion*; never the
   wording, the money, or the data path.
5. **Verify before you claim done** (Section 7). Evidence, not assertions.

If, at any point, a choice would make the page merely "nice" instead of *remarkable* — choose
remarkable, within the restraint rules below. Restraint is not the absence of ambition; it is
ambition with taste.

---

## 1. Brand + voice (absolute)

- The brand is **Henry Onyx**. The retired "Henry & Co." name and the legacy
  `henrycogroup.com` domain references in the older division prompts are **stale** — render
  everything as **Henry Onyx** (legal: Henry Onyx Limited; tagline *"a space to think."*).
  Code identifiers may keep `HenryCo`.
- **Voice = calm authority.** Plain, specific, confident. No hype, no manufactured urgency,
  no marketing superlatives, no exclamation marks outside functional feedback. The cinematic
  craft carries the awe; the *words* stay calm. (Canonical rules: `packages/newsletter/
  src/voice.ts`; CI: `pnpm tone:check`.)
- All user-facing strings flow through `@henryco/i18n` (12 locales, RTL-aware). Never hardcode
  copy; never build a parallel token tree. Gate: `pnpm i18n:check:strict`.

---

## 2. The cinematic craft system — the four instruments

Use these as a cinematographer uses a lens kit: deliberately, where the shot calls for it,
never all at once. Each has a **where-appropriate** rule and a **where-never** rule. Honoring
the "never" is what separates world-class from gaudy.

### 2.1 Scroll-driven build
The page **assembles itself as the visitor scrolls** — sections resolve from intention to
form: hairlines draw, type settles, evidence counts up, media racks into focus.

- **Technique:** prefer the native **scroll-driven animations** API (`animation-timeline:
  view()` / `scroll()`) for GPU-cheap, main-thread-free reveals; fall back to a single shared
  `IntersectionObserver` (one observer, many targets — never one-per-element) for browsers
  without it. Use `framer-motion` `whileInView` only where you need spring physics; keep
  `viewport={{ once: true }}` so sections don't re-animate on scroll-back.
- **Choreography:** stagger by *meaning*, not by index — the headline, then the proof, then
  the action. 60–120ms staggers. Movement is small (8–24px) and fast (240–480ms);
  `cubic-bezier(0.2, 0.7, 0.1, 1)` for the house ease. Opacity + transform only (never animate
  layout, width, height, or top/left).
- **Pinning / scrubbed sequences:** allowed for ONE flagship moment per page (a hero
  capability reel, a process walk-through). Must be skippable, must release the scroll cleanly,
  must never trap the user or hijack scroll velocity.
- **Where never:** never gate *content legibility* on scroll position (text must be readable
  if JS/animations never run — build with `@starting-style` / animate *from* a visible resting
  state, or reveal on load for above-the-fold). Never animate the thing the user came to read
  out from under them.

### 2.2 Cinematic clips
Short, **muted, looping** motion — a hero reel, an ambient section backdrop, a product-in-use
clip — that gives the page a film's sense of life.

- **Technique:** `<video muted loop playsinline preload="metadata">` with a real **`poster`**
  (the first frame, so there is never a blank box), `object-fit: cover`, and a tasteful
  scrim/gradient so foreground text holds **AA contrast**. Lazy-mount below-the-fold clips
  (IntersectionObserver) and `pause()` when off-screen to save battery/CPU. Provide a
  compressed modern codec + a fallback source; cap hero clips to a few seconds and a tight
  budget (see §6).
- **Where never:** never autoplay sound. Never let a clip block LCP or the first meaningful
  paint — the poster/static frame is what paints first. Under `prefers-reduced-motion: reduce`,
  **show the poster still, do not play.** Never put critical text *inside* the video frame
  (it won't localize or scale).

### 2.3 Film grain
A whisper of **grain/texture** over imagery and dark sections — the analog warmth that makes a
surface feel crafted rather than generated.

- **Technique:** a tiled SVG `feTurbulence` noise or a small repeating PNG as a fixed overlay
  at **very low opacity (≈3–6%)**, `mix-blend-mode: overlay`/`soft-light`, `pointer-events:
  none`, GPU-promoted (`will-change` only if measured-needed). One grain layer per surface,
  not per card.
- **Where never:** **never over reading prose** (`.hc-prose`) or dense body text — grain
  degrades legibility and fights the typography foundation (READING-01/02). Keep it on hero
  media, dark editorial bands, and image overlays. Theme-aware: lighter/different on the light
  register; it must never muddy text contrast in either theme.

### 2.4 Glass cards
**Frosted-glass** surfaces — `backdrop-filter` blur + a translucent fill + a fine top
highlight — for elements that float *over* imagery or motion.

- **Technique:** `backdrop-filter: blur(16–28px) saturate(120%)`, a theme-token translucent
  fill, a 1px hairline border from the design tokens, and a soft inner top-highlight. **Always
  provide a `@supports not (backdrop-filter: blur(1px))` opaque fallback** (a solid tokened
  surface) so the card is never an unreadable smear. Keep text on glass at **AA+**.
- **Where never:** never use glass as the *default* card — it is for elements over rich
  backgrounds (hero overlays, media captions, sticky CTAs over a clip). Never stack glass on
  glass. Never put long-form reading on glass. Editorial body stays on solid, calm surfaces.

> **The restraint rule that governs all four:** a page may feature **one** scroll-scrubbed
> hero moment, cinematic clips only where motion adds meaning, grain as an almost-subliminal
> finish, and glass only where something floats. If every section shouts, nothing is heard.
> Henry Onyx is calm authority — the craft is felt, not announced.

---

## 3. Design foundation (every page honors)

- **Typography is the spine.** Editorial hierarchy — rows, hairlines, prose rhythm, varied
  structure — never equal card grids or "long-card" footers. `.hc-prose` owns the reading
  face + rhythm and **never** a color (ink inherits from the host surface). Repoint the
  `--hc-font-*` seam tokens on a subtree; never the inner `--font-*`. No giant hero text that
  fills the viewport — substance above the fold (READING-01/02; `docs/v3/reading-foundation.md`).
- **Theme-aware, always.** Every color, fill, border, shadow, and grain comes from design
  tokens that adapt across the light/dark registers. **Zero hardcoded `rgba(255,255,255,…)` or
  hex** in markup — if a token doesn't exist, add it to both registers. Verify EVERY page in
  **both themes**.
- **Accessibility is not optional.** AA contrast on every text/background pair (including over
  clips and glass), visible focus rings, keyboard paths, semantic landmarks, real `alt`,
  `prefers-reduced-motion` honored by every animation, no motion that triggers vestibular
  issues. Gate: the `a11y` workflow.
- **Responsive, desktop-first-and-mobile-true.** No section that "fills the screen" with one
  element; constrained max-widths; the layout is composed at every breakpoint, not just
  reflowed. Test 360 / 768 / 1024 / 1280 / 1536.
- **Owner-reserved:** `packages/search-ui` and the `CrossDivisionSearchExperience` are never
  restyled — page-level metadata only.

---

## 4. Performance is part of the craft

A cinematic page that janks is a failed page. Budgets, per page:

- **LCP < 2.5s**, **CLS < 0.1**, **INP < 200ms** on a mid-tier device. The poster/first frame
  paints for LCP, never the video stream.
- Animations run on **compositor-only** properties (transform/opacity). No layout thrash, no
  animating `box-shadow`/`filter` in a scroll loop (pre-render layers).
- Clips: lazy, paused off-screen, budgeted bytes; grain: one cheap layer; glass: bounded count
  (blur is expensive — don't blur a dozen elements at once).
- Everything degrades: no-JS shows readable content; reduced-motion shows stills; old browsers
  get opaque fallbacks.

---

## 5. Per-page rebuild loop (apply to EVERY page in your division)

1. **Audit** the current page: its data contracts, server actions, i18n keys, routing
   directives — write them down; they are preserved verbatim.
2. **Compose** the editorial structure (hierarchy, rhythm, sections) — substance first.
3. **Choreograph** the motion: pick where (if anywhere) each of the four instruments earns its
   place. Default to restraint.
4. **Build** with tokens, i18n, and the foundation rules.
5. **Verify** (Section 7) — both themes, reduced-motion, keyboard, all breakpoints, all gates.
6. **Commit** the page as a clean, self-contained unit with a precise message. The branch is
   always shippable.

---

## 6. Stage the work; keep the branch green

Rebuild in commit-sized stages (foundation tokens → shared chrome → flagship page → editorial
sub-pages → independent flows). Each stage is independently `lint`/`typecheck`-verified and
committed, so the branch is always shippable and resumable. Never let the tree sit broken
between sessions.

---

## 7. Definition of done (evidence, not claims)

Before you say a page — or the division — is done, run and SHOW the output of:

- `pnpm run lint:all` → 0
- `pnpm run typecheck:all` → 0 (every app)
- `pnpm run test:workspace` → 0
- `pnpm run i18n:check:strict` → 0 new GAPs
- `pnpm run tone:check` → clean (the voice holds)
- `pnpm run build:all` → green
- **Manual:** every rebuilt page screenshotted/checked in **light AND dark**, with
  **reduced-motion on**, keyboard-only once, at 360/768/1024/1280/1536.

If any gate is red, the work is not done — fix the root cause; never weaken a gate to pass.

---

## 8. The standard, restated

You are building the public face of a real company aiming for global recognition. Make every
page feel inevitable, crafted, and calm — cinematic without noise, premium without hype,
alive without jank, and flawless in both themes and twelve languages. Take it all in, build it
all the way, leave it all clean. Nothing shallow. This is the best work — make it so.
