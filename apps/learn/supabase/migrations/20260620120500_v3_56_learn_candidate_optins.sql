-- V3-56 — Learn-to-Earn bridge (Learn side): the consent ledger.
--
-- WHY:
--   A verified course-completer may opt in to be listed for employers who gate
--   or hire on that course. This is consent-first (NDPR/GDPR): the opt-in row IS
--   the consent record. No completer is ever exposed to an employer without an
--   active opt-in; opt-out is immediate and total (sets revoked_at).
--
-- TABLE:
--   public.learn_candidate_optins  (one row per (user, course); the consent ledger)
--
-- RLS:
--   - Learner: read / insert / update only their own (learn_matches_identity).
--   - Staff: full (learn_is_staff).
--   - Employers do NOT read this table directly: the Jobs app reads the
--     employer-visible slice (visibility='employers' AND revoked_at IS NULL, for
--     courses the employer gates/hires on) via its service-role admin client,
--     scoped in the query — the same admin-read pattern jobs uses for
--     jobs_skill_verifications. See docs/v3/learn-to-earn-architecture.md.
--
-- DOWN:
--   drop table if exists public.learn_candidate_optins;
--
-- IDEMPOTENT: yes. Committed-NOT-applied (owner applies to prod out-of-band).

create extension if not exists pgcrypto;

create table if not exists public.learn_candidate_optins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  normalized_email text,
  course_id uuid not null references public.learn_courses(id) on delete cascade,
  course_slug text,
  visibility text not null default 'employers'
    check (visibility in ('employers', 'private')),
  opted_in_at timestamptz not null default timezone('utc', now()),
  revoked_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, course_id)
);

create index if not exists learn_candidate_optins_user_idx
  on public.learn_candidate_optins (user_id);
create index if not exists learn_candidate_optins_course_idx
  on public.learn_candidate_optins (course_id);
-- The employer-visible slice: active, employer-visible opt-ins per course.
create index if not exists learn_candidate_optins_active_idx
  on public.learn_candidate_optins (course_id)
  where revoked_at is null and visibility = 'employers';

drop trigger if exists learn_candidate_optins_updated_at on public.learn_candidate_optins;
create trigger learn_candidate_optins_updated_at
  before update on public.learn_candidate_optins
  for each row execute function public.learn_set_updated_at();

alter table public.learn_candidate_optins enable row level security;

drop policy if exists "learn optin owner read" on public.learn_candidate_optins;
create policy "learn optin owner read" on public.learn_candidate_optins
  for select using (public.learn_matches_identity(user_id, normalized_email));

drop policy if exists "learn optin owner insert" on public.learn_candidate_optins;
create policy "learn optin owner insert" on public.learn_candidate_optins
  for insert with check (public.learn_matches_identity(user_id, normalized_email));

drop policy if exists "learn optin owner update" on public.learn_candidate_optins;
create policy "learn optin owner update" on public.learn_candidate_optins
  for update using (public.learn_matches_identity(user_id, normalized_email))
  with check (public.learn_matches_identity(user_id, normalized_email));

drop policy if exists "learn optin staff all" on public.learn_candidate_optins;
create policy "learn optin staff all" on public.learn_candidate_optins
  for all using (public.learn_is_staff()) with check (public.learn_is_staff());

comment on table public.learn_candidate_optins is
  'V3-56 Learn-to-Earn consent ledger. One row per (user, course). An active row '
  '(revoked_at IS NULL, visibility=''employers'') is the candidate''s explicit '
  'consent to be listed for employers gating/hiring on that course. Opt-out sets '
  'revoked_at and removes the candidate from every employer pool immediately.';

-- end of migration --
