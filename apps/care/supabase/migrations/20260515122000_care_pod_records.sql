-- V3 PASS 21 — Care: rider proof-of-delivery capture.
--
-- WHY:
--   Care's rider needs to capture photo + signature + GPS at pickup
--   AND at delivery (two-leg shape). This table is the per-leg POD
--   ledger. Mirrors logistics_pod_records (commit b667567d) so the
--   shape is consistent across divisions.
--
-- TABLE:
--   public.care_pod_records (id, booking_id fk, leg text
--   ('pickup'|'delivery'), captured_by_user_id fk, captured_at,
--   photo_url, signature_url, cloudinary_public_id, gps_lat, gps_lng,
--   gps_accuracy_m, recipient_name, recipient_relationship, note,
--   created_at).
--
-- RLS:
--   - Service role: full.
--   - Customer: SELECT records for own bookings.
--   - Rider (captured_by_user_id = auth.uid()): INSERT + SELECT own.
--   - Care staff: SELECT + WRITE via is_staff_in('care').
--
-- IDEMPOTENT: yes.

create table if not exists public.care_pod_records (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.care_bookings(id) on delete cascade,
  leg text not null default 'delivery',
  captured_by_user_id uuid references auth.users(id) on delete set null,
  captured_at timestamptz not null default timezone('utc', now()),
  photo_url text,
  signature_url text,
  cloudinary_public_id text,
  gps_lat numeric,
  gps_lng numeric,
  gps_accuracy_m numeric,
  recipient_name text,
  recipient_relationship text,
  note text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists care_pod_records_booking_idx
  on public.care_pod_records (booking_id, captured_at desc);

create index if not exists care_pod_records_rider_idx
  on public.care_pod_records (captured_by_user_id, captured_at desc)
  where captured_by_user_id is not null;

alter table public.care_pod_records enable row level security;

drop policy if exists "care pod: service role" on public.care_pod_records;
create policy "care pod: service role"
  on public.care_pod_records
  for all
  using ((select auth.role()) = 'service_role')
  with check ((select auth.role()) = 'service_role');

drop policy if exists "care pod: customer read" on public.care_pod_records;
create policy "care pod: customer read"
  on public.care_pod_records
  for select
  using (
    exists (
      select 1
      from public.care_bookings b
      where b.id = care_pod_records.booking_id
        and (
          b.user_id = (select auth.uid())
          or lower(coalesce(b.email_normalized, '')) =
             lower(coalesce(((select auth.jwt()) ->> 'email'), ''))
        )
    )
  );

drop policy if exists "care pod: rider insert" on public.care_pod_records;
create policy "care pod: rider insert"
  on public.care_pod_records
  for insert
  with check (
    captured_by_user_id = (select auth.uid())
    and public.is_staff_in('care')
  );

drop policy if exists "care pod: rider read own" on public.care_pod_records;
create policy "care pod: rider read own"
  on public.care_pod_records
  for select
  using (captured_by_user_id = (select auth.uid()));

drop policy if exists "care pod: staff" on public.care_pod_records;
create policy "care pod: staff"
  on public.care_pod_records
  for all
  using (public.is_staff_in('care'))
  with check (public.is_staff_in('care'));

comment on table public.care_pod_records is
  'V3 PASS 21 — rider POD capture (photo + signature + GPS) per leg. '
  'leg=pickup|delivery. RLS: customer reads own bookings; rider INSERTs '
  'only with captured_by_user_id = self and care staff role; staff '
  'full read+write.';

-- end of migration --
