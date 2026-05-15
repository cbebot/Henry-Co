-- V3 PASS 21 — Jobs pipeline stages + internal application notes.
--
-- WHY:
--   Distinctive Rule #3 (drag-and-drop pipeline kanban) requires
--   configurable stages per employer/job so /employer/hiring/[pipelineId]
--   can render a true Greenhouse-shape board. The default stage order
--   lives in apps/jobs/lib/jobs/content.ts; this table lets an employer
--   override per job.
--
--   Internal application notes (employer + recruiter visible only) live
--   alongside applications and feed <ApplicationDetail> notes drawer.
--
-- TABLES:
--   public.jobs_pipeline_stages    (per-pipeline configurable stages)
--   public.jobs_application_notes  (employer/recruiter-only notes)
--
-- RLS:
--   - Read pipeline_stages: linked-pipeline employer member or service role.
--     For minimum-viable scope, RLS guards by service-role; UI reads via
--     admin client. Candidate must NEVER see internal notes.
--   - Write: service-role only (writes route through createAdminSupabase()
--     after server-side membership verification).
--
-- DOWN:
--   drop table if exists public.jobs_application_notes;
--   drop table if exists public.jobs_pipeline_stages;
--
-- IDEMPOTENT: yes.

create table if not exists public.jobs_pipeline_stages (
  id uuid primary key default gen_random_uuid(),
  pipeline_id uuid not null references public.jobs_hiring_pipelines(id) on delete cascade,
  slug text not null,
  label jsonb not null default '{}'::jsonb,
  sort_order int not null default 0,
  is_terminal boolean not null default false,
  is_default boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists jobs_pipeline_stages_unique_idx
  on public.jobs_pipeline_stages (pipeline_id, slug);
create index if not exists jobs_pipeline_stages_sort_idx
  on public.jobs_pipeline_stages (pipeline_id, sort_order);

alter table public.jobs_pipeline_stages enable row level security;

drop policy if exists "jobs pipeline stages: service role" on public.jobs_pipeline_stages;
create policy "jobs pipeline stages: service role"
  on public.jobs_pipeline_stages
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create table if not exists public.jobs_application_notes (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.jobs_applications(id) on delete cascade,
  author_user_id uuid references auth.users(id) on delete set null,
  body text not null,
  visibility text not null default 'employer'
    check (visibility in ('employer', 'recruiter', 'staff')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists jobs_application_notes_application_idx
  on public.jobs_application_notes (application_id, created_at desc);
create index if not exists jobs_application_notes_author_idx
  on public.jobs_application_notes (author_user_id)
  where author_user_id is not null;

alter table public.jobs_application_notes enable row level security;

drop policy if exists "jobs application notes: service role" on public.jobs_application_notes;
create policy "jobs application notes: service role"
  on public.jobs_application_notes
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

comment on table public.jobs_pipeline_stages is
  'V3 PASS 21 — per-pipeline configurable stages for kanban (Distinctive '
  'Rule #3). Default stage order lives in content.ts; rows here override '
  'on a per-pipeline basis. label is jsonb for i18n.';
comment on table public.jobs_application_notes is
  'V3 PASS 21 — internal notes on an application. visibility=employer is '
  'visible to the employer team only; recruiter widens to recruiters; '
  'staff is platform-only. NEVER visible to candidates.';

-- end of migration --
