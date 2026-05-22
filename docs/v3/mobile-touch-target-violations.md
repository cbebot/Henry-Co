# Mobile Touch Target Violations — V3-09 Audit

**Pass:** V3-09 — Foundation: Mobile Consistency (S7)
**Date captured:** 2026-05-22
**Standard:** Apple HIG / WCAG 2.5.5 — interactive elements ≥ 44×44 CSS pixels.

## Method

Searched `apps/**/*.tsx` for `h-9 w-9` and `h-8 w-8` Tailwind utility
classes — the two most common sub-44px box sizes across the platform.
Each match was triaged into one of three classes:

  - **Interactive trigger** (button, anchor, link) — counts as a violation.
  - **Decorative icon container** (status fill, avatar wrapper) — exempt.
  - **Form control with visible padding ≥ 44px around it** — exempt.

The audit yielded **77 raw matches across 54 files**. Decorative
containers (avatars, status badges, toast icons, loader spinners,
icon-only message reactions) account for the majority and are exempt.

## Fixed in V3-09 (6 high-traffic shells)

| File | Line | Trigger | Before | After |
|---|---|---|---|---|
| `apps/marketplace/components/marketplace/workspace-mobile-nav.tsx` | 86 | "Open workspace menu" | `px-3.5 py-2` (~32px tall) | `min-h-[44px] px-4 py-2.5` |
| `apps/marketplace/components/marketplace/workspace-mobile-nav.tsx` | 120 | Close sheet | `h-9 w-9` (36×36) | `h-11 w-11` (44×44) |
| `apps/account/components/notifications/NotificationBell.tsx` | 287 | Bell trigger | `p-2` (~34×34) | `inline-flex h-11 w-11` (44×44) |
| `apps/account/components/layout/Sidebar.tsx` | 74 | Sidebar search Link | `h-9 w-9` | `h-11 w-11` |
| `apps/hub/components/owner/OwnerSearchButton.tsx` | 38 | Hub mobile search trigger | `h-9 w-9` | `h-11 w-11` |
| `apps/staff/components/StaffSidebar.tsx` | 150 | Staff search Link | `h-9 w-9` | `h-11 w-11` |
| `apps/learn/components/learn/site-header-client.tsx` | 78 | Theme toggle | `h-9 w-9` | `h-11 w-11` |

## Remaining interactive triggers below 44×44 (deferred to follow-up)

Spot-checked the remaining 54 file list; the following are known
interactive triggers that should be raised in a future pass. Format
is `file:line — description`. The decorative-only matches (avatars,
status fills, toasts, message-reaction emoji pills) are intentionally
omitted — those do not have user-action affordance.

  - `apps/marketplace/components/marketplace/public-header-client.tsx:?`
    — search trigger in public header.
  - `apps/marketplace/components/marketplace/cart-drawer.tsx:?` —
    qty +/- buttons (`h-9 w-9`) — 3 instances.
  - `apps/marketplace/components/marketplace/cart-experience.tsx:?` —
    qty +/- buttons — 2 instances.
  - `apps/account/components/saved-items/SavedItemsClient.tsx:?` —
    bulk-action toolbar icon buttons — 2 instances.
  - `apps/account/components/saved-items/WelcomeBackSurface.tsx:?` —
    dismiss + share buttons — 3 instances.
  - `apps/account/components/settings/notification-preferences/NotificationPreferencesForm.tsx:?`
    — channel-toggle icon buttons — 3 instances.
  - `apps/studio/components/messaging/message-bubble.tsx:?` — message
    action icon buttons — 2 instances.
  - `apps/studio/components/messaging/context-panel.tsx:?` — context
    side-rail icon buttons — 2 instances.
  - `apps/care/app/(staff)/support/outbox/page.tsx:?` — outbox
    pagination / action buttons.

## Acceptance pattern

Two recommended approaches when adding an interactive icon button:

1. **Direct sizing** — `inline-flex h-11 w-11 items-center justify-center rounded-xl`.
2. **Padded sizing** — when the icon is part of a wider button, ensure
   `min-h-[44px]` (with `inline-flex items-center` so vertical
   alignment looks right).

Visual padding can absorb a small icon: the touch area is the box, not
the icon glyph.

## Out of scope (defer)

  - Desktop-only icon buttons rendered exclusively above lg breakpoints —
    Apple HIG does not apply.
  - Buttons inside `packages/search-ui/` — OWNER-RESERVED.
  - Decorative containers (avatars, status indicators, toast icons).

## Tracking

A follow-up V3 pass (TBD) can sweep the remaining `h-9 w-9` /
`h-8 w-8` interactive triggers. The pattern + acceptance gate are
established in this pass.
