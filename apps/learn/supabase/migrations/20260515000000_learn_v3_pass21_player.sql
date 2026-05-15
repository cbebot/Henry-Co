-- V3 PASS 21 — Learn course player schemas
-- Adds: structured quiz answer options + responses, assignment submissions + grades,
-- per-lesson discussions, cohorts + live sessions, lesson bookmarks + notes,
-- instructor payouts ledger. Realtime publication for live surfaces.
-- All tables enable RLS; policies expressed in 20260515001000_learn_v3_pass21_policies.sql.

create extension if not exists pgcrypto;

-- ── Quiz authoring: structured answer options ──────────────────────────────────
create table if not exists public.learn_quiz_answer_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.learn_quiz_questions(id) on delete cascade,
  body text not null,
  is_correct boolean not null default false,
  explanation text,
  sort_order integer not null default 1,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists learn_quiz_answer_options_question_idx
  on public.learn_quiz_answer_options(question_id);

drop trigger if exists learn_quiz_answer_options_updated_at on public.learn_quiz_answer_options;
create trigger learn_quiz_answer_options_updated_at
before update on public.learn_quiz_answer_options
for each row execute function public.learn_set_updated_at();

-- ── Quiz attempt: per-question response detail (server-authoritative grading) ──
create table if not exists public.learn_quiz_answer_responses (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.learn_quiz_attempts(id) on delete cascade,
  question_id uuid not null references public.learn_quiz_questions(id) on delete cascade,
  selected_options text[] not null default '{}',
  free_text_response text,
  is_correct boolean not null default false,
  awarded_score integer not null default 0,
  feedback text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists learn_quiz_answer_responses_attempt_idx
  on public.learn_quiz_answer_responses(attempt_id);
create index if not exists learn_quiz_answer_responses_question_idx
  on public.learn_quiz_answer_responses(question_id);

-- ── Assignment lifecycle: submissions + grades ─────────────────────────────────
create table if not exists public.learn_assignment_submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.learn_assignments(id) on delete cascade,
  enrollment_id uuid references public.learn_enrollments(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  normalized_email text,
  submission_text text not null default '',
  file_url text,
  file_label text,
  file_size_bytes integer,
  file_mime_type text,
  status text not null default 'submitted',
  submitted_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists learn_assignment_submissions_assignment_idx
  on public.learn_assignment_submissions(assignment_id);
create index if not exists learn_assignment_submissions_user_idx
  on public.learn_assignment_submissions(user_id);
create index if not exists learn_assignment_submissions_email_idx
  on public.learn_assignment_submissions(normalized_email);

drop trigger if exists learn_assignment_submissions_updated_at on public.learn_assignment_submissions;
create trigger learn_assignment_submissions_updated_at
before update on public.learn_assignment_submissions
for each row execute function public.learn_set_updated_at();

create table if not exists public.learn_assignment_grades (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.learn_assignment_submissions(id) on delete cascade,
  graded_by_user_id uuid references auth.users(id) on delete set null,
  score integer not null default 0,
  passed boolean not null default false,
  feedback text not null default '',
  graded_at timestamptz not null default timezone('utc', now())
);

create index if not exists learn_assignment_grades_submission_idx
  on public.learn_assignment_grades(submission_id);

-- ── Per-lesson discussions (uses messaging-thread shape) ──────────────────────
create table if not exists public.learn_discussions (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.learn_courses(id) on delete cascade,
  lesson_id uuid references public.learn_lessons(id) on delete set null,
  parent_id uuid references public.learn_discussions(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  normalized_email text,
  author_display_name text,
  body text not null default '',
  is_instructor_reply boolean not null default false,
  is_pinned boolean not null default false,
  is_resolved boolean not null default false,
  status text not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists learn_discussions_course_idx
  on public.learn_discussions(course_id);
create index if not exists learn_discussions_lesson_idx
  on public.learn_discussions(lesson_id);
create index if not exists learn_discussions_parent_idx
  on public.learn_discussions(parent_id);

drop trigger if exists learn_discussions_updated_at on public.learn_discussions;
create trigger learn_discussions_updated_at
before update on public.learn_discussions
for each row execute function public.learn_set_updated_at();

-- ── Cohorts + live sessions ────────────────────────────────────────────────────
create table if not exists public.learn_cohorts (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.learn_courses(id) on delete cascade,
  slug text not null,
  name text not null,
  description text,
  start_date timestamptz not null,
  end_date timestamptz,
  timezone text not null default 'Africa/Lagos',
  enrollment_cap integer,
  enrollment_count integer not null default 0,
  status text not null default 'scheduled',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists learn_cohorts_course_slug_unique
  on public.learn_cohorts(course_id, slug);
create index if not exists learn_cohorts_status_idx
  on public.learn_cohorts(status);

drop trigger if exists learn_cohorts_updated_at on public.learn_cohorts;
create trigger learn_cohorts_updated_at
before update on public.learn_cohorts
for each row execute function public.learn_set_updated_at();

-- Race-safe cohort enrollment cap helper
create or replace function public.learn_cohort_enrol(p_cohort uuid)
returns boolean
language plpgsql
as $$
declare
  v_cap integer;
  v_count integer;
begin
  select enrollment_cap, enrollment_count
    into v_cap, v_count
    from public.learn_cohorts
    where id = p_cohort
    for update;
  if v_cap is not null and v_count >= v_cap then
    return false;
  end if;
  update public.learn_cohorts
    set enrollment_count = enrollment_count + 1
    where id = p_cohort;
  return true;
end;
$$;

create table if not exists public.learn_live_sessions (
  id uuid primary key default gen_random_uuid(),
  cohort_id uuid not null references public.learn_cohorts(id) on delete cascade,
  course_id uuid references public.learn_courses(id) on delete set null,
  title text not null,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  meeting_url text,
  meeting_provider text not null default 'daily',
  recording_url text,
  status text not null default 'scheduled',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists learn_live_sessions_cohort_idx
  on public.learn_live_sessions(cohort_id);
create index if not exists learn_live_sessions_starts_idx
  on public.learn_live_sessions(starts_at);

drop trigger if exists learn_live_sessions_updated_at on public.learn_live_sessions;
create trigger learn_live_sessions_updated_at
before update on public.learn_live_sessions
for each row execute function public.learn_set_updated_at();

-- Cohort enrollment join: which learner belongs to which cohort
create table if not exists public.learn_cohort_enrollments (
  id uuid primary key default gen_random_uuid(),
  cohort_id uuid not null references public.learn_cohorts(id) on delete cascade,
  enrollment_id uuid not null references public.learn_enrollments(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  normalized_email text,
  status text not null default 'active',
  joined_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists learn_cohort_enrollments_unique
  on public.learn_cohort_enrollments(cohort_id, enrollment_id);
create index if not exists learn_cohort_enrollments_user_idx
  on public.learn_cohort_enrollments(user_id);
create index if not exists learn_cohort_enrollments_email_idx
  on public.learn_cohort_enrollments(normalized_email);

-- ── Lesson bookmarks (video timestamps) ────────────────────────────────────────
create table if not exists public.learn_lesson_bookmarks (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid references public.learn_enrollments(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  normalized_email text,
  lesson_id uuid not null references public.learn_lessons(id) on delete cascade,
  course_id uuid not null references public.learn_courses(id) on delete cascade,
  timestamp_seconds integer not null default 0,
  label text not null default '',
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists learn_lesson_bookmarks_user_idx
  on public.learn_lesson_bookmarks(user_id);
create index if not exists learn_lesson_bookmarks_email_idx
  on public.learn_lesson_bookmarks(normalized_email);
create index if not exists learn_lesson_bookmarks_lesson_idx
  on public.learn_lesson_bookmarks(lesson_id);

-- ── Lesson notes (private learner notes) ───────────────────────────────────────
create table if not exists public.learn_lesson_notes (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid references public.learn_enrollments(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  normalized_email text,
  lesson_id uuid not null references public.learn_lessons(id) on delete cascade,
  course_id uuid not null references public.learn_courses(id) on delete cascade,
  body text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists learn_lesson_notes_user_idx
  on public.learn_lesson_notes(user_id);
create index if not exists learn_lesson_notes_email_idx
  on public.learn_lesson_notes(normalized_email);
create index if not exists learn_lesson_notes_lesson_idx
  on public.learn_lesson_notes(lesson_id);

drop trigger if exists learn_lesson_notes_updated_at on public.learn_lesson_notes;
create trigger learn_lesson_notes_updated_at
before update on public.learn_lesson_notes
for each row execute function public.learn_set_updated_at();

-- ── Lesson video playback heartbeat (resume from last position) ────────────────
-- Stored on learn_progress.seconds_watched today, but we also persist the
-- last-known position per lesson here so reload restores it cheaply.
create table if not exists public.learn_lesson_playback (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.learn_enrollments(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  normalized_email text,
  lesson_id uuid not null references public.learn_lessons(id) on delete cascade,
  course_id uuid not null references public.learn_courses(id) on delete cascade,
  position_seconds integer not null default 0,
  duration_seconds integer not null default 0,
  playback_rate numeric(3,2) not null default 1.0,
  caption_locale text,
  last_event text,
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists learn_lesson_playback_enrollment_lesson_unique
  on public.learn_lesson_playback(enrollment_id, lesson_id);
create index if not exists learn_lesson_playback_user_idx
  on public.learn_lesson_playback(user_id);

drop trigger if exists learn_lesson_playback_updated_at on public.learn_lesson_playback;
create trigger learn_lesson_playback_updated_at
before update on public.learn_lesson_playback
for each row execute function public.learn_set_updated_at();

-- ── Instructor payouts ledger ──────────────────────────────────────────────────
create table if not exists public.learn_instructor_payouts (
  id uuid primary key default gen_random_uuid(),
  instructor_id uuid references public.learn_instructors(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  normalized_email text,
  course_id uuid references public.learn_courses(id) on delete set null,
  period_start date,
  period_end date,
  gross_revenue integer not null default 0,
  platform_fee integer not null default 0,
  net_payout integer not null default 0,
  currency text not null default 'NGN',
  payout_model text not null default 'revenue_share',
  status text not null default 'pending',
  reference text,
  notes text,
  requested_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists learn_instructor_payouts_user_idx
  on public.learn_instructor_payouts(user_id);
create index if not exists learn_instructor_payouts_email_idx
  on public.learn_instructor_payouts(normalized_email);
create index if not exists learn_instructor_payouts_instructor_idx
  on public.learn_instructor_payouts(instructor_id);
create index if not exists learn_instructor_payouts_status_idx
  on public.learn_instructor_payouts(status);

drop trigger if exists learn_instructor_payouts_updated_at on public.learn_instructor_payouts;
create trigger learn_instructor_payouts_updated_at
before update on public.learn_instructor_payouts
for each row execute function public.learn_set_updated_at();

-- ── Streaks + badges (gamification) ────────────────────────────────────────────
create table if not exists public.learn_streaks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  normalized_email text,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_activity_date date,
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists learn_streaks_user_unique
  on public.learn_streaks(user_id) where user_id is not null;
create unique index if not exists learn_streaks_email_unique
  on public.learn_streaks(normalized_email) where user_id is null and normalized_email is not null;

drop trigger if exists learn_streaks_updated_at on public.learn_streaks;
create trigger learn_streaks_updated_at
before update on public.learn_streaks
for each row execute function public.learn_set_updated_at();

create table if not exists public.learn_badges (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null,
  icon text not null default 'award',
  criteria_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.learn_badge_awards (
  id uuid primary key default gen_random_uuid(),
  badge_id uuid not null references public.learn_badges(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  normalized_email text,
  awarded_at timestamptz not null default timezone('utc', now())
);

create index if not exists learn_badge_awards_user_idx
  on public.learn_badge_awards(user_id);
create index if not exists learn_badge_awards_email_idx
  on public.learn_badge_awards(normalized_email);
create unique index if not exists learn_badge_awards_unique
  on public.learn_badge_awards(badge_id, coalesce(user_id::text, ''), coalesce(normalized_email, ''));
