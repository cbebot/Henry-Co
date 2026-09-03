# THEME-01 — Foundation polish: Owner Workspace + Staff HQ + Public Pages Theme Standardization

> **STATUS: SHIPPED — PR #137.** This prompt is the elevated canonical spec and historical record for the Light/Dark/System theme standardization across Owner Workspace, Staff HQ, and public pages. Staff HQ no longer pins `forcedTheme="dark"` (the layout comment in `apps/staff/app/layout.tsx` records the removal), the owner workspace is wrapped in `PublicThemeProvider` with a mounted toggle, the semantic-token foundation landed in `packages/ui/src/theme/tokens.css` with `:root` (light) + `[data-theme="dark"]` (dark) blocks, and the public surfaces were verified no-regression. Execute the **Residual / hardening follow-ups** section only; treat the eight phases below as DONE and verified, and use them as the migration record for any new app onboarding to the token system.

**Pass ID:** THEME-01 (off-cycle polish pass; not in the V3-NN register, per owner direction)  ·  **Phase:** B (Foundation Lock — polish)  ·  **Pillar:** P12 (Global UX) + brand
**Dependencies:** V3-03 (#131), V3-05 (#132), V3-07 (#134), V3-09 (#135), V3-10 (#133) on `main`  ·  **Effort:** L  ·  **Parallel-safe:** Y
**Owner gate:** visual sign-off before merge (no auto-merge)  ·  **Risk class:** — (no money/identity/compliance)

---

## Role
You are the V3 Polish engineer for Henry Onyx. You execute exactly this one pass, then stop and report. You standardize the theme system across Owner Workspace, Staff HQ, and public pages onto one Light/Dark/System model that is premium and equal-quality in both modes, defaulting to System, persisting the user's choice on-device, with zero first-paint flicker and WCAG-AA contrast throughout. The line you do not cross: you touch only style, tokens, provider-wiring, and CSS — never structure, never a second theme system, and never the explicitly-excluded zones (`apps/account/**`, `packages/search-ui/`, Expo apps).

The owner directive, verbatim, that motivated this pass:
> "I want you to use this opportunity to standardize the whole public pages and owner and staffs dashboards theme, it should be second to none. I think the best style is that it should have three themes, Light, Dark, and System. System first the users can switch, unless you know another best pattern that will earn a credit record to the company. … But the users dashboard theme is fine. Focus on the others I mentioned"

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/theme-01-owner-staff` (per pass) |
| Deploy | Vercel (10 web projects) |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary
The theme primitives already ship in `@henryco/ui/theme` and are production-grade — this pass wires and tokenizes them, it does NOT fork or replace them:
- `packages/ui/src/theme/ThemeProvider.tsx` — wraps `next-themes` with `attribute={["class","data-theme"]}`, `defaultTheme="system"`, `enableSystem`, `storageKey="henryco-public-theme"` (from `constants.ts`), `disableTransitionOnChange`, plus a `ColorSchemeSync` effect mirroring `resolvedTheme` to `<html>.style.colorScheme`.
- `packages/ui/src/theme/ThemeToggle.tsx` — 3-state cycle (Light → Dark → System) with `Sun`/`Moon`/`Laptop` icons, accessible `aria-label` announcing current mode + resolved value.
- `packages/ui/src/theme/HenryCoThemeBlocking.tsx` — pre-paint inline script (via `<PublicThemeGuard>` in `@henryco/ui/public-shell`) that sets `class="dark"` + `data-theme` + `style.colorScheme` before first paint to kill FOUC, reading the `henryco-public-theme` key.
- `packages/ui/src/public-shell/public-providers.tsx` exports `PublicThemeProvider` (the mount point for any app root) + `PublicLocaleProvider` + `PublicPreferencesProvider`.

The gaps this pass closed: the **Owner Workspace** (`apps/hub/app/owner/(command)/**`) inherited only `PublicThemeGuard` from the hub root with no `PublicThemeProvider` wrap (so `useTheme()` was unavailable to owner children and no toggle was mounted), and **Staff HQ** (`apps/staff/app/layout.tsx`) pinned `forcedTheme="dark"` — dark-only, no system, no user override, no toggle. Both were built dark-only during the V3 PASS 21 design rebuild, so both carried hardcoded hex / `text-white` / dark-only CSS variables needing migration to two-mode semantic tokens. The token foundation now lives in `packages/ui/src/theme/tokens.css` (`:root` light values + `[data-theme="dark"]` dark values).

## Mandatory scope (SHIPPED — 8 phases, recorded for the closure + onboarding record)
This pass shipped in eight ordered phases; earlier phases unblocked later ones. The record below is the canonical migration playbook for onboarding any new app to the token system.

### Phase 1 — CSS audit + token-gap analysis (S1)
Catalogued every hardcoded color (literal hex; Tailwind color strings without a `dark:` counterpart; literal `color:`/`background:` rules), every `--*` variable defined for these surfaces (flagging dark-only ones), every already-token-based value to keep, and every component-scoped utility color. Output: `docs/v3/theme-audit-owner-staff.md` (per-route tables for Owner + Staff with hardcoded/needs-token counts + severity; shared-dependency section; token-gap list; severity legend).

### Phase 2 — Semantic-token foundation (S2)
Defined the two-mode token system in `packages/ui/src/theme/tokens.css` (light via `:root`, dark via `:root[data-theme="dark"]`) + a Tailwind mapping (`theme.extend.colors`) consuming the CSS variables so `text-ink-primary` / `bg-surface-raised` work in JSX. Token families: surface elevations (`--surface-base/raised/overlay`), ink hierarchy (`--ink-primary/secondary/muted/disabled`), borders (`--border-subtle/strong/focus`), accent (`--accent-primary` + soft/on-light/on-dark), feedback (`--state-success/warning/danger/info`) — each contrast-checked in both modes. Registry documented in `docs/v3/theme-tokens.md`. Brand-coherence rule: the brand accent keeps the same hex in both modes; what changes is the surface under it (warm paper in light, graphite/midnight in dark). Body ink is deep ink-graphite on warm paper in light, warm ink on graphite in dark — never pure-black-on-white or pure-white-on-black.

### Phase 3 — Wire Owner Workspace provider + toggle (S3)
`apps/hub/app/owner/(command)/layout.tsx` wraps children in `<PublicThemeProvider>`; `<ThemeToggle />` mounts in the owner topbar near the avatar / notification-bell / search group; `PublicThemeGuard` confirmed at the hub root.

### Phase 4 — Wire Staff HQ provider + toggle (S4)
`apps/staff/app/layout.tsx` drops the `next-themes` `forcedTheme="dark"` pin and uses `PublicThemeGuard` + `PublicThemeProvider` from `@henryco/ui/public-shell`; `<ThemeToggle />` mounts in the staff topbar. Light-mode breakages exposed by removing the pin were catalogued in Phase 1 and fixed in Phases 5/6.

### Phase 5 — Color migration: Owner Workspace (S5)
Per-route replacement of hardcoded colors with Phase-2 tokens, shipped highest-traffic-first: dashboard overview → sidebar/mobile-nav/topbar → notification bell + toast viewport → search palette → dashboard tiles (V3-01 session-health, V3-03 notification-health, V3-10 observability, V3-05 slow-surface) → brand pages → AI surfaces → staff routes. Semantic tokens for reused values; Tailwind `dark:` only for one-off accents; component-scoped CSS variables for structural elevation. Self-verified in both modes per route.

### Phase 6 — Color migration: Staff HQ (S6)
Same approach for `apps/staff/**`: staff home → topbar/sidebar → operations → support → newsletter → per-division workspaces.

### Phase 7 — Public-pages no-regression verification (S7)
Opened every public surface in Light + Dark + System and confirmed the Phase-2 token additions introduced no regression: hub apex, care, marketplace, jobs, learn, logistics, property, studio public homes, and the account sign-in/signup landing (public-shell). Where a token change risked a public regression it was reverted or scoped behind a public-shell override.

### Phase 8 — A11y + motion + contrast + telemetry + docs (S8 + S9)
WCAG-AA verified (4.5:1 body, 3:1 large) across migrated surfaces; focus rings visible in both modes; `prefers-reduced-motion` and `prefers-contrast: more` honored. Theme-switch telemetry registered + emitted only on an active user switch (not on initial system-resolution): `henry.ui.theme.switched_to_light`, `…switched_to_dark`, `…switched_to_system`. Docs: `docs/v3/theme-tokens.md` (final registry), `docs/v3/theme-migration.md` (what moved, how to add a token, how to onboard a new app), `packages/ui/src/theme/README.md`.

## Out of scope
- **Customer / account dashboard** (`apps/account/**`) — owner-excluded ("the users dashboard theme is fine").
- **Mobile apps** (`apps/super-app`, `apps/company-hub`) — Expo, separate theme stack; deferred to V3-87.
- **`packages/search-ui/`** — owner-reserved (`feedback_dashboard_search_engine_no_touch.md`).
- **Brand identity changes** — the accent, serif display (Fraunces), monogram, and palette are preserved in both modes; no rebrand here. The platform brand-string sweep (Henry Onyx) is its own pass.
- **New theme primitives** — no color-theme picker, no time-of-day auto-dim, no per-tab themes; the 3-state Light/Dark/System pattern is the approved best-in-class model. Cross-device persistence is a future cloud-pref pass.

## Dependencies
Depends on the dashboard surfaces shipped by V3-01/03/05/10 (the tiles being themed) and the V3-09 mobile-consistency work in `dashboard-shell`. Blocks nothing structurally; it raises the polish floor every later owner/staff surface inherits, and the token foundation is reused by every subsequent UI pass.

## Inheritance
Builds entirely on `@henryco/ui/theme` (`ThemeProvider`, `ThemeToggle`, `HenryCoThemeBlocking`, `tokens.css`, `constants.ts`) and `@henryco/ui/public-shell` (`PublicThemeProvider`, `PublicThemeGuard`, `PublicSiteShell`/`PublicSiteFooter`), with `@henryco/observability` for the switch telemetry and `@henryco/i18n` for toggle aria-labels. No new theme infrastructure is introduced — apps import `PublicThemeProvider`, never `next-themes` directly.

## Implementation requirements
### Files
`packages/ui/src/theme/tokens.css` (two-mode token source); the Tailwind token mapping; `apps/hub/app/owner/(command)/layout.tsx` (+ owner topbar host); `apps/staff/app/layout.tsx` (+ staff topbar host); per-route Owner + Staff JSX/CSS migrated off hardcoded colors; `packages/observability/src/events.ts` (3 theme-switch events); `docs/v3/theme-audit-owner-staff.md`, `docs/v3/theme-tokens.md`, `docs/v3/theme-migration.md`, `packages/ui/src/theme/README.md`.
### Trust / safety / compliance
No auth/RLS/money/identity surface touched — this is presentation only. Pre-paint blocking script reads only the local `henryco-public-theme` key (no secrets). No `forcedTheme`. Any hex that must remain (vendor logo, brand artwork) is exempted with an explaining code comment.
### Mobile + desktop parity
Owner + Staff chrome (sidebar, mobile-nav, topbar, toggle) is verified in both modes on mobile + desktop viewports; the toggle is reachable in the mobile nav. Expo theming is out of scope (V3-87).
### i18n
Theme-toggle copy and `aria-label`s route through `@henryco/i18n` under the existing `surface:` namespace (one or two new keys for the toggle states, e.g. `surface:chrome` → `theme.toggle.light/dark/system`). No new locales; no hardcoded toggle strings.
### Brand & design system
Brand accent, Fraunces display, monogram, and palette preserved in both modes — no naive color-flips; tokens carry brand-coherent values per surface (accent on warm paper in light, accent on graphite in dark). Any rendered brand string reads from `@henryco/config` (`COMPANY.group.name` = "Henry Onyx"; divisions = "Henry Onyx <Division>") — never hardcoded, and never the retired "Henry & Co.". Zero hardcoded domains (`henryDomain()` / `getHubUrl()` / `getStaffHqUrl()`); CLS ≈ 0; contrast not regressed.

## Validation gates
1. CI green: Lint, typecheck, test, build.
2. Static evidence: a grep for `text-white` / `bg-black` / dark-only hex across `apps/hub/app/owner` + `apps/staff` returns a short list (target < 5% of pre-migration count), with each remainder explained.
3. Visual self-check in both modes on every priority Owner + Staff surface.
4. A11y contrast: automated scan on 3 owner + 3 staff routes returns zero WCAG-AA fails (`pnpm a11y:contrast`).
5. Public no-regression: 9 public surfaces confirmed unchanged in Light + Dark + System.
6. Toggle UX: keyboard-only test (Tab focus, Enter/Space, aria-label announces mode + resolved state) in owner + staff shells.
7. Telemetry: 3 theme-switch events registered + emit verified on click (not on mount).

## Deployment gate
All gates green; DRAFT PR opened (no auto-merge); PR body lists per-file migration counts, the token registry summary, and Light/Dark screenshots for 3 owner + 3 staff routes; **owner visual sign-off required** before merge. No force-push (`--force-with-lease` only on rebase).

## Final report contract
`.codex-temp/v3-theme-01-owner-staff/report.md` (delivered as `.codex-temp/theme-owner-staff-standardize/` for the original pass) with the standard 9 sections — exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification · telemetry baseline · deferred items · pass-closure assertion — plus the final token registry, per-file before/after migration counts, a 20+-pairing contrast matrix, and phase-by-phase progress.

## Residual / hardening follow-ups (the only OPEN work)
1. **Hardcoded-color zero-out to closure.** Drive the Phase-2 static-evidence remainder toward zero — every surviving `text-white`/dark-only hex outside the documented exemptions is migrated to a token or `dark:` variant, so the migration is provably complete, not merely dominant.
2. **Token-onboarding lint guard.** Add a CI rule (or lint plugin config) that flags new literal-hex / `text-white`-style usage in `apps/hub/app/owner` + `apps/staff`, pointing the author to `docs/v3/theme-migration.md` — so the standardization does not erode as new surfaces ship.
3. **Theme-switch telemetry verification + brand-string sweep confirm.** Confirm the 3 `henry.ui.theme.switched_*` events are present in `packages/observability/src/events.ts` and emitting on production click-throughs; in the same pass, re-confirm every brand string rendered in the migrated Owner/Staff chrome resolves to "Henry Onyx" via `@henryco/config` (no residual "Henry & Co." after the identity merge).

## Self-verification
- [ ] Phase 1: `docs/v3/theme-audit-owner-staff.md` written; per-route Owner + Staff tables + token-gap list complete.
- [ ] Phase 2: `packages/ui/src/theme/tokens.css` defines light (`:root`) + dark (`[data-theme="dark"]`) per token; Tailwind mapping consumes them; `docs/v3/theme-tokens.md` documents the registry.
- [ ] Phase 3: owner layout wraps `PublicThemeProvider`; ThemeToggle in the owner topbar.
- [ ] Phase 4: staff layout drops `forcedTheme` and uses `PublicThemeGuard` + `PublicThemeProvider`; ThemeToggle in the staff topbar.
- [ ] Phase 5/6: Owner (8) + Staff (6) priority surfaces migrated; self-verified in both modes.
- [ ] Phase 7: 9 public surfaces verified no-regression in Light + Dark + System.
- [ ] Phase 8: WCAG-AA on 3+3 routes (zero fails); reduced-motion + contrast honored; 3 theme-switch events registered + emit on click only; tokens/migration/README docs landed.
- [ ] Brand: rendered brand strings read from `@henryco/config` (Henry Onyx); no "Henry & Co."; zero hardcoded domains; accent/Fraunces/monogram preserved both modes.
- [ ] No second theme system, no `forcedTheme`, no touching `apps/account/**` / `packages/search-ui/` / Expo apps.
- [ ] Residual follow-ups 1–3 executed and recorded in the closure report.
- [ ] DRAFT PR with migration counts + screenshots; owner visual sign-off obtained.
