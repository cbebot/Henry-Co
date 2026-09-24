-- ============================================================================
-- RETIRED — DO NOT APPLY  (V3-ACTIVATION-RUNBOOK-FIX-01, 2026-09-24)
-- ----------------------------------------------------------------------------
-- Superseded early staff-workspace model. RECONCILE-01 (docs/v3/RECONCILE-01-
-- 2026-06-21.md row 10): "never adopted — superseded by the staff_* /
-- *_role_memberships model"; 20260502120000_staff_notifications_audience.sql
-- calls its tables "dead schema". None of its 10 workspace_* tables exist on
-- prod (supabase/prod-actual/schema.sql).
-- Known latent references, unchanged by retiring this file (status quo on
-- prod): apps/hub/app/lib/internal-comms-access.ts + api/owner/internal-comms/*
-- read workspace_staff_memberships / workspace_division_memberships (the reads
-- error and fail closed), and prod's hq_ic_can_read_thread() references them
-- on its non-owner 'all_owners' branch. Re-point those at *_role_memberships in
-- a code pass; do NOT apply this file to "satisfy" them.
-- Moved out of supabase/migrations/ so no CLI path picks it up. The guard
-- below (psql meta-command + DO-block raise) aborts before any DDL runs via
-- psql -f (with or without ON_ERROR_STOP), the SQL editor or apply_migration.
-- ============================================================================
\set ON_ERROR_STOP on
do $retired$
begin
  raise exception 'RETIRED MIGRATION — DO NOT APPLY: %  (docs/v3/ACTIVATION-RUNBOOK-2026-09-24.md §4)', '20260402235500_workspace_staff_platform.sql';
end
$retired$;

/* ===== RETIRED BODY — inert, kept for history only. Do not uncomment to apply;
   re-author instead (see header). ================================================

create extension if not exists pgcrypto;

create or replace function public.workspace_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.workspace_staff_memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  normalized_email text,
  full_name text,
  profile_role text,
  employment_status text not null default 'active',
  primary_division text,
  title text,
  manager_user_id uuid references auth.users(id) on delete set null,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.workspace_division_memberships (
  id uuid primary key default gen_random_uuid(),
  staff_membership_id uuid not null references public.workspace_staff_memberships(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  normalized_email text,
  division text not null,
  role text not null,
  scope_type text not null default 'platform',
  scope_id text,
  permission_overrides jsonb not null default '{}'::jsonb,
  visibility_mode text not null default 'division',
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.workspace_module_registry (
  id uuid primary key default gen_random_uuid(),
  division text not null,
  module_key text not null,
  label text not null,
  nav_group text not null default 'division',
  visibility_rule jsonb not null default '{}'::jsonb,
  route_path text not null,
  external_url text,
  sort_order integer not null default 100,
  is_enabled boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (division, module_key)
);

create table if not exists public.workspace_tasks (
  id uuid primary key default gen_random_uuid(),
  division text not null,
  source_table text,
  source_id text,
  queue_key text not null,
  title text not null,
  summary text not null default '',
  status text not null default 'new',
  priority integer not null default 50,
  assigned_staff_membership_id uuid references public.workspace_staff_memberships(id) on delete set null,
  assigned_user_id uuid references auth.users(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  due_at timestamptz,
  completed_at timestamptz,
  evidence jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.workspace_queue_items (
  id uuid primary key default gen_random_uuid(),
  division text not null,
  module_key text,
  lane_key text not null,
  source_table text,
  source_id text,
  task_id uuid references public.workspace_tasks(id) on delete set null,
  state text not null default 'active',
  assigned_staff_membership_id uuid references public.workspace_staff_memberships(id) on delete set null,
  position integer not null default 0,
  sla_due_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.workspace_notifications (
  id uuid primary key default gen_random_uuid(),
  staff_membership_id uuid references public.workspace_staff_memberships(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  division text not null,
  title text not null,
  body text not null,
  priority text not null default 'normal',
  category text not null default 'general',
  action_url text,
  action_label text,
  source_table text,
  source_id text,
  is_read boolean not null default false,
  read_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.workspace_operational_events (
  id uuid primary key default gen_random_uuid(),
  division text not null,
  event_type text not null,
  source_table text,
  source_id text,
  actor_user_id uuid references auth.users(id) on delete set null,
  staff_membership_id uuid references public.workspace_staff_memberships(id) on delete set null,
  severity text not null default 'info',
  title text not null,
  summary text not null default '',
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.workspace_internal_notes (
  id uuid primary key default gen_random_uuid(),
  division text not null,
  entity_type text not null,
  entity_id text not null,
  author_user_id uuid references auth.users(id) on delete set null,
  author_staff_membership_id uuid references public.workspace_staff_memberships(id) on delete set null,
  visibility text not null default 'division',
  body text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.workspace_preferences (
  id uuid primary key default gen_random_uuid(),
  staff_membership_id uuid not null references public.workspace_staff_memberships(id) on delete cascade,
  density text not null default 'comfortable',
  default_division text,
  pinned_modules text[] not null default '{}',
  muted_divisions text[] not null default '{}',
  helper_preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (staff_membership_id)
);

create table if not exists public.workspace_helper_signals (
  id uuid primary key default gen_random_uuid(),
  division text not null,
  module_key text,
  source_type text not null,
  source_table text,
  source_id text,
  signal_type text not null,
  title text not null,
  summary text not null,
  tone text not null default 'info',
  evidence jsonb not null default '[]'::jsonb,
  score numeric(6,2) not null default 0,
  expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists workspace_staff_memberships_user_idx
  on public.workspace_staff_memberships(user_id);
create index if not exists workspace_staff_memberships_email_idx
  on public.workspace_staff_memberships(normalized_email);
create unique index if not exists workspace_staff_memberships_user_email_uidx
  on public.workspace_staff_memberships(
    coalesce(user_id, '00000000-0000-0000-0000-000000000000'::uuid),
    coalesce(normalized_email, '')
  );

create index if not exists workspace_division_memberships_staff_idx
  on public.workspace_division_memberships(staff_membership_id);
create index if not exists workspace_division_memberships_division_idx
  on public.workspace_division_memberships(division, role, is_active);
create index if not exists workspace_division_memberships_user_idx
  on public.workspace_division_memberships(user_id);

create index if not exists workspace_tasks_division_status_idx
  on public.workspace_tasks(division, status, priority desc);
create index if not exists workspace_tasks_assignee_idx
  on public.workspace_tasks(assigned_staff_membership_id, assigned_user_id);
create index if not exists workspace_queue_items_lane_idx
  on public.workspace_queue_items(division, lane_key, state, position);
create index if not exists workspace_notifications_user_idx
  on public.workspace_notifications(user_id, is_read, created_at desc);
create index if not exists workspace_events_division_idx
  on public.workspace_operational_events(division, event_type, created_at desc);
create index if not exists workspace_notes_entity_idx
  on public.workspace_internal_notes(division, entity_type, entity_id, created_at desc);
create index if not exists workspace_helper_signals_division_idx
  on public.workspace_helper_signals(division, signal_type, score desc, created_at desc);

alter table public.workspace_staff_memberships enable row level security;
alter table public.workspace_division_memberships enable row level security;
alter table public.workspace_module_registry enable row level security;
alter table public.workspace_tasks enable row level security;
alter table public.workspace_queue_items enable row level security;
alter table public.workspace_notifications enable row level security;
alter table public.workspace_operational_events enable row level security;
alter table public.workspace_internal_notes enable row level security;
alter table public.workspace_preferences enable row level security;
alter table public.workspace_helper_signals enable row level security;

drop trigger if exists workspace_staff_memberships_updated_at on public.workspace_staff_memberships;
create trigger workspace_staff_memberships_updated_at
before update on public.workspace_staff_memberships
for each row execute function public.workspace_set_updated_at();

drop trigger if exists workspace_division_memberships_updated_at on public.workspace_division_memberships;
create trigger workspace_division_memberships_updated_at
before update on public.workspace_division_memberships
for each row execute function public.workspace_set_updated_at();

drop trigger if exists workspace_module_registry_updated_at on public.workspace_module_registry;
create trigger workspace_module_registry_updated_at
before update on public.workspace_module_registry
for each row execute function public.workspace_set_updated_at();

drop trigger if exists workspace_tasks_updated_at on public.workspace_tasks;
create trigger workspace_tasks_updated_at
before update on public.workspace_tasks
for each row execute function public.workspace_set_updated_at();

drop trigger if exists workspace_queue_items_updated_at on public.workspace_queue_items;
create trigger workspace_queue_items_updated_at
before update on public.workspace_queue_items
for each row execute function public.workspace_set_updated_at();

drop trigger if exists workspace_notifications_updated_at on public.workspace_notifications;
create trigger workspace_notifications_updated_at
before update on public.workspace_notifications
for each row execute function public.workspace_set_updated_at();

drop trigger if exists workspace_operational_events_updated_at on public.workspace_operational_events;
create trigger workspace_operational_events_updated_at
before update on public.workspace_operational_events
for each row execute function public.workspace_set_updated_at();

drop trigger if exists workspace_internal_notes_updated_at on public.workspace_internal_notes;
create trigger workspace_internal_notes_updated_at
before update on public.workspace_internal_notes
for each row execute function public.workspace_set_updated_at();

drop trigger if exists workspace_preferences_updated_at on public.workspace_preferences;
create trigger workspace_preferences_updated_at
before update on public.workspace_preferences
for each row execute function public.workspace_set_updated_at();

drop trigger if exists workspace_helper_signals_updated_at on public.workspace_helper_signals;
create trigger workspace_helper_signals_updated_at
before update on public.workspace_helper_signals
for each row execute function public.workspace_set_updated_at();

===== end RETIRED BODY ===== */
