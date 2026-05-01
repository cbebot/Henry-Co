-- V2-PNH-04: per-course unlock policy
--
-- Adds learn_courses.unlock_policy so a teacher can pick how their course
-- gates lesson access:
--   - 'sequential'   : strict — each lesson requires the previous, modules
--                      unlock in order (the previous default behaviour).
--   - 'open'         : all lessons unlocked once enrolled. Free exploration.
--   - 'module_gated' : must finish all lessons in module N before N+1 opens,
--                      but within a module lessons are open (any order).
--
-- Existing courses default to 'sequential' so behaviour is unchanged at
-- migration time. A premium ProgressionCard on the learner page reads
-- this and renders accordingly. Server-side gates use the same field.

alter table if exists public.learn_courses
  add column if not exists unlock_policy text not null default 'sequential';

alter table if exists public.learn_courses
  drop constraint if exists learn_courses_unlock_policy_check;

alter table if exists public.learn_courses
  add constraint learn_courses_unlock_policy_check
  check (unlock_policy in ('sequential', 'open', 'module_gated'));

-- Backfill any rows that may have been seeded with NULL despite the default.
update public.learn_courses
   set unlock_policy = 'sequential'
 where unlock_policy is null;
