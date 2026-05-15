-- V3 PASS 21 — Jobs taxonomy (skills, categories, role titles).
--
-- WHY:
--   The audit captured at SHA e5e277a noted that jobs ships with hard-coded
--   inline category/skill arrays in `apps/jobs/lib/jobs/content.ts`. To make
--   the taxonomy multilingual (Africa-first ecosystem ships en/fr/es/pt/ar
--   plus ig/yo/ha) and admin-editable, persist three governed taxonomies
--   with i18n jsonb names + slugs.
--
-- TABLES:
--   public.jobs_skills        (id, slug, name jsonb, category_id nullable,
--                              status text, sort_order int, created_at)
--   public.jobs_categories    (id, slug, name jsonb, description jsonb,
--                              icon_key text, sort_order int, status text,
--                              created_at)
--   public.jobs_role_titles   (id, slug, name jsonb, category_id nullable,
--                              seniority_hint text, status text, created_at)
--
-- The `name` column is `jsonb` shaped like `{en, fr, es, pt, ar, ig, yo,
-- ha, de, zh, hi, it}` — resolved per AppLocale at render time.
--
-- RLS:
--   - Read (anon + authenticated): only rows with status='active'.
--   - Write: admin / owner only via SECURITY DEFINER functions (added in
--     a follow-up if/when an admin taxonomy editor lands). For now,
--     service-role writes are the only path (server-side seed scripts).
--
-- DOWN:
--   drop policy "jobs taxonomy: public read active" on public.jobs_skills;
--   drop policy "jobs taxonomy: public read active" on public.jobs_categories;
--   drop policy "jobs taxonomy: public read active" on public.jobs_role_titles;
--   drop policy "jobs taxonomy: service role" on public.jobs_skills;
--   drop policy "jobs taxonomy: service role" on public.jobs_categories;
--   drop policy "jobs taxonomy: service role" on public.jobs_role_titles;
--   drop table if exists public.jobs_role_titles;
--   drop table if exists public.jobs_skills;
--   drop table if exists public.jobs_categories;
--
-- IDEMPOTENT: yes.

create table if not exists public.jobs_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name jsonb not null default '{}'::jsonb,
  description jsonb not null default '{}'::jsonb,
  icon_key text,
  sort_order int not null default 0,
  status text not null default 'active'
    check (status in ('active', 'archived')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists jobs_categories_status_idx
  on public.jobs_categories (status, sort_order);

alter table public.jobs_categories enable row level security;

drop policy if exists "jobs taxonomy: public read active" on public.jobs_categories;
create policy "jobs taxonomy: public read active"
  on public.jobs_categories
  for select
  using (status = 'active');

drop policy if exists "jobs taxonomy: service role" on public.jobs_categories;
create policy "jobs taxonomy: service role"
  on public.jobs_categories
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create table if not exists public.jobs_skills (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name jsonb not null default '{}'::jsonb,
  category_id uuid references public.jobs_categories(id) on delete set null,
  status text not null default 'active'
    check (status in ('active', 'archived')),
  sort_order int not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists jobs_skills_status_idx
  on public.jobs_skills (status, sort_order);
create index if not exists jobs_skills_category_idx
  on public.jobs_skills (category_id)
  where category_id is not null;

alter table public.jobs_skills enable row level security;

drop policy if exists "jobs taxonomy: public read active" on public.jobs_skills;
create policy "jobs taxonomy: public read active"
  on public.jobs_skills
  for select
  using (status = 'active');

drop policy if exists "jobs taxonomy: service role" on public.jobs_skills;
create policy "jobs taxonomy: service role"
  on public.jobs_skills
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create table if not exists public.jobs_role_titles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name jsonb not null default '{}'::jsonb,
  category_id uuid references public.jobs_categories(id) on delete set null,
  seniority_hint text
    check (seniority_hint is null or seniority_hint in (
      'entry', 'mid', 'senior', 'lead', 'staff', 'principal', 'director', 'vp', 'c-level'
    )),
  status text not null default 'active'
    check (status in ('active', 'archived')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists jobs_role_titles_status_idx
  on public.jobs_role_titles (status);
create index if not exists jobs_role_titles_category_idx
  on public.jobs_role_titles (category_id)
  where category_id is not null;

alter table public.jobs_role_titles enable row level security;

drop policy if exists "jobs taxonomy: public read active" on public.jobs_role_titles;
create policy "jobs taxonomy: public read active"
  on public.jobs_role_titles
  for select
  using (status = 'active');

drop policy if exists "jobs taxonomy: service role" on public.jobs_role_titles;
create policy "jobs taxonomy: service role"
  on public.jobs_role_titles
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

comment on table public.jobs_categories is
  'V3 PASS 21 — i18n jsonb taxonomy. Read public when status=active; '
  'write via service-role / admin DEFINER only.';
comment on table public.jobs_skills is
  'V3 PASS 21 — i18n jsonb taxonomy. Skills referenced by listings and '
  'jobs_skill_verifications.';
comment on table public.jobs_role_titles is
  'V3 PASS 21 — i18n jsonb taxonomy. Role titles seed salary benchmarks '
  '(jobs_salary_benchmarks.role_id).';

-- end of migration --
