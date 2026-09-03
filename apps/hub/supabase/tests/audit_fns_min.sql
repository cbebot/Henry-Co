-- SEC-HARDEN-01 CI fixture — minimal audit-writer surface.
--
-- The two audit writers (add_audit_log, add_audit_log_v2) and their staff
-- predicate (is_staff_in_any) live on prod out-of-band (the is_staff_in_any
-- migration, already applied) and in the prod-actual shadow — they are NOT
-- created by any FL2 migration. The vanilla CI grant chain therefore has no
-- audit functions for 20260612120000_sec_harden_01_audit_grants_and_bucket.sql
-- to lock down.
--
-- This fixture creates faithful STUBS of exactly those three functions, with the
-- real signatures, AFTER _bootstrap_supabase_env.sql has run its load-bearing
--   `alter default privileges in schema public grant execute on functions
--    to anon, authenticated, service_role`.
-- Because of that default privilege, each stub is auto-granted EXECUTE to anon +
-- authenticated DIRECTLY on creation — reproducing the exact production hole the
-- migration must defeat. The grant invariant only inspects has_function_privilege
-- (it never EXECUTEs the stubs), so trivial bodies are sufficient and correct.

set check_function_bodies = off;

create or replace function public.is_staff_in_any()
returns boolean language sql stable security definer set search_path = public
as $$ select false $$;

create or replace function public.add_audit_log(
  p_action text,
  p_entity_type text,
  p_entity_id text default null,
  p_target_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns void language plpgsql security definer set search_path = public
as $$ begin return; end $$;

create or replace function public.add_audit_log_v2(
  p_action text,
  p_entity_type text,
  p_entity_id text default null,
  p_old_values jsonb default null,
  p_new_values jsonb default null,
  p_reason text default null,
  p_division text default null,
  p_correlation_id uuid default null
)
returns uuid language plpgsql security definer set search_path = public
as $$ begin return gen_random_uuid(); end $$;

-- The DIRECT-TABLE forge path (FINDING 1b): reproduce the prod audit_logs table
-- with its over-broad authenticated write grant + the always-true INSERT policy, so
-- the migration's table lockdown has a real object to act on and the invariant can
-- assert the path is dead. Column shape is minimal — the grant invariant inspects
-- has_table_privilege + pg_policies, never inserts a row.
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  entity_type text,
  action text,
  created_at timestamptz not null default now()
);
alter table public.audit_logs enable row level security;
grant insert, update, truncate, select on table public.audit_logs to anon, authenticated;
grant insert, update, delete, truncate, select on table public.audit_logs to service_role;
drop policy if exists "insert audit logs (auth)" on public.audit_logs;
create policy "insert audit logs (auth)" on public.audit_logs
  as permissive for insert to authenticated with check (true);

select 'audit-writer + table stubs ready (anon/authenticated EXECUTE + INSERT reproduce the prod holes)' as status;
