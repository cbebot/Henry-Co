# HenryCo Design Tokens — single source of truth

PASS 19. This document is the canonical reference for typography, color, and theme parity across every dashboard surface — user (account), owner, and staff. All shell primitives and dashboard apps speak this language.

The implementation lives in:
- `packages/ui/src/styles/globals.css` — canonical `--hc-*` CSS custom properties (light + dark) and the `.hc-*` utility classes.
- `packages/dashboard-shell/src/tokens/{type,color,spacing,focus,motion}.ts` — typed mirrors used inside shell primitives.
- Per-app `app/globals.css` (e.g. `apps/account/app/globals.css`, `apps/staff/app/globals.css`) — division-specific overrides that map app tokens onto the canonical `--hc-*` names.

## 1. Typography scale

All scale steps are semantic. Components reference them via the `.hc-*` utility classes or the `typeStyle()` helper.

| Token       | Size                       | Line   | Weight | Use                                              |
|-------------|----------------------------|--------|--------|--------------------------------------------------|
| display     | clamp(40px, 5vw, 64px)     | 1.05   | 700    | Hero numbers, dashboard greetings (rare)         |
| h1          | clamp(28px, 2.6vw, 36px)   | 1.18   | 700    | Page titles                                      |
| h2          | 22px                       | 1.30   | 600    | Section headers within a page                    |
| h3          | 18px                       | 1.35   | 600    | Card / panel titles                              |
| h4          | 14px                       | 1.40   | 600    | Small group headers, sub-card heads              |
| body-lg     | 16px                       | 1.60   | 400    | Important reading copy, descriptions             |
| body        | 14px                       | 1.55   | 400    | Default body text                                |
| body-sm     | 13px                       | 1.50   | 400    | Secondary body text                              |
| label       | 12px                       | 1.40   | 600    | Form labels, table headers                       |
| caption     | 12px                       | 1.40   | 400    | Metadata, timestamps, helper text                |
| micro       | 11px                       | 1.35   | 500    | Legal, footnotes (smallest acceptable)           |
| eyebrow     | 11px                       | 1.45   | 600    | All-caps section labels (`hc-eyebrow`)           |
| mono        | inherits adjacent size     | —      | —      | Amounts, IDs, timestamps (`hc-mono`)             |

### Rules

- Premium feel comes from contrast in scale, not from inflating body text.
- Body text never grows beyond 16px in dashboards. Information density matters.
- A page may render at most three heading levels in the same viewport.
- Use `hc-mono` (or `monoStyle()`) for any cell that is a number, ID, currency amount, or timestamp. It enables `tabular-nums` so columns align as data, not prose.
- Reading-heavy bodies (settings, support threads, documents) cap at 65ch line length.

### Font stack

- Primary serif: Source Serif 4 (only when an editorial accent is required).
- Primary sans: Inter (default body, headings, UI).
- Mono: system mono (`ui-monospace`, then `SF Mono`, `JetBrains Mono` if locally installed).

The font stack is owned by the host app via `next/font` and exposed as `--font-inter`, `--font-source-serif`, and `--hc-font-mono`. Shell primitives reference the variables, never the family literal — so swapping fonts at the host level requires no shell change.

## 2. Color tokens

Every token below has a light value and a dark value. Tokens never have an undefined mode. Components reference these names; magic numbers (`bg-[#0c0e14]`, `text-zinc-900`) are forbidden in dashboard surfaces.

### Surface tokens

| Token                  | Role                                    | Light            | Dark                                    |
|------------------------|-----------------------------------------|------------------|-----------------------------------------|
| `--hc-surface-base`    | Page background (the stage)             | `#fafaf9`        | `#0a0a0b`                               |
| `--hc-surface-raised`  | Cards, panels                           | `#ffffff`        | `rgba(20, 20, 24, 0.94)`                |
| `--hc-surface-overlay` | Modals, popovers, dropdowns             | `#ffffff`        | `rgba(14, 14, 18, 0.98)`                |
| `--hc-surface-sunken`  | Inset areas, code blocks                | `#f4f4f5`        | `rgba(28, 28, 34, 0.78)`                |

Legacy aliases `--hc-bg`, `--hc-surface`, `--hc-surface-strong`, `--hc-paper` continue to resolve to the same values for back-compat.

### Text tokens

| Token                    | Role                                               | Light                       | Dark                          |
|--------------------------|----------------------------------------------------|-----------------------------|-------------------------------|
| `--hc-text-primary`      | Headings + highest-emphasis body                   | `#18181b` (14.4:1 on base) | `#fafaf9` (16.5:1 on base)    |
| `--hc-text-secondary`    | Standard body                                      | `rgba(24,24,27,0.72)`       | `rgba(250,250,249,0.72)`      |
| `--hc-text-tertiary`     | Metadata, helper text, kickers                     | `rgba(24,24,27,0.62)`       | `rgba(250,250,249,0.52)`      |
| `--hc-text-quaternary`   | Lowest emphasis (placeholders, decorative copy)    | `rgba(24,24,27,0.46)`       | `rgba(250,250,249,0.36)`      |
| `--hc-text-inverse`      | Text on inverted-theme surfaces                    | `#fafaf9`                   | `#18181b`                     |
| `--hc-text-on-accent`    | Text on top of an accent fill                      | `#1A1814`                   | `#1a1814`                     |
| `--hc-text-disabled`     | Disabled state                                     | `rgba(24,24,27,0.36)`       | `rgba(250,250,249,0.32)`      |

### Border tokens

| Token                  | Role                  | Light                  | Dark                    |
|------------------------|-----------------------|------------------------|-------------------------|
| `--hc-border-subtle`   | Hairline divider      | `rgba(24,24,27,0.08)`  | `rgba(255,255,255,0.10)` |
| `--hc-border-default`  | Default border        | `rgba(24,24,27,0.12)`  | `rgba(255,255,255,0.14)` |
| `--hc-border-strong`   | Emphasised divider    | `rgba(24,24,27,0.14)`  | `rgba(255,255,255,0.18)` |
| `--hc-border-focus`    | Focus ring            | `#C9A227`              | `#D4AF37`                |

### Status tokens

Each status carries a `bg`, `text`, and `border` variant, all AA-contrast verified.

| Status     | Light bg                 | Light text | Light border             | Dark bg                  | Dark text | Dark border              |
|------------|--------------------------|------------|--------------------------|--------------------------|-----------|--------------------------|
| success    | `rgba(22,163,74,0.10)`   | `#15803d`  | `rgba(22,163,74,0.30)`   | `rgba(34,197,94,0.14)`   | `#4ADE80` | `rgba(34,197,94,0.40)`   |
| warning    | `rgba(217,119,6,0.10)`   | `#B45309`  | `rgba(217,119,6,0.32)`   | `rgba(245,158,11,0.14)`  | `#FBBF24` | `rgba(245,158,11,0.42)`  |
| danger     | `rgba(220,38,38,0.10)`   | `#B91C1C`  | `rgba(220,38,38,0.30)`   | `rgba(239,68,68,0.14)`   | `#FCA5A5` | `rgba(239,68,68,0.40)`   |
| info       | `rgba(2,132,199,0.10)`   | `#0369A1`  | `rgba(2,132,199,0.30)`   | `rgba(56,189,248,0.14)`  | `#7DD3FC` | `rgba(56,189,248,0.40)`  |

Status colors must always pair with an icon or label — never rely on color alone. Color-blind users get the same signal.

### Accent (the HenryCo gold)

Premium HenryCo gold — confident, brushed-metal, never highlighter-yellow.

| Token                       | Light       | Dark        | Use                                      |
|-----------------------------|-------------|-------------|------------------------------------------|
| `--hc-accent` (default)     | `#C9A227`   | `#D4AF37`   | Primary fill: buttons, badges, focus     |
| `--hc-accent-strong` (hover)| `#A88718`   | `#E5C870`   | Hover/highlight depth                    |
| `--hc-accent-pressed`       | `#8A6F00`   | `#B89425`   | Pressed state                            |
| `--hc-accent-soft`          | `rgba(201,162,39,0.10)` | `rgba(212,175,55,0.16)` | Subtle tint backgrounds   |
| `--hc-accent-text`          | `#8A6F00`   | `#E5C870`   | Gold rendered as text on surface         |
| `--hc-accent-on-surface`    | `#8A6F00`   | `#E5C870`   | Same as accent-text — alias              |

Rules:
- Brand fill `#C9A227` is luminous; white text on it is only 2.4:1 — fails AA. The HenryCo pair is dark ink (`#1A1814`) on gold (7.3:1) — premium and AA-passing. `--hc-text-on-accent` defaults to dark ink in light mode.
- For text rendered as gold on a light surface, use `--hc-accent-text` (`#8A6F00`, 4.8:1 on white).
- For gold text on the dark surface, use `#E5C870` (8.4:1 on dark base).
- The dark-mode default `#D4AF37` is the classic metallic gold tone — calmer and more confident than amber-500. Never substitute amber.

## 3. Theme parity rules

1. Every `--hc-*` token has a value in both `:root` (light) and `.dark`. No undefined mode.
2. Components never hardcode hex values for surfaces, text, or borders — they reference `--hc-*` or the `STATUS_VARS` pointer constants.
3. A surface that is intentionally locked to a single theme (e.g., a brand-fixed dark hero panel inside a light dashboard) must declare its own self-contained palette, including text colors. It must not borrow `--hc-text-primary` from its parent surface — that breaks contrast on the inverse theme.
4. The `.dark` class on `<html>` is set pre-paint by `HenryCoThemeBlocking` and maintained by `next-themes`. The `colorScheme` CSS property is synced for native form-control rendering.
5. App-level `app/globals.css` files map their division-local tokens (e.g., `--acct-gold`, `--staff-gold`) onto the canonical `--hc-*` names so dashboard-shell primitives inherit the brand language automatically.

## 4. Approved patterns

### Page header

```tsx
import { PageHeader } from "@henryco/dashboard-shell";

<PageHeader
  kicker="Wallet"
  title="Balance & activity"
  description="Top up, withdraw, and watch every henrycoin land in real time."
/>
```

Renders the kicker as `--hc-accent-text` (gold), the title at the `h1` scale (clamp(28px, 2.6vw, 36px), 700 weight) in `--hc-text-primary`, and the description at `body-lg` in `--hc-text-secondary`, capped at 65ch.

### Section header

```tsx
import { Section } from "@henryco/dashboard-shell";

<Section kicker="Last 7 days" headline="Activity" description="Cross-division event stream.">
  {/* content */}
</Section>
```

### Card / panel surface

Use `class="hc-surface-raised"` or the `Panel` shell primitive. Default padding inside cards is `p-6` (24px). Compact cards use `p-4`; hero panels use `p-8`.

### Empty state

Use the `EmptyState` shell primitive — it already references `--hc-text-secondary` for the body and `--hc-text-tertiary` for the caption.

### Toast

Toasts inherit status tokens. A success toast uses `--hc-status-success-bg` / `-text` / `-border`. Always include an icon and label (no color-alone signaling).

### Numeric / monetary cells

```tsx
<span className="hc-mono">₦{amount.toLocaleString()}</span>
```

`hc-mono` enables `tabular-nums` so column figures align.

## 5. Hierarchy and density discipline

- Typography weights per page: maximum three (regular, semibold, bold). Never mix four.
- Padding inside cards: `p-6` standard / `p-4` compact / `p-8` hero — pick one and apply it consistently.
- Vertical rhythm between major sections: `1.5rem` default, `2rem` for hero/intro pairs.
- Reading body never exceeds 65ch.
- Numerical-heavy areas (wallet, payments, transaction history, KPIs) use `hc-mono` for amounts.

## 6. Accessibility

- All `--hc-text-*` × `--hc-surface-*` pairs hit WCAG AA (4.5:1 body, 3:1 large) in both modes.
- Status tokens hit AA on both their `bg` variant and the matched canonical surface.
- Focus rings use `--hc-focus-ring` and meet 3:1 against any adjacent surface.
- The `--hc-accent` fill at 2.7:1 against white is for button fills with `--hc-text-on-accent` on top — body text rendered as gold uses `--hc-accent-text` instead.

A scripted contrast audit lives at `scripts/a11y/contrast-matrix.mjs` (run via `pnpm a11y:contrast`). The audit asserts every surface × text pair documented above.

## 7. The "never hardcode color" policy

- `bg-[#0c0e14]`, `text-zinc-900`, `bg-white` — forbidden in any dashboard surface that ships to a public route.
- `style={{ color: "#1F8B4C" }}` — forbidden. Use `STATUS_VARS.success.text` (or the `.hc-status-success-text` CSS variable directly).
- `text-amber-700` for warnings — forbidden. Use the warning status pair.
- One exception: brand-fixed marketing-style panels embedded inside a dashboard may declare a self-contained palette — but it must be a complete palette including text colors, scoped to the panel.

PRs that introduce new hardcoded values should be flagged in review. The audit script `scripts/a11y/headers-scan.mjs` and the next theme-audit pass will catch leakage.

## 8. Elevation

PASS 20. The dashboard speaks in four elevation steps. Restraint is the standard — cards barely lift, overlays read as another sheet of paper, not a billboard. In dark mode a heavy outset shadow over a near-black surface reads as a smudge, so the pattern flips to a 1px inset top highlight ("light from above") plus a calibrated drop shadow.

| Token              | Use                                | Light                                                                 | Dark                                                                                                                              |
|--------------------|------------------------------------|-----------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------|
| `--hc-elevation-0` | Page background — no decoration    | `none`                                                                | `none`                                                                                                                            |
| `--hc-elevation-1` | Card on page — default surface     | `0 1px 2px 0 rgba(15,23,42,0.04)`                                     | `inset 0 1px 0 rgba(255,255,255,0.04), 0 1px 2px 0 rgba(0,0,0,0.30)`                                                              |
| `--hc-elevation-2` | Popover, dropdown, modal           | `0 12px 32px -8px rgba(15,23,42,0.12), 0 4px 12px -4px rgba(15,23,42,0.06)` | `inset 0 1px 0 rgba(255,255,255,0.06), 0 24px 56px -8px rgba(0,0,0,0.48), 0 8px 16px -4px rgba(0,0,0,0.32)`                       |
| `--hc-elevation-3` | Toast, command bar — highest layer | `0 20px 48px -8px rgba(15,23,42,0.16), 0 8px 20px -4px rgba(15,23,42,0.08)` | `inset 0 1px 0 rgba(255,255,255,0.08), 0 32px 72px -12px rgba(0,0,0,0.56), 0 12px 24px -6px rgba(0,0,0,0.40)`                     |

Rules:
- A card hover-lift bumps from `e1` to `e2` over `--hc-duration-base`. Pressed: drop back to `e1`. Never use raw color shifts to indicate hover on a card.
- The legacy `--hc-shadow` / `--hc-shadow-soft` pair stays for back-compat. New code uses `--hc-elevation-{0,1,2,3}`.
- A surface that locks itself to a single theme (e.g., a brand-fixed dark hero panel inside a light dashboard) may use the literal values from `ELEVATION_LIGHT` (`packages/dashboard-shell/src/tokens/elevation.ts`) at an inline call site, but must declare the choice in a comment.

## 9. Motion + easing

### Duration scale

| Token                | Value | Use                                                              |
|----------------------|-------|------------------------------------------------------------------|
| `--hc-duration-fast` | 120ms | Taps, hovers, focus-visible — single beat, no animation feel     |
| `--hc-duration-base` | 180ms | Most state transitions: button press, switch flip, tab slide     |
| `--hc-duration-slow` | 260ms | Surface arrival: modal enter, bottom sheet, drawer               |

The PASS 17/18 `FADE_MS` (200ms) and the 120ms `MOTION_PRESET.buttonPress` map onto `base` and `fast` respectively and stay wired for back-compat.

### Easing curves

| Token                  | Curve                                          | Use                                                                                  |
|------------------------|------------------------------------------------|--------------------------------------------------------------------------------------|
| `--hc-ease-standard`   | `cubic-bezier(0.22, 1, 0.36, 1)`               | Most entrances. The dashboard's primary curve. Mirrors `EASE_OUT` in shell tokens.   |
| `--hc-ease-in-out`     | `cubic-bezier(0.4, 0, 0.2, 1)`                 | State changes that "settle on both sides" — toggle flips, tab switches.              |
| `--hc-ease-emphasized` | `cubic-bezier(0.34, 1.40, 0.64, 1)`            | **Celebration only** — success-lock, confirm tick, payment-land. NEVER on chrome.    |
| `--hc-ease-linear`     | `linear`                                       | Opacity-only crossfades on micro-interactions where any easing over-emphasises.      |

### Reduced motion

Components consuming the duration tokens directly via inline `transition` MUST wrap themselves:

```css
.my-component { transition: transform var(--hc-duration-base) var(--hc-ease-standard); }
@media (prefers-reduced-motion: reduce) {
  .my-component { transition: none; }
}
```

`MOTION_KEYFRAMES_CSS` (`packages/dashboard-shell/src/tokens/motion.ts`) already collapses each keyframe to opacity-only when `prefers-reduced-motion: reduce`. New components should follow the same pattern.

### Approved micro-interactions

Only the patterns below earn their place. Bouncy springs on productivity controls, confetti, sparkles, and continuous animation are forbidden.

- Button press: 98% scale + slight color depth shift, `fast` / `ease-standard`
- Tab indicator slide between tabs, `base` / `ease-standard`
- Toggle switch: light spring, `base` / `ease-emphasized` (this is the rare productivity-side use of emphasized)
- Checkbox check stroke draw, ~200ms / `ease-standard`
- Number counter morph on amount changes, ~300ms / `ease-standard` — no bounce
- Card hover lift: `e1` → `e2`, 1–2px translateY, `base` / `ease-standard`
- Modal/sheet enter: slide+fade, `slow` / `ease-standard`
- Skeleton shimmer: slow, calm, ~1.6s loop / `linear`
- Toast slide-in from edge with fade, `slow` / `ease-standard`
- Notification badge pulse on new arrival: one pulse only, `slow` / `ease-standard`

## 10. Interaction states

Every interactive element MUST design all six states. A component review that cannot answer all six is incomplete.

| State            | Pattern                                                                                                  |
|------------------|----------------------------------------------------------------------------------------------------------|
| default          | Surface + text + border at their declared tokens                                                         |
| hover            | Layer `var(--hc-state-hover-overlay)` over the fill, transition over `--hc-duration-base`                |
| pressed (active) | Layer `var(--hc-state-pressed-overlay)` over the fill, transition over `--hc-duration-fast`              |
| focus-visible    | Inset 2px `var(--hc-border-focus)` ring (`focusVisibleStyle()` from `tokens/focus.ts`)                   |
| disabled         | Apply `opacity: var(--hc-state-disabled-opacity)` + `pointer-events: none` + `aria-disabled="true"`      |
| loading          | Inline spinner; button width does not shift — reserve label space with the static glyph in place         |

### Overlay tokens

| Token                          | Light                  | Dark                           |
|--------------------------------|------------------------|--------------------------------|
| `--hc-state-hover-overlay`     | `rgba(24,24,27,0.04)`  | `rgba(255,255,255,0.05)`       |
| `--hc-state-pressed-overlay`   | `rgba(24,24,27,0.08)`  | `rgba(255,255,255,0.10)`       |
| `--hc-state-disabled-opacity`  | `0.55`                 | `0.50`                         |

### Application pattern

```css
.hc-actionable {
  position: relative;
  transition: box-shadow var(--hc-duration-base) var(--hc-ease-standard);
}
.hc-actionable:hover {
  box-shadow:
    var(--hc-elevation-2),
    inset 0 0 0 9999px var(--hc-state-hover-overlay);
}
.hc-actionable:active {
  box-shadow:
    var(--hc-elevation-1),
    inset 0 0 0 9999px var(--hc-state-pressed-overlay);
  transition-duration: var(--hc-duration-fast);
}
.hc-actionable[aria-disabled="true"] {
  opacity: var(--hc-state-disabled-opacity);
  pointer-events: none;
}
```

Focus-visible composes ON TOP of any hover state — both rings can render simultaneously without conflict because focus is inset and overlays are scoped to fill.

---

This document supersedes all earlier per-pass tone descriptions. When a downstream doc disagrees, this one wins. PASS 20 closes the furnishing-system tokens (elevation, motion duration scale, emphasized easing, interaction-state overlays); component-level application of these tokens is the next pass.
