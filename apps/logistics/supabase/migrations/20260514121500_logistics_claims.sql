-- V3 PASS 21 — Logistics: customer claims (damaged / lost shipments).
--
-- WHY:
--   Audit DEEP FINDINGS noted "No dispute flow. No claim flow for
--   damaged / lost packages". Insurance is meaningless without a
--   structured intake. This table is the audited claim ledger.
--
-- TABLE:
--   public.logistics_claims (id, shipment_id fk, opened_by_user_id fk,
--   reason text, evidence_urls jsonb, requested_amount_minor bigint,
--   currency, status enum, owner_user_id fk nullable, resolution_note,
--   resolved_at, created_at, updated_at).
--
-- RLS:
--   - Service role: full access.
--   - Customer: SELECT own claims; INSERT for own shipments.
--   - Dispatcher / manager / owner staff (logistics): SELECT all,
--     UPDATE for triage + resolution (status, owner_user_id,
--     resolution_note, resolved_at).
--
-- DOWN: drop policies + table.

create table if not exists public.logistics_claims (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.logistics_shipments(id) on delete cascade,
  opened_by_user_id uuid references auth.users(id) on delete set null,
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

create index if not exists logistics_claims_shipment_idx
  on public.logistics_claims (shipment_id);

create index if not exists logistics_claims_opener_idx
  on public.logistics_claims (opened_by_user_id, created_at desc)
  where opened_by_user_id is not null;

create index if not exists logistics_claims_status_idx
  on public.logistics_claims (status, created_at desc);

alter table public.logistics_claims enable row level security;

drop policy if exists "logistics claims: service role" on public.logistics_claims;
create policy "logistics claims: service role"
  on public.logistics_claims
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "logistics claims: customer read own" on public.logistics_claims;
create policy "logistics claims: customer read own"
  on public.logistics_claims
  for select
  using (opened_by_user_id = auth.uid());

drop policy if exists "logistics claims: customer insert own" on public.logistics_claims;
create policy "logistics claims: customer insert own"
  on public.logistics_claims
  for insert
  with check (
    opened_by_user_id = auth.uid()
    and exists (
      select 1
      from public.logistics_shipments s
      where s.id = logistics_claims.shipment_id
        and (
          s.customer_user_id = auth.uid()
          or lower(coalesce(s.normalized_email, '')) =
             lower(coalesce((auth.jwt() ->> 'email'), ''))
        )
    )
  );

drop policy if exists "logistics claims: staff read" on public.logistics_claims;
create policy "logistics claims: staff read"
  on public.logistics_claims
  for select
  using (public.is_staff_in('logistics'));

drop policy if exists "logistics claims: staff write" on public.logistics_claims;
create policy "logistics claims: staff write"
  on public.logistics_claims
  for update
  using (public.is_staff_in('logistics'))
  with check (public.is_staff_in('logistics'));

comment on table public.logistics_claims is
  'V3 PASS 21 — customer claim ledger. Damaged / lost / never-delivered claims '
  'with evidence_urls (Cloudinary), requested amount, and resolution attribution. '
  'RLS: customer reads own + inserts for own shipments; staff reads all + '
  'updates (status, owner_user_id, resolution_note, resolved_at).';

-- end of migration --
