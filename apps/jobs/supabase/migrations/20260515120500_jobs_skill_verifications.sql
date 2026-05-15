-- V3 PASS 21 — Jobs verified-candidate profile (Distinctive Rule #1).
--
-- WHY:
--   PRODUCT-GAP-LEDGER names "verified candidate profile" as a marketing
--   promise but only KYC was previously persisted. This migration adds
--   three governed verification ledgers — skill / experience / reference —
--   each with status, evidence, verifier, and decision audit fields. The
--   matching UI lives in apps/jobs/app/candidate/profile and surfaces
--   <VerificationBadge> per record.
--
-- TABLES:
--   public.jobs_skill_verifications      (candidate, skill, evidence)
--   public.jobs_experience_verifications (candidate, employer, period)
--   public.jobs_reference_checks         (candidate, reference contact)
--
-- RLS:
--   - Candidate (auth.uid()): read + insert own.
--   - Service role: full.
--   - Recruiters / verifiers / staff: read all + update status via
--     SECURITY DEFINER `jobs_verifier_decide()` function (added later).
--
-- DOWN:
--   drop table if exists public.jobs_reference_checks;
--   drop table if exists public.jobs_experience_verifications;
--   drop table if exists public.jobs_skill_verifications;
--
-- IDEMPOTENT: yes.

create table if not exists public.jobs_skill_verifications (
  id uuid primary key default gen_random_uuid(),
  candidate_user_id uuid not null references auth.users(id) on delete cascade,
  skill_id uuid references public.jobs_skills(id) on delete set null,
  skill_label text not null,
  evidence_type text not null
    check (evidence_type in (
      'self_attest', 'portfolio_url', 'certificate', 'employer_attest', 'assessment_score'
    )),
  evidence_url text,
  evidence_payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending'
    check (status in ('pending', 'verified', 'rejected', 'expired')),
  verified_by_user_id uuid references auth.users(id) on delete set null,
  verified_at timestamptz,
  decision_reason text,
  expires_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists jobs_skill_verifications_candidate_idx
  on public.jobs_skill_verifications (candidate_user_id, status);
create index if not exists jobs_skill_verifications_skill_idx
  on public.jobs_skill_verifications (skill_id)
  where skill_id is not null;
create index if not exists jobs_skill_verifications_status_idx
  on public.jobs_skill_verifications (status);

alter table public.jobs_skill_verifications enable row level security;

drop policy if exists "jobs skill verif: owner read" on public.jobs_skill_verifications;
create policy "jobs skill verif: owner read"
  on public.jobs_skill_verifications
  for select
  using (candidate_user_id = auth.uid());

drop policy if exists "jobs skill verif: owner insert" on public.jobs_skill_verifications;
create policy "jobs skill verif: owner insert"
  on public.jobs_skill_verifications
  for insert
  with check (candidate_user_id = auth.uid());

drop policy if exists "jobs skill verif: service role" on public.jobs_skill_verifications;
create policy "jobs skill verif: service role"
  on public.jobs_skill_verifications
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create table if not exists public.jobs_experience_verifications (
  id uuid primary key default gen_random_uuid(),
  candidate_user_id uuid not null references auth.users(id) on delete cascade,
  employer_name text not null,
  role_title text not null,
  start_date date,
  end_date date,
  is_current boolean not null default false,
  description text,
  evidence_url text,
  evidence_payload jsonb not null default '{}'::jsonb,
  contact_email text,
  contact_name text,
  status text not null default 'pending'
    check (status in ('pending', 'verified', 'rejected', 'expired', 'awaiting_contact')),
  verified_by_user_id uuid references auth.users(id) on delete set null,
  verified_at timestamptz,
  decision_reason text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists jobs_experience_verifications_candidate_idx
  on public.jobs_experience_verifications (candidate_user_id, status);
create index if not exists jobs_experience_verifications_status_idx
  on public.jobs_experience_verifications (status);

alter table public.jobs_experience_verifications enable row level security;

drop policy if exists "jobs experience verif: owner read" on public.jobs_experience_verifications;
create policy "jobs experience verif: owner read"
  on public.jobs_experience_verifications
  for select
  using (candidate_user_id = auth.uid());

drop policy if exists "jobs experience verif: owner insert" on public.jobs_experience_verifications;
create policy "jobs experience verif: owner insert"
  on public.jobs_experience_verifications
  for insert
  with check (candidate_user_id = auth.uid());

drop policy if exists "jobs experience verif: owner update" on public.jobs_experience_verifications;
create policy "jobs experience verif: owner update"
  on public.jobs_experience_verifications
  for update
  using (candidate_user_id = auth.uid() and status in ('pending', 'awaiting_contact'))
  with check (candidate_user_id = auth.uid());

drop policy if exists "jobs experience verif: service role" on public.jobs_experience_verifications;
create policy "jobs experience verif: service role"
  on public.jobs_experience_verifications
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create table if not exists public.jobs_reference_checks (
  id uuid primary key default gen_random_uuid(),
  candidate_user_id uuid not null references auth.users(id) on delete cascade,
  reference_name text not null,
  reference_email text,
  reference_phone text,
  relationship text not null,
  company_name text,
  outreach_token text unique,
  outreach_status text not null default 'pending'
    check (outreach_status in ('pending', 'contacted', 'responded', 'failed', 'declined')),
  response_payload jsonb not null default '{}'::jsonb,
  overall_outcome text
    check (overall_outcome is null or overall_outcome in (
      'positive', 'neutral', 'negative', 'mixed'
    )),
  status text not null default 'pending'
    check (status in ('pending', 'verified', 'rejected', 'expired')),
  verified_by_user_id uuid references auth.users(id) on delete set null,
  verified_at timestamptz,
  decision_reason text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists jobs_reference_checks_candidate_idx
  on public.jobs_reference_checks (candidate_user_id, status);
create index if not exists jobs_reference_checks_outreach_status_idx
  on public.jobs_reference_checks (outreach_status);

alter table public.jobs_reference_checks enable row level security;

drop policy if exists "jobs reference checks: owner read" on public.jobs_reference_checks;
create policy "jobs reference checks: owner read"
  on public.jobs_reference_checks
  for select
  using (candidate_user_id = auth.uid());

drop policy if exists "jobs reference checks: owner insert" on public.jobs_reference_checks;
create policy "jobs reference checks: owner insert"
  on public.jobs_reference_checks
  for insert
  with check (candidate_user_id = auth.uid());

drop policy if exists "jobs reference checks: service role" on public.jobs_reference_checks;
create policy "jobs reference checks: service role"
  on public.jobs_reference_checks
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

comment on table public.jobs_skill_verifications is
  'V3 PASS 21 — verified-candidate profile (Distinctive Rule #1). One row '
  'per asserted skill. Status transitions: pending → verified/rejected. '
  'Owner read+insert; staff decisions land via service-role / DEFINER.';
comment on table public.jobs_experience_verifications is
  'V3 PASS 21 — verified-candidate profile. Owner can edit while status '
  'is pending or awaiting_contact; staff decisions land via service role.';
comment on table public.jobs_reference_checks is
  'V3 PASS 21 — verified-candidate profile. outreach_token signs the '
  'reference response form URL. Service role writes outreach_status when '
  'the reference completes the form.';

-- end of migration --
