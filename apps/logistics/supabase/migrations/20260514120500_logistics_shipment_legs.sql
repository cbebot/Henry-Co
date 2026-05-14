-- V3 PASS 21 — Logistics: multi-leg shipment graph.
--
-- WHY:
--   Today logistics_shipments models a single-leg pickup→drop-off run.
--   Audit DEEP FINDINGS noted that multi-leg, hub-routed shipments
--   are NOT modelled — a parcel that goes pickup → hub → drop-off needs
--   per-leg assignment, status, and rider attribution. This table is
--   the irreducible "operator-side" data structure other divisions do
--   not need.
--
-- TABLE:
--   public.logistics_shipment_legs (id, shipment_id fk, leg_index int,
--   origin_kind, dest_kind, origin_address_snapshot jsonb,
--   dest_address_snapshot jsonb, status enum, rider_user_id fk
--   nullable, started_at, completed_at, eta_at, notes, created_at,
--   updated_at).
--
-- RLS:
--   - Service role: full access.
--   - Authenticated owner: SELECT legs for own shipments
--     (joined via logistics_shipments.customer_user_id).
--   - Rider: SELECT legs assigned to them; UPDATE only status +
--     completed_at on their own assigned legs.
--   - Staff (logistics): SELECT all + WRITE via is_staff_in('logistics').
--
-- DOWN:
--   drop policy "logistics legs: service role" on public.logistics_shipment_legs;
--   drop policy "logistics legs: owner read" on public.logistics_shipment_legs;
--   drop policy "logistics legs: rider read" on public.logistics_shipment_legs;
--   drop policy "logistics legs: rider update" on public.logistics_shipment_legs;
--   drop policy "logistics legs: staff read" on public.logistics_shipment_legs;
--   drop policy "logistics legs: staff write" on public.logistics_shipment_legs;
--   drop table if exists public.logistics_shipment_legs;

create table if not exists public.logistics_shipment_legs (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.logistics_shipments(id) on delete cascade,
  leg_index int not null default 0,
  origin_kind text not null default 'pickup',
  dest_kind text not null default 'dropoff',
  origin_address_snapshot jsonb not null default '{}'::jsonb,
  dest_address_snapshot jsonb not null default '{}'::jsonb,
  status text not null default 'pending',
  rider_user_id uuid references auth.users(id) on delete set null,
  rider_name text,
  vehicle_id uuid,
  started_at timestamptz,
  completed_at timestamptz,
  eta_at timestamptz,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (shipment_id, leg_index)
);

create index if not exists logistics_shipment_legs_shipment_idx
  on public.logistics_shipment_legs (shipment_id);

create index if not exists logistics_shipment_legs_rider_idx
  on public.logistics_shipment_legs (rider_user_id, status, eta_at)
  where rider_user_id is not null;

create index if not exists logistics_shipment_legs_status_idx
  on public.logistics_shipment_legs (status);

alter table public.logistics_shipment_legs enable row level security;

drop policy if exists "logistics legs: service role" on public.logistics_shipment_legs;
create policy "logistics legs: service role"
  on public.logistics_shipment_legs
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "logistics legs: owner read" on public.logistics_shipment_legs;
create policy "logistics legs: owner read"
  on public.logistics_shipment_legs
  for select
  using (
    exists (
      select 1
      from public.logistics_shipments s
      where s.id = logistics_shipment_legs.shipment_id
        and s.customer_user_id = auth.uid()
    )
  );

drop policy if exists "logistics legs: rider read" on public.logistics_shipment_legs;
create policy "logistics legs: rider read"
  on public.logistics_shipment_legs
  for select
  using (rider_user_id = auth.uid());

drop policy if exists "logistics legs: rider update" on public.logistics_shipment_legs;
create policy "logistics legs: rider update"
  on public.logistics_shipment_legs
  for update
  using (rider_user_id = auth.uid())
  with check (rider_user_id = auth.uid());

drop policy if exists "logistics legs: staff read" on public.logistics_shipment_legs;
create policy "logistics legs: staff read"
  on public.logistics_shipment_legs
  for select
  using (public.is_staff_in('logistics'));

drop policy if exists "logistics legs: staff write" on public.logistics_shipment_legs;
create policy "logistics legs: staff write"
  on public.logistics_shipment_legs
  for all
  using (public.is_staff_in('logistics'))
  with check (public.is_staff_in('logistics'));

comment on table public.logistics_shipment_legs is
  'V3 PASS 21 — multi-leg shipment graph. A logistics_shipments row may have one '
  'or many legs; each leg is a pickup→handoff pair with its own rider, status, and '
  'ETA. The leg_index orders the legs (0 = first pickup, n = final delivery). '
  'RLS: customer reads own legs; rider reads own assigned legs + may UPDATE '
  'status/completed_at on assigned; staff full read+write.';

-- end of migration --
