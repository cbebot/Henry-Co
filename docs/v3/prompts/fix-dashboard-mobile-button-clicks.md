# FIX-MOBILE-CLICKS — Dashboard mobile button clickability regression

**Pass ID:** FIX-MOBILE-CLICKS
**Phase:** Bug-fix / regression
**Pillar:** P12 (Global UX)
**Dependencies:** #139 (useAndroidBackClose ref fix) already on main; #142 (BottomSheet viewport-anchor) in review
**Effort:** S–M (1 session)
**Parallel-safe:** YES
**Owner gate:** Visual + tap-tested sign-off on mobile device
**Risk class:** None

---

## Role

You are the V3 Regression engineer. Owner directive, verbatim:

> "The dashboard settings button and help button are not responding to clicks on mobile devices. please fix that too. make sure all buttons are clicking. do it with your max effort not just shallow work as we keep lamenting on. don't hardcode anything"

**The bar:** every button + link in every dashboard surface (owner workspace + staff HQ — the surfaces THEME-01 wired) responds reliably to taps on real mobile devices. Settings + Help (in the `BottomActionBar`'s "More" sheet) are the named regression, but the audit must be comprehensive. No hardcoded fixes, no magic numbers, no per-button workarounds — find the root cause + fix the class of bug.

---

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `fix/dashboard-mobile-button-clicks` |
| Worktree (absolute) | `C:/Users/HP VICTUS/HenryCo/.worktree/fix-mobile-clicks` |
| Branch base | `main @ 1768a99d` (Wave B.1 + follow-up PRs all merged: #133–#141; #142 BottomSheet viewport-anchor is in review) |
| OS context | Windows + bash; pnpm 9.15.5; Node 24.x |

Use ABSOLUTE PATHS. For Bash, first call `cd "C:/Users/HP VICTUS/HenryCo/.worktree/fix-mobile-clicks"`. For git, prefer `git -C "<path>" <cmd>`. DO NOT touch the parent repo or sibling worktrees.

---

## Reference (conductor-verified context)

### The named buttons

`packages/dashboard-shell/src/shell/bottom-action-bar.tsx`:
- Line 562–567: Settings `MoreLink` (Next.js `<Link>` rendered via the `MoreSheetBody` inside a `BottomSheet`)
- Line 568–573: Help `MoreLink` (same component, same pattern)
- Both are inside the `BottomSheet` opened by the "More" tab in `BottomActionBar`

The `MoreLink` is a Next.js `<Link>` (or `<a>` for external) with an inline `onClick={onPick}` where `onPick = onItemPick` = `() => setOpenSheet(null)` (closes the sheet after navigation starts).

### The BottomSheet they live inside

`packages/dashboard-shell/src/components/bottom-sheet.tsx` — the OLDER dashboard-shell BottomSheet (NOT DESIGN-01's new `@henryco/ui/mobile/BottomSheet`). V3-09 modified it to:
- Import + call `useAndroidBackClose(open, onClose, { surface: telemetrySurface })` (line 105)
- Wrap backdrop `onClick` in an `emitModalBackdropTap` + `onClose()` (line 131-135)

After PR #139 the `useAndroidBackClose` hook is stable (no self-closing). So the sheet stays open.

The render structure (line 128 onward):
1. Outer backdrop `<div role="presentation" onClick={() => { emitModalBackdropTap(...); onClose(); }} style="position: fixed; inset: 0; z-index: 9000; ...">`
2. Leading focus sentinel (1×1, `pointer-events: none`, top-left)
3. Sheet body `<div ref={sheetRef} role="dialog" onClick={(e) => e.stopPropagation()} className="hc-modal-body" style="...">`
4. Sticky-close header
5. Children (MoreSheetBody → MoreLinks)
6. Trailing focus sentinel

The sheet body **uses `e.stopPropagation()` on its onClick** to prevent taps inside from bubbling to the backdrop.

### Possible regression vectors (rank-ordered by likelihood)

1. **iOS Safari 300ms click delay / double-tap zoom on `<a>` tags inside the sheet.** The `MoreLink` styles set `padding`, `minHeight: 44px`, `textDecoration: none` — but NO `touch-action`. Without `touch-action: manipulation`, mobile Safari can swallow / delay taps under specific conditions.
2. **`onClick={(e) => e.stopPropagation()}` on the sheet body** interacts with React 19's event delegation in ways that can mask synthetic clicks on nested links if the link's onClick is in props (not on the DOM). Verify: when the user taps a Link, does the link's onClick fire? Does Next.js's internal router fire?
3. **Focus sentinels at `position: fixed; top: 0; left: 0; pointer-events: none`** — should NOT capture taps. But verify `pointer-events: none` is actually preserved across all browsers + that no other CSS overrides it.
4. **Stacked z-index / pointer-events conflict** — the BottomActionBar itself sits above content with z-index. If anything renders ABOVE the sheet's z-index 9000 (theme toggle, locale switcher, notification toast viewport), it could intercept taps.
5. **iOS Safari's address-bar-collapse repaint** — when the address bar collapses on scroll, the viewport shifts. If the sheet's `position: fixed` re-layouts, taps mid-layout-shift can land on the wrong element.
6. **`PointerEvent` vs `TouchEvent` listener mismatch** — if any V3-09 hook or BottomActionBar code listens on `touchstart` only (not `pointerdown`/`click`), iOS can preventDefault the click before the `<a>` handler runs.

The investigation MUST verify each hypothesis with code-level evidence (not "I think it's X" — actually trace).

---

## Mandatory scope

### Phase 1 — Investigation (THIS IS WHERE THE THINKING HAPPENS)

Open `packages/dashboard-shell/src/shell/bottom-action-bar.tsx` and `packages/dashboard-shell/src/components/bottom-sheet.tsx`. Walk the event chain from user tap on a Settings link to either:
- (a) Successful navigation to `/settings`, OR
- (b) The bug — link click swallowed, navigation never starts

Trace the following in BOTH the success and failure paths:
- The `onClick` chain: `<Link onClick={onPick}>` → `onPick()` runs → React's onClick handler completes → Next.js Link's internal click handler calls `router.push` → `history.pushState` mutates the URL → BottomSheet re-renders with `open=false` → cleanup runs.
- Whether React's `stopPropagation` on the sheet body interferes with the Link's own onClick OR Next.js's internal click handler.
- Whether `useAndroidBackClose`'s cleanup (which fires when the sheet closes) interacts with the navigation's `pushState` (e.g., does it call `history.back()` immediately AFTER Next.js's `pushState`?).
- The CSS pointer-events / touch-action chain on the link.

Use `git log -p` to see WHAT V3-09 changed in these files. Compare against the pre-V3-09 baseline behavior.

If the bug is reproducible at the code level, write the trace in the report. If reproducibility requires a mobile device, document the symptoms + the most likely root cause + the proposed fix with high confidence.

### Phase 2 — Audit

Beyond Settings + Help, sweep:
- Every `<button>` and `<a>` / `<Link>` rendered inside ANY `BottomSheet` consumer in the dashboard-shell (BottomActionBar, owner mobile nav, staff mobile nav, the new DESIGN-01 BottomSheet consumers in marketplace)
- The owner workspace's mobile chrome (`apps/hub/components/owner/OwnerMobileNav.tsx`)
- The staff HQ's mobile chrome (`apps/staff/components/StaffMobileNav.tsx`)
- The OwnerSearchButton trigger (V3-09 touched it for size)
- The OwnerPaletteHost's command palette (uses dashboard-shell BottomSheet)

Output: `docs/v3/dashboard-mobile-click-audit.md` — per-component table with: surface, trigger pattern, suspected risk, evidence (code reference), fix.

### Phase 3 — Fix

Apply the root-cause fix. The most likely fixes:
- Add `touch-action: manipulation` to `MoreLink` (and any sibling tap-target) to disable the iOS 300ms delay
- Remove `onClick={(e) => e.stopPropagation()}` from the sheet body if it's swallowing nested clicks (alternative: keep stopPropagation but verify React 19 handles it correctly)
- Add explicit `pointerEventsCheck` to ensure focus sentinels truly don't capture taps
- Defer `setOpenSheet(null)` (the close action) to NEXT TICK using `queueMicrotask` or `setTimeout(..., 0)` so the navigation `pushState` runs first, before the BottomSheet cleanup runs

Whatever the fix is, **it must be one root-cause fix, not 5 per-button workarounds**. The owner said "don't hardcode anything" — this means no magic z-index bumps, no per-element `pointer-events: auto` overrides, no inline style hacks. Use semantic CSS / Tailwind utility / shared helper.

### Phase 4 — Verify

- Typecheck PASS for `@henryco/dashboard-shell`, `@henryco/hub`, `@henryco/staff`
- Lint PASS
- V3-07 strict `pnpm i18n:check:strict` PASS (no new GAPs)
- Manual smoke documented (or, if device unreachable, the procedure to run on a real iPhone + Android)

### Phase 5 — DRAFT PR

Commit per logical chunk:
- `FIX-MOBILE-CLICKS(P1): mobile click audit + investigation trace`
- `FIX-MOBILE-CLICKS(P3): root-cause fix for dashboard mobile button clickability`
- `FIX-MOBILE-CLICKS(P4): regression-test additions if applicable`

Push branch + open DRAFT PR. Body lists: named buttons fixed, audit summary, before/after evidence, manual smoke procedure.

Report at `.codex-temp/fix-dashboard-mobile-button-clicks/report.md`.

---

## Anti-patterns (HARD stops)

- **NO per-button workarounds.** Find the root cause that affects the class of bug.
- **NO hardcoded inline-style hacks** (`style={{ touchAction: 'manipulation' }}` on every button is hardcoded). Use a shared utility or CSS class.
- **NO magic z-index bumps** that mask the underlying issue.
- **NO touching `packages/search-ui/`** (owner-reserved).
- **NO touching `apps/account/**`** (customer dashboard, per existing memory).
- **NO breaking V3-07 strict gate.** If you add new strings, they must localize or exempt with reason.
- **NO `git push --force`** (use --force-with-lease only if necessary).
- **NO PR auto-merge.** Owner needs to tap-test on real device.

---

## Self-verification checklist

- [ ] `docs/v3/dashboard-mobile-click-audit.md` lists every dashboard surface's mobile button pattern
- [ ] Root cause identified with code-level evidence
- [ ] Fix applied (semantic, not hardcoded)
- [ ] Settings + Help clickable on the rebuilt component
- [ ] Audit-listed adjacent surfaces verified or fixed
- [ ] Typecheck + lint + i18n:check:strict all PASS
- [ ] DRAFT PR opened with audit + before/after evidence

---

You're Opus 4.7. The owner said "max effort, no shallow work". This isn't a one-line fix — it's a careful investigation of the mobile event chain. Trace the bug, find the root cause, fix the class. Make every dashboard tap-target reliable on every device.
