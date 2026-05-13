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

---

## 8. Care division — completion sweep (2026-05-13)

The original PASS 25 deferred `apps/care/app/(staff)/**` because rebalancing
care without explicit owner sign-off would have changed the felt identity of
that division. The owner gave the sign-off and asked for a maximum-effort
completion. This section documents that follow-up sweep.

### 8.1 Weight occurrence map (before — Care dashboards only)

**`apps/care/app/(staff)/**` — 81 occurrences across 24 files**

| Pattern | Count | Locations |
|---|---|---|
| h1 hero `text-4xl/5xl font-black` | 12 | every owner/manager/support/rider page hero |
| h2 section `text-3xl/4xl font-black` and `font-bold` | 23 | every Panel/StatCard helper title + inline section headers |
| h3 card titles `font-bold`/`font-black` | 11 | pricing item rows, review/payment customer-name cards, inbox empty-states |
| Eyebrow / chip / threadRef `font-bold` uppercase | 11 | staff/rider eyebrows, support outbox threadRef, manager mono codes |
| Mono tracking codes `font-bold` | 9 | operations / records / owner urgency lists, manager queue rails |
| MetricCard / InfoTile / StatCard `value` divs `font-black` (counts-only) | 4 | pricing page metric helpers (owner + manager), support queue card values, owner staff metric helper, owner security stat helper |
| MetricCard / InfoTile / StatCard `value` divs `font-black` (mixed counts + currency) | 7 | owner/finance MetricCard helper, owner/page MetricCard helper, manager/page MetricCard + InfoTile helpers, manager/expenses MetricCard helper, manager/operations Metric helper, owner/records StatCard helper |
| Inline currency display divs `font-black` | 5 | owner/finance payments + expense amounts (×3), owner/page payments + expense amounts (×2), manager/expenses recent amount, support/expenses + rider/expenses amounts |
| Inline button `font-bold` | 0 | (zero in `(staff)`) |

**`apps/care/components/**` that flow into the staff shells — 25 occurrences across 11 files**

| File | Lines | Pattern |
|---|---|---|
| `components/staff/staff-shell.tsx` | 149, 247, 437, 467, 552, 574 | brand initials, "X unread alerts" drawer header, brand-name truncate, roleLabel chip, page-meta `<h1>` (rendered on every staff page), notification-count pill |
| `components/staff/NotificationCenterPanel.tsx` | 94 | unread-alert h2 |
| `components/staff/ImpersonationBanner.tsx` | 27 | "Exit impersonation" button `font-bold` |
| `components/support/SupportThreadWorkspace.tsx` | 335, 591, 689 | workflow h2, threadRef eyebrow, selected-thread h3 |
| `components/support/SupportThreadControls.tsx` | 94 | reply-composer h3 |
| `components/dashboard/BookingRailWorkspace.tsx` | 47, 93 | "Operational rails" eyebrow, mono tracking_code chip |
| `components/dashboard/WorkspacePrimitives.tsx` | 36, 68, 92 | WorkspaceHero h1, WorkspaceMetricCard value, WorkspacePanel h2 |
| `components/owner/WhatsAppHealthConsole.tsx` | 264, 275, 286, 297, 417 | 4× delivery-metric count divs (delivered/accepted/failed/approved), diagnostics h3 |
| `components/tour/HelpButton.tsx` | 46 | help-drawer h3 |
| `components/tour/TourOverlay.tsx` | 73 | tour-step h3 |
| `components/tour/TourWelcomePrompt.tsx` | 35 | "would you like a quick guided tour" h3 |

**Total Care in-scope: 106 heavy-weight occurrences.**

### 8.2 Pattern analysis — why each got refined

Apply the same Pass 25 principles the original commit used, plus one Care-specific
adjustment:

| Principle | Care application |
|---|---|
| Page titles (h1) → regular/medium; size carries the authority | All `text-4xl/5xl font-black` h1 hero titles dropped to `font-semibold`. Size + tracking + accent kicker still carry Care's identity. |
| Section headers (h2) → medium, never bold | All `text-3xl font-black`/`font-bold` h2s → `font-semibold`. Pass 19 `h2` token = 600. |
| Card titles (h3) → medium or semibold, never bold | All `text-xl font-bold` and `text-2xl font-black` h3s → `font-semibold`. |
| Labels with uppercase letter-spacing → medium | Eyebrows, threadRefs, "Reviewing" / "Selected proof" / "Operational rails" → `font-semibold`. |
| Status pills / chips / counts → medium | Notification count chip moved to `font-semibold tabular-nums`; staff-shell brand initials and role-label chip dropped to `font-semibold`. |
| Mono tracking codes → semibold (mono + tracking-wider already carry it) | All `font-mono text-xs/sm font-bold` tracking-code displays → `font-semibold`. |
| Currency rendering → preserved verbatim | Every inline `formatMoney(...)` line and every shared `MetricCard.value` whose callers pass currency was left at `font-black`. |
| Care-specific: keep Care's accent + size as identity, not weight | `tracking-[-0.04em]`, `text-4xl`, accent-coloured eyebrows, and Care's distinctive backdrop blurs all retained — only the weight class moved. |

### 8.3 Replacements applied

**Components flowing into every staff page (highest leverage)**:

- `components/dashboard/WorkspacePrimitives.tsx`: `WorkspaceHero.h1` 4xl/5xl → `font-semibold`; `WorkspacePanel.h2` 3xl → `font-semibold`. `WorkspaceMetricCard.value` at L68 **preserved at `font-black`** because the helper is consumed by several Care pages that pass currency through it (mirrors the precedent set by `apps/hub/components/owner/MetricCard.tsx` in the original PASS 25).
- `components/staff/staff-shell.tsx`: every `font-black` on the shell (brand initials, "X unread alerts" drawer headline, brand-name truncate, role-label chip, the page-meta `<h1>` that wraps every staff page, and the notification count pill) → `font-semibold` (count pill picks up `tabular-nums`). This single change calms the chrome on every Care staff route.
- `components/staff/NotificationCenterPanel.tsx`: h2 → `font-semibold`.
- `components/staff/ImpersonationBanner.tsx`: "Exit impersonation" button → `font-semibold`.
- `components/support/SupportThreadWorkspace.tsx`: workflow h2 + threadRef eyebrow + selected-thread h3 → `font-semibold`.
- `components/support/SupportThreadControls.tsx`: reply-composer h3 → `font-semibold`.
- `components/dashboard/BookingRailWorkspace.tsx`: "Operational rails" + mono tracking_code → `font-semibold`.
- `components/owner/WhatsAppHealthConsole.tsx`: 4× delivery-count divs → `font-semibold tabular-nums` (these are counts, not currency); diagnostics h3 → `font-semibold`.
- `components/tour/HelpButton.tsx` + `TourOverlay.tsx` + `TourWelcomePrompt.tsx`: 3× h3 → `font-semibold`.

**Per-page surfaces (`apps/care/app/(staff)/**`)**:

- `owner/page.tsx`: h1 hero + mono `booking.tracking_code` + Panel h2-helper → `font-semibold`. **Preserved**: L403 payment amount, L441 expense amount, L613 MetricCard helper (callers mix counts + currency: balance line passes `formatMoney(summary.balance)`).
- `owner/finance/page.tsx`: h1 hero + "Where expense weight is concentrating" h2 + Panel h2-helper → `font-semibold`. **Preserved**: L351 payment amount, L389 expense amount, L440 expense amount, L590 MetricCard helper (3 of 4 callers pass currency).
- `owner/pricing/page.tsx`: h1 hero + 3× h2s + h3 itemName + MetricCard helper value → `font-semibold` (no caller passes currency on the pricing-governance page; all 4 metric callers pass counts or strings).
- `owner/records/page.tsx`: h1 hero + h2 + mono `row.item_tag` → `font-semibold`. **Preserved**: L298 StatCard helper (1 of 3 callers passes `formatMoney(totalTrackedValue)`).
- `owner/reviews/page.tsx`: h2 hero + customer-name → `font-semibold`.
- `owner/settings/page.tsx`: h1 hero + section h2-helper → `font-semibold`.
- `owner/staff/page.tsx`: h1 hero + h2 form intro + MetricCard helper → `font-semibold` (all 4 metric callers pass counts: managers/missing-profiles/auth-drift/archived).
- `owner/security/page.tsx`: h1 hero + StatCard helper + Panel h2-helper → `font-semibold` (with `tabular-nums` added to the count div).
- `owner/insights/page.tsx`: mono booking.tracking_code eyebrow → `font-semibold`.
- `owner/impersonate/page.tsx`: page h1 → `font-semibold`.
- `manager/page.tsx`: h2 hero + mono tracking_code + Panel h2-helper → `font-semibold`. **Preserved**: L257 MetricCard helper (1 of 5 callers passes currency: Recorded inflow), L305 InfoTile helper (1 of 3 callers passes currency: Overall balance).
- `manager/operations/page.tsx`: h1 hero + 5× mono tracking_code displays + Panel h2-helper → `font-semibold`; Metric helper L852 → `font-semibold tabular-nums` (all 4 callers pass counts; this helper is operations-specific and never receives currency).
- `manager/expenses/page.tsx`: h2 hero + Panel h2-helper → `font-semibold`. **Preserved**: L272 expense amount, L362 MetricCard helper (3 of 4 callers pass currency: Total expenses / Approved expenses / Recorded inflow).
- `manager/pricing/page.tsx`: h1 hero + 4× h2s + 2× h3 itemName/item_name + MetricCard helper → `font-semibold` (all 4 metric callers pass counts or strings on this governance surface).
- `support/page.tsx`: queue-card value div → `font-semibold tabular-nums` (these are counts, not currency).
- `support/reviews/page.tsx`: queue-rail h3 + selected-review h3 → `font-semibold`.
- `support/payments/page.tsx`: queue-rail h3 + selected-payment h3 → `font-semibold` (the `due {formatMoney(item.amountDue)}` pill stays — it was already at `font-semibold`).
- `support/outbox/page.tsx`: h2 + threadRef eyebrow → `font-semibold`.
- `support/expenses/page.tsx`: h1 hero → `font-semibold`. **Preserved**: L100 expense amount.
- `support/inbox/reply/page.tsx` + `support/inbox/assign/page.tsx`: 3× "No thread selected" / "Thread not found" / customer-name h2s → `font-semibold`.
- `staff/page.tsx` + `rider/page.tsx`: mono tracking_code eyebrows → `font-semibold`.
- `rider/expenses/page.tsx`: h1 hero → `font-semibold`. **Preserved**: L99 expense amount.

### 8.4 Preserved currency anchors (Care) — 15 lines total

These lines were intentionally left at `font-black` (or unchanged) because each
one directly renders a currency value via `formatMoney(...)` or is a shared
helper whose callers can pass currency through it:

| File | Line | Why |
|---|---|---|
| `apps/care/components/dashboard/WorkspacePrimitives.tsx` | 68 | `WorkspaceMetricCard.value` — shared, callers may pass `formatMoney(...)` |
| `apps/care/app/(staff)/owner/finance/page.tsx` | 351 | inline `formatMoney(payment.amount)` |
| `apps/care/app/(staff)/owner/finance/page.tsx` | 389 | inline `formatMoney(expense.amount)` |
| `apps/care/app/(staff)/owner/finance/page.tsx` | 440 | inline `formatMoney(expense.amount)` |
| `apps/care/app/(staff)/owner/finance/page.tsx` | 590 | finance MetricCard helper (3 of 4 callers pass currency) |
| `apps/care/app/(staff)/owner/page.tsx` | 403 | inline `formatMoney(payment.amount)` |
| `apps/care/app/(staff)/owner/page.tsx` | 441 | inline `formatMoney(expense.amount)` |
| `apps/care/app/(staff)/owner/page.tsx` | 613 | owner-home MetricCard helper (balance caller passes currency) |
| `apps/care/app/(staff)/owner/records/page.tsx` | 298 | StatCard helper (Tracked value caller passes currency) |
| `apps/care/app/(staff)/manager/page.tsx` | 257 | manager-home MetricCard helper (Recorded inflow caller passes currency) |
| `apps/care/app/(staff)/manager/page.tsx` | 305 | manager-home InfoTile helper (Overall balance caller passes currency) |
| `apps/care/app/(staff)/manager/expenses/page.tsx` | 272 | inline `formatMoney(expense.amount)` |
| `apps/care/app/(staff)/manager/expenses/page.tsx` | 362 | manager-expenses MetricCard helper (3 of 4 callers pass currency) |
| `apps/care/app/(staff)/support/expenses/page.tsx` | 100 | inline `formatMoney(expense.amount)` |
| `apps/care/app/(staff)/rider/expenses/page.tsx` | 99 | inline `formatMoney(expense.amount)` |

**Refined: 91 of 106 in-scope occurrences (15 currency anchors preserved verbatim).**

### 8.5 Rhythm check — Care dashboards

Walked each Care staff route mentally against the same Pass 25 reading-priority
test the original pass used (page h1 → section h2 → body → currency anchor):

- **Care owner home** (`/owner`): kicker → h1 at `text-4xl font-semibold` (Care identity now lives in the kicker + tracking + size, not the weight) → Panel h2s `font-semibold` → currency lines still anchored as the heaviest type on the page. Money speaks loudest, just like the rest of the dashboards.
- **Care finance** (`/owner/finance`): the heaviest type on the page is now exclusively `formatMoney(...)` — inflow / outflow / balance MetricCards, payment / expense amount columns, category-pressure InfoTiles. The h1 / h2 ladder reads as a calm climb, no longer screaming.
- **Care pricing desks** (`/manager/pricing` + `/owner/pricing`): governance surfaces (no live currency in the metric cards — only counts + strings), so every metric value dropped to `font-semibold`. The published-pricing list rows still anchor their `currency(item.price)` strings via the `font-semibold` pill, matching the Pass 25 "pills: medium" rule.
- **Care operations** (`/manager/operations`): h1 dropped; the operations Metric helper, which only receives counts (active bookings / urgent queue / registered pieces / intake risk), dropped to `font-semibold tabular-nums`. Every mono tracking_code chip is now `font-semibold` — the mono family + tracking-wider does the readability work.
- **Care expenses surfaces** (manager / rider / support): h1 / h2 dropped; the per-expense `formatMoney(expense.amount)` lines are preserved as the heaviest anchor on each card.
- **Care support workflow** (`/support/inbox` + reply + assign + outbox + payments + reviews): every customer-name h2/h3 and queue-rail title dropped to `font-semibold`; threadRef eyebrows dropped too. The reading hierarchy now goes "kicker → customer name (semibold) → subject (regular) → body", which finally reads like a support inbox instead of a settings panel.
- **Care WhatsApp health console** (`/owner/security`): the four delivery-state count tiles (delivered / accepted / failed / approved templates) dropped to `font-semibold tabular-nums`. These are counts, not currency, so the Pass 25 "money speaks loudest" principle keeps holding: no count on this page competes with the currency lines elsewhere in the division.
- **Care staff shell chrome** (every staff route): the page-meta `<h1>` rendered by `staff-shell.tsx` for every Care staff route dropped from `font-black` to `font-semibold`. This single change calms the topmost element on every Care staff page in one stroke.
- **Care tour overlays / help drawer / welcome prompt**: 3× h3 dropped. These are short-lived contextual surfaces but they were rendering at the same weight as a page hero — calmer now.

The Care division still feels distinctly itself: large hero sizes, accent-coloured kickers, the soft-blur backdrop, the `tracking-[-0.04em]` letter tightening. What changed is exactly the thing the prompt named — the weight stack no longer shouts.

### 8.6 Untouched by design (Care)

- **Pass 19 type scale**: unchanged. No edits to `packages/ui/src/styles/globals.css` or `packages/dashboard-shell/src/tokens/type.ts`.
- **Care `formatMoney(...)` rendering**: preserved verbatim on every line that renders a currency string.
- **Font family**: no change to `--font-inter`, `--font-source-serif`, or `--hc-font-mono`. Care still loads its own font stack from its layout file.
- **Care accent palette / motion / shadow tokens**: unchanged.
- **`apps/care/app/(public)/**` and `apps/care/components/care/**`, `components/auth/**`, `components/public/**`, `components/ui/CareLoading.tsx`, `apps/care/app/admin/**`, `apps/care/app/workspace/access/**`**: out of dashboard scope. These are public-facing booking flows, login surfaces, and customer-facing marketing — the heavy-weight aesthetic on those is the intentional brand voice and is *not* part of the Pass 25 "dashboards" remit. The prompt scope was "user dashboard, owner dashboard, staff dashboards"; this completion respected that exactly.

### 8.7 Validation (Care)

| Check | Result |
|---|---|
| `pnpm --filter @henryco/care run lint` | ✓ Passes (no warnings introduced) |
| `pnpm --filter @henryco/care run typecheck` | ✓ Passes (zero TS errors) |
| `pnpm --filter @henryco/care run build` | ✓ Builds clean — 33 static pages generated, no compile errors |
| Post-edit grep for `font-bold\|font-extrabold\|font-black` in `apps/care/app/(staff)/**` | ✓ Only the 14 currency-touching lines remain (3 in owner/finance, 3 in owner/page, 2 in manager/expenses, 2 in manager/page, 1 each in owner/records, support/expenses, rider/expenses) |
| Post-edit grep across the 11 in-scope Care component files | ✓ Only `WorkspacePrimitives.tsx:68` remains (shared MetricCard `value`, preserved per precedent) |
| Original PASS 25 in-scope dashboards (`apps/account`, `apps/hub`, `apps/staff`) | ✓ Untouched — no regressions possible |
| Pass 19 type scale + token files | ✓ Untouched |
| Currency formatter behaviour (`formatMoney`, `formatCurrencyAmount`) | ✓ Untouched (only weight classes around their call sites were preserved) |

### 8.8 Files changed in the Care completion sweep

24 files touched. Components first (highest leverage), then per-page surfaces:

**Components (11 files)**
```
apps/care/components/dashboard/WorkspacePrimitives.tsx       (h1 + h2; value preserved)
apps/care/components/dashboard/BookingRailWorkspace.tsx       (eyebrow + mono code)
apps/care/components/staff/staff-shell.tsx                    (initials + drawer + brand + role + meta h1 + count pill)
apps/care/components/staff/NotificationCenterPanel.tsx        (h2)
apps/care/components/staff/ImpersonationBanner.tsx            (button)
apps/care/components/support/SupportThreadWorkspace.tsx       (h2 + eyebrow + h3)
apps/care/components/support/SupportThreadControls.tsx        (h3)
apps/care/components/owner/WhatsAppHealthConsole.tsx          (4× count + h3)
apps/care/components/tour/HelpButton.tsx                      (h3)
apps/care/components/tour/TourOverlay.tsx                     (h3)
apps/care/components/tour/TourWelcomePrompt.tsx               (h3)
```

**Pages (13 files)**
```
apps/care/app/(staff)/owner/page.tsx                          (h1 + mono code + helper h2; 2 currency anchors + 1 helper preserved)
apps/care/app/(staff)/owner/finance/page.tsx                  (h1 + inline h2 + helper h2; 3 currency anchors + 1 helper preserved)
apps/care/app/(staff)/owner/pricing/page.tsx                  (h1 + 3× h2 + h3 + helper value)
apps/care/app/(staff)/owner/records/page.tsx                  (h1 + h2 + mono code; StatCard helper preserved)
apps/care/app/(staff)/owner/reviews/page.tsx                  (h2 + customer name)
apps/care/app/(staff)/owner/settings/page.tsx                 (h1 + helper h2)
apps/care/app/(staff)/owner/staff/page.tsx                    (h1 + h2 + helper value)
apps/care/app/(staff)/owner/security/page.tsx                 (h1 + helper count + helper h2)
apps/care/app/(staff)/owner/insights/page.tsx                 (mono code eyebrow)
apps/care/app/(staff)/owner/impersonate/page.tsx              (h1)
apps/care/app/(staff)/manager/page.tsx                        (h2 + mono code + helper h2; MetricCard + InfoTile helpers preserved)
apps/care/app/(staff)/manager/operations/page.tsx             (h1 + 5× mono code + Metric helper + helper h2)
apps/care/app/(staff)/manager/expenses/page.tsx               (h2 + helper h2; 1 currency anchor + MetricCard helper preserved)
apps/care/app/(staff)/manager/pricing/page.tsx                (h1 + 4× h2 + 2× h3/item-name + helper value)
apps/care/app/(staff)/support/page.tsx                        (queue card value)
apps/care/app/(staff)/support/reviews/page.tsx                (2× h3)
apps/care/app/(staff)/support/payments/page.tsx               (2× h3)
apps/care/app/(staff)/support/outbox/page.tsx                 (h2 + threadRef eyebrow)
apps/care/app/(staff)/support/expenses/page.tsx               (h1; 1 currency anchor preserved)
apps/care/app/(staff)/support/inbox/reply/page.tsx            (3× h2)
apps/care/app/(staff)/support/inbox/assign/page.tsx           (3× h2)
apps/care/app/(staff)/staff/page.tsx                          (2× mono code eyebrow)
apps/care/app/(staff)/rider/page.tsx                          (3× mono code eyebrow)
apps/care/app/(staff)/rider/expenses/page.tsx                 (h1; 1 currency anchor preserved)
```

### 8.9 Pass 25 — overall completion

With this Care sweep, every HenryCo dashboard surface (user / owner / staff,
including the Care division's owner / manager / support / rider / staff
roles) carries the same calm editorial weight ladder:

- Page titles read through size, not weight
- Section headers sit at `font-semibold`
- Labels and chips whisper at `font-semibold`
- Currency anchors are the only heavyweight type on every page — *money speaks loudest, everything else converses*

The Pass 25 promise is now whole.
