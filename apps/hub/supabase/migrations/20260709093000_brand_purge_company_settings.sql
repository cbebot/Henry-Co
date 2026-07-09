------------------------------------------------------------------------
-- BRAND PURGE — company settings source data (2026-07-09)
--
-- The owner-CMS settings tables still carry the RETIRED brand name in their
-- column DEFAULTS and (potentially) in live rows: company_settings.company_name
-- defaulted to 'Henry & Co. Fabric Care'; company_site_settings.brand_title /
-- legal_company_name defaulted to 'Henry & Co.'. The hub PUBLIC render path is
-- already guarded (normalizeCompanySettings -> toBrandName), but the owner's CMS
-- editor shows the raw values and any future unguarded read would leak the old
-- name. This migration cleans the SOURCE so nothing can ever display it.
--
-- Rewrites mirror packages/config/company.ts::toBrandName exactly:
--   'Henry Holdings Limited' -> 'Henry Onyx Limited'
--   'Henry Holdings'         -> 'Henry Onyx Limited'
--   'Henry & Co.' / 'Henry & Co' / 'HenryCo' -> 'Henry Onyx'
-- Suffixes are preserved ('Henry & Co. Fabric Care' -> 'Henry Onyx Fabric Care').
-- Idempotent: re-running is a no-op once the strings are already current.
------------------------------------------------------------------------

create or replace function pg_temp.hc_brandfix(v text)
returns text language sql immutable as $$
  select case when v is null then null else
    replace(
      replace(
        replace(
          replace(
            replace(v, 'Henry Holdings Limited', 'Henry Onyx Limited'),
          'Henry Holdings', 'Henry Onyx Limited'),
        'Henry & Co.', 'Henry Onyx'),
      'Henry & Co', 'Henry Onyx'),
    'HenryCo', 'Henry Onyx')
  end
$$;

do $$
begin
  ------------------------------------------------------------------ care/company
  if to_regclass('public.company_settings') is not null then
    alter table public.company_settings
      alter column company_name set default 'Henry Onyx Fabric Care';

    update public.company_settings set
      company_name      = pg_temp.hc_brandfix(company_name),
      legal_name        = pg_temp.hc_brandfix(legal_name),
      brand_title       = pg_temp.hc_brandfix(brand_title),
      brand_subtitle    = pg_temp.hc_brandfix(brand_subtitle),
      brand_description = pg_temp.hc_brandfix(brand_description),
      footer_blurb      = pg_temp.hc_brandfix(footer_blurb),
      copyright_label   = pg_temp.hc_brandfix(copyright_label)
    where
      company_name      like '%Henry %Co%' or company_name      like '%Henry Holdings%'
      or legal_name     like '%Henry %Co%' or legal_name        like '%Henry Holdings%'
      or brand_title    like '%Henry %Co%' or brand_title       like '%Henry Holdings%'
      or brand_subtitle like '%Henry %Co%' or brand_subtitle    like '%Henry Holdings%'
      or brand_description like '%Henry %Co%' or brand_description like '%Henry Holdings%'
      or footer_blurb   like '%Henry %Co%' or footer_blurb      like '%Henry Holdings%'
      or copyright_label like '%Henry %Co%' or copyright_label  like '%Henry Holdings%';
  end if;

  ------------------------------------------------------------------ hub site
  if to_regclass('public.company_site_settings') is not null then
    alter table public.company_site_settings
      alter column brand_title set default 'Henry Onyx';
    alter table public.company_site_settings
      alter column legal_company_name set default 'Henry Onyx Limited';

    update public.company_site_settings set
      brand_title        = pg_temp.hc_brandfix(brand_title),
      legal_company_name = pg_temp.hc_brandfix(legal_company_name)
    where
      brand_title        like '%Henry %Co%' or brand_title        like '%Henry Holdings%'
      or legal_company_name like '%Henry %Co%' or legal_company_name like '%Henry Holdings%';
  end if;
end $$;
