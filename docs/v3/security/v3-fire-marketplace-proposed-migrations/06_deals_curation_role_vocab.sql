-- F-12 — marketplace_deals_curation's ALL policy matches role IN
-- ('owner','manager','curator'), but no membership uses those names (canonical scheme is
-- 'marketplace_owner'/'marketplace_admin'/'operations'/...). Result: staff CANNOT manage
-- deals via the Data API (functional lockout); there is no over-grant. Re-align to the
-- canonical vocabulary. CONFIRM the intended curator-equivalent role with the owner before
-- applying (mapping below is the audit's best inference).

drop policy if exists marketplace_deals_curation_admin_all on public.marketplace_deals_curation;
create policy marketplace_deals_curation_admin_all on public.marketplace_deals_curation
for all
using (
  exists (select 1 from public.marketplace_role_memberships m
          where m.user_id = (select auth.uid()) and m.is_active
            and m.role = any (array['marketplace_owner','marketplace_admin','operations']))
)
with check (
  exists (select 1 from public.marketplace_role_memberships m
          where m.user_id = (select auth.uid()) and m.is_active
            and m.role = any (array['marketplace_owner','marketplace_admin','operations']))
);
