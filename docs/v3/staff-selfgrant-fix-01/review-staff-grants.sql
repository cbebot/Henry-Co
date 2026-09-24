-- ============================================================================
-- V3-STAFF-SELFGRANT-FIX-01 — DAY-OF REVIEW (READ-ONLY). Runbook §6.3 "G10b".
-- Run in the Supabase SQL editor BEFORE applying
-- 20260924120000_v3_staff_selfgrant_fix_01.sql. Changes nothing.
--
-- The SQL editor shows only the LAST result set, so run each numbered block on its
-- own and save every result. The owner then decides, row by row, which accounts are
-- genuine staff and which go into remediate-self-granted-staff.sql.
-- ============================================================================

-- ── R1 · Headline counts ─────────────────────────────────────────────────────
select
  (select count(*) from auth.users u
    where not exists (select 1 from public.profiles p where p.id = u.id))            as g10_auth_users_without_profile,
  (select count(*) from public.profiles where lower(role) <> 'customer')              as non_customer_profiles,
  (select count(*) from public.profiles where lower(role) = 'staff')                  as role_staff,
  (select count(*) from public.profiles where lower(role) = 'owner')                  as role_owner,
  (select count(*) from public.profiles p join auth.users u on u.id = p.id
    where lower(p.role) <> 'customer'
      and coalesce(u.raw_app_meta_data ->> 'role', '') = '')                          as self_insert_shaped,
  (select count(*) from auth.users u
    left join public.profiles p on p.id = u.id
    where lower(coalesce(u.raw_app_meta_data ->> 'role', '')) in ('owner','manager','rider','support','staff')
      and lower(coalesce(p.role, 'customer')) = 'customer')                           as app_metadata_only_staff,
  (select count(*) from public.owner_profiles where role <> 'owner')                  as owner_console_non_owner_rows;

-- ── R2 · Every non-customer profiles row, with evidence (population A) ───────
-- verdict_hint is a HINT, not a verdict:
--   SELF-INSERT-SHAPED   app_metadata.role is empty. A PostgREST self-insert cannot set
--                        app_metadata, while care's provisioning (syncStaffIdentity) always
--                        writes it. Strongest signal of the hole being used.
--   METADATA-MISMATCH    app_metadata.role disagrees with profiles.role.
--   PROVISIONED-SHAPED   app_metadata.role matches. Genuine care provisioning looks like this,
--                        but so does an ordinary user that the pre-fix
--                        reconcileStaffDirectory() auto-promoted when the owner opened the
--                        care staff page. Check owner_console / memberships / email / activity.
select
  p.id                                                   as user_id,
  u.email,
  p.role                                                 as profile_role,
  u.raw_app_meta_data ->> 'role'                         as app_metadata_role,
  u.raw_user_meta_data ->> 'role'                        as user_metadata_role,
  op.role                                                as owner_console_role,
  op.is_active                                           as owner_console_active,
  (select string_agg(x, ', ') from (
      select 'marketplace:' || role x from public.marketplace_role_memberships m where m.user_id = p.id and m.is_active
      union all select 'studio:' || role from public.studio_role_memberships m where m.user_id = p.id and m.is_active
      union all select 'property:' || role from public.property_role_memberships m where m.user_id = p.id and m.is_active
      union all select 'learn:' || role from public.learn_role_memberships m where m.user_id = p.id and m.is_active
   ) mm)                                                 as active_division_memberships,
  u.created_at                                           as auth_created_at,
  p.created_at                                           as profile_created_at,
  round(extract(epoch from (p.created_at - u.created_at)))::bigint as profile_after_auth_seconds,
  u.last_sign_in_at,
  (u.email_confirmed_at is not null)                     as email_confirmed,
  p.is_active, p.is_frozen,
  case
    when coalesce(u.raw_app_meta_data ->> 'role', '') = ''                        then 'SELF-INSERT-SHAPED'
    when lower(u.raw_app_meta_data ->> 'role') <> lower(p.role)                   then 'METADATA-MISMATCH'
    else 'PROVISIONED-SHAPED'
  end                                                    as verdict_hint
from public.profiles p
join auth.users u on u.id = p.id
left join public.owner_profiles op on op.user_id = p.id
where lower(p.role) <> 'customer'
order by verdict_hint, p.created_at desc;

-- ── R3 · App-metadata-only staff (population B) ──────────────────────────────
-- Accounts whose admin-set app_metadata.role is a staff role but whose profiles row is
-- 'customer' or missing. The DB (is_staff_in) never treated these as staff, but the care
-- app does: care resolves app_metadata.role first. The pre-fix reconcileStaffDirectory()
-- and care staff sign-in / recovery wrote app_metadata.role='staff' for ordinary customers
-- whose profiles UPDATE the guard rejected. Genuine staff normally have BOTH set.
select
  u.id                                 as user_id,
  u.email,
  u.raw_app_meta_data ->> 'role'       as app_metadata_role,
  u.raw_user_meta_data ->> 'role'      as user_metadata_role,
  p.role                               as profile_role,
  op.role                              as owner_console_role,
  u.created_at, u.last_sign_in_at
from auth.users u
left join public.profiles p on p.id = u.id
left join public.owner_profiles op on op.user_id = u.id
where lower(coalesce(u.raw_app_meta_data ->> 'role', '')) in ('owner','manager','rider','support','staff')
  and lower(coalesce(p.role, 'customer')) = 'customer'
order by u.created_at desc;

-- ── R4 · Owner-console rows (the owner_profiles self-promotion vector) ──────
select op.user_id, op.email, op.role, op.is_active, op.created_at, op.updated_at,
       p.role as profile_role
from public.owner_profiles op
left join public.profiles p on p.id = op.user_id
order by op.role, op.created_at;
