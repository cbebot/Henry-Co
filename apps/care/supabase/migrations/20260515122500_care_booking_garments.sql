-- V3 PASS 21 — Care: per-booking garment-level intake + completion.
--
-- WHY:
--   Care's distinctive operator workflow is intake → wash → press →
--   pack → dispatch with garment-by-garment state. Today bookings have
--   a free-text item_summary; this table is the structured ledger:
--   one row per garment, with intake photo + completion photo + status
--   + linked preferences + linked claim.
--
-- TABLE:
--   public.care_booking_garments (id, booking_id fk, garment_type_id fk,
--   garment_label text, quantity int, intake_photo_url text,
--   intake_photo_public_id text, completion_photo_url text,
--   completion_photo_public_id text, options jsonb, notes text,
--   status text, claim_id fk nullable, created_at, updated_at).
--
-- RLS:
--   - Service role: full.
--   - Customer: SELECT rows for own bookings.
--   - Care staff: full read + write via is_staff_in('care').
--
-- V3-ACTIVATION-RUNBOOK-FIX-01 (2026-09-24) — rebound to prod-actual columns:
--   public.care_bookings has customer_id (FK auth.users) and email, NOT the
--   user_id / email_normalized pair this file was written against (those were
--   never added on prod — supabase/prod-actual/schema.sql). Ownership is now
--   b.customer_id = auth.uid(), or a NULL-safe email match: nullif(...,'') on
--   both sides so an empty/absent JWT email (phone-auth users) can never match
--   a booking whose email is empty/NULL.
--
-- IDEMPOTENT: yes.

create table if not exists public.care_booking_garments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.care_bookings(id) on delete cascade,
  garment_type_id uuid references public.care_garment_types(id) on delete set null,
  garment_label text,
  quantity int not null default 1,
  intake_photo_url text,
  intake_photo_public_id text,
  completion_photo_url text,
  completion_photo_public_id text,
  options jsonb not null default '{}'::jsonb,
  notes text,
  status text not null default 'pending',
  claim_id uuid references public.care_claims(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists care_booking_garments_booking_idx
  on public.care_booking_garments (booking_id, created_at);

create index if not exists care_booking_garments_status_idx
  on public.care_booking_garments (status, updated_at);

alter table public.care_booking_garments enable row level security;

drop policy if exists "care garments: service role" on public.care_booking_garments;
create policy "care garments: service role"
  on public.care_booking_garments
  for all
  using ((select auth.role()) = 'service_role')
  with check ((select auth.role()) = 'service_role');

drop policy if exists "care garments: customer read" on public.care_booking_garments;
create policy "care garments: customer read"
  on public.care_booking_garments
  for select
  using (
    exists (
      select 1
      from public.care_bookings b
      where b.id = care_booking_garments.booking_id
        and (
          b.customer_id = (select auth.uid())
          or nullif(lower(trim(b.email)), '') =
             nullif(lower(trim((select auth.jwt()) ->> 'email')), '')
        )
    )
  );

drop policy if exists "care garments: staff" on public.care_booking_garments;
create policy "care garments: staff"
  on public.care_booking_garments
  for all
  using (public.is_staff_in('care'))
  with check (public.is_staff_in('care'));

comment on table public.care_booking_garments is
  'V3 PASS 21 — per-booking garment ledger. One row per garment with '
  'intake/completion photos, options, status, and claim linkage. RLS: '
  'customer reads own bookings; staff full read+write.';

-- end of migration --
