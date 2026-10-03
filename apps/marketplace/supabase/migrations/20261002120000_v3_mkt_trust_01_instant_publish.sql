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
--    Variants (marketplace_product_variants) are NOT in the hash and the engine
--    does not screen them: section 5b keeps them out of the engine's reach — a
--    listing that carries variant rows can only be published by a person, and a
--    variant's content cannot change while its listing is live.
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
  -- 'go_live' | 'live_edit', stamped when a publish verdict is consumed. `consumed_at`
  -- is wall-clock time (clock_timestamp), not transaction time: the STANDING verdict
  -- of a listing is its most recently consumed one, so two in one transaction must order.
  transition text check (transition is null or transition in ('go_live', 'live_edit')),
  created_at timestamptz not null default now(),
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
  -- instant_onboarding : opened by the gate, no human approval
  -- staff_approved     : opened by a person (the legacy approval). Nobody reviews
  --                      identity documents at approval, so the store starts under
  --                      the same limits and the same identity check at payout.
  source text not null default 'instant_onboarding'
    check (source in ('instant_onboarding', 'staff_approved')),
  onboarding_verdict_id uuid,
  started_at timestamptz not null default now(),
  graduated_at timestamptz,
  graduated_reason text
);

create table if not exists public.marketplace_listing_enforcement (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null,
  vendor_id uuid,
  -- The handle the listing had. A hold binds the listing id AND store + handle, so
  -- a row that is deleted and re-created under the same handle inherits it.
  slug text,
  -- policy         : a deterministic rule found a violation on a live listing
  -- reports        : distinct-reporter threshold reached
  -- risk           : mirrors a STAFF-applied V3-40 hold/freeze on the listing
  -- staff_decision : a person rejected the listing or asked for changes
  kind text not null check (kind in ('policy', 'reports', 'risk', 'staff_decision')),
  status text not null default 'active' check (status in ('active', 'lifted', 'upheld')),
  reasons text[] not null default '{}'::text[],
  evidence jsonb not null default '{}'::jsonb,
  prior_status text not null default 'approved',
  engine_version text not null default 'unknown',
  created_at timestamptz not null default now(),
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

alter table public.marketplace_listing_enforcement add column if not exists slug text;
-- The held listing's pictures as they were when the hold was placed (ref, sha256 and
-- the perceptual masks). The "same item listed again" check reads them from here, so
-- removing the pictures from the held listing — or deleting it — does not shed the hold.
alter table public.marketplace_listing_enforcement add column if not exists media_snapshot jsonb not null default '[]'::jsonb;
alter table public.marketplace_listing_enforcement drop constraint if exists marketplace_listing_enforcement_kind_check;
alter table public.marketplace_listing_enforcement add constraint marketplace_listing_enforcement_kind_check
  check (kind in ('policy', 'reports', 'risk', 'staff_decision'));
create index if not exists marketplace_listing_enforcement_handle_idx
  on public.marketplace_listing_enforcement (vendor_id, slug)
  where status in ('active', 'upheld');

create table if not exists public.marketplace_image_fingerprints (
  -- Canonical first-party media reference (media://public/marketplace-images/...).
  ref text primary key,
  sha256 text not null,
  -- Perceptual hash: two 64-bit masks over a 9x8 greyscale grid — `phash` marks the
  -- cells that are brighter on the left, `phash_aux` the cells brighter on the
  -- right; a cell in neither is flat. Both null when the picture could not be
  -- decoded or has too little structure to compare (the TS side decides).
  phash bigint,
  phash_aux bigint,
  bytes bigint,
  uploader_user_id uuid,
  vendor_id uuid,
  -- Wall-clock, not transaction time: "who had this picture first" is decided on
  -- this column, so two registrations in one transaction must still order.
  created_at timestamptz not null default clock_timestamp()
);
alter table public.marketplace_image_fingerprints add column if not exists phash_aux bigint;

alter table public.marketplace_seller_probation drop constraint if exists marketplace_seller_probation_source_check;
alter table public.marketplace_seller_probation add constraint marketplace_seller_probation_source_check
  check (source in ('instant_onboarding', 'staff_approved'));

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
-- WHICH MEMBERSHIPS A USER ACTUALLY HOLDS — the same rule the app applies
-- (packages/config/membership-grant.ts), in SQL, so the database and the app
-- cannot disagree about who is staff or who belongs to a store:
--   * an inactive row never grants;
--   * a row BOUND to a user (user_id set) grants only to that exact user — it is
--     never matched by email;
--   * an UNCLAIMED row (user_id null) grants only to a user whose email is
--     VERIFIED and equals the row's normalized_email.
-- Staff rows are commonly unclaimed seeds. If the guard only recognised bound
-- rows, a staff member the app treats as staff would be refused here and the
-- existing human approval path would stop working the day this is applied.
create or replace function public.marketplace_gate_granted_memberships(p_user uuid)
returns setof public.marketplace_role_memberships
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select m.*
    from public.marketplace_role_memberships m
   where p_user is not null
     and m.is_active = true
     and (
       m.user_id = p_user
       or (
         m.user_id is null
         and nullif(btrim(m.normalized_email), '') is not null
         and exists (
           select 1
             from auth.users u
            where u.id = p_user
              and u.email_confirmed_at is not null
              and lower(btrim(u.email)) = m.normalized_email
         )
       )
     );
$$;

create or replace function public.marketplace_gate_is_staff(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.marketplace_gate_granted_memberships(p_user) m
    where m.scope_type = 'platform'
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
  select p_vendor_id is not null and exists (
    select 1
    from public.marketplace_gate_granted_memberships(p_actor) m
    where (m.scope_type = 'vendor' and m.scope_id = p_vendor_id and m.role = 'vendor')
       or (m.scope_type = 'platform' and m.role in ('marketplace_owner', 'marketplace_admin'))
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
    where v.id = p_vendor_id and v.owner_type = 'company' and v.owner_user_id is null
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

-- A listing only a PERSON can put (back) in the catalogue: an open reports or risk
-- take-down, one a person upheld, or a person's own rejection / request for
-- changes. Matched on the listing id AND on store + handle, so deleting the row
-- and creating it again under the same handle does not shed it. A `policy`
-- take-down is not one of these: it lifts itself when the seller's fix passes.
create or replace function public.marketplace_gate_human_hold(p_product_id uuid, p_vendor_id uuid, p_slug text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
      from public.marketplace_listing_enforcement e
     where e.kind <> 'policy'
       and e.status in ('active', 'upheld')
       and (
         (p_product_id is not null and e.product_id = p_product_id)
         or (p_vendor_id is not null and p_slug is not null and e.vendor_id = p_vendor_id and e.slug = p_slug)
       )
  );
$$;

-- A person withdrew a seller's approval ("Revoke approval": an application that was
-- approved, rejected or sent back by marketplace staff). Recorded here, not read off
-- the application row: the seller's own re-submission rewrites that row's status,
-- and must not undo what a person decided. While it stands, the engine publishes
-- nothing for the account's stores — a person decides. A person's approval of an
-- application of the same account lifts it.
create table if not exists public.marketplace_seller_revocations (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null,
  application_id uuid,
  revoked_by uuid,
  revoked_at timestamptz not null default now(),
  lifted_by uuid,
  lifted_at timestamptz
);
create index if not exists marketplace_seller_revocations_open_idx
  on public.marketplace_seller_revocations (owner_user_id)
  where lifted_at is null;
alter table public.marketplace_seller_revocations enable row level security;
revoke all on public.marketplace_seller_revocations from public, anon, authenticated, service_role;
grant select on public.marketplace_seller_revocations to service_role;

create or replace function public.marketplace_gate_owner_revoked(p_owner uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p_owner is not null and exists (
    select 1
      from public.marketplace_seller_revocations r
     where r.owner_user_id = p_owner and r.lifted_at is null
  );
$$;

-- AFTER UPDATE on marketplace_vendor_applications: a PERSON's new decision (a staff
-- reviewer, a fresh review stamp, a trusted writer) that takes an approval back is
-- recorded; one that approves lifts what stood.
create or replace function public.marketplace_vendor_applications_revocation()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.user_id is null
     or new.reviewed_by is null
     or new.reviewed_at is null
     or new.reviewed_at is not distinct from old.reviewed_at
     or not public.marketplace_gate_caller_is_trusted()
     or not public.marketplace_gate_is_staff(new.reviewed_by)
  then
    return null; -- not a person's new decision
  end if;
  if old.status = 'approved' and new.status in ('rejected', 'changes_requested') then
    insert into public.marketplace_seller_revocations (owner_user_id, application_id, revoked_by)
    values (new.user_id, new.id, new.reviewed_by);
  elsif new.status = 'approved' and old.status is distinct from 'approved' then
    update public.marketplace_seller_revocations r
       set lifted_at = now(),
           lifted_by = new.reviewed_by
     where r.owner_user_id = new.user_id and r.lifted_at is null;
  end if;
  return null;
end;
$$;

drop trigger if exists marketplace_vendor_applications_revocation on public.marketplace_vendor_applications;
create trigger marketplace_vendor_applications_revocation
  after update on public.marketplace_vendor_applications
  for each row execute function public.marketplace_vendor_applications_revocation();

-- Two pictures are the same picture: identical bytes, or a perceptual near-match
-- under the precision rules of marketplace_gate_image_matches (both with real
-- structure, at most 4 of the 128 mask bits apart).
create or replace function public.marketplace_gate_pictures_alike(
  a_sha256 text, a_phash bigint, a_aux bigint,
  b_sha256 text, b_phash bigint, b_aux bigint
) returns boolean
language sql
immutable
set search_path = public, pg_temp
as $$
  select coalesce(
    (a_sha256 is not null and a_sha256 = b_sha256)
    or (
      a_phash is not null and a_aux is not null and b_phash is not null and b_aux is not null
      and bit_count((a_phash | a_aux)::bit(64)) >= 16
      and bit_count((b_phash | b_aux)::bit(64)) >= 16
      and bit_count((a_phash # b_phash)::bit(64)) + bit_count((a_aux # b_aux)::bit(64)) <= 4
    ), false);
$$;

-- A listing's pictures with their fingerprints: what is attached now, and what its
-- last approval (engine or staff) covered.
create or replace function public.marketplace_gate_listing_pictures(p_product_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with refs as (
    select m.url as ref
      from public.marketplace_product_media m
     where m.product_id = p_product_id
    union
    select unnest(s.media_refs)
      from (
        select g.media_refs
          from public.marketplace_listing_gate_verdicts g
         where g.product_id = p_product_id
           and g.subject_type = 'listing'
           and g.outcome = 'publish'
           and g.consumed_at is not null
         order by g.consumed_at desc, g.created_at desc
         limit 1
      ) s
  )
  select coalesce(jsonb_agg(jsonb_build_object(
           'ref', r.ref, 'sha256', f.sha256, 'phash', f.phash, 'phash_aux', f.phash_aux)), '[]'::jsonb)
    from refs r
    left join public.marketplace_image_fingerprints f on f.ref = r.ref
   where r.ref is not null;
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
  v_has_variants boolean := false;
begin
  -- 0. A listing's id never changes. Take-downs and standing verdicts are keyed on
  --    it; a row that could be re-keyed would walk away from both.
  if tg_op = 'UPDATE' and new.id is distinct from old.id then
    raise exception 'marketplace_publish_guard: a listing id cannot change'
      using errcode = 'P0001', hint = 'listing_id_immutable';
  end if;
  -- Nor does the store it belongs to: a listing (and the reviews on it) is never
  -- adopted by another store. The store's own deletion empties the column — refused
  -- further down while the listing is live. Company catalogue may be re-homed to a
  -- company store by a trusted writer.
  if tg_op = 'UPDATE' and new.vendor_id is distinct from old.vendor_id and new.vendor_id is not null
     and not (new.inventory_owner_type = 'company'
              and public.marketplace_gate_caller_is_trusted()
              and public.marketplace_gate_is_company_vendor(new.vendor_id))
  then
    raise exception 'marketplace_publish_guard: a listing cannot move to another store'
      using errcode = 'P0001', hint = 'listing_store_immutable';
  end if;
  -- A listing a person has to decide keeps its handle while that stands: the hold is
  -- bound to the handle too, and a handle freed by a rename could be taken by another
  -- listing.
  if tg_op = 'UPDATE' and new.slug is distinct from old.slug
     and public.marketplace_gate_human_hold(old.id, old.vendor_id, old.slug)
  then
    raise exception 'marketplace_publish_guard: a listing under review by a person keeps its handle'
      using errcode = 'P0001', hint = 'listing_handle_held';
  end if;

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
     and v.expires_at > now()
   order by v.created_at desc
   limit 1
   for update;

  -- What a person has to decide cannot be decided by an engine verdict: while such
  -- a hold stands — open, or upheld by a person — the engine verdict is simply not
  -- usable, and only (B) can publish.
  v_human_hold := public.marketplace_gate_human_hold(new.id, new.vendor_id, new.slug);

  -- Variants are buyer-visible and the engine does not screen them: a listing that
  -- carries any is a person's decision, never the engine's.
  v_has_variants := exists (
    select 1 from public.marketplace_product_variants x where x.product_id = new.id
  );

  if v_verdict_id is not null and not v_human_hold and not v_has_variants then
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
           and g.consumed_at > now() - interval '24 hours';
        -- Verdicts are consumed by the AFTER trigger, which runs once the whole
        -- statement has been checked. Rows this same statement has already let
        -- through are live but not yet on the ledger: count them too, or one
        -- multi-row write would walk past the daily cap.
        v_count := v_count + (
          select count(*)
            from public.marketplace_products p
           where p.vendor_id = new.vendor_id
             and p.approval_status = 'approved'
             and p.id <> new.id
             and not exists (
               select 1 from public.marketplace_listing_gate_verdicts g
               where g.product_id = p.id and g.subject_type = 'listing'
                 and g.outcome = 'publish' and g.consumed_at is not null
             )
        );
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
     and new.reviewed_at > now() - interval '15 minutes'
     and new.reviewed_at < now() + interval '5 minutes'
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

  -- A foreign key emptying a reference of a live listing (its store, category or brand
  -- is being deleted) changes what buyers see with no decision behind it. Refused like
  -- any such change — with the cause named.
  if tg_op = 'UPDATE' and v_was_live and (
       (old.vendor_id is not null and new.vendor_id is null)
       or (old.category_id is not null and new.category_id is null)
       or (old.brand_id is not null and new.brand_id is null)
     )
  then
    raise exception 'marketplace_publish_guard: listing "%" is live and uses the store, category or brand being removed; take it out of the catalogue or move it first', new.slug
      using errcode = 'P0001', hint = 'live_listing_reference';
  end if;

  if v_human_hold then
    raise exception 'marketplace_publish_guard: listing "%" has an open enforcement hold', new.slug
      using errcode = 'P0001', hint = 'enforcement_hold_active';
  end if;

  if v_verdict_id is not null and v_has_variants then
    raise exception 'marketplace_publish_guard: listing "%" carries variants, which need a person''s review', new.slug
      using errcode = 'P0001', hint = 'variants_need_review';
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
  v_staff boolean;
  v_trusted boolean;
  v_old_hash text;
begin
  if new.approval_status is distinct from 'approved' then
    -- A PERSON's rejection (or request for changes) upholds any open hide and binds
    -- the engine from then on: pressing Publish again goes back to a person. Only a
    -- genuine staff decision counts — a bare status write upholds nothing.
    if tg_op = 'UPDATE'
       and new.approval_status in ('rejected', 'changes_requested')
       and old.approval_status is distinct from new.approval_status
       and new.reviewed_by is not null
       and new.reviewed_at is not null
       and new.reviewed_at is distinct from old.reviewed_at
       and public.marketplace_gate_caller_is_trusted()
       and public.marketplace_gate_is_staff(new.reviewed_by)
    then
      update public.marketplace_listing_enforcement e
         set status = 'upheld',
             resolved_at = now(),
             resolved_by = new.reviewed_by,
             resolution = 'upheld_by_staff',
             media_snapshot = e.media_snapshot || public.marketplace_gate_listing_pictures(new.id)
       where e.product_id = new.id and e.status = 'active';
      -- Every listing a person turned down has its own row, with its pictures.
      if not exists (
        select 1 from public.marketplace_listing_enforcement e
         where e.product_id = new.id and e.kind <> 'policy' and e.status in ('active', 'upheld')
      ) then
        insert into public.marketplace_listing_enforcement
          (product_id, vendor_id, slug, kind, status, reasons, evidence, prior_status, engine_version,
           resolved_at, resolved_by, resolution, media_snapshot)
        values
          (new.id, new.vendor_id, new.slug, 'staff_decision', 'upheld', '{}'::text[],
           jsonb_build_object('decision', new.approval_status), coalesce(old.approval_status, 'draft'), 'db_guard',
           now(), new.reviewed_by, 'upheld_by_staff', public.marketplace_gate_listing_pictures(new.id));
      end if;
    end if;
    return null;
  end if;

  v_hash := public.marketplace_listing_content_hash(new);
  if tg_op = 'UPDATE' then
    v_was_live := (old.approval_status = 'approved');
    v_old_hash := public.marketplace_listing_content_hash(old);
    if v_was_live and v_old_hash = v_hash then
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
     and v.expires_at > now()
   order by v.created_at desc
   limit 1
   for update;

  -- Mirrors the guard exactly: an engine verdict is not what published this row
  -- if a person's hold stood or the listing carries variants — the staff branch was.
  if v_verdict_id is not null
     and not public.marketplace_gate_human_hold(new.id, new.vendor_id, new.slug)
     and not exists (
    select 1 from public.marketplace_product_variants x where x.product_id = new.id
  ) then
    update public.marketplace_listing_gate_verdicts v
       set consumed_at = clock_timestamp(),
           product_id = new.id,
           transition = case when v_was_live then 'live_edit' else 'go_live' end
     where v.id = v_verdict_id;

    -- A clean engine verdict lifts a policy hide; nothing else.
    update public.marketplace_listing_enforcement e
       set status = 'lifted',
           resolved_at = now(),
           resolution = 'cleared_by_gate'
     where e.product_id = new.id and e.status = 'active' and e.kind = 'policy';
    return null;
  end if;

  -- No engine verdict covers the row AS WRITTEN. The guard ran BEFORE the write,
  -- and a BEFORE trigger that sorts after it could have rewritten the row since:
  -- so the staff and company conditions are decided again here, on the final
  -- row, and anything else is refused. This is what makes "validated" and
  -- "written" the same row.
  v_trusted := public.marketplace_gate_caller_is_trusted();
  v_staff := coalesce(tg_op = 'UPDATE'
    and not v_was_live
    and v_old_hash = v_hash
    and v_trusted
    and new.reviewed_by is not null
    and new.reviewed_at is not null
    and new.reviewed_at is distinct from old.reviewed_at
    and new.reviewed_at > now() - interval '15 minutes'
    and new.reviewed_at < now() + interval '5 minutes'
    and public.marketplace_gate_is_staff(new.reviewed_by), false);
  v_company := not v_staff
    and v_trusted
    and new.inventory_owner_type = 'company'
    and public.marketplace_gate_is_company_vendor(new.vendor_id);
  if not v_staff and not v_company then
    raise exception 'marketplace_publish_guard: no recorded gate verdict for listing "%"', new.slug
      using errcode = 'P0001', hint = 'verdict_required';
  end if;

  select coalesce(array_agg(m.url order by m.sort_order, m.created_at), '{}'::text[])
    into v_media
    from public.marketplace_product_media m
   where m.product_id = new.id;

  insert into public.marketplace_listing_gate_verdicts
    (subject_type, product_id, vendor_id, slug, content_hash, media_refs, outcome, source,
     reasons, engine_version, actor_user_id, transition, consumed_at)
  values
    ('listing', new.id, new.vendor_id, new.slug, v_hash, v_media, 'publish',
     case when v_company then 'platform_catalog' else 'staff_review' end,
     '{}'::text[], 'db_guard',
     case when v_company then null else new.reviewed_by end,
     case when v_was_live then 'live_edit' else 'go_live' end,
     clock_timestamp());

  if not v_company then
    -- A person's approval settles everything that stood against the listing.
    update public.marketplace_listing_enforcement e
       set status = 'lifted',
           resolved_at = now(),
           resolved_by = new.reviewed_by,
           resolution = 'restored_by_staff'
     where e.status in ('active', 'upheld')
       and (e.product_id = new.id
            or (e.vendor_id = new.vendor_id and e.slug = new.slug
                and not exists (select 1 from public.marketplace_products p where p.id = e.product_id)));
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

  -- A picture is never moved off a live listing: a variant of that listing may
  -- still show it, and what it shows would then change with no decision behind it.
  if tg_op = 'UPDATE' and new.product_id is distinct from old.product_id then
    select p.approval_status, p.inventory_owner_type, p.vendor_id
      into v_status, v_owner_type, v_vendor
      from public.marketplace_products p
     where p.id = old.product_id
       for share;
    if found and v_status = 'approved' and not (
      public.marketplace_gate_caller_is_trusted()
      and v_owner_type = 'company'
      and public.marketplace_gate_is_company_vendor(v_vendor)
    ) then
      raise exception 'marketplace_media_guard: a picture cannot be moved off a live listing'
        using errcode = 'P0001', hint = 'media_not_covered';
    end if;
  end if;

  -- The listing row is LOCKED while it is read (FOR SHARE): a publish that is
  -- still in flight in another transaction has to finish first, so this guard
  -- never judges a listing "not live" a moment before it goes live.
  select p.approval_status, p.inventory_owner_type, p.vendor_id
    into v_status, v_owner_type, v_vendor
    from public.marketplace_products p
   where p.id = new.product_id
     for share;

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

-- A live listing is never left without a picture. Removing ONE picture of several
-- is the seller's own choice (the gate's gallery sync adds before it removes), but
-- the last one goes only with the listing out of the catalogue.
create or replace function public.marketplace_product_media_delete_guard()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_status text;
  v_owner_type text;
  v_vendor uuid;
begin
  if old.kind is distinct from 'image' then
    return old;
  end if;
  select p.approval_status, p.inventory_owner_type, p.vendor_id
    into v_status, v_owner_type, v_vendor
    from public.marketplace_products p
   where p.id = old.product_id
     for update; -- not FOR SHARE: two deletes of the last two pictures must queue, not pass each other
  if not found or v_status is distinct from 'approved' then
    return old; -- not live, or the listing itself is being deleted
  end if;
  if public.marketplace_gate_caller_is_trusted()
     and v_owner_type = 'company'
     and public.marketplace_gate_is_company_vendor(v_vendor)
  then
    return old;
  end if;
  -- Rows this same statement already deleted are not visible here, so a statement
  -- that removes every picture is refused when it reaches the last one.
  if not exists (
    select 1 from public.marketplace_product_media m
     where m.product_id = old.product_id and m.id <> old.id and m.kind = 'image'
  ) then
    raise exception 'marketplace_media_guard: a live listing cannot be left without a picture'
      using errcode = 'P0001', hint = 'media_not_covered';
  end if;
  return old;
end;
$$;

drop trigger if exists marketplace_product_media_delete_guard on public.marketplace_product_media;
create trigger marketplace_product_media_delete_guard
  before delete on public.marketplace_product_media
  for each row execute function public.marketplace_product_media_delete_guard();

drop trigger if exists marketplace_product_media_guard on public.marketplace_product_media;
create trigger marketplace_product_media_guard
  before insert or update on public.marketplace_product_media
  for each row execute function public.marketplace_product_media_guard();

-- ---------------------------------------------------------------------------
-- 5b. Variant guard. A variant's options, price and SKU are in front of buyers
--     on the product page, and no rule screens them. Until the engine does, the
--     position is default-deny: a variant's content cannot be added or changed
--     while its listing is live (take the listing out of the catalogue, change
--     it, and have a person approve it again), and the publish guard above does
--     not let the engine publish a listing that carries variants at all.
--     Stock, status, ordering and removal are not content and stay free.
-- ---------------------------------------------------------------------------
create or replace function public.marketplace_product_variant_guard()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_product uuid;
  v_status text;
  v_owner_type text;
  v_vendor uuid;
begin
  if tg_op = 'UPDATE'
     and new.product_id = old.product_id
     and new.sku is not distinct from old.sku
     and new.options is not distinct from old.options
     and new.price is not distinct from old.price
     and new.compare_at_price is not distinct from old.compare_at_price
     and new.currency is not distinct from old.currency
     and new.media_id is not distinct from old.media_id
  then
    return new; -- stock, status, ordering
  end if;

  foreach v_product in array
    case when tg_op = 'UPDATE' and new.product_id <> old.product_id
         then array[new.product_id, old.product_id]
         else array[new.product_id] end
  loop
    -- Locked while read, for the same reason as the media guard: a publish in
    -- flight elsewhere must finish before this row is judged "not live".
    select p.approval_status, p.inventory_owner_type, p.vendor_id
      into v_status, v_owner_type, v_vendor
      from public.marketplace_products p
     where p.id = v_product
       for share;

    if found and v_status = 'approved' and not (
      public.marketplace_gate_caller_is_trusted()
      and v_owner_type = 'company'
      and public.marketplace_gate_is_company_vendor(v_vendor)
    ) then
      raise exception 'marketplace_variant_guard: the variants of a live listing cannot change'
        using errcode = 'P0001', hint = 'verdict_required';
    end if;
  end loop;

  return new;
end;
$$;

drop trigger if exists marketplace_product_variant_guard on public.marketplace_product_variants;
create trigger marketplace_product_variant_guard
  before insert or update on public.marketplace_product_variants
  for each row execute function public.marketplace_product_variant_guard();

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
     and g.consumed_at > now() - interval '24 hours';
  select count(*) into v_delivered
    from public.marketplace_order_groups og
   where og.vendor_id = p_vendor_id and og.fulfillment_status = 'delivered';

  select * into v_prob from public.marketplace_seller_probation sp where sp.vendor_id = p_vendor_id;
  if found then
    v_tracked := true;
    v_started := v_prob.started_at;
    v_age_days := floor(extract(epoch from (now() - v_prob.started_at)) / 86400)::integer;
    if v_prob.graduated_at is null
       and v_identity
       and v_delivered >= (v_caps ->> 'graduation_min_delivered_orders')::integer
       and v_age_days >= (v_caps ->> 'graduation_min_days')::integer
    then
      update public.marketplace_seller_probation sp
         set graduated_at = now(), graduated_reason = 'criteria_met'
       where sp.vendor_id = p_vendor_id and sp.graduated_at is null;
      v_prob.graduated_at := now();
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
    -- The take-down that stands against this listing: an open one, or one a person
    -- upheld (which binds the engine until a person approves). By id or by handle.
    select jsonb_build_object('id', e.id, 'kind', e.kind, 'status', e.status,
                              'reasons', to_jsonb(e.reasons), 'created_at', e.created_at)
      into v_hide
      from public.marketplace_listing_enforcement e
     where ((v_pid is not null and e.product_id = v_pid) or (e.vendor_id = p_vendor_id and e.slug = p_slug))
       and (e.status = 'active' or (e.status = 'upheld' and e.kind <> 'policy'))
     order by (e.status = 'active') desc, e.created_at desc
     limit 1;
  end if;

  return jsonb_build_object(
    'vendor', jsonb_build_object(
      'id', v_vendor.id,
      -- A store whose owner's approval a person revoked reads as not active.
      'status', case when public.marketplace_gate_owner_revoked(v_vendor.owner_user_id) then 'revoked' else v_vendor.status end,
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
  v_standing_refs text[];
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

  -- The pictures this listing carried when it was last approved.
  if v_existing_id is not null then
    select g.media_refs
      into v_standing_refs
      from public.marketplace_listing_gate_verdicts g
     where g.product_id = v_existing_id
       and g.subject_type = 'listing'
       and g.outcome = 'publish'
       and g.consumed_at is not null
     order by g.consumed_at desc, g.created_at desc
     limit 1;
  end if;
  v_standing_refs := coalesce(v_standing_refs, '{}'::text[]);

  -- ---- DB floor: can only tighten -------------------------------------------
  if v_existing_id is not null and v_existing_vendor is distinct from p_vendor_id then
    v_outcome := 'reject';
    v_reasons := array['listing_conflict'];
  elsif v_outcome = 'publish' then
    if v_vendor_status is distinct from 'approved'
       or public.marketplace_gate_owner_revoked((select v.owner_user_id from public.marketplace_vendors v where v.id = p_vendor_id))
    then
      v_outcome := 'reject';
      v_reasons := v_reasons || 'seller_not_active'::text;
    elsif length(btrim(coalesce(v_row.title, ''))) = 0 then
      v_outcome := 'reject';
      v_reasons := v_reasons || 'incomplete_listing'::text;
    elsif coalesce(v_row.base_price, 0) <= 0 then
      v_outcome := 'reject';
      v_reasons := v_reasons || 'price_invalid'::text;
    elsif public.marketplace_gate_human_hold(v_existing_id, p_vendor_id, v_row.slug) then
      -- An open reports/risk take-down, one a person upheld, or a person's rejection.
      v_outcome := 'hold';
      v_reasons := v_reasons || 'enforcement_hold_active'::text;
    elsif exists (
      -- The same item listed again: a picture that is new to this listing is — byte
      -- for byte or perceptually — a picture of a listing of this store that a person
      -- has to decide, as it was when the hold was placed or as it is now. A picture
      -- this listing already carried when it was last approved, or one that is also
      -- on another live listing of the store (a size chart, a logo), says nothing
      -- about which item this is and is not counted.
      select 1
        from (
          select x.ref, f.sha256, f.phash, f.phash_aux
            from unnest(v_media) as x(ref)
            left join public.marketplace_image_fingerprints f on f.ref = x.ref
           where not (x.ref = any (v_standing_refs))
        ) posted
        join public.marketplace_listing_enforcement e
          on e.vendor_id = p_vendor_id
         and e.kind <> 'policy'
         and e.status in ('active', 'upheld')
        cross join lateral jsonb_array_elements(
          e.media_snapshot || public.marketplace_gate_listing_pictures(e.product_id)) as h(pic)
       where (posted.ref = h.pic ->> 'ref'
              or public.marketplace_gate_pictures_alike(
                   posted.sha256, posted.phash, posted.phash_aux,
                   h.pic ->> 'sha256', (h.pic ->> 'phash')::bigint, (h.pic ->> 'phash_aux')::bigint))
         and not exists (
           select 1
             from public.marketplace_products lp
             join public.marketplace_product_media lm on lm.product_id = lp.id
             left join public.marketplace_image_fingerprints lf on lf.ref = lm.url
            where lp.vendor_id = p_vendor_id
              and lp.approval_status = 'approved'
              and lp.id is distinct from v_existing_id
              and not public.marketplace_gate_human_hold(lp.id, lp.vendor_id, lp.slug)
              and (lm.url = posted.ref
                   or public.marketplace_gate_pictures_alike(
                        posted.sha256, posted.phash, posted.phash_aux, lf.sha256, lf.phash, lf.phash_aux))
         )
    ) then
      v_outcome := 'hold';
      v_reasons := v_reasons || 'enforcement_hold_active'::text;
    elsif v_existing_id is not null and exists (
      select 1 from public.marketplace_product_variants x where x.product_id = v_existing_id
    ) then
      -- The engine does not screen variants (section 5b): a person decides.
      v_outcome := 'hold';
      v_reasons := v_reasons || 'gate_unavailable'::text;
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
             and g.consumed_at > now() - interval '24 hours';
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
    v_expires := now() + interval '15 minutes';
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
     coalesce(nullif(btrim(p_engine_version), ''), 'unknown'), clock_timestamp())
  returning id into v_id;

  return jsonb_build_object('recorded', true, 'verdict_id', v_id);
end;
$$;

-- Live listings whose standing verdict was minted under ANOTHER engine version —
-- the content ruleset has moved since they were let through. Oldest first, so a
-- bounded sweep makes progress. Read only.
--
-- `origin` is who ORIGINALLY let the listing through: the source of its latest
-- consumed publish verdict that is not itself a re-scan. The sweep only takes
-- down what the engine approved; a listing a person approved goes back to a
-- person, however many clean re-scans it has had since.
drop function if exists public.marketplace_gate_rescan_candidates(text, integer);
create or replace function public.marketplace_gate_rescan_candidates(
  p_engine_version text,
  p_limit integer default 100
) returns table (product_id uuid, slug text, vendor_id uuid, source text, engine_version text, origin text)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p.id, p.slug, p.vendor_id, s.source, s.engine_version, o.source
    from public.marketplace_products p
    join lateral (
      select v.source, v.engine_version
        from public.marketplace_listing_gate_verdicts v
       where v.product_id = p.id
         and v.subject_type = 'listing'
         and v.outcome = 'publish'
         and v.consumed_at is not null
       order by v.consumed_at desc, v.created_at desc
       limit 1
    ) s on true
    left join lateral (
      select v.source
        from public.marketplace_listing_gate_verdicts v
       where v.product_id = p.id
         and v.subject_type = 'listing'
         and v.outcome = 'publish'
         and v.consumed_at is not null
         and v.source <> 'rescan'
       order by v.consumed_at desc, v.created_at desc
       limit 1
    ) o on true
   where p.approval_status = 'approved'
     and s.engine_version is distinct from p_engine_version
   order by p.updated_at asc nulls first, p.id
   limit greatest(1, least(coalesce(p_limit, 100), 500));
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
    (product_id, vendor_id, slug, kind, reasons, evidence, prior_status, engine_version, media_snapshot)
  values
    (v_row.id, v_row.vendor_id, v_row.slug, p_kind, v_reasons, coalesce(p_evidence, '{}'::jsonb), v_row.approval_status,
     coalesce(nullif(btrim(p_engine_version), ''), 'unknown'), public.marketplace_gate_listing_pictures(v_row.id))
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
drop function if exists public.marketplace_gate_register_image(text, text, bigint, bigint, uuid, uuid);
create or replace function public.marketplace_gate_register_image(
  p_ref text,
  p_sha256 text,
  p_phash bigint,
  p_bytes bigint,
  p_uploader uuid,
  p_vendor_id uuid,
  p_phash_aux bigint default null
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  -- Half a perceptual hash is no hash: both masks or neither.
  v_phash bigint := case when p_phash is null or p_phash_aux is null then null else p_phash end;
  v_phash_aux bigint := case when p_phash is null or p_phash_aux is null then null else p_phash_aux end;
begin
  if p_ref is null or length(btrim(p_ref)) = 0 or length(p_ref) > 600 then
    raise exception 'marketplace_gate_register_image: invalid ref' using errcode = 'check_violation';
  end if;
  if p_sha256 is null or p_sha256 !~ '^[0-9a-f]{64}$' then
    raise exception 'marketplace_gate_register_image: invalid sha256' using errcode = 'check_violation';
  end if;

  insert into public.marketplace_image_fingerprints (ref, sha256, phash, phash_aux, bytes, uploader_user_id, vendor_id)
  values (p_ref, p_sha256, v_phash, v_phash_aux, p_bytes, p_uploader, p_vendor_id)
  on conflict (ref) do update
    set vendor_id = coalesce(public.marketplace_image_fingerprints.vendor_id, excluded.vendor_id),
        uploader_user_id = coalesce(public.marketplace_image_fingerprints.uploader_user_id, excluded.uploader_user_id);

  return jsonb_build_object('registered', true);
end;
$$;

-- For each of the given refs: does this picture belong to someone else, or is it
-- already on another of this seller's listings?
--
--   foreign_ref  — the object itself was uploaded by another store: a copied
--                  reference. The upload flow can never produce this.
--   other_seller — another store registered the same picture FIRST: identical
--                  bytes, or a perceptual near-match.
--   same_seller  — the picture is already attached to a different listing of this
--                  store.
--
-- "First" matters: when a copier re-uploads a seller's photo, the ORIGINAL owner
-- must not be the one who gets flagged. Order is the fingerprint's created_at.
--
-- The perceptual match is tuned for PRECISION — a match holds an honest seller's
-- listing for a person. Both pictures must have real structure (at least 16
-- non-flat cells) and differ in at most p_max_distance of the 128 mask bits
-- (default 4, never more than 16).
drop function if exists public.marketplace_gate_image_matches(uuid, text, text[], integer);
create or replace function public.marketplace_gate_image_matches(
  p_vendor_id uuid,
  p_slug text,
  p_refs text[],
  p_max_distance integer default 4
) returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with mine as (
    select f.ref, f.sha256, f.phash, f.phash_aux, f.vendor_id, f.created_at
    from public.marketplace_image_fingerprints f
    where f.ref = any (coalesce(p_refs, '{}'::text[]))
  ),
  foreign_ref as (
    select m.ref, 'foreign_ref'::text as relation, 0 as distance
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
           else bit_count((o.phash # m.phash)::bit(64))::integer
              + bit_count((o.phash_aux # m.phash_aux)::bit(64))::integer end as distance
    from mine m
    join public.marketplace_image_fingerprints o
      on o.ref <> m.ref
     and (
       o.sha256 = m.sha256
       or (
         o.phash is not null and o.phash_aux is not null
         and m.phash is not null and m.phash_aux is not null
         and bit_count((o.phash | o.phash_aux)::bit(64)) >= 16
         and bit_count((m.phash | m.phash_aux)::bit(64)) >= 16
         and bit_count((o.phash # m.phash)::bit(64)) + bit_count((o.phash_aux # m.phash_aux)::bit(64))
             <= greatest(0, least(coalesce(p_max_distance, 4), 16))
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
drop function if exists public.marketplace_gate_instant_onboard(uuid, uuid, text[], jsonb, text);
create or replace function public.marketplace_gate_instant_onboard(
  p_actor uuid,
  p_application_id uuid,
  p_reasons text[],
  p_signals jsonb,
  p_engine_version text,
  -- The profile AS SCREENED by the caller: sha256 over the hex sha256 of the handle,
  -- the store name and the story, each on its own (so text cannot slide from one
  -- field into the next). The store is built from the application row, so the row
  -- must still be what was screened.
  p_profile_hash text
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
  v_profile_hash text;
begin
  if p_actor is null then
    raise exception 'marketplace_gate_instant_onboard: actor is required' using errcode = 'insufficient_privilege';
  end if;

  -- One onboarding at a time per account.
  perform pg_advisory_xact_lock(hashtextextended('marketplace_instant_onboard:' || p_actor::text, 0));

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
    -- The account already owns a store, so this application has nothing to wait
    -- for: it must not sit in the staff queue as a second, approvable request.
    update public.marketplace_vendor_applications a
       set status = 'approved'
     where a.id = p_application_id and a.status = 'submitted'
       and exists (select 1 from public.marketplace_vendors v where v.id = v_vendor_id and v.status = 'approved')
       and not public.marketplace_gate_owner_revoked(p_actor);
    return jsonb_build_object(
      'onboarded', false, 'why', 'already_seller', 'vendor_id', v_vendor_id,
      'vendor_status', (select v.status from public.marketplace_vendors v where v.id = v_vendor_id)
    );
  end if;

  -- A person withdrew this account's approval before: opening a store for it again
  -- is a person's decision too.
  if public.marketplace_gate_owner_revoked(p_actor) then
    raise exception 'marketplace_gate_instant_onboard: a person withdrew this account''s approval'
      using errcode = 'P0001', hint = 'prior_human_decision';
  end if;

  -- A person has already decided this application once (rejected it, or asked for
  -- changes). Submitting it again does not undo that: it goes back to a person.
  if v_app.reviewed_at is not null or v_app.reviewed_by is not null then
    raise exception 'marketplace_gate_instant_onboard: this application was decided by a person before'
      using errcode = 'P0001', hint = 'prior_human_decision';
  end if;

  -- The row is locked from here on. What it says NOW must be what the caller
  -- screened: a draft save that slipped in between the screen and this call
  -- changes the hash, and the store is not opened on text nobody checked.
  v_profile_hash := encode(sha256(convert_to(
    encode(sha256(convert_to(v_slug, 'UTF8')), 'hex')
    || encode(sha256(convert_to(btrim(v_app.store_name), 'UTF8')), 'hex')
    || encode(sha256(convert_to(coalesce(v_app.story, ''), 'UTF8')), 'hex'), 'UTF8')), 'hex');
  if p_profile_hash is null or p_profile_hash <> v_profile_hash then
    raise exception 'marketplace_gate_instant_onboard: the application changed after it was screened'
      using errcode = 'P0001', hint = 'profile_changed';
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
  -- (Two applicants racing for one handle: the unique index refuses the second.
  -- The handler below turns that into the same answer as the check above.)

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
     v_profile_hash,
     'publish', 'policy_engine', coalesce(p_reasons, '{}'::text[]), coalesce(p_signals, '{}'::jsonb),
     coalesce(nullif(btrim(p_engine_version), ''), 'unknown'), p_actor, clock_timestamp())
  returning id into v_verdict_id;

  -- The store-insert trigger below may already have enrolled the store (no
  -- documents on the application); either way it ends as an instant store.
  insert into public.marketplace_seller_probation (vendor_id, owner_user_id, source, onboarding_verdict_id)
  values (v_vendor_id, p_actor, 'instant_onboarding', v_verdict_id)
  on conflict (vendor_id) do update
    set source = 'instant_onboarding',
        onboarding_verdict_id = excluded.onboarding_verdict_id;

  -- No note: the column is shown to the seller, and what happened is on the ledger.
  update public.marketplace_vendor_applications a
     set status = 'approved',
         reviewed_at = now(),
         review_note = null
   where a.id = p_application_id;

  return jsonb_build_object(
    'onboarded', true,
    'vendor_id', v_vendor_id,
    'slug', v_slug,
    'verdict_id', v_verdict_id,
    'identity_verified', v_identity
  );
exception
  when unique_violation then
    raise exception 'marketplace_gate_instant_onboard: store handle is taken'
      using errcode = 'P0001', hint = 'store_handle_taken';
end;
$$;

-- ---------------------------------------------------------------------------
-- 10b. Every NEW store starts on the probation register — whoever opened it.
--      The human approval path never reviewed identity documents (the review
--      queue does not show them, and any string passes as one), so "a person
--      approved it" says nothing about who the seller is. A store that is created
--      — or handed an owner — after this gate is installed gets a probation row:
--      the new-store limits apply while instant publish is on, and the identity
--      check at payout applies whichever way the flag points.
--      Stores that existed before the gate are untouched (see the waivers below).
-- ---------------------------------------------------------------------------
create or replace function public.marketplace_vendors_probation_enroll()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  -- Only a store with an owner has someone to put on probation (the company's own
  -- store has none; a store of company type that names an owner is that owner's).
  if new.owner_user_id is null then
    return null;
  end if;
  if tg_op = 'UPDATE' and new.owner_user_id is not distinct from old.owner_user_id then
    return null; -- nothing about who owns the store changed
  end if;

  insert into public.marketplace_seller_probation (vendor_id, owner_user_id, source)
  values (new.id, new.owner_user_id, 'staff_approved')
  on conflict (vendor_id) do update
    set owner_user_id = excluded.owner_user_id,
        source = excluded.source,
        onboarding_verdict_id = null,
        started_at = now(),
        graduated_at = null,
        graduated_reason = null
  where public.marketplace_seller_probation.owner_user_id is distinct from excluded.owner_user_id;
  return null;
end;
$$;

drop trigger if exists marketplace_vendors_probation_enroll on public.marketplace_vendors;
create trigger marketplace_vendors_probation_enroll
  after insert or update of owner_user_id, owner_type on public.marketplace_vendors
  for each row execute function public.marketplace_vendors_probation_enroll();

-- A store never changes hands, and a seller's store never becomes company
-- inventory, by an UPDATE. The legacy approval writes the store with an upsert on
-- its handle: without this, approving an application that names an existing
-- store's handle would hand that store — and its balance — to the applicant.
create or replace function public.marketplace_vendors_owner_guard()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  -- What kind of store it is never changes: a seller's store does not become the
  -- company's catalogue, and the company's store is never handed to a seller.
  if new.owner_type is distinct from old.owner_type then
    raise exception 'marketplace_vendor_guard: a store''s type cannot be changed'
      using errcode = 'P0001', hint = 'store_type_immutable';
  end if;
  if new.owner_user_id is distinct from old.owner_user_id then
    -- The one change allowed: the owner's account was deleted (the foreign key sets
    -- the owner to NULL). The store is then nobody's, and stays that way — an
    -- owner is only ever set when a store is created.
    if new.owner_user_id is null
       and old.owner_user_id is not null
       and not exists (select 1 from auth.users u where u.id = old.owner_user_id)
    then
      return new;
    end if;
    raise exception 'marketplace_vendor_guard: a store''s owner cannot be changed'
      using errcode = 'P0001', hint = 'store_owner_immutable';
  end if;
  return new;
end;
$$;

drop trigger if exists marketplace_vendors_owner_guard on public.marketplace_vendors;
create trigger marketplace_vendors_owner_guard
  before update of owner_user_id, owner_type on public.marketplace_vendors
  for each row execute function public.marketplace_vendors_owner_guard();

-- ---------------------------------------------------------------------------
-- 11. Payout identity. Identity no longer stands in front of a listing, so it
--     must stand in front of the money. payoutEligibility in TS is the first
--     wall; this is the second, and it FAILS CLOSED: a payout needs a verified
--     owner. The only exception is a store that existed before this gate was
--     installed — recorded once, below, against the owner it had then. A store
--     with no owner, a new owner or no record is refused. It can only REFUSE:
--     no payment object is read or written.
-- ---------------------------------------------------------------------------
do $$
begin
  -- Created and filled ONCE. A second apply finds the table and leaves it alone:
  -- stores opened since the first apply must not be waived by a re-run.
  if to_regclass('public.marketplace_seller_identity_waivers') is null then
    create table public.marketplace_seller_identity_waivers (
      vendor_id uuid primary key references public.marketplace_vendors (id) on delete cascade,
      -- The waiver is the OWNER's: it stops applying if the store's owner is not this account.
      owner_user_id uuid not null,
      reason text not null default 'pre_gate' check (reason in ('pre_gate')),
      created_at timestamptz not null default now()
    );
    insert into public.marketplace_seller_identity_waivers (vendor_id, owner_user_id, reason)
    select v.id, v.owner_user_id, 'pre_gate'
      from public.marketplace_vendors v
     where v.owner_user_id is not null
       and not exists (select 1 from public.marketplace_seller_probation p where p.vendor_id = v.id);
  end if;
end $$;

alter table public.marketplace_seller_identity_waivers enable row level security;
revoke all on public.marketplace_seller_identity_waivers from public, anon, authenticated, service_role;
grant select on public.marketplace_seller_identity_waivers to service_role;

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
  v_waived boolean;
  v_owner_type text;
begin
  select v.owner_user_id, v.status, v.owner_type into v_owner, v_status, v_owner_type
    from public.marketplace_vendors v
   where v.id = p_vendor_id;
  if not found then
    return jsonb_build_object('vendor_found', false);
  end if;
  v_identity := public.marketplace_gate_identity_verified(v_owner);
  v_tracked := exists (select 1 from public.marketplace_seller_probation p where p.vendor_id = p_vendor_id);
  v_waived := v_owner is not null and exists (
    select 1 from public.marketplace_seller_identity_waivers w
    where w.vendor_id = p_vendor_id and w.owner_user_id = v_owner
  );
  return jsonb_build_object(
    'vendor_found', true,
    'vendor_status', v_status,
    'owner_user_id', v_owner,
    'identity_verified', v_identity,
    'identity_waived', v_waived,
    'company_store', v_owner_type is not distinct from 'company' and v_owner is null,
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
  v_owner_type text;
  -- Read tolerantly: 'Requested' and ' requested ' are the same request.
  v_status text := lower(btrim(coalesce(new.status, 'requested')));
begin
  if new.vendor_id is null then
    return new;
  end if;
  -- A request that is plainly closed moves no money. Everything else — open,
  -- being paid, or a status this guard has never heard of — is checked.
  if v_status in ('rejected', 'frozen', 'cancelled', 'canceled', 'declined', 'failed', 'void') then
    return new;
  end if;
  -- An update is re-checked when it changes the status OR the store the request
  -- belongs to (a request cannot be re-pointed past the wall).
  if tg_op = 'UPDATE'
     and lower(btrim(coalesce(old.status, 'requested'))) = v_status
     and new.vendor_id is not distinct from old.vendor_id
  then
    return new;
  end if;

  select v.owner_user_id, v.owner_type into v_owner, v_owner_type
    from public.marketplace_vendors v
   where v.id = new.vendor_id;
  -- The company's own store (company type, no owner) moves no seller's money.
  if not found or (v_owner_type is not distinct from 'company' and v_owner is null) then
    return new;
  end if;

  if v_owner is not null and public.marketplace_gate_identity_verified(v_owner) then
    return new;
  end if;
  if v_owner is not null and exists (
    select 1 from public.marketplace_seller_identity_waivers w
    where w.vendor_id = new.vendor_id and w.owner_user_id = v_owner
  ) then
    return new; -- a store that existed before the gate, still with the owner it had
  end if;

  raise exception 'marketplace_payout_identity_guard: identity verification is required before a payout'
    using errcode = 'P0001', hint = 'identity_unverified';
end;
$$;

drop trigger if exists marketplace_payout_identity_guard on public.marketplace_payout_requests;
create trigger marketplace_payout_identity_guard
  before insert or update on public.marketplace_payout_requests
  for each row execute function public.marketplace_payout_identity_guard();

-- Accounts that were old enough WHEN THEY REPORTED to count as independent
-- reporters (each reporter is paired with the time of their first report in the
-- window). Read from auth.users — a profile row is the user's own to edit, its
-- dates included.
drop function if exists public.marketplace_gate_established_accounts(uuid[], integer);
create or replace function public.marketplace_gate_established_accounts(
  p_users uuid[],
  p_reported_at timestamptz[],
  p_min_age_days integer default 7
) returns setof uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select u.id
    from unnest(coalesce(p_users, '{}'::uuid[]), coalesce(p_reported_at, '{}'::timestamptz[])) as r(user_id, reported_at)
    join auth.users u on u.id = r.user_id
   where r.reported_at is not null
     and u.created_at <= r.reported_at - make_interval(days => greatest(coalesce(p_min_age_days, 7), 0));
$$;

-- ---------------------------------------------------------------------------
-- 12. Grants. Supabase grants EXECUTE on every new function to anon and
--     authenticated DIRECTLY (default privileges), so `revoke from public` alone
--     leaves them callable. Every function is revoked from the request roles by
--     name; only the RPCs the TS gate calls are granted, and only to service_role.
-- ---------------------------------------------------------------------------
revoke all on function public.marketplace_listing_content_hash(public.marketplace_products) from public, anon, authenticated;
revoke all on function public.marketplace_gate_probation_caps() from public, anon, authenticated;
revoke all on function public.marketplace_gate_granted_memberships(uuid) from public, anon, authenticated, service_role;
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
revoke all on function public.marketplace_product_variant_guard() from public, anon, authenticated, service_role;
revoke all on function public.marketplace_vendors_probation_enroll() from public, anon, authenticated, service_role;
revoke all on function public.marketplace_vendors_owner_guard() from public, anon, authenticated, service_role;
revoke all on function public.marketplace_product_media_delete_guard() from public, anon, authenticated, service_role;
revoke all on function public.marketplace_gate_human_hold(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.marketplace_gate_established_accounts(uuid[], timestamptz[], integer) from public, anon, authenticated;
revoke all on function public.marketplace_gate_owner_revoked(uuid) from public, anon, authenticated;
revoke all on function public.marketplace_gate_pictures_alike(text, bigint, bigint, text, bigint, bigint) from public, anon, authenticated;
revoke all on function public.marketplace_gate_listing_pictures(uuid) from public, anon, authenticated;
revoke all on function public.marketplace_vendor_applications_revocation() from public, anon, authenticated, service_role;
revoke all on function public.marketplace_gate_seller_state(uuid, text) from public, anon, authenticated;
revoke all on function public.marketplace_gate_record_listing_verdict(uuid, uuid, jsonb, text[], text, text[], jsonb, text, text) from public, anon, authenticated;
revoke all on function public.marketplace_gate_record_rescan(uuid, text) from public, anon, authenticated;
revoke all on function public.marketplace_gate_rescan_candidates(text, integer) from public, anon, authenticated;
revoke all on function public.marketplace_gate_hide_listing(uuid, text, text[], jsonb, text) from public, anon, authenticated;
revoke all on function public.marketplace_gate_register_image(text, text, bigint, bigint, uuid, uuid, bigint) from public, anon, authenticated;
revoke all on function public.marketplace_gate_image_matches(uuid, text, text[], integer) from public, anon, authenticated;
revoke all on function public.marketplace_gate_instant_onboard(uuid, uuid, text[], jsonb, text, text) from public, anon, authenticated;
revoke all on function public.marketplace_gate_payout_eligibility(uuid) from public, anon, authenticated;

grant execute on function public.marketplace_gate_probation_caps() to service_role;
grant execute on function public.marketplace_gate_seller_state(uuid, text) to service_role;
grant execute on function public.marketplace_gate_record_listing_verdict(uuid, uuid, jsonb, text[], text, text[], jsonb, text, text) to service_role;
grant execute on function public.marketplace_gate_record_rescan(uuid, text) to service_role;
grant execute on function public.marketplace_gate_rescan_candidates(text, integer) to service_role;
grant execute on function public.marketplace_gate_hide_listing(uuid, text, text[], jsonb, text) to service_role;
grant execute on function public.marketplace_gate_register_image(text, text, bigint, bigint, uuid, uuid, bigint) to service_role;
grant execute on function public.marketplace_gate_image_matches(uuid, text, text[], integer) to service_role;
grant execute on function public.marketplace_gate_instant_onboard(uuid, uuid, text[], jsonb, text, text) to service_role;
grant execute on function public.marketplace_gate_established_accounts(uuid[], timestamptz[], integer) to service_role;
grant execute on function public.marketplace_gate_payout_eligibility(uuid) to service_role;

-- A trigger added to a guarded table by a request role would run BEFORE or AFTER
-- the guard and could rewrite what it checked. No request role needs to create
-- triggers on, or truncate, these tables.
revoke trigger, truncate on public.marketplace_products         from public, anon, authenticated, service_role;
revoke trigger, truncate on public.marketplace_product_media    from public, anon, authenticated, service_role;
revoke trigger, truncate on public.marketplace_product_variants from public, anon, authenticated, service_role;
revoke trigger, truncate on public.marketplace_payout_requests  from public, anon, authenticated, service_role;
revoke trigger, truncate on public.marketplace_vendors          from public, anon, authenticated, service_role;
revoke trigger, truncate on public.marketplace_vendor_applications  from public, anon, authenticated, service_role;

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
  'publish', 'pre_guard_backfill', '{}'::text[], 'pre_guard', 'go_live', now()
from public.marketplace_products p
where p.approval_status = 'approved'
  and not exists (
    select 1 from public.marketplace_listing_gate_verdicts v
    where v.product_id = p.id and v.outcome = 'publish' and v.consumed_at is not null
  );
