-- V3-PUBLIC-DESIGN-01b — division brand-name data fix.
--
-- The V3 legal-rename migration (20260601090000) corrected the `display_name`
-- column, but the hub public directory reads and renders the `name` column
-- (apps/hub/app/lib/divisions.ts → getPublishedDivisions → select name). So the
-- seeded rows still surfaced "HenryCo <Division>" in the live directory. This
-- brings `name` (plus tagline / description prose) forward to the user-facing
-- brand so the data at rest agrees with the render.
--
-- The hub read path (normalizeDivision → @henryco/config toBrandName) is the
-- load-bearing guard and already neutralises any stray shorthand at render time;
-- this migration is the matching data-hygiene pass. Column-guarded + idempotent
-- (safe to re-run). Lowercase code slugs and the henrycogroup.com domain use no
-- word boundary here, so they are intentionally untouched.

do $$
begin
  if to_regclass('public.company_divisions') is null then
    return;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'company_divisions'
      and column_name = 'name'
  ) then
    update public.company_divisions
       set name = case slug
            when 'care' then 'Henry & Co. Fabric Care'
            when 'marketplace' then 'Henry & Co. Marketplace'
            when 'studio' then 'Henry & Co. Studio'
            when 'jobs' then 'Henry & Co. Jobs'
            when 'property' then 'Henry & Co. Property'
            when 'learn' then 'Henry & Co. Learn'
            when 'logistics' then 'Henry & Co. Logistics'
            else regexp_replace(
                   regexp_replace(name, '\yHenryCo Group\y', 'Henry & Co.', 'g'),
                   '\yHenryCo\y', 'Henry & Co.', 'g')
          end
     where slug in ('care','marketplace','studio','jobs','property','learn','logistics')
        or name ~ '\yHenryCo\y';
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'company_divisions'
      and column_name = 'tagline'
  ) then
    update public.company_divisions
       set tagline = regexp_replace(
             regexp_replace(tagline, '\yHenryCo Group\y', 'Henry & Co.', 'g'),
             '\yHenryCo\y', 'Henry & Co.', 'g')
     where tagline ~ '\yHenryCo\y';
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'company_divisions'
      and column_name = 'description'
  ) then
    update public.company_divisions
       set description = regexp_replace(
             regexp_replace(description, '\yHenryCo Group\y', 'Henry & Co.', 'g'),
             '\yHenryCo\y', 'Henry & Co.', 'g')
     where description ~ '\yHenryCo\y';
  end if;
end $$;
