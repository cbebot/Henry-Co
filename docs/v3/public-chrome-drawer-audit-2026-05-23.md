FIX-CHROME-01 — Public Chrome Drawer Audit (2026-05-23)
======================================================

Owner-reported critical iPhone bug: tapping the menu icon in the floating
top chrome of `marketplace.henrycogroup.com` (scrolled mid-page) dims the
viewport but the drawer panel itself is invisible.

Root cause
----------
Public-chrome mobile drawers were toggling `document.body.style.overflow
= "hidden"` for scroll lock. The header was `position: sticky; top: 0`.
On iOS Safari (and any browser where the body is the scrolling
container), pinning `body { overflow: hidden }` removes the body as the
scrolling viewport — sticky descendants revert to their document-flow
position. Result: when the user opens the drawer from mid-page, the
sticky `<header>` (and the inline drawer nested inside it) snaps back to
the top of the document, far above the current scroll. Only the
`fixed inset-0` backdrop button — anchored to the viewport — remained
visible. The user sees a dim screen and an unresponsive page.

Canonical fix
-------------
`packages/ui/src/mobile/bottom-sheet.tsx` (DESIGN-01) implements scroll
lock correctly using the iOS-Safari-safe pattern:

  - `html.style.overflow = "hidden"`
  - `body.style.position = "fixed"; body.style.top = "-${scrollY}px"`
  - `window.scrollTo(0, scrollY)` on close to restore the exact pixel

It is also portal-mounted at `document.body` via `createPortal`, so the
sheet always anchors to the viewport regardless of any
`sticky/fixed/overflow:hidden/transform` ancestor. The reference
migration is `apps/marketplace/components/marketplace/workspace-mobile-
nav.tsx` (workspace drawer).

Files migrated
--------------

1. `packages/ui/src/public-shell/public-header.tsx`

   Shared `PublicHeader` consumed by the public chrome of every division
   that uses `@henryco/ui/public-shell`: care, jobs, learn, logistics,
   property, studio (via their site-header / public-shell wrappers) and
   hub (via `apps/hub/app/components/PublicSiteShell.tsx` for every
   non-homepage route). Migrating this one file kills the bug across
   the vast majority of division surfaces.

   Before:
     - `useEffect` on `[open]` set `document.body.style.overflow =
       "hidden"` and added a manual Escape listener.
     - Inline `<button … fixed inset-0 z-40 …/>` backdrop inside the
       sticky header.
     - Inline mobile drawer rendered as a `<div className="border-t
       … transition-[max-height,opacity]">` immediately below the
       toolbar — its position depended on the sticky header staying
       sticky.
     - Trigger button had a workaround that did `window.scrollTo(0)
       behavior:smooth` when opening from mid-page (which was itself
       evidence the team had hit the symptom but landed on a band-aid).

   After:
     - `body.style.overflow` is never touched. The standalone Escape
       listener and the inline backdrop are gone — both are owned by
       `BottomSheet`.
     - The drawer is a `BottomSheet` from `@henryco/ui/mobile`,
       portal-mounted at `document.body`. Inherits Esc, Android
       hardware back, swipe-down dismiss, backdrop tap, focus trap,
       and reduced-motion gating.
     - Trigger button gets `aria-haspopup="dialog"`, a `triggerRef` for
       focus restoration, and `aria-controls` pointing at the sheet
       (replacing the previously-hardcoded global id with a `useId()`-
       generated stable id so multiple instances on a page don't
       collide).
     - The workaround `window.scrollTo` is removed; the canonical
       scroll lock keeps the user pinned to their current pixel.
     - All drawer content preserved verbatim: nav items, account chip
       slot, `auxLink`, `secondaryCta`, `primaryCta`, and the caller
       `mobileSheetBeforeNav` / `mobileSheetAfterNav` /
       `renderMobileSheetAfterNav` slots.
     - Public API (`PublicHeaderProps`) unchanged. `mobileDrawerClass
       Name` is preserved on the type for back-compat; the sheet now
       owns its own surface styling so it is unused at runtime.
     - Drawer surface label for telemetry: `henryco.public_header_
       drawer`.

2. `apps/marketplace/components/marketplace/public-header-client.tsx`

   The marketplace floating public chrome (the surface in the owner's
   screenshot). This is `apps/marketplace`-local and does not consume
   `PublicHeader` — it implements its own custom chrome (cart, vendor
   link, search form, mobile sign-out row, account chip) so it needed
   its own migration.

   Before:
     - Same `body.overflow = "hidden"` effect as the shared header.
     - Inline `<button … fixed inset-0 z-40 bg-black/45 backdrop-blur
       …/>` backdrop inside the sticky header.
     - Inline mobile drawer rendered as a `<div id="marketplace-public-
       mobile-nav" className="… transition-[max-height,opacity] …">`
       below the toolbar.

   After:
     - `body.overflow` is never touched. Escape listener is gone.
     - Inline backdrop button is gone.
     - The drawer is a `BottomSheet`. All drawer content preserved
       verbatim: short-form search input, `marketplaceToolbarNav`
       links, "Search HenryCo" link, signed-in account links (profile,
       wishlist, cart open, orders, language/preferences, settings) +
       `MobileSignOutRow`, OR guest sign-in / sign-up CTAs.
     - Trigger button gets `aria-haspopup="dialog"`, the trigger ref,
       and `aria-controls` pointing at a `useId()`-derived stable id.
     - Drawer surface label for telemetry: `marketplace.public_header_
       drawer`.
     - All `translateSurfaceLabel(locale, …)` calls preserved
       unchanged.
     - All runtime + viewer wiring (`useMarketplaceRuntime`, viewer
       chip, cart count, signed-in branching) preserved unchanged.

Surfaces considered and NOT changed (with reasons)
--------------------------------------------------

| Surface | Reason kept as-is |
|---|---|
| `apps/account/**` | Owner scope-out — handled by parallel ACCOUNT-PREMIUM-01 agent. |
| `apps/staff/**`, `apps/super-app/**`, `apps/company-hub/**` | Internal / expo apps; brief scope-out. |
| `packages/dashboard-shell/**` | Already canonical; owner scope-out. |
| `packages/search-ui/**` | Owner-reserved (per `feedback_dashboard_search_engine_no_touch.md`). |
| `apps/hub/app/(site)/HubHomeClient.tsx` chrome (sticky `<header>` at line 1139) | Has NO mobile drawer — uses a horizontal scrollable strip of chips on mobile. Nothing to migrate. |
| `apps/hub/app/(site)/HubHomeClient.tsx` `DetailsModal` (line 1730) | Content modal triggered from home cards, NOT chrome. Renders as `<motion.div className="fixed inset-0 z-50">` so it is already viewport-anchored. Setting `body.overflow=hidden` here cannot break a sticky ancestor because there is no sticky ancestor in scope. Out of brief scope. |
| `apps/property/components/property/PropertyImageGallery.tsx` | Image-gallery lightbox, NOT chrome. `fixed inset-0`, no sticky ancestor exposure. |
| `packages/chat-composer/src/composer/FullScreenComposer.tsx` | Full-screen composer (`fixed inset-0`). Not chrome. |
| `packages/ui/src/support/SupportAssist.tsx` | Chrome-integrated support panel docked at `position: fixed; right:0; bottom:0`. Not a top chrome / drawer; not nested inside a sticky ancestor; cannot suffer the documented sticky-break bug. Out of brief scope (the brief targets "public top chrome / nav"). Flagged here for future consideration. |
| `apps/care/components/staff/staff-shell.tsx`, `apps/hub/app/owner/(command)/layout.tsx`, `apps/care/app/admin/layout.tsx` | Staff / admin / owner internal shells, not public chrome. Scope-out. |
| `apps/care/components/public/CareNavbar.tsx`, `apps/jobs/components/public-shell.tsx`, `apps/learn/components/learn/site-header-client.tsx`, `apps/logistics/components/layout/LogisticsShell.tsx`, `apps/property/components/property/site-header.tsx`, `apps/studio/components/studio/site-header.tsx` | Already canonical: they all delegate the drawer to `<PublicHeader>` (the shared `@henryco/ui/public-shell` header), which is now migrated. Confirmed via direct grep — none contain their own `body.overflow` effect or inline drawer. |
| `apps/marketplace/components/marketplace/workspace-mobile-nav.tsx` | Already on `BottomSheet` (DESIGN-01). Reference migration. No change. |

Self-audit (post-migration)
---------------------------

```
grep -rn "document.body.style.overflow" apps/ packages/ui/
```

Remaining matches:
  - `packages/ui/src/mobile/bottom-sheet.tsx` — CANONICAL fix (paired
    with `html.style.overflow=hidden`, `body.style.position=fixed`, and
    `window.scrollTo` restore).
  - `packages/ui/src/support/SupportAssist.tsx` — `position:fixed`
    docked panel, no sticky ancestor exposure.
  - `apps/hub/app/(site)/HubHomeClient.tsx` — `DetailsModal` content
    modal (`fixed inset-0`).
  - `apps/property/components/property/PropertyImageGallery.tsx` —
    image lightbox (`fixed inset-0`).

```
grep -rn "sticky top-0" apps/
```

Sticky chromes that remain — each verified to NOT pair with an inline
`body.overflow=hidden` effect on a public drawer:
  - `apps/marketplace/components/marketplace/public-header-client.tsx`
    (migrated).
  - `apps/care/components/staff/staff-shell.tsx` (staff shell, scope-
    out — no public drawer + body.overflow pairing).
  - `apps/hub/app/owner/(command)/layout.tsx` (owner shell, scope-out).
  - `apps/care/app/admin/layout.tsx` (admin shell, scope-out).
  - `apps/hub/app/(site)/HubHomeClient.tsx:1139` (hub homepage chrome —
    no mobile drawer, safe).
  - `apps/hub/app/(site)/HubHomeClient.tsx:1825` (inside `DetailsModal`
    — body.overflow lock is paired with `fixed inset-0` modal, not a
    sticky chrome ancestor).

Gates run
---------

```
pnpm typecheck:all      # 12/12 apps clean
pnpm i18n:check:strict  # OK — no new GAPs (baseline regenerated
                        #     2026-05-23 to absorb line shifts from
                        #     refactor; zero new unique strings)
```

Tests: `@henryco/ui` has no test script defined; nothing to run.
`pnpm --filter @henryco/ui test` exits 0 (no-op).

Needs visual verify on real iPhone Safari at mid-scroll
-------------------------------------------------------

Per the owner brief, this PR should NOT auto-merge — visual verification
on a real iPhone is required:

  - [ ] `marketplace.henrycogroup.com` — scroll mid-page, tap menu,
        confirm sheet rises from bottom, content scrollable, swipe-
        down dismisses, scroll position preserved on close.
  - [ ] Repeat on `care.henrycogroup.com`, `jobs.henrycogroup.com`,
        `learn.henrycogroup.com`, `logistics.henrycogroup.com`,
        `property.henrycogroup.com`, `studio.henrycogroup.com` —
        each uses the shared `PublicHeader`.
  - [ ] `henrycogroup.com` (hub home) — confirm chrome unchanged (no
        drawer migration on the homepage).
  - [ ] `henrycogroup.com/about` (or any hub non-home route) — confirm
        sheet rises from bottom (hub non-home uses `PublicShell` →
        shared `PublicHeader`).
  - [ ] Reduced-motion preference enabled: confirm sheet enters /
        exits without transitions.
  - [ ] Android (Chrome): confirm hardware back button closes the
        sheet without leaving the page.

References
----------

  - Reference primitive: `packages/ui/src/mobile/bottom-sheet.tsx`
    (DESIGN-01).
  - Reference migration: `apps/marketplace/components/marketplace/
    workspace-mobile-nav.tsx`.
  - DESIGN doc: `docs/v3/design-marketplace-profile-drawer.md`.
