-- LRN-3 — Public course reviews leak reviewer PII. `learn_reviews` public SELECT policy is
-- `USING (status='published' OR learn_is_staff())` and the row carries `normalized_email` + `user_id`
-- (live probe: 6 published reviews with email, incl. internal @henryonyx.com). The review *page* is
-- public by design; the email/user_id columns must not be world-readable.
--
-- Serve the public review surface through a column-restricted security_invoker view and remove the
-- blanket public read from the base table.

drop policy if exists "learn public reviews" on public.learn_reviews;

create or replace view public.learn_reviews_public
  with (security_invoker = on) as
  select id, course_id, rating, title, body, author_display_name, created_at, status
  from public.learn_reviews
  where status = 'published';   -- NO normalized_email, NO user_id

-- Base table keeps the staff "learn staff all reviews" policy; the app's public review list reads
-- from learn_reviews_public. (Confirm display-name column name on prod before applying.)
