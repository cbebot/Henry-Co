# DESIGN-01 — Marketplace Profile Nav Drawer Rebuild

**Pass ID:** DESIGN-01
**Phase:** Polish / Design uplift
**Pillar:** P12 (Global UX)
**Dependencies:** Wave B.1 closed (V3-09 shipped `useAndroidBackClose`, `BottomSheet`, `Drawer` primitives + safe-area helpers in `@henryco/ui/mobile`)
**Effort:** M (1–2 sessions)
**Parallel-safe:** YES (no overlap with THEME-01 or RELIABILITY-01)
**Owner gate:** Visual sign-off before merge
**Risk class:** None

---

## Role

You are the V3 Design engineer. Owner directive, verbatim:

> "Also the marketplace profile nav drawer is not nice. Make it magnificent. Scrolling nice, when am at the bottom of the page and open it, how it should open etc. Make it nice built from scratch and design it with your max Claude design properly where appropriate."

**The bar:** every interaction with this drawer feels considered. Open animation is smooth (spring, not linear). When the user opens it from any scroll position the page beneath locks at exactly that position (no scroll-jump), the drawer slides up from the bottom with the right depth + shadow, the user can swipe down to dismiss, scrolling inside the drawer is independent of page scroll (no rubber-band leak), closing restores the page to the exact previous scroll. Focus is trapped inside the drawer while open, Esc closes, hardware back closes on Android.

This is **the marketplace profile drawer specifically** — `WorkspaceMobileNav` in `apps/marketplace/components/marketplace/workspace-mobile-nav.tsx`. NOT every drawer in the codebase. Other drawers may benefit from the same primitive but they're out of scope unless the rebuild naturally extends `@henryco/ui/mobile` primitives that other drawers consume.

---

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `design/marketplace-profile-drawer-v2` |
| Worktree (absolute) | `C:/Users/HP VICTUS/HenryCo/.worktree/design-marketplace-drawer` |
| Branch base | `main @ 0c33ffa2` (V3-05 merged; entire Wave B.1 on main) |
| OS context | Windows + bash; pnpm 9.15.5; Node 24.x |

Use ABSOLUTE PATHS for every Read/Edit/Write/Grep/Glob call.
For Bash, first call `cd "C:/Users/HP VICTUS/HenryCo/.worktree/design-marketplace-drawer"`. CWD persists.
For git, prefer `git -C "C:/Users/HP VICTUS/HenryCo/.worktree/design-marketplace-drawer" <cmd>`.
DO NOT touch the parent repo or any sibling worktree (THEME-01 + RELIABILITY-01 are running in parallel).

---

## Reference architecture (conductor verified)

### Current implementation (the file to replace or rebuild)

`apps/marketplace/components/marketplace/workspace-mobile-nav.tsx` — 181 lines. Built as a per-app bottom-sheet using local `useState` for `open` + expanded-group dict. Mobile-only (lg-and-below). Composition:

```
WorkspaceMobileNav({ title, description, groups, currentLabel })
  → trigger button (Menu icon + title + currentLabel)
  → open=true → bottom-anchored sheet
    → close button (X icon, top-right)
    → header (title + description)
    → nav groups (Activity / Commerce / Saved / Selling / Support)
      → each group has expandable items + ChevronDown
```

The conductor's observed issues (per owner directive):
- **"Not nice" — visual polish lacking.** Likely flat shadows, no spring physics, abrupt animations, weak handle/grabber affordance, inconsistent spacing.
- **"Scrolling nice" — scroll behavior bad.** Body scroll may bleed when drawer is open (page scrolls beneath); internal drawer scroll may rubber-band into body scroll; sheet may not respect safe-area-bottom.
- **"When at bottom of page, how it should open."** Opening from `document.scrollHeight - innerHeight` likely jumps the page or causes the sheet to render in wrong relative position. The drawer should anchor to the viewport BOTTOM regardless of page scroll position, and on close the page should land back at the exact scroll position.

### Available primitives (V3-09)

`@henryco/ui/mobile` ships:
- `BottomSheet` — bottom-anchored sheet component with backdrop + open/close API
- `Drawer` — side-drawer component (right-aligned by default)
- `useAndroidBackClose(onClose)` — popstate listener that closes when hardware back fires
- `useKeyboardAvoidance()` — viewport keyboard wrapper
- `useScrollDirection(threshold)` — for sticky-nav auto-hide

`@henryco/ui/a11y` ships:
- `useFocusTrap` — keyboard focus trap inside container
- `useReducedMotion` — read `prefers-reduced-motion`
- `SkipLink` — keyboard skip

These primitives are the foundation. The marketplace profile drawer becomes a curated INSTANCE of `BottomSheet` (mobile) — or extend `BottomSheet` with the missing behaviors if needed.

If `BottomSheet`'s current API doesn't expose what you need (gesture-to-dismiss, body scroll lock, scroll-restoration on close), EXTEND it in `packages/ui/src/mobile/bottom-sheet.tsx` with backward-compatible additions. Don't fork a new primitive.

---

## Mandatory scope

### Phase 1 — Design spec (write this BEFORE coding)

Write a short design spec at:
`docs/v3/design-marketplace-profile-drawer.md`

Cover:

**Interaction model:**
- Trigger button location + tap target (≥44×44)
- Animation: open = spring (mass 1, stiffness 380, damping 30 — or equivalent in CSS); close = same spring reversed; durations capped at 280ms for open / 220ms for close; reduced-motion replaces with instant 0ms
- Backdrop: blur + tint (use design tokens that match marketplace's brass-on-dark aesthetic; not naive `rgba(0,0,0,0.5)`)
- Body scroll lock: `position: fixed` on `<body>` with `top: -<currentScrollY>px` and restoration on close
- Drawer scroll: independent scroll container inside drawer; CSS `overscroll-behavior: contain` to prevent rubber-band leak
- Swipe gesture: drag down on the handle/header area dismisses; threshold ~80px or ~30% drawer height; spring back if released before threshold; flick velocity also triggers close
- Hardware back: closes (`useAndroidBackClose`)
- Esc key: closes
- Focus trap: yes (`useFocusTrap`)
- Restore focus on close: to the trigger button

**Visual:**
- Drawer surface: max-height `92dvh` (dynamic viewport so iOS Safari URL bar doesn't shift), rounded-top-2xl, subtle inner border, lifted shadow
- Top handle: pill shape (4×40), centered, low-opacity, tap-target buffer
- Header: title + close (X) button (44×44 tap area)
- Description: secondary ink, max 2 lines
- Group separators: subtle dividers between groups (not big borders)
- Item rows: 48px min height, generous padding, active state has tinted background + bold label
- Bottom safe-area: `pb-safe-bottom` (V3-09 helper)
- Footer (optional): if marketplace has account-level CTA (e.g., "Sign out"), pin it at bottom with a subtle divider

**Theming:**
- Use marketplace's existing CSS tokens (`--market-paper-white`, `--market-muted`, `--market-line`, `--market-brass`) as the canonical colors
- THEME-01 may be running in parallel adding new semantic tokens. If THEME-01 lands first, use those tokens. Otherwise, use the existing market tokens — don't introduce a third theme system in this drawer

**A11y:**
- `role="dialog"` + `aria-modal="true"` on the drawer
- `aria-labelledby` pointing at the title element
- `aria-describedby` pointing at the description if present
- Keyboard: Tab traps within, Shift+Tab traps backward, Enter/Space activates focused link, Esc closes
- Trigger: `aria-expanded`, `aria-controls` pointing at drawer ID
- Reduced motion: instant transitions, no swipe gesture (button-only close)

### Phase 2 — Extend or use BottomSheet primitive

Read `packages/ui/src/mobile/bottom-sheet.tsx` to understand its current API.

If the API already exposes what the design spec needs (gesture-to-dismiss, body scroll lock, scroll-restoration, focus trap, handle), USE IT.

If gaps exist, EXTEND `BottomSheet` with:
- `enableSwipeDismiss?: boolean` (default true on mobile, false on desktop)
- `lockBodyScroll?: boolean` (default true)
- `restoreScrollOnClose?: boolean` (default true)
- `handleVariant?: 'pill' | 'none'` (default 'pill')
- Forward refs for the trigger so the rebuild can manage focus restoration
- `maxHeight?: string | number` (default '92dvh')

Backward-compatible additions only. Existing callers of `BottomSheet` continue to work without changes.

If extending, add a brief CHANGELOG entry in `packages/ui/src/mobile/CHANGELOG.md` (create if absent) noting the additions.

### Phase 3 — Rebuild WorkspaceMobileNav

Rewrite `apps/marketplace/components/marketplace/workspace-mobile-nav.tsx` from scratch using `BottomSheet` as the foundation.

Keep the public API stable — the consumer in `apps/marketplace/components/marketplace/shell.tsx` (line 465) passes `title`, `description`, `groups`, `currentLabel`. Don't break that contract.

Implementation guidance:
- Replace the local `useState` + manual transition CSS with `BottomSheet`'s built-in open/close
- Use `useFocusTrap` from `@henryco/ui/a11y`
- Use `useAndroidBackClose` from `@henryco/ui/mobile`
- Body-scroll lock via the extended `BottomSheet` API (or a manual implementation if extension is too disruptive)
- Animate group expand/collapse with `max-height` + opacity transitions (CSS, ~200ms ease-out)
- Active group auto-expands on open (the group containing the current route)
- Group label hierarchy: small caps eyebrow, larger group title, indented items
- Active item: tinted background + brass-colored text + persistent ChevronRight or rotate indicator
- Inactive items: muted, gentle hover/active states
- Trigger button: animated state transition on press (slight scale-down + color shift); shows current section name + chevron-down to communicate "tap to see all"

### Phase 4 — Polish + edge cases

- Test opening at scroll positions: 0, 50% of page, 95% of page (near bottom). Drawer always anchors to viewport bottom; page stays locked at scroll position; on close page restores exactly.
- Test orientation change while open: drawer re-anchors to bottom, doesn't get stuck mid-screen
- Test soft keyboard: when a link is focused (unlikely but possible) and keyboard appears, drawer should NOT jump — body is locked, drawer height shrinks to accommodate
- Test rapid open/close (tap trigger 5 times fast): no animation jank, no orphaned drawer state
- Test theme switch while drawer is open (THEME-01 land may enable this): drawer colors update instantly
- Test screen-reader navigation: announce drawer open ("Workspace menu, dialog"), announce items, announce close

### Phase 5 — Telemetry

Register in `packages/observability/src/events.ts`:
- `henry.marketplace.profile_drawer.opened`
- `henry.marketplace.profile_drawer.closed` (with `via: 'tap_close' | 'tap_backdrop' | 'swipe_down' | 'android_back' | 'escape_key' | 'navigation'`)
- `henry.marketplace.profile_drawer.item_selected` (with `group, label, href`)

Emit from the rebuilt component. These feed the owner workspace tile for drawer engagement insights.

### Phase 6 — Documentation

- Update `docs/v3/design-marketplace-profile-drawer.md` (Phase 1 spec) with final implementation notes
- Add a short README at `packages/ui/src/mobile/bottom-sheet.README.md` (if you extended the primitive) explaining the new props + when to use them

---

## Validation gates

1. Standard CI (Lint, typecheck, test, build) on the branch — must pass.
2. **Manual smoke (open at top):** drawer opens, backdrop blurs, focus jumps to first focusable element inside drawer.
3. **Manual smoke (open at bottom of page):** page scrolls to bottom, drawer opens, page LOCKS at that position (no jump), on close page restores exactly.
4. **Manual smoke (swipe dismiss):** drag handle down >80px, drawer closes; drag <80px and release, drawer springs back.
5. **Manual smoke (Esc close):** drawer closes, focus returns to trigger.
6. **Manual smoke (Android back):** simulate via DevTools → popstate; drawer closes.
7. **Manual smoke (reduced motion):** with OS reduced-motion enabled, transitions are instant, no swipe gesture available (close via button only).
8. **Mobile + desktop:** desktop renders the existing sidebar unchanged (this component is `lg`-and-below only).
9. **A11y:** axe scan passes on the drawer (no critical issues); keyboard-only navigation works.
10. **3 telemetry events emitting**.

## Deployment gate

- All gates pass
- DRAFT PR opened, NOT auto-merged
- Owner reviews the drawer interaction visually (and on a real phone if possible)

## Final report contract

`.codex-temp/design-marketplace-profile-drawer/report.md` — standard 9 sections + final design spec excerpt + before/after notes + a11y verification + telemetry events list.

---

## Anti-patterns (HARD stops)

- NO new top-level drawer primitive. Use or extend `@henryco/ui/mobile` `BottomSheet`.
- NO third-party drawer library (no framer-motion drawer plugin, no Radix dialog as the foundation). Use the existing in-house primitives.
- NO breaking the `WorkspaceMobileNav` public API. The consumer in `shell.tsx` should not need to change.
- NO touching desktop sidebar (the `lg:block` <aside> in `shell.tsx`).
- NO breaking V3-09's chat-composer mobile full-screen mode or messaging-thread thin-bar (recent #114–#117 fixes preserved).
- NO touching `packages/search-ui/` (owner-reserved).
- NO touching `apps/account/**` (customer dashboard excluded by V3 directive).
- NO mobile-specific code in the desktop branch (`lg:hidden` on the trigger).
- NO giant hero text inside the drawer — preserve marketplace's editorial proportion.
- NO `git push --force`; use `--force-with-lease`.
- NO PR auto-merge.

---

## Self-verification checklist

- [ ] Design spec written at `docs/v3/design-marketplace-profile-drawer.md`
- [ ] `BottomSheet` primitive extended (if needed) with backward-compatible props
- [ ] `WorkspaceMobileNav` rebuilt using primitive; public API unchanged
- [ ] Trigger button: a11y attributes complete, animated on press
- [ ] Open animation: spring physics, capped 280ms, reduced-motion respected
- [ ] Backdrop: blur + brand-coherent tint
- [ ] Body scroll lock: `position: fixed` + `top: -scrollY`; restored on close
- [ ] Drawer scroll: independent, `overscroll-behavior: contain`
- [ ] Swipe dismiss: 80px threshold, spring back if under threshold
- [ ] Esc / Android back / backdrop tap all close
- [ ] Focus trap: yes; restore focus to trigger on close
- [ ] Safe-area-bottom padding applied
- [ ] Active group auto-expands on open
- [ ] Theme tokens consumed (not hardcoded hex)
- [ ] A11y: dialog role, modal=true, labelledby, describedby; axe scan passes
- [ ] 3 telemetry events emitting
- [ ] Manual smoke at top of page, mid-scroll, bottom of page all behave correctly
- [ ] DRAFT PR opened with before/after screenshots-needed list

---

You're Opus 4.7. The owner asked for "magnificent". This is a chance to show that mobile drawer UX can feel as considered as the best apps on a user's phone — Apple's Files, Linear's app, Stripe Dashboard mobile.

Session 1 target: Phases 1–3 fully (spec + primitive extension + rebuild). Phases 4–6 (polish + telemetry + docs) can spill to session 2 with crisp pickup notes.

Make every interaction count.
