-- V3 PASS 21 — Care: per-user, per-garment-type care preferences.
--
-- WHY:
--   The Care division's distinctive premium feature is per-garment
--   care preferences (starch level, fragrance, fold style, stain
--   treatment) that persist across bookings. Without this table the
--   customer re-enters preferences on every booking; with it, the
--   booking flow hydrates from saved preferences and the depot
--   operator sees them on intake.
--
-- TABLE:
--   public.care_user_preferences (id, user_id fk, garment_type_id fk,
--   options jsonb, notes text, created_at, updated_at).
--   Unique on (user_id, garment_type_id).
--
-- RLS:
--   - Service role: full.
--   - Owner: SELECT/INSERT/UPDATE/DELETE own rows.
--   - Care staff: SELECT all (for intake context).
--
-- IDEMPOTENT: yes.

create table if not exists public.care_user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  garment_type_id uuid references public.care_garment_types(id) on delete cascade,
  garment_type_key text,
  options jsonb not null default '{}'::jsonb,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists care_user_preferences_user_type_uidx
  on public.care_user_preferences (user_id, coalesce(garment_type_id::text, garment_type_key, ''));

create index if not exists care_user_preferences_user_idx
  on public.care_user_preferences (user_id, updated_at desc);

alter table public.care_user_preferences enable row level security;

drop policy if exists "care prefs: service role" on public.care_user_preferences;
create policy "care prefs: service role"
  on public.care_user_preferences
  for all
  using ((select auth.role()) = 'service_role')
  with check ((select auth.role()) = 'service_role');

drop policy if exists "care prefs: owner read" on public.care_user_preferences;
create policy "care prefs: owner read"
  on public.care_user_preferences
  for select
  using (user_id = (select auth.uid()));

drop policy if exists "care prefs: owner insert" on public.care_user_preferences;
create policy "care prefs: owner insert"
  on public.care_user_preferences
  for insert
  with check (user_id = (select auth.uid()));

drop policy if exists "care prefs: owner update" on public.care_user_preferences;
create policy "care prefs: owner update"
  on public.care_user_preferences
  for update
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "care prefs: owner delete" on public.care_user_preferences;
create policy "care prefs: owner delete"
  on public.care_user_preferences
  for delete
  using (user_id = (select auth.uid()));

drop policy if exists "care prefs: staff read" on public.care_user_preferences;
create policy "care prefs: staff read"
  on public.care_user_preferences
  for select
  using (public.is_staff_in('care'));

comment on table public.care_user_preferences is
  'V3 PASS 21 — per-user, per-garment-type care preferences (starch, '
  'fragrance, fold style, stain treatment). RLS: owner full self; staff '
  'reads; service role full.';

-- end of migration --
