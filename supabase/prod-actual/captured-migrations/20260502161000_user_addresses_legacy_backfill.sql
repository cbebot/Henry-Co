-- ============================================================================
-- FAITHFUL PROD CAPTURE — V3-RECONCILE-01 (2026-06-21)
-- prod migration: version=20260502161000  name=user_addresses_legacy_backfill
-- project: rzkbgwuznmdxnnhmjazy (HENRY ONYX)
-- classification: FOLLOWON_HARDEN (applied on prod; no app-folder migration file existed)
--
-- BYTE-FAITHFUL capture of the SQL prod actually applied for this migration
-- (supabase_migrations.schema_migrations.statements). Recorded so the repo
-- migration record mirrors prod. Like supabase/prod-actual/schema.sql this is a
-- REFERENCE capture: NOT part of any app auto-apply chain, and must NOT be
-- re-applied to prod (these objects already exist there). See
-- supabase/prod-actual/captured-migrations/README.md and
-- .codex-temp/v3-reconcile-01/report.md.
-- ============================================================================

-- =============================================================================
-- V2-ADDR-01B — Legacy address backfill into public.user_addresses
-- =============================================================================
-- Idempotently imports address rows from older account/marketplace storage into
-- the canonical V2-ADDR-01 address book. This migration intentionally does not
-- delete or mutate legacy rows; older tables remain readable for audit/history.

do $$
begin
  if to_regclass('public.customer_addresses') is not null then
    execute $backfill_customer$
      with source as (
        select
          id,
          user_id,
          case lower(trim(coalesce(label, '')))
            when 'home' then 'home'
            when 'office' then 'office'
            when 'shop' then 'shop'
            when 'warehouse' then 'warehouse'
            else null
          end as preferred_label,
          nullif(trim(full_name), '') as full_name,
          nullif(trim(phone), '') as phone,
          concat_ws(', ', nullif(trim(address_line1), ''), nullif(trim(address_line2), ''), nullif(trim(landmark), '')) as street,
          nullif(trim(city), '') as city,
          nullif(trim(state), '') as state,
          nullif(trim(postal_code), '') as postal_code,
          coalesce(nullif(trim(country), ''), 'NG') as country,
          lat,
          lng,
          coalesce(is_default, false) as is_default,
          created_at,
          updated_at
        from public.customer_addresses
        where user_id is not null
      ),
      ranked as (
        select
          *,
          row_number() over (
            partition by user_id
            order by is_default desc, updated_at desc nulls last, created_at desc nulls last, id
          ) as import_rank,
          row_number() over (
            partition by user_id, preferred_label
            order by is_default desc, updated_at desc nulls last, created_at desc nulls last, id
          ) as label_rank
        from source
        where length(coalesce(street, '')) >= 3
          and length(coalesce(city, '')) >= 2
          and length(coalesce(country, '')) >= 2
      ),
      prepared as (
        select
          user_id,
          case
            when preferred_label is not null and label_rank = 1 then preferred_label
            when import_rank between 1 and 4 then 'legacy_imported_' || import_rank::text
            else null
          end::public.user_address_label as label,
          full_name,
          phone,
          country,
          state,
          city,
          street,
          postal_code,
          lat::numeric(9, 6) as coordinates_lat,
          lng::numeric(9, 6) as coordinates_lng,
          concat_ws(', ', street, city, state, country) as formatted_address,
          (
            import_rank = 1
            and not exists (
              select 1
                from public.user_addresses existing
               where existing.user_id = ranked.user_id
                 and existing.is_default = true
            )
          ) as is_default,
          coalesce(created_at, now()) as created_at,
          coalesce(updated_at, created_at, now()) as updated_at
        from ranked
      )
      insert into public.user_addresses (
        user_id,
        label,
        full_name,
        phone,
        country,
        state,
        city,
        street,
        postal_code,
        coordinates_lat,
        coordinates_lng,
        formatted_address,
        is_default,
        created_at,
        updated_at
      )
      select
        user_id,
        label,
        full_name,
        phone,
        country,
        state,
        city,
        street,
        postal_code,
        coordinates_lat,
        coordinates_lng,
        formatted_address,
        is_default,
        created_at,
        updated_at
      from prepared
      where label is not null
      on conflict (user_id, label) do nothing
    $backfill_customer$;
  end if;
end
$$
do $$
begin
  if to_regclass('public.marketplace_addresses') is not null then
    execute $backfill_marketplace$
      with source as (
        select
          id,
          user_id,
          case lower(trim(coalesce(label, '')))
            when 'home' then 'home'
            when 'office' then 'office'
            when 'shop' then 'shop'
            when 'warehouse' then 'warehouse'
            else null
          end as preferred_label,
          nullif(trim(recipient_name), '') as full_name,
          nullif(trim(phone), '') as phone,
          concat_ws(', ', nullif(trim(line1), ''), nullif(trim(line2), '')) as street,
          nullif(trim(city), '') as city,
          nullif(trim(region), '') as state,
          coalesce(nullif(trim(country), ''), 'NG') as country,
          coalesce(is_default, false) as is_default,
          created_at,
          updated_at
        from public.marketplace_addresses
        where user_id is not null
      ),
      ranked as (
        select
          *,
          row_number() over (
            partition by user_id
            order by is_default desc, updated_at desc nulls last, created_at desc nulls last, id
          ) as import_rank,
          row_number() over (
            partition by user_id, preferred_label
            order by is_default desc, updated_at desc nulls last, created_at desc nulls last, id
          ) as label_rank
        from source
        where length(coalesce(street, '')) >= 3
          and length(coalesce(city, '')) >= 2
          and length(coalesce(country, '')) >= 2
      ),
      prepared as (
        select
          user_id,
          case
            when preferred_label is not null and label_rank = 1 then preferred_label
            when import_rank between 1 and 4 then 'legacy_imported_' || import_rank::text
            else null
          end::public.user_address_label as label,
          full_name,
          phone,
          country,
          state,
          city,
          street,
          concat_ws(', ', street, city, state, country) as formatted_address,
          (
            import_rank = 1
            and not exists (
              select 1
                from public.user_addresses existing
               where existing.user_id = ranked.user_id
                 and existing.is_default = true
            )
          ) as is_default,
          coalesce(created_at, now()) as created_at,
          coalesce(updated_at, created_at, now()) as updated_at
        from ranked
      )
      insert into public.user_addresses (
        user_id,
        label,
        full_name,
        phone,
        country,
        state,
        city,
        street,
        formatted_address,
        is_default,
        created_at,
        updated_at
      )
      select
        user_id,
        label,
        full_name,
        phone,
        country,
        state,
        city,
        street,
        formatted_address,
        is_default,
        created_at,
        updated_at
      from prepared
      where label is not null
      on conflict (user_id, label) do nothing
    $backfill_marketplace$;
  end if;
end
$$
