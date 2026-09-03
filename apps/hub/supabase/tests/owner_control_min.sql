-- V3-OWNER-CONTROL-01 fixture — reproduce, on a vanilla Postgres in CI, the
-- exact production surface the owner-control migration hardens.
--
-- Run AFTER _bootstrap_supabase_env.sql (which supplies the anon/authenticated/
-- service_role roles, the auth schema, and — load-bearing — Supabase's
-- `alter default privileges ... grant execute on functions to anon,
-- authenticated, service_role`).
--
-- WHY THIS FILE EXISTS. The invariant this pass most needs to prove is that a
-- role holding an owner_profiles row cannot promote itself to owner. Both
-- 20260710180000_hub_security_hardening.sql and the first draft of the
-- owner-control migration "fixed" that with
--
--     revoke update (role, is_active) on public.owner_profiles
--       from anon, authenticated;
--
-- which does nothing, because PostgreSQL discards a column-level revoke when the
-- role holds the privilege at TABLE level — and prod grants exactly that
-- (prod-actual schema.sql :8999-:9000). On a vanilla Postgres no such table
-- grant exists, so the broken revoke would look correct and the test would
-- FALSE-GREEN in precisely the way the money-grant bootstrap above warns about.
--
-- So this fixture recreates the prod grant hole deliberately. The invariant test
-- is only meaningful because this file makes the surface wrong first.

-- ── owner_profiles — the root of trust for every owner action ────────────────
-- Shape and grants mirror prod: the full write triad to BOTH request roles, the
-- column-blind self-update policy, and the role CHECK that admits 'viewer'
-- (which is what makes self-promotion reachable).
create table if not exists public.owner_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique,
  email text,
  role text not null default 'viewer',
  is_active boolean not null default true,
  display_name text,
  created_at timestamptz not null default now()
);

do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'owner_profiles_role_check'
  ) then
    alter table public.owner_profiles
      add constraint owner_profiles_role_check
      check (role = any (array['owner'::text, 'editor'::text, 'viewer'::text]));
  end if;
end $$;

alter table public.owner_profiles enable row level security;

drop policy if exists owner_profiles_update_own on public.owner_profiles;
create policy owner_profiles_update_own on public.owner_profiles
  as permissive for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists owner_profiles_select_own on public.owner_profiles;
create policy owner_profiles_select_own on public.owner_profiles
  as permissive for select to authenticated
  using ((select auth.uid()) = user_id);

-- THE HOLE. prod-actual schema.sql :8999-:9000 — the full triad, both roles.
grant delete, insert, references, select, trigger, truncate, update
  on table public.owner_profiles to anon;
grant delete, insert, references, select, trigger, truncate, update
  on table public.owner_profiles to authenticated;
grant delete, insert, references, select, trigger, truncate, update
  on table public.owner_profiles to service_role;

-- ── the tables the migration conditionally touches ──────────────────────────
-- Present so the guarded sections are ACTIVE in CI rather than self-skipping.
-- A section that skips is a section the invariant test cannot prove.

create table if not exists public.marketplace_vendors (
  id uuid primary key default gen_random_uuid(),
  name text,
  slug text,
  owner_user_id uuid,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists public.customer_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  category text not null default 'general',
  title text,
  body text,
  created_at timestamptz not null default now()
);

select 'owner-control fixture ready (prod grant hole reproduced)' as status;
