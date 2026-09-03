-- V3 PASS 21 — Property: virtual tours.
--
-- WHY:
--   Premium listings benefit from a Matterport / Kuula / video walk-through
--   embedded above the photo gallery. This table holds per-listing tour
--   metadata: provider, external URL, optional thumbnail, optional duration.
--
-- ALLOWED PROVIDERS:
--   matterport, kuula, video — keep the enum tight so the CSP allow-list
--   stays predictable.
--
-- RLS:
--   - Tours readable by anyone.
--   - Writable by property staff and the listing owner.
--
-- IDEMPOTENT: yes.

create table if not exists public.property_virtual_tours (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.property_listings(id) on delete cascade,
  provider text not null check (provider in ('matterport', 'kuula', 'video')),
  external_url text not null,
  thumbnail_url text,
  caption text not null default '',
  duration_seconds integer,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_property_virtual_tours_listing
  on public.property_virtual_tours (listing_id, sort_order);

alter table public.property_virtual_tours enable row level security;

drop policy if exists "public can read virtual tours" on public.property_virtual_tours;
create policy "public can read virtual tours"
on public.property_virtual_tours
for select
using (true);

drop policy if exists "staff can manage virtual tours" on public.property_virtual_tours;
create policy "staff can manage virtual tours"
on public.property_virtual_tours
for all
using (public.is_property_staff())
with check (public.is_property_staff());

drop policy if exists "owner can manage own virtual tours" on public.property_virtual_tours;
create policy "owner can manage own virtual tours"
on public.property_virtual_tours
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

drop trigger if exists trg_property_virtual_tours_updated_at
  on public.property_virtual_tours;
create trigger trg_property_virtual_tours_updated_at
before update on public.property_virtual_tours
for each row execute function public.set_updated_at();
