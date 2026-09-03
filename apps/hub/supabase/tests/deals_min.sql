-- V3-35 CI FIDELITY SEED — make the migration's table-grant REVOKES load-bearing
-- and give the curation reconciliation real rows to move.
--
-- _bootstrap_supabase_env.sql reproduces Supabase's standing default privileges
-- only for FUNCTIONS, not TABLES. So on vanilla CI Postgres a freshly created
-- table carries no request-role grants and the migration's revokes would be
-- no-ops — the grant invariant would false-green. Run this BEFORE the V3-35
-- migration:
--   1. Pre-create deals + deal_impressions (the migration's create-if-not-
--      exists then no-ops) and grant the broad request-role ACL Supabase
--      auto-grants at table creation on prod. The migration's revokes then
--      genuinely strip it. Mirrors personalization_min.sql.
--   2. Create + seed marketplace_deals_curation (applied-on-prod table) so the
--      in-migration reconciliation is CI-proven: one live row (must migrate as
--      an active spotlight) and one inactive row (must migrate as expired).
-- Schema MUST stay identical to the migration's tables.

create extension if not exists pgcrypto;

create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  creator_partner_id uuid,
  created_by uuid references auth.users (id) on delete set null,
  source text not null default 'platform'
    check (source in ('platform', 'partner', 'curation_migration')),
  title text not null,
  description text,
  deal_type text not null
    check (deal_type in ('percent_off', 'fixed_off', 'bogo', 'bundle', 'spotlight')),
  discount_percent integer
    check (discount_percent between 1 and 100),
  discount_minor bigint
    check (discount_minor > 0),
  discount_currency text
    check (discount_currency ~ '^[A-Z]{3}$'),
  scope_division text,
  scope_categories text[] not null default '{}',
  target_ref text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'draft'
    check (status in ('draft', 'pending_review', 'approved', 'active', 'paused', 'expired', 'rejected')),
  visibility text not null default 'public'
    check (visibility in ('public', 'targeted', 'unlisted')),
  audience_signals jsonb not null default '{}'::jsonb,
  approved_by uuid references auth.users (id) on delete set null,
  approved_at timestamptz,
  legacy_curation_id uuid unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint deals_window_valid check (ends_at > starts_at),
  constraint deals_percent_shape check (
    (deal_type = 'percent_off' and discount_percent is not null)
    or (deal_type <> 'percent_off' and discount_percent is null)
  ),
  constraint deals_fixed_shape check (
    (deal_type = 'fixed_off' and discount_minor is not null and discount_currency is not null)
    or (deal_type <> 'fixed_off' and discount_minor is null and discount_currency is null)
  )
);

create table if not exists public.deal_impressions (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.deals (id) on delete cascade,
  user_id uuid references auth.users (id) on delete cascade,
  surface text not null
    check (surface in ('home_module', 'all_deals', 'division_mini')),
  shown_at timestamptz not null default now()
);

-- The prod standing ACL Supabase grants request roles on new public tables.
grant all on public.deals to anon, authenticated, service_role;
grant all on public.deal_impressions to anon, authenticated, service_role;

-- Applied-on-prod curation table (schema from
-- apps/marketplace/supabase/migrations/20260501010000_marketplace_deals_curation.sql)
-- + two fixture rows for the reconciliation proof.
create table if not exists public.marketplace_deals_curation (
  id uuid primary key default gen_random_uuid(),
  product_slug text not null,
  slot text not null default 'rotation',
  starts_at timestamptz not null default timezone('utc', now()),
  ends_at timestamptz,
  curator_user_id uuid,
  note text,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

insert into public.marketplace_deals_curation
  (id, product_slug, slot, starts_at, ends_at, note, active, sort_order)
values
  ('c0000000-0000-0000-0000-000000000001', 'test-live-pick', 'today',
   now() - interval '1 day', now() + interval '7 days', 'live fixture', true, 0),
  ('c0000000-0000-0000-0000-000000000002', 'test-retired-pick', 'rotation',
   now() - interval '30 days', now() - interval '10 days', 'retired fixture', false, 1)
on conflict (id) do nothing;
