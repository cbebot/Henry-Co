-- V3 PASS 21 — Property: floorplans.
--
-- WHY:
--   The existing listing has a single `floor_plan_url`. Premium property
--   platforms ship multi-floorplan support (ground / first / loft) with
--   sort order and a caption per plan. This migration adds the data
--   surface; the FloorplanViewer component reads from this table.
--
-- RLS:
--   - Floorplans readable by anyone (drives public detail page).
--   - Writable by property staff and the listing owner.
--
-- IDEMPOTENT: yes.

create table if not exists public.property_floorplans (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.property_listings(id) on delete cascade,
  image_url text not null,
  label text not null default '',
  sort_order integer not null default 0,
  area_sqm numeric(10, 2),
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_property_floorplans_listing
  on public.property_floorplans (listing_id, sort_order);

alter table public.property_floorplans enable row level security;

drop policy if exists "public can read floorplans" on public.property_floorplans;
create policy "public can read floorplans"
on public.property_floorplans
for select
using (true);

drop policy if exists "staff can manage floorplans" on public.property_floorplans;
create policy "staff can manage floorplans"
on public.property_floorplans
for all
using (public.is_property_staff())
with check (public.is_property_staff());

drop policy if exists "owner can manage own floorplans" on public.property_floorplans;
create policy "owner can manage own floorplans"
on public.property_floorplans
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

drop trigger if exists trg_property_floorplans_updated_at
  on public.property_floorplans;
create trigger trg_property_floorplans_updated_at
before update on public.property_floorplans
for each row execute function public.set_updated_at();
