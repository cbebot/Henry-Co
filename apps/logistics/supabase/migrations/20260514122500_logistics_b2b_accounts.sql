-- V3 PASS 21 — Logistics: B2B accounts + admin memberships.
--
-- WHY:
--   Audit DEEP FINDINGS noted no first-class B2B portal beyond a static
--   marketing page. B2B parity with Sendcloud / DHL requires an account
--   container that holds billing terms, SLA, and an admin roster who
--   can compose bulk shipments + view monthly statements.
--
-- TABLES:
--   public.logistics_b2b_accounts (id, name, billing_terms text,
--     billing_email, payment_method enum, sla_id text nullable, status
--     enum, monthly_volume_target, created_at, updated_at).
--   public.logistics_b2b_admins (id, account_id fk, user_id fk, role
--     enum, invited_at, accepted_at, active, created_at).
--
-- RLS:
--   - Service role: full.
--   - Account admin (joined via logistics_b2b_admins.user_id =
--     auth.uid()): SELECT own account + own admin row.
--   - Staff (logistics): full read/write via is_staff_in('logistics').

create table if not exists public.logistics_b2b_accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  legal_name text,
  billing_terms text not null default 'net_30',
  billing_email text,
  payment_method text not null default 'invoice',
  sla_id text,
  status text not null default 'active',
  monthly_volume_target int not null default 0,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists logistics_b2b_accounts_status_idx
  on public.logistics_b2b_accounts (status);

create table if not exists public.logistics_b2b_admins (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.logistics_b2b_accounts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'admin',
  invited_at timestamptz not null default timezone('utc', now()),
  accepted_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  unique (account_id, user_id)
);

create index if not exists logistics_b2b_admins_user_idx
  on public.logistics_b2b_admins (user_id, active);

-- Stamp logistics_shipments with optional b2b_account_id so B2B
-- monthly statements can aggregate shipments cheaply. The column is
-- nullable; existing shipments stay null.
alter table public.logistics_shipments
  add column if not exists b2b_account_id uuid
    references public.logistics_b2b_accounts(id) on delete set null;

create index if not exists logistics_shipments_b2b_account_idx
  on public.logistics_shipments (b2b_account_id, created_at desc)
  where b2b_account_id is not null;

-- RLS

alter table public.logistics_b2b_accounts enable row level security;
alter table public.logistics_b2b_admins enable row level security;

drop policy if exists "b2b accounts: service role" on public.logistics_b2b_accounts;
create policy "b2b accounts: service role"
  on public.logistics_b2b_accounts
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "b2b accounts: admin read" on public.logistics_b2b_accounts;
create policy "b2b accounts: admin read"
  on public.logistics_b2b_accounts
  for select
  using (
    exists (
      select 1
      from public.logistics_b2b_admins a
      where a.account_id = logistics_b2b_accounts.id
        and a.user_id = auth.uid()
        and a.active = true
    )
  );

drop policy if exists "b2b accounts: staff" on public.logistics_b2b_accounts;
create policy "b2b accounts: staff"
  on public.logistics_b2b_accounts
  for all
  using (public.is_staff_in('logistics'))
  with check (public.is_staff_in('logistics'));

drop policy if exists "b2b admins: service role" on public.logistics_b2b_admins;
create policy "b2b admins: service role"
  on public.logistics_b2b_admins
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "b2b admins: self read" on public.logistics_b2b_admins;
create policy "b2b admins: self read"
  on public.logistics_b2b_admins
  for select
  using (user_id = auth.uid());

drop policy if exists "b2b admins: staff" on public.logistics_b2b_admins;
create policy "b2b admins: staff"
  on public.logistics_b2b_admins
  for all
  using (public.is_staff_in('logistics'))
  with check (public.is_staff_in('logistics'));

comment on table public.logistics_b2b_accounts is
  'V3 PASS 21 — B2B account container (billing terms, SLA, payment method, '
  'volume target). Logistics shipments may stamp b2b_account_id to aggregate '
  'monthly statements. RLS: admin reads own account; staff full read/write.';

comment on table public.logistics_b2b_admins is
  'V3 PASS 21 — admin membership on a logistics_b2b_account. Multiple admins '
  'per account; primary admin is the one with role = ''primary_admin''. RLS: '
  'self-read own membership rows; staff full read/write.';

-- end of migration --
