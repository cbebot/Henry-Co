-- V3 PASS 21 — RLS for new learn course-player schemas.
-- Pattern matches 20260402233500_learn_policies.sql:
--   • staff (learn_is_staff()) bypasses all read/write
--   • learner can SELECT/INSERT/UPDATE their own (matched by user_id or normalized_email)
--   • discussion threads readable by enrolled learners; staff can moderate
-- All policies wrap auth.<fn>() to satisfy auth_rls_initplan (Pass 21 #95).

alter table public.learn_quiz_answer_options enable row level security;
alter table public.learn_quiz_answer_responses enable row level security;
alter table public.learn_assignment_submissions enable row level security;
alter table public.learn_assignment_grades enable row level security;
alter table public.learn_discussions enable row level security;
alter table public.learn_cohorts enable row level security;
alter table public.learn_live_sessions enable row level security;
alter table public.learn_cohort_enrollments enable row level security;
alter table public.learn_lesson_bookmarks enable row level security;
alter table public.learn_lesson_notes enable row level security;
alter table public.learn_lesson_playback enable row level security;
alter table public.learn_instructor_payouts enable row level security;
alter table public.learn_streaks enable row level security;
alter table public.learn_badges enable row level security;
alter table public.learn_badge_awards enable row level security;

-- Public read for catalog-adjacent tables ------------------------------------
drop policy if exists "learn public quiz options" on public.learn_quiz_answer_options;
create policy "learn public quiz options" on public.learn_quiz_answer_options
for select using (true);

drop policy if exists "learn public cohorts" on public.learn_cohorts;
create policy "learn public cohorts" on public.learn_cohorts
for select using (status in ('scheduled', 'open', 'in_progress') or public.learn_is_staff());

drop policy if exists "learn public live sessions" on public.learn_live_sessions;
create policy "learn public live sessions" on public.learn_live_sessions
for select using (
  exists (
    select 1 from public.learn_cohort_enrollments cohort_enrollment
    join public.learn_enrollments enrol on enrol.id = cohort_enrollment.enrollment_id
    where cohort_enrollment.cohort_id = learn_live_sessions.cohort_id
      and ((select auth.uid()) = enrol.user_id
        or enrol.normalized_email = public.learn_auth_email())
  )
  or public.learn_is_staff()
);

drop policy if exists "learn public badges" on public.learn_badges;
create policy "learn public badges" on public.learn_badges
for select using (true);

-- Quiz answer responses -----------------------------------------------------
drop policy if exists "learn own quiz responses" on public.learn_quiz_answer_responses;
create policy "learn own quiz responses" on public.learn_quiz_answer_responses
for select using (
  exists (
    select 1 from public.learn_quiz_attempts att
    where att.id = learn_quiz_answer_responses.attempt_id
      and public.learn_matches_identity(att.user_id, att.normalized_email)
  )
);

drop policy if exists "learn write quiz responses" on public.learn_quiz_answer_responses;
create policy "learn write quiz responses" on public.learn_quiz_answer_responses
for insert with check (
  exists (
    select 1 from public.learn_quiz_attempts att
    where att.id = learn_quiz_answer_responses.attempt_id
      and public.learn_matches_identity(att.user_id, att.normalized_email)
  )
);

-- Assignment submissions ----------------------------------------------------
drop policy if exists "learn own assignment submissions" on public.learn_assignment_submissions;
create policy "learn own assignment submissions" on public.learn_assignment_submissions
for select using (public.learn_matches_identity(user_id, normalized_email));

drop policy if exists "learn insert assignment submissions" on public.learn_assignment_submissions;
create policy "learn insert assignment submissions" on public.learn_assignment_submissions
for insert with check (public.learn_matches_identity(user_id, normalized_email));

drop policy if exists "learn update assignment submissions" on public.learn_assignment_submissions;
create policy "learn update assignment submissions" on public.learn_assignment_submissions
for update using (public.learn_matches_identity(user_id, normalized_email));

-- Assignment grades (instructor / staff write; learner reads own) -----------
drop policy if exists "learn read assignment grades" on public.learn_assignment_grades;
create policy "learn read assignment grades" on public.learn_assignment_grades
for select using (
  exists (
    select 1 from public.learn_assignment_submissions sub
    where sub.id = learn_assignment_grades.submission_id
      and (public.learn_matches_identity(sub.user_id, sub.normalized_email)
        or public.learn_is_staff())
  )
);

drop policy if exists "learn write assignment grades" on public.learn_assignment_grades;
create policy "learn write assignment grades" on public.learn_assignment_grades
for insert with check (public.learn_is_staff());

drop policy if exists "learn update assignment grades" on public.learn_assignment_grades;
create policy "learn update assignment grades" on public.learn_assignment_grades
for update using (public.learn_is_staff());

-- Discussions (enrolled learners + staff) -----------------------------------
drop policy if exists "learn read discussions" on public.learn_discussions;
create policy "learn read discussions" on public.learn_discussions
for select using (
  status = 'active' and (
    public.learn_is_staff()
    or exists (
      select 1 from public.learn_enrollments enrol
      where enrol.course_id = learn_discussions.course_id
        and ((select auth.uid()) = enrol.user_id
          or enrol.normalized_email = public.learn_auth_email())
    )
  )
);

drop policy if exists "learn write discussions" on public.learn_discussions;
create policy "learn write discussions" on public.learn_discussions
for insert with check (
  public.learn_is_staff()
  or exists (
    select 1 from public.learn_enrollments enrol
    where enrol.course_id = learn_discussions.course_id
      and ((select auth.uid()) = enrol.user_id
        or enrol.normalized_email = public.learn_auth_email())
  )
);

drop policy if exists "learn update own discussion" on public.learn_discussions;
create policy "learn update own discussion" on public.learn_discussions
for update using (public.learn_matches_identity(user_id, normalized_email));

-- Cohort enrollments --------------------------------------------------------
drop policy if exists "learn own cohort enrollment" on public.learn_cohort_enrollments;
create policy "learn own cohort enrollment" on public.learn_cohort_enrollments
for select using (public.learn_matches_identity(user_id, normalized_email));

drop policy if exists "learn write cohort enrollment" on public.learn_cohort_enrollments;
create policy "learn write cohort enrollment" on public.learn_cohort_enrollments
for insert with check (public.learn_matches_identity(user_id, normalized_email) or public.learn_is_staff());

-- Bookmarks + notes + playback (learner-private) ----------------------------
drop policy if exists "learn own bookmarks" on public.learn_lesson_bookmarks;
create policy "learn own bookmarks" on public.learn_lesson_bookmarks
for all using (public.learn_matches_identity(user_id, normalized_email))
with check (public.learn_matches_identity(user_id, normalized_email));

drop policy if exists "learn own notes" on public.learn_lesson_notes;
create policy "learn own notes" on public.learn_lesson_notes
for all using (public.learn_matches_identity(user_id, normalized_email))
with check (public.learn_matches_identity(user_id, normalized_email));

drop policy if exists "learn own playback" on public.learn_lesson_playback;
create policy "learn own playback" on public.learn_lesson_playback
for all using (public.learn_matches_identity(user_id, normalized_email))
with check (public.learn_matches_identity(user_id, normalized_email));

-- Instructor payouts (instructor reads own, staff writes) -------------------
drop policy if exists "learn own payouts" on public.learn_instructor_payouts;
create policy "learn own payouts" on public.learn_instructor_payouts
for select using (
  public.learn_matches_identity(user_id, normalized_email) or public.learn_is_staff()
);

drop policy if exists "learn write payouts" on public.learn_instructor_payouts;
create policy "learn write payouts" on public.learn_instructor_payouts
for insert with check (public.learn_is_staff());

drop policy if exists "learn update payouts" on public.learn_instructor_payouts;
create policy "learn update payouts" on public.learn_instructor_payouts
for update using (public.learn_is_staff());

-- Streaks + badge awards (own only) -----------------------------------------
drop policy if exists "learn own streak" on public.learn_streaks;
create policy "learn own streak" on public.learn_streaks
for all using (public.learn_matches_identity(user_id, normalized_email))
with check (public.learn_matches_identity(user_id, normalized_email));

drop policy if exists "learn own badge awards" on public.learn_badge_awards;
create policy "learn own badge awards" on public.learn_badge_awards
for select using (
  public.learn_matches_identity(user_id, normalized_email) or public.learn_is_staff()
);

drop policy if exists "learn write badge awards" on public.learn_badge_awards;
create policy "learn write badge awards" on public.learn_badge_awards
for insert with check (public.learn_is_staff());
