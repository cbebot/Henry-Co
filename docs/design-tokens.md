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

---

This document supersedes all earlier per-pass tone descriptions. When a downstream doc disagrees, this one wins.
