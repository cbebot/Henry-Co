-- V3-FREESHIP-02 — seller Delivery Promises (location-aware free delivery).
--
-- A seller publishes one promise per store: "free delivery to {covered_states},
-- on orders from {min_order}". The covered_states are computed app-side
-- (resolveCoveredStates, tier-clamped to the seller's KYC verification_level:
-- bronze=own state, silver=geopolitical zone, gold=nationwide) and are RE-CLAMPED
-- at checkout to the seller's CURRENT verification_level — that checkout re-clamp
-- is the money-safety guarantee (a forged/stale over-reach set is never honored).
--
-- Money posture: a promise only WAIVES the buyer's delivery line (deliveryAmount 0
-- through the proven V3-FREESHIP waiver). No new on-platform money flow; the seller
-- absorbs delivery off-platform. Committed-NOT-applied (owner-gated apply).

create table if not exists public.marketplace_delivery_promises (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null unique references public.marketplace_vendors(id) on delete cascade,
  reach_kind text not null check (reach_kind in ('own_state', 'own_zone', 'states', 'nationwide')),
  covered_states text[] not null default '{}',
  min_order_minor bigint check (min_order_minor is null or min_order_minor >= 0),
  origin_state text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists marketplace_delivery_promises_vendor_active_idx
  on public.marketplace_delivery_promises (vendor_id)
  where is_active;

alter table public.marketplace_delivery_promises enable row level security;

-- Public read: badges are computed from these rows; every column is non-sensitive.
drop policy if exists delivery_promises_public_read on public.marketplace_delivery_promises;
create policy delivery_promises_public_read
  on public.marketplace_delivery_promises
  for select
  using (true);

-- No direct writes from clients — all writes go through upsert_delivery_promise,
-- which enforces vendor ownership. (service_role bypasses RLS for admin paths.)
revoke insert, update, delete on public.marketplace_delivery_promises from anon, authenticated;

-- Grant-locked, ownership-checked upsert. The caller passes the app-computed
-- (tier-clamped) covered_states; this function guarantees the caller OWNS the vendor
-- and that the shape is valid, then persists the single per-vendor promise.
-- (A server-side re-derivation of the tier ceiling in SQL is a documented hardening
-- follow-on; the checkout re-clamp already makes the money path safe.)
create or replace function public.upsert_delivery_promise(
  p_vendor_id uuid,
  p_reach_kind text,
  p_covered_states text[],
  p_min_order_minor bigint,
  p_origin_state text,
  p_is_active boolean
)
returns public.marketplace_delivery_promises
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_owner uuid;
  v_row public.marketplace_delivery_promises;
begin
  select owner_user_id into v_owner
    from public.marketplace_vendors
   where id = p_vendor_id;

  if v_owner is null or v_owner is distinct from auth.uid() then
    raise exception 'not_vendor_owner' using errcode = 'P0001';
  end if;

  if p_reach_kind not in ('own_state', 'own_zone', 'states', 'nationwide') then
    raise exception 'invalid_reach_kind' using errcode = 'P0001';
  end if;

  if p_origin_state is null or length(trim(p_origin_state)) = 0 then
    raise exception 'origin_state_required' using errcode = 'P0001';
  end if;

  if p_min_order_minor is not null and p_min_order_minor < 0 then
    raise exception 'invalid_min_order' using errcode = 'P0001';
  end if;

  insert into public.marketplace_delivery_promises
    (vendor_id, reach_kind, covered_states, min_order_minor, origin_state, is_active, updated_at)
  values
    (p_vendor_id, p_reach_kind, coalesce(p_covered_states, '{}'),
     p_min_order_minor, lower(trim(p_origin_state)), coalesce(p_is_active, true), timezone('utc', now()))
  on conflict (vendor_id) do update set
    reach_kind      = excluded.reach_kind,
    covered_states  = excluded.covered_states,
    min_order_minor = excluded.min_order_minor,
    origin_state    = excluded.origin_state,
    is_active       = excluded.is_active,
    updated_at      = timezone('utc', now())
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.upsert_delivery_promise(uuid, text, text[], bigint, text, boolean) from public;
grant execute on function public.upsert_delivery_promise(uuid, text, text[], bigint, text, boolean) to authenticated;

create or replace function public.touch_delivery_promise_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists marketplace_delivery_promises_updated_at on public.marketplace_delivery_promises;
create trigger marketplace_delivery_promises_updated_at
  before update on public.marketplace_delivery_promises
  for each row
  execute function public.touch_delivery_promise_updated_at();
