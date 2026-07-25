-- V3-38 CI FIDELITY SEED — make the migration's table-grant REVOKES load-bearing.
--
-- _bootstrap_supabase_env.sql reproduces Supabase's standing default privileges
-- only for FUNCTIONS, not TABLES. So on vanilla CI Postgres a freshly created
-- table carries no request-role grants, and the migration's `revoke ... from
-- anon/authenticated/service_role` would be no-ops (nothing to strip) — the
-- grant invariant would pass without ever proving the revoke does its job.
--
-- Run this BEFORE the V3-38 migration. It pre-creates the two tables (the
-- migration's create-if-not-exists then no-ops) and grants the broad request-
-- role ACL Supabase auto-grants at table creation on prod. The migration's
-- subsequent revokes then genuinely strip it. Mirrors personalization_min.sql.
-- Schema MUST stay identical to the migration's tables.

create table if not exists public.service_area_coverage (
  id uuid primary key default gen_random_uuid(),
  division text not null
    check (division in ('care', 'marketplace', 'property', 'logistics')),
  offering_key text not null
    check (char_length(offering_key) between 1 and 64
           and offering_key ~* '^[a-z0-9][a-z0-9_.:-]*$'),
  country text not null check (country ~ '^[A-Z]{2}$'),
  region text,
  city text,
  provider_count integer not null default 0 check (provider_count >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique nulls not distinct (division, offering_key, country, region, city)
);

create table if not exists public.service_availability_gaps (
  division text not null
    check (division in ('care', 'marketplace', 'property', 'logistics')),
  offering_key text not null
    check (char_length(offering_key) between 1 and 64
           and offering_key ~* '^[a-z0-9][a-z0-9_.:-]*$'),
  country text not null check (country ~ '^[A-Z]{2}$'),
  region text not null default '' check (char_length(region) <= 80),
  city text not null default '' check (char_length(city) <= 80),
  shown_count bigint not null default 0 check (shown_count >= 0),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  primary key (division, offering_key, country, region, city)
);

-- The prod standing ACL Supabase grants request roles on new public tables.
grant all on public.service_area_coverage to anon, authenticated, service_role;
grant all on public.service_availability_gaps to anon, authenticated, service_role;
