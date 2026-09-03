-- V3 PASS 21 — Property: neighborhood signals.
--
-- WHY:
--   "Distance to school", "distance to transit", "nearby amenity" rows are
--   first-class metadata on the area page and listing detail. Idealista,
--   Zillow, and PropertyGuru ship this; HenryCo Property does not yet.
--
--   Signals are scoped to an area_slug (e.g. "lekki-phase-1") so the
--   same row can power /area/[slug] and any listing inside that area.
--   Listings can additionally cite a custom signal via a listing_id
--   FK, kept null for area-wide signals.
--
-- SIGNAL TYPES:
--   transport — bus, train, ferry, BRT
--   school    — primary, secondary, university
--   amenity   — supermarket, hospital, gym, mosque, church, park
--
-- RLS:
--   - Signals readable by anyone.
--   - Writable by property staff.
--
-- IDEMPOTENT: yes.

create table if not exists public.property_neighborhood_signals (
  id uuid primary key default gen_random_uuid(),
  area_slug text not null,
  listing_id uuid references public.property_listings(id) on delete cascade,
  signal_type text not null check (signal_type in ('transport', 'school', 'amenity')),
  name text not null,
  distance_m integer,
  metadata jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_property_neighborhood_signals_area
  on public.property_neighborhood_signals (area_slug, signal_type, sort_order);
create index if not exists idx_property_neighborhood_signals_listing
  on public.property_neighborhood_signals (listing_id)
  where listing_id is not null;

alter table public.property_neighborhood_signals enable row level security;

drop policy if exists "public can read neighborhood signals"
  on public.property_neighborhood_signals;
create policy "public can read neighborhood signals"
on public.property_neighborhood_signals
for select
using (true);

drop policy if exists "staff can manage neighborhood signals"
  on public.property_neighborhood_signals;
create policy "staff can manage neighborhood signals"
on public.property_neighborhood_signals
for all
using (public.is_property_staff())
with check (public.is_property_staff());

drop trigger if exists trg_property_neighborhood_signals_updated_at
  on public.property_neighborhood_signals;
create trigger trg_property_neighborhood_signals_updated_at
before update on public.property_neighborhood_signals
for each row execute function public.set_updated_at();
