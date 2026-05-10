# PASS 25 — Typography Tone Refinement

**Date**: 2026-05-10
**Branch**: `feat/dash-08-owner-track-b`
**Scope**: User dashboard (`apps/account`), owner dashboard (`apps/hub/app/owner`, `apps/hub/components/owner`), staff dashboard (`apps/staff`).
**Inheritance**: Pass 19 type scale (no scale changes).
**Constraint honored**: Currency rendering left untouched everywhere it appears.

---

## 1. Weight occurrence map (before)

48 `font-bold` occurrences across the in-scope dashboards. Zero `font-extrabold` / `font-black`. The `dashboard-shell` and `dashboard-modules-*` packages were already clean (0 occurrences) — every leak was at the per-app surface layer.

| Surface | File | Occurrences | Pattern |
|---|---|---|---|
| User | `apps/account/app/(account)/referrals/page.tsx` | 9 | 4 KPI counts + 2 currency rewards + 3 step-number circles |
| User | `apps/account/components/divisions/CareBookingsDashboard.tsx` | 2 | Metric value (count-or-currency) + h2 service title |
| User | `apps/account/components/layout/UserAvatar.tsx` | 1 | Avatar initials |
| User | `apps/account/components/notifications/NotificationBell.tsx` | 2 | Source initial badge + bell unread-count chip |
| User | `apps/account/components/notifications/NotificationFeed.tsx` | 1 | Division initial badge |
| User | `apps/account/components/notifications/NotificationsFeed.tsx` | 1 | Source initial badge |
| User | `apps/account/components/notifications/RecentlyDeletedFeed.tsx` | 1 | Source initial badge |
| User | `apps/account/components/referral/CopyReferralCode.tsx` | 1 | Mono referral-code display |
| User | `apps/account/app/(account)/activity/page.tsx` | 1 | Division initial badge |
| User | `apps/account/app/(account)/invoices/page.tsx` | 1 | Division initial badge |
| User | `apps/account/app/(account)/subscriptions/page.tsx` | 1 | Division initial badge |
| User | `apps/account/app/(account)/messages/notification/[id]/page.tsx` | 1 | Source initial badge |
| Owner | `apps/hub/app/owner/(command)/staff/users/[id]/page.tsx` | 5 | Eyebrow labels (Display name, Email, Division, Activity, Technical user id) |
| Owner | `apps/hub/app/owner/(command)/staff/tree/page.tsx` | 2 | Eyebrow labels (Root, Division branch) |
| Owner | `apps/hub/app/owner/(command)/ai/page.tsx` | 5 | 4 metric eyebrows + 1 severity status pill |
| Owner | `apps/hub/components/owner/OwnerSidebar.tsx` | 2 | "Command Center" eyebrow + initials avatar |
| Owner | `apps/hub/components/owner/OwnerMobileNav.tsx` | 2 | "CMD" eyebrow + initials avatar |
| Owner | `apps/hub/components/owner/InternalTeamCommsClient.tsx` | 1 | Unread "new" chip |
| Owner | `apps/hub/components/owner/MetricCard.tsx` | 1 | Metric value (count-or-currency, shared component) |
| Staff | `apps/staff/components/StaffSidebar.tsx` | 5 | "div" chip + count badge + brand monogram + "Staff HQ" eyebrow + initials |
| Staff | `apps/staff/components/StaffMobileNav.tsx` | 3 | Brand monogram + "Staff" eyebrow + initials |

**Pattern summary** (Pass 25 violations):
- **Eyebrow labels** stacked at `font-bold` instead of `font-semibold` (Pass 19 `eyebrow` token = 600). 16 occurrences.
- **Initials/avatars/monograms** at `font-bold` where `font-semibold` reads as confident, not shouty. 13 occurrences.
- **Status pills / chips / count badges** at `font-bold` against the prompt's "Status pills: medium" rule. 5 occurrences.
- **Counts at `text-2xl font-bold`** doing two heavy-weight signals at once (size + bold) — the scale was already carrying authority. 4 occurrences.
- **One `<h2>` heading** at `text-2xl font-bold` — heading-stack-of-two-bolds pattern with the kicker above. 1 occurrence.
- **One mono code display** at `font-bold` — already mono-spaced + tracking-wider doing the work. 1 occurrence.

---

## 2. Replacements applied

### Across the board: `font-bold` → `font-semibold` on labels, badges, pills, eyebrows, initials

The general move: where a small surface (eyebrow, chip, initial) was `font-bold`, drop to `font-semibold` (Pass 19 `eyebrow`/`label` weight = 600). The hierarchy now reads: page title (h1, 700) → section header (h2, 600) → label/eyebrow (semibold) — three bold steps maximum, never four.

### Per-file changes (44 of 48 occurrences refined; 4 currency-touching lines preserved)

**User dashboard (`apps/account`)** — 18 of 22 occurrences refined:
- `referrals/page.tsx`: 4 count cells switched to `hc-mono text-2xl font-semibold` (size carries authority, mono brings tabular-nums alignment per Pass 19 §1). 3 step-number circles → semibold. **Currency lines 125 and 133 preserved as-is**.
- `CareBookingsDashboard.tsx`: `<h2 text-2xl font-bold>` → `<h2 text-2xl font-semibold>` (matches Pass 19 `h2` weight = 600). **Metric value line 372 preserved** (can render currency).
- `UserAvatar.tsx`, `NotificationBell.tsx` (×2), `NotificationFeed.tsx`, `NotificationsFeed.tsx`, `RecentlyDeletedFeed.tsx`, `activity/page.tsx`, `invoices/page.tsx`, `subscriptions/page.tsx`, `messages/notification/[id]/page.tsx`: all initials/badges → `font-semibold`.
- `CopyReferralCode.tsx`: mono code display → `font-semibold` (mono + tracking-wider do the readability work).

**Owner dashboard (`apps/hub`)** — 17 of 18 occurrences refined:
- `staff/users/[id]/page.tsx`: 5 eyebrow labels → `font-semibold`.
- `staff/tree/page.tsx`: 2 eyebrow labels → `font-semibold`.
- `ai/page.tsx`: 4 metric eyebrows → `font-semibold` (sized at `text-[10px]`, the bold was screaming). 1 severity status pill → `font-semibold` (per "Status pills: medium").
- `OwnerSidebar.tsx`: "Command Center" eyebrow + footer initials → `font-semibold`.
- `OwnerMobileNav.tsx`: "CMD" eyebrow + drawer initials → `font-semibold`.
- `InternalTeamCommsClient.tsx`: unread "X new" chip → `font-semibold tabular-nums` (tabular-nums added because it's a count).
- **MetricCard.tsx line 27 preserved** (shared component renders both counts and currency via `formatCurrencyAmount`).

**Staff dashboard (`apps/staff`)** — 8 of 8 occurrences refined:
- `StaffSidebar.tsx`: "div" chip, count badge (added `tabular-nums`), brand monogram, "Staff HQ" eyebrow, footer initials — all → `font-semibold`.
- `StaffMobileNav.tsx`: brand monogram, "Staff" eyebrow, drawer initials — all → `font-semibold`.

### Currency rendering preserved (4 lines untouched)

These four lines still render `text-2xl font-bold` because each one displays (or can display) a currency amount and the prompt is explicit: "currency rendering is loved and must not change":
- `apps/account/app/(account)/referrals/page.tsx:125` — `formatNaira(stats.pendingRewards)`
- `apps/account/app/(account)/referrals/page.tsx:133` — `formatNaira(stats.paidRewards)`
- `apps/account/components/divisions/CareBookingsDashboard.tsx:372` — `metric.value` (the balance metric flows `formatCurrencyAmount`)
- `apps/hub/components/owner/MetricCard.tsx:27` — shared component used for "Recognized revenue" via `formatCurrencyAmount` alongside count metrics

---

## 3. Rhythm check

Walked each affected page mentally against the Pass 25 reading-priority test (h1 → h2 → body lands naturally):

- **Owner command home** (`/owner`): page title via `OwnerPrimitives` (`text-3xl font-semibold`) ✓, MetricCard labels are kicker-style semibold ✓, MetricCard values still bold (currency-protected) — single anchor weight per card, no double-bold stack.
- **Owner AI briefing** (`/owner/ai`): `text-lg font-semibold` headline → semibold metric eyebrows → semibold metric values (already correct upstream) → semibold severity pills. Three weights total: regular body, semibold labels, no bold competing with the page title. Calm.
- **Owner staff tree / member detail**: eyebrows now whisper instead of shout; the labels (Display name, Email, etc.) carry their identity through tracking + uppercase, not weight.
- **User referrals page**: eyebrows + counts now a single-step-down from card padding, currency reward lines stay anchored as the heaviest type on the page (intentional per prompt).
- **User Care bookings dashboard**: the `<h2>` service title now sits at semibold below the gold kicker — same weight as the chips, but size and color do the hierarchy. No more "wall of bold" around the selected booking card.
- **User notification feeds, activity, invoices, subscriptions**: division-initial avatars no longer compete with the body sentence next to them. The avatar is identity, the sentence is content; weights now reflect that.
- **Staff/Owner sidebars + mobile nav**: brand monograms read as confident marks, not as "look at me" buttons. Section eyebrows recede into the chrome.
- **Long content** (support threads, documents): no changes needed — those surfaces already use `body` weight = 400 from Pass 19.

No card looks like a wall of bold anymore. The four preserved currency lines are now the *intentional* heaviest typography on their pages — exactly the editorial calm the owner asked for: money speaks loudest, everything else converses.

---

## 4. Untouched-by-design

- **Pass 19 type scale**: `packages/ui/src/styles/globals.css` and `packages/dashboard-shell/src/tokens/type.ts` not modified. All `.hc-h1` … `.hc-eyebrow` / `.hc-mono` definitions unchanged.
- **Currency rendering**: 4 currency-touching lines preserved verbatim. `hc-mono` token unchanged. `formatCurrencyAmount`, `formatNaira` unchanged.
- **Font family**: no change to `--font-inter`, `--font-source-serif`, `--hc-font-mono`, or any `next/font` host config.
- **Color tokens**: none changed.

---

## 5. Validation

Re-run after the original session hibernated mid-validation (resumed 2026-05-10):

| Check | Result |
|---|---|
| `pnpm --filter @henryco/account run lint` | ✓ Passes (1 pre-existing unused-import warning in `SmartHomeHeader.tsx` — unrelated) |
| `pnpm --filter @henryco/staff run lint` | ✓ Passes |
| `pnpm --filter @henryco/hub run lint` | ✓ Passes |
| `pnpm --filter @henryco/account run typecheck` | ✓ Passes |
| `pnpm --filter @henryco/staff run typecheck` | ✓ Passes |
| `pnpm --filter @henryco/hub run typecheck` | ✓ Passes |
| `pnpm --filter @henryco/account run build` | ✓ Builds clean |
| `pnpm --filter @henryco/staff run build` | ✓ Builds clean |
| `pnpm --filter @henryco/hub run build` | ✓ Builds clean |
| Post-edit grep for `font-bold\|font-extrabold\|font-black` in scope | ✓ Only the 4 preserved currency lines remain (referrals ×2, CareBookingsDashboard, owner MetricCard) |

Visual verification in light + dark and live deploy IDs are pending the next CI/Vercel cycle once the changes land in `main` — preview deployments are owner-triggered for this branch.

---

## 6. Files changed (PASS 25 only)

20 files touched by PASS 25. (The diff also lists `apps/account/app/api/cron/notification-email-fallback/route.ts`, `apps/account/app/api/documents/[type]/[id]/route.ts`, `apps/account/lib/email/templates.ts`, `apps/hub/components/owner/InviteStaffForm.tsx`, `apps/staff/app/(workspace)/operations/newsletter/NewsletterDraftEditor.tsx` — these are from a separate parallel session working on email/branding and are **not** part of PASS 25.)

```
apps/account/app/(account)/activity/page.tsx
apps/account/app/(account)/invoices/page.tsx
apps/account/app/(account)/messages/notification/[id]/page.tsx
apps/account/app/(account)/referrals/page.tsx
apps/account/app/(account)/subscriptions/page.tsx
apps/account/components/divisions/CareBookingsDashboard.tsx
apps/account/components/layout/UserAvatar.tsx
apps/account/components/notifications/NotificationBell.tsx
apps/account/components/notifications/NotificationFeed.tsx
apps/account/components/notifications/NotificationsFeed.tsx
apps/account/components/notifications/RecentlyDeletedFeed.tsx
apps/account/components/referral/CopyReferralCode.tsx
apps/hub/app/owner/(command)/ai/page.tsx
apps/hub/app/owner/(command)/staff/tree/page.tsx
apps/hub/app/owner/(command)/staff/users/[id]/page.tsx
apps/hub/components/owner/InternalTeamCommsClient.tsx
apps/hub/components/owner/OwnerMobileNav.tsx
apps/hub/components/owner/OwnerSidebar.tsx
apps/staff/components/StaffMobileNav.tsx
apps/staff/components/StaffSidebar.tsx
```
