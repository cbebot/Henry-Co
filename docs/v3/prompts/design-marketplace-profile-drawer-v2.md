# DESIGN-DRAWER-01 — Marketplace Profile Nav Drawer Rebuild

**Pass ID:** DESIGN-DRAWER-01  ·  **Phase:** B-adjacent (Foundation polish / mobile UX)  ·  **Pillar:** P12 (Global UX)
**Dependencies:** V3-09 (shipped `@henryco/ui/mobile`: `BottomSheet`, `Drawer`, `useAndroidBackClose`, `useKeyboardAvoidance`, `useScrollDirection`, safe-area helpers; `@henryco/ui/a11y`: `useFocusTrap`, `useReducedMotion`, `SkipLink`)  ·  **Effort:** M (1–2 sessions)  ·  **Parallel-safe:** Y (no overlap with account-surface or search-backend owners)
**Owner gate:** Visual sign-off before merge (review on a real phone if possible)  ·  **Risk class:** —

---

## Role

You are the V3 Mobile UX engineer for Henry Onyx. You execute exactly this one pass — rebuild the Henry Onyx Marketplace mobile profile/navigation drawer (`WorkspaceMobileNav`) into a magnificent, considered bottom-sheet — then stop and report. Every interaction must feel deliberate: spring open/close, body locked at exact scroll position when opened from anywhere (including the bottom of a long page), independent internal scroll with no rubber-band leak, swipe-to-dismiss, focus trapped, Esc + Android hardware-back close, exact scroll restoration on close. The line you must not cross: this is the **marketplace profile drawer specifically** (`apps/marketplace/components/marketplace/workspace-mobile-nav.tsx`), not every drawer in the codebase, and you do not fork a new primitive — you use or backward-compatibly extend `@henryco/ui/mobile`'s `BottomSheet`.

Owner directive, verbatim: "Also the marketplace profile nav drawer is not nice. Make it magnificent. Scrolling nice, when am at the bottom of the page and open it, how it should open etc. Make it nice built from scratch and design it with your max Claude design properly where appropriate."

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/design-marketplace-profile-drawer` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

Branch off `origin/main`. Use absolute paths. Do not auto-merge — owner reviews the drawer interaction visually before merge.

## Audit summary

`apps/marketplace/components/marketplace/workspace-mobile-nav.tsx` (~181 lines) is a per-app bottom-sheet built with local `useState` for `open` + an expanded-group dictionary, rendered mobile-only (`lg`-and-below). Its public API — consumed by `apps/marketplace/components/marketplace/shell.tsx` — is `WorkspaceMobileNav({ title, description, groups, currentLabel })`, rendering a trigger button (Menu icon + title + currentLabel) that opens a bottom-anchored sheet with a close button, header, and expandable nav groups (Activity / Commerce / Saved / Selling / Support).

Observed defects against the owner directive: weak visual polish (flat shadow, no spring physics, abrupt transitions, no handle/grabber affordance); bad scroll behaviour (body scroll bleeds beneath the open sheet; internal scroll rubber-bands into body scroll; safe-area-bottom not respected); and broken open-from-bottom (opening near `document.scrollHeight - innerHeight` jumps the page / mis-anchors the sheet). V3-09 already shipped the foundation primitives in `@henryco/ui/mobile` and `@henryco/ui/a11y`. **The gap this pass closes:** turn the bespoke per-app sheet into a curated instance of the shared `BottomSheet` with correct scroll-lock/restore, gesture dismiss, focus management, and Henry Onyx Marketplace visual polish — extending the primitive (not forking) where capability is missing.

## Mandatory scope

### S1 — Design spec (write before coding)
Author `docs/v3/design-marketplace-profile-drawer.md` covering the full interaction model, visuals, theming, and a11y:
- **Interaction:** trigger tap-target ≥44×44; open = spring (≈ mass 1, stiffness 380, damping 30; or CSS equivalent), close = reversed; durations capped 280ms open / 220ms close; reduced-motion → instant 0ms, no swipe. Backdrop = blur + brand-coherent tint (token-driven, not naive `rgba(0,0,0,.5)`). Body scroll lock = `position: fixed` on `<body>` with `top: -<scrollY>px`, restored exactly on close. Internal scroll container with `overscroll-behavior: contain`. Swipe-down on handle/header dismisses (threshold ≈80px or ~30% height; flick velocity also closes; spring back if released under threshold). Android hardware-back closes (`useAndroidBackClose`); Esc closes; focus trap (`useFocusTrap`); restore focus to trigger on close.
- **Visual:** surface `max-height: 92dvh` (dynamic viewport so the iOS URL bar doesn't shift it), rounded-top-2xl, subtle inner border, lifted shadow; centered pill handle (≈4×40, low-opacity, tap buffer); header title + 44×44 close (X); 2-line max description; subtle group dividers; item rows ≥48px with generous padding and a tinted active state; `pb-safe-bottom`; optional pinned footer CTA (e.g. "Sign out") with a subtle divider.
- **A11y:** `role="dialog"` + `aria-modal="true"`; `aria-labelledby` → title; `aria-describedby` → description; Tab/Shift+Tab trapped; Enter/Space activates; Esc closes; trigger carries `aria-expanded` + `aria-controls`.

### S2 — Use or extend the `BottomSheet` primitive
Read `packages/ui/src/mobile/bottom-sheet.tsx`. If its API already exposes gesture-to-dismiss, body-scroll lock, scroll-restoration, focus trap, and handle, USE it. Otherwise EXTEND it with **backward-compatible** props (existing callers keep working unchanged): `enableSwipeDismiss?: boolean` (default true on mobile), `lockBodyScroll?: boolean` (default true), `restoreScrollOnClose?: boolean` (default true), `handleVariant?: 'pill' | 'none'` (default `'pill'`), `maxHeight?: string | number` (default `'92dvh'`), and trigger-ref forwarding for focus restoration. Record additions in `packages/ui/src/mobile/CHANGELOG.md`.

### S3 — Rebuild `WorkspaceMobileNav`
Rewrite `apps/marketplace/components/marketplace/workspace-mobile-nav.tsx` from scratch on top of `BottomSheet`, keeping the public API (`title`, `description`, `groups`, `currentLabel`) stable so `shell.tsx` needs no change. Replace local `useState` + manual CSS transitions with the primitive's open/close; use `useFocusTrap` and `useAndroidBackClose`; animate group expand/collapse with `max-height` + opacity (~200ms ease-out); auto-expand the active group (the one containing the current route) on open; render group hierarchy as small-caps eyebrow → group title → indented items; active item = tinted background + brass text + a persistent/rotating indicator; trigger animates on press (slight scale-down + color shift) and shows the current section name + chevron-down.

### S4 — Polish + edge cases
Verify: opening at scroll 0 / 50% / 95% (near bottom) always anchors the sheet to the viewport bottom, locks the page, and restores scroll exactly on close; orientation change while open re-anchors (no stuck mid-screen); soft keyboard does not jump the locked body; rapid open/close (×5 fast) has no jank or orphaned state; theme switch while open updates colors instantly; screen-reader announces open ("Workspace menu, dialog"), items, and close.

### S5 — Telemetry
Register and emit (in `packages/observability/src/events.ts`): `henry.marketplace.profile_drawer.opened`; `henry.marketplace.profile_drawer.closed` (`via: 'tap_close' | 'tap_backdrop' | 'swipe_down' | 'android_back' | 'escape_key' | 'navigation'`); `henry.marketplace.profile_drawer.item_selected` (`group, label, href`). Only ADD events; never remove existing ones. No PII in payloads.

### S6 — Documentation
Append final implementation notes to `docs/v3/design-marketplace-profile-drawer.md`, and if you extended the primitive add `packages/ui/src/mobile/bottom-sheet.README.md` describing the new props and when to use them.

## Out of scope
- The desktop sidebar (`lg:block` `<aside>` in `shell.tsx`) — untouched.
- Every other drawer in the codebase — they may later adopt the extended `BottomSheet`, but they are not in scope here unless the primitive extension touches them backward-compatibly.
- `packages/search-ui/` — owner-reserved.
- `apps/account/**` — owned by ACCOUNT-PREMIUM-01.
- Mobile Expo apps (`apps/super-app`, `apps/company-hub`) — separate stack.
- Any change to V3-09's chat-composer mobile full-screen mode or messaging-thread thin-bar.

## Dependencies
Depends on V3-09 (mobile + a11y primitives). BLOCKS nothing downstream; the extended `BottomSheet` props become available to future drawer rebuilds across divisions as a reusable improvement.

## Inheritance
`@henryco/ui/mobile` (`BottomSheet`, `useAndroidBackClose`, safe-area helpers), `@henryco/ui/a11y` (`useFocusTrap`, `useReducedMotion`), `@henryco/i18n`, `@henryco/observability` (events), `@henryco/config` (brand + accent), V3-09 mobile foundation.

## Implementation requirements

### Files
- `docs/v3/design-marketplace-profile-drawer.md` (spec + final notes).
- `packages/ui/src/mobile/bottom-sheet.tsx` (backward-compatible extension, only if needed) + `packages/ui/src/mobile/CHANGELOG.md` (+ optional `bottom-sheet.README.md`).
- `apps/marketplace/components/marketplace/workspace-mobile-nav.tsx` (rewritten).
- `packages/observability/src/events.ts` (3 events added).
- Report at `.codex-temp/design-marketplace-profile-drawer/report.md`.

### Trust / safety / compliance
No data or auth surface — pure presentation/navigation. The "Sign out" footer CTA (if added) must call the existing logout flow (`logoutEverywhere`) wired through the marketplace shell; do not reimplement logout. Telemetry payloads carry no PII (label/href/group only).

### Mobile + desktop parity
This component is `lg`-and-below only; desktop renders the existing sidebar unchanged. The trigger carries `lg:hidden`. No mobile-specific code leaks into the desktop branch. Web mobile only — Expo super-app out of scope.

### i18n
All drawer copy (group titles, item labels, close/description, optional footer CTA) flows through `@henryco/i18n` under `surface:marketplace` (Pattern A typed keys; Pattern B DeepL fallback). The group/item labels come from the `groups` prop the host already supplies via i18n — do not hardcode any string in the rebuilt component. `pnpm i18n:check:strict` stays green.

### Brand & design system
Use Henry Onyx Marketplace's existing CSS tokens as the canonical palette (`--market-paper-white`, `--market-muted`, `--market-line`, `--market-brass`) — or the locked `--site-*`/`--accent` if the marketplace chrome has migrated; do not introduce a third theme system. Backdrop tint and active-item color are token-driven, no ad-hoc hex. Brand strings (if any chrome label) come from `@henryco/config` — never the retired "Henry & Co.". Light + dark both polished; preserve marketplace's editorial proportion (no giant hero text inside the drawer). Zero hardcoded domains.

## Validation gates
1. Standard CI (Lint, typecheck, test, build) green on the branch.
2. Manual smoke — open at top: drawer opens, backdrop blurs, focus jumps to first focusable inside.
3. Manual smoke — open at bottom of a long page: page locks at position (no jump), restores exactly on close.
4. Manual smoke — swipe dismiss: drag >80px closes; drag <80px springs back.
5. Manual smoke — Esc closes + focus returns to trigger; Android back (popstate) closes.
6. Manual smoke — reduced motion: instant transitions, swipe disabled (button-only close).
7. Desktop unchanged (sidebar renders; trigger hidden ≥`lg`).
8. `axe` scan passes on the drawer (no critical issues); keyboard-only navigation works.
9. 3 telemetry events emitting with correct payloads.
10. `pnpm i18n:check:strict` PASS.

## Deployment gate
All gates green. DRAFT PR opened, NOT auto-merged. Owner reviews the drawer interaction visually (and on a real phone if possible) before merge. Session 1 target: S1–S3 fully (spec + extension + rebuild); S4–S6 may spill to session 2 with crisp pickup notes.

## Final report contract
`.codex-temp/design-marketplace-profile-drawer/report.md` with the standard 9 sections (exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification · telemetry baseline · deferred items · pass-closure assertion), plus the final design-spec excerpt, before/after notes, a11y verification, and the telemetry event list.

## Self-verification
- [ ] Design spec written at `docs/v3/design-marketplace-profile-drawer.md`
- [ ] `BottomSheet` used as-is, or extended with backward-compatible props only (CHANGELOG updated)
- [ ] `WorkspaceMobileNav` rebuilt on the primitive; public API (`title/description/groups/currentLabel`) unchanged
- [ ] Open animation = spring, capped 280ms, reduced-motion respected; backdrop = blur + brand-coherent tint
- [ ] Body scroll lock (`position: fixed` + `top: -scrollY`) with exact restore on close; internal scroll `overscroll-behavior: contain`
- [ ] Swipe dismiss (80px / flick), Esc, Android back, backdrop tap all close; focus trapped + restored to trigger
- [ ] Safe-area-bottom padding; active group auto-expands; token-driven theming (no hardcoded hex)
- [ ] A11y: dialog/modal/labelledby/describedby; `axe` clean; keyboard-only works
- [ ] Open at top / mid-scroll / bottom all behave; orientation + rapid open/close + theme-switch handled
- [ ] 3 telemetry events emitting; only added, none removed
- [ ] Brand = Henry Onyx via `@henryco/config`; copy via `@henryco/i18n` (`surface:marketplace`); zero hardcoded strings/domains
- [ ] `pnpm i18n:check:strict` + CI green; DRAFT PR opened, not auto-merged, with before/after screenshots-needed list
