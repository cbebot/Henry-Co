-- V3-34 CI FIDELITY SEED — make the migration's table-grant REVOKES load-bearing.
--
-- _bootstrap_supabase_env.sql reproduces Supabase's standing default privileges
-- only for FUNCTIONS, not TABLES. So on vanilla CI Postgres a freshly created
-- table carries no request-role grants, and the migration's `revoke ... from
-- anon/service_role` would be no-ops (nothing to strip) — the grant invariant
-- would pass without ever proving the revoke does its job (a future migration
-- that forgot a revoke would false-green on CI while leaking on prod).
--
-- Run this BEFORE the V3-34 migration. It pre-creates the two tables (the
-- migration's create-if-not-exists then no-ops) and grants the broad request-
-- role ACL Supabase auto-grants at table creation on prod. The migration's
-- subsequent revokes then genuinely strip it. Mirrors membership_min.sql /
-- sec_harden_03_min.sql. Schema MUST stay identical to the migration's tables.

create table if not exists public.user_home_layouts (
  user_id uuid not null references auth.users (id) on delete cascade,
  surface text not null default 'account'
    check (surface in ('account', 'owner', 'staff')),
  desktop_module_order text[] not null default '{}',
  mobile_module_order  text[] not null default '{}',
  hidden_modules       text[] not null default '{}',
  pinned_modules       text[] not null default '{}',
  last_personalized_at timestamptz not null default now(),
  personalization_signal_version integer not null default 1,
  updated_at timestamptz not null default now(),
  primary key (user_id, surface)
);

create table if not exists public.personalization_consent_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  action text not null check (action in ('granted', 'revoked')),
  consent_text_version text not null,
  source text not null default 'account_settings',
  created_at timestamptz not null default now()
);

-- The prod standing ACL Supabase grants request roles on new public tables.
grant all on public.user_home_layouts to anon, authenticated, service_role;
grant all on public.personalization_consent_events to anon, authenticated, service_role;
