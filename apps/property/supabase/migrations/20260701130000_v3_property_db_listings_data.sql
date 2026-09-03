-- V3 property Stage 1 — Storage-JSON → Postgres listings migration (non-breaking).
--
-- Adds a JSONB `data` column to property_listings holding the FULL PropertyListing object.
-- Property stores each listing as a whole JSON record (today in the private `property-runtime`
-- Storage bucket); this moves that record into Postgres without a lossy column-by-column schema.
-- The existing relational columns (slug / status / visibility / kind / price / owner_user_id /
-- henry_onyx_verified) stay the queryable + badge + ownership surface; `data` carries the rich
-- nested shape (gallery, amenities, feeBreakdown, risk, …).
--
-- Additive + idempotent. Flag-gated at the app layer (PROPERTY_DB_LISTINGS): reads fall back to
-- the Storage snapshot whenever the table is empty, so the live site is identical to today until
-- the data is backfilled + the flag is turned on.

alter table public.property_listings
  add column if not exists data jsonb;

-- Public browse/detail filter on status + visibility; index them for the DB-backed read path.
create index if not exists property_listings_public_idx
  on public.property_listings (visibility, status);
create index if not exists property_listings_owner_idx
  on public.property_listings (owner_user_id);
