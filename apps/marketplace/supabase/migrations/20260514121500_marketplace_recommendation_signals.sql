-- V3 PASS 21 — marketplace recommendation signals
--
-- Co-purchase + co-view signals feed "customers also bought" /
-- "similar items" / "frequently viewed together" rails on the home
-- and product detail pages. The cron `marketplace-automation`
-- recomputes the table nightly from `marketplace_behavior_events`
-- and `marketplace_order_items`.
--
-- A single row represents a directional signal from source_product
-- to related_product with a score. The score is provider-specific
-- but normalized to [0,1] before being persisted. Updates are
-- idempotent on (source_product_id, related_product_id, signal_kind).

create table if not exists public.marketplace_recommendation_signals (
  id uuid primary key default gen_random_uuid(),
  source_product_id uuid not null references public.marketplace_products(id) on delete cascade,
  related_product_id uuid not null references public.marketplace_products(id) on delete cascade,
  signal_kind text not null,
  score double precision not null default 0,
  support_count integer not null default 0,
  last_observed_at timestamptz not null default timezone('utc', now()),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (source_product_id, related_product_id, signal_kind)
);

alter table public.marketplace_recommendation_signals
  drop constraint if exists marketplace_recommendation_signals_kind_check;
alter table public.marketplace_recommendation_signals
  add constraint marketplace_recommendation_signals_kind_check
  check (signal_kind in (
    'co_purchase',
    'co_view',
    'frequently_bought_together',
    'similar_category',
    'similar_attributes',
    'trending_in_region'
  ));

alter table public.marketplace_recommendation_signals
  drop constraint if exists marketplace_recommendation_signals_distinct_check;
alter table public.marketplace_recommendation_signals
  add constraint marketplace_recommendation_signals_distinct_check
  check (source_product_id <> related_product_id);

alter table public.marketplace_recommendation_signals
  drop constraint if exists marketplace_recommendation_signals_score_check;
alter table public.marketplace_recommendation_signals
  add constraint marketplace_recommendation_signals_score_check
  check (score >= 0 and score <= 1);

create index if not exists marketplace_recommendation_signals_source_idx
  on public.marketplace_recommendation_signals (source_product_id, signal_kind, score desc);
create index if not exists marketplace_recommendation_signals_kind_score_idx
  on public.marketplace_recommendation_signals (signal_kind, score desc);

drop trigger if exists marketplace_recommendation_signals_updated_at on public.marketplace_recommendation_signals;
create trigger marketplace_recommendation_signals_updated_at before update on public.marketplace_recommendation_signals
  for each row execute function public.marketplace_set_updated_at();

alter table public.marketplace_recommendation_signals enable row level security;

-- Recommendations are public-readable (filtered through public product RLS in joins).
drop policy if exists marketplace_recommendation_signals_public_read on public.marketplace_recommendation_signals;
create policy marketplace_recommendation_signals_public_read
  on public.marketplace_recommendation_signals
  for select
  using (true);

-- Only operators (or service role) can write.
drop policy if exists marketplace_recommendation_signals_staff_write on public.marketplace_recommendation_signals;
create policy marketplace_recommendation_signals_staff_write
  on public.marketplace_recommendation_signals
  for all
  using (
    exists (
      select 1 from public.marketplace_role_memberships m
      where m.user_id = (select auth.uid())
        and m.is_active = true
        and m.role in ('marketplace_owner','marketplace_admin','operations')
    )
  )
  with check (
    exists (
      select 1 from public.marketplace_role_memberships m
      where m.user_id = (select auth.uid())
        and m.is_active = true
        and m.role in ('marketplace_owner','marketplace_admin','operations')
    )
  );
