-- V3-56 — Learn-to-Earn bridge (Jobs side).
--
-- WHY:
--   Henry Onyx Learn and Henry Onyx Jobs are separate today. A learner can
--   complete a course and earn a governed certificate, but that completion is
--   invisible to Jobs. This migration extends the existing verified-candidate
--   ledger so a *real* Learn completion becomes a governed Jobs skill
--   verification (a trust signal — ANTI-CLONE Principle 10), lets employers
--   gate a post to course completers, and records employer→candidate invites
--   issued from the verified-completer pool.
--
-- TABLES / CHANGES:
--   public.jobs_skill_verifications  (+ source / source_ref / course_id columns,
--                                      provenance for a Learn-sourced badge)
--   public.jobs_course_gates         (employer gates a posting to a course)
--   public.jobs_candidate_invites    (employer invite to a verified completer)
--
-- GROUND TRUTH:
--   Job postings are NOT a dedicated table — they are public.customer_activity
--   rows (division='jobs', activity_type='jobs_post'); the slug lives in
--   metadata.slug and the employer in metadata.employerSlug. Gates + invites
--   therefore key on job_slug (text) + employer_slug (text), matching how
--   public.jobs_employer_subscriptions already keys off employer_slug.
--
-- RLS:
--   - jobs_course_gates: PUBLIC read (so the "take this course to qualify" CTA
--     renders for everyone); creator-only write; service role full.
--   - jobs_candidate_invites: candidate + creator read own; creator insert;
--     service role full.
--   - New jobs_skill_verifications columns inherit the table's existing
--     policies (owner read+insert; service role full).
--
-- DOWN:
--   drop table if exists public.jobs_candidate_invites;
--   drop table if exists public.jobs_course_gates;
--   alter table public.jobs_skill_verifications
--     drop column if exists course_id,
--     drop column if exists source_ref,
--     drop column if exists source;
--
-- IDEMPOTENT: yes. Committed-NOT-applied (owner applies to prod out-of-band).

-- ── S1 — Learn provenance on the verified-candidate ledger ──────────────────

alter table public.jobs_skill_verifications
  add column if not exists source     text,   -- 'learn_completion' | 'manual' | 'reference'
  add column if not exists source_ref uuid,   -- learn_certificates.id when source='learn_completion'
  add column if not exists course_id  uuid;   -- learn_courses.id, for the employer gate + filter

-- A Learn completion issues exactly ONE verified row per certificate; the
-- partial unique index makes the bridge idempotent on re-sync.
create unique index if not exists jobs_skill_verifications_learn_source_idx
  on public.jobs_skill_verifications (source, source_ref)
  where source = 'learn_completion';

create index if not exists jobs_skill_verifications_course_idx
  on public.jobs_skill_verifications (course_id)
  where course_id is not null;

comment on column public.jobs_skill_verifications.source is
  'Provenance of the verification. ''learn_completion'' rows are written by the '
  'Learn→Jobs bridge on a real learn_certificates issuance (system actor), never '
  'a candidate self-claim (ANTI-CLONE Principle 10).';

-- ENFORCE the system-actor-only invariant at the DB boundary (badge integrity).
-- The pre-existing owner-insert policy allowed any authenticated candidate to
-- self-insert ANY status/source for their own row via PostgREST — which would let
-- them forge a 'learn_completion'/'verified' badge and bypass a hard course gate.
-- The app's own self-attest path writes via service-role with status='pending';
-- the only legitimate candidate self-insert is a PENDING, non-Learn attestation.
-- Verified + Learn-sourced rows are written exclusively by the service role
-- (the bridge / staff verifier), which bypasses RLS. Tighten the owner-insert
-- check so a candidate can NEVER self-assert a verified or Learn-sourced row.
drop policy if exists "jobs skill verif: owner insert" on public.jobs_skill_verifications;
create policy "jobs skill verif: owner insert"
  on public.jobs_skill_verifications
  for insert
  with check (
    candidate_user_id = (select auth.uid())
    and status = 'pending'
    and source is distinct from 'learn_completion'
  );

-- ── S3 — Employer course gates ──────────────────────────────────────────────

create table if not exists public.jobs_course_gates (
  id uuid primary key default gen_random_uuid(),
  job_slug text not null,                       -- customer_activity metadata.slug of the jobs_post
  employer_slug text not null,                  -- customer_activity metadata.employerSlug
  created_by_user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null,                      -- learn_courses.id
  course_slug text,                             -- for the "take this course" deep link
  course_label text,                            -- denormalized course title for display
  required boolean not null default true,       -- true = hard gate; false = preferred
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (job_slug, course_id)
);

create index if not exists jobs_course_gates_job_idx on public.jobs_course_gates (job_slug);
create index if not exists jobs_course_gates_course_idx on public.jobs_course_gates (course_id);
create index if not exists jobs_course_gates_employer_idx on public.jobs_course_gates (employer_slug);

alter table public.jobs_course_gates enable row level security;

drop policy if exists "jobs course gates: public read" on public.jobs_course_gates;
create policy "jobs course gates: public read"
  on public.jobs_course_gates
  for select
  using (true);

drop policy if exists "jobs course gates: creator insert" on public.jobs_course_gates;
create policy "jobs course gates: creator insert"
  on public.jobs_course_gates
  for insert
  with check (created_by_user_id = (select auth.uid()));

drop policy if exists "jobs course gates: creator update" on public.jobs_course_gates;
create policy "jobs course gates: creator update"
  on public.jobs_course_gates
  for update
  using (created_by_user_id = (select auth.uid()))
  with check (created_by_user_id = (select auth.uid()));

drop policy if exists "jobs course gates: creator delete" on public.jobs_course_gates;
create policy "jobs course gates: creator delete"
  on public.jobs_course_gates
  for delete
  using (created_by_user_id = (select auth.uid()));

drop policy if exists "jobs course gates: service role" on public.jobs_course_gates;
create policy "jobs course gates: service role"
  on public.jobs_course_gates
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- ── S5 — Employer→candidate invites (from the verified-completer pool) ───────

create table if not exists public.jobs_candidate_invites (
  id uuid primary key default gen_random_uuid(),
  job_slug text not null,
  employer_slug text,
  created_by_user_id uuid not null references auth.users(id) on delete cascade,
  candidate_user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid,                               -- the course that surfaced the candidate
  source text not null default 'learn_verified'
    check (source in ('learn_verified', 'manual')),
  status text not null default 'invited'
    check (status in ('invited', 'withdrawn')),
  message text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (job_slug, candidate_user_id)          -- idempotent: one invite per (job, candidate)
);

create index if not exists jobs_candidate_invites_candidate_idx
  on public.jobs_candidate_invites (candidate_user_id);
create index if not exists jobs_candidate_invites_creator_idx
  on public.jobs_candidate_invites (created_by_user_id);
create index if not exists jobs_candidate_invites_job_idx
  on public.jobs_candidate_invites (job_slug);

alter table public.jobs_candidate_invites enable row level security;

drop policy if exists "jobs invites: candidate read" on public.jobs_candidate_invites;
create policy "jobs invites: candidate read"
  on public.jobs_candidate_invites
  for select
  using (candidate_user_id = (select auth.uid()));

drop policy if exists "jobs invites: creator read" on public.jobs_candidate_invites;
create policy "jobs invites: creator read"
  on public.jobs_candidate_invites
  for select
  using (created_by_user_id = (select auth.uid()));

drop policy if exists "jobs invites: creator insert" on public.jobs_candidate_invites;
create policy "jobs invites: creator insert"
  on public.jobs_candidate_invites
  for insert
  with check (created_by_user_id = (select auth.uid()));

drop policy if exists "jobs invites: service role" on public.jobs_candidate_invites;
create policy "jobs invites: service role"
  on public.jobs_candidate_invites
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

comment on table public.jobs_course_gates is
  'V3-56 Learn-to-Earn. An employer gates a job posting (by slug) to candidates '
  'who completed a specific Learn course. required=true blocks the application; '
  'required=false marks the candidate preferred. Public read so the CTA renders.';
comment on table public.jobs_candidate_invites is
  'V3-56 Learn-to-Earn. Employer invites issued to verified course-completers '
  'from the opt-in pool. Idempotent per (job_slug, candidate_user_id); a '
  'withdrawn opt-in is never re-invited (enforced in the bulk-invite handler).';

-- end of migration --
