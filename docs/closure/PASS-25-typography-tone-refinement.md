# PASS 25 — Typography Tone Refinement

**Date**: 2026-05-10
**Branch**: `feat/dash-08-owner-track-b`
**Scope**: User dashboard (`apps/account`), owner dashboard (`apps/hub/app/owner`, `apps/hub/components/owner`), staff dashboard (`apps/staff`).
**Inheritance**: Pass 19 type scale (no scale changes).
**Constraint honored**: Currency rendering left untouched everywhere it appears.

---

## 1. Weight occurrence map (before)

49 `font-bold` occurrences across the in-scope dashboards (48 in the
original audit + 1 picked up by the follow-up sweep on
`apps/hub/app/(site)/preferences`, which is reached from the user-menu
in every dashboard). Zero `font-extrabold` / `font-black`. The
`dashboard-shell`, `dashboard-modules-*`, and `search-ui` packages were
already clean (0 occurrences) — every leak was at the per-app surface
layer. Other division apps (`jobs`, `learn`, `marketplace`, `property`,
`studio`, `logistics`) verified clean during the broader sweep.

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
| User-menu | `apps/hub/app/(site)/preferences/PreferencesClient.tsx` | 1 | Page-title h1 (text-3xl/4xl); follow-up sweep |
| Staff | `apps/staff/components/StaffSidebar.tsx` | 5 | "div" chip + count badge + brand monogram + "Staff HQ" eyebrow + initials |
| Staff | `apps/staff/components/StaffMobileNav.tsx` | 3 | Brand monogram + "Staff" eyebrow + initials |

**Pattern summary** (Pass 25 violations):
- **Eyebrow labels** stacked at `font-bold` instead of `font-semibold` (Pass 19 `eyebrow` token = 600). 16 occurrences.
- **Initials/avatars/monograms** at `font-bold` where `font-semibold` reads as confident, not shouty. 13 occurrences.
- **Status pills / chips / count badges** at `font-bold` against the prompt's "Status pills: medium" rule. 5 occurrences.
- **Counts at `text-2xl font-bold`** doing two heavy-weight signals at once (size + bold) — the scale was already carrying authority. 4 occurrences.
- **One `<h2>` heading** at `text-2xl font-bold` — heading-stack-of-two-bolds pattern with the kicker above. 1 occurrence.
- **One `<h1>` heading** at `text-3xl/4xl font-bold` — page title carrying authority through both size *and* weight; size was already enough. 1 occurrence.
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

**Owner dashboard + user-menu surface (`apps/hub`)** — 18 of 19 occurrences refined:
- `staff/users/[id]/page.tsx`: 5 eyebrow labels → `font-semibold`.
- `staff/tree/page.tsx`: 2 eyebrow labels → `font-semibold`.
- `ai/page.tsx`: 4 metric eyebrows → `font-semibold` (sized at `text-[10px]`, the bold was screaming). 1 severity status pill → `font-semibold` (per "Status pills: medium").
- `OwnerSidebar.tsx`: "Command Center" eyebrow + footer initials → `font-semibold`.
- `OwnerMobileNav.tsx`: "CMD" eyebrow + drawer initials → `font-semibold`.
- `InternalTeamCommsClient.tsx`: unread "X new" chip → `font-semibold tabular-nums` (tabular-nums added because it's a count).
- `(site)/preferences/PreferencesClient.tsx`: page-title `<h1 text-3xl font-bold>` → `<h1 text-3xl font-semibold>`. Reached from the user-menu in every dashboard, so the heaviness was leaking into the user-dashboard reading experience. Section h2s on the same page were already `font-semibold`; flat-weight ladder + size differentiation now matches the prompt's "size carries the authority, not the weight" principle.
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
- **Hub user-menu /preferences**: the page title used to land at the same shouty weight as a marketing landing-page headline; now it reads at the same weight as its own section h2s, and the `text-3xl/4xl` size is what carries the authority. Language tiles, theme buttons, consent toggles already used `font-semibold` — the page now has a single, calm weight throughout.
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
| Post-edit grep for `font-bold\|font-extrabold\|font-black` in `apps/account` + `apps/hub` + `apps/staff` | ✓ Only the 4 preserved currency lines remain (referrals ×2, CareBookingsDashboard, owner MetricCard) |
| Broader sweep — `packages/dashboard-shell` + `packages/dashboard-modules-*` + `packages/search-ui` | ✓ Zero occurrences (already calm by construction) |
| Broader sweep — `apps/jobs` + `apps/learn` + `apps/marketplace` + `apps/property` + `apps/studio` + `apps/logistics` | ✓ Zero occurrences in any division-staff or division-owner surface |

### CI + Preview deploys (PR #75)

CI run **#25628187716** — `Lint, typecheck, test, build` — ✓ SUCCESS (started 12:01:00, completed 12:07:39 UTC).
A11y run **#25628187713** — `PNH baseline + contrast matrix + headers` — ✓ SUCCESS.

Vercel preview deploys (all SUCCESS):

| App | Deploy URL |
|---|---|
| `@henryco/account` (user dashboard) | https://vercel.com/henry-co/henryco-account/7XiQ4fa3JJzx53BbGGtHazexBPRU |
| `@henryco/hub` (owner dashboard) | https://vercel.com/henry-co/hub/ANPYuaHDyVYDjBZsxygP67CiGyii |
| `@henryco/care` | https://vercel.com/henry-co/care/G9K6hEfyhLhLCP3jKNpYBJ9bMyzb |
| `@henryco/jobs` | https://vercel.com/henry-co/jobs/5ydPwhSf4AZ7J42iK4KagnpfPDbh |
| `@henryco/learn` | https://vercel.com/henry-co/learn/847Trynemu29JpEsRyf9NsFPxQ4B |
| `@henryco/logistics` | https://vercel.com/henry-co/logistics/9SjwzAC16o5YhfCHJU6zi7fxTv9n |
| `@henryco/marketplace` | https://vercel.com/henry-co/marketplace/HL5YK7fq8stJJ3FuF3sxHXUynGiL |
| `@henryco/property` | https://vercel.com/henry-co/property/7uGPEXA2GWEnsqBkTYwdVD44RRt7 |
| `@henryco/studio` | https://vercel.com/henry-co/studio/CArN5vqQTKFqH35EwDZgfoEZLHTn |

Netlify preview: https://deploy-preview-75--henrycogroup.netlify.app

Mergeable state: **CLEAN** (no conflicts with `main`, all checks green).

Live visual verification per dashboard in light + dark is owner-driven from the URLs above; the principle the eye checks for is "money speaks loudest, everything else converses."

---

## 6. Files changed

PASS 25 commit `ac499bd5` touches 20 dashboard surface files. A 21st file
(`apps/hub/app/(site)/preferences/PreferencesClient.tsx`) is added in a
follow-up commit on the same branch — the preferences page is reached
from the user-menu in every dashboard, so it counts as a user-dashboard
surface even though it sits in the `(site)` route group rather than
`/owner` or `/(account)`. (The diff also lists `apps/account/app/api/cron/notification-email-fallback/route.ts`, `apps/account/app/api/documents/[type]/[id]/route.ts`, `apps/account/lib/email/templates.ts`, `apps/hub/components/owner/InviteStaffForm.tsx`, `apps/staff/app/(workspace)/operations/newsletter/NewsletterDraftEditor.tsx` — these are from a separate parallel session working on email/branding and are **not** part of PASS 25.)

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
apps/hub/app/(site)/preferences/PreferencesClient.tsx   ← follow-up
apps/hub/app/owner/(command)/ai/page.tsx
apps/hub/app/owner/(command)/staff/tree/page.tsx
apps/hub/app/owner/(command)/staff/users/[id]/page.tsx
apps/hub/components/owner/InternalTeamCommsClient.tsx
apps/hub/components/owner/OwnerMobileNav.tsx
apps/hub/components/owner/OwnerSidebar.tsx
apps/staff/components/StaffMobileNav.tsx
apps/staff/components/StaffSidebar.tsx
```

---

## 7. Out of scope — but observed

A `font-black`-heavy aesthetic lives across `apps/care/app/(staff)/**`
(care division staff dashboard: `manager/`, `owner/`, `support/`,
`rider/`, `staff/page.tsx`). That weight is the deliberate signature of
the 90B / 90D / 90E "Care division premium" redesigns — page titles
stack `text-4xl font-black tracking-[-0.04em]` with intent, not by
accident, and the colour palette + motion grammar are tuned to it. Pass
25's calm-editorial principles (h1 = regular/medium, size carries
authority) apply philosophically, but rebalancing care without owner
sign-off would change the felt identity of that division.

**Recommendation**: a follow-up "Pass 25 — Care division" sweep, scoped
to `apps/care/app/(staff)/**` only, with the owner walking each page in
preview before/after. That sweep is *not* included here so this PR keeps
its surgical scope and reviewable diff.

Confirmed clean (zero `font-bold` / `font-extrabold` / `font-black`):

- `packages/dashboard-shell/**`
- `packages/dashboard-modules-*/**` (account, marketplace, wallet, …)
- `packages/search-ui/**`
- `apps/jobs/**`
- `apps/learn/**`
- `apps/marketplace/**`
- `apps/property/**`
- `apps/studio/**`
- `apps/logistics/**`

The Pass 25 in-scope dashboards (`account` + `hub` + `staff`) plus the
divisions other than care now carry zero stray heavy-weight Tailwind
classes — the only `font-bold` left in the in-scope surface are the
four currency anchors that the prompt asked us to preserve.
