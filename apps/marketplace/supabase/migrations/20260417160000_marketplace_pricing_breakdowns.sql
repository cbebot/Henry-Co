-- Marketplace pricing truth: persist checkout fee breakdown snapshots.
-- This migration is additive and safe to run on existing data.

alter table if exists public.marketplace_orders
  add column if not exists platform_fee_total integer not null default 0,
  add column if not exists pricing_breakdown jsonb not null default '{}'::jsonb;

