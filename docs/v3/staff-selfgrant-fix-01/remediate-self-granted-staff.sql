-- ============================================================================
-- V3-STAFF-SELFGRANT-FIX-01 — HELD REMEDIATION. DO NOT RUN WITHOUT OWNER REVIEW.
--
-- Acts ONLY on the user ids the owner types into step 1, each judged from the day-of
-- review (review-staff-grants.sql R2/R3/R6/R7). Nothing is inferred automatically.
--
-- SAFE BY DEFAULT: ends with ROLLBACK — the first run is a dry run that shows the
-- before/after (step 8). Change the last line to COMMIT only after the owner approves.
-- Works BEFORE or AFTER 20260924120000_v3_staff_selfgrant_fix_01.sql is applied.
-- No DDL, no table ownership needed, no ACCESS EXCLUSIVE lock.
-- Touches only: public.profiles (role, force_reauth_after), public.staff_role_grants,
-- public.customer_profiles (KYC fields, only where reset_kyc), the four
-- *_role_memberships tables (is_active, only where deactivate_memberships),
-- auth.users (raw_app_meta_data / raw_user_meta_data role keys), auth.sessions (only where
-- revoke_sessions). No money table, no payments_private, no money RPC. Pending
-- withdrawals of KYC-reset accounts are a MONEY decision — see the review R6 note.
--
-- Run in the Supabase SQL editor (postgres). The editor shows only the LAST result set.
-- ============================================================================

begin;

-- ── 1 · The owner-reviewed list (EDIT THIS) ─────────────────────────────────
create temp table _sg_demote (
  user_id                uuid primary key,
  reason                 text not null,
  allow_active_owner     boolean not null default false, -- demote even an ACTIVE owner-console owner
  reset_kyc              boolean not null default false, -- R6: self-set KYC → back to 'none'
  deactivate_memberships boolean not null default false, -- also switch off *_role_memberships
  revoke_sessions        boolean not null default true   -- sign the account out everywhere
) on commit drop;

-- One line per account ABOVE the placeholder:
--   (user_id, reason, allow_active_owner, reset_kyc, deactivate_memberships, revoke_sessions)
-- e.g.
--   ('00000000-0000-0000-0000-000000000000', 'R2 SELF-INSERT-SHAPED; unknown to owner', false, false, false, true),
--   ('00000000-0000-0000-0000-000000000000', 'R6 self-verified KYC',                   false, true,  false, true),
insert into _sg_demote (user_id, reason, allow_active_owner, reset_kyc, deactivate_memberships, revoke_sessions)
select v.user_id::uuid, v.reason, v.allow_active_owner, v.reset_kyc, v.deactivate_memberships, v.revoke_sessions
from (values
  (null, 'PLACEHOLDER — keep this last line; it is filtered out', false, false, false, true)
) as v(user_id, reason, allow_active_owner, reset_kyc, deactivate_memberships, revoke_sessions)
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

-- ── 3 · Before-state (kept for the step-8 diff) ─────────────────────────────
create temp table _sg_before on commit drop as
select d.user_id, u.email, p.role as profile_role,
       u.raw_app_meta_data ->> 'role'  as app_metadata_role,
       u.raw_user_meta_data ->> 'role' as user_metadata_role,
       cp.verification_status         as kyc_status
from _sg_demote d
join auth.users u on u.id = d.user_id
left join public.profiles p on p.id = d.user_id
left join public.customer_profiles cp on cp.id = d.user_id;

-- ── 4 · Authorize the role change the way the platform does ──────────────────
-- trg_profiles_protect_sensitive_fields requires a JWT subject that is_owner(); the SQL
-- editor has none, so act — for THIS transaction only — under an active owner's identity.
-- (The fix's own guards trust this session anyway: postgres can bypass RLS.)
do $claims$
declare
  v_owner uuid;
begin
  select op.user_id into v_owner
  from public.owner_profiles op
  where op.is_active and op.role in ('owner', 'admin')
  order by op.created_at
  limit 1;
  if v_owner is null then
    raise exception 'REMEDIATION: no active owner_profiles owner to authorize the role change';
  end if;
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_owner, 'role', 'service_role')::text, true);
end $claims$;

-- ── 5 · Demote profiles.role, force re-auth, revoke the evidence ─────────────
update public.profiles p
   set role = 'customer',
       force_reauth_after = timezone('utc', now())
 where p.id in (select user_id from _sg_demote)
   and lower(p.role) <> 'customer';

do $revoke$
begin
  -- The fix's grant mirror already revoked these (postgres is a trusted writer); this is
  -- belt-and-braces and a no-op before the migration exists.
  if to_regclass('public.staff_role_grants') is not null then
    execute $q$
      update public.staff_role_grants g
         set revoked_at = timezone('utc', now()),
             revoked_reason = 'remediation:v3_staff_selfgrant_fix_01'
       where g.user_id in (select user_id from _sg_demote) and g.revoked_at is null
    $q$;
  end if;
end $revoke$;

-- ── 6 · Optional per-row actions ─────────────────────────────────────────────
-- 6a · KYC self-verified → back to 'none' (the customer re-submits through /verification)
update public.customer_profiles cp
   set verification_status = 'none', is_verified = false,
       verification_reviewed_at = null, verification_reviewer_id = null,
       verification_note = 'reset by owner: self-set KYC (V3-STAFF-SELFGRANT-FIX-01)'
 where cp.id in (select user_id from _sg_demote where reset_kyc)
   and (cp.verification_status <> 'none' or cp.is_verified);

-- 6b · Division memberships (only where the owner asked)
do $memberships$
declare
  t text;
begin
  foreach t in array array['marketplace_role_memberships', 'studio_role_memberships',
                           'property_role_memberships', 'learn_role_memberships'] loop
    if to_regclass('public.' || t) is not null then
      execute format(
        'update public.%I set is_active = false where is_active and user_id in (select user_id from _sg_demote where deactivate_memberships)', t);
    end if;
  end loop;
end $memberships$;

-- 6c · Strip staff roles from auth metadata (care resolves app_metadata first)
update auth.users u
   set raw_app_meta_data = coalesce(u.raw_app_meta_data, '{}'::jsonb) - 'role' - 'staff_role'
 where u.id in (select user_id from _sg_demote)
   and (lower(coalesce(u.raw_app_meta_data ->> 'role', ''))       in ('owner','manager','rider','support','staff')
     or lower(coalesce(u.raw_app_meta_data ->> 'staff_role', '')) in ('owner','manager','rider','support','staff'));
update auth.users u
   set raw_user_meta_data = coalesce(u.raw_user_meta_data, '{}'::jsonb) - 'role'
 where u.id in (select user_id from _sg_demote)
   and lower(coalesce(u.raw_user_meta_data ->> 'role', '')) in ('owner','manager','rider','support','staff');

-- 6d · Sign the account out everywhere (refresh tokens cascade with their sessions)
do $sessions$
begin
  if to_regclass('auth.sessions') is not null then
    execute 'delete from auth.sessions where user_id in (select user_id from _sg_demote where revoke_sessions)';
  end if;
end $sessions$;

select set_config('request.jwt.claims', '', true);   -- drop the borrowed identity

-- ── 7 · Hard assertions — abort the whole transaction on any leftover ────────
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
  if exists (select 1 from public.customer_profiles cp join _sg_demote d on d.user_id = cp.id
             where d.reset_kyc and (cp.verification_status <> 'none' or cp.is_verified)) then
    raise exception 'REMEDIATION: a KYC reset did not apply';
  end if;
end $assert$;

-- ── 8 · Before → after (the result the SQL editor shows) ────────────────────
select b.user_id, b.email,
       b.profile_role        as before_profile_role,  p.role                          as after_profile_role,
       b.app_metadata_role   as before_app_role,      u.raw_app_meta_data ->> 'role'  as after_app_role,
       b.kyc_status          as before_kyc,           cp.verification_status          as after_kyc,
       p.force_reauth_after,
       d.reset_kyc, d.deactivate_memberships, d.revoke_sessions,
       d.reason
from _sg_before b
join _sg_demote d on d.user_id = b.user_id
join auth.users u on u.id = b.user_id
left join public.profiles p on p.id = b.user_id
left join public.customer_profiles cp on cp.id = b.user_id
order by b.email;

-- ── 9 · DRY RUN by default. Change to COMMIT only after the owner approves step 8.
rollback;
