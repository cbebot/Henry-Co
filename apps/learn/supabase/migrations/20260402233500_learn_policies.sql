alter table public.learn_role_memberships enable row level security;
alter table public.learn_course_categories enable row level security;
alter table public.learn_instructors enable row level security;
alter table public.learn_plans enable row level security;
alter table public.learn_courses enable row level security;
alter table public.learn_learning_paths enable row level security;
alter table public.learn_path_items enable row level security;
alter table public.learn_modules enable row level security;
alter table public.learn_lessons enable row level security;
alter table public.learn_lesson_resources enable row level security;
alter table public.learn_quizzes enable row level security;
alter table public.learn_quiz_questions enable row level security;
alter table public.learn_enrollments enable row level security;
alter table public.learn_progress enable row level security;
alter table public.learn_quiz_attempts enable row level security;
alter table public.learn_certificates enable row level security;
alter table public.learn_certificate_verification enable row level security;
alter table public.learn_reviews enable row level security;
alter table public.learn_notifications enable row level security;
alter table public.learn_assignments enable row level security;
alter table public.learn_payments enable row level security;
alter table public.learn_saved_courses enable row level security;
alter table public.learn_settings enable row level security;

create or replace function public.learn_matches_identity(target_user_id uuid, target_email text)
returns boolean
language sql
stable
as $$
  select (
    (target_user_id is not null and target_user_id = auth.uid())
    or (
      target_email is not null
      and target_email = public.learn_auth_email()
    )
    or public.learn_is_staff()
  );
$$;

drop policy if exists "learn public catalog" on public.learn_course_categories;
create policy "learn public catalog" on public.learn_course_categories
for select using (true);

drop policy if exists "learn public instructors" on public.learn_instructors;
create policy "learn public instructors" on public.learn_instructors
for select using (true);

drop policy if exists "learn public plans" on public.learn_plans;
create policy "learn public plans" on public.learn_plans
for select using (is_public = true or public.learn_is_staff());

drop policy if exists "learn public courses" on public.learn_courses;
create policy "learn public courses" on public.learn_courses
for select using (
  (status = 'published' and visibility = 'public')
  or public.learn_is_staff()
);

drop policy if exists "learn public paths" on public.learn_learning_paths;
create policy "learn public paths" on public.learn_learning_paths
for select using (
  (status = 'published' and visibility = 'public')
  or public.learn_is_staff()
);

drop policy if exists "learn public path items" on public.learn_path_items;
create policy "learn public path items" on public.learn_path_items
for select using (true);

drop policy if exists "learn public modules" on public.learn_modules;
create policy "learn public modules" on public.learn_modules
for select using (true);

drop policy if exists "learn public lessons" on public.learn_lessons;
create policy "learn public lessons" on public.learn_lessons
for select using (true);

drop policy if exists "learn public lesson resources" on public.learn_lesson_resources;
create policy "learn public lesson resources" on public.learn_lesson_resources
for select using (true);

drop policy if exists "learn public quizzes" on public.learn_quizzes;
create policy "learn public quizzes" on public.learn_quizzes
for select using (true);

drop policy if exists "learn public quiz questions" on public.learn_quiz_questions;
create policy "learn public quiz questions" on public.learn_quiz_questions
for select using (true);

drop policy if exists "learn public reviews" on public.learn_reviews;
create policy "learn public reviews" on public.learn_reviews
for select using (status = 'published' or public.learn_is_staff());

drop policy if exists "learn own enrollments" on public.learn_enrollments;
create policy "learn own enrollments" on public.learn_enrollments
for select using (public.learn_matches_identity(user_id, normalized_email));

drop policy if exists "learn own progress" on public.learn_progress;
create policy "learn own progress" on public.learn_progress
for select using (
  exists (
    select 1
    from public.learn_enrollments enrollment
    where enrollment.id = learn_progress.enrollment_id
      and public.learn_matches_identity(enrollment.user_id, enrollment.normalized_email)
  )
);

drop policy if exists "learn own attempts" on public.learn_quiz_attempts;
create policy "learn own attempts" on public.learn_quiz_attempts
for select using (public.learn_matches_identity(user_id, normalized_email));

drop policy if exists "learn own certificates" on public.learn_certificates;
create policy "learn own certificates" on public.learn_certificates
for select using (public.learn_matches_identity(user_id, normalized_email));

drop policy if exists "learn public certificate verification" on public.learn_certificate_verification;
create policy "learn public certificate verification" on public.learn_certificate_verification
for select using (status = 'issued' or public.learn_is_staff());

drop policy if exists "learn own notifications" on public.learn_notifications;
create policy "learn own notifications" on public.learn_notifications
for select using (public.learn_matches_identity(user_id, normalized_email));

drop policy if exists "learn own assignments" on public.learn_assignments;
create policy "learn own assignments" on public.learn_assignments
for select using (public.learn_matches_identity(user_id, normalized_email));

drop policy if exists "learn own payments" on public.learn_payments;
create policy "learn own payments" on public.learn_payments
for select using (public.learn_matches_identity(user_id, normalized_email));

drop policy if exists "learn own saved" on public.learn_saved_courses;
create policy "learn own saved" on public.learn_saved_courses
for select using (public.learn_matches_identity(user_id, normalized_email));

drop policy if exists "learn settings staff read" on public.learn_settings;
create policy "learn settings staff read" on public.learn_settings
for select using (public.learn_is_staff());

drop policy if exists "learn staff all role memberships" on public.learn_role_memberships;
create policy "learn staff all role memberships" on public.learn_role_memberships
for all using (public.learn_is_staff()) with check (public.learn_is_staff());

drop policy if exists "learn staff all categories" on public.learn_course_categories;
create policy "learn staff all categories" on public.learn_course_categories
for all using (public.learn_is_staff()) with check (public.learn_is_staff());

drop policy if exists "learn staff all instructors" on public.learn_instructors;
create policy "learn staff all instructors" on public.learn_instructors
for all using (public.learn_is_staff()) with check (public.learn_is_staff());

drop policy if exists "learn staff all plans" on public.learn_plans;
create policy "learn staff all plans" on public.learn_plans
for all using (public.learn_is_staff()) with check (public.learn_is_staff());

drop policy if exists "learn staff all courses" on public.learn_courses;
create policy "learn staff all courses" on public.learn_courses
for all using (public.learn_is_staff()) with check (public.learn_is_staff());

drop policy if exists "learn staff all paths" on public.learn_learning_paths;
create policy "learn staff all paths" on public.learn_learning_paths
for all using (public.learn_is_staff()) with check (public.learn_is_staff());

drop policy if exists "learn staff all path items" on public.learn_path_items;
create policy "learn staff all path items" on public.learn_path_items
for all using (public.learn_is_staff()) with check (public.learn_is_staff());

drop policy if exists "learn staff all modules" on public.learn_modules;
create policy "learn staff all modules" on public.learn_modules
for all using (public.learn_is_staff()) with check (public.learn_is_staff());

drop policy if exists "learn staff all lessons" on public.learn_lessons;
create policy "learn staff all lessons" on public.learn_lessons
for all using (public.learn_is_staff()) with check (public.learn_is_staff());

drop policy if exists "learn staff all resources" on public.learn_lesson_resources;
create policy "learn staff all resources" on public.learn_lesson_resources
for all using (public.learn_is_staff()) with check (public.learn_is_staff());

drop policy if exists "learn staff all quizzes" on public.learn_quizzes;
create policy "learn staff all quizzes" on public.learn_quizzes
for all using (public.learn_is_staff()) with check (public.learn_is_staff());

drop policy if exists "learn staff all quiz questions" on public.learn_quiz_questions;
create policy "learn staff all quiz questions" on public.learn_quiz_questions
for all using (public.learn_is_staff()) with check (public.learn_is_staff());

drop policy if exists "learn staff all enrollments" on public.learn_enrollments;
create policy "learn staff all enrollments" on public.learn_enrollments
for all using (public.learn_is_staff()) with check (public.learn_is_staff());

drop policy if exists "learn staff all progress" on public.learn_progress;
create policy "learn staff all progress" on public.learn_progress
for all using (public.learn_is_staff()) with check (public.learn_is_staff());

drop policy if exists "learn staff all attempts" on public.learn_quiz_attempts;
create policy "learn staff all attempts" on public.learn_quiz_attempts
for all using (public.learn_is_staff()) with check (public.learn_is_staff());

drop policy if exists "learn staff all certificates" on public.learn_certificates;
create policy "learn staff all certificates" on public.learn_certificates
for all using (public.learn_is_staff()) with check (public.learn_is_staff());

drop policy if exists "learn staff all verification" on public.learn_certificate_verification;
create policy "learn staff all verification" on public.learn_certificate_verification
for all using (public.learn_is_staff()) with check (public.learn_is_staff());

drop policy if exists "learn staff all reviews" on public.learn_reviews;
create policy "learn staff all reviews" on public.learn_reviews
for all using (public.learn_is_staff()) with check (public.learn_is_staff());

drop policy if exists "learn staff all notifications" on public.learn_notifications;
create policy "learn staff all notifications" on public.learn_notifications
for all using (public.learn_is_staff()) with check (public.learn_is_staff());

drop policy if exists "learn staff all assignments" on public.learn_assignments;
create policy "learn staff all assignments" on public.learn_assignments
for all using (public.learn_is_staff()) with check (public.learn_is_staff());

drop policy if exists "learn staff all payments" on public.learn_payments;
create policy "learn staff all payments" on public.learn_payments
for all using (public.learn_is_staff()) with check (public.learn_is_staff());

drop policy if exists "learn staff all saved" on public.learn_saved_courses;
create policy "learn staff all saved" on public.learn_saved_courses
for all using (public.learn_is_staff()) with check (public.learn_is_staff());

drop policy if exists "learn staff all settings" on public.learn_settings;
create policy "learn staff all settings" on public.learn_settings
for all using (public.learn_is_staff()) with check (public.learn_is_staff());
