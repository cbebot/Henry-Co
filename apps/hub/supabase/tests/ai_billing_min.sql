-- V3-AI-01 — minimal prerequisite surface for the CI invariant chain.
--
-- The CI bootstrap (_bootstrap_supabase_env.sql) already creates faithful
-- customer_wallets + customer_wallet_transactions stubs and the Supabase default
-- privileges. This fixture adds the two pieces the V3-AI-01 migration also needs that
-- the prior FL2 chain doesn't create on the vanilla CI DB:
--   * pricing_rule_books (the governed rate-card table, normally from shared_pricing_governance)
--   * the customer_wallet_transactions.division column (present in prod via the
--     multi-currency migration; the CI stub omits it)
-- Run AFTER the ledger migration and BEFORE the V3-AI-01 migration.

create table if not exists public.pricing_rule_books (
  id uuid primary key default gen_random_uuid(),
  rule_book_key text not null unique,
  label text not null,
  description text,
  division text not null default 'shared',
  currency text not null default 'NGN',
  status text not null default 'active',
  version text not null,
  rules jsonb not null default '{}'::jsonb,
  effective_from timestamptz not null default timezone('utc', now()),
  effective_to timestamptz,
  created_by uuid,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.customer_wallet_transactions add column if not exists division text;
