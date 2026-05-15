-- V3 PASS 21 — Jobs salary benchmarks (Distinctive Rule #5 + J8).
--
-- WHY:
--   Wellfound / Levels.fyi parity. Salary transparency is a HenryCo trust
--   pillar. /employer/jobs/new must reject "competitive" or empty salary
--   ranges (J8). Candidates on /jobs/[slug] see the role's salary range
--   alongside p25/p50/p75 benchmark context for their role+location.
--
-- TABLE:
--   public.jobs_salary_benchmarks (role_id, location, currency,
--                                  p25_minor, p50_minor, p75_minor,
--                                  sample_size, sourced_at, source_label)
--
-- RLS:
--   - Read: public (anon + auth) — salary transparency is the product.
--   - Write: service-role only (back-office ETL writes).
--
-- DOWN:
--   drop table if exists public.jobs_salary_benchmarks;
--
-- IDEMPOTENT: yes.

create table if not exists public.jobs_salary_benchmarks (
  id uuid primary key default gen_random_uuid(),
  role_id uuid references public.jobs_role_titles(id) on delete cascade,
  role_slug text not null,
  location text not null,
  location_normalized text generated always as (lower(location)) stored,
  currency text not null default 'NGN',
  period text not null default 'YEAR'
    check (period in ('YEAR', 'MONTH', 'WEEK', 'DAY', 'HOUR')),
  p25_minor bigint not null,
  p50_minor bigint not null,
  p75_minor bigint not null,
  sample_size int not null default 0,
  source_label text,
  sourced_at timestamptz not null default timezone('utc', now()),
  status text not null default 'active'
    check (status in ('active', 'archived')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists jobs_salary_benchmarks_role_loc_idx
  on public.jobs_salary_benchmarks (role_slug, location_normalized, currency, period)
  where status = 'active';

create index if not exists jobs_salary_benchmarks_role_idx
  on public.jobs_salary_benchmarks (role_id)
  where role_id is not null;

alter table public.jobs_salary_benchmarks enable row level security;

drop policy if exists "jobs salary benchmarks: public read active" on public.jobs_salary_benchmarks;
create policy "jobs salary benchmarks: public read active"
  on public.jobs_salary_benchmarks
  for select
  using (status = 'active');

drop policy if exists "jobs salary benchmarks: service role" on public.jobs_salary_benchmarks;
create policy "jobs salary benchmarks: service role"
  on public.jobs_salary_benchmarks
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

comment on table public.jobs_salary_benchmarks is
  'V3 PASS 21 — salary transparency (Distinctive Rule #5). Read public so '
  '/jobs/[slug] and the new-job creator can render p25/p50/p75 context. '
  'Write via back-office ETL only. role_slug + location_normalized + '
  'currency + period is the canonical compound key.';

-- end of migration --
