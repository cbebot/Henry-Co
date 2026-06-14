-- V3-49 — Care: services catalog expansion (vertical-agnostic services taxonomy).
-- WHY: promote Henry Onyx Fabric Care from a single-vertical laundry/cleaning
--      booker into a multi-vertical services platform (garment care, laundry,
--      home/office/deep cleaning, repairs, errands, moving, event support,
--      business support, provider-assisted) WITHOUT forking a parallel schema
--      or touching the live Care booking path. The existing booking flow keeps
--      reading its own catalog (today: the in-code DEFAULT_CARE_BOOKING_CATALOG,
--      since the care_service_* tables were never materialised in prod); these
--      new tables are the generalised catalog the V3-49 surfaces + V3-50/51 read.
-- TABLE: public.service_verticals  (product line grouping; 11 V3 verticals)
--        public.catalog_services    (canonical, vertical-agnostic service row)
--        + defensive bridge column public.care_service_categories.vertical_id
--          (added ONLY if that table exists — it does not in prod today).
-- RLS:  public reads active rows; care staff + platform staff write; service
--       role full access. Money is BIGINT minor units (kobo) throughout.
-- IDEMPOTENT: yes (create … if not exists / drop policy if exists / guarded ALTER).

-- ---------------------------------------------------------------------------
-- service_verticals — a vertical groups services into a product line.
-- ---------------------------------------------------------------------------
create table if not exists public.service_verticals (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  name          text not null,                 -- canonical locale; localized at render
  summary       text,
  icon          text,                           -- lucide icon name, never a hardcoded URL
  division      text not null default 'care',   -- which division app owns the surface
  display_order integer not null default 0,
  status        text not null default 'active' check (status in ('active', 'draft', 'retired')),
  created_at    timestamptz not null default timezone('utc', now()),
  updated_at    timestamptz not null default timezone('utc', now())
);

create index if not exists service_verticals_active_idx
  on public.service_verticals (division, status, display_order)
  where status = 'active';

-- ---------------------------------------------------------------------------
-- catalog_services — canonical, vertical-agnostic service row. Existing Care
-- packages map 1:1 here via (source_table, source_id) when they are eventually
-- materialised in the DB; the V3-49 seed binds the bookable cleaning rows by
-- a slug that matches the live booking package so /book?service=<slug> resolves.
-- ---------------------------------------------------------------------------
create table if not exists public.catalog_services (
  id               uuid primary key default gen_random_uuid(),
  vertical_id      uuid not null references public.service_verticals(id) on delete restrict,
  slug             text not null unique,
  name             text not null,
  summary          text,
  description      text,
  pricing_model    jsonb not null default '{}'::jsonb,   -- shape validated by @henryco/pricing
  base_price_minor bigint check (base_price_minor is null or base_price_minor >= 0), -- integer minor units (kobo)
  currency         text not null default 'NGN',
  duration_minutes integer check (duration_minutes is null or duration_minutes > 0),
  provider_supplied boolean not null default false,       -- true ⇒ fulfilled by a V3-50 verified provider
  source_table     text,                                   -- e.g. 'care_service_packages' for backfilled rows
  source_id        uuid,                                   -- FK-by-convention into the source table
  status           text not null default 'active' check (status in ('active', 'draft', 'retired')),
  created_at       timestamptz not null default timezone('utc', now()),
  updated_at       timestamptz not null default timezone('utc', now())
);

create unique index if not exists catalog_services_source_idx
  on public.catalog_services (source_table, source_id)
  where source_id is not null;

create index if not exists catalog_services_vertical_idx
  on public.catalog_services (vertical_id, status, name)
  where status = 'active';

create index if not exists catalog_services_active_idx
  on public.catalog_services (status, updated_at desc)
  where status = 'active';

-- ---------------------------------------------------------------------------
-- updated_at triggers — reuse the canonical care touch function set_updated_at().
-- (The V3 PASS 21 care tables omitted DB-enforced touch; V3-49 wires it.)
-- ---------------------------------------------------------------------------
drop trigger if exists trg_service_verticals_updated_at on public.service_verticals;
create trigger trg_service_verticals_updated_at
  before update on public.service_verticals
  for each row execute function public.set_updated_at();

drop trigger if exists trg_catalog_services_updated_at on public.catalog_services;
create trigger trg_catalog_services_updated_at
  before update on public.catalog_services
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Search sync — project catalog_services changes into the search outbox so the
-- hc_services Typesense collection reindexes on create / update / retire. Mirrors
-- tg_workflow_targets_to_outbox (V2-SEARCH-01). Guarded with to_regprocedure so
-- it is a clean no-op in any environment where the search outbox is not installed.
-- ---------------------------------------------------------------------------
create or replace function public.tg_catalog_services_to_outbox()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_doc_id text;
  v_vertical_slug text;
  v_payload jsonb;
begin
  if to_regprocedure('public.enqueue_search_index_op(text, text, text, jsonb)') is null then
    return coalesce(new, old);
  end if;

  if tg_op = 'DELETE' then
    perform public.enqueue_search_index_op(
      'hc_services', 'care:care_service:' || old.id::text, 'delete', '{}'::jsonb
    );
    return old;
  end if;

  v_doc_id := 'care:care_service:' || new.id::text;

  -- Retired / draft services leave the public index.
  if new.status <> 'active' then
    perform public.enqueue_search_index_op('hc_services', v_doc_id, 'delete', '{}'::jsonb);
    return new;
  end if;

  select slug into v_vertical_slug from public.service_verticals where id = new.vertical_id;

  v_payload := jsonb_build_object(
    'id', v_doc_id,
    'type', 'care_service',
    'division', 'care',
    'title', new.name,
    'summary', coalesce(new.summary, ''),
    -- Absolute care origin. Mirrors @henryco/config henryDomain('care', …); the
    -- base host is tracked here because Postgres triggers cannot call TS helpers.
    'deep_link', 'https://care.henryonyx.com/services/'
                 || coalesce(v_vertical_slug, '') || '/' || new.slug,
    'role_visibility', jsonb_build_array('public'),
    'trust_state', 'verified',
    'created_at', extract(epoch from new.created_at)::bigint,
    'updated_at', extract(epoch from new.updated_at)::bigint,
    'ranking_signals', '{}'::jsonb,
    'tags', jsonb_build_array('care', coalesce(v_vertical_slug, 'services')),
    'vertical', coalesce(v_vertical_slug, ''),
    'provider_supplied', new.provider_supplied
  );

  perform public.enqueue_search_index_op('hc_services', v_doc_id, 'upsert', v_payload);
  return new;
end;
$$;

drop trigger if exists tr_catalog_services_to_outbox on public.catalog_services;
create trigger tr_catalog_services_to_outbox
  after insert or update or delete on public.catalog_services
  for each row execute function public.tg_catalog_services_to_outbox();

-- ---------------------------------------------------------------------------
-- RLS — public reads active rows; care/platform staff write; service role full.
-- Note: public.is_platform_staff() is org-wide but EXCLUDES the care division,
-- so the staff-write gate is (is_platform_staff() OR is_staff_in('care')) — the
-- canonical care staff predicate. auth.* calls are SELECT-wrapped (initplan cache).
-- ---------------------------------------------------------------------------
alter table public.service_verticals enable row level security;

drop policy if exists "service verticals: service role" on public.service_verticals;
create policy "service verticals: service role"
  on public.service_verticals
  for all
  using ((select auth.role()) = 'service_role')
  with check ((select auth.role()) = 'service_role');

drop policy if exists "service verticals: public read" on public.service_verticals;
create policy "service verticals: public read"
  on public.service_verticals
  for select
  using (status = 'active');

drop policy if exists "service verticals: staff write" on public.service_verticals;
create policy "service verticals: staff write"
  on public.service_verticals
  for all
  using (public.is_platform_staff() or public.is_staff_in('care'))
  with check (public.is_platform_staff() or public.is_staff_in('care'));

alter table public.catalog_services enable row level security;

drop policy if exists "catalog services: service role" on public.catalog_services;
create policy "catalog services: service role"
  on public.catalog_services
  for all
  using ((select auth.role()) = 'service_role')
  with check ((select auth.role()) = 'service_role');

drop policy if exists "catalog services: public read" on public.catalog_services;
create policy "catalog services: public read"
  on public.catalog_services
  for select
  using (status = 'active');

drop policy if exists "catalog services: staff write" on public.catalog_services;
create policy "catalog services: staff write"
  on public.catalog_services
  for all
  using (public.is_platform_staff() or public.is_staff_in('care'))
  with check (public.is_platform_staff() or public.is_staff_in('care'));

-- ---------------------------------------------------------------------------
-- Defensive bridge: existing care_service_categories now belong to a vertical.
-- Guarded because the table does NOT exist in prod today (the live Care catalog
-- runs off the in-code default). When it is later materialised, the column is
-- already present and an index supports vertical-scoped lookups.
-- ---------------------------------------------------------------------------
do $$
begin
  if to_regclass('public.care_service_categories') is not null then
    alter table public.care_service_categories
      add column if not exists vertical_id uuid references public.service_verticals(id);
    create index if not exists care_service_categories_vertical_idx
      on public.care_service_categories (vertical_id);
  end if;
end
$$;

comment on table public.service_verticals is
  'V3-49 — product-line grouping for the Henry Onyx services catalog (11 verticals). '
  'RLS: public reads active rows; care/platform staff write; service role full access.';
comment on table public.catalog_services is
  'V3-49 — canonical, vertical-agnostic service row. base_price_minor is BIGINT '
  'minor units (kobo). pricing_model JSONB is validated by @henryco/pricing. '
  'source_table/source_id bind a backfilled Care package; provider_supplied rows '
  'are fulfilled by a V3-50 verified provider. RLS: public reads active rows.';

-- end of migration --
