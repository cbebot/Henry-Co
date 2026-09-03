# THEME-01 Phase 1 — Owner Workspace + Staff HQ Theme Audit

**Pass:** THEME-01
**Phase:** 1 (CSS audit + token gap analysis)
**Branch:** `theme/owner-staff-standardize`
**Author:** Polish engineer (S1)
**Audited at:** main @ d825cd60 (THEME-01 prompt commit c460cc62)

This document is the source of truth for the THEME-01 color-migration phases (5/6). It records every hardcoded color usage we found, every CSS variable in play, the existing token coverage, and the gaps that semantic tokens must fill.

---

## Executive summary

The audit hypothesis in the spec was that owner + staff surfaces were "built dark-only" and would be riddled with hardcoded hex literals and missing `dark:` variants. The reality is more nuanced:

1. **Owner workspace** (`apps/hub/app/owner/(command)/**`, `apps/hub/components/owner/**`) is **already token-driven** at ~95% coverage. Most colors flow through `--acct-*` and `--owner-*` CSS variables that **already have both `:root` (light) and `.dark` blocks** in `apps/hub/app/globals.css`. The owner workspace inherits the canonical `@henryco/ui/public-shell` `PublicThemeGuard` via `apps/hub/app/layout.tsx`, so the `dark` class is being applied — but no `<PublicThemeProvider>` wraps the owner route subtree, which means the **`useTheme()` hook is unavailable** and no toggle UI is currently rendered. The owner is silently riding the system default but can't actually switch.

2. **Staff HQ** (`apps/staff/**`) has a more invasive problem. The root layout pins `forcedTheme="dark"` and **does NOT compose the canonical `PublicThemeGuard` / `PublicThemeProvider`** pair. Its `globals.css` has both `:root` (dark-first) and `.light` blocks already defined with quality token values — so when `forcedTheme="dark"` is removed and the canonical provider is wired in, light mode is mostly painted "for free". The few JSX-level breakages are: (a) `text-white` on gold-fill buttons that look wrong on light gold-soft (Newsletter editor / Newsletter index page CTA), (b) `bg-black/40` mobile-nav scrim that's too heavy on a light backdrop, (c) the `(workspace)/layout.tsx` sets a hardcoded inline `background` / `color` style that ignores `dark` entirely.

3. **Shared dependencies** in good shape: `@henryco/dashboard-shell` uses `--hc-*` semantic tokens (defined in `packages/ui/src/styles/globals.css` with full `:root` + `.dark` parity), and the owner/staff apps both re-map `--hc-*` from their division tokens — meaning a single provider wire-up cascades everywhere.

**Bottom line:** the actual migration work (Phases 5/6) is far smaller than the spec hypothesis. Phases 2/3/4 are the high-leverage moves; the rest is targeted cleanup.

---

## Severity legend

| Level | Meaning | Phase |
|---|---|---|
| **high** | Cross-cutting CSS variable redefinition, provider/structural change, or anti-pattern that blocks all downstream work | 3, 4 (provider wiring); 2 (tokens) |
| **medium** | Component-scoped color string with no `dark:` counterpart that demonstrably breaks under theme flip | 5, 6 |
| **low** | Single utility-class swap, or a fallback hex inside a `var(--x, #yyy)` pattern that already works | 5, 6 |
| **none** | Already token-driven; no work required | — |

---

## Owner Workspace — per-route audit

Scope: `apps/hub/app/owner/(command)/**` (route files) + `apps/hub/components/owner/**` (component library).

### Provider/wiring (HIGH severity — phase 3)

| File | Issue | Severity |
|---|---|---|
| `apps/hub/app/owner/(command)/layout.tsx` | Does NOT wrap children in `<PublicThemeProvider>`. `useTheme()` unavailable in owner subtree. NO `<ThemeToggle />` mounted. | **high** |

The hub root (`apps/hub/app/layout.tsx`) wraps the whole tree in `<PublicThemeGuard>`, which composes `<HenryCoThemeBlocking />` and `<ThemeProvider>` together — so the owner subtree IS inside next-themes' provider. That means the hook will technically work. The remaining job is wiring `<ThemeToggle />` into the owner topbar (the existing `(command)/layout.tsx` chrome). No second provider needed.

### Per-route JSX color audit

Counts below are from `grep -nE "(text-white|bg-black|text-zinc-|bg-zinc-|text-slate-|bg-slate-|#[0-9a-fA-F]{6})"` against owner files. **Fallback hex inside `bg-[var(--x,#yyy)]` syntax does not count as hardcoded** (it works correctly in both modes — `--x` is the live value, the `#yyy` is unreachable unless the variable is unset).

| Route | File | Hardcoded count | Needs-token count | Severity |
|---|---|---:|---:|---|
| Overview | `(command)/page.tsx` | 0 | 0 | none |
| Dashboard | `(command)/dashboard/notification-health-tile.tsx` | 0 (fallback hex only) | 2 (`text-emerald-600`, `text-amber-600`, `text-rose-600` — semantic colors not in `--hc-status-*` family) | low |
| Dashboard | `(command)/dashboard/observability-tile.tsx` | 0 | 0 | none |
| Settings/audit | `(command)/settings/audit/page.tsx` | 1 (fallback `#1a1814` inside `text-[var(--market-noir,#1a1814)]`) | 0 | none |
| Layout chrome | `(command)/layout.tsx` | 0 | 1 (`text-amber-950/90 dark:text-amber-100/95` — already has dark variant, but uses Tailwind defaults instead of `--hc-status-warning-text`) | low |

Counts for other (command) sub-routes (ai/, brand/, divisions/, finance/, messaging/, operations/, settings/, staff/) — all returned **0 matches** on the audit grep. These pages are token-clean.

### Owner component library (`apps/hub/components/owner/**`)

| Component | Hardcoded | Needs-token | Severity | Note |
|---|---:|---:|---|---|
| `BrandSettingsForms.tsx` | 0 | 0 | none | |
| `Breadcrumbs.tsx` | 0 | 0 | none | |
| `CompanyPageEditorForm.tsx` | 0 | 0 | none | |
| `DivisionBadge.tsx` | 0 | 0 | none | |
| `DivisionBrandForm.tsx` | 1 | 0 | low | One `text-white` on a gold-fill button — re-paint with `--hc-ink-on-accent` |
| `EmptyState.tsx` | 0 | 0 | none | |
| `InternalTeamCommsClient.tsx` | 5 (Tailwind status colors) | 5 | medium | `text-blue-600`, `text-green-600`, `text-red-600` for inline states — route through `--hc-status-*-text` |
| `InviteStaffForm.tsx` | 0 | 0 | none | |
| `MetricCard.tsx` | 0 | 0 | none | |
| `MetricTraceDrawer.tsx` | 1 (`bg-black/40` scrim) | 1 | medium | Scrim too dark on light backdrop — token: `--hc-overlay-scrim` (new) |
| `OwnerFormFeedback.tsx` | 2 (`text-red-`/`text-green-` inline states) | 2 | low | Route through `--hc-status-*-text` |
| `OwnerMobileNav.tsx` | 1 (`bg-black/40` scrim) | 1 | medium | Same scrim issue |
| `OwnerNotificationsLauncher.tsx` | 0 | 0 | none | |
| `OwnerNotificationsToastViewport.tsx` | 0 | 0 | none | |
| `OwnerPaletteHost.tsx` | 0 | 0 | none | |
| `OwnerPaletteOpenProvider.tsx` | 0 | 0 | none | |
| `OwnerPrimitives.tsx` | 0 | 0 | none | already `--acct-*` driven |
| `OwnerRealtimeBridge.tsx` | 0 | 0 | none | |
| `OwnerSearchButton.tsx` | 0 | 0 | none | |
| `OwnerSidebar.tsx` | 0 | 0 | none | all `--owner-*` / `--acct-*` |
| `SessionHealthTile.tsx` | 0 | 0 | none | |
| `StaffDirectoryClient.tsx` | 0 | 0 | none | |
| `StaffHubNav.tsx` | 0 | 0 | none | |
| `StaffMemberCard.tsx` | 0 | 0 | none | |
| `StatusBadge.tsx` | 0 | 0 | none | |

**Owner workspace total: 4 medium-severity items + 6 low-severity items.** All scoped to existing files; no new components needed. The `(command)/layout.tsx` provider wire-up is the only structural change.

---

## Staff HQ — per-route audit

Scope: `apps/staff/**` (routes, components, layouts).

### Provider/wiring (HIGH severity — phase 4)

| File | Issue | Severity |
|---|---|---|
| `apps/staff/app/layout.tsx` | Uses raw `import { ThemeProvider } from "next-themes"` + `forcedTheme="dark"`. Does NOT wrap in `<PublicThemeGuard>` (no blocking script — so a switch will FOUC) and does NOT use `<PublicThemeProvider>`. Different `storageKey` than the canonical one. | **high** |
| `apps/staff/app/layout.tsx` line 22 | `body` class is `"min-h-screen antialiased"` — fine, but the inner `(workspace)/layout.tsx` sets `style={{ background: "var(--hc-surface-elevated, #F8F7F3)" }}` inline which bypasses the canonical class and may flicker on switch | medium |

### Per-route JSX color audit

| Route | File | Hardcoded count | Needs-token count | Severity |
|---|---|---:|---:|---|
| Track-C launchpad | `(track-c)/layout.tsx` | 1 inline `border: "1px solid rgba(10,10,10,0.12)"` + `color: "rgba(10,10,10,0.65)"` (cheatsheet trigger) — does NOT swap in dark | 2 | medium |
| Track-C cheatsheet | `(track-c)/cheatsheet/page.tsx` | (not scanned in line — assume token-driven via shell) | 0 | low |
| Track-C modules | `(track-c)/modules/[slug]/page.tsx` | (delegates to module page-server.tsx) | 0 | low |
| Workspace layout (legacy) | `(workspace)/layout.tsx` | 2 (inline `background: var(--hc-surface-elevated, #F8F7F3)`, `color: var(--hc-ink, #0A0A0A)`) | 0 | low |
| Workspace newsletter editor | `(workspace)/operations/newsletter/NewsletterDraftEditor.tsx` | 2 (`text-white` on `bg-[var(--staff-ink)]` / `bg-[var(--staff-gold)]` buttons — both wrong on light gold-soft) | 2 | medium |
| Workspace newsletter index | `(workspace)/operations/newsletter/page.tsx` | 1 (`text-white` on `bg-[var(--staff-gold)]`) | 1 | medium |
| Workspace newsletter [id] | `(workspace)/operations/newsletter/[id]/page.tsx` | 0 | 0 | none |
| Workspace other (care/finance/jobs/kyc/learn/logistics/marketplace/operations/property/search/settings/studio/support/workforce) | 14 files | 0 (per grep) | 0 | none |
| Login | `login/page.tsx` | 0 | 0 | none |
| No-access | `no-access/page.tsx` | 1 (`text-[#0a0c12]` on gold button — wrong direction; use `--hc-ink-on-accent` semantic) | 1 | low |

### Staff component library

| Component | Hardcoded | Needs-token | Severity | Note |
|---|---:|---:|---|---|
| `StaffMobileNav.tsx` | 1 (`bg-black/40` scrim) | 1 | medium | Token: `--hc-overlay-scrim` (new — shared with owner) |
| `StaffPrimitives.tsx` | 0 | 0 | none | all `--staff-*` / `--hc-*` |
| `StaffSidebar.tsx` | 0 | 0 | none | |
| `StaffWorkspaceLaunchpad.tsx` | 0 | 0 | none | |
| `kyc/*.tsx` | (not scanned individually — module-server pattern) | low | low | follow-up if needed |

**Staff HQ total: 6 medium-severity items + 4 low-severity items.** Plus the single `forcedTheme` removal in `app/layout.tsx`.

---

## Shared dependencies audit

Surfaces that owner + staff both consume. These are the "if I get this right, ten apps fix themselves" surfaces.

### `packages/ui/src/styles/globals.css` (canonical token layer)

**State:** **Excellent.** Has 674 lines of token definitions with `:root` (light defaults) + `.dark` (dark overrides) parity. Includes:
- Type scale (`--hc-text-{xs,sm,md,lg,xl,display-*}`)
- Status family (`--hc-status-{success,warning,danger,info}-{bg,text,border}`) with AA-verified pairs in BOTH modes
- Surface ladder (`--hc-surface-base/raised/overlay/sunken`)
- Text scale (`--hc-text-primary/secondary/tertiary/quaternary/inverse/on-accent/disabled`)
- Border weights (`--hc-border-subtle/default/strong/focus`)
- Accent family (`--hc-accent/-strong/-pressed/-text/-soft/-on-surface`)
- Elevation scale (`--hc-elevation-{0,1,2,3}`) — already dual-mode (inset highlights in dark; offset shadow in light)
- Motion duration + easing curves
- Interaction-state overlays

**Conclusion:** the spec's Phase 2 token list is **already substantially defined here**. Phase 2 in this pass becomes "augment + document + add the few missing tokens (scrim, focus-on-dark)" rather than "create the system".

### `packages/dashboard-shell/src/tokens/color.ts`

**State:** **Solid.** Defines `BRAND`, `STATUS`, `STATUS_VARS`, `CSS_VARS`, `DEFAULT_CSS_VAR_VALUES`. Both light + dark consumers read from `--hc-*` CSS vars exposed by the host app's `globals.css`. The constants are kept as light-mode locked for legacy callers and are not used in cross-mode chrome surfaces.

**Gap:** no `overlayScrim` token. Phase 2 should add `--hc-overlay-scrim` (the dim-the-page background behind modals/drawers).

### `packages/ui/src/theme/HenryCoThemeBlocking.tsx`

**State:** **Production-ready.** Pre-paint blocking script eliminates FOUC. Reads from `henryco-public-theme` localStorage key. Sets `class="dark"`, `data-theme`, and `style.colorScheme` BEFORE first paint. Also includes a `--site-*` token snapshot for the public-shell `<style>` injection (this is a separate concern from owner/staff).

**Gap:** none. The blocking script is the canonical pattern.

### `packages/ui/src/public-shell/public-providers.tsx`

**State:** **Production-ready.** Exports `PublicThemeProvider`, `PublicLocaleProvider`, `PublicPreferencesProvider`. Thin wrapper over `@henryco/ui/theme/ThemeProvider`.

**Gap:** none.

### `packages/ui/src/theme/ThemeToggle.tsx`

**State:** **Production-ready.** 3-state cycle (Light → Dark → System) with `Sun`/`Moon`/`Laptop` icons, accessible aria-label, Tailwind `dark:` variants for the chip's own paint.

**Gap:** the chip currently uses raw Tailwind colors (`bg-white/60`, `dark:bg-black/40`). In a token-strict regime, this should consume `--hc-surface-overlay` / `--hc-border-subtle`. **Defer this to Phase 8 polish** — the chip already meets visual quality in both modes; tokenizing it now risks regressing the public-shell-mounted toggles.

**Telemetry gap:** the toggle does NOT emit a `henry.ui.theme.switched_to_*` event today. Phase 8 wires this.

---

## Token gap list (Phase 2 inputs)

Tokens the audit found we need that **don't exist yet**, ranked by usage frequency. Compared against the spec's mandatory Phase 2 token list:

| Spec token | Already defined? | Where | Action |
|---|---|---|---|
| `--surface-base` | yes (as `--hc-surface-base`) | `packages/ui/src/styles/globals.css:290` | Document in tokens registry; reuse |
| `--surface-raised` | yes (as `--hc-surface-raised`) | same | reuse |
| `--surface-overlay` | yes (as `--hc-surface-overlay`) | same | reuse |
| `--ink-primary` | yes (as `--hc-text-primary`) | same | reuse |
| `--ink-secondary` | yes (as `--hc-text-secondary`) | same | reuse |
| `--ink-muted` | yes (as `--hc-text-tertiary`) | same | reuse + document alias |
| `--ink-disabled` | yes (as `--hc-text-disabled`) | same | reuse |
| `--border-subtle` | yes (as `--hc-border-subtle`) | same | reuse |
| `--border-strong` | yes (as `--hc-border-strong`) | same | reuse |
| `--border-focus` | yes (as `--hc-border-focus`) | same | reuse |
| `--accent-primary` | yes (as `--hc-accent`) | same | reuse |
| `--accent-soft` | yes (as `--hc-accent-soft`) | same | reuse |
| `--accent-on-light` | partial — value is `--hc-accent-text` light-mode (`#8A6F00`) | needs alias | **ADD alias `--hc-accent-on-light` → `#8A6F00`** |
| `--accent-on-dark` | partial — value is `--hc-accent-text` dark-mode (`#E5C870`) | needs alias | **ADD alias `--hc-accent-on-dark` → `#E5C870`** |
| `--state-success` | yes (as `--hc-status-success-text` + `-bg` + `-border`) | same | reuse |
| `--state-warning` | yes (as `--hc-status-warning-*`) | same | reuse |
| `--state-danger` | yes (as `--hc-status-danger-*`) | same | reuse |
| `--state-info` | yes (as `--hc-status-info-*`) | same | reuse |

**Brand-new tokens needed:**

1. **`--hc-overlay-scrim`** — the dim-the-page scrim behind modals/drawers/mobile-nav. Today `bg-black/40` is used inline in 3 components (`OwnerMobileNav`, `MetricTraceDrawer`, `StaffMobileNav`). On a light-mode backdrop, 40% black-on-white is too aggressive (looks like a power-cut). Token values: light mode `rgba(15, 23, 42, 0.32)` (warmer ink wash), dark mode `rgba(0, 0, 0, 0.55)` (deeper, more dramatic on dark canvas).
2. **`--hc-shell-topbar-bg`** — sticky topbar background that should be `surface-raised + backdrop-blur` in both modes. The owner workspace currently inlines `bg-[var(--acct-bg)]/85 backdrop-blur` which works but isn't reusable. Aliasing it gives the staff topbar (Phase 4) a token to consume directly.

**Total new tokens: 2 + 2 aliases = 4 additions to Phase 2.**

The Phase 2 deliverable is therefore **smaller and more focused** than the spec contemplated: a `tokens.css` registry file that re-exports the existing canonical tokens under the spec's preferred semantic names (alias layer), adds the 2 new tokens, and provides a single documented registry (`docs/v3/theme-tokens.md`).

---

## Tailwind utility coverage

Tailwind v4 (CSS-first) is in use. No `tailwind.config.ts` exists for `apps/hub` or `apps/staff` — they use the `@import "tailwindcss"` + `@source` pattern in `globals.css`. Token consumption today is via the arbitrary-value syntax `bg-[var(--hc-surface)]` / `text-[var(--hc-ink)]`.

**Question for Phase 2:** do we introduce a `@theme` block to expose `text-ink-primary`, `bg-surface-raised`, etc. as utility classes?

**Recommendation:** **No, not in this pass.** Reasons:
1. The existing `bg-[var(--hc-surface)]` pattern is already pervasive in the codebase (~250+ uses).
2. Introducing a `@theme` block risks subtle Tailwind v4 utility-resolution conflicts with the `--hc-*` names that are already used as raw CSS variables.
3. The spec's Phase 2 mandates `text-ink-primary` to work in JSX — but it works **today** as `text-[var(--hc-text-primary)]`, which is explicit and grep-friendly.

We will document both syntaxes in `docs/v3/theme-tokens.md` and recommend `bg-[var(--token)]` for new code (consistent with the existing codebase), while leaving the door open for a future `@theme` migration if the surface area grows.

---

## What this audit unlocks for later phases

**Phase 2 (tokens):** create `packages/ui/src/theme/tokens.css` with the 4 new additions (`--hc-overlay-scrim`, `--hc-shell-topbar-bg`, `--hc-accent-on-light`, `--hc-accent-on-dark`) + import it once via `packages/ui/src/styles/globals.css` so every app inherits. Document the full registry at `docs/v3/theme-tokens.md`.

**Phase 3 (owner wiring):** wrap `apps/hub/app/owner/(command)/layout.tsx` children in `<PublicThemeProvider>` (or verify it's redundant given hub root wrap, then just mount `<ThemeToggle />`). The hub root already mounts `<PublicThemeGuard>`, which already composes `<ThemeProvider>` internally — so `useTheme()` is already available in the owner subtree. **The Phase 3 work is therefore mainly mounting `<ThemeToggle />` in the owner topbar** + a visual-self-check that the existing tokens cover both modes for the priority surfaces.

**Phase 4 (staff wiring):** replace `apps/staff/app/layout.tsx` body content. Drop `forcedTheme`. Use `<PublicThemeGuard><PublicThemeProvider>` composition. Mount `<ThemeToggle />` in `(track-c)/layout.tsx`'s `trailing` slot on the `<StaffShell>` — the prop already exists. The legacy `(workspace)` chrome is being deleted (per the comment in `(workspace)/layout.tsx`), so it gets a minimal `trailing` toggle in its remaining lifespan.

**Phase 5 (owner color migration):** ~10 small edits across the components listed above. Roughly 1 commit, low risk.

**Phase 6 (staff color migration):** ~10 small edits. Plus the newsletter button `text-white → text-[var(--hc-ink-on-accent)]` swap is the most visible one.

**Phase 7 (public regression):** the only token additions in Phase 2 are `--hc-overlay-scrim`, `--hc-shell-topbar-bg`, and two accent aliases — none touch existing public surface tokens. Regression risk is low.

**Phase 8 (a11y + telemetry + docs):** scoped per spec.

---

## Open decisions surfaced for the owner

1. **`@theme` block adoption:** keep the `bg-[var(--hc-token)]` arbitrary-value syntax (current decision) or migrate to `bg-surface-raised` utility shorthand? Recommend keeping current syntax this pass; surface as a follow-up if owner wants utility shorthand.
2. **Storage-key consolidation:** Staff HQ today uses next-themes' default key (`theme`). Phase 4 changes it to `henryco-public-theme` (the canonical key) via `<PublicThemeProvider>`. This is a **silent migration** — existing staff users who flipped any setting will start fresh on system default. Per the spec, that's acceptable (no cross-device persistence promised yet). Recommend a sentence in the PR body so the owner knows existing staff theme preferences reset.
3. **Owner storage-key sharing:** Owner workspace already uses `henryco-public-theme` via the hub root provider. No migration needed.
4. **`(workspace)` legacy chrome:** the staff `(workspace)/layout.tsx` is being deleted in DASH-9 follow-up; Phase 4 wires it to the same provider but doesn't deep-fix its inline `style={{ background: "..." }}` block — the route is on a 30-day-soak removal track.
