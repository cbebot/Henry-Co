-- V3-37 — RLS isolation proof for public.abandoned_tasks.
--
-- Run on a throwaway Postgres (docker) to prove a user can only read/update
-- their OWN rows and never another user's:
--
--   docker run --rm -e POSTGRES_PASSWORD=pw -p 5432:5432 -d postgres:17
--   psql "postgresql://postgres:pw@localhost:5432/postgres" \
--     -v ON_ERROR_STOP=1 -f scripts/v3/prove-abandoned-tasks-rls.sql
--
-- Expected: every `... AS ok` column prints `t`. Any `f` = an RLS hole.

-- ── Minimal Supabase-like scaffolding ───────────────────────────────────────
begin;
create schema if not exists auth;
create table if not exists auth.users (id uuid primary key);
create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role; end if;
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon; end if;
end $$;
-- data_retention_policies stub (the migration inserts a governance row).
create table if not exists public.data_retention_policies (
  schema_name text not null default 'public',
  table_name text not null,
  domain_key text, data_classification text, retention_rule text, retention_action text,
  soft_delete_required boolean, archive_required boolean, legal_hold_supported boolean,
  destructive_prune_allowed boolean, backup_requirement text, restore_source text,
  owner_team text, notes text, updated_at timestamptz default now(),
  primary key (schema_name, table_name)
);
insert into auth.users (id) values
  ('00000000-0000-0000-0000-0000000000aa'),
  ('00000000-0000-0000-0000-0000000000bb')
on conflict do nothing;
commit;

-- ── Apply the real migration ────────────────────────────────────────────────
\i apps/hub/supabase/migrations/20260610120000_v3_37_abandoned_tasks.sql

-- ── Seed one row per user (as table owner / service-role equivalent) ─────────
insert into public.abandoned_tasks (user_id, task_type, task_ref, continue_url)
values
  ('00000000-0000-0000-0000-0000000000aa', 'form_draft', 'task-A', '/continue'),
  ('00000000-0000-0000-0000-0000000000bb', 'form_draft', 'task-B', '/continue');

grant usage on schema public to authenticated;

-- ── Act as user A ───────────────────────────────────────────────────────────
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000aa';

select (count(*) = 1) as a_sees_only_own_ok from public.abandoned_tasks;
select (count(*) = 0) as a_cannot_see_b_ok from public.abandoned_tasks
  where task_ref = 'task-B';

-- A attempts to dismiss B's row — RLS must make this affect ZERO rows.
update public.abandoned_tasks set status = 'dismissed' where task_ref = 'task-B';

reset role;

-- ── Verify B's row was untouched ────────────────────────────────────────────
select (status = 'pending') as b_row_untouched_ok from public.abandoned_tasks
  where task_ref = 'task-B';

-- A user also cannot INSERT (only service-role writes); authenticated lacks the grant.
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000aa';
select (has_table_privilege('authenticated', 'public.abandoned_tasks', 'INSERT') = false)
  as authenticated_cannot_insert_ok;
reset role;
