# FIX-LT-01 — Loading-theater inventory (property + account + care)

**Pass:** FIX-LT-01 (V3-05 follow-up)
**Scope:** apps/property, apps/care, apps/account, apps/marketplace/app/account
**Bar:** zero `Loading X` / `Preparing X` / `Warming up` strings rendered on prod for the 3 surfaces.

This is the V3-05 follow-up inventory, restricted to the 3 apps the conductor verified
still had residual theater on `care.henrycogroup.com` and `property.henrycogroup.com`.
Each hit is classified A (real in-flight; rephrase or migrate to skeleton), B (decorative;
DELETE), or C (mis-coded empty/error). The chosen fix is recorded per item.

The full repo scan (`scripts/v3/loading-theater-inventory.mjs`) reports 208 string
matches across apps + packages; the vast majority are sub-component pending-state copy
that V3-05 already cleared. This document covers ONLY the residual surfaces specified
in `docs/v3/prompts/fix-loading-theater-property-account-care.md`.

---

## Property

### `apps/property/lib/public-copy.ts` — STRUCTURAL "warming" lane (highest-impact)

3 i18n keys × 12 locales = **36 string entries** plus the type declarations:

- `home.inventorySnapshot.managedPortfolioWarmingHint` (12 locales) — hint shown
  under the **Managed portfolio** stat tile when `managedRecords.length === 0`.
  This is the **empty state**, not a loading state. The "warming up" verbiage
  fakes activity while the database is empty.
  **Class B → DELETE.** Render no hint when the count is zero; the `0` is the truth.
- `home.managedAside.warmingEyebrow` + `home.managedAside.warmingBody` (12 locales each)
  — used as the entire `else` branch in the managed-operating-lane section of the
  home page (`apps/property/app/(public)/page.tsx` ~L647). Renders a verbose
  "managed lane warming up... the catalog appears when the work does" paragraph
  when `localizedServices.length === 0`.
  **Class B → DELETE.** When services are empty, render NOTHING. The numerical
  aside on the right of the same row still publishes (`activeEngagements: 0`,
  `inPipeline: 0`, `combinedValue: —`); zeros are the truth, not warmup text.

Owner directive (verbatim, from prompt): _"no empty dashboards pretending to be active
systems."_ Option A chosen: delete the warming lane + its 36 i18n entries + the
2 consuming JSX blocks + the 2 type lines.

### `apps/property/app/account/loading.tsx`

Already cleaned at the source layer in V3-05 (subtitle theater removed; renders
property-shimmer divs). The conductor's spec calls for migrating to the canonical
`<StructuredSkeleton variant="card-list" />` primitive so the property shell uses
the same V3-05 telemetry-aware skeleton as the rest of the platform.
**Class A → migrate to StructuredSkeleton.**

---

## Care

### `apps/care/components/ui/CareLoading.tsx`

- L86: default `title` = `"Preparing your Care experience"` (theater).
  **Class B → DELETE the default.** Every call site (`(staff)/owner/loading.tsx`,
  `(staff)/support/inbox/loading.tsx`, `TrackLookupClient.tsx` x2) passes an explicit
  `title`; the default is dead code that exists only to render warmup copy if a future
  caller omits the prop. Drop it; if the prop is missing, render no title.
- L132-138: default `bullets` rotation
  `["Loading your bookings", "Checking delivery status", "Preparing your dashboard"]`.
  **Class B → DELETE the default rotation.** Same dead-default story. If a caller
  passes no bullets, render no bullets row. Three of those four strings trip
  the V3-05 gate.

### `apps/care/components/care/TrackLookupClient.tsx`

- L388-403: in-flight lookup stage (after the user enters a tracking code). Bullets
  already partially cleaned in V3-05 (`"Fetching the service timeline"`,
  `"Confirming the next verified handoff"`). Genuine **Class A**.
- L665-676: post-lookup (no booking + no error) settlement panel. Bullets contain
  `"Loading booking identity"` + `"Preparing your next-step guidance"`. Genuine
  Class A in-flight state, but the verbs trip the V3-05 gate.
  **Class A → rephrase per V3-05 precedent.** `Loading booking identity` →
  `Fetching booking identity`. `Preparing your next-step guidance` → `Confirming
  your next-step guidance`. Matches the L399-401 precedent the agent established.
- L670: `t("Preparing service status and timeline details.")` description.
  **Class A → rephrase.** → `t("Confirming service status and timeline details.")`.

---

## Account

### `apps/account/app/(account)/learn/loading.tsx`

Already cleaned (V3-05). Renders `<AccountRouteLoading title="Learn" />`. The wrapper
`AccountRouteLoading` is already a `StructuredSkeleton` consumer — the title prop is
ignored at the visible layer and used only for telemetry surface id. **No action.**

### Other `apps/account/app/**/loading.tsx`

All 12 nested loading.tsx files inspected:

- `app/loading.tsx`, `(account)/loading.tsx`, `(account)/jobs/loading.tsx`,
  `(account)/wallet/loading.tsx`, `(account)/studio/loading.tsx`,
  `(account)/learn/loading.tsx`, `(account)/notifications/loading.tsx`,
  `(account)/support/loading.tsx` — all use `<AccountRouteLoading />`. Clean.
- `(account)/calendar/loading.tsx`, `(account)/care/loading.tsx`,
  `(account)/logistics/loading.tsx`, `(account)/messages/loading.tsx` — these
  are not AccountRouteLoading-based; need to inspect for theater. (Inspection
  done — none contain Loading X / Preparing X / Warming up. **No action.**)

### `apps/marketplace/app/account/loading.tsx`

Already cleaned (V3-05). Renders `<PublicHomeSkeleton variant="site" />`. **No action.**

---

## Out of scope (verified clean or owner-reserved)

- `packages/search-ui/` — OWNER-RESERVED; no edits.
- `apps/account/lib/cloudinary.ts` — destructive prohibition; no edits.
- All other `apps/care`, `apps/property`, `apps/account` files: `CareLoadingGlyph`
  is a branded amber dot used for inline-button pending states; that is **not theater**
  (it's a glyph, no verb). Same with `LoadingSkeleton` from `@henryco/dashboard-shell`
  used in `apps/account/components/{smart-home,modules}/...` — shape-only skeleton,
  no warmup verb.

---

## Summary of file changes

| File | Change | Class |
|---|---|---|
| `apps/property/lib/public-copy.ts` | Delete 3 keys × 12 locales (36 entries) + 3 type lines | B |
| `apps/property/app/(public)/page.tsx` | Delete 2 consuming JSX blocks (hint + warming-lane fallback) | B |
| `apps/property/app/account/loading.tsx` | Migrate to `<StructuredSkeleton variant="card-list" />` | A |
| `apps/care/components/ui/CareLoading.tsx` | Drop default `title` + default `bullets` rotation | B |
| `apps/care/components/care/TrackLookupClient.tsx` | Rephrase 3 in-flight verbs | A |

All other files in scope: verified clean by V3-05; no action.
