-- V3-STAFF-SELFGRANT-FIX-01 fixture — reproduce the PRE-FIX self-grant surface and seed
-- the personas the invariant attacks / relies on. Run BEFORE
-- 20260924120000_v3_staff_selfgrant_fix_01.sql.
--
-- Two environments:
--   * the prod-actual SHADOW (scripts/db/build-shadow-db.mjs + catch-up): the prod surface
--     is already there; this file only seeds personas.
--   * the CI chain (vanilla PG17 + _bootstrap_supabase_env.sql + earlier fixtures): the
--     profiles / owner_profiles / is_staff_in surface is either missing or a GUC stub, so
--     this file installs the prod-actual definitions VERBATIM (supabase/prod-actual/
--     schema.sql, post SEC-HARDEN-04) before seeding. Detected by the absence of
--     public.admin_set_profile_role(uuid,text), which only a prod-shaped DB carries.
--
-- Ends by PROVING the hole is live pre-fix (so the invariant is load-bearing).

set check_function_bodies = off;

do $ci$
begin
  if to_regprocedure('public.admin_set_profile_role(uuid,text)') is not null then
    raise notice 'staff_selfgrant_min: prod-shaped DB detected — seeding personas only';
    return;
  end if;

  -- Supabase-shaped auth helpers (the CI bootstrap's auth.uid() is a constant NULL).
  execute $f$
    create or replace function auth.uid() returns uuid language sql stable as $b$
      select nullif(coalesce(current_setting('request.jwt.claim.sub', true),
                             current_setting('request.jwt.claims', true)::jsonb ->> 'sub'), '')::uuid
    $b$ $f$;
  execute $f$
    create or replace function auth.role() returns text language sql stable as $b$
      select coalesce(current_setting('request.jwt.claim.role', true),
                      current_setting('request.jwt.claims', true)::jsonb ->> 'role')
    $b$ $f$;
  grant usage on schema auth to anon, authenticated, service_role;
  grant execute on function auth.uid(), auth.role() to anon, authenticated, service_role;

  -- profiles: bring membership_min's (id, role) up to the prod column set.
  create table if not exists public.profiles (id uuid primary key, role text);
  alter table public.profiles
    add column if not exists full_name text,
    add column if not exists phone text,
    add column if not exists created_at timestamptz not null default now(),
    add column if not exists wallet_balance_ngn integer not null default 0,
    add column if not exists is_active boolean not null default true,
    add column if not exists updated_at timestamptz not null default now(),
    add column if not exists is_frozen boolean not null default false,
    add column if not exists frozen_at timestamptz,
    add column if not exists frozen_reason text,
    add column if not exists forced_signout_at timestamptz,
    add column if not exists disabled_reason text,
    add column if not exists force_signout_at timestamptz,
    add column if not exists force_reauth_after timestamptz,
    add column if not exists avatar_url text,
    add column if not exists archived_at timestamptz,
    add column if not exists archive_reason text,
    add column if not exists deleted_at timestamptz,
    add column if not exists deleted_reason text,
    add column if not exists retention_hold_until timestamptz,
    add column if not exists legal_hold_reason text;
  delete from public.profiles where id not in (select id from auth.users);
  update public.profiles set role = 'customer' where role is null
     or role not in ('customer','manager','owner','rider','staff','support');
  alter table public.profiles alter column role set not null;
  if not exists (select 1 from pg_constraint where conname = 'profiles_role_check') then
    alter table public.profiles add constraint profiles_role_check
      check (role = any (array['customer','manager','owner','rider','staff','support']));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'profiles_id_fkey') then
    alter table public.profiles add constraint profiles_id_fkey
      foreign key (id) references auth.users (id) on delete cascade;
  end if;
  alter table public.profiles enable row level security;

  -- owner_profiles (prod shape).
  create table if not exists public.owner_profiles (
    user_id uuid primary key references auth.users (id) on delete cascade,
    email text unique,
    role text not null default 'owner' check (role = any (array['owner','editor','viewer'])),
    is_active boolean not null default true,
    full_name text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );
  alter table public.owner_profiles enable row level security;
end $ci$;

-- ── CI only: prod-actual function bodies (verbatim) ─────────────────────────
do $ci_fns$
begin
  if to_regprocedure('public.admin_set_profile_role(uuid,text)') is not null then return; end if;

  execute $f$
CREATE OR REPLACE FUNCTION public.is_owner()
 RETURNS boolean LANGUAGE sql STABLE SET search_path TO 'public', 'pg_catalog'
AS $function$
  select exists (
    select 1
    from public.owner_profiles op
    where op.user_id = auth.uid()
      and op.is_active = true
      and op.role in ('owner', 'admin')
  );
$function$ $f$;

  execute $f$
CREATE OR REPLACE FUNCTION public.protect_profile_sensitive_fields()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  if public.is_owner() then
    return new;
  end if;
  if new.role is distinct from old.role then
    raise exception 'You cannot change your role';
  end if;
  if new.is_frozen is distinct from old.is_frozen then
    raise exception 'You cannot change frozen state';
  end if;
  if new.force_reauth_after is distinct from old.force_reauth_after then
    raise exception 'You cannot change re-auth state';
  end if;
  return new;
end;
$function$ $f$;

  execute $f$
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
begin
  insert into public.profiles (id, role, full_name, phone, is_active)
  values (
    new.id,
    'customer',
    coalesce(new.raw_user_meta_data->>'full_name', null),
    coalesce(new.raw_user_meta_data->>'phone', null),
    true
  )
  on conflict (id) do nothing;
  return new;
end;
$function$ $f$;

  execute $f$
CREATE OR REPLACE FUNCTION public.admin_set_profile_role(p_user_id uuid, p_role text)
 RETURNS profiles LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
declare
  v_profile public.profiles;
begin
  if not public.is_owner() then
    raise exception 'Only owners can change roles';
  end if;
  if p_role not in ('owner', 'manager', 'rider', 'support', 'staff') then
    raise exception 'Invalid role';
  end if;
  update public.profiles
  set role = p_role
  where id = p_user_id
  returning * into v_profile;
  if v_profile.id is null then
    raise exception 'Profile not found';
  end if;
  return v_profile;
end;
$function$ $f$;

  execute $f$
CREATE OR REPLACE FUNCTION public.current_app_role()
 RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  select coalesce(
    (select role from public.profiles where id = auth.uid()),
    'staff'
  );
$function$ $f$;

  execute $f$
CREATE OR REPLACE FUNCTION public."current_role"()
 RETURNS text LANGUAGE sql STABLE SET search_path TO 'public', 'pg_catalog'
AS $function$
  select role from public.profiles where id = auth.uid();
$function$ $f$;

  execute $f$
CREATE OR REPLACE FUNCTION public.is_property_staff()
 RETURNS boolean LANGUAGE sql STABLE SET search_path TO 'public', 'pg_catalog'
AS $function$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role in ('owner', 'manager', 'staff', 'support')
  );
$function$ $f$;

  execute $f$
CREATE OR REPLACE FUNCTION public.is_platform_staff()
 RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
declare
  v_result boolean;
begin
  if to_regprocedure('public.is_staff_in(text,text)') is null then
    return false;
  end if;
  execute $platform_staff$
    select
      public.is_staff_in('hub', 'owner')
      or public.is_staff_in('hub', 'admin')
      or public.is_staff_in('hub', 'superadmin')
      or public.is_staff_in('staff', 'owner')
      or public.is_staff_in('staff', 'admin')
      or public.is_staff_in('staff', 'superadmin')
      or public.is_staff_in('account', 'owner')
      or public.is_staff_in('account', 'admin')
      or public.is_staff_in('account', 'superadmin')
      or public.is_staff_in('security', 'owner')
      or public.is_staff_in('security', 'admin')
      or public.is_staff_in('security', 'superadmin')
  $platform_staff$
  into v_result;
  return coalesce(v_result, false);
end
$function$ $f$;

  execute $f$
CREATE OR REPLACE FUNCTION public.is_staff_in(division_key text, role_key text DEFAULT NULL::text)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  with caller as (select auth.uid() as uid),
  norm as (
    select lower(coalesce(division_key, '')) as div,
           nullif(lower(coalesce(role_key, '')), '') as r
  ),
  divisional as (
    select 'marketplace'::text as division, lower(role) as role
    from public.marketplace_role_memberships where is_active = true and user_id = (select uid from caller)
    union all
    select 'studio'::text, lower(role)
    from public.studio_role_memberships where is_active = true and user_id = (select uid from caller)
    union all
    select 'property'::text, lower(role)
    from public.property_role_memberships where is_active = true and user_id = (select uid from caller)
    union all
    select 'learn'::text, lower(role)
    from public.learn_role_memberships where is_active = true and user_id = (select uid from caller)
  ),
  legacy_profile as (
    select lower(coalesce(role, '')) as role from public.profiles where id = (select uid from caller)
  ),
  legacy_resolved as (
    select 'care'::text as division, l.role from legacy_profile l
    where l.role in ('owner','admin','superadmin','staff','care_owner','care_admin','care_lead','care_concierge','care_specialist')
    union all
    select 'logistics'::text, l.role from legacy_profile l
    where l.role in ('owner','admin','superadmin','staff','logistics_owner','logistics_admin','logistics_dispatch','logistics_support')
    union all
    select 'jobs'::text, l.role from legacy_profile l
    where l.role in ('owner','admin','superadmin','staff','jobs_owner','jobs_admin','jobs_recruiter')
    union all
    select 'hub'::text, l.role from legacy_profile l where l.role in ('owner','admin','superadmin','staff')
    union all
    select 'staff'::text, l.role from legacy_profile l where l.role in ('owner','admin','superadmin','staff')
    union all
    select 'account'::text, l.role from legacy_profile l where l.role in ('owner','admin','superadmin','staff')
    union all
    select 'security'::text, l.role from legacy_profile l where l.role in ('owner','admin','superadmin')
    union all
    select 'system'::text, l.role from legacy_profile l where l.role in ('owner','admin','superadmin')
  )
  select exists (
    select 1
    from (select division, role from divisional union all select division, role from legacy_resolved) m, norm
    where m.division = norm.div and (norm.r is null or m.role = norm.r)
  );
$function$ $f$;

  execute $f$
CREATE OR REPLACE FUNCTION public.is_staff_in_any()
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  with caller as (select auth.uid() as uid),
  divisional as (
    select 1 from public.marketplace_role_memberships where is_active = true and user_id = (select uid from caller)
    union all
    select 1 from public.studio_role_memberships where is_active = true and user_id = (select uid from caller)
    union all
    select 1 from public.property_role_memberships where is_active = true and user_id = (select uid from caller)
    union all
    select 1 from public.learn_role_memberships where is_active = true and user_id = (select uid from caller)
  ),
  legacy_profile as (
    select 1 from public.profiles p
    where p.id = (select uid from caller)
      and lower(coalesce(p.role, '')) in (
        'owner','admin','superadmin','staff','manager','support','rider','finance',
        'care_owner','care_admin','care_lead','care_concierge','care_specialist',
        'logistics_owner','logistics_admin','logistics_dispatch','logistics_support',
        'jobs_owner','jobs_admin','jobs_recruiter')
  )
  select exists (select 1 from divisional union all select 1 from legacy_profile);
$function$ $f$;

  -- Prod ACLs (post SEC-HARDEN-06): admin_* are service-role only.
  revoke all on function public.admin_set_profile_role(uuid, text) from public, anon, authenticated;
  grant execute on function public.admin_set_profile_role(uuid, text) to service_role;

  drop trigger if exists trg_profiles_protect_sensitive_fields on public.profiles;
  create trigger trg_profiles_protect_sensitive_fields before update on public.profiles
    for each row execute function public.protect_profile_sensitive_fields();
  drop trigger if exists on_auth_user_created on auth.users;
  create trigger on_auth_user_created after insert on auth.users
    for each row execute function public.handle_new_user();

  -- profiles RLS policies exactly as on prod after SEC-HARDEN-04.
  drop policy if exists "anon can insert profiles" on public.profiles;
  drop policy if exists "Profiles: user can read own profile" on public.profiles;
  drop policy if exists "Profiles: user can update own profile" on public.profiles;
  drop policy if exists "no anon select profiles" on public.profiles;
  drop policy if exists profiles_insert_own on public.profiles;
  drop policy if exists profiles_select_own on public.profiles;
  drop policy if exists profiles_select_self_or_owner on public.profiles;
  drop policy if exists profiles_self_select on public.profiles;
  drop policy if exists profiles_update_own on public.profiles;
  drop policy if exists profiles_update_owner on public.profiles;
  drop policy if exists profiles_update_self on public.profiles;
  create policy "Profiles: user can read own profile" on public.profiles for select to public using (id = (select auth.uid()));
  create policy "Profiles: user can update own profile" on public.profiles for update to public using (id = (select auth.uid()));
  create policy "no anon select profiles" on public.profiles for select to anon using (false);
  create policy profiles_insert_own on public.profiles for insert to authenticated with check (id = (select auth.uid()));
  create policy profiles_select_own on public.profiles for select to authenticated using (id = (select auth.uid()));
  create policy profiles_select_self_or_owner on public.profiles for select to authenticated using ((id = (select auth.uid())) or is_owner());
  create policy profiles_self_select on public.profiles for select to public using ((select auth.uid()) = id);
  create policy profiles_update_own on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
  create policy profiles_update_owner on public.profiles for update to authenticated using (is_owner()) with check (is_owner());
  create policy profiles_update_self on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
  revoke all on table public.profiles from anon, authenticated;
  grant select, references, trigger on table public.profiles to anon;
  grant select, insert, update, delete, truncate, references, trigger on table public.profiles to authenticated, service_role;

  -- owner_profiles RLS policies exactly as on prod.
  drop policy if exists owner_profiles_owner_write on public.owner_profiles;
  drop policy if exists owner_profiles_select_own on public.owner_profiles;
  drop policy if exists owner_profiles_select_self_or_owner on public.owner_profiles;
  drop policy if exists owner_profiles_update_own on public.owner_profiles;
  create policy owner_profiles_owner_write on public.owner_profiles for all to public using (is_owner()) with check (is_owner());
  create policy owner_profiles_select_own on public.owner_profiles for select to authenticated using ((select auth.uid()) = user_id);
  create policy owner_profiles_select_self_or_owner on public.owner_profiles for select to public using (((select auth.uid()) = user_id) or is_owner());
  create policy owner_profiles_update_own on public.owner_profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
  grant select, insert, update, delete on table public.owner_profiles to anon, authenticated, service_role;
end $ci_fns$;

-- ── Personas (both environments). Seeded as the platform, triggers bypassed, so the
--    pre-fix state is exactly "these rows already exist on prod". ─────────────
set session_replication_role = replica;
insert into auth.users (id, email, raw_user_meta_data) values
  ('5e1f0000-0000-4000-8000-000000000001', 'legacy.staff@sg.test',    '{}'),  -- legacy care/logistics/jobs staff
  ('5e1f0000-0000-4000-8000-000000000002', 'legacy.owner@sg.test',    '{}'),  -- the owner (profiles + owner_profiles)
  ('5e1f0000-0000-4000-8000-000000000003', 'legacy.manager@sg.test',  '{}'),  -- manager (current_app_role consumers)
  ('5e1f0000-0000-4000-8000-000000000004', 'legacy.support@sg.test',  '{}'),  -- support (is_property_staff)
  ('5e1f0000-0000-4000-8000-000000000005', 'customer@sg.test',        '{}'),  -- ordinary customer (has a row)
  ('5e1f0000-0000-4000-8000-000000000006', 'norow.attacker@sg.test',  '{}'),  -- ATTACKER: no profiles row
  ('5e1f0000-0000-4000-8000-000000000007', 'norow.victim@sg.test',    '{}'),  -- no row; target of a cross-id insert
  ('5e1f0000-0000-4000-8000-000000000008', 'owner.viewer@sg.test',    '{}'),  -- owner_profiles 'viewer' (self-promotion attacker)
  ('5e1f0000-0000-4000-8000-000000000009', 'mkt.staff@sg.test',       '{}'),  -- divisional (marketplace) staff, customer profile
  ('5e1f0000-0000-4000-8000-00000000000a', 'new.staff@sg.test',       '{}'),  -- no row; to be provisioned by the service role
  ('5e1f0000-0000-4000-8000-00000000000b', 'promotee@sg.test',        '{}')   -- customer; to be promoted by the owner
on conflict (id) do nothing;
insert into public.profiles (id, role, full_name) values
  ('5e1f0000-0000-4000-8000-000000000001', 'staff',    'Legacy Staff'),
  ('5e1f0000-0000-4000-8000-000000000002', 'owner',    'Legacy Owner'),
  ('5e1f0000-0000-4000-8000-000000000003', 'manager',  'Legacy Manager'),
  ('5e1f0000-0000-4000-8000-000000000004', 'support',  'Legacy Support'),
  ('5e1f0000-0000-4000-8000-000000000005', 'customer', 'A Customer'),
  ('5e1f0000-0000-4000-8000-000000000008', 'customer', 'Owner Viewer'),
  ('5e1f0000-0000-4000-8000-000000000009', 'customer', 'Mkt Staff'),
  ('5e1f0000-0000-4000-8000-00000000000b', 'customer', 'Promotee')
on conflict (id) do nothing;
insert into public.owner_profiles (user_id, email, role, is_active) values
  ('5e1f0000-0000-4000-8000-000000000002', 'legacy.owner@sg.test', 'owner',  true),
  ('5e1f0000-0000-4000-8000-000000000008', 'owner.viewer@sg.test', 'viewer', true)
on conflict (user_id) do nothing;
insert into public.marketplace_role_memberships (user_id, role, is_active)
select '5e1f0000-0000-4000-8000-000000000009', 'marketplace_admin', true
where not exists (select 1 from public.marketplace_role_memberships
                  where user_id = '5e1f0000-0000-4000-8000-000000000009');
set session_replication_role = origin;

-- ── Load-bearing proof: the hole is LIVE before the fix ──────────────────────
do $prefix$
declare
  v_ok boolean;
begin
  begin
    perform set_config('request.jwt.claims',
      '{"sub":"5e1f0000-0000-4000-8000-000000000006","role":"authenticated"}', true);
    set local role authenticated;
    insert into public.profiles (id, role) values ('5e1f0000-0000-4000-8000-000000000006', 'staff');
    select public.is_staff_in('care') and public.is_staff_in('logistics') and public.is_staff_in('jobs')
       and public.is_staff_in('hub') and public.is_staff_in('staff') and public.is_staff_in('account')
      into v_ok;
    reset role;
    if not coalesce(v_ok, false) then
      raise exception 'FIXTURE NOT LOAD-BEARING: pre-fix self-grant did not yield staff in all 6 divisions';
    end if;
    raise exception using errcode = 'P0SG1', message = 'rollback';
  exception when sqlstate 'P0SG1' then
    reset role;
  end;
  raise notice 'staff_selfgrant_min: PRE-FIX HOLE CONFIRMED (self-insert role=staff => staff in care/logistics/jobs/hub/staff/account)';
end $prefix$;
