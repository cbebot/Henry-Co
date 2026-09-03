-- V3 PASS 21 — Property: amenities catalog.
--
-- WHY:
--   The original `property_amenities` table stores amenities directly
--   on a listing as a free-text label. That works for display but cannot
--   power amenity-faceted search, can't be translated, and can't be
--   surfaced in a canonical icon set on the public detail page.
--
--   This migration adds a catalog of canonical amenities
--   (`property_amenity_catalog`) and a join table
--   (`property_listing_amenities`) so a listing can reference shared
--   amenities by id while keeping the legacy `property_amenities`
--   table intact for backwards-compatible writes.
--
-- RLS:
--   - Catalog readable by anyone (anonymous browsing).
--   - Catalog writable by property staff.
--   - Join rows readable by anyone (drives public detail page); writable
--     by property staff and by the listing owner via cascade.
--
-- IDEMPOTENT: yes.

create table if not exists public.property_amenity_catalog (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name jsonb not null default '{}'::jsonb,
  category text not null default 'general' check (
    category in ('general', 'comfort', 'security', 'outdoor', 'connectivity', 'building', 'wellness')
  ),
  icon text not null default 'dot',
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.property_listing_amenities (
  listing_id uuid not null references public.property_listings(id) on delete cascade,
  amenity_id uuid not null references public.property_amenity_catalog(id) on delete cascade,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (listing_id, amenity_id)
);

create index if not exists idx_property_listing_amenities_listing
  on public.property_listing_amenities (listing_id);
create index if not exists idx_property_listing_amenities_amenity
  on public.property_listing_amenities (amenity_id);

alter table public.property_amenity_catalog enable row level security;
alter table public.property_listing_amenities enable row level security;

drop policy if exists "public can read amenity catalog" on public.property_amenity_catalog;
create policy "public can read amenity catalog"
on public.property_amenity_catalog
for select
using (true);

drop policy if exists "staff can manage amenity catalog" on public.property_amenity_catalog;
create policy "staff can manage amenity catalog"
on public.property_amenity_catalog
for all
using (public.is_property_staff())
with check (public.is_property_staff());

drop policy if exists "public can read listing amenities" on public.property_listing_amenities;
create policy "public can read listing amenities"
on public.property_listing_amenities
for select
using (true);

drop policy if exists "staff can manage listing amenities" on public.property_listing_amenities;
create policy "staff can manage listing amenities"
on public.property_listing_amenities
for all
using (public.is_property_staff())
with check (public.is_property_staff());

drop policy if exists "owner can manage own listing amenities" on public.property_listing_amenities;
create policy "owner can manage own listing amenities"
on public.property_listing_amenities
for all
using (
  exists (
    select 1
    from public.property_listings l
    where l.id = listing_id and l.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.property_listings l
    where l.id = listing_id and l.owner_user_id = auth.uid()
  )
);

drop trigger if exists trg_property_amenity_catalog_updated_at
  on public.property_amenity_catalog;
create trigger trg_property_amenity_catalog_updated_at
before update on public.property_amenity_catalog
for each row execute function public.set_updated_at();
