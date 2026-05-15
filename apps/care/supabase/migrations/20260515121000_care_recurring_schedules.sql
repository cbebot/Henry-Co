-- V3 PASS 21 — Care: recurring auto-book schedules.
--
-- WHY:
--   Weekly/biweekly garment care is the highest-value retention segment.
--   Today Care has no recurring-booking model — the customer rebooks
--   manually. This table is the cron-driven auto-book ledger: the
--   /api/cron/care-automation sweep finds active schedules whose next
--   run lands within 24h and creates a `care_bookings` row from the
--   stored payload.
--
-- TABLE:
--   public.care_recurring_schedules (id, user_id fk, cadence enum-like,
--   day_of_week int, time_of_day time, service_payload jsonb,
--   pickup_address jsonb, status text, paused_until timestamptz,
--   next_run_at timestamptz, last_run_at timestamptz, created_at,
--   updated_at).
--
-- RLS:
--   - Service role: full.
--   - Owner: full self.
--   - Care staff: SELECT all.
--
-- IDEMPOTENT: yes.

create table if not exists public.care_recurring_schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  cadence text not null default 'weekly',
  day_of_week smallint,
  time_of_day time,
  pickup_window text,
  service_payload jsonb not null default '{}'::jsonb,
  pickup_address jsonb not null default '{}'::jsonb,
  contact_phone text,
  notes text,
  status text not null default 'active',
  paused_until timestamptz,
  next_run_at timestamptz,
  last_run_at timestamptz,
  last_booking_id uuid,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists care_recurring_user_idx
  on public.care_recurring_schedules (user_id, status);

create index if not exists care_recurring_next_run_idx
  on public.care_recurring_schedules (next_run_at)
  where status = 'active';

alter table public.care_recurring_schedules enable row level security;

drop policy if exists "care recurring: service role" on public.care_recurring_schedules;
create policy "care recurring: service role"
  on public.care_recurring_schedules
  for all
  using ((select auth.role()) = 'service_role')
  with check ((select auth.role()) = 'service_role');

drop policy if exists "care recurring: owner read" on public.care_recurring_schedules;
create policy "care recurring: owner read"
  on public.care_recurring_schedules
  for select
  using (user_id = (select auth.uid()));

drop policy if exists "care recurring: owner insert" on public.care_recurring_schedules;
create policy "care recurring: owner insert"
  on public.care_recurring_schedules
  for insert
  with check (user_id = (select auth.uid()));

drop policy if exists "care recurring: owner update" on public.care_recurring_schedules;
create policy "care recurring: owner update"
  on public.care_recurring_schedules
  for update
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "care recurring: owner delete" on public.care_recurring_schedules;
create policy "care recurring: owner delete"
  on public.care_recurring_schedules
  for delete
  using (user_id = (select auth.uid()));

drop policy if exists "care recurring: staff read" on public.care_recurring_schedules;
create policy "care recurring: staff read"
  on public.care_recurring_schedules
  for select
  using (public.is_staff_in('care'));

comment on table public.care_recurring_schedules is
  'V3 PASS 21 — recurring auto-book ledger. /api/cron/care-automation '
  'creates a care_bookings row 24h ahead of next_run_at when status=''active''. '
  'RLS: owner full self; staff reads.';

-- end of migration --
