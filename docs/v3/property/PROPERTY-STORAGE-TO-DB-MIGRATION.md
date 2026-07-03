# Property listings: Storage-JSON → Postgres migration (staged, non-breaking)

**Date:** 2026-07-01 · **Owner-approved direction** (to connect the "Henry Onyx Verified" badge
buyer-visibly, PR #366). **Top constraint: the live property site must never break** — every stage
is additive/fallback-gated and independently shippable.

## Why this exists

Property's listing model is **Storage-JSON**, not relational: `apps/property/lib/property/store.ts`
reads `listings/{id}.json` from the private `property-runtime` bucket (`listJsonCollection`), writes
via `upsertPropertyListing` (`writeJsonRecord`), and **bootstraps the bucket from
`demoPropertySnapshot`** on first read. The `property_listings` table exists but is **unused (0-rows)**.
The public page (`getPropertyBySlug` → `readPropertyRuntimeSnapshot`) reads the snapshot, so the
DB-column `henry_onyx_verified` badge from PR #366 has no path to a buyer. This migrates the listing
model onto Postgres so the badge (and future relational features) connect.

**Scope reality:** this is a **complete data-layer rewrite** of the property app — ~15 snapshot
collections, all public pages (home/search/area/managed/[slug]), owner/admin pages, the
`PropertyListing` type ↔ DB mapping, media (`media://` refs stay in the `property-media`/
`property-documents` buckets — only listing *metadata* moves to DB), and a one-time data migration.
It is a standalone project, executed in focused sessions — not a quick change.

## Non-breaking strategy

A **read-fallback + dual-write** cutover so the site is identical to today at every step until the
final flip, gated by a `property_db_listings` flag:
- Reads prefer DB rows, **fall back to the Storage snapshot** when the DB has none (so DB-empty ==
  today).
- Writes **dual-write** (DB + Storage) during transition, then Storage-write is dropped last.
- The demo catalog becomes the **DB seed** (backfilled once), not a runtime bootstrap.

## Stages (each shippable; each verified before the next)

**Stage 0 — DB badge infra (DONE, PR #366).** `property_listings.henry_onyx_verified`(+`_at`),
`property_listing_verifications` audit (RLS deny), `record_property_listing_verification` SECDEF
writer + IDOR guard, verify action. 19/19 PGlite proof. *Held from prod apply.*

**Stage 1 — DB read path + PropertyListing↔DB mapping (additive, fallback).**
- Add `lib/property/db.ts`: `listListingsFromDb()`, `getListingFromDbBySlug(slug)`, mapping
  `property_listings` (+ related `property_listing_media`, `property_listing_amenities`) → the
  `PropertyListing` type. **First task: a field-by-field mapping table** (the type has nested
  arrays/objects; the DB is flat + related tables — this is the crux + main risk).
- `readPropertyRuntimeSnapshot`: when `property_db_listings` is on AND the DB has listings, source
  `listings` from the DB; else the current Storage path (unchanged). Prove parity against the demo
  snapshot in a PGlite/DB test.

**Stage 2 — Owner/admin writes dual-write to DB.** `upsertPropertyListing` writes the DB row
(via the guarded upsert path) in addition to the Storage JSON. Media unchanged (bucket refs). The
listing status/visibility pipeline preserved.

**Stage 3 — One-time backfill.** Idempotent migration script: Storage-JSON listings → `property_listings`
rows (id-stable). Verify row-count + field parity vs the snapshot; dry-run first.

**Stage 4 — Cut over reads to DB (flip the flag).** Public + owner pages read the DB as source of
truth; Storage listing-writes retired; demo becomes DB seed. Verify every property page in both
themes.

**Stage 5 — Badge wiring (the original goal).** Mount the verify panel on the owner's DB-backed
listing edit page (passing the real listing id); surface `henry_onyx_verified` on the public
`property/[slug]` page (integrate with the existing `PropertyVerificationBadge`). i18n + both
themes. Now PR #366's infra connects buyer-visibly. **Then apply the Stage-0 migration to prod.**

## Risks
- **Live-site breakage** — mitigated by read-fallback + dual-write + per-stage verification in both
  themes; never flip reads before parity is proven.
- **Type↔DB mapping fidelity** (nested `PropertyListing` vs flat table + related tables) — the
  Stage-1 mapping table is the gate; round-trip test it.
- **Media refs** — must remain bucket-based (`media://`); only metadata moves. Don't touch the
  media pipeline.
- **Other snapshot collections** (inspections/applications/viewings/…) still ride Storage — out of
  scope here (listings only); keep them on the snapshot until separately migrated.

## Not in this migration
learn (no per-course owner; unsafe SQL guard) and jobs (no posting entity) remain deferred pending
their own entity/authz decisions.
