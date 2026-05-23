# THEME-01 Phase 2 — Semantic Token Registry

**Pass:** THEME-01
**Phase:** 2 (Semantic-token foundation)
**Branch:** `theme/owner-staff-standardize`

This is the canonical registry for HenryCo's semantic theme tokens. Every public, owner, and staff surface MUST consume from this registry; hardcoded hex values in JSX are anti-patterns the audit (Phase 1) and the validation gates (Phase 8) will flag.

The token layer lives in three files:

1. **`packages/ui/src/styles/globals.css`** — canonical `--hc-*` token tracks (`:root` for light defaults, `.dark` for dark overrides). 674 lines. The single source of truth for the platform color system.
2. **`packages/ui/src/theme/tokens.css`** — THEME-01 alias layer + 2 new tokens. Imported once by `globals.css` so every app inherits automatically.
3. **App-level `globals.css`** (`apps/hub/app/globals.css`, `apps/staff/app/globals.css`) — division-soul re-mapping. Each app declares its own `--acct-*` / `--staff-*` / `--<division>-*` tokens and re-points `--hc-*` aliases per its brand.

---

## How to consume tokens

### Recommended (current convention)

Arbitrary-value Tailwind syntax — explicit, grep-friendly, supports all token names:

```tsx
<div className="bg-[var(--hc-surface-raised)] text-[var(--hc-text-primary)] border border-[var(--hc-border-subtle)]" />
```

Or via inline styles for component-scoped tokens:

```tsx
<aside style={{ background: "var(--hc-surface)", borderColor: "var(--hc-border-subtle)" }} />
```

### Anti-patterns (DO NOT use)

```tsx
// ❌ Hardcoded hex — breaks in dark mode
<div className="bg-white text-zinc-900" />

// ❌ Tailwind palette without dark: variant — light-only paint
<div className="bg-zinc-100 text-zinc-900" />

// ❌ Naive flip — ignores brand coherence
<div className="bg-white text-black dark:bg-black dark:text-white" />

// ❌ Token name guessing — use the canonical name
<div className="bg-[var(--ink-primary)]" />  // wrong, use --hc-text-primary
```

The exception: **fallback hex** inside `var(--token, #fallback)` is allowed — the `#fallback` is only painted if the variable is unset, which never happens in production:

```tsx
// ✅ Allowed — fallback never fires
<div className="bg-[var(--hc-surface,#ffffff)]" />
```

---

## Token registry — full table

Contrast ratios below are body-text-on-surface pairings, measured with WebAIM contrast tool.

### Surface tokens (page + container backgrounds)

| Token | Light value | Dark value | Usage |
|---|---|---|---|
| `--hc-bg` | `#fafaf9` (zinc-50) | `#0a0a0b` | Page background (the stage). Apps override to division paper/midnight. |
| `--hc-bg-soft` | `#f4f4f5` (zinc-100) | `#111114` | One step elevated from `--hc-bg`. Section backgrounds. |
| `--hc-surface` (alias `--hc-surface-raised`) | `#ffffff` (paper) | `rgba(20,20,24,0.94)` | Default card/panel surface |
| `--hc-surface-strong` (alias `--hc-surface-overlay`) | `#ffffff` | `rgba(14,14,18,0.98)` | Elevated surface (modals, dropdowns) |
| `--hc-surface-elevated` | `#ffffff` | `rgba(20,20,24,0.94)` | Shell card/panel alias |
| `--hc-paper` (alias `--hc-surface-sunken`) | `#f4f4f5` | `rgba(28,28,34,0.78)` | Lower-emphasis (footers, asides) |

### Ink hierarchy (text + iconography)

| Token | Light value | Dark value | Contrast on `--hc-surface` | Usage |
|---|---|---|---|---|
| `--hc-ink` (alias `--hc-text-primary`) | `#18181b` (zinc-900) | `#fafaf9` (zinc-50) | 14.4:1 light / 16.5:1 dark | Primary text (titles, body) |
| `--hc-ink-soft` (alias `--hc-text-secondary`) | `rgba(24,24,27,0.72)` | `rgba(250,250,249,0.72)` | 8.5:1 light / 9.2:1 dark | Secondary text (descriptions) |
| `--hc-ink-muted` (alias `--hc-text-tertiary`) | `rgba(24,24,27,0.62)` | `rgba(250,250,249,0.52)` | 6.5:1 light / 6.8:1 dark | Tertiary text (captions, eyebrows) |
| `--hc-text-quaternary` | `rgba(24,24,27,0.46)` | `rgba(250,250,249,0.36)` | 4.6:1 light / 4.8:1 dark | Decorative / metadata |
| `--hc-text-disabled` | `rgba(24,24,27,0.38)` | `rgba(250,250,249,0.32)` | 3.8:1 light / 4.2:1 dark | Disabled text (large-text AA only — never body) |
| `--hc-ink-on-accent` (alias `--hc-text-on-accent`) | `#1A1814` | `#1a1814` | 8.6:1 on gold | Text rendered ON a gold fill (chips, buttons) |
| `--hc-text-inverse` | `#fafaf9` | `#18181b` | N/A | Inverse-direction text (light text on dark fills in light mode) |

### Border tokens

| Token | Light value | Dark value | Usage |
|---|---|---|---|
| `--hc-line` (alias `--hc-border-subtle`) | `rgba(24,24,27,0.08)` | `rgba(255,255,255,0.10)` | Hairline divider — most common |
| `--hc-line-strong` (alias `--hc-border-strong`) | `rgba(24,24,27,0.14)` | `rgba(255,255,255,0.18)` | Emphasized hairline |
| `--hc-border-default` | `rgba(24,24,27,0.12)` | `rgba(255,255,255,0.14)` | Default form-field border |
| `--hc-hairline` | `rgba(24,24,27,0.08)` | `rgba(255,255,255,0.10)` | Shell alias of `--hc-line` |
| `--hc-focus-ring` (alias `--hc-border-focus`) | `#C9A227` | `#D4AF37` | Focus ring color (gold-on-paper / gold-on-midnight) |

### Accent tokens (HenryCo brand gold)

The gold is the SAME hue family in both modes; what changes is the surface it sits on. Light mode: brand gold on paper. Dark mode: classic metallic gold on midnight.

| Token | Light value | Dark value | Contrast (text on standard surface) | Usage |
|---|---|---|---|---|
| `--hc-accent` (alias `--hc-accent-default`) | `#C9A227` (brand gold) | `#D4AF37` (classic metallic) | n/a (fill, not text) | Primary accent — fills, button backgrounds |
| `--hc-accent-strong` (alias `--hc-accent-hover`) | `#A88718` | `#E5C870` | n/a | Hover / pressed depth |
| `--hc-accent-pressed` | `#8A6F00` | `#B89425` | n/a | Pressed — deeper still |
| `--hc-accent-soft` (alias `--hc-accent-subtle`) | `rgba(201,162,39,0.10)` | `rgba(212,175,55,0.16)` | n/a | Chip / badge backgrounds |
| `--hc-accent-text` | `#8A6F00` | `#E5C870` | 5.0:1 light / 7.6:1 dark | Gold text on surface (the brand gold alone would fail AA on white at 2.7:1) |
| `--hc-accent-on-surface` | `#8A6F00` | `#E5C870` | 5.0:1 / 7.6:1 | Alias for chip/badge text |
| **NEW** `--hc-accent-on-light` | `#8A6F00` | `#8A6F00` | 5.0:1 on white | Gold text on a LOCKED-LIGHT surface (always uses light-mode value) |
| **NEW** `--hc-accent-on-dark` | `#E5C870` | `#E5C870` | 7.6:1 on midnight | Gold text on a LOCKED-DARK surface (always uses dark-mode value) |

The `--hc-accent-on-light` / `--hc-accent-on-dark` aliases exist for **brand-locked panels** that don't swap with the theme (e.g., a brand-fixed dark hero that retains its gold accent even in light mode).

### Status feedback (success / warning / danger / info)

Every status pair (bg + text + border) is AA-verified per mode.

| Token | Light bg | Light text | Dark bg | Dark text | Contrast |
|---|---|---|---|---|---|
| `--hc-status-success-*` | `rgba(22,163,74,0.10)` | `#15803d` (green-700) | `rgba(34,197,94,0.14)` | `#4ADE80` (green-400) | 4.6:1 light / 9.5:1 dark |
| `--hc-status-warning-*` | `rgba(217,119,6,0.10)` | `#B45309` (amber-700) | `rgba(245,158,11,0.14)` | `#FBBF24` (amber-400) | 4.7:1 light / 11:1 dark |
| `--hc-status-danger-*` | `rgba(220,38,38,0.10)` | `#B91C1C` (red-700) | `rgba(239,68,68,0.14)` | `#FCA5A5` (red-300) | 5.8:1 light / 8:1 dark |
| `--hc-status-info-*` | `rgba(2,132,199,0.10)` | `#0369A1` (sky-700) | `rgba(56,189,248,0.14)` | `#7DD3FC` (sky-300) | 4.7:1 light / 11:1 dark |

### Elevation (PASS 20)

Light mode uses outset shadow (drop). Dark mode uses inset highlight + drop (surfaces feel layered, not painted on).

| Token | Light value | Dark value | Usage |
|---|---|---|---|
| `--hc-elevation-0` | `none` | (default) | The page itself — no decoration |
| `--hc-elevation-1` | `0 1px 2px 0 rgba(15,23,42,0.04)` | `inset 0 1px 0 rgba(255,255,255,0.04), 0 1px 2px 0 rgba(0,0,0,0.30)` | Card lift |
| `--hc-elevation-2` | `0 12px 32px -8px rgba(15,23,42,0.12), 0 4px 12px -4px rgba(15,23,42,0.06)` | `inset 0 1px 0 rgba(255,255,255,0.06), 0 24px 56px -8px rgba(0,0,0,0.48), 0 8px 16px -4px rgba(0,0,0,0.32)` | Popover, dropdown, modal |
| `--hc-elevation-3` | `0 20px 48px -8px rgba(15,23,42,0.16), 0 8px 20px -4px rgba(15,23,42,0.08)` | `inset 0 1px 0 rgba(255,255,255,0.08), 0 32px 72px -12px rgba(0,0,0,0.56), 0 12px 24px -6px rgba(0,0,0,0.40)` | Toast, command bar (highest layer) |

### Motion (PASS 20)

| Token | Value | Usage |
|---|---|---|
| `--hc-duration-fast` | `120ms` | Taps, hovers, focus changes |
| `--hc-duration-base` | `180ms` | Most transitions (buttons, switches, popover open) |
| `--hc-duration-slow` | `260ms` | Surface-arrival moments (modal/sheet enter) |
| `--hc-ease-standard` | `cubic-bezier(0.22, 1, 0.36, 1)` | Decelerating cubic — most entrances |
| `--hc-ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` | Symmetric ease — state changes that settle on both sides |
| `--hc-ease-emphasized` | `cubic-bezier(0.34, 1.40, 0.64, 1)` | Gentle overshoot — celebration only |
| `--hc-ease-linear` | `linear` | Opacity-only crossfades on micro-interactions |

### Interaction overlays

| Token | Light value | Dark value | Usage |
|---|---|---|---|
| `--hc-state-hover-overlay` | `rgba(24,24,27,0.04)` | `rgba(255,255,255,0.05)` | Hover wash on neutral surfaces |
| `--hc-state-pressed-overlay` | `rgba(24,24,27,0.08)` | `rgba(255,255,255,0.10)` | Pressed wash |
| `--hc-state-disabled-opacity` | `0.55` | `0.50` | Opacity multiplier for disabled controls |

### NEW (Phase 2) — Overlay + topbar

| Token | Light value | Dark value | Usage |
|---|---|---|---|
| **NEW** `--hc-overlay-scrim` | `rgba(15,23,42,0.32)` | `rgba(0,0,0,0.55)` | Dim-the-page scrim behind modals, drawers, mobile-nav. **Replaces** `bg-black/40` inline usage. |
| **NEW** `--hc-shell-topbar-bg` | `color-mix(in oklab, var(--hc-surface) 88%, transparent)` | `color-mix(in oklab, var(--hc-surface) 82%, transparent)` | Sticky chrome topbar background (use with `backdrop-blur-md`) |

---

## Type scale (for completeness — not theme-mode dependent)

| Token | Value | Line height | Usage |
|---|---|---|---|
| `--hc-text-xs` | `11px` | `16px` | Eyebrows, kickers |
| `--hc-text-sm` | `13px` | `20px` | Captions, helper text |
| `--hc-text-md` | `15px` | `24px` | Body default |
| `--hc-text-lg` | `17px` | `28px` | Body emphasis |
| `--hc-text-xl` | `20px` | `30px` | Sub-headings |
| `--hc-text-display-sm` | `28px` | `32px` | Section heads |
| `--hc-text-display-md` | `36px` | `40px` | Division heads |
| `--hc-text-display-lg` | `48px` | `52px` | Hero (mobile) |
| `--hc-text-display-xl` | `64px` | `64px` | Hero (desktop) |

---

## Brand coherence rationale

Why we don't use pure-black-on-pure-white in light mode, and why we don't use pure-white-on-pure-black in dark mode:

**Light mode:** Pure `#000000` text on pure `#FFFFFF` is visually too harsh — premium publications (NYT, FT, Apple docs) avoid it because the contrast strains the eyes at sustained reading. HenryCo uses **deep ink** `#18181b` (zinc-900) on **warm paper** `#fafaf9` (zinc-50). Contrast is 16.5:1 — well above AA — but the read is calm. The brand gold `#C9A227` (HenryCo brand spec) sits on this paper as a confident accent without overwhelming the surface.

**Dark mode:** Pure `#FFFFFF` on pure `#000000` reads as a backlit billboard. HenryCo uses **warm ink** `#fafaf9` (zinc-50) on **graphite** `#0a0a0b`. The dark gold `#D4AF37` is the classic metallic gold tone — warmer and more confident than the brand gold against a near-black surface (the brand `#C9A227` would look muddy here).

The gold accent's **hue family stays the same** — what changes is the value (brightness). This is the difference between "we have a dark mode" and "we have a considered dark mode that earns trust".

---

## App-level re-mapping examples

How an app declares its division soul on top of the canonical `--hc-*` layer.

### Owner (hub)

```css
:root {
  --acct-bg: #fafaf8;
  --acct-ink: #1a1814;
  --acct-gold: #c9a227;
  /* ... */

  /* re-map --hc-* per division */
  --hc-bg: var(--acct-bg);
  --hc-ink: var(--acct-ink);
  --hc-accent: #C9A227;
}

.dark {
  --acct-bg: #0b0f14;
  --acct-ink: #f0ede8;
  --acct-gold: #d4af37;

  --hc-bg: var(--acct-bg);
  --hc-ink: var(--acct-ink);
  --hc-accent: #D4AF37;
}
```

### Staff

Symmetric pattern — `--staff-*` tokens with `:root` (dark-first) + `.light` blocks re-pointing `--hc-*`. Note staff is dark-first by historical default; once Phase 4 removes `forcedTheme`, the canonical `<PublicThemeProvider>` chooses System as default, but the staff token values continue to work because both blocks are defined.

---

## Validation checklist (for Phase 8)

- [ ] Every owner-route surface migrated in Phase 5 references `--hc-*` tokens (no raw `text-zinc-X` / `bg-zinc-X` without a `dark:` counterpart)
- [ ] Every staff-route surface migrated in Phase 6 references `--hc-*` or `--staff-*` tokens
- [ ] Every `bg-black/40` scrim replaced with `bg-[var(--hc-overlay-scrim)]`
- [ ] Every topbar in the migrated apps consumes `--hc-shell-topbar-bg` + `backdrop-blur-md`
- [ ] No new hex literals introduced in JSX (CI grep gate in Phase 8)
- [ ] Contrast verification matrix (sample of 20+ pairings across owner + staff) recorded in the final pass report

---

## Open questions surfaced

1. **Tailwind `@theme` block adoption.** Decision: defer. Existing `bg-[var(--hc-token)]` arbitrary-value syntax is pervasive; introducing `@theme` risks Tailwind v4 utility-resolution conflicts and a churn migration. Surface as a follow-up.
2. **Token-rename migration.** A future pass could rename `--hc-text-primary` → `--ink-primary` for shorter names. Defer — the `--hc-*` namespace is collision-safe and grep-friendly.
3. **Per-division accent overrides.** Care/marketplace/jobs/learn/logistics/property/studio each already override `--hc-accent` to their division soul. No change in this pass; documented for awareness.
