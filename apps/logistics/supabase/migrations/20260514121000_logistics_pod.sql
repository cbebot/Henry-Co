-- V3 PASS 21 — Logistics: enriched proof-of-delivery capture.
--
-- WHY:
--   The hub-level logistics_proof_of_delivery table from the 2026-04-05
--   migration models a single text/photo POD per shipment but does not
--   model per-leg POD, GPS accuracy, recipient signature provenance,
--   or Cloudinary asset attribution. V3 PASS 21 distinctive surface
--   #2 (POD photo + signature + GPS captured by rider device).
--
--   This migration adds a richer per-leg POD table. It does NOT delete
--   the existing hub-level table; the new table is the authoritative
--   one for V3 PASS 21 operator workflows.
--
-- TABLE:
--   public.logistics_pod_records (id, shipment_id fk, leg_id fk
--   nullable, captured_by_user_id fk, captured_at, photo_url,
--   signature_url, gps_lat, gps_lng, gps_accuracy_m, recipient_name,
--   recipient_relationship, note, cloudinary_public_id text,
--   created_at).
--
-- RLS:
--   - Service role: full access.
--   - Customer: SELECT records for own shipments.
--   - Rider: INSERT records for legs they are assigned to; SELECT own
--     captures.
--   - Staff: SELECT + WRITE via is_staff_in('logistics').
--
-- DOWN:
--   drop policy "pod records: service role" on public.logistics_pod_records;
--   drop policy "pod records: customer read" on public.logistics_pod_records;
--   drop policy "pod records: rider insert" on public.logistics_pod_records;
--   drop policy "pod records: rider read" on public.logistics_pod_records;
--   drop policy "pod records: staff" on public.logistics_pod_records;
--   drop table public.logistics_pod_records;

create table if not exists public.logistics_pod_records (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.logistics_shipments(id) on delete cascade,
  leg_id uuid references public.logistics_shipment_legs(id) on delete set null,
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

create index if not exists logistics_pod_records_shipment_idx
  on public.logistics_pod_records (shipment_id, captured_at desc);

create index if not exists logistics_pod_records_rider_idx
  on public.logistics_pod_records (captured_by_user_id, captured_at desc)
  where captured_by_user_id is not null;

alter table public.logistics_pod_records enable row level security;

drop policy if exists "pod records: service role" on public.logistics_pod_records;
create policy "pod records: service role"
  on public.logistics_pod_records
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "pod records: customer read" on public.logistics_pod_records;
create policy "pod records: customer read"
  on public.logistics_pod_records
  for select
  using (
    exists (
      select 1
      from public.logistics_shipments s
      where s.id = logistics_pod_records.shipment_id
        and s.customer_user_id = auth.uid()
    )
  );

drop policy if exists "pod records: rider insert" on public.logistics_pod_records;
create policy "pod records: rider insert"
  on public.logistics_pod_records
  for insert
  with check (
    captured_by_user_id = auth.uid()
    and exists (
      select 1
      from public.logistics_shipment_legs l
      where l.id = logistics_pod_records.leg_id
        and l.rider_user_id = auth.uid()
    )
  );

drop policy if exists "pod records: rider read" on public.logistics_pod_records;
create policy "pod records: rider read"
  on public.logistics_pod_records
  for select
  using (captured_by_user_id = auth.uid());

drop policy if exists "pod records: staff" on public.logistics_pod_records;
create policy "pod records: staff"
  on public.logistics_pod_records
  for all
  using (public.is_staff_in('logistics'))
  with check (public.is_staff_in('logistics'));

comment on table public.logistics_pod_records is
  'V3 PASS 21 — enriched POD capture (photo + signature + GPS + recipient + '
  'Cloudinary asset id). One row per delivery confirmation. RLS: customer reads '
  'records for own shipments; rider INSERTs only on legs they are assigned to '
  'and only with captured_by_user_id = auth.uid(); staff full read+write.';

-- end of migration --
