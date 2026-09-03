-- F-06 / F-09 — product_variants and product_media currently have SELECT USING(true),
-- so anon reads price/stock/sku/options and media url/public_id of NON-approved
-- (draft/submitted/rejected) products. Gate the public read to approved parents.
-- Staff and the owning vendor continue to read drafts via service_role (app path),
-- which bypasses RLS, so the editor/admin UIs are unaffected. (Optional staff/vendor
-- read policies are included for parity if any client ever reads these via the Data API.)

-- ---- product_variants ----
drop policy if exists marketplace_public_product_variants on public.marketplace_product_variants;
create policy marketplace_public_product_variants on public.marketplace_product_variants
for select using (
  exists (
    select 1 from public.marketplace_products p
    where p.id = marketplace_product_variants.product_id
      and p.approval_status = 'approved'
  )
);

create policy marketplace_staff_product_variants on public.marketplace_product_variants
for select using (
  exists (select 1 from public.marketplace_role_memberships m
          where m.user_id = (select auth.uid()) and m.is_active
            and m.role = any (array['marketplace_owner','marketplace_admin','operations','moderation']))
);

-- ---- product_media ----
drop policy if exists marketplace_public_product_media on public.marketplace_product_media;
create policy marketplace_public_product_media on public.marketplace_product_media
for select using (
  exists (
    select 1 from public.marketplace_products p
    where p.id = marketplace_product_media.product_id
      and p.approval_status = 'approved'
  )
);

create policy marketplace_staff_product_media on public.marketplace_product_media
for select using (
  exists (select 1 from public.marketplace_role_memberships m
          where m.user_id = (select auth.uid()) and m.is_active
            and m.role = any (array['marketplace_owner','marketplace_admin','operations','moderation']))
);
