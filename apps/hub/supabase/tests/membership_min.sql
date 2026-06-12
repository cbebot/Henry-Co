-- SEC-HARDEN-02 CI fixture — minimal role-membership surface.
--
-- The five *_role_memberships tables, their staff-gate functions, and the
-- world-writable "Service role full access"(true) policies live on prod
-- out-of-band (division feature migrations + dashboard edits) — they are NOT
-- created by any FL2 migration, so the vanilla CI grant chain has nothing for
-- 20260612140000_sec_harden_02_role_membership_lockdown.sql to lock down.
--
-- This fixture reproduces, faithfully, the EXACT production pre-fix state so the
-- migration has real objects to act on and the invariant can assert the end-state:
--   • the 5 tables with their real columns + RLS enabled,
--   • the standing anon/authenticated write GRANT (prod grants all DML to the
--     request roles — _bootstrap_supabase_env.sql only default-grants FUNCTIONS,
--     so the table grant is reproduced explicitly here),
--   • the world-writable "Service role full access" FOR ALL TO public USING(true)
--     policy on learn/logistics/property/studio (the hole),
--   • the authenticated staff-write policies the migration must remove
--     ("learn staff all role memberships", property "staff can manage role
--     memberships"),
--   • the self-read policies that must survive (studio_member_roles,
--     marketplace_member_roles),
--   • the functions the policies reference (learn_auth_email, studio_auth_email,
--     learn_is_staff, studio_is_staff, is_property_staff) — faithful enough that
--     the SECURITY INVOKER gates resolve against the table.
-- Run AFTER _bootstrap_supabase_env.sql.

set check_function_bodies = off;

-- auth.uid()/auth.jwt() exist from _bootstrap_supabase_env.sql. Add the email
-- helpers the membership policies reference.
create or replace function public.learn_auth_email() returns text
  language sql stable set search_path = public, pg_catalog
  as $$ select nullif(lower(coalesce(auth.jwt() ->> 'email','')), '') $$;
create or replace function public.studio_auth_email() returns text
  language sql stable set search_path = public, pg_catalog
  as $$ select nullif(lower(coalesce(auth.jwt() ->> 'email','')), '') $$;

-- The five membership tables (real column shape).
create table if not exists public.learn_role_memberships (
  id uuid primary key default gen_random_uuid(), user_id uuid, normalized_email text,
  is_active boolean not null default true, role text not null default 'viewer',
  scope_type text not null default 'division', scope_id text, created_at timestamptz not null default now());
create table if not exists public.logistics_role_memberships (
  id uuid primary key default gen_random_uuid(), user_id uuid, normalized_email text,
  is_active boolean not null default true, role text not null default 'viewer',
  scope_type text not null default 'division', scope_id text, created_at timestamptz not null default now());
create table if not exists public.property_role_memberships (
  id uuid primary key default gen_random_uuid(), user_id uuid, normalized_email text,
  is_active boolean not null default true, role text not null default 'viewer',
  scope_type text not null default 'division', scope_id text, created_at timestamptz not null default now());
create table if not exists public.studio_role_memberships (
  id uuid primary key default gen_random_uuid(), user_id uuid, normalized_email text,
  is_active boolean not null default true, role text not null default 'viewer',
  scope_type text not null default 'division', scope_id text, created_at timestamptz not null default now(),
  updated_at timestamptz default now());
create table if not exists public.marketplace_role_memberships (
  id uuid primary key default gen_random_uuid(), user_id uuid, normalized_email text,
  scope_type text not null default 'platform', scope_id uuid, role text not null,
  is_active boolean not null default true, created_at timestamptz not null default now(),
  updated_at timestamptz not null default now());

alter table public.learn_role_memberships       enable row level security;
alter table public.logistics_role_memberships   enable row level security;
alter table public.property_role_memberships     enable row level security;
alter table public.studio_role_memberships       enable row level security;
alter table public.marketplace_role_memberships  enable row level security;

-- The standing prod write grant to the request roles (the latent half of the hole).
grant select, insert, update, delete, truncate on table
  public.learn_role_memberships, public.logistics_role_memberships,
  public.property_role_memberships, public.studio_role_memberships,
  public.marketplace_role_memberships
  to anon, authenticated;
grant select, insert, update, delete, truncate on table
  public.learn_role_memberships, public.logistics_role_memberships,
  public.property_role_memberships, public.studio_role_memberships,
  public.marketplace_role_memberships
  to service_role;

-- Staff-gate functions referenced by the prod policies. learn_is_staff /
-- studio_is_staff are SECURITY INVOKER (read their table as the caller);
-- is_property_staff reads profiles. Faithful bodies so the gates resolve.
create table if not exists public.profiles (id uuid primary key, role text);
create or replace function public.learn_is_staff() returns boolean
  language sql stable set search_path = public, pg_catalog as $$
  select exists (select 1 from public.learn_role_memberships m
    where m.is_active = true and (m.user_id = auth.uid()
      or (m.normalized_email is not null and m.normalized_email = public.learn_auth_email()))) $$;
create or replace function public.studio_is_staff() returns boolean
  language sql stable set search_path = public, pg_catalog as $$
  select exists (select 1 from public.studio_role_memberships m
    where m.is_active = true and (m.user_id = auth.uid()
      or (m.normalized_email is not null and m.normalized_email = public.studio_auth_email()))) $$;
create or replace function public.is_property_staff() returns boolean
  language sql stable set search_path = public, pg_catalog as $$
  select exists (select 1 from public.profiles
    where id = auth.uid() and role in ('owner','manager','staff','support')) $$;

-- The prod policy set, verbatim in shape (this is the pre-fix state).
drop policy if exists "Service role full access" on public.learn_role_memberships;
create policy "Service role full access" on public.learn_role_memberships
  as permissive for all to public using (true) with check (true);
drop policy if exists "learn staff all role memberships" on public.learn_role_memberships;
create policy "learn staff all role memberships" on public.learn_role_memberships
  as permissive for all to public using (learn_is_staff()) with check (learn_is_staff());

drop policy if exists "Service role full access" on public.logistics_role_memberships;
create policy "Service role full access" on public.logistics_role_memberships
  as permissive for all to public using (true) with check (true);

drop policy if exists "Service role full access" on public.property_role_memberships;
create policy "Service role full access" on public.property_role_memberships
  as permissive for all to public using (true) with check (true);
drop policy if exists "staff can manage role memberships" on public.property_role_memberships;
create policy "staff can manage role memberships" on public.property_role_memberships
  as permissive for all to public using (is_property_staff()) with check (is_property_staff());

drop policy if exists "Service role full access" on public.studio_role_memberships;
create policy "Service role full access" on public.studio_role_memberships
  as permissive for all to public using (true) with check (true);
drop policy if exists studio_member_roles on public.studio_role_memberships;
create policy studio_member_roles on public.studio_role_memberships
  as permissive for select to public
  using (user_id = (select auth.uid())
    or (normalized_email is not null and normalized_email = studio_auth_email()));

drop policy if exists marketplace_member_roles on public.marketplace_role_memberships;
create policy marketplace_member_roles on public.marketplace_role_memberships
  as permissive for select to public using ((select auth.uid()) = user_id);

select 'membership surface ready (world-writable policy + standing anon/authenticated write grant reproduce the prod hole)' as status;
