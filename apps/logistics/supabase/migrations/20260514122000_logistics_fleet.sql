-- V3 PASS 21 — Logistics: fleet vehicles, riders, and assignments.
--
-- WHY:
--   Audit DEEP FINDINGS noted "Vehicle / rider / capacity is NOT
--   modelled". Manager workspace needs fleet truth (vehicles + riders
--   + per-shift assignments) and dispatcher workspace needs a capacity
--   heatmap. This is the irreducible logistics-only shape — no other
--   division has a vehicle×rider×time-of-day matrix.
--
-- TABLES:
--   public.logistics_fleet_vehicles (id, license_plate unique,
--     vehicle_type enum, capacity_kg, capacity_volume_m3, status enum,
--     active, created_at, updated_at).
--   public.logistics_fleet_riders (id, user_id fk unique, display_name,
--     status enum, license_class, phone, primary_zone_id fk nullable,
--     active, created_at, updated_at).
--   public.logistics_rider_assignments (id, rider_id fk, vehicle_id fk
--     nullable, shift_starts_at, shift_ends_at, status, notes,
--     created_at).
--
-- RLS:
--   - Service role: full access.
--   - Rider: SELECT own row in riders + own assignments.
--   - Staff (logistics): full read + write on all three tables via
--     is_staff_in('logistics').

create table if not exists public.logistics_fleet_vehicles (
  id uuid primary key default gen_random_uuid(),
  license_plate text not null unique,
  vehicle_type text not null default 'motorcycle',
  capacity_kg numeric not null default 0,
  capacity_volume_m3 numeric not null default 0,
  status text not null default 'available',
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists logistics_fleet_vehicles_status_idx
  on public.logistics_fleet_vehicles (status, active);

create table if not exists public.logistics_fleet_riders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null unique,
  display_name text not null,
  status text not null default 'off_shift',
  license_class text,
  phone text,
  primary_zone_id uuid references public.logistics_zones(id) on delete set null,
  active boolean not null default true,
  trust_score int,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists logistics_fleet_riders_status_idx
  on public.logistics_fleet_riders (status, active);

create table if not exists public.logistics_rider_assignments (
  id uuid primary key default gen_random_uuid(),
  rider_id uuid not null references public.logistics_fleet_riders(id) on delete cascade,
  vehicle_id uuid references public.logistics_fleet_vehicles(id) on delete set null,
  shift_starts_at timestamptz not null,
  shift_ends_at timestamptz not null,
  status text not null default 'scheduled',
  notes text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists logistics_rider_assignments_window_idx
  on public.logistics_rider_assignments (rider_id, shift_starts_at desc);

create index if not exists logistics_rider_assignments_status_idx
  on public.logistics_rider_assignments (status, shift_starts_at);

-- RLS

alter table public.logistics_fleet_vehicles enable row level security;
alter table public.logistics_fleet_riders enable row level security;
alter table public.logistics_rider_assignments enable row level security;

drop policy if exists "fleet vehicles: service role" on public.logistics_fleet_vehicles;
create policy "fleet vehicles: service role"
  on public.logistics_fleet_vehicles
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "fleet vehicles: staff" on public.logistics_fleet_vehicles;
create policy "fleet vehicles: staff"
  on public.logistics_fleet_vehicles
  for all
  using (public.is_staff_in('logistics'))
  with check (public.is_staff_in('logistics'));

drop policy if exists "fleet riders: service role" on public.logistics_fleet_riders;
create policy "fleet riders: service role"
  on public.logistics_fleet_riders
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "fleet riders: self read" on public.logistics_fleet_riders;
create policy "fleet riders: self read"
  on public.logistics_fleet_riders
  for select
  using (user_id = auth.uid());

drop policy if exists "fleet riders: staff" on public.logistics_fleet_riders;
create policy "fleet riders: staff"
  on public.logistics_fleet_riders
  for all
  using (public.is_staff_in('logistics'))
  with check (public.is_staff_in('logistics'));

drop policy if exists "rider assignments: service role" on public.logistics_rider_assignments;
create policy "rider assignments: service role"
  on public.logistics_rider_assignments
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "rider assignments: self read" on public.logistics_rider_assignments;
create policy "rider assignments: self read"
  on public.logistics_rider_assignments
  for select
  using (
    exists (
      select 1
      from public.logistics_fleet_riders r
      where r.id = logistics_rider_assignments.rider_id
        and r.user_id = auth.uid()
    )
  );

drop policy if exists "rider assignments: staff" on public.logistics_rider_assignments;
create policy "rider assignments: staff"
  on public.logistics_rider_assignments
  for all
  using (public.is_staff_in('logistics'))
  with check (public.is_staff_in('logistics'));

comment on table public.logistics_fleet_vehicles is
  'V3 PASS 21 — fleet vehicle inventory. License plate is the unique business key. '
  'RLS: staff full read/write, service role full access. Vehicles are not '
  'customer-visible.';

comment on table public.logistics_fleet_riders is
  'V3 PASS 21 — rider directory (operator-side). user_id points to the auth.users '
  'row that the rider signs in with. RLS: rider may SELECT own row; staff full '
  'read/write.';

comment on table public.logistics_rider_assignments is
  'V3 PASS 21 — rider × vehicle × shift assignment ledger. Capacity heatmap on '
  'the dispatcher workspace reads this table. RLS: rider sees own assignments; '
  'staff full read/write.';

-- end of migration --
