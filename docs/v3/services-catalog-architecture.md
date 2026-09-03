# V3-49 — Services Catalog Architecture

**Pass:** V3-49 (product-services-catalog-expansion) · **Phase:** G · **Pillar:** P1
**Status:** built; migration committed-NOT-applied (lands at deploy + 14-day soak).
**Read this before V3-50 (verified providers), V3-51 (smart booking), V3-63 (local discovery).**

This document is the taxonomy contract the downstream Phase-G passes build on. It
describes the generalised, vertical-agnostic services catalog that promotes Henry
Onyx Fabric Care from a single-vertical laundry/cleaning booker into a multi-vertical
services platform — **the catalog and its surfaces only**. It does not build the
provider model, the booking/slot engine, or provider onboarding.

---

## 1. Ground-truth correction (the prompt's audit summary was stale)

The V3-49 prompt's audit summary assumed `apps/care/lib/care-data.ts` reads a real
catalog out of Supabase tables `care_service_categories`, `care_service_types`,
`care_service_packages`, etc. **A read-only check against prod
(`rzkbgwuznmdxnnhmjazy`) showed those tables do not exist** — only `care_pricing`
does. `readCatalogTable()` errors on the missing relations and falls back to the
in-code `DEFAULT_CARE_BOOKING_CATALOG`; **the live Care catalog runs entirely off
the code default.**

Consequences for the design (vs. the prompt's literal S1/S2):
- The `care_service_categories.vertical_id` bridge is a **defensive guarded ALTER**
  (`if to_regclass('public.care_service_categories') is not null then …`) — it is a
  no-op in prod today and activates only if that table is ever materialised.
- There is no `care_service_packages` to backfill from. Instead the seed **populates
  `catalog_services` directly from the canonical catalog content** (the defaults the
  live site already shows + the new expansion verticals) — the same idempotent
  "auto-seed curated catalog" pattern used by marketplace/property/jobs/learn.
- The existing booking path is **untouched** (still reads its code default), so there
  is zero booking regression.

---

## 2. Tables (migration `20260614120000_care_services_catalog_expansion.sql`)

### `public.service_verticals`
A product line grouping. 11 V3 verticals seeded.

| column | type | notes |
|---|---|---|
| `id` | uuid PK | `gen_random_uuid()` |
| `slug` | text unique | `garment-care`, `laundry`, … |
| `name` | text | canonical locale; localized at render (Pattern B) |
| `summary` | text | |
| `icon` | text | lucide icon name (never a URL) |
| `division` | text | default `'care'` — which division app owns the surface |
| `display_order` | integer | |
| `status` | text | `active` \| `draft` \| `retired` |
| `created_at` / `updated_at` | timestamptz | `set_updated_at()` trigger |

### `public.catalog_services`
Canonical, vertical-agnostic service row.

| column | type | notes |
|---|---|---|
| `id` | uuid PK | |
| `vertical_id` | uuid FK → `service_verticals(id)` on delete restrict | |
| `slug` | text unique | bookable cleaning rows reuse the live booking-package slug |
| `name` / `summary` / `description` | text | localized at render |
| `pricing_model` | jsonb | display hint, **validated by `@henryco/pricing`** (`{ "kind": "flat" \| "from" \| "quote" }`) — not a quote engine |
| `base_price_minor` | bigint | **integer minor units (kobo)** = naira × 100; null ⇒ price on request |
| `currency` | text | default `'NGN'` |
| `duration_minutes` | integer | nullable |
| `provider_supplied` | boolean | true ⇒ fulfilled by a V3-50 verified provider |
| `source_table` / `source_id` | text / uuid | bind a backfilled Care package (`source_table='care_service_packages'`); unique index where `source_id is not null` |
| `status` | text | `active` \| `draft` \| `retired` |
| `created_at` / `updated_at` | timestamptz | `set_updated_at()` trigger |

**RLS (mirrors `care_garment_types`):** public reads `status = 'active'`; writes gated
on `public.is_platform_staff() OR public.is_staff_in('care')` (the org-wide predicate
**excludes** care, so the care predicate is OR-ed in); service role full. `auth.*`
calls are `(select auth.*)` initplan-wrapped. Default Supabase privileges grant
anon/authenticated table access — RLS is the gate (verified prod↔shadow).

---

## 3. Money

`base_price_minor` is **kobo** (minor units). The legacy Care booking `base_price`
is naira-major; the conversion is **× 100**. Render with `formatMoney(minor, "NGN")`
from `@henryco/i18n/currency` (kobo-aware) — never the care-local `₦${n}` formatter
(which would 100× the value). `pricing_model` is normalised via
`normalizeServicePricingModel` and resolved via `describeServicePrice`
(`@henryco/pricing`), never parsed ad hoc.

---

## 4. Surfaces

| surface | route | reads |
|---|---|---|
| Care directory (redesigned) | `apps/care/app/(public)/services/page.tsx` | `getServicesCatalog()` |
| Care vertical landing | `apps/care/app/(public)/services/[verticalSlug]/page.tsx` | `getServicesCatalog()` |
| Care service detail | `apps/care/app/(public)/services/[verticalSlug]/[serviceSlug]/page.tsx` | `getServicesCatalog()` |
| Hub cross-listing | `apps/hub/app/(site)/services/page.tsx` | `getServiceVerticals()` (anon, mirrors `divisions.ts`) |

- Data layer: `getServicesCatalog()` (`apps/care/lib/care-data.ts`) reads active rows,
  falls back to the in-code default (`apps/care/lib/services-catalog.ts`) — **so the
  surfaces render the real catalog even before the migration is applied to prod.**
  Hub mirrors this with `FALLBACK_VERTICALS` in `apps/hub/app/lib/services-catalog.ts`.
- Hub cross-links resolve via `henryDomain('care', '/services/<slug>')` — zero
  hardcoded domains in TS.
- The detail-page CTA deep-links `/book?service=<slug>`. The book page reads the
  param, shows a calm context note, and emits `henry.services.booking.started`. **No
  booking logic is added — slot/provider preselection is V3-51's engine.** The
  bookable cleaning services carry the live package slug so V3-51's preselection can
  resolve it.

---

## 5. Search

- Collection `hc_services` (division `care`, public) in
  `packages/search-core/src/collections.ts`, with `vertical` + `provider_supplied`
  facets.
- Hit type `care_service` added in lockstep to **both** unions:
  `packages/intelligence/src/search.ts` (`CrossDivisionSearchType`) and
  `packages/search-core/src/schema.ts` (`searchTypeSchema`).
- Sync: trigger `tg_catalog_services_to_outbox()` on `catalog_services`
  (insert/update/retire/delete) builds the full `SearchDocument` payload and calls
  `public.enqueue_search_index_op('hc_services', …)` — mirroring
  `tg_workflow_targets_to_outbox`. The search worker drains the outbox. Guarded with
  `to_regprocedure` so it no-ops where the outbox is not installed.
- `searchDocumentSchema` gained optional `vertical` / `provider_supplied` so the
  facets survive the outbox drain (the schema strips unknown keys).
- Ranking (`ranking.ts`) now consumes `ranking_signals.popularity` (was unused), so
  featured/popular services can surface higher. Service hits otherwise score through
  the type-agnostic `scoreIndexedHit` (text match, division boost, recency, trust).
- `document_id` convention: `care:care_service:<catalog_services.id>`.

---

## 6. Telemetry

Three names in the `HenryEventName` union (`packages/observability/src/events.ts`),
emitted server-side, slug + division only (no PII):
`henry.services.catalog.viewed`, `henry.services.service.viewed`,
`henry.services.booking.started`. Wrapper: `apps/care/lib/services-telemetry.ts`.

---

## 7. i18n

- Static labels: typed-copy module `packages/i18n/src/services-copy.ts`
  (`getServicesCopy` / `ServicesCopy`), registered in `server.ts` + `index.ts`.
- Dynamic, DB-sourced vertical/service names render via
  `resolveLocalizedDynamicField` (Pattern B runtime fallback).

---

## 8. The 11 verticals + seeded services

Seed: `20260614120500_care_services_catalog_seed.sql` (idempotent on `slug`).

| vertical | services (slugs) | source-bound? |
|---|---|---|
| `garment-care` | dry-cleaning-essentials, pressing-and-finishing, stain-and-delicate-care | — |
| `laundry` | wash-dry-fold, bulk-laundry-service, ironing-service | — |
| `home-cleaning` | signature-home-refresh, weekly-home-ritual | `care_service_packages` |
| `office-cleaning` | office-starter, office-growth, after-hours-command | `care_service_packages` |
| `deep-cleaning` | deep-reset, move-in-move-out-clean | partial (`deep-reset`) |
| `repairs` | home-repairs-handyman, appliance-fitting | provider-supplied |
| `errands` | personal-errands, pickup-and-dropoff | — |
| `moving` | home-move-support, packing-service | partial (provider) |
| `event-support` | event-setup-and-cleanup, event-staffing | event-staffing provider |
| `business-support` | recurring-facility-care, business-concierge | — |
| `provider-assisted` | specialist-deep-clean, verified-specialist-service | provider-supplied |

25 services total. `provider_supplied = true` rows show a "Verified providers coming
soon" empty-state (until V3-50). `pricing_model.kind = "quote"` rows
(`event-staffing`, `verified-specialist-service`) carry `base_price_minor = null` and
render "Price on request".

---

## 9. Hand-off

- **V3-50 (verified providers):** extends `catalog_services.provider_supplied`; the
  detail page's providers slot is the empty-state to fill. Build the provider model +
  a staff catalog-management surface (the `writeAuditLog` hook attaches there — V3-49
  added no staff write surface, so no audit writer is wired yet).
- **V3-51 (smart booking):** the book CTA carries `?service=<slug>`; wire
  slot/provider preselection in `BookPickupForm` (bookable cleaning slugs already map
  to live packages). This is where the catalog meets the money path — **gated on the
  soak completing.**
- **V3-63 (local discovery):** searches `hc_services` (+ V3-38 local availability).

---

## 10. Deploy state

Migration + seed are **committed, not yet applied to prod** (mid-soak caution). Both
were rehearsed twice (clean apply + idempotency) on a prod-shape shadow
(`build-shadow-db.mjs` reset/bootstrap/apply-prod, then the two migrations), with
count/money/RLS/trigger assertions and a Zod validation of the emitted search doc.
The surfaces degrade honestly to the in-code default until the migration applies, so
the merge is safe pre-apply. Apply the migration, then begin the 14-day soak on the
live catalog surfaces before V3-50 builds on it.
