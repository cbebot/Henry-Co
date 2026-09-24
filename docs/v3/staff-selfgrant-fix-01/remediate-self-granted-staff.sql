-- ============================================================================
-- V3-STAFF-SELFGRANT-FIX-01 — HELD REMEDIATION. DO NOT RUN WITHOUT OWNER REVIEW.
--
-- Demotes accounts the OWNER has judged illegitimately staff, from the day-of review
-- (review-staff-grants.sql R2/R3). Nothing is inferred automatically: only the user ids
-- you type into step 1 are touched.
--
-- SAFE BY DEFAULT: the script ends with ROLLBACK, so the first run is a dry run that shows
-- the before/after. Change the last line to COMMIT only after the output is right.
-- Works both BEFORE and AFTER 20260924120000_v3_staff_selfgrant_fix_01.sql is applied.
-- Touches only: public.profiles (role, force_reauth_after), public.staff_role_grants (if
-- present), auth.users raw_app_meta_data / raw_user_meta_data role keys. No money table,
-- no payments_private, no money RPC.
--
-- Run in the Supabase SQL editor (postgres). The editor shows only the LAST result set;
-- the step-7 verification is the last SELECT before the ROLLBACK/COMMIT.
-- ============================================================================

begin;

-- ── 1 · The owner-reviewed list (EDIT THIS) ─────────────────────────────────
create temp table _sg_demote (
  user_id uuid primary key,
  reason  text not null,
  -- set true ONLY for an account that also holds an ACTIVE owner-console row and that you
  -- have decided to demote anyway (the script otherwise refuses, to protect the owner).
  allow_active_owner boolean not null default false
) on commit drop;

-- Add one line per account ABOVE the placeholder, e.g.
--   ('00000000-0000-0000-0000-000000000000', 'R2 SELF-INSERT-SHAPED; unknown to owner'),
--   ('00000000-0000-0000-0000-000000000000', 'R3 reconcile-promoted customer'),
insert into _sg_demote (user_id, reason)
select v.user_id::uuid, v.reason
from (values
  (null, 'PLACEHOLDER — keep this last line; it is filtered out')
) as v(user_id, reason)
where v.user_id is not null;

-- ── 2 · Safety rails ────────────────────────────────────────────────────────
do $rails$
declare
  v_n int;
begin
  select count(*) into v_n from _sg_demote;
  if v_n = 0 then
    raise exception 'REMEDIATION: _sg_demote is empty — add the owner-reviewed user ids in step 1';
  end if;
  if v_n > 50 then
    raise exception 'REMEDIATION: % ids is more than expected (>50) — re-check the list', v_n;
  end if;
  if exists (select 1 from _sg_demote d where not exists (select 1 from auth.users u where u.id = d.user_id)) then
    raise exception 'REMEDIATION: an id in _sg_demote is not an auth user (typo?)';
  end if;
  if exists (
    select 1 from _sg_demote d
    join public.owner_profiles op on op.user_id = d.user_id and op.is_active and op.role in ('owner','admin')
    where not d.allow_active_owner
  ) then
    raise exception 'REMEDIATION: an id is an ACTIVE owner-console owner — refusing (set allow_active_owner only if intended)';
  end if;
end $rails$;

-- ── 3 · Before-state (kept in the temp table for the step-7 diff) ─────────────
create temp table _sg_before on commit drop as
select d.user_id, u.email, p.role as profile_role,
       u.raw_app_meta_data ->> 'role'  as app_metadata_role,
       u.raw_user_meta_data ->> 'role' as user_metadata_role
from _sg_demote d
join auth.users u on u.id = d.user_id
left join public.profiles p on p.id = d.user_id;

-- ── 4 · Demote profiles.role (+ force re-auth) ─────────────────────────────────
-- The pre-existing guard trg_profiles_protect_sensitive_fields raises 'Not authenticated'
-- for any JWT-less writer (the SQL editor included), so it is disabled for THIS transaction
-- only and re-enabled before commit. The V3-STAFF-SELFGRANT-FIX-01 triggers (if applied)
-- stay ON: as postgres this write is trusted, so the grant mirror revokes the evidence.
do $demote$
begin
  if exists (select 1 from pg_trigger where tgname = 'trg_profiles_protect_sensitive_fields'
             and tgrelid = 'public.profiles'::regclass) then
    execute 'alter table public.profiles disable trigger trg_profiles_protect_sensitive_fields';
  end if;

  update public.profiles p
     set role = 'customer',
         force_reauth_after = timezone('utc', now())
   where p.id in (select user_id from _sg_demote)
     and lower(p.role) <> 'customer';

  -- Post-migration the deferred invariant (trg_profiles_require_staff_grant) has queued
  -- events for these rows; ALTER TABLE refuses while events are pending, so fire them now
  -- (every row is 'customer', so the check passes). No-op pre-migration.
  set constraints all immediate;

  if exists (select 1 from pg_trigger where tgname = 'trg_profiles_protect_sensitive_fields'
             and tgrelid = 'public.profiles'::regclass) then
    execute 'alter table public.profiles enable trigger trg_profiles_protect_sensitive_fields';
  end if;

  -- Belt-and-braces: revoke any remaining evidence explicitly (no-op pre-migration).
  if to_regclass('public.staff_role_grants') is not null then
    execute $q$
      update public.staff_role_grants g
         set revoked_at = timezone('utc', now()),
             revoked_reason = 'remediation:v3_staff_selfgrant_fix_01'
       where g.user_id in (select user_id from _sg_demote) and g.revoked_at is null
    $q$;
  end if;
end $demote$;

-- ── 5 · Strip staff roles from auth metadata (care resolves app_metadata first) ─
update auth.users u
   set raw_app_meta_data = coalesce(u.raw_app_meta_data, '{}'::jsonb) - 'role' - 'staff_role'
 where u.id in (select user_id from _sg_demote)
   and (lower(coalesce(u.raw_app_meta_data ->> 'role', ''))       in ('owner','manager','rider','support','staff')
     or lower(coalesce(u.raw_app_meta_data ->> 'staff_role', '')) in ('owner','manager','rider','support','staff'));

update auth.users u
   set raw_user_meta_data = coalesce(u.raw_user_meta_data, '{}'::jsonb) - 'role'
 where u.id in (select user_id from _sg_demote)
   and lower(coalesce(u.raw_user_meta_data ->> 'role', '')) in ('owner','manager','rider','support','staff');

-- ── 6 · Hard assertions — abort the whole transaction on any leftover ────────
do $assert$
begin
  if exists (select 1 from public.profiles p join _sg_demote d on d.user_id = p.id
             where lower(p.role) <> 'customer') then
    raise exception 'REMEDIATION: a listed profile is still non-customer';
  end if;
  if to_regclass('public.staff_role_grants') is not null then
    if exists (select 1 from public.staff_role_grants g join _sg_demote d on d.user_id = g.user_id
               where g.revoked_at is null) then
      raise exception 'REMEDIATION: a listed account still holds an active staff grant';
    end if;
  end if;
  if exists (select 1 from auth.users u join _sg_demote d on d.user_id = u.id
             where lower(coalesce(u.raw_app_meta_data ->> 'role', '')) in ('owner','manager','rider','support','staff')) then
    raise exception 'REMEDIATION: a listed account still has a staff app_metadata.role';
  end if;
  if exists (select 1 from pg_trigger where tgname = 'trg_profiles_protect_sensitive_fields'
             and tgrelid = 'public.profiles'::regclass and tgenabled = 'D') then
    raise exception 'REMEDIATION: protect trigger left disabled';
  end if;
end $assert$;

-- ── 7 · Before → after (the result the SQL editor shows) ────────────────────
select b.user_id, b.email,
       b.profile_role        as before_profile_role,  p.role                          as after_profile_role,
       b.app_metadata_role   as before_app_role,      u.raw_app_meta_data ->> 'role'  as after_app_role,
       b.user_metadata_role  as before_user_role,     u.raw_user_meta_data ->> 'role' as after_user_role,
       p.force_reauth_after,
       d.reason
from _sg_before b
join _sg_demote d on d.user_id = b.user_id
join auth.users u on u.id = b.user_id
left join public.profiles p on p.id = b.user_id
order by b.email;

-- ── 8 · DRY RUN by default. Change to COMMIT only after the owner approves step 7.
rollback;
