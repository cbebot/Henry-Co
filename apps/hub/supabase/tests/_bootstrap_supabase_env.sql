-- FL1 backstop bootstrap — reproduce, on a vanilla Postgres in CI, the parts of a
-- Supabase project that make the payment grant-invariant test MEANINGFUL.
--
-- WHY THIS FILE EXISTS (load-bearing): the money bug was that Supabase's project
-- bootstrap runs `alter default privileges in schema public grant execute on
-- functions to anon, authenticated` — DIRECT grants that `revoke ... from public`
-- does not remove. On a vanilla Postgres those direct grants do NOT exist, so
-- anon/authenticated would only ever get EXECUTE via PUBLIC; the unfixed migration's
-- `revoke ... from public` would then look "safe" and the test would FALSE-GREEN.
-- We must recreate the direct default-privilege grants here so the test actually
-- exercises the real production condition.

-- Supabase platform roles (PostgREST request roles + the privileged backend role).
do $$ begin
  if not exists (select 1 from pg_roles where rolname='anon')          then create role anon          nologin noinherit; end if;
  if not exists (select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin noinherit; end if;
  if not exists (select 1 from pg_roles where rolname='service_role')  then create role service_role  nologin noinherit bypassrls; end if;
end $$;
grant usage on schema public to anon, authenticated, service_role;

-- Minimal `auth` surface the payment_intents migration references. `email` is
-- carried because the invariant fixtures insert it (on a prod-shaped DB the
-- real signup trigger mirrors it into customer_profiles.email NOT NULL).
create schema if not exists auth;
create table if not exists auth.users (
  id uuid primary key,
  email text,
  raw_user_meta_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create or replace function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;

-- Finance-RLS dependency from an earlier migration (not under test) — stub so the
-- payment_intents policies resolve.
create or replace function public.is_platform_staff() returns boolean language sql stable as $$ select false $$;

-- THE load-bearing line: reproduce Supabase's default privileges so that every
-- function the migration then creates is auto-granted EXECUTE to these roles
-- DIRECTLY (not via PUBLIC). This is exactly the condition the revoke must defeat.
alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;

select 'supabase-like bootstrap ready' as status;
