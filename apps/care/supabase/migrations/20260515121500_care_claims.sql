-- V3 PASS 21 — Care: customer damage / lost / never-arrived claims.
--
-- WHY:
--   Insurance is meaningless without an audited claim intake. Care
--   today has no structured dispute flow for damaged garments. Pattern
--   mirrors logistics_claims (commit b667567d) so resolution flows are
--   consistent across divisions.
--
-- TABLE:
--   public.care_claims (id, booking_id fk, opened_by_user_id fk,
--   garment_label text nullable, reason text, description text,
--   evidence_urls jsonb, requested_amount_minor bigint, currency text,
--   status text, owner_user_id fk nullable, resolution_note text,
--   resolved_at timestamptz, created_at, updated_at).
--
-- RLS:
--   - Service role: full.
--   - Customer: SELECT own claims; INSERT for own bookings.
--   - Care staff (manager+, support+): SELECT all, UPDATE for triage
--     + resolution (status, owner_user_id, resolution_note, resolved_at).
--
-- IDEMPOTENT: yes.

create table if not exists public.care_claims (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.care_bookings(id) on delete cascade,
  opened_by_user_id uuid references auth.users(id) on delete set null,
  garment_label text,
  reason text not null,
  description text,
  evidence_urls jsonb not null default '[]'::jsonb,
  requested_amount_minor bigint not null default 0,
  currency text not null default 'NGN',
  status text not null default 'submitted',
  owner_user_id uuid references auth.users(id) on delete set null,
  resolution_note text,
  resolved_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists care_claims_booking_idx
  on public.care_claims (booking_id);

create index if not exists care_claims_opener_idx
  on public.care_claims (opened_by_user_id, created_at desc)
  where opened_by_user_id is not null;

create index if not exists care_claims_status_idx
  on public.care_claims (status, created_at desc);

alter table public.care_claims enable row level security;

drop policy if exists "care claims: service role" on public.care_claims;
create policy "care claims: service role"
  on public.care_claims
  for all
  using ((select auth.role()) = 'service_role')
  with check ((select auth.role()) = 'service_role');

drop policy if exists "care claims: customer read own" on public.care_claims;
create policy "care claims: customer read own"
  on public.care_claims
  for select
  using (opened_by_user_id = (select auth.uid()));

drop policy if exists "care claims: customer insert own" on public.care_claims;
create policy "care claims: customer insert own"
  on public.care_claims
  for insert
  with check (
    opened_by_user_id = (select auth.uid())
    and (
      booking_id is null
      or exists (
        select 1
        from public.care_bookings b
        where b.id = care_claims.booking_id
          and (
            b.user_id = (select auth.uid())
            or lower(coalesce(b.email_normalized, '')) =
               lower(coalesce(((select auth.jwt()) ->> 'email'), ''))
          )
      )
    )
  );

drop policy if exists "care claims: staff read" on public.care_claims;
create policy "care claims: staff read"
  on public.care_claims
  for select
  using (public.is_staff_in('care'));

drop policy if exists "care claims: staff write" on public.care_claims;
create policy "care claims: staff write"
  on public.care_claims
  for update
  using (public.is_staff_in('care'))
  with check (public.is_staff_in('care'));

comment on table public.care_claims is
  'V3 PASS 21 — customer claim ledger. Damaged / lost / not-returned '
  'claims with evidence_urls (Cloudinary), requested amount, and '
  'resolution attribution. RLS: customer reads own + inserts for own '
  'bookings; staff reads all + updates resolution fields.';

-- end of migration --
