-- SEC-HARDEN-01 — self-contained exploit-is-dead proof (native PG17).
--
-- Reproduces, on a throwaway DB, the EXACT production conditions for two of the
-- three advisor findings, asserts the hole is OPEN before the migration and DEAD
-- after it, and leaves the DB in the post-migration state so `supabase db
-- advisors --db-url` can confirm the advisor findings clear. (The third finding,
-- auth_leaked_password_protection, is an Auth-service config toggle with no DB
-- surface — proven separately via the Management API field password_hibp_enabled.)
--
-- Usage (run by scripts/v3/prove-sec-harden-01.ps1):
--   1. \i this file   (builds the surface + BEFORE assertions)
--   2. \i ../../apps/hub/supabase/migrations/20260612120000_sec_harden_01_audit_grants_and_bucket.sql
--   3. \i prove-sec-harden-01-after.sql  (AFTER assertions)

\set ON_ERROR_STOP on

-- ── Supabase-like platform: request roles + the load-bearing default privilege ──
do $$ begin
  if not exists (select 1 from pg_roles where rolname='anon')          then create role anon          nologin noinherit; end if;
  if not exists (select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin noinherit; end if;
  if not exists (select 1 from pg_roles where rolname='service_role')  then create role service_role  nologin noinherit bypassrls; end if;
end $$;
grant usage on schema public to anon, authenticated, service_role;
create schema if not exists auth;
create or replace function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;
-- THE production condition: every public function created hereafter is granted
-- EXECUTE to anon + authenticated DIRECTLY (not via PUBLIC).
alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;

-- ── Finding 1 surface: the two audit writers (faithful signatures) ──
set check_function_bodies = off;
create or replace function public.is_staff_in_any()
returns boolean language sql stable security definer set search_path = public as $$ select false $$;
create or replace function public.add_audit_log(
  p_action text, p_entity_type text, p_entity_id text default null,
  p_target_user_id uuid default null, p_metadata jsonb default '{}'::jsonb)
returns void language plpgsql security definer set search_path = public as $$ begin return; end $$;
create or replace function public.add_audit_log_v2(
  p_action text, p_entity_type text, p_entity_id text default null,
  p_old_values jsonb default null, p_new_values jsonb default null, p_reason text default null,
  p_division text default null, p_correlation_id uuid default null)
returns uuid language plpgsql security definer set search_path = public as $$ begin return gen_random_uuid(); end $$;

-- ── Finding 1b surface: the audit_logs DIRECT TABLE forge path ──
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid, entity_type text, action text,
  created_at timestamptz not null default now());
alter table public.audit_logs enable row level security;
grant insert, update, truncate, select on table public.audit_logs to anon, authenticated;
grant insert, update, delete, truncate, select on table public.audit_logs to service_role;
drop policy if exists "insert audit logs (auth)" on public.audit_logs;
create policy "insert audit logs (auth)" on public.audit_logs
  as permissive for insert to authenticated with check (true);

-- ── Finding 3 surface: minimal Storage with the public company-assets bucket ──
create schema if not exists storage;
create table if not exists storage.buckets (id text primary key, name text, public boolean default false);
create table if not exists storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text references storage.buckets(id),
  name text);
insert into storage.buckets (id, name, public) values ('company-assets','company-assets',true)
  on conflict (id) do update set public = true;
alter table storage.objects enable row level security;
-- Reproduce the four owner policies + the broad public listing policy (verbatim shape from prod).
create table if not exists public.owner_profiles (user_id uuid, is_active boolean, role text);
drop policy if exists company_assets_owner_insert on storage.objects;
create policy company_assets_owner_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'company-assets' and exists (select 1 from public.owner_profiles op
    where op.user_id = (select auth.uid()) and op.is_active = true and op.role = any(array['owner','admin'])));
drop policy if exists company_assets_owner_update on storage.objects;
create policy company_assets_owner_update on storage.objects for update to authenticated
  using (bucket_id = 'company-assets' and exists (select 1 from public.owner_profiles op
    where op.user_id = (select auth.uid()) and op.is_active = true and op.role = any(array['owner','admin'])));
drop policy if exists company_assets_owner_delete on storage.objects;
create policy company_assets_owner_delete on storage.objects for delete to authenticated
  using (bucket_id = 'company-assets' and exists (select 1 from public.owner_profiles op
    where op.user_id = (select auth.uid()) and op.is_active = true and op.role = any(array['owner','admin'])));
drop policy if exists company_assets_public_read on storage.objects;
create policy company_assets_public_read on storage.objects for select to public
  using (bucket_id = 'company-assets');

-- ── BEFORE assertions: the holes are OPEN ──
do $$
declare v int := 0;
begin
  raise notice '=== BEFORE migration ===';
  -- v1 + v2 are reachable by anon AND authenticated (the forge/flood hole).
  if not has_function_privilege('anon','public.add_audit_log(text,text,text,uuid,jsonb)','EXECUTE')          then raise warning 'expected anon CAN execute v1';          v:=v+1; end if;
  if not has_function_privilege('authenticated','public.add_audit_log(text,text,text,uuid,jsonb)','EXECUTE') then raise warning 'expected authenticated CAN execute v1'; v:=v+1; end if;
  if not has_function_privilege('anon','public.add_audit_log_v2(text,text,text,jsonb,jsonb,text,text,uuid)','EXECUTE')          then raise warning 'expected anon CAN execute v2';          v:=v+1; end if;
  if not has_function_privilege('authenticated','public.add_audit_log_v2(text,text,text,jsonb,jsonb,text,text,uuid)','EXECUTE') then raise warning 'expected authenticated CAN execute v2'; v:=v+1; end if;
  -- The direct-table forge path is open: authenticated can INSERT into audit_logs
  -- and the always-true forge policy is present.
  if not has_table_privilege('authenticated','public.audit_logs','INSERT') then raise warning 'expected authenticated CAN insert audit_logs'; v:=v+1; end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='audit_logs' and policyname='insert audit logs (auth)') then raise warning 'expected forge policy present'; v:=v+1; end if;
  -- The broad public listing policy exists.
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='company_assets_public_read') then raise warning 'expected public_read policy present'; v:=v+1; end if;
  if v > 0 then raise exception 'BEFORE state not as expected (% checks failed) — proof harness is mis-built', v; end if;
  raise notice 'BEFORE: hole confirmed OPEN — anon+authenticated can EXECUTE both audit writers AND directly INSERT audit_logs; company_assets_public_read present.';
end $$;
