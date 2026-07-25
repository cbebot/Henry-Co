-- =============================================================================
-- V3-38 — Service-area coverage (Phase E, Wave E.2 — local availability)
--
-- Adds the division-coverage source of truth (`service_area_coverage`) and the
-- ONLY persistence this pass keeps: the aggregate coverage-gap counters
-- (`service_availability_gaps`) behind the `unavailable_shown` beacon.
-- Per-render availability resolution stays EMIT-ONLY (telemetry events, never
-- rows) — the BUILD-PLAN re-grounding delta for V3-38. The prompt's
-- `service_availability_cache` is deliberately NOT built (per-render
-- persistence was cut; the resolver reads coverage directly).
--
-- Touches NO money table, NO payments_private, NO RPC beyond the one narrow
-- SECURITY DEFINER gap-counter below.
--
-- NDPR / NDPA 2023 posture (docs/v3/personalization/PRIVACY-NDPR.md §1):
--   * Availability is LOCATION-KEYED, NEVER USER-KEYED. Neither table carries
--     a user id, a session id, coordinates, or any PII — so neither is a DSAR
--     export source and neither joins the deletion inventory.
--   * service_area_coverage    — public config data (which division offerings
--       reach which coarse areas). Public-read by design (PRIVACY-NDPR §1).
--       Retention: config — lives while the coverage is true; staff-curated.
--   * service_availability_gaps — aggregate demand counters at
--       (division, offering, country, region, city) grain. City is only ever
--       present when a viewer's OWN saved address supplied it (never IP
--       inference), and it is recorded as the gap grain, not tied to any user.
--       Retention intent: operational telemetry for coverage planning; rows
--       idle for 24 months are eligible for pruning (V3-90/92 retention rail).
--
-- Coverage seed honesty (the soak note: a flood of unavailable_shown means
-- MISSING ROWS, not a broken resolver — so seed only what is real today):
--   * care      — the live services catalog (11 active verticals,
--       apps/care/lib/services-catalog.ts, mirroring the applied V3-49 seed)
--       is operated from Enugu (COMPANY hqLocation "Emene, Enugu"; the care
--       copy promises "covered zones", which today is the Enugu metro).
--       Seeded at CITY grain: one row per active vertical, NG / Enugu / Enugu,
--       provider_count 1 (company-operated; V3-50 verified-provider rows will
--       widen this honestly).
--   * logistics — DEFAULT_LOGISTICS_ZONES (apps/logistics/lib/logistics/
--       content.ts, all active): enugu_urban + enugu_outskirts => pickup at
--       Enugu city + Enugu state grain; other_igbo_states => the south_east
--       zone's remaining states (Abia, Anambra, Ebonyi, Imo) at region grain.
--       The `intercity_priority` lane (region "Nigeria") is deliberately NOT
--       seeded as country-wide pickup: it is a route lane, not a promise that
--       a rider reaches every viewer's area.
--   * marketplace — NO seed. Delivery reach is per-seller, tier-clamped,
--       dynamic data (apps/marketplace/lib/checkout/delivery-reach.ts), not a
--       static division coverage config; honest rows arrive with V3-50/V3-52.
--   * property   — NO seed. Property is browse-anywhere (listings carry their
--       own locations); coverage rows would be a false gate.
--
-- PROD-ACTUAL: this migration is committed-not-applied until the owner runs
-- the apply. Every consumer is best-effort — a missing-relation read degrades
-- to the resolver's `unknown` (renders nothing), never a throw.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. service_area_coverage — which division offerings reach which areas.
--    region/city NULL = "whole country" / "whole region" (most-specific-first
--    resolution happens in packages/intelligence/src/availability/engine.ts).
-- ---------------------------------------------------------------------------
create table if not exists public.service_area_coverage (
  id uuid primary key default gen_random_uuid(),
  division text not null
    check (division in ('care', 'marketplace', 'property', 'logistics')),
  offering_key text not null
    check (char_length(offering_key) between 1 and 64
           and offering_key ~* '^[a-z0-9][a-z0-9_.:-]*$'),
  country text not null check (country ~ '^[A-Z]{2}$'),
  region text,                                    -- state/province; null = whole country
  city text,                                      -- null = whole region
  provider_count integer not null default 0 check (provider_count >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- NULLS NOT DISTINCT so two "whole-country" rows for the same offering
  -- cannot coexist (plain UNIQUE treats NULLs as distinct — a dupe trap).
  unique nulls not distinct (division, offering_key, country, region, city)
);

create index if not exists service_area_coverage_lookup
  on public.service_area_coverage (division, country, region, city)
  where is_active;

-- Feature-local updated_at trigger (repo convention: per-table fn with a
-- pinned search_path — the FIRE lesson; no shared set_updated_at exists).
create or replace function public.service_area_coverage_set_updated_at()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'pg_catalog'
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

revoke execute on function public.service_area_coverage_set_updated_at()
  from public, anon, authenticated;

drop trigger if exists set_service_area_coverage_updated_at on public.service_area_coverage;
create trigger set_service_area_coverage_updated_at
  before update on public.service_area_coverage
  for each row execute function public.service_area_coverage_set_updated_at();

-- RLS: default-deny for WRITES, explicit public READ (availability is public,
-- location-keyed, never user-keyed — PRIVACY-NDPR §1 blesses public-read).
alter table public.service_area_coverage enable row level security;

-- Explicit grants (never lean on implicit default privileges — SEC-HARDEN-06).
-- anon/authenticated: SELECT only. service_role: full curation (staff surfaces
-- write through service-role server code; no request-role write path exists).
revoke all on public.service_area_coverage from anon, authenticated;
grant select on public.service_area_coverage to anon, authenticated;
grant select, insert, update, delete on public.service_area_coverage to service_role;

drop policy if exists service_area_coverage_public_read on public.service_area_coverage;
create policy service_area_coverage_public_read on public.service_area_coverage
  for select to anon, authenticated
  using (true);
-- No insert/update/delete policies: request roles cannot write even if a
-- future grant widens (RLS default-deny backstop).

-- ---------------------------------------------------------------------------
-- 2. service_availability_gaps — the ONLY persisted availability telemetry.
--    Aggregate counters, one row per coverage-gap grain; written exclusively
--    through the SECURITY DEFINER counter below when an UnavailableState
--    actually rendered (the `unavailable_shown` beacon). '' sentinels keep
--    the PK total (a NULL region/city would fracture the counter grain).
-- ---------------------------------------------------------------------------
create table if not exists public.service_availability_gaps (
  division text not null
    check (division in ('care', 'marketplace', 'property', 'logistics')),
  offering_key text not null
    check (char_length(offering_key) between 1 and 64
           and offering_key ~* '^[a-z0-9][a-z0-9_.:-]*$'),
  country text not null check (country ~ '^[A-Z]{2}$'),
  region text not null default '' check (char_length(region) <= 80),
  city text not null default '' check (char_length(city) <= 80),
  shown_count bigint not null default 0 check (shown_count >= 0),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  primary key (division, offering_key, country, region, city)
);

-- RLS default-deny: NO policies at all. anon/authenticated: nothing.
-- service_role: read for owner coverage tiles; writes ONLY via the fn.
alter table public.service_availability_gaps enable row level security;

revoke all on public.service_availability_gaps from anon, authenticated;
revoke insert, update, delete, truncate on public.service_availability_gaps from service_role;
grant select on public.service_availability_gaps to service_role;

-- The single write path: a narrow SECURITY DEFINER counter with a pinned
-- search_path. Validates + normalizes inside (never trusts the caller), so a
-- malformed offering key or oversized area label cannot land.
create or replace function public.record_service_availability_gap(
  p_division text,
  p_offering_key text,
  p_country text,
  p_region text default null,
  p_city text default null
)
returns void
language plpgsql
security definer
set search_path to 'public', 'pg_catalog'
as $$
declare
  v_division text := lower(trim(coalesce(p_division, '')));
  v_offering text := lower(trim(coalesce(p_offering_key, '')));
  v_country text := upper(trim(coalesce(p_country, '')));
  v_region text := left(trim(coalesce(p_region, '')), 80);
  v_city text := left(trim(coalesce(p_city, '')), 80);
begin
  if v_division not in ('care', 'marketplace', 'property', 'logistics') then
    return; -- silently drop malformed input: telemetry, not truth
  end if;
  if char_length(v_offering) < 1 or char_length(v_offering) > 64
     or v_offering !~* '^[a-z0-9][a-z0-9_.:-]*$' then
    return;
  end if;
  if v_country !~ '^[A-Z]{2}$' then
    return;
  end if;

  insert into public.service_availability_gaps as g
    (division, offering_key, country, region, city, shown_count, first_seen_at, last_seen_at)
  values
    (v_division, v_offering, v_country, v_region, v_city, 1,
     timezone('utc', now()), timezone('utc', now()))
  on conflict (division, offering_key, country, region, city)
  do update set
    shown_count = g.shown_count + 1,
    last_seen_at = timezone('utc', now());
end;
$$;

-- Postgres grants EXECUTE to PUBLIC on new functions by default — strip it.
revoke execute on function public.record_service_availability_gap(text, text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.record_service_availability_gap(text, text, text, text, text)
  to service_role;

-- ---------------------------------------------------------------------------
-- 3. Seed — the honest minimal coverage set (rationale in the header).
--    Idempotent: the NULLS NOT DISTINCT unique key makes ON CONFLICT fire for
--    region/city-NULL rows too.
-- ---------------------------------------------------------------------------

-- care: the 11 active catalog verticals, Enugu city grain, company-operated.
insert into public.service_area_coverage
  (division, offering_key, country, region, city, provider_count, is_active)
values
  ('care', 'garment-care',      'NG', 'Enugu', 'Enugu', 1, true),
  ('care', 'laundry',           'NG', 'Enugu', 'Enugu', 1, true),
  ('care', 'home-cleaning',     'NG', 'Enugu', 'Enugu', 1, true),
  ('care', 'office-cleaning',   'NG', 'Enugu', 'Enugu', 1, true),
  ('care', 'deep-cleaning',     'NG', 'Enugu', 'Enugu', 1, true),
  ('care', 'repairs',           'NG', 'Enugu', 'Enugu', 1, true),
  ('care', 'errands',           'NG', 'Enugu', 'Enugu', 1, true),
  ('care', 'moving',            'NG', 'Enugu', 'Enugu', 1, true),
  ('care', 'event-support',     'NG', 'Enugu', 'Enugu', 1, true),
  ('care', 'business-support',  'NG', 'Enugu', 'Enugu', 1, true),
  ('care', 'provider-assisted', 'NG', 'Enugu', 'Enugu', 1, true)
on conflict (division, offering_key, country, region, city) do nothing;

-- logistics: pickup coverage from the active default zones.
insert into public.service_area_coverage
  (division, offering_key, country, region, city, provider_count, is_active)
values
  ('logistics', 'pickup', 'NG', 'Enugu',   'Enugu', 1, true), -- enugu_urban
  ('logistics', 'pickup', 'NG', 'Enugu',   null,    1, true), -- enugu_outskirts (in-state lanes)
  ('logistics', 'pickup', 'NG', 'Abia',    null,    1, true), -- other_igbo_states
  ('logistics', 'pickup', 'NG', 'Anambra', null,    1, true), -- other_igbo_states
  ('logistics', 'pickup', 'NG', 'Ebonyi',  null,    1, true), -- other_igbo_states
  ('logistics', 'pickup', 'NG', 'Imo',     null,    1, true)  -- other_igbo_states
on conflict (division, offering_key, country, region, city) do nothing;

-- marketplace / property: no rows (see header) — their surfaces resolve
-- `unknown` and render nothing, never a false "not available here".
