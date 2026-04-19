-- Multi-currency foundation: additive schema pass.
-- Adds settlement_currency, display_currency, exchange_rate context columns
-- and a currency_snapshot JSONB column to key financial tables.
-- All columns use safe defaults so existing rows are not affected.
-- No existing columns are modified or removed.

-- -------------------------------------------------------------------------
-- marketplace_orders: add currency snapshot context
-- -------------------------------------------------------------------------
alter table if exists public.marketplace_orders
  add column if not exists display_currency         text not null default 'NGN',
  add column if not exists settlement_currency      text not null default 'NGN',
  add column if not exists exchange_rate            numeric(20,8) not null default 1,
  add column if not exists exchange_rate_source     text not null default 'none',
  add column if not exists exchange_rate_at         timestamptz,
  add column if not exists currency_snapshot        jsonb not null default '{}'::jsonb;

-- -------------------------------------------------------------------------
-- customer_wallet_funding_requests: settlement_currency context
-- -------------------------------------------------------------------------
alter table if exists public.customer_wallet_funding_requests
  add column if not exists settlement_currency      text not null default 'NGN',
  add column if not exists display_currency         text not null default 'NGN',
  add column if not exists currency_snapshot        jsonb not null default '{}'::jsonb;

-- -------------------------------------------------------------------------
-- customer_wallet_withdrawal_requests: settlement_currency context
-- -------------------------------------------------------------------------
alter table if exists public.customer_wallet_withdrawal_requests
  add column if not exists settlement_currency      text not null default 'NGN',
  add column if not exists display_currency         text not null default 'NGN',
  add column if not exists currency_snapshot        jsonb not null default '{}'::jsonb;

-- -------------------------------------------------------------------------
-- customer_wallet_transactions: settlement context
-- -------------------------------------------------------------------------
alter table if exists public.customer_wallet_transactions
  add column if not exists settlement_currency      text not null default 'NGN',
  add column if not exists display_currency         text not null default 'NGN',
  add column if not exists is_approximate_display   boolean not null default false,
  add column if not exists exchange_rate            numeric(20,8) not null default 1,
  add column if not exists exchange_rate_source     text not null default 'none',
  add column if not exists exchange_rate_at         timestamptz;

-- -------------------------------------------------------------------------
-- pricing_quotes: settlement + rate snapshot
-- -------------------------------------------------------------------------
alter table if exists public.pricing_quotes
  add column if not exists display_currency         text not null default 'NGN',
  add column if not exists settlement_currency      text not null default 'NGN',
  add column if not exists exchange_rate            numeric(20,8) not null default 1,
  add column if not exists exchange_rate_source     text not null default 'none',
  add column if not exists exchange_rate_at         timestamptz,
  add column if not exists is_approximate_display   boolean not null default false;

-- -------------------------------------------------------------------------
-- logistics_bookings: currency context (route pricing is deferred but the
-- booked amount must carry its currency)
-- -------------------------------------------------------------------------
alter table if exists public.logistics_bookings
  add column if not exists display_currency         text not null default 'NGN',
  add column if not exists settlement_currency      text not null default 'NGN';

-- -------------------------------------------------------------------------
-- comment: settlement_currency column semantics
-- All tables above: settlement_currency records which currency funds actually
-- settle in. Today this is always 'NGN'. When a division gains live
-- settlement support on another rail, update the row-level value.
-- display_currency records what the user saw on screen — may differ from
-- settlement_currency. is_approximate_display = true means the displayed
-- amount was an FX estimate and cannot be relied upon for settlement.
-- -------------------------------------------------------------------------
