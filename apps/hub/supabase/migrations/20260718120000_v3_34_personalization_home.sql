-- =============================================================================
-- V3-34 — Personalization home foundation (Phase E, Wave E.1)
--
-- Adds the per-user home-layout store, the NDPR personalization-consent ledger,
-- and the account-scoped personalization-consent flag. All net-new, all
-- default-deny RLS. Touches NO money table, NO payments_private, NO RPC.
--
-- NDPR / NDPA 2023 posture (see docs/v3/personalization/PRIVACY-NDPR.md):
--   * user_home_layouts        — lawful basis: CONTRACT / legitimate interest
--       (the user configures their own product surface; first-party, no
--       profiling). Stores ONLY ModuleSlug references — never widget content,
--       never PII. Retention: lives with the account (CASCADE on auth.users);
--       export source for the manual DSAR inventory (own rows).
--   * personalization_consent_events — lawful basis: the consent record itself
--       (append-only). Retention: consent evidence; forward-compatible with
--       V3-93's consent_log (rows migrate in). Export source (own rows).
--   * customer_preferences.personalization_enabled — the account-scoped
--       personalization consent flag (NULL = not-yet-answered). Governs
--       cross-division PROFILING (V3-36+), NOT first-party layout config.
--
-- No-cross-leak invariant (Phase E Prime Directive 10): every table below is
-- owner-scoped by RLS on auth.uid(); user_home_layouts is strictly owner-only
-- (no service_role read — "no admin-client reads for layout"). Proven by
-- apps/hub/supabase/tests/personalization_rls_behaviour.sql +
-- personalization_grant_invariant.sql (CI, payments-grant-invariant job).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. user_home_layouts — the per-user, per-surface layout projection store.
--    Natural key (user_id, surface): one layout per surface (account/owner/staff).
--    Wave E.1 writes only the 'account' surface (owner/staff = follow-on slice).
-- ---------------------------------------------------------------------------
create table if not exists public.user_home_layouts (
  user_id uuid not null references auth.users (id) on delete cascade,
  surface text not null default 'account'
    check (surface in ('account', 'owner', 'staff')),
  desktop_module_order text[] not null default '{}',
  mobile_module_order  text[] not null default '{}',
  hidden_modules       text[] not null default '{}',
  pinned_modules       text[] not null default '{}',
  last_personalized_at timestamptz not null default now(),
  personalization_signal_version integer not null default 1,
  updated_at timestamptz not null default now(),
  primary key (user_id, surface)
);

-- Feature-local updated_at trigger (repo convention: per-table fn with a pinned
-- search_path — no shared public.set_updated_at() exists; the FIRE lesson).
create or replace function public.user_home_layouts_set_updated_at()
returns trigger
language plpgsql
set search_path to 'public', 'pg_catalog'
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_user_home_layouts_updated_at on public.user_home_layouts;
create trigger set_user_home_layouts_updated_at
  before update on public.user_home_layouts
  for each row execute function public.user_home_layouts_set_updated_at();

-- RLS: strictly owner-only. Writes flow through the viewer's AUTHENTICATED
-- client (never the admin client) — the RLS policy IS the tenant boundary.
alter table public.user_home_layouts enable row level security;

-- Explicit grants (do not lean on Supabase implicit default privileges — the
-- SEC-HARDEN-06 footgun). anon + service_role get nothing (owner-only, no
-- admin reads); authenticated may read/insert/update its own rows (RLS-gated),
-- never delete/truncate (reset clears arrays, it does not drop the row).
revoke all on public.user_home_layouts from anon, service_role;
revoke delete, truncate on public.user_home_layouts from authenticated;
grant select, insert, update on public.user_home_layouts to authenticated;

drop policy if exists user_home_layouts_select_own on public.user_home_layouts;
create policy user_home_layouts_select_own on public.user_home_layouts
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists user_home_layouts_insert_own on public.user_home_layouts;
create policy user_home_layouts_insert_own on public.user_home_layouts
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists user_home_layouts_update_own on public.user_home_layouts;
create policy user_home_layouts_update_own on public.user_home_layouts
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- 2. personalization_consent_events — append-only NDPR consent ledger.
--    Pattern: the row IS the consent record (learn_candidate_optins) +
--    consent_text_version pins the exact copy read (rooms_recordings_consent).
--    Own-row SELECT; service_role appends (via the preferences route). Nobody
--    updates/deletes — reads check the current flag, not the history.
-- ---------------------------------------------------------------------------
create table if not exists public.personalization_consent_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  action text not null check (action in ('granted', 'revoked')),
  consent_text_version text not null,
  source text not null default 'account_settings',
  created_at timestamptz not null default now()
);

create index if not exists personalization_consent_events_user_idx
  on public.personalization_consent_events (user_id, created_at desc);

alter table public.personalization_consent_events enable row level security;

-- anon: nothing. authenticated: read own only (no direct writes). service_role:
-- append + read; append-only (no update/delete/truncate, even for service_role).
revoke all on public.personalization_consent_events from anon;
revoke insert, update, delete, truncate
  on public.personalization_consent_events from authenticated;
grant select on public.personalization_consent_events to authenticated;
revoke update, delete, truncate
  on public.personalization_consent_events from service_role;
grant select, insert on public.personalization_consent_events to service_role;

drop policy if exists personalization_consent_events_select_own
  on public.personalization_consent_events;
create policy personalization_consent_events_select_own
  on public.personalization_consent_events
  for select to authenticated
  using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- 3. customer_preferences.personalization_enabled — account-scoped consent.
--    NULLABLE by design: NULL = not-yet-answered (tri-state). The account
--    value wins over the device cookie; first sign-in seeds it once. Governs
--    cross-division profiling (V3-36+), NOT the first-party layout (V3-34),
--    which runs on legitimate interest. Idempotent add-column (the table is
--    applied-not-in-repo; only ALTERs exist — DIAG-ACCOUNT-01 pattern).
-- ---------------------------------------------------------------------------
-- Table-existence guard: customer_preferences is applied-not-in-repo (no CREATE
-- TABLE migration exists), so it is ABSENT on the fresh CI postgres. ADD COLUMN
-- IF NOT EXISTS guards the column, not the table — guard the table with
-- to_regclass so the migration is safe on both fresh CI (skip) and prod (apply).
do $$
begin
  if to_regclass('public.customer_preferences') is not null then
    alter table public.customer_preferences
      add column if not exists personalization_enabled boolean;

    comment on column public.customer_preferences.personalization_enabled is
      'V3-34 NDPR personalization consent (account-scoped). NULL = not-yet-answered; '
      'account value wins over the device cookie. Gates cross-division profiling '
      '(V3-36+), never first-party layout config. Export source for DSAR (own row).';
  else
    raise notice 'customer_preferences absent (fresh CI DB) — skipping personalization_enabled add';
  end if;
end $$;
