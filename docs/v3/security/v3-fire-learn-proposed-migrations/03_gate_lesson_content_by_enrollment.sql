-- LRN-4 (SKETCH — confirm columns + the free/preview model before applying) — `learn_lessons` and
-- `learn_lesson_resources` have a public SELECT policy `USING (true)`, so anon reads body_markdown +
-- (when populated) video_url / resource url for ALL lessons regardless of enrollment, payment, or the
-- is_preview flag (live: 30 lessons; video_url null today, so text-only NOW but escalates the moment
-- assets land — and video_url is a permanent Cloudinary delivery URL, not a signed token).
--
-- Replace USING(true) with: preview lessons OR free courses are public; non-preview lessons of paid
-- courses require an active/completed enrollment for the lesson's course.

drop policy if exists "learn public lessons" on public.learn_lessons;
create policy "learn public lessons" on public.learn_lessons
for select using (
  is_preview = true
  or exists (select 1 from public.learn_courses c
             where c.id = learn_lessons.course_id
               and coalesce(c.access_model,'free') = 'free'
               and c.status = 'published' and c.visibility = 'public')
  or exists (select 1 from public.learn_enrollments e
             where e.course_id = learn_lessons.course_id
               and public.learn_matches_identity(e.user_id, e.normalized_email)
               and e.status in ('active','completed'))
  or public.learn_is_staff()
);

-- Apply the analogous gate to learn_lesson_resources (join through its lesson/course).
-- BETTER yet: also stop persisting video_url as a public Cloudinary URL — store an opaque provider id
-- and mint short-lived signed URLs server-side after this enrollment check. Verify column names
-- (course_id / is_preview / access_model) against prod first.
