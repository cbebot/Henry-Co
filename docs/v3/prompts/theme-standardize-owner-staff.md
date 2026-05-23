# THEME-01 — Owner Workspace + Staff HQ + Public Pages Theme Standardization

**Pass ID:** THEME-01 (off-cycle polish pass; not in V3-NN sequence per owner direction)
**Phase:** Polish / Standardization
**Pillar:** P12 (Global UX) + brand
**Dependencies:** Wave B.1 closed (V3-10, V3-07, V3-09, V3-03 on main as of 2026-05-23; V3-05 likely lands during this session — rebase if so)
**Effort:** L (3–5 agent sessions)
**Parallel-safe:** YES (no overlap with active V3 passes)
**Owner gate:** Visual sign-off before merge (do NOT auto-merge)
**Risk class:** None (no money/identity/compliance touched)

---

## Role

You are the V3 Polish engineer for HenryCo's **Owner Workspace + Staff HQ + Public Pages** theme system. The owner directive, verbatim:

> "I want you to use this opportunity to standardize the whole public pages and owner and staffs dashboards theme, it should be second to none. I think the best style is that it should have three themes, Light, Dark, and System. System first the users can switch, unless you know another best pattern that will earn a credit record to the company. … But the users dashboard theme is fine. Focus on the others I mentioned"

The **owner's bar**:

- **Premium ecosystem, second-to-none.** Not "passable in light mode" — equal-quality polish in BOTH modes. Premium feel preserved across the switch.
- **Three themes: Light / Dark / System.** System is the default for new users.
- **User can switch and the choice persists.** Across reloads, across sessions, across devices? localStorage-persistent on this device — cross-device persistence is V3-cloud-pref (out of scope here).
- **Zero flicker on first paint.** Pre-paint blocking script writes the mode before React hydrates.
- **WCAG AA contrast minimum.** AAA where feasible. Both modes pass automated a11y scans.
- **Smooth switching.** Theme transitions are instant (no thrash). The toggle UI is discoverable but not garish.
- **Brand-coherent.** HenryCo's gold accent + serif headline aesthetic preserved in BOTH modes — neither mode looks like "a corporate template with the colors flipped".
- **Owner-reserved zones untouched.** No `packages/search-ui/`. No `apps/account/**` (customer dashboard explicitly excluded). No mobile (Expo) apps.

---

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `theme/owner-staff-standardize` |
| Worktree (absolute) | `C:/Users/HP VICTUS/HenryCo/.worktree/theme-owner-staff-standardize` |
| Branch base | `main @ d825cd60` (V3-03 merged; V3-05 may merge into main during this session — rebase if so via `git fetch origin main && git rebase origin/main`) |
| Deploy | Vercel previews (10 web projects) |
| OS context | Windows + bash; pnpm 9.15.5; Node 24.x |

Use ABSOLUTE PATHS for every Read/Edit/Write/Grep/Glob call. For Bash, first call `cd "C:/Users/HP VICTUS/HenryCo/.worktree/theme-owner-staff-standardize"`. For git, prefer `git -C "C:/Users/HP VICTUS/HenryCo/.worktree/theme-owner-staff-standardize" <cmd>`.

DO NOT touch the parent repo or any sibling worktree.

---

## Audit summary (verified by the conductor before this pass was written)

### Existing theme infrastructure — production-grade, KEEP and extend

`@henryco/ui/theme` already ships these primitives. Do NOT introduce a second theme system or fork these — every change in this pass is wiring + tokens + CSS, NOT new primitives.

**`packages/ui/src/theme/ThemeProvider.tsx`** — wraps `next-themes` with:
- `attribute={["class","data-theme"]}` (so CSS can target both `.dark` and `[data-theme="dark"]`)
- `defaultTheme="system"`
- `enableSystem` (respects OS preference)
- `storageKey="henryco-public-theme"` (from `constants.ts`)
- `disableTransitionOnChange` (no flicker)
- Plus a `ColorSchemeSync` effect mirroring `resolvedTheme` to `<html>.style.colorScheme` for native form-control rendering on switch.

**`packages/ui/src/theme/ThemeToggle.tsx`** — 3-state cycle button (Light → Dark → System) with `Sun` / `Moon` / `Laptop` icons from lucide-react, accessible `aria-label` showing the current mode + the resolved value (e.g., "Theme: System (dark now)"). Uses Tailwind `dark:` variants for the chip's own background.

**`packages/ui/src/theme/HenryCoThemeBlocking.tsx`** — pre-paint inline script applied via `<PublicThemeGuard>` from `@henryco/ui/public-shell`. Sets `class="dark"`, `data-theme`, and `style.colorScheme` BEFORE first paint to eliminate FOUC. Reads from the `henryco-public-theme` localStorage key.

**`packages/ui/src/public-shell/public-providers.tsx`** exports:
- `PublicThemeProvider` — thin wrapper over the above `ThemeProvider`. Mount this at any app's root.
- `PublicLocaleProvider`, `PublicPreferencesProvider` (orthogonal — don't touch unless needed).

**`packages/ui/src/public-shell/public-theme-guard.tsx`** — composes the blocking script. Already mounted in some apps' root layouts.

### Surface coverage today

| Surface | Wrapper | Theme behavior | Toggle UI? |
|---|---|---|---|
| Public hub (`apps/hub/app/(site)/**`) | `HubPublicProviders` → `PublicThemeProvider` | system default, light/dark/system | yes |
| Public care/marketplace/jobs/learn/logistics/property/studio | Each app's public providers chain | same canonical pattern | yes (per-app site nav) |
| Customer account (`apps/account/**`) | Account-specific provider chain | system default, supported | yes (in account header) |
| **Owner workspace** (`apps/hub/app/owner/(command)/**`) | Inherits `PublicThemeGuard` from hub root — **NO `PublicThemeProvider` wrap** | Whatever the blocking script applies, but **`useTheme()` hook is unavailable** to owner-route children | **NO toggle UI mounted** |
| **Staff HQ** (`apps/staff/**`) | Root layout has `<ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark">` | **Dark FORCED**, no system, user cannot override | **NO toggle UI** |

The conductor verified the staff HQ `forcedTheme="dark"` in `apps/staff/app/layout.tsx` line 23. The conductor verified the owner workspace inherits only `PublicThemeGuard` (via `apps/hub/app/layout.tsx`) and that `apps/hub/app/owner/(command)/layout.tsx` does NOT wrap children in `PublicThemeProvider`.

### CSS reality hypothesis — VERIFY in S1

Owner workspace and Staff HQ surfaces were built dark-only during the V3 PASS 21 design rebuild. Expect to find:
- Hardcoded hex/named colors in JSX (`bg-[#0a0f1e]`, `text-white`, `border-white/10`, `text-zinc-400` …) without `dark:` variants
- CSS variables defined ONCE (with dark values only) in `globals.css` or component scopes
- Brand surfaces using gold-on-dark color schemes that need a careful light-mode counterpart (gold-on-paper or gold-on-cream, NOT naive gold-on-white)
- Probable owner CSS variables: `--acct-*`, `--owner-*`, `--site-*`, `--market-*`, `--studio-*` (each likely with dark-only values)

These need migration to semantic tokens with two-mode values.

### Out of scope (HARD stops)

- **Customer / account dashboard** (`apps/account/**`) — explicitly excluded by owner directive ("the users dashboard theme is fine")
- **Mobile apps** (`apps/super-app`, `apps/company-hub`) — Expo, separate theme stack; deferred to V3-87
- **`packages/search-ui/`** — owner-reserved per memory `feedback_dashboard_search_engine_no_touch.md`
- **Brand identity changes** — gold accent, serif headlines, monogram, brand palette PRESERVE in BOTH modes; no rebrand
- **No new theme primitives** beyond Light/Dark/System — no color-theme picker, no time-of-day auto-dim, no per-tab themes. Owner approved the 3-state pattern as best-in-class for this product. If you discover a strong case for an additional pattern, surface it in the report, don't ship it.
- **No new locales** — i18n untouched except for theme-toggle aria-labels (use existing `surface:` namespace or extend with one new key)

---

## Mandatory scope

This pass is structured in **8 phases**. Earlier phases unblock later phases. If a session quota is tight, deliver Phases 1–3 fully + a plan doc for Phases 4–6. Do NOT skip phases out of order.

### Phase 1 — CSS audit + token gap analysis (S1)

Walk every Owner Workspace + Staff HQ surface. Catalogue:

1. **Hardcoded color usage** — every literal hex (`#0a0f1e`, `#fff`), every Tailwind color string without a `dark:` counterpart (`text-white`, `bg-black`, `border-zinc-800`), every CSS `color: …` / `background: …` rule using literal values.
2. **CSS variables** — every `--*` defined for these surfaces (whether in `globals.css`, a per-route CSS module, or component-level `<style>` blocks). Note which have only a dark value.
3. **Existing tokens** — what's already token-based that we should keep (e.g., `--acct-gold`, `--site-accent` — verify these have appropriate light + dark values).
4. **Component-scoped colors** — Tailwind utility classes inside JSX that don't go through CSS variables at all.

Output the audit at:
`docs/v3/theme-audit-owner-staff.md`

Structure:
- **Owner Workspace section** — per-route file table (file path | hardcoded count | needs-token count | severity)
- **Staff HQ section** — same per-route table
- **Shared dependencies section** — `packages/dashboard-shell`, `packages/ui/src/public-shell`, owner-specific packages — anything that owner + staff both consume
- **Token gap list** — what semantic tokens DON'T exist yet but need to, sorted by usage frequency
- **Severity legend** — `low` (single utility class swap), `medium` (component-scoped, multiple files), `high` (CSS variable redefinition affecting many surfaces)

This audit IS the deliverable for Phase 1. Other phases consume it.

### Phase 2 — Semantic-token foundation (S2)

Define semantic tokens. The system MUST express:

- **Surface elevations** — `--surface-base`, `--surface-raised`, `--surface-overlay` (three depths; light + dark values; brand-coherent — gold doesn't look out of place on any of them)
- **Ink hierarchy** — `--ink-primary`, `--ink-secondary`, `--ink-muted`, `--ink-disabled` (four levels; contrast-checked)
- **Borders** — `--border-subtle`, `--border-strong`, `--border-focus` (three weights; visible in both modes)
- **Accent** — `--accent-primary` (gold), `--accent-soft` (gold-tinted background), `--accent-on-light`, `--accent-on-dark` (the gold maintains brand identity but its CONTRAST with surface changes per mode)
- **Feedback** — `--state-success`, `--state-warning`, `--state-danger`, `--state-info` (with sufficient contrast in BOTH modes; not just naive Tailwind defaults)

Tokens live in:
- `packages/ui/src/theme/tokens.css` (new) — single source of truth, defines BOTH light and dark values per token via `:root` and `:root[data-theme="dark"]`
- `packages/ui/tailwind-tokens.ts` (new or extend existing) — Tailwind `theme.extend.colors` mapping that consumes the CSS variables, so `text-ink-primary` works in JSX

Import `tokens.css` once, at the top of each app's root `globals.css` (or via the shared `@henryco/ui/theme/tokens.css` import — pick the established pattern in the repo).

The token names and values are the SECOND artifact of this pass. Document them at:
`docs/v3/theme-tokens.md` — full token registry with light + dark hex values, contrast ratios against typical pairings, usage guidance per token.

**Brand coherence guidance:**
- HenryCo's gold accent is a serif-paired warm color. Keep it the same hex in both modes; what changes is the SURFACE it sits on. Light mode: gold on paper/cream. Dark mode: gold on midnight/charcoal.
- HenryCo's ink is NOT pure black on white in light mode — use a deep ink-graphite (`#0F172A` or similar) on a warm paper (`#F6F4EF` or similar). Premium publications never use pure-black-on-pure-white because it strains the eyes.
- Premium dark mode is NOT pure-white text on pure-black background — use a warm ink (`#F5F1E8` or similar) on a graphite (`#0A0F1E` or similar).

These exact values can shift — document your choices and the rationale.

### Phase 3 — Wire owner workspace provider + toggle (S3)

In `apps/hub/app/owner/(command)/layout.tsx`:
1. Import `PublicThemeProvider` from `@henryco/ui/public-shell`
2. Wrap the existing children tree (sidebar + topbar + content) in `<PublicThemeProvider>`
3. Mount `<ThemeToggle />` in the owner topbar. Find the canonical topbar component — likely:
   - `apps/hub/components/owner/OwnerSidebar.tsx` (if it has a topbar slot)
   - Or a dedicated `OwnerTopbar.tsx`
   - Or inline in the (command) layout itself
   Place the toggle near the user-avatar / notification-bell / search-launcher group — discoverable but not the primary focus.
4. Verify `PublicThemeGuard` is already mounted at the hub root layout (it should be — verified by conductor). If not, add it.

Visual self-check: toggle works in both directions, persists on reload, system mode follows OS toggle.

### Phase 4 — Wire staff HQ provider + toggle (S4)

In `apps/staff/app/layout.tsx`:
1. Replace:
   ```tsx
   import { ThemeProvider } from "next-themes";
   …
   <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark">
   ```
2. With:
   ```tsx
   import { PublicThemeProvider, PublicThemeGuard } from "@henryco/ui/public-shell";
   …
   <PublicThemeGuard>
     <PublicThemeProvider>
       …
     </PublicThemeProvider>
   </PublicThemeGuard>
   ```
   (verify whether `PublicThemeGuard` is required separately or whether `PublicThemeProvider` already wraps it — the conductor's audit found them as separate exports; read the source to confirm composition order)
3. Mount `<ThemeToggle />` in the staff topbar — find `apps/staff/components/StaffTopbar.tsx` or scan `apps/staff/app/(workspace)/layout.tsx` for the chrome host.

Staff HQ has been dark-only since launch. Expect to find styling that breaks under light mode (e.g., `text-white` on a now-white background). Catalogue these breakages during Phase 1 and fix them in Phase 5/6.

### Phase 5 — Color migration: owner workspace (S5)

Per-route, per-component, replace hardcoded color usages with semantic tokens defined in Phase 2.

**Priority surfaces** (highest traffic / most-visible first; ship in this order):
1. `apps/hub/app/owner/(command)/dashboard/page.tsx` (owner overview)
2. `OwnerSidebar` + `OwnerMobileNav` + topbar
3. Owner notification bell + toast viewport (`OwnerNotificationsLauncher`, `OwnerNotificationsToastViewport`)
4. Owner search palette (`OwnerPaletteHost`)
5. Dashboard tiles (session-health-tile from V3-01, notification-health-tile from V3-03, observability-tile from V3-10, slow-surface-tile from V3-05)
6. Owner brand pages section (`(command)/brand/*`)
7. Owner AI surfaces (`(command)/ai/*`)
8. Owner staff routes (`(command)/staff/*`)

Use:
- **Semantic tokens** where the value is reused (`text-ink-primary`, `bg-surface-raised`)
- **Tailwind `dark:` variants** only where the token approach is overkill (a single one-off accent)
- **CSS variables** at component scope when the value is structural (e.g., a panel's specific elevation gradient)

Self-verify in BOTH modes after each route — owner-quality bar, not "good enough on dark, ugly on light".

### Phase 6 — Color migration: staff HQ (S6)

Same approach as Phase 5 but for `apps/staff/**`. Staff HQ has fewer routes than owner workspace but probably more raw dark-only colors since it was built fast.

**Priority surfaces:**
1. `apps/staff/app/page.tsx` (staff home)
2. Staff topbar + sidebar (chrome host)
3. Operations pages (`(workspace)/operations/**`)
4. Support pages (`(workspace)/support/**`)
5. Newsletter pages (`(workspace)/operations/newsletter/**`)
6. Per-division staff workspaces

### Phase 7 — Public pages no-regression verification (S7)

Public pages already use the canonical theme system — but the token additions from Phase 2 may touch shared CSS variables. Verify (open each in Light + Dark + System mode):

- Public hub apex (henrycogroup.com → `apps/hub/app/(site)/page.tsx`)
- care.henrycogroup.com → `apps/care/app/(public)/page.tsx`
- marketplace.henrycogroup.com
- jobs.henrycogroup.com
- learn.henrycogroup.com
- logistics.henrycogroup.com
- property.henrycogroup.com
- studio.henrycogroup.com
- account.henrycogroup.com sign-in/signup landing (yes the customer dashboard is excluded, but the unauthenticated landing surfaces are public-shell so they're in scope for regression check)

Open Chrome DevTools, toggle the device-emulation OS theme between light + dark to test system mode. **No visual regression allowed** — if a public surface breaks because of your token changes, revert the token change OR add a public-shell-scoped override.

### Phase 8 — A11y + motion + contrast + telemetry + docs (S8 + S9)

**A11y:**
- Every text/background combination in the migrated surfaces meets WCAG AA (4.5:1 for body, 3:1 for large text ≥18pt or ≥14pt bold). Use a contrast checker (axe-core has one; alternatively `colorjs.io`). Spot-check 5+ pairings per migrated surface.
- Focus rings visible in BOTH modes — `focus-visible:ring-…` with appropriate `ring-offset-*` per mode.
- `prefers-reduced-motion` respected: theme-switch transitions disabled when set (next-themes' `disableTransitionOnChange` handles this); also any decorative animation honors the media query.
- `prefers-contrast: more` respected (basic tier) — bump border weights one step.
- ThemeToggle is keyboard-accessible: Tab focus, Enter/Space activate, aria-label announces current mode + resolved state (already implemented in `ThemeToggle.tsx`; verify it survives the topbar wiring).

**Telemetry (S9):**
Register and emit when the user actively switches theme (NOT on initial system-resolution):
- `henry.ui.theme.switched_to_light`
- `henry.ui.theme.switched_to_dark`
- `henry.ui.theme.switched_to_system`

Add the event names to `packages/observability/src/events.ts` `HenryEventName` union. Emit from `ThemeToggle` via `@henryco/observability` `emitEvent` only when the click happens (not on initial mount).

**Documentation:**
- `docs/v3/theme-tokens.md` — full token registry (final state) with light + dark values, contrast ratios, usage guidance
- `docs/v3/theme-migration.md` — record of what moved from hardcoded to token; anti-patterns to avoid going forward; how to add a new token; how to handle a new app
- A short README at `packages/ui/src/theme/README.md` explaining the primitives + how to use them in any new app

---

## Validation gates

1. Standard CI (Lint, typecheck, test, build) on this branch — must pass.
2. **Static evidence** — `grep -rE "(text-white|bg-black|#0a0f1e)" apps/hub/app/owner apps/staff` returns a SHORT list (target: <5% of pre-migration count); the script logs what remains and why.
3. **Visual self-check** — agent has reviewed BOTH modes on every priority surface listed in Phases 5/6/7.
4. **A11y contrast** — automated scan on 3 owner routes + 3 staff routes returns zero WCAG-AA fails.
5. **No regression on public pages** — agent confirms light + dark unchanged for the 9 public surfaces listed in Phase 7.
6. **Toggle UX** — keyboard-only test in owner + staff shells.
7. **Telemetry events** registered + emit verified on click (not on mount).

## Deployment gate

- All validation gates pass
- DRAFT PR opened, NOT auto-merged
- PR body lists:
  - Per-file color migration count (before/after)
  - Token registry summary
  - Screenshots of light + dark for 3 owner routes + 3 staff routes (if agent can produce them; if not, owner supplies)
  - Known regressions or visual concerns surfaced for owner decision
- **Owner visual sign-off required** before merging this PR

---

## Final report contract

`.codex-temp/theme-owner-staff-standardize/report.md` — standard 9 sections plus:
- Token registry final state (table form)
- Per-file color migration count (before/after)
- A11y contrast verification matrix (sample of 20+ pairings across owner + staff)
- Telemetry event registration evidence
- Phase-by-phase progress (which phases shipped fully, which deferred, exact pickup notes for next session if multi-session)

---

## Anti-patterns (HARD stops — non-negotiable)

- **No second theme system.** Use the existing `@henryco/ui/theme` primitives. Don't import `next-themes` directly into apps — import `PublicThemeProvider` from `@henryco/ui/public-shell`.
- **No `forcedTheme`.** That's what we're removing.
- **No hardcoded hex outside CSS variables.** Replace with tokens or Tailwind `dark:` variants. If a hex must stay (vendor logo, brand artwork), exempt with a code comment explaining why.
- **No touching `packages/search-ui/`.** Memory `feedback_dashboard_search_engine_no_touch.md` — owner-reserved.
- **No touching `apps/account/**`.** User explicitly excluded ("the users dashboard theme is fine").
- **No mobile-app theme work.** Expo apps (`apps/super-app`, `apps/company-hub`) are out of scope; their theming is V3-87.
- **No new locales.** i18n untouched except for theme-toggle aria-labels (one or two new surface labels are OK; route through `@henryco/i18n`).
- **No giant hero text.** Memory `feedback_no_giant_hero_text.md` — preserve current visual proportions.
- **No `git push --force`.** Use `--force-with-lease` if a rebase requires it.
- **No PR auto-merge.** This pass requires owner visual sign-off.
- **No naive color-flips.** "Make text-white become text-black on light" is wrong. Use semantic tokens that account for brand coherence on each background.
- **No removing existing brand artwork** (logos, gold seal, monogram) — preserve in both modes.

---

## Session pickup format (for multi-session execution)

This pass is L effort, 3–5 sessions. Each session:

1. Reads this prompt
2. Reads `.codex-temp/theme-owner-staff-standardize/report.md` if it exists (previous-session residuals)
3. Executes ONE or TWO phases per session, fully
4. Updates the report with: phases completed this session, deferred items, anti-pattern violations caught, exact files-touched list, owner-decision items surfaced
5. Pushes branch + opens or updates the DRAFT PR

The report drives the next session. Keep it crisp and complete.

---

## Self-verification checklist

- [ ] Phase 1: `docs/v3/theme-audit-owner-staff.md` written, per-route table populated, token gap list complete
- [ ] Phase 2: `packages/ui/src/theme/tokens.css` + Tailwind tokens defined with light + dark values
- [ ] Phase 2: `docs/v3/theme-tokens.md` documents the registry
- [ ] Phase 3: `apps/hub/app/owner/(command)/layout.tsx` wraps in `PublicThemeProvider`
- [ ] Phase 3: ThemeToggle mounted in owner topbar
- [ ] Phase 4: `apps/staff/app/layout.tsx` drops `forcedTheme` and uses `PublicThemeProvider`
- [ ] Phase 4: ThemeToggle mounted in staff topbar
- [ ] Phase 5: Owner workspace priority surfaces (8 listed) migrated; visual self-check in BOTH modes
- [ ] Phase 6: Staff HQ priority surfaces (6 listed) migrated; visual self-check in BOTH modes
- [ ] Phase 7: 9 public surfaces verified no-regression in light + dark
- [ ] Phase 8: A11y contrast checked on 3+3 routes, no fails
- [ ] Phase 8: Telemetry events registered + emit verified on click
- [ ] Phase 8: `docs/v3/theme-tokens.md`, `docs/v3/theme-migration.md`, `packages/ui/src/theme/README.md` all updated
- [ ] DRAFT PR opened with screenshots-needed list + per-file migration count
- [ ] Report at `.codex-temp/theme-owner-staff-standardize/report.md` written

---

You're Opus 4.7. The owner asked for "second to none". This isn't shallow work — it's the kind of polish that lands when an enterprise product graduates from "functional dark mode" to "considered theming". The owner sees this directly and decides if it earns a credit record. Make every shipped phase convincing.

In session 1, prioritize Phases 1–3 + Phase 4 (the provider wire-ups + audit + tokens). Session 2 handles Phase 5/6 color migration. Session 3 handles Phase 7/8 verification + polish + docs.

Don't try to ship all 8 phases in one session. Quality over speed. Stop, report, hand off.
