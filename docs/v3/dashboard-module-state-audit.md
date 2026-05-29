# V3-08 — Dashboard Module-State Audit

**Pass:** V3-08 (Empty Dashboard Truth)
**Branch:** `v3/08-empty-dashboard-truth`
**Date:** 2026-05-29

This is the S1 deliverable: a module-by-module classification of every
dashboard module registered in `@henryco/dashboard-modules-*`, scoring
whether each renders a DISTINCT UI for the five canonical data states.

## State taxonomy (S1 contract → code)

Formalised in
[`packages/dashboard-shell/src/module-state-contract.ts`](../../packages/dashboard-shell/src/module-state-contract.ts).

| State | Meaning | Resolver condition |
|---|---|---|
| `real` | Live query returned rows | `rowCount > 0` |
| `empty_yet` | Zero rows — user has done nothing yet (first-run) | `rowCount === 0 && !hasEverHadData` |
| `empty_none` | Zero rows for valid filters (had data before / none-for-you) | `rowCount === 0 && hasEverHadData` |
| `loading` | Query in flight | `loading === true` |
| `error` | Query failed | `error != null` |

`resolveModuleState(input)` is the single pure helper; `isEmptyState`,
`decideModuleRender` (S8 hidden-when-empty), and `MODULE_STATE_TELEMETRY`
ship alongside it. No React, no IO — safe to import anywhere.

## Verdict legend

- **Truthful** — already distinguishes the relevant states; no change needed.
- **Fixed** — was lying (fabricated trend / stub / fake CTA); corrected in this pass.
- **N/A** — state not reachable for this module (documented why).

---

## `@henryco/dashboard-modules-account` — `customer-overview`

Data source: `loadCustomerOverviewSnapshot(viewer)` (user-scoped
`customer_*` tables). `getHomeWidgets` returns `[]` when no snapshot
(non-customer viewer) → module contributes nothing rather than faking.

| Widget | Source | empty | loading | error | Verdict |
|---|---|---|---|---|---|
| WalletBalanceCard | `customer_wallet_balance` | real zero balance shown as `₦0`, honest | snapshot await (shell skeleton) | shell boundary | Truthful |
| UnreadNotificationsCard | notifications count | `0` honest | shell | boundary | Truthful |
| ActiveSubscriptionsCard | `customer_subscriptions` | `0` honest | shell | boundary | Truthful |
| TrustTierCard | trust snapshot | tier label always real | shell | boundary | Truthful |
| InvoicesPendingCard | `customer_invoices` | `0` honest (2 rows in prod) | shell | boundary | Truthful |
| SupportOpenCard | support threads | `0` honest | shell | boundary | Truthful |
| **ReferralsCard** | static entry-point (no telemetry yet) | n/a | n/a | n/a | **Fixed** |
| LifecycleContinueWidget | lifecycle snapshot | null headline → calm | shell | boundary | Truthful |

**ReferralsCard fix:** the card declared `context={{ kind: "trend",
direction: "up", ... }}` — a green up-arrow painted on a card with NO
measured referral trend (referral telemetry is not in `@henryco/data`
yet). That is a fabricated positive signal. Changed `direction` to
`"flat"` (neutral `Minus` glyph), the honest "no signal yet" state for a
static entry-point prompt. File:
`packages/dashboard-modules-account/src/widgets/referrals-card.tsx`.

The Smart Home empty composition (`SmartHomeEmpty`) is already
typographic (closes anti-pattern #16) and sources its CTAs from the
deterministic recommender — no hardcoded "Add money / Browse" fallbacks.
Truthful.

## `@henryco/dashboard-modules-marketplace` — `marketplace`

Data source: `loadMarketplaceSnapshot(viewer)`; `getHomeWidgets` returns
`[]` with no snapshot. Vendor widgets gated on `isVendor(snapshot)`.

| Widget | Source | empty | Verdict |
|---|---|---|---|
| OrdersInFlightCard | live orders | distinct empty | Truthful |
| WishlistShortcut | wishlist rows | distinct empty | Truthful |
| DealsOfTheMomentCard | `marketplace_deals_curation` | "No active deals" + honest teaching (explicitly closes anti-pattern #4) | Truthful |
| SellerStatusCard | `vendorStatus` (vendor-only) | gated, not shown to non-vendors | Truthful |

`DealsOfTheMomentCard` was a candidate for S4 (decorative "trending"
panel) but is already real-data-only: it shows curated rows when present
and a distinct "When curators publish a deal slot, it appears here" empty
state otherwise. No fabricated placeholder deals. No fix.

## `@henryco/dashboard-modules-wallet` — `wallet`

Data source: snapshot-based; `getHomeWidgets` returns `[]` with no
snapshot; `getEmptyTeaching` provides the first-run teaching. Balances
render real zero as `₦0`. Truthful.

## `@henryco/dashboard-modules-building` — `building`

Data source: snapshot-based, same registry contract. Module gate hides it
for ineligible viewers (returns `hidden`). Empty/real handled by the
snapshot pattern. Truthful (no decorative tiles found).

## `@henryco/dashboard-modules-hotel` — `hotel`

Data source: snapshot-based, same registry contract. Truthful (no
decorative tiles found).

## `@henryco/dashboard-modules-owner` — owner registry

Modules: `owner-overview`, `owner-finance`, `owner-operations`,
`owner-staff`, `owner-divisions`, `owner-brand`, `owner-messaging`,
`owner-ai`, `owner-settings`. These are nav/registry modules for the
owner workspace; the actual KPI surfaces live in
`apps/hub/app/owner/(command)/`. Tile-level freshness handled in S3 (see
below). No fabricated-data tiles found in the registry modules.

## `@henryco/dashboard-modules-staff` — staff registry

Modules: `staff-overview`, `staff-care`, `staff-support`,
`staff-marketplace`, `staff-moderation`, `staff-finance-operator`,
`staff-jobs`, `staff-learn`, `staff-logistics`, `staff-property`,
`staff-studio`, `staff-settings`. Per `intelligence-rollout-status.md`
these pull live intelligence-data. Spot-checked `staff-overview` — real
queue/risk metrics, not stub. Truthful.

---

## S2 — Subscriptions + Invoices truth-up

- **Subscriptions** (`apps/account/app/(account)/subscriptions/page.tsx`):
  `customer_subscriptions` has **0 rows** in production. The empty state
  previously rendered an `EmptyStateCard` with NO CTA and a footer that
  was a bare `<RefreshCcw>` icon with no text (a stub). **Fixed:** the
  empty state now carries a CTA (`copy.empty.ctaLabel`) pointing to the
  real marketplace storefront `henryDomain("marketplace")` — where
  subscriptions originate — and the footer renders an honest footnote
  (`copy.empty.footnote`) explaining that subscriptions are created by
  the division you buy from and appear here automatically once synced.

  **Why marketplace, not a "Browse premium plans" purchase flow:** no
  payment provider is integrated and there are 0 subscription rows, so a
  "Browse premium plans" CTA wired to a purchase flow would be a fake
  "ready" CTA — forbidden by the contract's Trust/safety section. The
  marketplace storefront is the real, currently-shipping surface.

- **Invoices** (`customer_invoices`, 2 rows in prod): the invoices
  surface already renders real rows and a distinct empty state. Audited,
  truthful, no fix required.

New i18n copy added to `subscriptions.empty` across **all 12 locales**
(`ctaLabel` + `footnote`): EN/FR/DE/IT/IG/YO/HA/ZH/HI in
`packages/i18n/src/account-copy.ts`; ES/PT/AR in
`packages/i18n/src/account-copy-promoted.ts`.

## S3 — Owner-workspace freshness

`apps/hub/app/owner/(command)/page.tsx` mounts `RouteLiveRefresh`
(15s SPA refresh + visibility-change refresh) — the live freshness
mechanism for the whole owner workspace. The health tiles
(`SessionHealthTile`, `ObservabilityTile`, and the new `ModuleHealthTile`)
each render a "Last computed HH:MM:SS UTC" freshness line sourced from the
actual query timestamp (`lastUpdatedAt`), never a fabricated value, and a
distinct `isEmptyState` notice so zeros do not read as a regression.

**Known limitation:** the per-metric `MetricCard` tiles in the page body
(divisions live, recognized revenue, etc.) do not yet carry an individual
"last updated N min ago" caption — freshness is currently page-level (via
RouteLiveRefresh) plus tile-level on the dedicated health panels. A full
per-tile freshness caption + per-tile manual-refresh affordance across
every body MetricCard is a larger owner-data-layer change (the contract's
"@henryco/data — extend aggregator with freshness metadata" inheritance)
and is noted as follow-up rather than fabricating per-tile timestamps.

## S4 — Decorative module removal

- **ReferralsCard** — fake trend removed (see account table above). Not
  removed outright because it is a legitimate entry-point to `/referrals`;
  it just must not paint a fabricated trend.
- **DealsOfTheMomentCard** — audited as a candidate; already real-data
  with honest empty state. Not decorative. Kept.
- No "Recommended"/"Trending" panel wired to fake recommendation logic
  was found. The owner "Helper recommendations" and "Urgent signals"
  panels are explicitly described as "Only recommendations backed by live
  signals" / "Evidence-backed … from live tables".

## S8 — Hidden-when-empty

`decideModuleRender({ state, emptyBehaviour, showAllModules })` is
provided in the contract for modules that have no value when empty
(`emptyBehaviour: "hide"`), with a `showAllModules` override so power
users can still see everything (the contract's "Show all modules"
toggle). The Smart Home already collapses to a typographic empty state
rather than rendering ghost cards, so no module currently renders a
zero-value placeholder that needs hiding; the helper is in place for
future modules.

## S9 — Telemetry (3 events)

| Event | Emit site | Payload |
|---|---|---|
| `henry.dashboard.module.rendered` | `apps/account/lib/smart-home/widgets.ts` (`collectHomeWidgets`, server) | `module_id`, `state`, `source` |
| `henry.dashboard.module.refreshed` | `apps/account/components/smart-home/DashboardRefreshTracker.tsx` (client, on RouteLiveRefresh tick) | `module_id`, `freshness_seconds` (real elapsed) |
| `henry.dashboard.empty_state.cta_clicked` | `apps/account/components/smart-home/EmptyStateCtaTracker.tsx` (client, empty-state CTA click) | `module_id`, `cta_target` |

All three names are registered in
`packages/observability/src/events.ts` (`HenryEventName` union) and
documented in `docs/event-taxonomy.md` (new `dashboard` family row).

`module.rendered` is dual-written to `henry_events` via `persistEvent`
(best-effort, server-side) so the owner **Module-Health tile**
(`apps/hub/app/owner/(command)/dashboard/module-health-tile.tsx`, data
source `apps/hub/lib/owner-module-health.ts`) can roll up modules that
have been empty on EVERY render across the last 7 days — the
removal/messaging-fix candidates. The client events (`refreshed`,
`cta_clicked`) emit pino + Sentry breadcrumbs (mirroring the
`StructuredSkeleton` lazy-import pattern); wiring them into the
`henry_events` dual-write is a follow-up if owner reporting needs them.

---

## Summary

- Modules audited: 5 customer/division module packages (account,
  marketplace, wallet, building, hotel) + owner registry (9) + staff
  registry (12).
- Lies fixed: **2** — ReferralsCard fabricated "up" trend (S4);
  Subscriptions empty-state stub footer + missing CTA (S2).
- Net-new infrastructure: module-state contract (S1), 3 telemetry events
  + owner Module-Health tile (S9).
- Everything else audited TRUTHFUL — the dashboard-modules registry
  pattern (every widget is explicit about its data source and returns
  `[]` rather than faking) was already doing most of the work.
