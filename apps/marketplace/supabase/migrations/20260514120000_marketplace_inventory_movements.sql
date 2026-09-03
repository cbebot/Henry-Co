-- V3 PASS 21 — marketplace inventory movements ledger
--
-- Append-only ledger of every inventory adjustment on a marketplace
-- product or variant. Anchors the "stock truth" so vendor low-stock
-- alerts, reorder hints, and operator inventory exception queues all
-- read from the same source instead of recomputing from order joins.
--
-- Movement types (free-form text validated by app + check below):
--   restock       — vendor added stock
--   sale          — paid order item consumed inventory
--   reservation   — cart item held inventory (TTL pending)
--   release       — reservation expired, stock returned
--   return        — buyer return restocked
--   manual        — operator adjustment with reason
--   damage        — write-off (audit trail)

create table if not exists public.marketplace_inventory_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.marketplace_products(id) on delete cascade,
  variant_id uuid references public.marketplace_product_variants(id) on delete cascade,
  vendor_id uuid references public.marketplace_vendors(id) on delete set null,
  order_id uuid references public.marketplace_orders(id) on delete set null,
  order_item_id uuid references public.marketplace_order_items(id) on delete set null,
  return_id uuid references public.marketplace_returns(id) on delete set null,
  movement_type text not null,
  delta integer not null,
  stock_after integer,
  reason text,
  actor_user_id uuid references auth.users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.marketplace_inventory_movements
  drop constraint if exists marketplace_inventory_movements_type_check;
alter table public.marketplace_inventory_movements
  add constraint marketplace_inventory_movements_type_check
  check (movement_type in (
    'restock','sale','reservation','release','return','manual','damage'
  ));

alter table public.marketplace_inventory_movements
  drop constraint if exists marketplace_inventory_movements_subject_check;
alter table public.marketplace_inventory_movements
  add constraint marketplace_inventory_movements_subject_check
  check (product_id is not null or variant_id is not null);

create index if not exists marketplace_inventory_movements_product_idx
  on public.marketplace_inventory_movements (product_id, created_at desc);
create index if not exists marketplace_inventory_movements_variant_idx
  on public.marketplace_inventory_movements (variant_id, created_at desc);
create index if not exists marketplace_inventory_movements_vendor_idx
  on public.marketplace_inventory_movements (vendor_id, created_at desc);

alter table public.marketplace_inventory_movements enable row level security;

drop policy if exists marketplace_inventory_movements_staff_read on public.marketplace_inventory_movements;
create policy marketplace_inventory_movements_staff_read
  on public.marketplace_inventory_movements
  for select
  using (
    exists (
      select 1 from public.marketplace_role_memberships m
      where m.user_id = (select auth.uid())
        and m.is_active = true
        and m.role in ('marketplace_owner','marketplace_admin','operations','finance','moderation')
    )
  );

drop policy if exists marketplace_inventory_movements_vendor_read on public.marketplace_inventory_movements;
create policy marketplace_inventory_movements_vendor_read
  on public.marketplace_inventory_movements
  for select
  using (
    vendor_id in (
      select v.id from public.marketplace_vendors v
      where v.id in (
        select m.scope_id from public.marketplace_role_memberships m
        where m.user_id = (select auth.uid())
          and m.role = 'vendor'
          and m.is_active = true
          and m.scope_type = 'vendor'
      )
    )
  );

drop policy if exists marketplace_inventory_movements_service_write on public.marketplace_inventory_movements;
create policy marketplace_inventory_movements_service_write
  on public.marketplace_inventory_movements
  for insert
  with check (
    exists (
      select 1 from public.marketplace_role_memberships m
      where m.user_id = (select auth.uid())
        and m.is_active = true
        and m.role in ('marketplace_owner','marketplace_admin','operations','vendor')
    )
  );
