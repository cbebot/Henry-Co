-- ============================================================================
-- LRN-2 (MED) — Quiz answer-key lockdown.   *** HELD / committed-not-applied ***
-- Apply only after the owner verifies on prod (rzkbgwuznmdxnnhmjazy).
--
-- Problem: public.learn_quiz_questions carried a public `SELECT USING (true)`
-- policy, so anon could read `correct_answer` and `explanation` — the live
-- answer key for every quiz.
--
-- Fix: drop the public select policy and expose a content-projected view
-- (no correct_answer / explanation) for anon + authenticated. The application
-- reads the base table via the service role (RLS-exempt) and the staff policy
-- ("learn staff all quiz questions") still serves authenticated staff, so no
-- application change is required.
--
-- The view is intentionally owner-privileged (security_invoker OFF, the
-- default): the column projection IS the access control — anon only ever sees
-- the safe columns. Idempotent + existence-guarded.
-- ============================================================================

do $$
begin
  if to_regclass('public.learn_quiz_questions') is null then
    return;
  end if;

  drop policy if exists "learn public quiz questions" on public.learn_quiz_questions;

  create or replace view public.learn_quiz_questions_public as
    select
      id,
      quiz_id,
      prompt,
      question_type,
      options,
      sort_order
    from public.learn_quiz_questions;

  grant select on public.learn_quiz_questions_public to anon, authenticated;
end
$$;
