-- F-07 — The INSERT WITH CHECK validates that the caller IS a vendor but not that the
-- inserted row's vendor_id matches the caller's own vendor scope. Any vendor can write
-- inventory movements for ANY vendor via the Data API. Scope the vendor branch by scope_id.

drop policy if exists marketplace_inventory_movements_service_write on public.marketplace_inventory_movements;
create policy marketplace_inventory_movements_service_write on public.marketplace_inventory_movements
for insert with check (
  -- platform operators: unscoped
  exists (
    select 1 from public.marketplace_role_memberships m
    where m.user_id = (select auth.uid()) and m.is_active
      and m.role = any (array['marketplace_owner','marketplace_admin','operations'])
  )
  or
  -- vendors: only for their own vendor scope
  exists (
    select 1 from public.marketplace_role_memberships m
    where m.user_id = (select auth.uid()) and m.is_active
      and m.role = 'vendor' and m.scope_type = 'vendor'
      and m.scope_id = marketplace_inventory_movements.vendor_id
  )
);
