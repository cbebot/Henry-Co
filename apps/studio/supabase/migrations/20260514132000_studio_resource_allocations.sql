-- V3 PASS 21 — Studio: PM resource allocation grid.
--
-- WHY:
--   V3 PASS 21 distinctive surface #7 (PM Gantt + resource allocation)
--   needs a per-week capacity table so the PM workspace can render the
--   ResourceAllocationGrid: rows = team members, columns = weeks, cell =
--   allocated %. Aggregates feed the workload heatmap on /pm.
--
-- TABLE:
--   public.studio_resource_allocations (id, team_member_user_id fk,
--   project_id fk, role_label, allocated_pct, week_starting date,
--   notes, created_by_user_id, created_at, updated_at).
--
-- RLS:
--   - Service role: full access.
--   - Studio staff: full access via public.is_staff_in('studio').
--   - Team member: SELECT own allocations (team_member_user_id =
--     auth.uid()).
--   Clients do NOT have read access (internal PM grid).
--
-- DOWN: drop policies + drop table.

create table if not exists public.studio_resource_allocations (
  id uuid primary key default gen_random_uuid(),
  team_member_user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.studio_projects(id) on delete cascade,
  role_label text not null default '',
  allocated_pct numeric(5, 2) not null default 0 check (allocated_pct >= 0 and allocated_pct <= 100),
  week_starting date not null,
  notes text,
  created_by_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists studio_resource_allocations_unique_idx
  on public.studio_resource_allocations (team_member_user_id, project_id, week_starting);

create index if not exists studio_resource_allocations_week_idx
  on public.studio_resource_allocations (week_starting desc);

create index if not exists studio_resource_allocations_project_idx
  on public.studio_resource_allocations (project_id, week_starting);

drop trigger if exists studio_resource_allocations_updated_at on public.studio_resource_allocations;
create trigger studio_resource_allocations_updated_at before update on public.studio_resource_allocations
for each row execute function public.studio_set_updated_at();

alter table public.studio_resource_allocations enable row level security;

drop policy if exists "studio resource allocations: service role" on public.studio_resource_allocations;
create policy "studio resource allocations: service role"
  on public.studio_resource_allocations
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "studio resource allocations: team member read" on public.studio_resource_allocations;
create policy "studio resource allocations: team member read"
  on public.studio_resource_allocations
  for select
  using (team_member_user_id = auth.uid());

drop policy if exists "studio resource allocations: staff" on public.studio_resource_allocations;
create policy "studio resource allocations: staff"
  on public.studio_resource_allocations
  for all
  using (public.is_staff_in('studio'))
  with check (public.is_staff_in('studio'));

comment on table public.studio_resource_allocations is
  'V3 PASS 21 — PM resource allocation grid. One row per (team_member, '
  'project, week). allocated_pct sums across projects per team_member per '
  'week to feed the workload heatmap on /pm. RLS: team member sees own '
  'allocations only; clients have no read access (internal grid).';

-- end of migration --
