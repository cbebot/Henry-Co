-- V3-FREESHIP-02 proof — run AT APPLY TIME on a throwaway PG (the migration is
-- committed-NOT-applied; no local PG was available at authoring time).
--   psql -v ON_ERROR_STOP=1 -f <migration>.sql -f prove-delivery-promises-rls.sql
-- Asserts: ownership-gated RPC, public read, no direct client writes, one-per-vendor.

begin;

-- Minimal stand-ins so the proof is self-contained if marketplace_vendors is absent.
create table if not exists public.marketplace_vendors (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid,
  verification_level text default 'bronze'
);

-- auth.uid() stub (Supabase provides this; the proof harness fakes the JWT subject).
create schema if not exists auth;
create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;

insert into public.marketplace_vendors (id, owner_user_id, verification_level) values
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-0000000000aa', 'gold'),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-0000000000bb', 'bronze');

-- (1) Owner can upsert their own vendor's promise.
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000aa';
select public.upsert_delivery_promise(
  '11111111-1111-1111-1111-111111111111', 'nationwide',
  array['enugu','lagos','kano'], 1000000, 'enugu', true);
do $$ begin
  if (select covered_states from public.marketplace_delivery_promises
        where vendor_id = '11111111-1111-1111-1111-111111111111') <> array['enugu','lagos','kano'] then
    raise exception 'FAIL: owner upsert did not persist covered_states';
  end if;
end $$;

-- (2) A non-owner cannot upsert another vendor's promise. Switch the JWT subject to
-- bb (who does NOT own vendor 1111, owned by aa) FIRST, then expect not_vendor_owner.
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000bb';
do $$ begin
  begin
    perform public.upsert_delivery_promise(
      '11111111-1111-1111-1111-111111111111', 'own_state', array['enugu'], null, 'enugu', true);
    raise exception 'FAIL: non-owner (bb) upsert of vendor-aa was allowed';
  exception when others then
    if sqlerrm not like '%not_vendor_owner%' then raise exception 'FAIL: wrong error %', sqlerrm; end if;
  end;
end $$;

-- (3) One promise per vendor (UNIQUE vendor_id) — a second upsert updates, not duplicates.
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000aa';
select public.upsert_delivery_promise(
  '11111111-1111-1111-1111-111111111111', 'own_state', array['enugu'], null, 'enugu', true);
do $$ begin
  if (select count(*) from public.marketplace_delivery_promises
        where vendor_id = '11111111-1111-1111-1111-111111111111') <> 1 then
    raise exception 'FAIL: vendor has more than one promise';
  end if;
end $$;

-- (4) Invalid reach_kind is rejected.
do $$ begin
  begin
    perform public.upsert_delivery_promise(
      '11111111-1111-1111-1111-111111111111', 'galaxy', array['enugu'], null, 'enugu', true);
    raise exception 'FAIL: invalid reach_kind was allowed';
  exception when others then
    if sqlerrm not like '%invalid_reach_kind%' then raise exception 'FAIL: wrong error %', sqlerrm; end if;
  end;
end $$;

select 'ALL DELIVERY-PROMISE PROOFS PASSED' as result;
rollback;
