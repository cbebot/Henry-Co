-- V3-39 CI FIDELITY SEED — make the migration's table-grant REVOKES load-bearing.
--
-- _bootstrap_supabase_env.sql reproduces Supabase's standing default privileges
-- only for FUNCTIONS, not TABLES. On vanilla CI Postgres a freshly created
-- table carries no request-role grants, so the migration's `revoke ... from
-- anon/service_role` would be no-ops (nothing to strip) and the grant
-- invariant would false-green while leaking on prod.
--
-- Run this BEFORE the V3-39 migration. It pre-creates the dismissals table
-- (the migration's create-if-not-exists then no-ops) and grants the broad
-- request-role ACL Supabase auto-grants at table creation on prod. The
-- migration's subsequent revokes then genuinely strip it. Mirrors
-- personalization_min.sql. Schema MUST stay identical to the migration's table.

create table if not exists public.next_action_dismissals (
  user_id uuid not null references auth.users (id) on delete cascade,
  context_kind text not null
    check (context_kind in (
      'account_home', 'marketplace_listing', 'care_service', 'jobs_detail',
      'studio_brief', 'learn_course', 'property_listing', 'logistics_booking'
    )),
  action_id text not null check (char_length(action_id) between 1 and 128),
  dismissed_at timestamptz not null default now(),
  primary key (user_id, context_kind, action_id)
);

-- The prod standing ACL Supabase grants request roles on new public tables.
grant all on public.next_action_dismissals to anon, authenticated, service_role;
