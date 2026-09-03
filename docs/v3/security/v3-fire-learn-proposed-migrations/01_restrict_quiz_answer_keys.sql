-- LRN-2 — Quiz answer keys are world-readable. `learn_quiz_questions` (and
-- `learn_quiz_answer_options`) have a public SELECT policy `USING (true)`, so the public anon key
-- returns every question's `correct_answer text[]` (live probe: 30 questions with answers) and
-- each option's `is_correct`. That trivially defeats quiz-gated certification (which feeds the
-- Learn-to-Earn trust). Server grading (`submitQuizAttempt`) already compares server-side, so the
-- correct answers do NOT need to be readable by learners at all.
--
-- Replace the blanket public read with one that exposes questions/options to anon WITHOUT the
-- answer columns. Simplest robust approach: revoke the public row read and serve quiz-taking through
-- a server route / a column-projected view that omits correct_answer + is_correct.

drop policy if exists "learn public quiz questions" on public.learn_quiz_questions;
drop policy if exists "learn public quiz answer options" on public.learn_quiz_answer_options;

-- Keep staff full access (unchanged): "learn staff all quiz questions" / "... answer options".
-- Expose only non-answer columns to anon/authenticated via security_invoker views:

create or replace view public.learn_quiz_questions_public
  with (security_invoker = on) as
  select id, quiz_id, prompt, question_type, position, points  -- NO correct_answer, NO explanation
  from public.learn_quiz_questions;

create or replace view public.learn_quiz_answer_options_public
  with (security_invoker = on) as
  select id, question_id, label, position               -- NO is_correct
  from public.learn_quiz_answer_options;

-- App reads switch to the *_public views for quiz-taking; server grading keeps using the base tables
-- via the service-role/staff path. (Confirm exact column names against prod before applying.)
