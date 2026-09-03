-- V3 PASS 21 — marketplace product variants matrix polish
--
-- The base `marketplace_product_variants` table already exists from
-- the init migration. This pass formalises the variant-matrix shape
-- (color × size × material) used by <VariantMatrix> on product detail
-- and the vendor product editor:
--
--   options jsonb — { "color": "Cobalt", "size": "M", "material": "Linen" }
--                   keys are free-form so vendors can ship arbitrary axes;
--                   front-end coerces the first 1–3 axes to selectors.
--
-- We add an explicit linkage to a primary media row per variant so the
-- gallery can swap photo on variant change without joining through
-- product media every time.

alter table if exists public.marketplace_product_variants
  add column if not exists currency text not null default 'NGN',
  add column if not exists media_id uuid references public.marketplace_product_media(id) on delete set null,
  add column if not exists axis_color text generated always as (
    nullif(options->>'color','')
  ) stored,
  add column if not exists axis_size text generated always as (
    nullif(options->>'size','')
  ) stored,
  add column if not exists axis_material text generated always as (
    nullif(options->>'material','')
  ) stored,
  add column if not exists low_stock_threshold integer not null default 3,
  add column if not exists sort_order integer not null default 0;

alter table public.marketplace_product_variants
  drop constraint if exists marketplace_product_variants_status_check;
alter table public.marketplace_product_variants
  add constraint marketplace_product_variants_status_check
  check (status in ('active','draft','archived','out_of_stock'));

create index if not exists marketplace_product_variants_axis_color_idx
  on public.marketplace_product_variants (product_id, axis_color);
create index if not exists marketplace_product_variants_axis_size_idx
  on public.marketplace_product_variants (product_id, axis_size);
create index if not exists marketplace_product_variants_low_stock_idx
  on public.marketplace_product_variants (product_id)
  where stock <= low_stock_threshold;

create unique index if not exists marketplace_product_variants_sku_unique_idx
  on public.marketplace_product_variants (product_id, sku);
