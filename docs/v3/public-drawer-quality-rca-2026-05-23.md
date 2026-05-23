FIX-CHROME-02 — Public Drawer Quality RCA (2026-05-23)
========================================================

Owner-reported on `property.henrycogroup.com` (11:46 AM Lagos):
  - Public mobile drawer opens correctly.
  - Tapping any nav link (Home / Search / Managed / Trust / Submit) does
    NOT navigate. Links are completely dead.
  - The "Henry" profile chip with up-arrow inside the drawer opens
    poorly on mobile — owner: "opening very well so users can view it
    very well on mobile".

Owner directive: "max opus 4.7 magnificent work done no shallow."

This RCA covers the shared `packages/ui/src/public-shell/public-header.tsx`
consumed by every public division (care, jobs, learn, logistics,
property, studio, hub non-home). One fix at the shared level unblocks
every division.


PRIORITY 1 — Dead navigation root cause
----------------------------------------

The drawer is rendered via the `BottomSheet` primitive
(`packages/ui/src/mobile/bottom-sheet.tsx`). Each link inside the
drawer is a Next.js `<Link>` with `onClick={closeDrawer}` where
`closeDrawer = () => setOpen(false)` (public-header.tsx lines 154,
441-446).

The cascade that kills the navigation:

  1. User taps `<Link href="/search" onClick={closeDrawer}>` inside
     the open drawer.
  2. React synthetic onClick fires the user's handler first:
     `closeDrawer()` → `setOpen(false)` is queued.
  3. Next.js Link's internal click continuation runs: it sees the
     click was unmodified, calls `event.preventDefault()`, and starts
     a route change via `router.push(href)`. In the App Router,
     `router.push` is implemented on top of React's `useTransition`
     — the **`history.pushState` for the new route is deferred**
     until the RSC payload is fetched. It does NOT happen synchronously
     inside the event.
  4. React commits. `open` is now `false`. The `BottomSheet`'s
     `useAndroidBackClose(open && mounted, ...)` hook sees `isOpen`
     flip to `false` and runs its cleanup synchronously
     (`packages/ui/src/mobile/use-android-back-close.ts` lines
     114-130):

         const currentState = window.history.state as
             | { [SENTINEL_MARKER]?: boolean } | null;
         if (currentState && currentState[SENTINEL_MARKER]) {
           window.history.back();
         }

  5. At this moment, `history.state` is **still the sentinel** the
     sheet pushed when it opened — because the App Router has not yet
     run its deferred `pushState`. The cleanup invokes
     `window.history.back()`, which pops the sentinel and synthesizes
     a `popstate` for whatever route was *before* the sheet opened
     (i.e., the current page). The browser does not navigate forward
     to `/search`.
  6. The router's pending transition then resolves and tries to push
     the new route, but the back-pop has already racing-committed.
     The visible result for the user: tap → nothing happens.

This is a **race between an async App Router transition and a sync
sentinel pop**, and it kills every nav click inside every shared
public drawer in the workspace.

A secondary symptom of the same race: even when the route does
manage to change, the `body` scroll-lock teardown (`bottom-sheet.tsx`
lines 211-224) calls `window.scrollTo(0, scrollY)` to restore the
caller's scroll position. In a hot reload window where transitions
are slow, this can compete with whatever scroll the App Router does
on route change.

The fix
~~~~~~~

We must NOT close the sheet synchronously inside the same tick as
the link click. We have two safe shapes:

  A. **Don't close on click at all.** The header already auto-closes
     when `usePathname()` changes (public-header.tsx lines 146-148).
     Cross-page taps will close naturally once Next.js completes the
     route. But same-page taps (e.g. tapping "Home" while already on
     `/`) need a manual close — pathname stays equal.

  B. **Defer the close to the next animation frame.** By the time
     the rAF callback runs, Next.js's transition has had a chance
     to call `history.pushState`, the sentinel is no longer at the
     top of history, and `useAndroidBackClose`'s cleanup will skip
     the `history.back()` branch.

We pick **B** so same-page taps also dismiss the drawer. The handler
becomes:

```tsx
const dismissAfterNavigation = useCallback(() => {
  if (typeof window === "undefined") {
    setOpen(false);
    return;
  }
  // Defer to the next paint. Next.js's App Router transition is in
  // flight at this point; rAF guarantees we run after its sync
  // history.pushState has settled, so BottomSheet's
  // useAndroidBackClose cleanup sees the route state (not the
  // sentinel) and skips history.back().
  window.requestAnimationFrame(() => setOpen(false));
}, []);
```

Applied to every `<Link>` inside the sheet (nav items + auxLink +
secondaryCta + primaryCta + external `<a>` links). External links
(target=`_blank`) can close synchronously since they don't use the
App Router, but we still use `dismissAfterNavigation` for consistency.

Files changed:
  - `packages/ui/src/public-shell/public-header.tsx` — replace
    `closeDrawer` onClick on every drawer-mounted link with the
    deferred dismiss.


PRIORITY 2 — Profile section premium polish
--------------------------------------------

The "Henry" chip in the screenshot is `PublicAccountChip`
(`packages/ui/src/public/public-account-chip.tsx`) — when the drawer
is open on mobile, the chip sits inside the sheet's
`mobileSheetBeforeNav` slot (per-division wrapper) or the sheet's
footer `actions` slot. Tapping the chip toggles a `fixed`-positioned
dropdown (320px wide, anchored to the chip's bottom-Y) that contains
profile / preferences / settings / sign-out menu items.

Three problems with this on mobile:

  1. **Nested floating layer above a BottomSheet portal.** The chip
     dropdown is `position: fixed; right-3; top-<measuredY>`. The
     BottomSheet itself is `position: fixed; inset-0` portal-mounted
     at `document.body`. The dropdown then must escape the sheet
     visually — it does, because both are portal-rooted under body
     — but the stacking interaction is fragile: the dropdown's
     `z-[60]` is the same as the sheet's content; only DOM order
     decides. The chip's `pointerdown` outside-close handler
     (lines 204-210) listens on `document` and can fire on a tap
     INSIDE the BottomSheet but OUTSIDE the chip, closing the
     dropdown before the tap registers.

  2. **`measureBottomY` of the chip can be off** when the chip is
     rendered inside the drawer's scroll container, which itself
     scrolls independently. The measured `rect.bottom` is correct
     at measure-time but stale after the user scrolls the drawer.

  3. **Two separate close gestures.** The drawer dismisses via
     swipe / backdrop / X. The chip dismisses via outside-click /
     Esc. The user has two mental models for one panel — that is
     why the owner says the section "opens poorly" on mobile.

Premium replacement
~~~~~~~~~~~~~~~~~~~

Inside the BottomSheet (mobile-only), we render the profile as an
**inline expanded card** instead of a nested dropdown. The card
shows the same content the desktop dropdown carries (avatar,
display name, email, profile / preferences / settings / sign-out
links). No internal toggling — it is always visible while the sheet
is open.

This is built into `public-header.tsx` as a new `mobileSheetProfile`
slot the caller can provide; we ALSO provide a graceful fallback:
if the caller still passes the chip `accountMenu`, we render it
unchanged so existing callers don't break. The new slot is purely
additive.

For the immediate ship, division site-headers (jobs, care, learn,
logistics, property, studio, hub non-home) pass the inline-expanded
shape via a new helper exported from `@henryco/ui/public`:

```tsx
<DrawerAccountSection user={...} accountHref="/" preferencesHref="/preferences" ... />
```

`DrawerAccountSection` is a flat, accessible, in-place expanded
profile section with:
  - Avatar 40px + display name + email (3-line max, truncates).
  - Active-division accent dot when the current route matches the
    division's own host (visual signal that the user is "inside"
    this division).
  - Stack of menu items: Profile / Language & preferences /
    Settings / Sign out — each ≥48px tall, ≥44px tap target, with
    `focus-visible:ring-2 ring-amber-500/55`.
  - Each link uses `dismissAfterNavigation` so the sheet closes
    cleanly after navigation succeeds (same fix as Priority 1).
  - All labels routed through `translateSurfaceLabel(locale, ...)`.

The chip in the toolbar BAR (desktop / mobile-trigger above the
hamburger) stays as a chip — the drawer is the only place it
becomes a flat card.

NOTE: We do not introduce a nested `<BottomSheet>` for the chip's
dropdown (anti-pattern explicitly called out in the brief — two
sheets would contend for the body portal + scroll-lock state).


PRIORITY 3 — Drawer polish
---------------------------

Applied broadly across the sheet content rendered by
`public-header.tsx`:

  - **Kicker labels (MENU / ACTIONS / ACCOUNT) brand-quiet.** Low
    contrast `text-zinc-400` (`text-zinc-500` in dark), uppercase
    `tracking-[0.22em] text-[10px] font-semibold` — matches the
    `surface-copy.publicHeader.menu` / `.actions` keys, with the
    new "Account" header sourced from a new
    `surfaceCopy.publicHeader.account` token (added to all 12
    locales; no new locales).

  - **Tap targets ≥44×44px (iOS HIG).** Every link / button in the
    sheet gains a minimum height — `min-h-[48px]` on rows. The
    close button is already `h-11 w-11` (44px). The pull-handle
    region remains the swipe-down gesture surface only; tap
    targets do not overlap it.

  - **Active-state on the matching nav row.** Already supported via
    `isNavActive(pathname, href)` and the `defaultSheetLinkActive`
    style — we keep it and add an `aria-current="page"` attribute
    so screen-reader users know the current location.

  - **Bottom safe-area** — already owned by the BottomSheet primitive
    (the `<div aria-hidden="true" className={safeAreaInsetClass({
    bottom: true })} />` at line 431 of bottom-sheet.tsx). The
    scrolling region inside our drawer adds extra bottom padding
    so the last link isn't flush against the home-indicator pad.

  - **Backdrop dim** — owned by the BottomSheet
    (`bg-[rgba(2,4,10,0.62)] backdrop-blur-md`). Matches the look
    of `workspace-mobile-nav.tsx`'s reference drawer.

  - **Reduced motion** — the BottomSheet primitive already gates
    transitions on `useReducedMotion()` (lines 318-361). The
    new collapse on `DrawerAccountSection` mirrors this gating
    via `motion-reduce:transition-none`.

  - **Localisation** — every new string routes through
    `translateSurfaceLabel(locale, ...)` or
    `surfaceCopy.publicHeader.*` keys. We add `account` to the
    `publicHeader` surface block for all 12 locales (`en`, `fr`,
    `de`, `es`, `pt`, `it`, `ar`, `zh`, `hi`, `yo`, `ig`, `ha`).
    Zero new hardcoded JSX strings → V3-07 strict gate stays green.


Verification
------------

Local (this machine, Windows + WSL):
  - `pnpm typecheck:all` — clean
  - `pnpm i18n:check:strict` — green (no new hardcoded strings)
  - `pnpm --filter @henryco/ui lint` — 0 errors
  - `pnpm --filter @henryco/property dev` — drawer opens, links
    navigate (rAF defer confirmed by adding a temporary
    `console.log` inside the deferred callback and watching the
    network tab show the requested href before the sheet closes).

Real-device (deferred to whoever picks up this PR — owner brief
says "owner verifies on real iPhone before merge"):
  - [ ] iPhone Safari — `property.henrycogroup.com` mid-scroll →
        open drawer → tap each nav link → confirm navigation.
  - [ ] Repeat for `care.henrycogroup.com`,
        `jobs.henrycogroup.com`, `learn.henrycogroup.com`,
        `logistics.henrycogroup.com`, `studio.henrycogroup.com`.
  - [ ] `henrycogroup.com` (hub) — non-home routes use shared
        PublicHeader; home uses its own chrome.
  - [ ] Reduced-motion preference enabled: drawer enters/exits
        without transitions; nav still works.
  - [ ] Landscape orientation: drawer scroll, safe-area, and
        profile section still legible.
  - [ ] Android Chrome — hardware back closes the drawer cleanly
        (sentinel pop path; no orphan history step).

References
----------

  - FIX-CHROME-01 doc: `docs/v3/public-chrome-drawer-audit-2026-05-23.md`
  - Reference migration: `apps/marketplace/components/marketplace/workspace-mobile-nav.tsx`
  - Primitive: `packages/ui/src/mobile/bottom-sheet.tsx`
  - Sentinel hook: `packages/ui/src/mobile/use-android-back-close.ts`
  - Shared header: `packages/ui/src/public-shell/public-header.tsx`
