-- =============================================================================
-- V3-70 — Employer Hiring Suite · S1: business-scope the hiring console
-- =============================================================================
-- Re-grounds the single-recruiter jobs employer console on the V3-57 business
-- primitive (`businesses` / `business_members`). A hiring pipeline may bind to a
-- business; every member of that business is a "hiring team member" and the
-- enterprise collaboration layer (S2 stage events, S3 scores, S4 team notes) is
-- RLS-gated to that team through `is_hiring_team_member(pipeline_id)`.
--
-- Ground truth (prod-actual, supabase/prod-actual/schema.sql):
--   - public.jobs_hiring_pipelines EXISTS (id, employer_id, company_id, job_title,
--     status, stages jsonb, metadata, created_at, updated_at). NO business_id yet.
--   - public.businesses / public.business_members EXIST (V3-57, applied 2026-06-19).
--   The richer ATS tables the V3-70 prompt assumed (jobs_pipeline_stages,
--   jobs_application_notes, jobs_interview_rooms, jobs_offer_letters) are UNAPPLIED
--   migration files (SD-4/SD-9 jobs-wave drift) — this pass does NOT depend on them.
--
-- The line that must not be crossed: candidate-supplied data (notes, scores,
-- comments) is never readable by a recruiter outside the hiring business, and a
-- business context never widens authority — every predicate re-derives membership
-- from `business_members` through a SECURITY DEFINER helper (RLS-recursion-safe,
-- same idiom as V3-57's is_business_member). No money mutation in this pass.
--
-- Posture: ADDITIVE + committed-NOT-applied (owner-gated apply). business_id is
-- NULLABLE so existing single-recruiter pipelines keep working untouched.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- S1 — bind hiring pipelines to a V3-57 business (nullable for back-compat)
-- -----------------------------------------------------------------------------
alter table public.jobs_hiring_pipelines
  add column if not exists business_id uuid
    references public.businesses(id) on delete set null;

create index if not exists jobs_hiring_pipelines_business_idx
  on public.jobs_hiring_pipelines (business_id)
  where business_id is not null;

-- -----------------------------------------------------------------------------
-- is_hiring_team_member(): is auth.uid() a member of the business that owns this
-- pipeline? SECURITY DEFINER so it bypasses RLS internally (cannot recurse, cannot
-- widen authority). search_path pinned so `business_members` can't be shadowed.
-- Returns false for unbound (business_id IS NULL) pipelines — the enterprise
-- collaboration layer only applies to business-bound pipelines; legacy
-- single-recruiter pipelines keep using the existing role-based console gate.
-- -----------------------------------------------------------------------------
create or replace function public.is_hiring_team_member(p_pipeline_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.jobs_hiring_pipelines p
    join public.business_members m on m.business_id = p.business_id
    where p.id = p_pipeline_id
      and p.business_id is not null
      and m.user_id = auth.uid()
  )
$$;

revoke all on function public.is_hiring_team_member(uuid) from public;
grant execute on function public.is_hiring_team_member(uuid) to authenticated, service_role;

-- Overload keyed by application_id — the collaboration tables reference an
-- application, not a pipeline directly. Resolves the application's pipeline then
-- delegates to the pipeline predicate.
create or replace function public.is_hiring_team_member_for_application(p_application_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.jobs_applications a
    join public.jobs_hiring_pipelines p on p.id = a.pipeline_id
    join public.business_members m on m.business_id = p.business_id
    where a.id = p_application_id
      and p.business_id is not null
      and m.user_id = auth.uid()
  )
$$;

revoke all on function public.is_hiring_team_member_for_application(uuid) from public;
grant execute on function public.is_hiring_team_member_for_application(uuid) to authenticated, service_role;

comment on function public.is_hiring_team_member(uuid) is
  'V3-70: true when auth.uid() is a business_members row of the business owning the given hiring pipeline. SECURITY DEFINER, RLS-recursion-safe.';
comment on function public.is_hiring_team_member_for_application(uuid) is
  'V3-70: is_hiring_team_member resolved through an application_id (application -> pipeline -> business_members).';
