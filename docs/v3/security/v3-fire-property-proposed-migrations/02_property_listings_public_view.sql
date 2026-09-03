-- PROP-5 (DB, latent) — The `public can read approved listings` policy on property_listings returns
-- ALL columns to anon for approved+public rows, including owner PII (owner_email/owner_phone/
-- owner_name/normalized_email/address_line). This is NOT a live leak today (the table has 0 rows;
-- the app stores listings in the private property-runtime Storage bucket), but if the relational
-- table is ever populated it would expose landlord PII to any anon PostgREST caller.
--
-- Fix-if-populated: serve the public listing surface through a PII-stripped view and revoke the anon
-- row read on the base table.

drop policy if exists "public can read approved listings" on public.property_listings;
-- (retain: "owners can read own listings", "owners can update own listings", "staff can manage listings")

create or replace view public.property_listings_public
  with (security_invoker = on) as
  select
    id, slug, title, summary, description, property_type, listing_type,
    price, currency, price_interval, bedrooms, bathrooms, area_sqm,
    city, state, neighborhood,            -- coarse location only, NOT address_line
    gallery, amenities_summary, featured, created_at, status, visibility
    -- DELIBERATELY OMITTED: owner_name, owner_email, owner_phone, normalized_email, owner_user_id, address_line
  from public.property_listings
  where status = 'approved' and visibility = 'public';

-- The public site reads property_listings_public; owners/staff read the base table via their policies.
-- Confirm exact column names against prod before applying.
