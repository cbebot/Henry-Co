-- =============================================================================
-- V3-58 — Seller-tier badge engine (deterministic, server-derived)
-- =============================================================================
-- WHY: turns the Learn Seller Academy + real marketplace performance into a
-- single Bronze/Silver/Gold tier per BUSINESS (V3-57 identity). The tier is
-- DERIVED, never self-asserted: it is recomputed server-side from VERIFIED inputs
-- only (a member's verified Learn completions + delivered marketplace orders +
-- published review ratings) and snapshotted for audit.
--
-- TABLES: public.seller_tiers (one row per business, keyed on businesses.id).
--   NOTE: distinct from the existing marketplace_vendors.seller_tier COLUMN
--   (launch/growth/scale/partner billing tiers). This is a business-scoped
--   academy/quality tier; the two never collide (table vs column, different keys).
--
-- RLS: default-deny. A business member reads its own tier (via the V3-57
--   SECURITY DEFINER helper is_business_member, recursion-safe). There is NO
--   client write path — only recompute_seller_tier() (SECURITY DEFINER,
--   service_role-execute) writes, so a seller can never assert a tier.
--
-- DEPENDS ON: V3-57 (public.businesses / public.business_members + helpers,
--   migration 20260618120000_v3_57_business_profiles.sql) and the base
--   marketplace + learn schemas. Applies AFTER them by timestamp order.
--
-- BRIDGE / V3-50 SEAM: businesses are not directly linked to marketplace_vendors;
--   the bridge is marketplace_vendors.owner_user_id ∈ the business's members.
--   Until a business links a vendor (and a real quality engine lands, V3-50), the
--   transaction/rating signals resolve to 0/null and the realistic ceiling is
--   Bronze — by design, not a bug.
--
-- DOWN: drop function recompute_seller_tier(uuid); drop table seller_tiers.
-- IDEMPOTENT: create-if-not-exists / create-or-replace / drop-policy-if-exists.
-- =============================================================================

set check_function_bodies = off;  -- references cross-division tables (learn_*, marketplace_*)

-- -----------------------------------------------------------------------------
-- Table
-- -----------------------------------------------------------------------------
create table if not exists public.seller_tiers (
  business_id  uuid primary key references public.businesses(id) on delete cascade,
  tier         text not null default 'none'
                 check (tier in ('none','bronze','silver','gold')),
  computed_at  timestamptz not null default now(),
  inputs       jsonb not null default '{}'::jsonb   -- snapshot of the signals that produced the tier
);

comment on table public.seller_tiers is
  'V3-58: server-derived Bronze/Silver/Gold academy+quality tier per business. '
  'Written ONLY by recompute_seller_tier() (SECURITY DEFINER). Distinct from the '
  'marketplace_vendors.seller_tier billing column. inputs = audit snapshot.';

-- -----------------------------------------------------------------------------
-- Row Level Security (default-deny): member-read only; no client write path.
-- -----------------------------------------------------------------------------
alter table public.seller_tiers enable row level security;

drop policy if exists seller_tiers_member_read on public.seller_tiers;
create policy seller_tiers_member_read on public.seller_tiers
  for select to authenticated
  using (public.is_business_member(business_id, auth.uid()));

-- No insert/update/delete policy: service_role bypasses RLS for the recompute
-- path; every other writer is denied. (Mirrors the V3-58 spec's "only the
-- recompute RPC writes; no direct client write policy".)

-- -----------------------------------------------------------------------------
-- recompute_seller_tier(business_id): derive the tier from VERIFIED signals and
-- upsert it. SECURITY DEFINER so it can read cross-division tables + bypass RLS
-- to write; service_role-execute only, so there is no client-callable write path.
--
-- Thresholds mirror apps/marketplace/lib/marketplace/seller-tier-engine.ts
-- (deriveSellerTier) 1:1 — keep them in lockstep:
--   bronze: foundational course completed
--   silver: foundational + intermediate AND >= 50 delivered txns
--   gold  : all three courses AND >= 200 delivered txns AND >= 4.5 avg rating
--
-- Returns a jsonb delta { businessId, previousTier, tier, changed, inputs } so the
-- caller (cron / completion hook) can write the audit log + emit telemetry on a
-- change. The function itself never audits (audit is the app helper's job and
-- requires staff/service-role context).
-- -----------------------------------------------------------------------------
create or replace function public.recompute_seller_tier(p_business_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_members        uuid[];
  v_vendor_ids     uuid[];
  v_foundational   boolean := false;
  v_intermediate   boolean := false;
  v_advanced       boolean := false;
  v_txns           integer := 0;
  v_avg            numeric;
  v_prev           text;
  v_tier           text;
  v_inputs         jsonb;
  -- Stable Seller Academy course slugs (seeded in apps/learn/lib/learn/seed.ts).
  c_foundational   constant text := 'becoming-a-verified-seller';
  c_intermediate   constant text := 'optimizing-your-storefront';
  c_advanced       constant text := 'premium-seller-best-practices';
begin
  if p_business_id is null then
    raise exception 'business id required' using errcode = '22004';
  end if;
  if not exists (select 1 from public.businesses where id = p_business_id) then
    raise exception 'unknown business %', p_business_id using errcode = '22023';
  end if;

  -- Business members (the people whose verified completions + vendor count).
  select coalesce(array_agg(user_id), '{}'::uuid[])
    into v_members
    from public.business_members
   where business_id = p_business_id;

  -- VERIFIED course signals: any member with a completed enrollment for the
  -- academy course (learn_enrollments.status = 'completed').
  if array_length(v_members, 1) is not null then
    select
      bool_or(c.slug = c_foundational),
      bool_or(c.slug = c_intermediate),
      bool_or(c.slug = c_advanced)
      into v_foundational, v_intermediate, v_advanced
      from public.learn_enrollments e
      join public.learn_courses c on c.id = e.course_id
     where e.user_id = any(v_members)
       and e.status = 'completed'
       and c.slug in (c_foundational, c_intermediate, c_advanced);

    -- Bridge business → marketplace vendor(s) via owner_user_id.
    select coalesce(array_agg(id), '{}'::uuid[])
      into v_vendor_ids
      from public.marketplace_vendors
     where owner_user_id = any(v_members);
  end if;

  v_foundational := coalesce(v_foundational, false);
  v_intermediate := coalesce(v_intermediate, false);
  v_advanced     := coalesce(v_advanced, false);
  v_vendor_ids   := coalesce(v_vendor_ids, '{}'::uuid[]);

  -- VERIFIED transaction signal: delivered order groups for the linked vendor(s).
  if array_length(v_vendor_ids, 1) is not null then
    select count(*)::integer
      into v_txns
      from public.marketplace_order_groups
     where vendor_id = any(v_vendor_ids)
       and fulfillment_status = 'delivered';

    -- VERIFIED rating signal: published, rated reviews (matches the app's read).
    select avg(rating)::numeric
      into v_avg
      from public.marketplace_reviews
     where vendor_id = any(v_vendor_ids)
       and status = 'published'
       and rating > 0;
  end if;

  v_txns := coalesce(v_txns, 0);

  -- Derive tier (1:1 mirror of deriveSellerTier).
  v_tier := case
    when v_foundational and v_intermediate and v_advanced
         and v_txns >= 200 and v_avg is not null and v_avg >= 4.5 then 'gold'
    when v_foundational and v_intermediate and v_txns >= 50 then 'silver'
    when v_foundational then 'bronze'
    else 'none'
  end;

  v_inputs := jsonb_build_object(
    'foundationalCourseCompleted', v_foundational,
    'intermediateCourseCompleted', v_intermediate,
    'advancedCourseCompleted',     v_advanced,
    'completedTransactions',       v_txns,
    'averageRating',               v_avg,
    'linkedVendorIds',             to_jsonb(v_vendor_ids),
    'memberCount',                 coalesce(array_length(v_members, 1), 0),
    'courseSlugs', jsonb_build_object(
      'foundational', c_foundational, 'intermediate', c_intermediate, 'advanced', c_advanced),
    'source',                      'recompute_seller_tier',
    'computedAt',                  to_jsonb(now())
  );

  select tier into v_prev from public.seller_tiers where business_id = p_business_id;

  insert into public.seller_tiers (business_id, tier, computed_at, inputs)
    values (p_business_id, v_tier, now(), v_inputs)
  on conflict (business_id) do update
    set tier = excluded.tier,
        computed_at = excluded.computed_at,
        inputs = excluded.inputs;

  return jsonb_build_object(
    'businessId',   p_business_id,
    'previousTier', coalesce(v_prev, 'none'),
    'tier',         v_tier,
    'changed',      coalesce(v_prev, 'none') <> v_tier,
    'inputs',       v_inputs
  );
end
$$;

comment on function public.recompute_seller_tier(uuid) is
  'V3-58: derive + upsert a business seller tier from verified signals only '
  '(member Learn completions + delivered orders + published ratings via the '
  'owner_user_id vendor bridge). Returns a jsonb delta for the caller to audit/emit.';

revoke all on function public.recompute_seller_tier(uuid) from public;
grant execute on function public.recompute_seller_tier(uuid) to service_role;
