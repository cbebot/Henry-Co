-- =============================================================================
-- V3-MKT-TRUST-01 — instant publish: verdict ledger, publish guard, probation,
-- reversible hides, image fingerprints, payout identity guard.
-- =============================================================================
-- COMMITTED, NOT APPLIED. Apply with the marketplace chain on the activation day
-- (docs/v3/marketplace-trust/ACTIVATION.md). Safe to apply with the flag
-- MARKETPLACE_INSTANT_PUBLISH still OFF: every flow that exists today keeps
-- working, because sellers only ever write draft / submitted / under_review and
-- the human approval paths already stamp reviewed_by + reviewed_at.
--
-- THE INVARIANT this file installs:
--
--   A marketplace listing cannot BECOME live (approval_status = 'approved'), and
--   the buyer-visible content of a live listing cannot CHANGE, unless a gate
--   verdict is on record for exactly that content.
--
-- It holds for every role. Service-role is the role that matters: every
-- marketplace write is a service-role write, so RLS is not a backstop here and a
-- "trusted because it bypasses RLS" rule would trust the very writer being
-- guarded. A verdict is one of:
--
--   (A) ENGINE   — a `publish` row in marketplace_listing_gate_verdicts, minted
--                  only by marketplace_gate_record_listing_verdict(), bound to
--                  slug + vendor + content hash, unexpired and unconsumed;
--   (B) STAFF    — a status-only change by a trusted role whose reviewed_by is an
--                  active marketplace staff member and whose reviewed_at is newly
--                  stamped (the existing human approval paths, unchanged);
--   (C) COMPANY  — company-owned inventory written by a trusted role (the
--                  catalogue bootstrap).
--
-- (B) and (C) are recorded into the same ledger by the AFTER trigger, so every
-- live listing has a row saying who or what let it through.
--
-- No money object is touched: nothing in payments_private, none of the money
-- RPCs. The payout trigger at the end can only REFUSE a request.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Content hash — ONE implementation, used by the RPC that mints a verdict and
--    by the trigger that checks it, so the two sides cannot drift.
--    Covers every buyer-visible field a seller controls. Excluded on purpose:
--    stock, rating, review_count, featured, review/audit columns, timestamps and
--    the paid "Henry Onyx Verified" flag (it has its own guarded writer).
--    A new buyer-visible column MUST be added here.
-- ---------------------------------------------------------------------------
create or replace function public.marketplace_listing_content_hash(p public.marketplace_products)
returns text
language sql
immutable
set search_path = public, pg_temp
as $$
  select encode(sha256(convert_to(jsonb_build_object(
    'slug',                 coalesce(p.slug, ''),
    'vendor_id',            coalesce(p.vendor_id::text, ''),
    'category_id',          coalesce(p.category_id::text, ''),
    'brand_id',             coalesce(p.brand_id::text, ''),
    'title',                coalesce(p.title, ''),
    'summary',              coalesce(p.summary, ''),
    'description',          coalesce(p.description, ''),
    'base_price',           coalesce(p.base_price, 0),
    'compare_at_price',     coalesce(p.compare_at_price, 0),
    'currency',             coalesce(p.currency, 'NGN'),
    'sku',                  coalesce(p.sku, ''),
    'delivery_note',        coalesce(p.delivery_note, ''),
    'lead_time',            coalesce(p.lead_time, ''),
    'cod_eligible',         coalesce(p.cod_eligible, false),
    'inventory_owner_type', coalesce(p.inventory_owner_type, 'vendor'),
    'specifications',       coalesce(p.specifications, '{}'::jsonb),
    'trust_badges',         to_jsonb(coalesce(p.trust_badges, '{}'::text[])),
    'filter_data',          coalesce(p.filter_data, '{}'::jsonb)
  )::text, 'UTF8')), 'hex');
$$;

-- ---------------------------------------------------------------------------
-- 2. Tables. RLS on, NO policies, no grants to request roles. service_role may
--    READ (dashboards, the backfill) but holds no INSERT/UPDATE/DELETE: the only
--    writers are the SECURITY DEFINER functions below. A route that tries to
--    insert a verdict directly gets "permission denied".
-- ---------------------------------------------------------------------------
create table if not exists public.marketplace_listing_gate_verdicts (
  id uuid primary key default gen_random_uuid(),
  subject_type text not null default 'listing'
    check (subject_type in ('listing', 'seller')),
  -- No FK: the ledger is evidence and must outlive the row it describes.
  product_id uuid,
  vendor_id uuid,
  slug text not null,
  content_hash text not null,
  media_refs text[] not null default '{}'::text[],
  outcome text not null check (outcome in ('publish', 'hold', 'reject')),
  source text not null
    check (source in ('policy_engine', 'backfill', 'rescan', 'staff_review', 'platform_catalog', 'pre_guard_backfill')),
  reasons text[] not null default '{}'::text[],
  signals jsonb not null default '{}'::jsonb,
  engine_version text not null default 'unknown',
  actor_user_id uuid,
  -- 'go_live' | 'live_edit', stamped when a publish verdict is consumed.
  transition text check (transition is null or transition in ('go_live', 'live_edit')),
  created_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz,
  consumed_at timestamptz
);

create index if not exists marketplace_listing_gate_verdicts_pending_idx
  on public.marketplace_listing_gate_verdicts (slug, content_hash, created_at desc)
  where outcome = 'publish' and consumed_at is null;
create index if not exists marketplace_listing_gate_verdicts_standing_idx
  on public.marketplace_listing_gate_verdicts (product_id, consumed_at desc)
  where outcome = 'publish' and consumed_at is not null;
create index if not exists marketplace_listing_gate_verdicts_vendor_idx
  on public.marketplace_listing_gate_verdicts (vendor_id, created_at desc);
create index if not exists marketplace_listing_gate_verdicts_recent_idx
  on public.marketplace_listing_gate_verdicts (created_at desc);

create table if not exists public.marketplace_seller_probation (
  vendor_id uuid primary key references public.marketplace_vendors (id) on delete cascade,
  owner_user_id uuid not null,
  source text not null default 'instant_onboarding'
    check (source in ('instant_onboarding')),
  onboarding_verdict_id uuid,
  started_at timestamptz not null default timezone('utc', now()),
  graduated_at timestamptz,
  graduated_reason text
);

create table if not exists public.marketplace_listing_enforcement (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null,
  vendor_id uuid,
  -- policy  : a deterministic rule found a violation on a live listing
  -- reports : distinct-reporter threshold reached
  -- risk    : mirrors a STAFF-applied V3-40 hold/freeze on the listing
  kind text not null check (kind in ('policy', 'reports', 'risk')),
  status text not null default 'active' check (status in ('active', 'lifted', 'upheld')),
  reasons text[] not null default '{}'::text[],
  evidence jsonb not null default '{}'::jsonb,
  prior_status text not null default 'approved',
  engine_version text not null default 'unknown',
  created_at timestamptz not null default timezone('utc', now()),
  resolved_at timestamptz,
  resolved_by uuid,
  resolution text
    check (resolution is null or resolution in ('restored_by_staff', 'cleared_by_gate', 'upheld_by_staff'))
);

-- At most one open hide per listing — makes the hide RPC idempotent.
create unique index if not exists marketplace_listing_enforcement_one_active
  on public.marketplace_listing_enforcement (product_id)
  where status = 'active';
create index if not exists marketplace_listing_enforcement_vendor_idx
  on public.marketplace_listing_enforcement (vendor_id, created_at desc);

create table if not exists public.marketplace_image_fingerprints (
  -- Canonical first-party media reference (media://public/marketplace-images/...).
  ref text primary key,
  sha256 text not null,
  -- 64-bit difference hash; null when the bytes could not be decoded.
  phash bigint,
  bytes bigint,
  uploader_user_id uuid,
  vendor_id uuid,
  -- Wall-clock, not transaction time: "who had this picture first" is decided on
  -- this column, so two registrations in one transaction must still order.
  created_at timestamptz not null default clock_timestamp()
);

create index if not exists marketplace_image_fingerprints_sha_idx
  on public.marketplace_image_fingerprints (sha256);
create index if not exists marketplace_image_fingerprints_vendor_idx
  on public.marketplace_image_fingerprints (vendor_id);

alter table public.marketplace_listing_gate_verdicts enable row level security;
alter table public.marketplace_seller_probation      enable row level security;
alter table public.marketplace_listing_enforcement   enable row level security;
alter table public.marketplace_image_fingerprints    enable row level security;

revoke all on public.marketplace_listing_gate_verdicts from public, anon, authenticated, service_role;
revoke all on public.marketplace_seller_probation      from public, anon, authenticated, service_role;
revoke all on public.marketplace_listing_enforcement   from public, anon, authenticated, service_role;
revoke all on public.marketplace_image_fingerprints    from public, anon, authenticated, service_role;

grant select on public.marketplace_listing_gate_verdicts to service_role;
grant select on public.marketplace_seller_probation      to service_role;
grant select on public.marketplace_listing_enforcement   to service_role;
grant select on public.marketplace_image_fingerprints    to service_role;

-- ---------------------------------------------------------------------------
-- 3. Predicates.
-- ---------------------------------------------------------------------------

-- Probation policy — the single numeric source of truth. TS reads these from
-- marketplace_gate_seller_state(); it never hardcodes them.
create or replace function public.marketplace_gate_probation_caps()
returns jsonb
language sql
immutable
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'max_live_listings', 10,
    'max_new_listings_per_day', 5,
    'max_price', 500000,
    'graduation_min_delivered_orders', 3,
    'graduation_min_days', 14
  );
$$;

-- Active marketplace staff. Anchored on marketplace_role_memberships ALONE: it has
-- a SELECT-only policy and no write grant to request roles, so it cannot be
-- self-granted. profiles.role and owner_profiles are deliberately NOT consulted —
-- both are self-writable on production today.
create or replace function public.marketplace_gate_is_staff(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p_user is not null and exists (
    select 1
    from public.marketplace_role_memberships m
    where m.user_id = p_user
      and m.is_active = true
      and m.scope_type = 'platform'
      and m.role in ('marketplace_owner', 'marketplace_admin', 'moderation')
  );
$$;

-- May this actor act for this vendor? A member of the vendor, or platform staff
-- allowed to write listings on a seller's behalf.
create or replace function public.marketplace_gate_actor_may_act_for(p_actor uuid, p_vendor_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p_actor is not null and p_vendor_id is not null and exists (
    select 1
    from public.marketplace_role_memberships m
    where m.user_id = p_actor
      and m.is_active = true
      and (
        (m.scope_type = 'vendor' and m.scope_id = p_vendor_id and m.role = 'vendor')
        or (m.scope_type = 'platform' and m.role in ('marketplace_owner', 'marketplace_admin'))
      )
  );
$$;

-- Identity verified, for the payout gate. customer_profiles.verification_status
-- alone is NOT trusted: the table's own-row UPDATE policy lets a user write that
-- column on production today. A staff-reviewed submission is required as well —
-- customer_verification_submissions is writable by service-role only. The rule
-- mirrors the three KYC review writers (account, staff, hub): a profile becomes
-- `verified` when a `government_id` or `selfie` submission is approved by a
-- reviewer.
create or replace function public.marketplace_gate_identity_verified(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p_user is not null
    and exists (
      select 1 from public.customer_profiles cp
      where cp.id = p_user and lower(coalesce(cp.verification_status, 'none')) = 'verified'
    )
    and exists (
      select 1 from public.customer_verification_submissions s
      where s.user_id = p_user
        and lower(coalesce(s.status, '')) = 'approved'
        and s.document_type in ('government_id', 'selfie')
        and s.reviewer_id is not null
    );
$$;

-- Who is really performing this write? Inside a SECURITY DEFINER function
-- current_user is the function owner, so it says nothing about the caller.
-- PostgREST switches role with SET LOCAL ROLE, which the `role` setting reflects
-- and which a SECURITY DEFINER body cannot change. A direct connection (SQL
-- editor, migration) has role = 'none' and is identified by session_user.
-- Trusted = may bypass RLS: service_role and the platform's own roles; never
-- anon or authenticated.
create or replace function public.marketplace_gate_caller_is_trusted()
returns boolean
language sql
stable
set search_path = public, pg_temp
as $$
  select coalesce((
    select r.rolsuper or r.rolbypassrls
    from pg_catalog.pg_roles r
    where r.rolname = case
      when coalesce(nullif(current_setting('role', true), ''), 'none') = 'none' then session_user::text
      else current_setting('role', true)
    end
  ), false);
$$;

create or replace function public.marketplace_gate_is_company_vendor(p_vendor_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p_vendor_id is not null and exists (
    select 1 from public.marketplace_vendors v
    where v.id = p_vendor_id and v.owner_type = 'company'
  );
$$;

create or replace function public.marketplace_gate_probation_active(p_vendor_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p_vendor_id is not null and exists (
    select 1 from public.marketplace_seller_probation p
    where p.vendor_id = p_vendor_id and p.graduated_at is null
  );
$$;

-- ---------------------------------------------------------------------------
-- 4. THE GUARD — BEFORE INSERT OR UPDATE on marketplace_products.
--    Validates only. Consumption / recording happens in the AFTER trigger,
--    because INSERT ... ON CONFLICT DO UPDATE fires BEFORE INSERT for the proposed
--    row even when the statement ends as an UPDATE: a BEFORE trigger that
--    consumed the verdict would starve the BEFORE UPDATE that follows.
-- ---------------------------------------------------------------------------
create or replace function public.marketplace_products_publish_guard()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_hash text;
  v_old_hash text;
  v_was_live boolean := false;
  v_trusted boolean;
  v_verdict_id uuid;
  v_media text[];
  v_caps jsonb;
  v_count integer;
  v_human_hold boolean := false;
begin
  -- 1. Not live after this write: unconstrained.
  if new.approval_status is distinct from 'approved' then
    return new;
  end if;

  v_hash := public.marketplace_listing_content_hash(new);

  -- 2. Already live, content untouched (stock, rating, badge flag, featured).
  if tg_op = 'UPDATE' then
    v_was_live := (old.approval_status = 'approved');
    v_old_hash := public.marketplace_listing_content_hash(old);
    if v_was_live and v_old_hash = v_hash then
      return new;
    end if;
  end if;

  v_trusted := public.marketplace_gate_caller_is_trusted();

  -- Serialise live transitions per vendor: makes the cap counts below exact and
  -- keeps two writers from racing on one verdict.
  perform pg_advisory_xact_lock(
    hashtextextended('marketplace_publish_guard:' || coalesce(new.vendor_id::text, 'no-vendor'), 0)
  );

  -- (A) ENGINE verdict for exactly this slug, vendor and content.
  select v.id, v.media_refs
    into v_verdict_id, v_media
    from public.marketplace_listing_gate_verdicts v
   where v.subject_type = 'listing'
     and v.outcome = 'publish'
     and v.source in ('policy_engine', 'backfill')
     and v.slug = new.slug
     and v.vendor_id is not distinct from new.vendor_id
     and v.content_hash = v_hash
     and v.consumed_at is null
     and v.expires_at is not null
     and v.expires_at > timezone('utc', now())
   order by v.created_at desc
   limit 1
   for update;

  -- A hide that needs a human cannot be lifted by an engine verdict: while one is
  -- open the engine verdict is simply not usable, and only (B) can publish.
  v_human_hold := exists (
    select 1 from public.marketplace_listing_enforcement e
    where e.product_id = new.id and e.status = 'active' and e.kind <> 'policy'
  );

  if v_verdict_id is not null and not v_human_hold then
    -- Going live: every image already attached must be one the verdict covers.
    if tg_op = 'UPDATE' and not v_was_live and exists (
      select 1 from public.marketplace_product_media m
      where m.product_id = new.id and not (m.url = any (v_media))
    ) then
      raise exception 'marketplace_publish_guard: listing "%" carries media the verdict does not cover', new.slug
        using errcode = 'P0001', hint = 'media_not_covered';
    end if;

    -- Probation caps, re-checked at the moment of going live.
    if public.marketplace_gate_probation_active(new.vendor_id) then
      v_caps := public.marketplace_gate_probation_caps();
      if coalesce(new.base_price, 0) > (v_caps ->> 'max_price')::integer then
        raise exception 'marketplace_publish_guard: price exceeds the probation ceiling'
          using errcode = 'P0001', hint = 'probation_price_cap';
      end if;
      if not v_was_live then
        select count(*) into v_count
          from public.marketplace_products p
         where p.vendor_id = new.vendor_id and p.approval_status = 'approved' and p.id <> new.id;
        if v_count >= (v_caps ->> 'max_live_listings')::integer then
          raise exception 'marketplace_publish_guard: probation live-listing cap reached'
            using errcode = 'P0001', hint = 'probation_listing_cap';
        end if;
        select count(*) into v_count
          from public.marketplace_listing_gate_verdicts g
         where g.vendor_id = new.vendor_id
           and g.subject_type = 'listing'
           and g.transition = 'go_live'
           and g.consumed_at > timezone('utc', now()) - interval '24 hours';
        if v_count >= (v_caps ->> 'max_new_listings_per_day')::integer then
          raise exception 'marketplace_publish_guard: probation daily cap reached'
            using errcode = 'P0001', hint = 'probation_daily_cap';
        end if;
      end if;
    end if;

    return new;
  end if;

  -- (B) STAFF decision — the existing human approval paths. Status-only: the
  -- content must not move in the same statement, the reviewer must be real,
  -- active marketplace staff, and reviewed_at must be newly stamped (a stale
  -- stamp left by an earlier decision does not count).
  if tg_op = 'UPDATE'
     and not v_was_live
     and v_old_hash = v_hash
     and v_trusted
     and new.reviewed_by is not null
     and new.reviewed_at is not null
     and new.reviewed_at is distinct from old.reviewed_at
     and new.reviewed_at > timezone('utc', now()) - interval '15 minutes'
     and new.reviewed_at < timezone('utc', now()) + interval '5 minutes'
     and public.marketplace_gate_is_staff(new.reviewed_by)
  then
    return new;
  end if;

  -- (C) COMPANY catalogue — company-owned inventory under a company-owned store,
  -- written by a trusted role (the bootstrap seed). A seller's store is never
  -- owner_type = 'company'.
  if v_trusted
     and new.inventory_owner_type = 'company'
     and public.marketplace_gate_is_company_vendor(new.vendor_id)
  then
    return new;
  end if;

  if v_human_hold then
    raise exception 'marketplace_publish_guard: listing "%" has an open enforcement hold', new.slug
      using errcode = 'P0001', hint = 'enforcement_hold_active';
  end if;

  raise exception 'marketplace_publish_guard: no recorded gate verdict for listing "%"', new.slug
    using errcode = 'P0001', hint = 'verdict_required';
end;
$$;

-- AFTER INSERT OR UPDATE — fires only for the operation that actually happened.
-- Consumes the engine verdict, or records the staff / catalogue verdict, and
-- settles open hides.
create or replace function public.marketplace_products_publish_record()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_hash text;
  v_was_live boolean := false;
  v_verdict_id uuid;
  v_media text[];
  v_company boolean;
begin
  if new.approval_status is distinct from 'approved' then
    -- A staff rejection upholds any open hide.
    if tg_op = 'UPDATE'
       and new.approval_status = 'rejected'
       and old.approval_status is distinct from 'rejected'
    then
      update public.marketplace_listing_enforcement e
         set status = 'upheld',
             resolved_at = timezone('utc', now()),
             resolved_by = new.reviewed_by,
             resolution = 'upheld_by_staff'
       where e.product_id = new.id and e.status = 'active';
    end if;
    return null;
  end if;

  v_hash := public.marketplace_listing_content_hash(new);
  if tg_op = 'UPDATE' then
    v_was_live := (old.approval_status = 'approved');
    if v_was_live and public.marketplace_listing_content_hash(old) = v_hash then
      return null;
    end if;
  end if;

  select v.id
    into v_verdict_id
    from public.marketplace_listing_gate_verdicts v
   where v.subject_type = 'listing'
     and v.outcome = 'publish'
     and v.source in ('policy_engine', 'backfill')
     and v.slug = new.slug
     and v.vendor_id is not distinct from new.vendor_id
     and v.content_hash = v_hash
     and v.consumed_at is null
     and v.expires_at is not null
     and v.expires_at > timezone('utc', now())
   order by v.created_at desc
   limit 1
   for update;

  -- Mirrors the guard exactly: an engine verdict is not what published this row
  -- if a staff-only hide was open — the staff branch was.
  if v_verdict_id is not null and not exists (
    select 1 from public.marketplace_listing_enforcement e
    where e.product_id = new.id and e.status = 'active' and e.kind <> 'policy'
  ) then
    update public.marketplace_listing_gate_verdicts v
       set consumed_at = timezone('utc', now()),
           product_id = new.id,
           transition = case when v_was_live then 'live_edit' else 'go_live' end
     where v.id = v_verdict_id;

    -- A clean engine verdict lifts a policy hide; nothing else.
    update public.marketplace_listing_enforcement e
       set status = 'lifted',
           resolved_at = timezone('utc', now()),
           resolution = 'cleared_by_gate'
     where e.product_id = new.id and e.status = 'active' and e.kind = 'policy';
    return null;
  end if;

  -- The guard let this through as (B) or (C): put it on the record.
  select coalesce(array_agg(m.url order by m.sort_order, m.created_at), '{}'::text[])
    into v_media
    from public.marketplace_product_media m
   where m.product_id = new.id;

  v_company := new.inventory_owner_type = 'company'
    and public.marketplace_gate_is_company_vendor(new.vendor_id)
    and not (new.reviewed_by is not null and public.marketplace_gate_is_staff(new.reviewed_by)
             and tg_op = 'UPDATE' and new.reviewed_at is distinct from old.reviewed_at);

  insert into public.marketplace_listing_gate_verdicts
    (subject_type, product_id, vendor_id, slug, content_hash, media_refs, outcome, source,
     reasons, engine_version, actor_user_id, transition, consumed_at)
  values
    ('listing', new.id, new.vendor_id, new.slug, v_hash, v_media, 'publish',
     case when v_company then 'platform_catalog' else 'staff_review' end,
     '{}'::text[], 'db_guard',
     case when v_company then null else new.reviewed_by end,
     case when v_was_live then 'live_edit' else 'go_live' end,
     timezone('utc', now()));

  if not v_company then
    update public.marketplace_listing_enforcement e
       set status = 'lifted',
           resolved_at = timezone('utc', now()),
           resolved_by = new.reviewed_by,
           resolution = 'restored_by_staff'
     where e.product_id = new.id and e.status = 'active';
  end if;

  return null;
end;
$$;

drop trigger if exists marketplace_products_publish_guard on public.marketplace_products;
create trigger marketplace_products_publish_guard
  before insert or update on public.marketplace_products
  for each row execute function public.marketplace_products_publish_guard();

drop trigger if exists marketplace_products_publish_record on public.marketplace_products;
create trigger marketplace_products_publish_record
  after insert or update on public.marketplace_products
  for each row execute function public.marketplace_products_publish_record();

-- ---------------------------------------------------------------------------
-- 5. Media guard — images live in their own table, so a product-row guard alone
--    would let a clean listing swap in a new picture. While a listing is live,
--    only images covered by its standing verdict may be attached.
-- ---------------------------------------------------------------------------
create or replace function public.marketplace_product_media_guard()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_status text;
  v_owner_type text;
  v_vendor uuid;
  v_refs text[];
begin
  if tg_op = 'UPDATE'
     and new.url = old.url
     and new.product_id = old.product_id
  then
    return new; -- reorder / cover change
  end if;

  select p.approval_status, p.inventory_owner_type, p.vendor_id
    into v_status, v_owner_type, v_vendor
    from public.marketplace_products p
   where p.id = new.product_id;

  if not found or v_status is distinct from 'approved' then
    return new;
  end if;

  if public.marketplace_gate_caller_is_trusted()
     and v_owner_type = 'company'
     and public.marketplace_gate_is_company_vendor(v_vendor)
  then
    return new;
  end if;

  select v.media_refs
    into v_refs
    from public.marketplace_listing_gate_verdicts v
   where v.product_id = new.product_id
     and v.subject_type = 'listing'
     and v.outcome = 'publish'
     and v.consumed_at is not null
   order by v.consumed_at desc, v.created_at desc
   limit 1;

  if v_refs is not null and new.url = any (v_refs) then
    return new;
  end if;

  raise exception 'marketplace_media_guard: media is not covered by the standing verdict of a live listing'
    using errcode = 'P0001', hint = 'media_not_covered';
end;
$$;

drop trigger if exists marketplace_product_media_guard on public.marketplace_product_media;
create trigger marketplace_product_media_guard
  before insert or update on public.marketplace_product_media
  for each row execute function public.marketplace_product_media_guard();

-- ---------------------------------------------------------------------------
-- 6. Seller state — everything the TS gate needs about a store, in one call.
--    Stamps graduation the first time the criteria are met (sticky).
-- ---------------------------------------------------------------------------
create or replace function public.marketplace_gate_seller_state(p_vendor_id uuid, p_slug text default null)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_vendor public.marketplace_vendors%rowtype;
  v_prob public.marketplace_seller_probation%rowtype;
  v_caps jsonb := public.marketplace_gate_probation_caps();
  v_identity boolean;
  v_delivered integer;
  v_live integer;
  v_new_24h integer;
  v_rows integer;
  v_tracked boolean := false;
  v_active boolean := false;
  v_age_days integer := 0;
  v_started timestamptz;
  v_product jsonb := null;
  v_hide jsonb := null;
  v_pid uuid;
begin
  select * into v_vendor from public.marketplace_vendors v where v.id = p_vendor_id;
  if not found then
    return jsonb_build_object('vendor', null);
  end if;

  v_identity := public.marketplace_gate_identity_verified(v_vendor.owner_user_id);

  select count(*) into v_live
    from public.marketplace_products p
   where p.vendor_id = p_vendor_id and p.approval_status = 'approved';
  select count(*) into v_rows
    from public.marketplace_products p
   where p.vendor_id = p_vendor_id and coalesce(p.status, 'active') in ('active', 'draft', 'pending_review');
  select count(*) into v_new_24h
    from public.marketplace_listing_gate_verdicts g
   where g.vendor_id = p_vendor_id and g.subject_type = 'listing' and g.transition = 'go_live'
     and g.consumed_at > timezone('utc', now()) - interval '24 hours';
  select count(*) into v_delivered
    from public.marketplace_order_groups og
   where og.vendor_id = p_vendor_id and og.fulfillment_status = 'delivered';

  select * into v_prob from public.marketplace_seller_probation sp where sp.vendor_id = p_vendor_id;
  if found then
    v_tracked := true;
    v_started := v_prob.started_at;
    v_age_days := floor(extract(epoch from (timezone('utc', now()) - v_prob.started_at)) / 86400)::integer;
    if v_prob.graduated_at is null
       and v_identity
       and v_delivered >= (v_caps ->> 'graduation_min_delivered_orders')::integer
       and v_age_days >= (v_caps ->> 'graduation_min_days')::integer
    then
      update public.marketplace_seller_probation sp
         set graduated_at = timezone('utc', now()), graduated_reason = 'criteria_met'
       where sp.vendor_id = p_vendor_id and sp.graduated_at is null;
      v_prob.graduated_at := timezone('utc', now());
    end if;
    v_active := v_prob.graduated_at is null;
  end if;

  if p_slug is not null and length(btrim(p_slug)) > 0 then
    select p.id,
           jsonb_build_object('id', p.id, 'vendor_id', p.vendor_id, 'approval_status', p.approval_status,
                              'created_at', p.created_at)
      into v_pid, v_product
      from public.marketplace_products p
     where p.slug = p_slug;
    if v_pid is not null then
      select jsonb_build_object('id', e.id, 'kind', e.kind, 'reasons', to_jsonb(e.reasons), 'created_at', e.created_at)
        into v_hide
        from public.marketplace_listing_enforcement e
       where e.product_id = v_pid and e.status = 'active'
       limit 1;
    end if;
  end if;

  return jsonb_build_object(
    'vendor', jsonb_build_object(
      'id', v_vendor.id,
      'status', v_vendor.status,
      'owner_user_id', v_vendor.owner_user_id,
      'owner_type', v_vendor.owner_type,
      'seller_tier', v_vendor.seller_tier
    ),
    'identity_verified', v_identity,
    'plan', jsonb_build_object(
      'listing_cap', public.marketplace_tier_listing_cap(v_vendor.seller_tier),
      'listing_rows', v_rows
    ),
    'probation', jsonb_build_object(
      'tracked', v_tracked,
      'active', v_active,
      'started_at', v_started,
      'age_days', v_age_days,
      'caps', v_caps,
      'live_listings', v_live,
      'new_listings_24h', v_new_24h,
      'delivered_orders', v_delivered
    ),
    'product', v_product,
    'active_hide', v_hide
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- 7. The ONLY way to mint an engine verdict.
--    The caller (the TS gate, holding the service-role key) supplies its outcome;
--    this function may TIGHTEN it and never loosens it. It re-proves, in SQL, the
--    things that must not depend on a TS branch being right:
--      * the actor belongs to the vendor (or is staff acting for it)  — IDOR
--      * the slug is not another vendor's                              — takeover
--      * the store is live, no staff-only hide is open                 — enforcement
--      * the probation caps
--    The content hash is computed HERE, from the exact values the caller says it
--    will write. If it then writes anything else, the guard sees another hash.
-- ---------------------------------------------------------------------------
create or replace function public.marketplace_gate_record_listing_verdict(
  p_actor uuid,
  p_vendor_id uuid,
  p_listing jsonb,
  p_media_refs text[],
  p_outcome text,
  p_reasons text[],
  p_signals jsonb,
  p_engine_version text,
  p_source text default 'policy_engine'
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_row public.marketplace_products;
  v_outcome text := p_outcome;
  v_reasons text[] := '{}'::text[];
  v_reason text;
  v_hash text;
  v_vendor_status text;
  v_existing_id uuid;
  v_existing_vendor uuid;
  v_existing_status text;
  v_caps jsonb;
  v_count integer;
  v_id uuid;
  v_expires timestamptz := null;
  v_media text[] := coalesce(p_media_refs, '{}'::text[]);
begin
  if p_outcome is null or p_outcome not in ('publish', 'hold', 'reject') then
    raise exception 'marketplace_gate_record_listing_verdict: invalid outcome' using errcode = 'check_violation';
  end if;
  if p_source is null or p_source not in ('policy_engine', 'backfill') then
    raise exception 'marketplace_gate_record_listing_verdict: invalid source' using errcode = 'check_violation';
  end if;
  if p_listing is null or jsonb_typeof(p_listing) <> 'object' then
    raise exception 'marketplace_gate_record_listing_verdict: listing must be an object' using errcode = 'check_violation';
  end if;
  if coalesce(array_length(v_media, 1), 0) > 10 then
    raise exception 'marketplace_gate_record_listing_verdict: too many media refs' using errcode = 'check_violation';
  end if;

  -- AUTHORIZATION. The actor comes from the caller's session; here we prove it is
  -- entitled to this vendor. A seller can never obtain a verdict for another store.
  if not public.marketplace_gate_actor_may_act_for(p_actor, p_vendor_id) then
    raise exception 'marketplace_gate_record_listing_verdict: actor is not authorized for this vendor'
      using errcode = 'insufficient_privilege';
  end if;

  -- Reason codes are stable identifiers, never free text.
  if p_reasons is not null then
    foreach v_reason in array p_reasons loop
      if v_reason is null or v_reason !~ '^[a-z][a-z0-9_]{1,47}$' then
        raise exception 'marketplace_gate_record_listing_verdict: malformed reason code' using errcode = 'check_violation';
      end if;
      if not (v_reason = any (v_reasons)) then
        v_reasons := v_reasons || v_reason;
      end if;
    end loop;
  end if;
  if coalesce(array_length(v_reasons, 1), 0) > 24 then
    raise exception 'marketplace_gate_record_listing_verdict: too many reason codes' using errcode = 'check_violation';
  end if;

  v_row := jsonb_populate_record(null::public.marketplace_products, p_listing);
  v_row.vendor_id := p_vendor_id;
  if v_row.slug is null or length(btrim(v_row.slug)) = 0 then
    raise exception 'marketplace_gate_record_listing_verdict: slug is required' using errcode = 'check_violation';
  end if;

  select v.status into v_vendor_status from public.marketplace_vendors v where v.id = p_vendor_id;

  select p.id, p.vendor_id, p.approval_status
    into v_existing_id, v_existing_vendor, v_existing_status
    from public.marketplace_products p
   where p.slug = v_row.slug;

  -- ---- DB floor: can only tighten -------------------------------------------
  if v_existing_id is not null and v_existing_vendor is distinct from p_vendor_id then
    v_outcome := 'reject';
    v_reasons := array['listing_conflict'];
  elsif v_outcome = 'publish' then
    if v_vendor_status is distinct from 'approved' then
      v_outcome := 'reject';
      v_reasons := v_reasons || 'seller_not_active'::text;
    elsif length(btrim(coalesce(v_row.title, ''))) = 0 then
      v_outcome := 'reject';
      v_reasons := v_reasons || 'incomplete_listing'::text;
    elsif coalesce(v_row.base_price, 0) <= 0 then
      v_outcome := 'reject';
      v_reasons := v_reasons || 'price_invalid'::text;
    elsif v_existing_id is not null and exists (
      select 1 from public.marketplace_listing_enforcement e
      where e.product_id = v_existing_id and e.status = 'active' and e.kind <> 'policy'
    ) then
      v_outcome := 'hold';
      v_reasons := v_reasons || 'enforcement_hold_active'::text;
    elsif public.marketplace_gate_probation_active(p_vendor_id) then
      v_caps := public.marketplace_gate_probation_caps();
      if v_row.base_price > (v_caps ->> 'max_price')::integer then
        v_outcome := 'reject';
        v_reasons := v_reasons || 'probation_price_cap'::text;
      elsif v_existing_status is distinct from 'approved' then
        select count(*) into v_count
          from public.marketplace_products p
         where p.vendor_id = p_vendor_id and p.approval_status = 'approved'
           and (v_existing_id is null or p.id <> v_existing_id);
        if v_count >= (v_caps ->> 'max_live_listings')::integer then
          v_outcome := 'reject';
          v_reasons := v_reasons || 'probation_listing_cap'::text;
        else
          select count(*) into v_count
            from public.marketplace_listing_gate_verdicts g
           where g.vendor_id = p_vendor_id and g.subject_type = 'listing' and g.transition = 'go_live'
             and g.consumed_at > timezone('utc', now()) - interval '24 hours';
          if v_count >= (v_caps ->> 'max_new_listings_per_day')::integer then
            v_outcome := 'reject';
            v_reasons := v_reasons || 'probation_daily_cap'::text;
          end if;
        end if;
      end if;
    end if;
  end if;

  v_hash := public.marketplace_listing_content_hash(v_row);
  if v_outcome = 'publish' then
    v_expires := timezone('utc', now()) + interval '15 minutes';
  end if;

  insert into public.marketplace_listing_gate_verdicts
    (subject_type, product_id, vendor_id, slug, content_hash, media_refs, outcome, source,
     reasons, signals, engine_version, actor_user_id, expires_at)
  values
    ('listing', v_existing_id, p_vendor_id, v_row.slug, v_hash, v_media, v_outcome, p_source,
     v_reasons, coalesce(p_signals, '{}'::jsonb), coalesce(nullif(btrim(p_engine_version), ''), 'unknown'),
     p_actor, v_expires)
  returning id into v_id;

  return jsonb_build_object(
    'verdict_id', v_id,
    'outcome', v_outcome,
    'reasons', to_jsonb(v_reasons),
    'content_hash', v_hash,
    'expires_at', v_expires
  );
end;
$$;

-- A re-scan under a newer ruleset that found nothing: refresh the standing
-- verdict so the listing is not scanned again until the ruleset moves.
create or replace function public.marketplace_gate_record_rescan(p_product_id uuid, p_engine_version text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_row public.marketplace_products;
  v_media text[];
  v_id uuid;
begin
  select * into v_row from public.marketplace_products p where p.id = p_product_id;
  if not found or v_row.approval_status is distinct from 'approved' then
    return jsonb_build_object('recorded', false);
  end if;
  select coalesce(array_agg(m.url order by m.sort_order, m.created_at), '{}'::text[])
    into v_media
    from public.marketplace_product_media m
   where m.product_id = p_product_id;

  insert into public.marketplace_listing_gate_verdicts
    (subject_type, product_id, vendor_id, slug, content_hash, media_refs, outcome, source,
     reasons, engine_version, consumed_at)
  values
    ('listing', v_row.id, v_row.vendor_id, v_row.slug, public.marketplace_listing_content_hash(v_row),
     v_media, 'publish', 'rescan', '{}'::text[],
     coalesce(nullif(btrim(p_engine_version), ''), 'unknown'), timezone('utc', now()))
  returning id into v_id;

  return jsonb_build_object('recorded', true, 'verdict_id', v_id);
end;
$$;

-- ---------------------------------------------------------------------------
-- 8. Reversible auto-hide. The ONLY automated enforcement there is: it moves a
--    live listing to under_review and records why. It deletes nothing, suspends
--    no one and touches no money. Restoring it is the ordinary staff approval.
-- ---------------------------------------------------------------------------
create or replace function public.marketplace_gate_hide_listing(
  p_product_id uuid,
  p_kind text,
  p_reasons text[],
  p_evidence jsonb,
  p_engine_version text
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_row public.marketplace_products;
  v_reasons text[] := '{}'::text[];
  v_reason text;
  v_id uuid;
begin
  if p_kind is null or p_kind not in ('policy', 'reports', 'risk') then
    raise exception 'marketplace_gate_hide_listing: invalid kind' using errcode = 'check_violation';
  end if;
  if p_reasons is not null then
    foreach v_reason in array p_reasons loop
      if v_reason is null or v_reason !~ '^[a-z][a-z0-9_]{1,47}$' then
        raise exception 'marketplace_gate_hide_listing: malformed reason code' using errcode = 'check_violation';
      end if;
      if not (v_reason = any (v_reasons)) then
        v_reasons := v_reasons || v_reason;
      end if;
    end loop;
  end if;
  if coalesce(array_length(v_reasons, 1), 0) = 0 then
    raise exception 'marketplace_gate_hide_listing: at least one reason code is required' using errcode = 'check_violation';
  end if;

  select * into v_row from public.marketplace_products p where p.id = p_product_id for update;
  if not found then
    return jsonb_build_object('hidden', false, 'why', 'not_found');
  end if;
  if v_row.approval_status is distinct from 'approved' then
    return jsonb_build_object('hidden', false, 'why', 'not_live');
  end if;
  -- The company's own catalogue is never auto-hidden.
  if v_row.inventory_owner_type = 'company' and public.marketplace_gate_is_company_vendor(v_row.vendor_id) then
    return jsonb_build_object('hidden', false, 'why', 'company_catalogue');
  end if;

  insert into public.marketplace_listing_enforcement
    (product_id, vendor_id, kind, reasons, evidence, prior_status, engine_version)
  values
    (v_row.id, v_row.vendor_id, p_kind, v_reasons, coalesce(p_evidence, '{}'::jsonb), v_row.approval_status,
     coalesce(nullif(btrim(p_engine_version), ''), 'unknown'))
  on conflict (product_id) where status = 'active' do nothing
  returning id into v_id;

  if v_id is null then
    return jsonb_build_object('hidden', false, 'why', 'already_hidden');
  end if;

  update public.marketplace_products p
     set approval_status = 'under_review'
   where p.id = v_row.id;

  return jsonb_build_object('hidden', true, 'enforcement_id', v_id, 'vendor_id', v_row.vendor_id, 'slug', v_row.slug);
end;
$$;

-- ---------------------------------------------------------------------------
-- 9. Image fingerprints.
-- ---------------------------------------------------------------------------
create or replace function public.marketplace_gate_register_image(
  p_ref text,
  p_sha256 text,
  p_phash bigint,
  p_bytes bigint,
  p_uploader uuid,
  p_vendor_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_ref is null or length(btrim(p_ref)) = 0 or length(p_ref) > 600 then
    raise exception 'marketplace_gate_register_image: invalid ref' using errcode = 'check_violation';
  end if;
  if p_sha256 is null or p_sha256 !~ '^[0-9a-f]{64}$' then
    raise exception 'marketplace_gate_register_image: invalid sha256' using errcode = 'check_violation';
  end if;

  insert into public.marketplace_image_fingerprints (ref, sha256, phash, bytes, uploader_user_id, vendor_id)
  values (p_ref, p_sha256, p_phash, p_bytes, p_uploader, p_vendor_id)
  on conflict (ref) do update
    set vendor_id = coalesce(public.marketplace_image_fingerprints.vendor_id, excluded.vendor_id),
        uploader_user_id = coalesce(public.marketplace_image_fingerprints.uploader_user_id, excluded.uploader_user_id);

  return jsonb_build_object('registered', true);
end;
$$;

-- For each of the given refs: does this picture belong to someone else, or is it
-- already on another of this seller's listings?
--
--   other_seller — (a) the object itself was uploaded by another store (a copied
--                  reference), or (b) another store registered the same picture
--                  (identical bytes, or a perceptual near-match) FIRST.
--   same_seller  — the picture is already attached to a different listing of this
--                  store.
--
-- "First" matters: when a copier re-uploads a seller's photo, the ORIGINAL owner
-- must not be the one who gets flagged. Order is the fingerprint's created_at.
create or replace function public.marketplace_gate_image_matches(
  p_vendor_id uuid,
  p_slug text,
  p_refs text[],
  p_max_distance integer default 6
) returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with mine as (
    select f.ref, f.sha256, f.phash, f.vendor_id, f.created_at
    from public.marketplace_image_fingerprints f
    where f.ref = any (coalesce(p_refs, '{}'::text[]))
  ),
  foreign_ref as (
    select m.ref, 'other_seller'::text as relation, 0 as distance
    from mine m
    where m.vendor_id is not null and m.vendor_id is distinct from p_vendor_id
  ),
  twins as (
    select
      m.ref,
      o.ref as twin_ref,
      o.vendor_id as twin_vendor,
      o.created_at as twin_created,
      m.created_at as my_created,
      case when o.sha256 = m.sha256 then 0
           else bit_count((o.phash # m.phash)::bit(64))::integer end as distance
    from mine m
    join public.marketplace_image_fingerprints o
      on o.ref <> m.ref
     and (
       o.sha256 = m.sha256
       or (
         o.phash is not null and m.phash is not null
         and bit_count((o.phash # m.phash)::bit(64)) <= greatest(0, least(coalesce(p_max_distance, 6), 16))
       )
     )
  ),
  other_first as (
    select t.ref, 'other_seller'::text as relation, t.distance
    from twins t
    where t.twin_vendor is not null
      and t.twin_vendor is distinct from p_vendor_id
      and t.twin_created <= t.my_created
  ),
  own_reuse as (
    select s.ref, 'same_seller'::text as relation, s.distance
    from (
      select m.ref, m.ref as attached_ref, 0 as distance from mine m
      union all
      select t.ref, t.twin_ref, t.distance from twins t where t.twin_vendor is not distinct from p_vendor_id
    ) s
    join public.marketplace_product_media md on md.url = s.attached_ref
    join public.marketplace_products p on p.id = md.product_id
    where p.vendor_id is not distinct from p_vendor_id
      and p.slug is distinct from p_slug
  ),
  combined as (
    select * from foreign_ref
    union all
    select * from other_first
    union all
    select * from own_reuse
  )
  select coalesce(jsonb_agg(distinct jsonb_build_object(
    'ref', combined.ref,
    'relation', combined.relation,
    'distance', combined.distance
  )), '[]'::jsonb)
  from combined;
$$;

-- ---------------------------------------------------------------------------
-- 10. Instant onboarding — opens a store without a human approval, atomically,
--     and ALWAYS with a probation row. Because the probation row is written in
--     the same transaction as the store, no TS branch can open an instant store
--     that escapes the caps or the payout identity guard.
-- ---------------------------------------------------------------------------
create or replace function public.marketplace_gate_instant_onboard(
  p_actor uuid,
  p_application_id uuid,
  p_reasons text[],
  p_signals jsonb,
  p_engine_version text
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_app public.marketplace_vendor_applications%rowtype;
  v_vendor_id uuid;
  v_owner uuid;
  v_identity boolean;
  v_pending boolean;
  v_level text;
  v_score numeric;
  v_verdict_id uuid;
  v_slug text;
begin
  if p_actor is null then
    raise exception 'marketplace_gate_instant_onboard: actor is required' using errcode = 'insufficient_privilege';
  end if;

  select * into v_app
    from public.marketplace_vendor_applications a
   where a.id = p_application_id
   for update;
  if not found or v_app.user_id is distinct from p_actor then
    raise exception 'marketplace_gate_instant_onboard: application does not belong to the actor'
      using errcode = 'insufficient_privilege';
  end if;
  if v_app.status is distinct from 'submitted' then
    raise exception 'marketplace_gate_instant_onboard: application is not in a submitted state'
      using errcode = 'P0001', hint = 'application_not_submitted';
  end if;
  if v_app.agreement_accepted_at is null then
    raise exception 'marketplace_gate_instant_onboard: seller agreement not accepted'
      using errcode = 'P0001', hint = 'agreement_required';
  end if;

  v_slug := lower(btrim(coalesce(v_app.proposed_store_slug, '')));
  if v_slug !~ '^[a-z0-9][a-z0-9-]{1,62}$' or length(btrim(coalesce(v_app.store_name, ''))) = 0 then
    raise exception 'marketplace_gate_instant_onboard: store identity is incomplete'
      using errcode = 'P0001', hint = 'store_identity_incomplete';
  end if;

  -- One store per account: an existing store is returned, never duplicated.
  select v.id into v_vendor_id
    from public.marketplace_vendors v
   where v.owner_user_id = p_actor
   order by v.created_at
   limit 1;
  if v_vendor_id is not null then
    return jsonb_build_object('onboarded', false, 'why', 'already_seller', 'vendor_id', v_vendor_id);
  end if;

  select v.id, v.owner_user_id into v_vendor_id, v_owner
    from public.marketplace_vendors v
   where v.slug = v_slug;
  if v_vendor_id is not null then
    raise exception 'marketplace_gate_instant_onboard: store handle is taken'
      using errcode = 'P0001', hint = 'store_handle_taken';
  end if;

  v_identity := public.marketplace_gate_identity_verified(p_actor);
  v_pending := exists (
    select 1 from public.customer_profiles cp
    where cp.id = p_actor and lower(coalesce(cp.verification_status, 'none')) = 'pending'
  );
  -- Mirrors the starting posture the human approval path gives a store.
  v_level := case when v_identity then 'gold' when v_pending then 'silver' else 'bronze' end;
  v_score := case when v_identity then 66 when v_pending then 58 else 48 end;

  insert into public.marketplace_vendors
    (slug, name, description, owner_user_id, owner_type, status, verification_level, trust_score,
     response_sla_hours, fulfillment_rate, dispute_rate, review_score, followers_count,
     badges, support_email, support_phone)
  values
    (v_slug, btrim(v_app.store_name),
     coalesce(nullif(btrim(v_app.story), ''), btrim(v_app.store_name) || ' storefront'),
     p_actor, 'vendor', 'approved', v_level, v_score,
     6, 93, 2.5, 4.5, 0,
     array['New seller', case when v_identity then 'Identity verified' else 'Identity checked at payout' end],
     v_app.normalized_email, v_app.contact_phone)
  returning id into v_vendor_id;

  if exists (
    select 1 from public.marketplace_role_memberships m
    where m.user_id = p_actor and m.scope_type = 'vendor' and m.scope_id = v_vendor_id and m.role = 'vendor'
  ) then
    update public.marketplace_role_memberships m
       set is_active = true
     where m.user_id = p_actor and m.scope_type = 'vendor' and m.scope_id = v_vendor_id and m.role = 'vendor';
  else
    insert into public.marketplace_role_memberships
      (user_id, normalized_email, scope_type, scope_id, role, is_active)
    values
      (p_actor, v_app.normalized_email, 'vendor', v_vendor_id, 'vendor', true);
  end if;

  insert into public.marketplace_listing_gate_verdicts
    (subject_type, vendor_id, slug, content_hash, outcome, source, reasons, signals, engine_version,
     actor_user_id, consumed_at)
  values
    ('seller', v_vendor_id, v_slug,
     encode(sha256(convert_to(v_slug || '|' || btrim(v_app.store_name) || '|' || coalesce(v_app.story, ''), 'UTF8')), 'hex'),
     'publish', 'policy_engine', coalesce(p_reasons, '{}'::text[]), coalesce(p_signals, '{}'::jsonb),
     coalesce(nullif(btrim(p_engine_version), ''), 'unknown'), p_actor, timezone('utc', now()))
  returning id into v_verdict_id;

  insert into public.marketplace_seller_probation (vendor_id, owner_user_id, onboarding_verdict_id)
  values (v_vendor_id, p_actor, v_verdict_id);

  update public.marketplace_vendor_applications a
     set status = 'approved',
         reviewed_at = timezone('utc', now()),
         review_note = 'Opened by the instant-publish gate. Identity is checked at the first payout.'
   where a.id = p_application_id;

  return jsonb_build_object(
    'onboarded', true,
    'vendor_id', v_vendor_id,
    'slug', v_slug,
    'verdict_id', v_verdict_id,
    'identity_verified', v_identity
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- 11. Payout identity. Identity no longer stands in front of a listing, so it
--     must stand in front of the money. payoutEligibility in TS is the first
--     wall; this is the second. It applies to stores opened by instant
--     onboarding — the ones that never passed a human identity review — and it
--     can only REFUSE. No payment object is read or written.
-- ---------------------------------------------------------------------------
create or replace function public.marketplace_gate_payout_eligibility(p_vendor_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_owner uuid;
  v_status text;
  v_identity boolean;
  v_tracked boolean;
begin
  select v.owner_user_id, v.status into v_owner, v_status
    from public.marketplace_vendors v
   where v.id = p_vendor_id;
  if not found then
    return jsonb_build_object('vendor_found', false);
  end if;
  v_identity := public.marketplace_gate_identity_verified(v_owner);
  v_tracked := exists (select 1 from public.marketplace_seller_probation p where p.vendor_id = p_vendor_id);
  return jsonb_build_object(
    'vendor_found', true,
    'vendor_status', v_status,
    'owner_user_id', v_owner,
    'identity_verified', v_identity,
    'instant_onboarded', v_tracked
  );
end;
$$;

create or replace function public.marketplace_payout_identity_guard()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_owner uuid;
begin
  if new.vendor_id is null then
    return new;
  end if;
  if tg_op = 'UPDATE' then
    if new.status is not distinct from old.status or new.status not in ('approved', 'released') then
      return new;
    end if;
  elsif coalesce(new.status, 'requested') not in ('requested', 'approved', 'released') then
    return new;
  end if;

  select p.owner_user_id into v_owner
    from public.marketplace_seller_probation p
   where p.vendor_id = new.vendor_id;
  if not found then
    return new; -- a store that passed the human identity review
  end if;

  if not public.marketplace_gate_identity_verified(v_owner) then
    raise exception 'marketplace_payout_identity_guard: identity verification is required before a payout'
      using errcode = 'P0001', hint = 'identity_unverified';
  end if;
  return new;
end;
$$;

drop trigger if exists marketplace_payout_identity_guard on public.marketplace_payout_requests;
create trigger marketplace_payout_identity_guard
  before insert or update of status on public.marketplace_payout_requests
  for each row execute function public.marketplace_payout_identity_guard();

-- ---------------------------------------------------------------------------
-- 12. Grants. Supabase grants EXECUTE on every new function to anon and
--     authenticated DIRECTLY (default privileges), so `revoke from public` alone
--     leaves them callable. Every function is revoked from the request roles by
--     name; only the RPCs the TS gate calls are granted, and only to service_role.
-- ---------------------------------------------------------------------------
revoke all on function public.marketplace_listing_content_hash(public.marketplace_products) from public, anon, authenticated;
revoke all on function public.marketplace_gate_probation_caps() from public, anon, authenticated;
revoke all on function public.marketplace_gate_is_staff(uuid) from public, anon, authenticated;
revoke all on function public.marketplace_gate_actor_may_act_for(uuid, uuid) from public, anon, authenticated;
revoke all on function public.marketplace_gate_identity_verified(uuid) from public, anon, authenticated;
revoke all on function public.marketplace_gate_caller_is_trusted() from public, anon, authenticated;
revoke all on function public.marketplace_gate_is_company_vendor(uuid) from public, anon, authenticated;
revoke all on function public.marketplace_gate_probation_active(uuid) from public, anon, authenticated;
revoke all on function public.marketplace_products_publish_guard() from public, anon, authenticated, service_role;
revoke all on function public.marketplace_products_publish_record() from public, anon, authenticated, service_role;
revoke all on function public.marketplace_product_media_guard() from public, anon, authenticated, service_role;
revoke all on function public.marketplace_payout_identity_guard() from public, anon, authenticated, service_role;
revoke all on function public.marketplace_gate_seller_state(uuid, text) from public, anon, authenticated;
revoke all on function public.marketplace_gate_record_listing_verdict(uuid, uuid, jsonb, text[], text, text[], jsonb, text, text) from public, anon, authenticated;
revoke all on function public.marketplace_gate_record_rescan(uuid, text) from public, anon, authenticated;
revoke all on function public.marketplace_gate_hide_listing(uuid, text, text[], jsonb, text) from public, anon, authenticated;
revoke all on function public.marketplace_gate_register_image(text, text, bigint, bigint, uuid, uuid) from public, anon, authenticated;
revoke all on function public.marketplace_gate_image_matches(uuid, text, text[], integer) from public, anon, authenticated;
revoke all on function public.marketplace_gate_instant_onboard(uuid, uuid, text[], jsonb, text) from public, anon, authenticated;
revoke all on function public.marketplace_gate_payout_eligibility(uuid) from public, anon, authenticated;

grant execute on function public.marketplace_gate_probation_caps() to service_role;
grant execute on function public.marketplace_gate_seller_state(uuid, text) to service_role;
grant execute on function public.marketplace_gate_record_listing_verdict(uuid, uuid, jsonb, text[], text, text[], jsonb, text, text) to service_role;
grant execute on function public.marketplace_gate_record_rescan(uuid, text) to service_role;
grant execute on function public.marketplace_gate_hide_listing(uuid, text, text[], jsonb, text) to service_role;
grant execute on function public.marketplace_gate_register_image(text, text, bigint, bigint, uuid, uuid) to service_role;
grant execute on function public.marketplace_gate_image_matches(uuid, text, text[], integer) to service_role;
grant execute on function public.marketplace_gate_instant_onboard(uuid, uuid, text[], jsonb, text) to service_role;
grant execute on function public.marketplace_gate_payout_eligibility(uuid) to service_role;

-- ---------------------------------------------------------------------------
-- 13. Standing verdicts for what is already live. From this point "every live
--     listing has a verdict on record" is true of the whole table, and the media
--     guard has a set to check against. Idempotent.
-- ---------------------------------------------------------------------------
insert into public.marketplace_listing_gate_verdicts
  (subject_type, product_id, vendor_id, slug, content_hash, media_refs, outcome, source,
   reasons, engine_version, transition, consumed_at)
select
  'listing', p.id, p.vendor_id, p.slug, public.marketplace_listing_content_hash(p),
  coalesce((
    select array_agg(m.url order by m.sort_order, m.created_at)
    from public.marketplace_product_media m
    where m.product_id = p.id
  ), '{}'::text[]),
  'publish', 'pre_guard_backfill', '{}'::text[], 'pre_guard', 'go_live', timezone('utc', now())
from public.marketplace_products p
where p.approval_status = 'approved'
  and not exists (
    select 1 from public.marketplace_listing_gate_verdicts v
    where v.product_id = p.id and v.outcome = 'publish' and v.consumed_at is not null
  );
