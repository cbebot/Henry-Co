-- =============================================================================
-- V2-ADDR-01 — Canonical user_addresses table
-- =============================================================================
-- Replaces scattered address storage (customer_addresses, marketplace_addresses,
-- care_bookings.pickup_address text, logistics ad-hoc) with a single per-user
-- table where each user has at most ONE address per labeled type.
--
-- Invariants enforced:
--   1. UNIQUE (user_id, label) — at most one home, one office, etc. per user.
--   2. Exactly one is_default per user (trigger flips others on insert/update;
--      auto-promotes first row to default; rejects deleting last default).
--   3. Coordinates required when google_place_id is set (geocoded addresses
--      must carry lat/lng).
--   4. RLS: owner reads/writes own; service_role bypasses for backend code;
--      admins (is_staff_in('owner','admin')) read all.
-- =============================================================================

create extension if not exists "uuid-ossp";

-- -----------------------------------------------------------------------------
-- Label vocabulary (extensible — add new labels by extending this enum)
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_address_label') then
    create type public.user_address_label as enum (
      'home',
      'office',
      'shop',
      'warehouse',
      'alternative_1',
      'alternative_2',
      'legacy_imported_1',
      'legacy_imported_2',
      'legacy_imported_3',
      'legacy_imported_4'
    );
  end if;
end
$$;

-- -----------------------------------------------------------------------------
-- Main table
-- -----------------------------------------------------------------------------
create table if not exists public.user_addresses (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  label           public.user_address_label not null,

  -- Contact (per-address — different label can carry different contact)
  full_name       text,
  phone           text,

  -- Postal address
  country         text not null,
  state           text,
  city            text not null,
  street          text not null,
  postal_code     text,

  -- Geocoding (populated by Google Places in A2)
  coordinates_lat numeric(9, 6),
  coordinates_lng numeric(9, 6),
  google_place_id text,

  -- Formatted address as Places returned it (audit + display)
  formatted_address text,

  -- KYC alignment (populated in A3)
  kyc_verified       boolean not null default false,
  kyc_verified_at    timestamptz,
  kyc_match_score    numeric(4, 3) check (kyc_match_score is null or (kyc_match_score >= 0 and kyc_match_score <= 1)),
  kyc_match_method   text check (kyc_match_method is null or kyc_match_method in ('exact', 'fuzzy', 'manual', 'auto')),
  kyc_submission_id  uuid, -- references customer_verification_submissions(id), declared after kyc infra

  -- Default flag (trigger ensures exactly one per user)
  is_default      boolean not null default false,

  -- One-shot flag — true means "use a different address this time" usage that
  -- got persisted by mistake or by an explicit save action; trigger blocks
  -- creating a saved row with is_one_shot=true. Reserved for migration tooling.
  is_one_shot     boolean not null default false,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint user_addresses_unique_label unique (user_id, label),
  constraint user_addresses_geocoding_consistent check (
    -- if google_place_id is set, coords must be set
    (google_place_id is null) or (coordinates_lat is not null and coordinates_lng is not null)
  ),
  constraint user_addresses_no_one_shot_save check (is_one_shot = false),
  constraint user_addresses_minimum_fields check (
    length(coalesce(street, '')) >= 3
    and length(coalesce(city, '')) >= 2
    and length(coalesce(country, '')) >= 2
  )
);

create index if not exists user_addresses_user_id_idx on public.user_addresses (user_id);
create index if not exists user_addresses_default_idx on public.user_addresses (user_id) where is_default = true;
create index if not exists user_addresses_kyc_verified_idx on public.user_addresses (user_id) where kyc_verified = true;
create index if not exists user_addresses_place_idx on public.user_addresses (google_place_id) where google_place_id is not null;

-- -----------------------------------------------------------------------------
-- updated_at trigger
-- -----------------------------------------------------------------------------
create or replace function public.user_addresses_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end
$$;

drop trigger if exists user_addresses_updated_at on public.user_addresses;
create trigger user_addresses_updated_at
  before update on public.user_addresses
  for each row
  execute function public.user_addresses_set_updated_at();

-- -----------------------------------------------------------------------------
-- Default-flip trigger: ensure at most one default per user, auto-promote first
-- row, prevent removing the last default.
-- -----------------------------------------------------------------------------
create or replace function public.user_addresses_enforce_default()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  default_count int;
begin
  if tg_op = 'INSERT' then
    -- If new row claims default, demote others
    if new.is_default then
      update public.user_addresses
         set is_default = false
       where user_id = new.user_id
         and id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid);
    else
      -- If user has zero defaults, auto-promote this row
      select count(*) into default_count
        from public.user_addresses
       where user_id = new.user_id
         and is_default = true;
      if default_count = 0 then
        new.is_default := true;
      end if;
    end if;
    return new;
  end if;

  if tg_op = 'UPDATE' then
    -- If is_default flipped to true, demote others
    if new.is_default and not old.is_default then
      update public.user_addresses
         set is_default = false
       where user_id = new.user_id
         and id <> new.id;
    end if;
    -- If is_default flipped to false, ensure at least one default remains
    if old.is_default and not new.is_default then
      -- Internal demotions happen from this same trigger when another row is
      -- being promoted to default. The promoted row is not visible yet inside
      -- the recursive BEFORE trigger, so allow that controlled path.
      if pg_trigger_depth() > 1 then
        return new;
      end if;

      select count(*) into default_count
        from public.user_addresses
       where user_id = new.user_id
         and is_default = true
         and id <> new.id;
      if default_count = 0 then
        raise exception 'cannot unset is_default on the only default address; set another address as default first';
      end if;
    end if;
    return new;
  end if;

  return new;
end
$$;

drop trigger if exists user_addresses_default_enforce on public.user_addresses;
create trigger user_addresses_default_enforce
  before insert or update of is_default on public.user_addresses
  for each row
  execute function public.user_addresses_enforce_default();

-- After delete: if the deleted row was the default and another address exists,
-- promote the most recently created remaining row to default.
create or replace function public.user_addresses_promote_after_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.is_default then
    update public.user_addresses
       set is_default = true
     where id = (
       select id
         from public.user_addresses
        where user_id = old.user_id
        order by created_at desc
        limit 1
     );
  end if;
  return null;
end
$$;

drop trigger if exists user_addresses_default_promote on public.user_addresses;
create trigger user_addresses_default_promote
  after delete on public.user_addresses
  for each row
  execute function public.user_addresses_promote_after_delete();

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.user_addresses enable row level security;
alter table public.user_addresses force row level security;

-- Owner: full read/write of own rows
drop policy if exists user_addresses_owner_select on public.user_addresses;
create policy user_addresses_owner_select on public.user_addresses
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists user_addresses_owner_insert on public.user_addresses;
create policy user_addresses_owner_insert on public.user_addresses
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists user_addresses_owner_update on public.user_addresses;
create policy user_addresses_owner_update on public.user_addresses
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists user_addresses_owner_delete on public.user_addresses;
create policy user_addresses_owner_delete on public.user_addresses
  for delete
  to authenticated
  using (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- is_platform_staff(): predicate for "is this user a platform-tier admin?"
-- Built on top of is_staff_in() (V2-NOT-02A). Defined here because addresses
-- are the first pass that needs a platform-wide read-all predicate. Future
-- passes (KYC review, audit logs, support escalations) can reuse it.
-- -----------------------------------------------------------------------------
create or replace function public.is_platform_staff()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_result boolean;
begin
  if to_regprocedure('public.is_staff_in(text,text)') is null then
    return false;
  end if;

  execute $platform_staff$
    select
      public.is_staff_in('hub', 'owner')
      or public.is_staff_in('hub', 'admin')
      or public.is_staff_in('hub', 'superadmin')
      or public.is_staff_in('staff', 'owner')
      or public.is_staff_in('staff', 'admin')
      or public.is_staff_in('staff', 'superadmin')
      or public.is_staff_in('account', 'owner')
      or public.is_staff_in('account', 'admin')
      or public.is_staff_in('account', 'superadmin')
      or public.is_staff_in('security', 'owner')
      or public.is_staff_in('security', 'admin')
      or public.is_staff_in('security', 'superadmin')
  $platform_staff$
  into v_result;

  return coalesce(v_result, false);
end
$$;

revoke all on function public.is_platform_staff() from public;
grant execute on function public.is_platform_staff() to authenticated, service_role;

comment on function public.is_platform_staff() is
  'V2-ADDR-01: predicate for platform-tier staff (owner/admin/superadmin in hub/staff/account/security divisions). '
  'Used by RLS on tables that should be readable by org-wide admins but not by per-division operators. '
  'Returns false until the optional is_staff_in(text,text) predicate is installed.';

-- Staff (platform-tier): read all
drop policy if exists user_addresses_staff_select on public.user_addresses;
create policy user_addresses_staff_select on public.user_addresses
  for select
  to authenticated
  using (public.is_platform_staff());

-- service_role bypass (for legacy migration script + cron-driven KYC matcher)
-- Supabase service_role keys bypass RLS by default; no explicit policy needed.

-- -----------------------------------------------------------------------------
-- Helper: get_or_promote_default_address(user_id)
-- Returns the user's default address row, or NULL if none exists.
-- Used by checkout / care booking / logistics quote pages.
-- -----------------------------------------------------------------------------
create or replace function public.get_default_user_address(p_user_id uuid)
returns public.user_addresses
language sql
stable
security definer
set search_path = public
as $$
  select *
    from public.user_addresses
   where user_id = p_user_id
     and is_default = true
   limit 1
$$;

grant execute on function public.get_default_user_address(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- Materialized view-ish helper: user_address_summary
-- Light projection used by the AddressSelector component on the client.
-- Only exposes fields safe to serialize to the browser.
-- -----------------------------------------------------------------------------
create or replace view public.user_address_summary
with (security_invoker = on)
as
  select
    id,
    user_id,
    label,
    full_name,
    phone,
    country,
    state,
    city,
    street,
    postal_code,
    coordinates_lat,
    coordinates_lng,
    formatted_address,
    kyc_verified,
    is_default,
    created_at,
    updated_at
  from public.user_addresses;

grant select on public.user_address_summary to authenticated;

-- -----------------------------------------------------------------------------
-- Comments (documentation in DB)
-- -----------------------------------------------------------------------------
comment on table public.user_addresses is
  'V2-ADDR-01: canonical per-user address book. At most one row per (user, label). Default-flip trigger maintains exactly one is_default. Geocoded via Google Places (A2). KYC-aligned (A3).';
comment on column public.user_addresses.kyc_match_score is
  'Score 0–1 from KYC address-proof matcher. >= 0.85 auto-flips kyc_verified=true; < 0.85 requires manual staff review.';
comment on column public.user_addresses.google_place_id is
  'Google Places place_id. Set means coordinates_lat/lng must also be set (CHECK constraint). Used for cross-app deduplication and map preview.';
comment on column public.user_addresses.is_one_shot is
  'Reserved for migration tooling. CHECK constraint forbids saving with is_one_shot=true; one-shot addresses are passed inline through checkout, never persisted here.';

-- -----------------------------------------------------------------------------
-- Conditional FK to customer_verification_submissions (defensive: skip if
-- table absent — dev environments without the KYC pass bootstrapped).
-- -----------------------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from information_schema.tables
     where table_schema = 'public' and table_name = 'customer_verification_submissions'
  ) and not exists (
    select 1 from information_schema.table_constraints
     where table_schema = 'public'
       and table_name = 'user_addresses'
       and constraint_name = 'user_addresses_kyc_submission_fk'
  ) then
    execute 'alter table public.user_addresses
             add constraint user_addresses_kyc_submission_fk
             foreign key (kyc_submission_id)
             references public.customer_verification_submissions(id)
             on delete set null';
  end if;
end
$$;
