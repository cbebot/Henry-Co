-- =============================================================================
-- V2-CART-01 — Save-for-Later, Comeback UX, Engagement Events
-- =============================================================================
-- Three things land in this migration:
--   1. public.saved_items
--      Cross-division "save for later" with snapshot, 90-day expiry, and
--      30-day soft-delete recovery for items removed from cart.
--   2. public.user_engagement_events
--      Append-only log a future re-engagement worker can consume:
--      cart_abandoned, saved_item_about_to_expire, kyc_incomplete_after_signup,
--      checkout_resumed, saved_item_restored.
--   3. public.cart_recovery_state
--      Per-user resume state: last viewed cart-bearing surface + cart token,
--      so the welcome-back surface knows where to send the user.
--
-- Invariants enforced:
--   * RLS: owner reads/writes own; service_role bypasses; staff readers (any)
--     can audit engagement signals — but never read item_snapshot raw payloads
--     (snapshots are user content, not engagement metadata).
--   * No auto-delete: expired saved items become status='expired' and are
--     hidden from default reads, but kept for 30d for restore.
--   * One emission per (user, event_type, dedupe_key) per day — partial
--     unique index dedupes by event_date so the worker is idempotent.
-- =============================================================================

create extension if not exists "uuid-ossp";

-- -----------------------------------------------------------------------------
-- Division enum (matches existing division shape across the platform).
-- Kept as text + check so it can grow without enum migrations.
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'saved_item_status') then
    create type public.saved_item_status as enum (
      'active',
      'expired',
      'soft_deleted',
      'restored'
    );
  end if;
end
$$;

-- =============================================================================
-- saved_items
-- =============================================================================
create table if not exists public.saved_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  division text not null check (
    division in ('marketplace','care','learn','logistics','property','jobs','studio','account')
  ),
  item_type text not null,
  item_id text not null,
  item_snapshot jsonb not null default '{}'::jsonb,
  source_cart_item_id uuid,
  status public.saved_item_status not null default 'active',
  notes text,
  added_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz not null default (timezone('utc', now()) + interval '90 days'),
  warned_at timestamptz,
  soft_deleted_at timestamptz,
  restored_to_cart_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, division, item_type, item_id)
);

create index if not exists saved_items_user_status_idx
  on public.saved_items(user_id, status, added_at desc);
create index if not exists saved_items_expiry_idx
  on public.saved_items(expires_at)
  where status = 'active';
create index if not exists saved_items_warning_idx
  on public.saved_items(expires_at, warned_at)
  where status = 'active' and warned_at is null;
create index if not exists saved_items_division_idx
  on public.saved_items(user_id, division)
  where status = 'active';

create or replace function public.saved_items_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists saved_items_touch on public.saved_items;
create trigger saved_items_touch
  before update on public.saved_items
  for each row
  execute function public.saved_items_touch_updated_at();

alter table public.saved_items enable row level security;

drop policy if exists saved_items_owner_select on public.saved_items;
create policy saved_items_owner_select
  on public.saved_items
  for select
  using (user_id = auth.uid());

drop policy if exists saved_items_owner_insert on public.saved_items;
create policy saved_items_owner_insert
  on public.saved_items
  for insert
  with check (user_id = auth.uid());

drop policy if exists saved_items_owner_update on public.saved_items;
create policy saved_items_owner_update
  on public.saved_items
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists saved_items_owner_delete on public.saved_items;
create policy saved_items_owner_delete
  on public.saved_items
  for delete
  using (user_id = auth.uid());

grant select, insert, update, delete on public.saved_items to authenticated;
grant all on public.saved_items to service_role;

-- =============================================================================
-- user_engagement_events
-- =============================================================================
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_engagement_event_type') then
    create type public.user_engagement_event_type as enum (
      'cart_abandoned',
      'cart_resumed',
      'saved_item_added',
      'saved_item_about_to_expire',
      'saved_item_restored',
      'saved_item_expired',
      'checkout_started',
      'checkout_resumed',
      'checkout_abandoned_at_step',
      'kyc_incomplete_after_signup',
      'comeback_visit'
    );
  end if;
end
$$;

create table if not exists public.user_engagement_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type public.user_engagement_event_type not null,
  division text,
  subject_type text,
  subject_id text,
  dedupe_key text not null,
  event_date date not null default (timezone('utc', now())::date),
  payload jsonb not null default '{}'::jsonb,
  consumed_at timestamptz,
  consumer text,
  created_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists user_engagement_events_dedupe_idx
  on public.user_engagement_events(user_id, event_type, dedupe_key, event_date);
create index if not exists user_engagement_events_unconsumed_idx
  on public.user_engagement_events(event_type, created_at)
  where consumed_at is null;
create index if not exists user_engagement_events_user_idx
  on public.user_engagement_events(user_id, created_at desc);

alter table public.user_engagement_events enable row level security;

drop policy if exists user_engagement_events_owner_select on public.user_engagement_events;
create policy user_engagement_events_owner_select
  on public.user_engagement_events
  for select
  using (user_id = auth.uid());

-- writes are service_role only (worker, server actions). authenticated cannot
-- forge engagement signals about themselves.
grant select on public.user_engagement_events to authenticated;
grant all on public.user_engagement_events to service_role;

-- =============================================================================
-- cart_recovery_state — last viewed cart surface per user (welcome-back hint)
-- =============================================================================
create table if not exists public.cart_recovery_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  last_division text,
  last_surface text,
  last_cart_token text,
  last_item_count integer not null default 0,
  last_subtotal_kobo bigint not null default 0,
  last_visited_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.cart_recovery_state_touch()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists cart_recovery_state_touch on public.cart_recovery_state;
create trigger cart_recovery_state_touch
  before update on public.cart_recovery_state
  for each row
  execute function public.cart_recovery_state_touch();

alter table public.cart_recovery_state enable row level security;

drop policy if exists cart_recovery_state_owner_select on public.cart_recovery_state;
create policy cart_recovery_state_owner_select
  on public.cart_recovery_state
  for select
  using (user_id = auth.uid());

drop policy if exists cart_recovery_state_owner_upsert on public.cart_recovery_state;
create policy cart_recovery_state_owner_upsert
  on public.cart_recovery_state
  for insert
  with check (user_id = auth.uid());

drop policy if exists cart_recovery_state_owner_update on public.cart_recovery_state;
create policy cart_recovery_state_owner_update
  on public.cart_recovery_state
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

grant select, insert, update on public.cart_recovery_state to authenticated;
grant all on public.cart_recovery_state to service_role;

-- =============================================================================
-- recently_viewed_unified — cross-division recently-viewed for comeback UX
-- (marketplace already has marketplace_recently_viewed; this is the catch-all
-- for surfaces that don't have their own table — care, learn, logistics, etc.)
-- =============================================================================
create table if not exists public.recently_viewed_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  division text not null,
  item_type text not null,
  item_id text not null,
  title text,
  href text,
  image_url text,
  last_viewed_at timestamptz not null default timezone('utc', now()),
  view_count integer not null default 1,
  unique (user_id, division, item_type, item_id)
);

create index if not exists recently_viewed_items_user_recent_idx
  on public.recently_viewed_items(user_id, last_viewed_at desc);
create index if not exists recently_viewed_items_user_division_idx
  on public.recently_viewed_items(user_id, division, last_viewed_at desc);

alter table public.recently_viewed_items enable row level security;

drop policy if exists recently_viewed_items_owner_select on public.recently_viewed_items;
create policy recently_viewed_items_owner_select
  on public.recently_viewed_items
  for select
  using (user_id = auth.uid());

drop policy if exists recently_viewed_items_owner_upsert on public.recently_viewed_items;
create policy recently_viewed_items_owner_upsert
  on public.recently_viewed_items
  for insert
  with check (user_id = auth.uid());

drop policy if exists recently_viewed_items_owner_update on public.recently_viewed_items;
create policy recently_viewed_items_owner_update
  on public.recently_viewed_items
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists recently_viewed_items_owner_delete on public.recently_viewed_items;
create policy recently_viewed_items_owner_delete
  on public.recently_viewed_items
  for delete
  using (user_id = auth.uid());

grant select, insert, update, delete on public.recently_viewed_items to authenticated;
grant all on public.recently_viewed_items to service_role;

-- =============================================================================
-- expiry sweep helper (called by cron / future worker — safe to call any time)
-- =============================================================================
create or replace function public.saved_items_sweep_expiry()
returns table(expired_count integer, warned_count integer)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_warned integer := 0;
  v_expired integer := 0;
begin
  -- 7-day pre-expiry warning emission (idempotent via dedupe_key)
  with to_warn as (
    select id, user_id, division, item_type, item_id, expires_at
    from public.saved_items
    where status = 'active'
      and warned_at is null
      and expires_at <= timezone('utc', now()) + interval '7 days'
      and expires_at >  timezone('utc', now())
  ), inserted as (
    insert into public.user_engagement_events
      (user_id, event_type, division, subject_type, subject_id, dedupe_key, payload)
    select
      user_id,
      'saved_item_about_to_expire'::public.user_engagement_event_type,
      division,
      item_type,
      item_id,
      'saved:' || id::text,
      jsonb_build_object('saved_item_id', id, 'expires_at', expires_at)
    from to_warn
    on conflict (user_id, event_type, dedupe_key, event_date) do nothing
    returning 1
  ), marked as (
    update public.saved_items
       set warned_at = timezone('utc', now())
     where id in (select id from to_warn)
    returning 1
  )
  select count(*) into v_warned from marked;

  -- expire past-due active items (soft — they go to status='expired')
  with to_expire as (
    update public.saved_items
       set status = 'expired'
     where status = 'active'
       and expires_at <= timezone('utc', now())
    returning id, user_id, division, item_type, item_id
  ), recorded as (
    insert into public.user_engagement_events
      (user_id, event_type, division, subject_type, subject_id, dedupe_key, payload)
    select
      user_id,
      'saved_item_expired'::public.user_engagement_event_type,
      division,
      item_type,
      item_id,
      'expired:' || id::text,
      jsonb_build_object('saved_item_id', id)
    from to_expire
    on conflict (user_id, event_type, dedupe_key, event_date) do nothing
    returning 1
  )
  select count(*) into v_expired from to_expire;

  return query select v_expired, v_warned;
end;
$$;

revoke all on function public.saved_items_sweep_expiry() from public;
grant execute on function public.saved_items_sweep_expiry() to service_role;
