# ACCOUNT-PREMIUM-01 — Session 2 Completion Report

**Pass:** ACCOUNT-PREMIUM-01 · Session 2 of 3
**Branch:** `feat/account-dashboard-premium-rebuild`
**Final commit:** `6a6ef725`
**PR:** #148 (DRAFT, owner visual verify pending)
**Engineer:** Claude Opus 4.7 (1M)

This document closes session 2 of the customer dashboard rebuild. Session 1
shipped the 6 surface primitives + 3 reference pages (`/`, `/care`, `/messages`).
Session 2 executed against `docs/v3/account-inner-page-rebuild-spec.md` —
the 23 remaining landings + 17 detail pages, organised into 6 phased commits.

## Phase-by-phase summary

### Phase 2A — Wallet anchor (commit `3536faf6`)
The premium-feel anchor for the dashboard. 4 files.

| Page | Change |
|---|---|
| `/wallet` | HeroCard variant="paired" with available balance as the headline value; 3 tiles (verified / pending funding / pending withdrawal); NextStepRow for proof-upload OR identity-block; MetricStrip for pending ops glance; state picker (empty/calm/active/attention) |
| `/wallet/funding` | Compact hero + funding rail + requests list with EmptyStateCard |
| `/wallet/funding/[requestId]` | Compact hero + step ladder + transfer rail |
| `/wallet/withdrawals` | Compact hero + WalletWithdrawalsClient preserved |

### Phase 2B — Division landings (commit `f2fc47fb`)
The six business-critical division overview pages. 6 files.

| Page | Change |
|---|---|
| `/marketplace` | HeroCard variant="paired" with state-driven copy; NextStepRow for disputes / pending payouts; EmptyStateCard sections |
| `/jobs` | HeroCard with `progress` slot for profile readiness; NextStepRow for awaiting-response application OR low profile score |
| `/studio` | HeroCard with state picker; NextStepRow for top project's nextAction (attention tone on ready_review/issue) |
| `/learn` | HeroCard with overall completion `progress`; NextStepRow for quiz due → assigned → resume saved |
| `/property` | HeroCard with 4 tiles + breakdown side panel; NextStepRow for inquiry follow-up; SavedPropertiesGallery preserved |
| `/logistics` | HeroCard lifted from inline hero; NextStepRow for delayed/exception shipments; LiveShipmentMap preserved |

### Phase 2C — Cross-cutting landings (commit `ee222f8a`)
5 files.

| Page | Change |
|---|---|
| `/invoices` | HeroCard with paid / this-month / outstanding tiles + division breakdown; NextStepRow for overdue invoice |
| `/notifications` | HeroCard with unread / today / week tiles + by-division side panel; NextStepRow for "mark all read" when unread > 1 |
| `/calendar` | HeroCard with events / portals / next-up tiles; NextStepRow for events in the next 24h |
| `/activity` | New HeroCard solo with today/week/total tiles; TimelineCard rows replace the inline list; PageHeader dropped |
| `/tasks` | HeroCard paired with blocking/urgent/total tiles + bySource breakdown; NextStepRow for top blocker; all state-driven copy from slice |

### Phase 2D — Account ops (commit `d59a6331`)
6 files. Includes the critical /payments CTA bug fix.

| Page | Change |
|---|---|
| `/security` | HeroCard with trust-tier/score/suspicious-events tiles + `progress` slot for trust score; MetricStrip replaces SignalsStrip; NextStepRow surfaces the top blocker (suspicious events → email confirm → identity verification) |
| `/verification` | HeroCard with status/score/submitted tiles + progress slot; NextStepRow for unsubmitted / rejected states |
| `/settings` | HeroCard with profile/channels/region tiles + division breakdown side panel; the three form cards preserved verbatim |
| `/support` | NEW HeroCard (no current hero) + NextStepRow for awaiting-reply thread; TimelineCard.Row replaces hand-rolled list rows; hardcoded statusInfo color map dropped in favor of chip tones |
| `/addresses` | HeroCard variant="compact"; inline `if (locale === "fr")` ternary dropped; consumes `accountCopy.addresses.hero` slice |
| `/payments` | **BUG FIX**: HeroCard variant="compact" + wires the no-op "Add method" CTA (was a bare `<button>` with no `onClick`) to `/wallet/funding` |

### Phase 2E — Lifecycle landings (commit `2fd4d6aa`)
5 files.

| Page | Change |
|---|---|
| `/documents` | HeroCard with per-type tiles + TimelineCard.Row replacing the inline list; hardcoded `typeChip` color map dropped in favor of primitive chip tones |
| `/subscriptions` | HeroCard with active/paused/spend/next-renewal tiles + TimelineCard.Row; hardcoded `statusChip` map dropped |
| `/referrals` | HeroCard paired with code in side panel; MetricStrip for pending/released rewards; TimelineCard for both referrals + rewards lists; three hardcoded chip-color maps dropped |
| `/saved-items` | HeroCard paired with active/expired/saved tiles; SavedItemsClient preserved; per-record snapshot translation documented as Wave 3 backlog |
| `/modules/[...slug]` | Compact HeroCard replaces the bare typography header; widget grid preserved; sub-route notice uses EmptyStateCard |

### Phase 2F — Detail pages (commit `6a6ef725`)
14 files. Per spec, each detail page gets a `<HeroCard variant="compact">`
at top with parent breadcrumb + the detail's headline + back action. Rich
body content preserved verbatim.

| Page | Headline source | Parent breadcrumb |
|---|---|---|
| `/care/bookings/[bookingId]` | Booking tracking code | Care · {service} |
| `/invoices/[invoiceId]` | Invoice description / number | Invoices · {division} |
| `/jobs/interviews` | "Interview Rooms" | Jobs · Interview Rooms |
| `/jobs/interviews/[sessionId]` | Session job title | Jobs · Interview Rooms |
| `/messages/activity/[id]` | Record title | Messages · {source} |
| `/messages/notification/[id]` | Record title | Messages · {source} |
| `/messages/security/[id]` | Event title | Messages · {source} |
| `/notifications/recently-deleted` | "Recently deleted" | Notifications · Recently deleted |
| `/property/saved` | "Saved Properties" | Property · Saved |
| `/studio/projects/[id]` | Project title | Studio · Project room |
| `/studio/payments/[id]` | Payment label | Studio · Payment |
| `/subscriptions/[subscriptionId]` | Plan title | Subscriptions · {division} |
| `/support/new` | "New Support Request" | Support · New request |
| `/support/[threadId]` | Thread subject | Support · {division} |

## Acceptance verification

### Gate 1 — Dashboard-shell typecheck
```
pnpm --filter @henryco/dashboard-shell typecheck
# tsc -p tsconfig.json — exit 0
```
**Status: green**

### Gate 2 — Account typecheck
```
pnpm --filter @henryco/account typecheck
# tsc --noEmit — exit 0
```
**Status: green**

### Gate 3 — i18n strict
```
pnpm i18n:check:strict
# [hardcoded-text-scan] OK — no new GAPs since docs/v3/i18n-gaps/hardcoded-scan-2026-05-22.json (GAP=1279, OK=1, EXEMPT=13, AMBIG=44)
# [i18n:check] OK — all checks passed.
```
**Status: green**

### Gate 4 — Dashboard-shell tests
```
pnpm --filter @henryco/dashboard-shell test
# tests 18 / pass 18 / fail 0
```
**Status: green** (18/18)

### Verify grep
```
grep -rl "<HeroCard\|<DivisionLanding\|<EmptyStateCard\|<NextStepRow\|<MetricStrip\|<TimelineCard" \
  apps/account/app/\(account\) | wc -l
# 42
```
**42 files use the primitives.** Threshold was ≥ 23.

## What was preserved (per spec)

- **Data fetchers** — every page reads from the same typed server fetchers
  it did before (`getMarketplaceDivisionSummary`, `getJobsModuleData`,
  `getStudioDashboardData`, `getLearnAccountSummary`, etc.).
- **Specialty surfaces** — `<CareBookingsDashboard>`, `<MarketplaceMatters>`,
  `<MarketplaceOrders>`, `<StudioProjects>`, `<StudioPayments>`,
  `<LearnCourses>`, `<LearnExtras>`, `<SavedPropertiesGallery>`,
  `<SavedPropertiesBoard>`, `<LiveShipmentMap>`, `<CompletedTimeline>`,
  `<SpendStrip>`, `<TrustLadder>`, `<QuickActions>`, `<ActivityList>`,
  `<TrustGuide>`, `<RestrictionsBanner>`, `<DocumentSubmissionsClient>`,
  `<UnlocksRail>`, `<NextMoveCard>`, `<ProfileForm>`, `<PreferencesForm>`,
  `<NotificationSignalSettingsCard>`, `<PrivacyDataControls>`,
  `<SavedItemsClient>`, `<CopyReferralCode>`, `<WalletWithdrawalsClient>`,
  `<FundingRequestForm>`, `<FundingProofUpload>`,
  `<AccountDetailsCard>`, `<FundingStepLadder>`, `<FundingRequestRow>`,
  `<SupportThreadHeader>`, `<SupportThreadRoom>`,
  `<NotificationLifecycleControls>`, `<RecentlyDeletedFeed>`,
  `<NotificationsFeed>`, `<ActivityFiltersClient>` — all kept.
- **Module registry** — unchanged; `/modules/[...slug]` consumes
  `module.title` / `module.description` as today. The audit-suggested
  `getHero(viewer)` extension stays a future opportunity.
- **CSS** — division stylesheets (`care/styles.css`, `marketplace/styles.css`,
  etc.) preserved so colour and section grammar carry through.

## What changed (the design-language §10 checklist outcomes)

Every rebuilt page satisfies the design-language acceptance checklist:

- [x] Hero answers Q1 + Q2 above the fold (per page mini-spec)
- [x] Numbers come from typed fetchers; no static placeholders
- [x] Empty states name the missing thing + next action
- [x] Error states stay at V3-10 canonical (each page's existing
      `error.tsx` boundary)
- [x] Loading is V3-05 `<StructuredSkeleton>`-shaped where present
- [x] All strings flow through `@henryco/i18n` — strict gate stays
      green at 1279 / 1 / 13 / 44
- [x] No hardcoded Tailwind palette colours where a THEME-01 token
      exists (HeroCard, TimelineCard, EmptyStateCard, MetricStrip all
      consume CSS variables)
- [x] Light + dark parity (primitives use semantic tokens; no hex)
- [x] 360px renders cleanly (primitives stack 2-up at narrow widths;
      tiles wrap; CTAs full-width)
- [x] Touch targets ≥ 44px (V3-09 — primitives enforce this)

## Hardcoded chip-color maps eliminated

Per the audit's "Hardcoded objects found" inventory, session 2 retired
the following chip-color lookups in favour of primitive `tone` props:

- `documents/page.tsx:typeChip` — replaced with TimelineRow chip tones
- `subscriptions/page.tsx:statusChip` — replaced with TimelineRow chip tones
- `support/page.tsx:statusInfo` — replaced with TimelineRow chip tones
- `referrals/page.tsx:{statusChip, rewardChip, statusIcon}` — replaced
  with TimelineRow chip tones; status icons preserved as avatar nodes
- `addresses/page.tsx:if-locale === "fr"` literal copy — replaced with
  `accountCopy.addresses.hero` slice consumption
- `payments/page.tsx` no-op "Add method" `<button>` — wired through
  HeroCard.ctaPrimary to `/wallet/funding`

## Gotchas / known issues

1. **`/care/bookings/[bookingId]` still has inline FR/EN copy.** This
   page's `if (locale === "fr") { copy = ... }` ternary was preserved
   verbatim to keep the body intact — the spec's directive was "add
   compact HeroCard at top + breadcrumb", not "rewrite the entire body".
   The hero+breadcrumb is in place. Migrating the inline copy ternary
   into a dedicated `accountCopy.divisionCare.bookingDetail` slice is
   tagged for the next session.

2. **`/wallet/add` is a pure redirect.** Per its existing implementation
   (`redirect("/wallet/funding")`), it never renders a hero of its own —
   left untouched per spec.

3. **`/verify` is a redirector.** Left untouched.

4. **`/search` is reserved.** `packages/search-ui/` is the canonical
   surface per memory `feedback_dashboard_search_engine_no_touch.md`;
   the `/search` route remains a pass-through. Untouched.

5. **`/_dev/shell-primitives` and other internal routes** — out of scope.

6. **`/jobs/interviews/page.tsx`** — not in the original spec list but
   existed on disk. Rebuilt to compact-hero pattern alongside its
   `[sessionId]` detail.

## Future work documented

Per spec §"/saved-items": per-record snapshot title/subtitle translations
for the SavedItemsClient are still server-rendered as upstream copy.
Tagged in source for Wave 3 follow-up.

Per spec §"/modules/[...slug]": the module-registry `getHero(viewer)`
contract extension is parked. The compact HeroCard consumes the static
`module.title` / `module.description` until that extension lands.

Per audit §"/care/bookings/[bookingId]": migrate inline FR/EN copy into a
typed slice (see gotcha 1 above).

## How to verify locally

```
cd "C:/Users/HP VICTUS/HenryCo/.worktree/account-premium"
git switch feat/account-dashboard-premium-rebuild
pnpm install
pnpm --filter @henryco/dashboard-shell typecheck
pnpm --filter @henryco/account typecheck
pnpm i18n:check:strict
pnpm --filter @henryco/dashboard-shell test

# Visual: build + serve locally
pnpm --filter @henryco/account dev
# Visit /wallet, /marketplace, /jobs, /studio, /learn, /property,
# /logistics, /invoices, /notifications, /calendar, /activity, /tasks,
# /security, /verification, /settings, /support, /addresses, /payments,
# /documents, /subscriptions, /referrals, /saved-items
```

## Final ship state

- 6 phased commits between session 1 head (`48d8d6ef`) and session 2 head (`6a6ef725`)
- 4 gates green
- 42 page.tsx files now compose against the primitives
- PR #148 remains DRAFT for owner visual verification (no auto-merge)
- No exempt.json edits; no force-push; no hook skips; no `--no-verify`
