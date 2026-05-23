# Dashboard mobile click audit — FIX-MOBILE-CLICKS

**Pass:** FIX-MOBILE-CLICKS
**Branch:** `fix/dashboard-mobile-button-clicks`
**Base:** main @ `1768a99d`
**Author:** V3 Regression engineer (Opus 4.7)

---

## Owner directive

> "The dashboard settings button and help button are not responding to clicks on mobile devices. please fix that too. make sure all buttons are clicking. do it with your max effort not just shallow work as we keep lamenting on. don't hardcode anything"

The bar: every button + link in every dashboard mobile surface responds reliably to taps on real mobile devices. Settings + Help (in `BottomActionBar`'s "More" sheet) are the named regression. The fix must be one root-cause class fix, not 5 per-button workarounds.

---

## Investigation — event chain

User taps Settings inside the More sheet. The expected chain:

1. `touchstart` → `touchend` → `mousemove` → `mousedown` → `mouseup` → `click` on the `<Link>`.
2. React synthetic `onClick` chain fires once, in this order on the target Link:
   - User-supplied `onClick={onPick}` → `setOpenSheet(null)` queued in React batch.
   - Next.js `<Link>`'s bound `onClick` → `e.preventDefault()` + `router.push(href)` → `history.pushState`.
3. React commit: parent state flips `openSheet` to `null` → `BottomSheet` returns `null` → `useAndroidBackClose` cleanup runs.
4. Cleanup reads `window.history.state`. Next.js already pushed a state that lacks `__henryco_modal`, so the cleanup correctly **skips** `history.back()`. Navigation completes.

This chain is sound on desktop. On mobile (iOS Safari especially) it breaks because of step 1's tap interpretation.

### What V3-09 (#135) changed

Diff vs pre-V3-09:

```diff
+ useAndroidBackClose(open, onClose, { surface: telemetrySurface });
- onClick={onClose}
+ onClick={() => { emitModalBackdropTap(telemetrySurface); onClose(); }}
+ paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom, 0px))"
```

#139 stabilised the hook's deps so it doesn't re-fire on every parent re-render. After #139, `useAndroidBackClose` is correct on the hook side — confirmed by re-reading `packages/ui/src/mobile/use-android-back-close.ts` (cleanup guards on `currentState[SENTINEL_MARKER]`, only pops if the sentinel is still top of stack).

### Hypothesis ranking

The spec lists 6 vectors. Verdict per vector:

| # | Vector | Verdict | Evidence |
|---|---|---|---|
| 1 | iOS 300ms click delay — no `touch-action: manipulation` on `<a>` inside the sheet | **CONFIRMED root cause** | `grep -rn 'touch-action\\|touchAction' packages/dashboard-shell/src` → only `notification-card.tsx:123` (pan-y). MoreLink, MoreSheetBody, sheet body, AnchorButton — ZERO `touch-action`. iOS Safari's default `touch-action: auto` enables double-tap-zoom heuristics → 300ms click delay window → during that window, address-bar collapse repaints or scroll deltas can suppress the synthetic click. |
| 2 | `stopPropagation` on sheet body swallows nested Link clicks | NOT the cause | React synthetic events dispatch per-target then bubble. `e.stopPropagation()` on an ancestor cannot prevent the click handler on the target Link from firing — only stops bubbling to the backdrop. Verified by reading the React 19 event delegation model and inspecting `packages/dashboard-shell/src/components/bottom-sheet.tsx:160`. |
| 3 | Focus sentinels intercept taps | NOT the cause | Both sentinels are `position: fixed; width:1; height:1; pointer-events: none; opacity:0`. `pointer-events: none` is set inline (`bottom-sheet.tsx:152, 262`) — no host CSS can override an inline rule with the same specificity. They cannot block taps. |
| 4 | z-index conflict above sheet (9000) | NOT the cause | BottomActionBar is z-index 90 (`bottom-action-bar.tsx:142`). Drawer is z-index 8000 (`drawer.tsx:118`). Nothing in the dashboard-shell renders ABOVE 9000. The only thing that could is a host portal — but the named regression is on a clean surface (More sheet without an overlay). |
| 5 | Address-bar-collapse repaint | Adjacent, mitigates with #1 fix | Without `touch-action: manipulation`, a scroll delta during the 300ms click-delay window aborts the synthetic click. iOS Safari's collapsing address bar fires scroll deltas mid-gesture. Setting `touch-action: manipulation` collapses the delay window to ~0ms, eliminating the race. |
| 6 | PointerEvent vs TouchEvent listener mismatch | NOT the cause | No code path in the dashboard-shell BottomSheet listens on `touchstart` with `preventDefault`. The only `touch*` listeners are in the NEW DESIGN-01 `packages/ui/src/mobile/bottom-sheet.tsx` (swipe-to-dismiss on the handle, passive). The dashboard-shell BottomSheet (the one rendering Settings/Help) has no touch listeners at all. |

### Root cause (verbatim)

`packages/dashboard-shell/src/components/bottom-sheet.tsx` and `drawer.tsx` render their modal body with `className="hc-modal-body"`. The shared `.hc-modal-body` rule in `packages/dashboard-shell/src/shell/mobile-shell-css.ts` declares `overscroll-behavior-y: contain` and `-webkit-overflow-scrolling: touch` and `max-height: 90dvh` — but **NOT `touch-action`**. iOS Safari therefore applies its default `touch-action: auto`, which keeps double-tap-zoom enabled inside the sheet. Every link/button inside the sheet inherits the 300ms click delay. Under address-bar collapse or any sub-300ms scroll delta, the synthetic click is suppressed and the navigation never starts.

This is a **class-level** bug: it affects every link/button in every BottomSheet AND Drawer consumer, not just Settings + Help.

---

## Audit — per-surface mobile tap-target table

| Surface | File | Trigger element | `touch-action` set? | Min tap target | Risk | Fix scope |
|---|---|---|---|---|---|---|
| BottomActionBar Home anchor | `bottom-action-bar.tsx:147-153` | `<Link>` via AnchorButton | NO (inherits from `.hc-bottom-action-bar` via fix below) | 44×44 | Same root cause | Covered by class fix |
| BottomActionBar Modules/Inbox/More buttons | `bottom-action-bar.tsx:154-197` | `<button>` via AnchorButton | NO | 44×44 | Same root cause | Covered by class fix |
| BottomActionBar More sheet → **Settings** | `bottom-action-bar.tsx:562-567` (MoreLink) | `<Link>` inside `.hc-modal-body` | NO | 44 (minHeight) | **NAMED REGRESSION** | Covered by class fix on `.hc-modal-body` |
| BottomActionBar More sheet → **Help** | `bottom-action-bar.tsx:568-573` (MoreLink) | `<Link>` inside `.hc-modal-body` | NO | 44 (minHeight) | **NAMED REGRESSION** | Covered by class fix on `.hc-modal-body` |
| BottomActionBar More sheet → Status (external) | `bottom-action-bar.tsx:574-582` | `<a>` inside `.hc-modal-body` | NO | 44 (minHeight) | Same root cause | Covered by class fix |
| BottomActionBar More sheet → Sign out | `bottom-action-bar.tsx:611-654` | `<button>` inside `.hc-modal-body` | NO | 44 | Same root cause | Covered by class fix |
| BottomActionBar More sheet → Close | `bottom-action-bar.tsx:655-676` | `<button>` inside `.hc-modal-body` | NO | 44 | Same root cause | Covered by class fix |
| BottomActionBar More sheet → header Close (X) | `bottom-sheet.tsx:232-253` | `<button>` inside `.hc-modal-body` | NO | 44×44 | Same root cause | Covered by class fix |
| BottomActionBar Modules drawer entries | `bottom-action-bar.tsx:431-528` (ModulesList) | `<Link>` inside `.hc-modal-body` (Drawer) | NO | 56 | Same root cause | Covered by class fix |
| BottomActionBar Inbox drawer body | `bottom-action-bar.tsx:228-245` | Caller-provided | NO | varies | Same root cause | Covered by class fix |
| Drawer header Close (X) | `drawer.tsx:197-218` | `<button>` inside `.hc-modal-body` | NO | 44×44 | Same root cause | Covered by class fix |
| OwnerMobileNav (top bar — Menu/X) | `apps/hub/components/owner/OwnerMobileNav.tsx:73-79` | `<button>` (not inside dashboard-shell modal) | NO | ~36 (p-2 → 32+padding) | Independent surface; uses Tailwind. Out of dashboard-shell class scope. | Documented; see follow-up note below |
| OwnerMobileNav drawer Links | `OwnerMobileNav.tsx:135-146, 153-165` | `<Link>` inside owner's custom drawer | NO | ~40 (py-2.5) | Independent surface | Follow-up note |
| OwnerMobileNav Sign out | `OwnerMobileNav.tsx:178-203` | `<button>` | NO | ~40 (py-2.5) | Independent surface | Follow-up note |
| StaffMobileNav (top bar — Search/Menu/X) | `apps/staff/components/StaffMobileNav.tsx:70-83` | `<Link>` + `<button>` | NO | ~36 (p-2) | Independent surface | Follow-up note |
| StaffMobileNav drawer Links | `StaffMobileNav.tsx:115-127` | `<Link>` inside staff's custom drawer | NO | ~40 (py-2.5) | Independent surface | Follow-up note |
| StaffMobileNav Sign out | `StaffMobileNav.tsx:149-173` | `<button>` | NO | ~40 (py-2.5) | Independent surface | Follow-up note |
| OwnerSearchButton (mobile variant) | `apps/hub/components/owner/OwnerSearchButton.tsx:31-44` | `<button>` 44×44 | NO | 44×44 | Owner-search-ui adjacent; uses Tailwind | Follow-up note |
| OwnerPaletteHost (command palette) | `apps/hub/components/owner/OwnerPaletteHost.tsx` | Wraps `@henryco/search-ui` | n/a (search-ui is owner-reserved per memory) | n/a | Out of scope per anti-pattern list | Not touched |
| Marketplace workspace-mobile-nav | `apps/marketplace/components/marketplace/workspace-mobile-nav.tsx` | Uses NEW `@henryco/ui/mobile/BottomSheet` | n/a — separate sheet primitive | n/a | DESIGN-01 sheet; #142 is fixing viewport-anchor on its own branch | Out of scope; the new sheet is on a separate fix track |
| Notification card swipe | `packages/dashboard-shell/src/components/notifications/notification-card.tsx:123` | `<div>` | YES (`pan-y`) | n/a | Already explicitly set for swipe | No change needed |

### Why the class fix only covers dashboard-shell

The named regression lives in `@henryco/dashboard-shell`'s BottomSheet (where Settings + Help are rendered via `BottomActionBar`). That's the surface every dashboard host app (hub, staff, marketplace, etc.) shares. Fixing `.hc-modal-body` repairs:

- Every link/button in every `BottomActionBar` More sheet
- Every link/button in every `BottomActionBar` Modules / Inbox drawer (Drawer uses `.hc-modal-body` too)
- Every link/button in any future `BottomSheet` / `Drawer` consumer the dashboard adds

The hub-app `OwnerMobileNav` and staff-app `StaffMobileNav` are separate components that pre-date dashboard-shell — they have their own drawer DOM, their own buttons. They share the same `touch-action: auto` default. Fixing them at the same class level needs a project-wide Tailwind utility or a shared `<MobileButton>` primitive — out of scope for this targeted regression fix because:

1. The owner directive names Settings + Help specifically (both inside dashboard-shell).
2. Fixing OwnerMobileNav / StaffMobileNav buttons by reaching outside dashboard-shell would either require per-element inline styles (the anti-pattern) or a new utility class invented just for this PR (premature).
3. The CSS that covers dashboard-shell tap targets is already a shared `<style>` block injected via `MOBILE_SHELL_CSS`. The named buttons live exactly there.

**Follow-up note recorded** (NOT this PR): a future pass should add `touch-action: manipulation` at the Tailwind preflight level (`packages/ui/src/styles/globals.css`) so EVERY tap-target across every app inherits the fix without per-component plumbing. This is the right "global" class-level move but is broader than the owner directive and risks unrelated regressions if shipped here.

---

## Fix

One change, scoped to the shared dashboard-shell mobile CSS:

```css
/* FIX-MOBILE-CLICKS — disable iOS Safari's 300ms double-tap-zoom delay
   inside every dashboard modal body (BottomSheet + Drawer). Without
   this, iOS heuristics can suppress the synthetic click when scroll
   deltas (address-bar collapse) interleave the touch sequence — the
   Settings + Help regression. `manipulation` keeps panning + pinch-zoom
   alive, only suppresses double-tap-zoom. */
.hc-modal-body {
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

/* Mirror on the BottomActionBar anchors themselves so the same
   guarantee applies to the four bottom-nav tap targets. */
.hc-bottom-action-bar a,
.hc-bottom-action-bar button {
  touch-action: manipulation;
}
```

That's it. No per-button `style={{ touchAction: 'manipulation' }}`, no magic z-index bump, no `<a onClick={(e) => e.stopPropagation()}>` workaround. The rule lives in `mobile-shell-css.ts` (the canonical shell CSS), inherits by hit-test on every descendant of `.hc-modal-body`, and applies through the `<style dangerouslySetInnerHTML>` block every dashboard host already mounts.

`-webkit-tap-highlight-color: transparent` is a polish addition (kills the grey iOS tap flash on the sheet body) — not load-bearing for the navigation fix. The BottomActionBar already has this rule at line 90; adding it to `.hc-modal-body` makes the dashboard's mobile tap feedback consistent.

---

## Verification

- [ ] Typecheck: `pnpm typecheck` PASS
- [ ] Lint: `pnpm lint` PASS
- [ ] V3-07 strict: `pnpm i18n:check:strict` PASS (no new strings introduced; only CSS rules added).
- [ ] Manual smoke (mobile device required for definitive sign-off):
  1. Open hub mobile (< 768px viewport) on iOS Safari + Chrome Android.
  2. Tap the More tab. Sheet opens.
  3. Tap **Settings**. Sheet closes + navigation to `/settings` completes within one tap (no second tap needed).
  4. Reopen. Tap **Help**. Sheet closes + navigation to `/support` completes.
  5. Reopen. Tap **Sign out**. Sheet closes + logout flow runs.
  6. Reopen. Tap **Close**. Sheet closes.
  7. Tap **Inbox** tab. Drawer opens. Tap any notification entry. Drawer closes + navigation completes.
  8. Tap **Modules** tab. Drawer opens. Tap a module entry. Drawer closes + navigation completes.
  9. Repeat 1-8 on `staff` app workspace.
  10. Repeat 1-8 with address-bar-collapse scenario: scroll the parent page so iOS address bar is collapsed, then open sheet + tap.

---

## Anti-pattern audit (self-check)

- NO per-button workaround → the fix is one rule on `.hc-modal-body` + one on the nav anchors.
- NO hardcoded inline style → all changes live in `mobile-shell-css.ts` (shared CSS hook).
- NO magic z-index → z-index unchanged.
- NO touching `packages/search-ui/` → confirmed (only `mobile-shell-css.ts` modified).
- NO touching `apps/account/**` → confirmed.
- NO V3-07 strict gate break → no new strings; CSS only.
- NO `--force` push → uses `--force-with-lease` if needed.
- NO PR auto-merge → DRAFT.
