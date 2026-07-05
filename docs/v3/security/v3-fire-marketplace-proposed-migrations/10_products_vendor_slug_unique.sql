-- F-04 — cross-vendor product takeover via upsert(onConflict:"slug").
-- PRIMARY FIX IS APP-LAYER (route.ts vendor_product_upsert): before upserting, look up the
-- existing row's vendor_id by slug and REJECT if it exists and differs from the caller's
-- vendor; never let the conflict update reassign vendor_id. Keeping slug globally unique
-- preserves the /product/[slug] URL contract.
--
-- This file is therefore mostly a guardrail / optional defense. A DB-only composite-unique
-- (vendor_id, slug) is NOT recommended because it would allow two vendors to share a slug
-- and break product URLs. Instead, optionally add a trigger that blocks vendor_id changes
-- on UPDATE of marketplace_products (so even a buggy upsert cannot steal a row):

create or replace function public.marketplace_block_vendor_reassign()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE'
     and old.vendor_id is not null
     and new.vendor_id is distinct from old.vendor_id then
    raise exception 'vendor_id reassignment is not allowed (product %)', old.id
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists marketplace_products_no_vendor_reassign on public.marketplace_products;
create trigger marketplace_products_no_vendor_reassign
  before update on public.marketplace_products
  for each row execute function public.marketplace_block_vendor_reassign();

-- NOTE: even with this trigger, the app must still reject cross-vendor slug collisions so a
-- vendor cannot overwrite another vendor's title/price/media (the trigger only protects the
-- vendor_id column). Implement the app-layer pre-check as the primary fix.
