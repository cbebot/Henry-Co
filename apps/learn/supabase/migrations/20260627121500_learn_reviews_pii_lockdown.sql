-- ============================================================================
-- LRN-3 (MED) — Reviews PII lockdown.        *** HELD / committed-not-applied ***
-- Apply only after the owner verifies on prod (rzkbgwuznmdxnnhmjazy).
--
-- Problem: public.learn_reviews carried a public select policy
-- (`status = 'published' OR learn_is_staff()`) that returned EVERY column,
-- exposing reviewer `normalized_email` and `user_id` (PII) to anon.
--
-- Fix:
--   1. drop the public select policy;
--   2. add an own + staff select policy (no anon PII);
--   3. expose a published-only, PII-free view for anon + authenticated.
-- The application reads the base table via the service role (RLS-exempt), so no
-- application change is required.
--
-- The view is intentionally owner-privileged (security_invoker OFF, the
-- default): the column projection + `status = 'published'` filter ARE the
-- access control. Idempotent + existence-guarded.
-- ============================================================================

do $$
begin
  if to_regclass('public.learn_reviews') is null then
    return;
  end if;

  drop policy if exists "learn public reviews" on public.learn_reviews;

  drop policy if exists "learn own reviews read" on public.learn_reviews;
  create policy "learn own reviews read" on public.learn_reviews
    for select using (
      public.learn_matches_identity(user_id, normalized_email)
      or public.learn_is_staff()
    );

  create or replace view public.learn_reviews_public as
    select
      id,
      course_id,
      rating,
      title,
      body,
      status,
      created_at,
      updated_at
    from public.learn_reviews
    where status = 'published';

  grant select on public.learn_reviews_public to anon, authenticated;
end
$$;
