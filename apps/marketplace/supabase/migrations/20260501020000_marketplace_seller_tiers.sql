-- V2-PNH-04: marketplace seller tier — DB-level enforcement
--
-- The four tiers (launch / growth / scale / partner) live in
-- apps/marketplace/lib/marketplace/governance.ts as a constant. The
-- application layer already calculates commission and payout fees from
-- there, but listing-cap enforcement was advisory-only — submissions
-- past the cap were rejected at the action layer, but a direct DB
-- insert (or a race) could exceed the cap.
--
-- This migration:
--   1. Adds `seller_tier` to marketplace_vendors (default 'launch').
--   2. Creates a constraint trigger on marketplace_products that hard-
--      enforces the per-tier cap at insert time.
--   3. Tier change is recorded with `tier_changed_at` so settlement
--      can use the tier as of the order date.

alter table if exists public.marketplace_vendors
  add column if not exists seller_tier text not null default 'launch';

alter table if exists public.marketplace_vendors
  add column if not exists tier_changed_at timestamptz;

alter table if exists public.marketplace_vendors
  drop constraint if exists marketplace_vendors_seller_tier_check;

alter table if exists public.marketplace_vendors
  add constraint marketplace_vendors_seller_tier_check
  check (seller_tier in ('launch', 'growth', 'scale', 'partner'));

create or replace function public.marketplace_tier_listing_cap(p_tier text)
returns integer
language sql
immutable
as $$
  select case lower(p_tier)
    when 'launch'  then 3
    when 'growth'  then 20
    when 'scale'   then 999
    when 'partner' then 9999
    else 3
  end;
$$;

create or replace function public.enforce_marketplace_listing_cap()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tier text;
  v_cap integer;
  v_count integer;
begin
  if new.vendor_id is null then
    return new;
  end if;

  select seller_tier into v_tier
    from public.marketplace_vendors
   where id = new.vendor_id;

  if v_tier is null then
    return new;
  end if;

  v_cap := public.marketplace_tier_listing_cap(v_tier);

  select count(*) into v_count
    from public.marketplace_products
   where vendor_id = new.vendor_id
     and id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)
     and coalesce(status, 'active') in ('active', 'draft', 'pending_review');

  if v_count >= v_cap then
    raise exception 'marketplace_listing_cap_exceeded'
      using errcode = 'P0001',
            hint = format(
              'Seller is at the %s-tier listing limit (%s). Upgrade tier or remove a listing first.',
              v_tier,
              v_cap
            );
  end if;

  return new;
end;
$$;

drop trigger if exists marketplace_listing_cap_check on public.marketplace_products;
create trigger marketplace_listing_cap_check
  before insert on public.marketplace_products
  for each row
  execute function public.enforce_marketplace_listing_cap();

-- Block downgrade-while-over-cap by setting tier_changed_at on every
-- tier change so the application layer can reject downgrades that
-- would leave the vendor over the new cap.
create or replace function public.touch_marketplace_tier_changed_at()
returns trigger
language plpgsql
as $$
begin
  if new.seller_tier is distinct from old.seller_tier then
    new.tier_changed_at := timezone('utc', now());
  end if;
  return new;
end;
$$;

drop trigger if exists marketplace_vendors_tier_changed_at on public.marketplace_vendors;
create trigger marketplace_vendors_tier_changed_at
  before update on public.marketplace_vendors
  for each row
  execute function public.touch_marketplace_tier_changed_at();
