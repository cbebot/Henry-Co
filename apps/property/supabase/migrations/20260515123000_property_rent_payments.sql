-- V3 PASS 21 — Property: managed-client rent ledger.
--
-- WHY:
--   Managed-property operator surface needs a rent ledger so HenryCo can
--   show statement rows to managed clients and run the financial
--   statement PDF (PropertyManagedStatement template).
--
-- WHAT:
--   property_rent_payments captures every collection event for a
--   managed listing. `period_label` is the human-readable cycle
--   ("2026-04", "2026-Q2"), `period_starts_at` and `period_ends_at`
--   bound the period, `amount_kobo` is the gross rent collected for
--   that period in minor units, and `status` captures the lifecycle.
--
-- RLS:
--   - Managed client (the listing owner) can read own rent rows.
--   - Property staff can read + write all rows.
--   - Inserts only happen server-side from a service role / property
--     payment surface; that path uses createAdminSupabase().
--
-- IDEMPOTENT: yes.

create table if not exists public.property_rent_payments (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.property_listings(id) on delete cascade,
  managed_record_id uuid references public.property_managed_records(id) on delete set null,
  owner_user_id uuid,
  normalized_email text,
  period_label text not null,
  period_starts_at date not null,
  period_ends_at date not null,
  amount_kobo bigint not null default 0,
  currency text not null default 'NGN',
  status text not null default 'scheduled' check (
    status in ('scheduled', 'invoiced', 'collected', 'overdue', 'waived', 'refunded')
  ),
  collected_at timestamptz,
  notes text not null default '',
  external_reference text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_property_rent_payments_listing
  on public.property_rent_payments (listing_id, period_starts_at desc);
create index if not exists idx_property_rent_payments_owner
  on public.property_rent_payments (owner_user_id, period_starts_at desc)
  where owner_user_id is not null;

alter table public.property_rent_payments enable row level security;

drop policy if exists "owners can read own rent payments"
  on public.property_rent_payments;
create policy "owners can read own rent payments"
on public.property_rent_payments
for select
using (
  owner_user_id = auth.uid()
  or exists (
    select 1
    from public.property_listings l
    where l.id = listing_id and l.owner_user_id = auth.uid()
  )
  or public.is_property_staff()
);

drop policy if exists "staff can manage rent payments"
  on public.property_rent_payments;
create policy "staff can manage rent payments"
on public.property_rent_payments
for all
using (public.is_property_staff())
with check (public.is_property_staff());

drop trigger if exists trg_property_rent_payments_updated_at
  on public.property_rent_payments;
create trigger trg_property_rent_payments_updated_at
before update on public.property_rent_payments
for each row execute function public.set_updated_at();
