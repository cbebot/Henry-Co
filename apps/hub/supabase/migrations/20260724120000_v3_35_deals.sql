-- =============================================================================
-- V3-35 — Deals & campaigns (Phase E, Wave E.2)
--
-- Adds the ONE ecosystem deal model: `deals` (time-boxed offer ARTIFACTS) +
-- `deal_impressions` (the fairness-audit ledger), and reconciles the applied
-- staff-curated `marketplace_deals_curation` table into it (rows migrate in;
-- the old table is MARKED SUPERSEDED, not dropped — its reader now prefers the
-- new model and falls back only while this migration is unapplied).
--
-- MONEY BOUNDARY (absolute): a deal is an OFFER ARTIFACT, never a price
-- mutation. `fixed_off` amounts are INTEGER MINOR UNITS with an explicit ISO
-- 4217 currency; percentages are INTEGERS — no floats anywhere. NOTHING here
-- touches checkout, payments_private, or any money RPC. Any discount that ever
-- reaches checkout is applied by the behavior-locked payment surface as a
-- verified, idempotent, ledger-true line item — never from this table directly.
--
-- APPROVAL: reuses the SHIPPED V3-25 moderation framework — the `deal` content
-- type is added to moderation_decisions/moderation_reports CHECKs below
-- (guarded), so deal submissions flow through the same publish-gate ledger as
-- listings/posts/briefs. No parallel approval machine exists.
--
-- NDPR / NDPA 2023 posture (docs/v3/personalization/PRIVACY-NDPR.md):
--   * deals — public offer catalog; carries NO personal data. `audience_signals`
--       stores targeting DESCRIPTORS (division/category/lifecycle enums) only —
--       never user ids, never PII. Deal TARGETING of a person is consent-gated
--       in the app layer (customer_preferences.personalization_enabled, V3-34);
--       the untargeted division-local list is the floor every user sees.
--   * deal_impressions — service-role-appended audit rows for the fairness
--       audit (which creator got seen). Own rows are a DSAR export source
--       (manual procedure, service-role). Intended retention: rolling 90-day
--       audit window; beyond it only aggregates (counts per deal/creator) are
--       kept for owner tiles (V3-90/92 own the prune rail). Reads are
--       staff/owner + service_role only — end users never read impressions.
--
-- No-cross-leak invariant (Phase E Prime Directive 10): request roles can
-- read ONLY live public deals (or their own drafts as creator; staff read all
-- via is_staff_in_any). Request roles have ZERO write privileges on either
-- table — all writes flow through audited service-role server actions.
-- Proven by apps/hub/supabase/tests/deals_grant_invariant.sql +
-- deals_rls_behaviour.sql (CI, payments-grant-invariant job).
-- =============================================================================

begin;

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- 0. CI-fidelity guard: public.is_staff_in_any() ships in
--    20260508120000_is_staff_in_any.sql and exists on prod. On the fresh CI
--    invariant DB it is absent — create a FAIL-CLOSED stub (returns false ⇒
--    staff read nothing) so the policies below are creatable and deny-by-
--    default. On prod this block no-ops (the real function exists).
-- ---------------------------------------------------------------------------
do $$
begin
  if to_regprocedure('public.is_staff_in_any()') is null then
    create function public.is_staff_in_any()
    returns boolean
    language sql
    stable
    security definer
    set search_path to 'public', 'pg_catalog'
    as 'select false';
    raise notice 'is_staff_in_any absent (fresh CI DB) — created fail-closed stub';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 1. deals — the ecosystem offer-artifact model.
--    Artifact-shape invariants are CHECK-enforced:
--      percent_off  -> discount_percent (integer 1..100), no minor amount
--      fixed_off    -> discount_minor (integer minor units) + ISO currency
--      bogo/bundle/spotlight -> no discount fields at all
--    `spotlight` is the legacy curation semantic (a featured pick with no
--    discount artifact) so migrated rows keep an honest type.
-- ---------------------------------------------------------------------------
create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  -- Nullable forward reference; the FK lands when V3-50 ships `partners`.
  creator_partner_id uuid,
  -- NULL only for system-migrated legacy curation rows (source below); app
  -- writes always set it. ON DELETE SET NULL keeps offer history when an
  -- authoring account closes (the artifact itself carries no personal data).
  created_by uuid references auth.users (id) on delete set null,
  source text not null default 'platform'
    check (source in ('platform', 'partner', 'curation_migration')),
  title text not null,
  description text,
  deal_type text not null
    check (deal_type in ('percent_off', 'fixed_off', 'bogo', 'bundle', 'spotlight')),
  -- INTEGER percent (1..100) — never a float.
  discount_percent integer
    check (discount_percent between 1 and 100),
  -- INTEGER minor units (kobo/cents) — never a float.
  discount_minor bigint
    check (discount_minor > 0),
  -- ISO 4217 uppercase; required with fixed_off.
  discount_currency text
    check (discount_currency ~ '^[A-Z]{3}$'),
  -- Division slug; null = cross-division.
  scope_division text,
  scope_categories text[] not null default '{}',
  -- Reference to the promoted item (e.g. a marketplace product slug). A
  -- REFERENCE only — never denormalized content, never PII.
  target_ref text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'draft'
    check (status in ('draft', 'pending_review', 'approved', 'active', 'paused', 'expired', 'rejected')),
  visibility text not null default 'public'
    check (visibility in ('public', 'targeted', 'unlisted')),
  -- Targeting DESCRIPTORS only (divisions/categories/lifecycle enums). Never
  -- user ids, never PII. Consent gates whether a person is MATCHED to these.
  audience_signals jsonb not null default '{}'::jsonb,
  approved_by uuid references auth.users (id) on delete set null,
  approved_at timestamptz,
  -- Idempotency key for the one-time curation reconciliation below.
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

create index if not exists deals_live_idx
  on public.deals (status, starts_at, ends_at)
  where status = 'active';

create index if not exists deals_division_idx
  on public.deals (scope_division, status);

create index if not exists deals_creator_idx
  on public.deals (created_by, created_at desc);

-- Feature-local updated_at trigger (repo convention: per-table fn with a
-- pinned search_path — the FIRE lesson; no shared set_updated_at exists).
create or replace function public.deals_set_updated_at()
returns trigger
language plpgsql
set search_path to 'public', 'pg_catalog'
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_deals_updated_at on public.deals;
create trigger set_deals_updated_at
  before update on public.deals
  for each row execute function public.deals_set_updated_at();

alter table public.deals enable row level security;

-- Explicit grants (never lean on implicit defaults — SEC-HARDEN-06 lesson).
-- Request roles READ ONLY: every write flows through audited service-role
-- server actions (hub owner/staff authoring; partner authoring activates with
-- V3-50, which may add creator write policies then — deliberately not now).
revoke insert, update, delete, truncate on public.deals from anon, authenticated, public;
grant select on public.deals to anon, authenticated;
grant all on public.deals to service_role;

-- Public read: only currently-live public/targeted deals. (Whether a viewer is
-- MATCHED to a targeted deal is a consent-gated app-layer decision; the row
-- itself carries no personal data.)
drop policy if exists deals_select_live on public.deals;
create policy deals_select_live on public.deals
  for select to anon, authenticated
  using (
    status = 'active'
    and now() >= starts_at
    and now() < ends_at
    and visibility in ('public', 'targeted')
  );

-- Creators read their own rows in any status (drafts, pending, rejected).
drop policy if exists deals_select_own on public.deals;
create policy deals_select_own on public.deals
  for select to authenticated
  using ((select auth.uid()) = created_by);

-- Staff/owner read everything (review queue, fairness tiles).
drop policy if exists deals_select_staff on public.deals;
create policy deals_select_staff on public.deals
  for select to authenticated
  using (public.is_staff_in_any());

-- Belt-and-suspenders service-role policy (service_role also has bypassrls).
drop policy if exists deals_service_all on public.deals;
create policy deals_service_all on public.deals
  for all to service_role
  using (true) with check (true);

-- ---------------------------------------------------------------------------
-- 2. deal_impressions — the fairness-audit ledger. APPEND-ONLY, service-role
--    writes BATCHED by the server (one statement per surface render; the
--    client never drives an impression write). Staff/owner read for the
--    fairness audit; end users never read impressions.
-- ---------------------------------------------------------------------------
create table if not exists public.deal_impressions (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.deals (id) on delete cascade,
  -- Nullable: anonymous surfaces record NULL. CASCADE: impressions delete
  -- with the account (DSAR deletion class: delete-with-account).
  user_id uuid references auth.users (id) on delete cascade,
  surface text not null
    check (surface in ('home_module', 'all_deals', 'division_mini')),
  shown_at timestamptz not null default now()
);

create index if not exists deal_impressions_deal_idx
  on public.deal_impressions (deal_id, shown_at);

create index if not exists deal_impressions_window_idx
  on public.deal_impressions (shown_at);

alter table public.deal_impressions enable row level security;

-- anon: nothing. authenticated: SELECT grant so the staff policy can return
-- rows — non-staff get ZERO rows (no other policy). No request-role writes.
-- service_role: SELECT + INSERT only — append-only even for the admin client.
revoke all on public.deal_impressions from anon;
revoke insert, update, delete, truncate on public.deal_impressions from authenticated, public;
grant select on public.deal_impressions to authenticated;
revoke update, delete, truncate on public.deal_impressions from service_role;
grant select, insert on public.deal_impressions to service_role;

drop policy if exists deal_impressions_staff_select on public.deal_impressions;
create policy deal_impressions_staff_select on public.deal_impressions
  for select to authenticated
  using (public.is_staff_in_any());

drop policy if exists deal_impressions_service_select on public.deal_impressions;
create policy deal_impressions_service_select on public.deal_impressions
  for select to service_role
  using (true);

drop policy if exists deal_impressions_service_insert on public.deal_impressions;
create policy deal_impressions_service_insert on public.deal_impressions
  for insert to service_role
  with check (true);

-- ---------------------------------------------------------------------------
-- 3. Reconcile marketplace_deals_curation (applied on prod; staff-curated)
--    into the ONE deal model. Guarded by to_regclass (the table is absent on
--    the vanilla CI DB unless the fidelity seed created it). Idempotent via
--    legacy_curation_id. The old table is NOT dropped in this pass — its
--    reader now prefers `deals` and the table is marked superseded.
-- ---------------------------------------------------------------------------
do $$
begin
  if to_regclass('public.marketplace_deals_curation') is not null then
    insert into public.deals (
      created_by,
      source,
      title,
      description,
      deal_type,
      scope_division,
      target_ref,
      starts_at,
      ends_at,
      status,
      visibility,
      approved_at,
      legacy_curation_id,
      created_at,
      updated_at
    )
    select
      case
        when c.curator_user_id is not null
          and exists (select 1 from auth.users u where u.id = c.curator_user_id)
        then c.curator_user_id
        else null
      end,
      'curation_migration',
      initcap(replace(c.product_slug, '-', ' ')),
      c.note,
      'spotlight',
      'marketplace',
      c.product_slug,
      c.starts_at,
      coalesce(c.ends_at, c.starts_at + interval '365 days'),
      case
        when c.active and (c.ends_at is null or c.ends_at > now()) then 'active'
        else 'expired'
      end,
      'public',
      c.created_at,
      c.id,
      c.created_at,
      c.updated_at
    from public.marketplace_deals_curation c
    on conflict (legacy_curation_id) do nothing;

    comment on table public.marketplace_deals_curation is
      'SUPERSEDED by public.deals (V3-35, 2026-07-24). Rows were migrated as '
      'owner/staff spotlight campaigns (deals.legacy_curation_id). Kept only as '
      'a read fallback while the deals migration rolls out; do not add rows. '
      'Removal is a follow-on pass once the deals model is live everywhere.';
  else
    raise notice 'marketplace_deals_curation absent (fresh CI DB) — skipping reconciliation';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 4. V3-25 moderation framework: admit the `deal` content type so deal
--    approval flows through the SAME publish-gate ledger (no parallel
--    approval machine). Guarded: the moderation tables are owner-gated and
--    may be absent on a given chain. Keep in lockstep with the ContentType
--    union in @henryco/moderation/types (constraint-drift guard).
-- ---------------------------------------------------------------------------
do $$
begin
  if to_regclass('public.moderation_decisions') is not null then
    alter table public.moderation_decisions
      drop constraint if exists moderation_decisions_content_type_check;
    alter table public.moderation_decisions
      add constraint moderation_decisions_content_type_check
      check (content_type in ('marketplace_listing', 'job_post', 'studio_brief', 'service_profile', 'deal'));
  end if;

  if to_regclass('public.moderation_reports') is not null then
    alter table public.moderation_reports
      drop constraint if exists moderation_reports_content_type_check;
    alter table public.moderation_reports
      add constraint moderation_reports_content_type_check
      check (content_type in ('marketplace_listing', 'job_post', 'studio_brief', 'service_profile', 'deal'));
  end if;
end $$;

commit;
