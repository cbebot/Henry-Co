-- V3 PASS 21 — Care: garment-type catalogue.
--
-- WHY:
--   Care's distinctive surface is per-garment care preferences (starch,
--   fragrance, fold style, stain treatment) keyed by garment-type.
--   Today the booking flow has free-text item names but no catalogue,
--   so preferences cannot persist by type. This table is the typed
--   anchor that per-user preferences (care_user_preferences) and
--   booking-level garment rows (care_booking_garments) reference.
--
-- TABLE:
--   public.care_garment_types (id, key text unique, name jsonb i18n,
--   default_care_options jsonb, sort_order int, is_active bool).
--
-- RLS:
--   - Public SELECT (anonymous) — catalogue browsing is open.
--   - Service role: full access.
--   - Owner / manager: full INSERT/UPDATE via is_staff_in('care').
--
-- IDEMPOTENT: yes.

create table if not exists public.care_garment_types (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  name jsonb not null default '{}'::jsonb,
  description jsonb not null default '{}'::jsonb,
  default_care_options jsonb not null default '{}'::jsonb,
  sort_order int not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists care_garment_types_active_idx
  on public.care_garment_types (is_active, sort_order)
  where is_active = true;

alter table public.care_garment_types enable row level security;

drop policy if exists "care garment types: service role" on public.care_garment_types;
create policy "care garment types: service role"
  on public.care_garment_types
  for all
  using ((select auth.role()) = 'service_role')
  with check ((select auth.role()) = 'service_role');

drop policy if exists "care garment types: public read" on public.care_garment_types;
create policy "care garment types: public read"
  on public.care_garment_types
  for select
  using (is_active = true);

drop policy if exists "care garment types: staff write" on public.care_garment_types;
create policy "care garment types: staff write"
  on public.care_garment_types
  for all
  using (public.is_staff_in('care'))
  with check (public.is_staff_in('care'));

comment on table public.care_garment_types is
  'V3 PASS 21 — typed garment catalogue. Per-user preferences and '
  'booking garments key off this. RLS: public reads active rows; staff '
  'writes; service role full access.';

-- end of migration --
