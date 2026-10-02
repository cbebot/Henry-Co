-- V3-MKT-TRUST-01 CI SEED — the marketplace tables the instant-publish migration
-- hangs its guard on.
--
-- The CI chain database is a vanilla Postgres. Of the marketplace schema it only
-- carries marketplace_role_memberships (membership_min.sql). The migration under
-- test installs triggers on marketplace_products / marketplace_product_media /
-- marketplace_payout_requests and reads vendors, applications, order groups and the
-- shared identity tables, so those must exist first.
--
-- Every statement is IF NOT EXISTS: on a production-shaped database (where the real
-- tables already exist) this file changes nothing. Column sets are the subset of
-- production the migration and its proofs touch — names and types mirror
-- supabase/prod-actual/schema.sql exactly.
--
-- Run BEFORE 20261002120000_v3_mkt_trust_01_instant_publish.sql.

create table if not exists public.marketplace_vendors (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  owner_user_id uuid,
  owner_type text not null default 'vendor',
  status text not null default 'pending',
  verification_level text not null default 'bronze',
  trust_score numeric not null default 0,
  response_sla_hours integer not null default 24,
  fulfillment_rate numeric not null default 0,
  dispute_rate numeric not null default 0,
  review_score numeric not null default 0,
  followers_count integer not null default 0,
  badges text[] not null default '{}'::text[],
  support_email text,
  support_phone text,
  seller_tier text not null default 'launch',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.marketplace_products (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid references public.marketplace_vendors (id) on delete set null,
  category_id uuid,
  brand_id uuid,
  slug text not null unique,
  title text not null,
  summary text,
  description text,
  inventory_owner_type text not null default 'vendor',
  base_price integer not null default 0,
  compare_at_price integer,
  currency text not null default 'NGN',
  total_stock integer not null default 0,
  sku text not null,
  rating numeric not null default 0,
  review_count integer not null default 0,
  featured boolean not null default false,
  approval_status text not null default 'draft',
  status text not null default 'active',
  trust_badges text[] not null default '{}'::text[],
  filter_data jsonb not null default '{}'::jsonb,
  specifications jsonb not null default '{}'::jsonb,
  delivery_note text,
  lead_time text,
  cod_eligible boolean not null default false,
  moderation_note text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.marketplace_product_media (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.marketplace_products (id) on delete cascade,
  variant_id uuid,
  kind text not null default 'image',
  url text not null,
  public_id text,
  is_primary boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.marketplace_vendor_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  normalized_email text,
  store_name text not null,
  proposed_store_slug text not null,
  legal_name text not null,
  contact_phone text,
  category_focus text,
  story text,
  status text not null default 'draft',
  review_note text,
  reviewed_by uuid,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  agreement_accepted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.marketplace_orders (
  id uuid primary key default gen_random_uuid(),
  order_no text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.marketplace_order_groups (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.marketplace_orders (id) on delete cascade,
  order_no text not null,
  vendor_id uuid references public.marketplace_vendors (id) on delete set null,
  fulfillment_status text,
  payout_status text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.marketplace_payout_requests (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  vendor_id uuid references public.marketplace_vendors (id) on delete cascade,
  amount integer not null default 0,
  status text not null default 'requested',
  requested_by uuid,
  reviewed_by uuid,
  review_note text,
  reviewed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.customer_profiles (
  id uuid primary key,
  email text,
  verification_status text default 'none'
);
alter table public.customer_profiles add column if not exists verification_status text default 'none';

create table if not exists public.customer_verification_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  document_type text not null,
  status text default 'pending',
  reviewer_id uuid,
  created_at timestamptz not null default timezone('utc', now())
);

-- The plan-tier cap helper the seller-state RPC reports (production body).
do $$ begin
  if to_regprocedure('public.marketplace_tier_listing_cap(text)') is null then
    create function public.marketplace_tier_listing_cap(p_tier text)
    returns integer language sql immutable set search_path = public, pg_catalog
    as $fn$
      select case lower(p_tier)
        when 'launch'  then 3
        when 'growth'  then 20
        when 'scale'   then 999
        when 'partner' then 9999
        else 3
      end;
    $fn$;
  end if;
end $$;

-- Production posture of the catalogue tables: RLS on, one public SELECT policy on
-- products (approved only), no write policy. The behaviour proofs open a write
-- policy on purpose to show the guard still holds when RLS does not.
alter table public.marketplace_products       enable row level security;
alter table public.marketplace_product_media  enable row level security;
alter table public.marketplace_payout_requests enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'marketplace_products' and policyname = 'marketplace_public_products'
  ) then
    create policy marketplace_public_products on public.marketplace_products
      for select using (approval_status = 'approved');
  end if;
end $$;

-- The standing production grants (broad, inert for writes because no write policy
-- exists). Reproduced so the proofs run under the real condition.
grant select, insert, update, delete on table
  public.marketplace_products, public.marketplace_product_media
  to anon, authenticated, service_role;
grant select, insert, update, delete on table
  public.marketplace_vendors, public.marketplace_vendor_applications, public.marketplace_orders,
  public.marketplace_order_groups, public.marketplace_payout_requests, public.customer_profiles,
  public.customer_verification_submissions, public.marketplace_role_memberships
  to service_role;

select 'v3-mkt-trust-01 seed ready' as status;
