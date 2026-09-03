-- V3 PASS 21 — Studio: extend studio_project_milestones for PM ownership
-- and milestone-driven payment plans.
--
-- WHY:
--   The original studio_project_milestones table (2026-04-02 init) has:
--     id, project_id, name, description, due_label, amount, status,
--     sort_order, timestamps.
--   V3 PASS 21 distinctive surfaces #3 (multi-stakeholder workspace) and
--   #5 (milestone-driven payment plan) need:
--     * due_at timestamptz (machine-readable for cron reminders; the
--       legacy due_label is editorial-only),
--     * completed_at timestamptz (for on-time-% reporting),
--     * owner_user_id (PM-side responsibility per milestone),
--     * payment_plan_id linkage (which payment plan releases on this
--       milestone),
--     * reminder_sent_at + reminder_count for the cron-driven reminders.
--   These additions are non-destructive; existing rows keep their
--   due_label as-is and gain a NULL due_at the cron sweep can ignore.
--
-- DOWN: drop the new columns + the new indexes.

alter table public.studio_project_milestones
  add column if not exists due_at timestamptz,
  add column if not exists completed_at timestamptz,
  add column if not exists owner_user_id uuid references auth.users(id) on delete set null,
  add column if not exists payment_plan_id uuid,
  add column if not exists reminder_sent_at timestamptz,
  add column if not exists reminder_count integer not null default 0,
  add column if not exists external_ref text;

create index if not exists studio_project_milestones_due_idx
  on public.studio_project_milestones (due_at, status)
  where due_at is not null and status <> 'completed';

create index if not exists studio_project_milestones_owner_idx
  on public.studio_project_milestones (owner_user_id, status)
  where owner_user_id is not null;

comment on column public.studio_project_milestones.due_at is
  'V3 PASS 21 — machine-readable milestone due date for cron-driven '
  'reminders. Editorial due_label remains for display copy. When NULL the '
  'cron sweep skips this milestone (no reminder fires).';

comment on column public.studio_project_milestones.completed_at is
  'V3 PASS 21 — timestamp the milestone was marked completed. Drives the '
  'on-time-% metric (completed_at <= due_at) on the PM overview.';

comment on column public.studio_project_milestones.owner_user_id is
  'V3 PASS 21 — PM-side responsibility per milestone. Used by /pm Gantt + '
  'workload view + ResourceAllocationGrid to attribute capacity.';

comment on column public.studio_project_milestones.payment_plan_id is
  'V3 PASS 21 — link to studio_payment_plans.id when the milestone releases '
  'an invoice. NULL when the milestone is delivery-only.';

-- end of migration --
