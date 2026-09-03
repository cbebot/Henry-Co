-- V3-MONEY-PAYOUT — minimal prerequisites so the payout-rail invariants run in the vanilla-PG CI
-- money chain (which has the ledger + post_ledger_entry, but not the account app's wallet tables).
-- Creates the two tables the payout RPCs touch, with the SAME balance-nonneg guard prod carries,
-- so the proof exercises the real invariant. Seeds nothing — the invariant test seeds its own data.

\set ON_ERROR_STOP on

create table if not exists public.customer_wallets (
  user_id uuid primary key,
  balance_kobo bigint not null default 0,
  updated_at timestamptz not null default now()
);
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'customer_wallets_balance_nonneg') then
    alter table public.customer_wallets add constraint customer_wallets_balance_nonneg check (balance_kobo >= 0);
  end if;
end $$;

create table if not exists public.customer_wallet_withdrawal_requests (
  id uuid primary key,
  user_id uuid not null,
  amount_kobo bigint not null check (amount_kobo > 0),
  currency text not null default 'NGN',
  status text not null default 'pending_review',
  metadata jsonb not null default '{}'::jsonb
);

select 'PAYOUT RAIL PREREQS ready (customer_wallets + withdrawal_requests)' as result;
