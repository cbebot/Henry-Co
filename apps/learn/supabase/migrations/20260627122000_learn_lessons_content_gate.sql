-- ============================================================================
-- LRN-4 (MED) — Lesson content gate.         *** HELD / committed-not-applied ***
-- Apply only after the owner verifies on prod (rzkbgwuznmdxnnhmjazy).
--
-- Problem: public.learn_lessons and public.learn_lesson_resources both carried
-- public `SELECT USING (true)` policies, so anon could read paid `video_url` and
-- `body_markdown` (and every resource URL) for ANY course — bypassing the
-- enrollment / payment gate enforced only in the application layer.
--
-- Fix:
--   1. drop the public select policies on lessons + resources;
--   2. add a gated select policy: staff OR preview OR (free + published + public
--      course) OR an enrollment for the course matching the caller's identity;
--   3. expose a content-free `learn_lessons_public` view (syllabus columns only,
--      no body_markdown / video_url) for anon + authenticated.
-- learn_modules stays public (titles only) — no content there.
--
-- The application reads the base tables via the service role (RLS-exempt) and
-- already enforces canViewerAccessCourse(), so no application change is required.
-- The view is intentionally owner-privileged (security_invoker OFF, the default):
-- the column projection IS the access control for the public catalog/syllabus.
-- Idempotent + existence-guarded.
-- ============================================================================

do $$
begin
  if to_regclass('public.learn_lessons') is not null then
    drop policy if exists "learn public lessons" on public.learn_lessons;

    drop policy if exists "learn gated lessons" on public.learn_lessons;
    create policy "learn gated lessons" on public.learn_lessons
      for select using (
        public.learn_is_staff()
        or is_preview
        or exists (
          select 1
          from public.learn_courses course
          where course.id = learn_lessons.course_id
            and course.status = 'published'
            and course.visibility = 'public'
            and course.access_model = 'free'
        )
        or exists (
          select 1
          from public.learn_enrollments enrol
          where enrol.course_id = learn_lessons.course_id
            and public.learn_matches_identity(enrol.user_id, enrol.normalized_email)
        )
      );

    create or replace view public.learn_lessons_public as
      select
        id,
        course_id,
        module_id,
        slug,
        title,
        summary,
        duration_minutes,
        lesson_type,
        is_preview,
        sort_order
      from public.learn_lessons;

    grant select on public.learn_lessons_public to anon, authenticated;
  end if;

  if to_regclass('public.learn_lesson_resources') is not null then
    drop policy if exists "learn public lesson resources" on public.learn_lesson_resources;

    drop policy if exists "learn gated lesson resources" on public.learn_lesson_resources;
    create policy "learn gated lesson resources" on public.learn_lesson_resources
      for select using (
        public.learn_is_staff()
        or exists (
          select 1
          from public.learn_lessons lesson
          where lesson.id = learn_lesson_resources.lesson_id
            and (
              lesson.is_preview
              or exists (
                select 1
                from public.learn_courses course
                where course.id = lesson.course_id
                  and course.status = 'published'
                  and course.visibility = 'public'
                  and course.access_model = 'free'
              )
              or exists (
                select 1
                from public.learn_enrollments enrol
                where enrol.course_id = lesson.course_id
                  and public.learn_matches_identity(enrol.user_id, enrol.normalized_email)
              )
            )
        )
      );
  end if;
end
$$;
