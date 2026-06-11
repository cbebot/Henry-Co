-- SCHEMA-TRUTH-01 — shadow-DB platform bootstrap.
--
-- Reproduces, on a vanilla PostgreSQL 17, the Supabase platform surface the
-- PROD-ACTUAL snapshot (supabase/prod-actual/schema.sql) and the FL2 migration
-- set depend on. Extends apps/hub/supabase/tests/_bootstrap_supabase_env.sql
-- (the FL2-minimal CI stub) to full prod shape: auth claim functions, the
-- auth.users columns the signup triggers read, the storage.objects surface the
-- bucket policies bind to, the realtime publication, and — load-bearing — the
-- Supabase DEFAULT PRIVILEGES that auto-grant to the request roles (the exact
-- condition the FL1 money-RPC revokes must defeat; without these the grant
-- invariants would false-green, see the CI stub's header).
--
-- Shadow-only. Never applied to prod.

-- ============ request-path roles ============
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon')          then create role anon          nologin noinherit; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin noinherit; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role')  then create role service_role  nologin noinherit bypassrls; end if;
end $$;
grant usage on schema public to anon, authenticated, service_role;

-- ============ Supabase default privileges (FL1 trap condition) ============
alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;

-- ============ extensions schema ============
create schema if not exists extensions;
grant usage on schema extensions to anon, authenticated, service_role;

-- Supabase sets the database search_path to include `extensions`, which is why
-- prod DDL renders extension calls (uuid_generate_v4 …) unqualified. Mirror it.
do $$ begin
  execute format('alter database %I set search_path = ''$user'', public, extensions', current_database());
end $$;

-- ============ auth surface ============
create schema if not exists auth;

-- Columns limited to what prod's public-side objects actually touch: FK targets
-- (id) and the signup-trigger reads (email, created_at, raw_user_meta_data,
-- raw_app_meta_data). The real auth.users is platform-managed on both sides.
create table if not exists auth.users (
  id uuid primary key,
  email text,
  phone text,
  created_at timestamptz not null default now(),
  raw_user_meta_data jsonb not null default '{}'::jsonb,
  raw_app_meta_data jsonb not null default '{}'::jsonb,
  last_sign_in_at timestamptz
);

-- Claim functions, faithful to the Supabase definitions (GoTrue request claims),
-- so RLS policies and the invariant tests' role simulation behave identically.
create or replace function auth.uid() returns uuid
  language sql stable
  as $$
    select nullif(coalesce(
      current_setting('request.jwt.claim.sub', true),
      current_setting('request.jwt.claims', true)::jsonb ->> 'sub'
    ), '')::uuid
  $$;

create or replace function auth.role() returns text
  language sql stable
  as $$
    select coalesce(
      current_setting('request.jwt.claim.role', true),
      current_setting('request.jwt.claims', true)::jsonb ->> 'role'
    )
  $$;

create or replace function auth.jwt() returns jsonb
  language sql stable
  as $$
    select coalesce(
      nullif(current_setting('request.jwt.claims', true), ''),
      '{}'
    )::jsonb
  $$;

create or replace function auth.email() returns text
  language sql stable
  as $$
    select coalesce(
      current_setting('request.jwt.claim.email', true),
      current_setting('request.jwt.claims', true)::jsonb ->> 'email'
    )
  $$;

grant usage on schema auth to anon, authenticated, service_role;
grant execute on function auth.uid(), auth.role(), auth.jwt(), auth.email() to anon, authenticated, service_role;

-- ============ storage surface (bucket policies bind to storage.objects) ============
create schema if not exists storage;

create table if not exists storage.buckets (
  id text primary key,
  name text not null,
  public boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text references storage.buckets(id),
  name text,
  owner uuid,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table storage.objects enable row level security;

grant usage on schema storage to anon, authenticated, service_role;
grant all on storage.objects, storage.buckets to service_role;
grant select on storage.objects, storage.buckets to anon, authenticated;

-- ============ realtime publication ============
do $$ begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end $$;

select 'shadow platform bootstrap ready' as status;
