-- =============================================================================
-- V3-39 — Smart next action: opt-out preference + per-prompt dismissals
-- (Phase E, Wave E.2)
--
-- Adds the per-prompt dismissal store and the "do this next" opt-out control.
-- All net-new / additive, default-deny RLS. Touches NO money table, NO
-- payments_private, NO RPC.
--
-- NDPR / NDPA 2023 posture (docs/v3/personalization/PRIVACY-NDPR.md §1, §4):
--   * next_action_dismissals — lawful basis: LEGITIMATE INTEREST (the user's
--       own "don't show me this again" control; first-party, no profiling).
--       Stores ONLY (context_kind, action_id) references — never page content,
--       never PII. Retention: lives with the account (CASCADE on auth.users);
--       export source for the manual DSAR inventory (own rows — §6).
--   * customer_preferences.next_action_prompts_enabled — the in-product
--       next-step control (E-D2: legitimate-interest default-ON with user
--       control). NOT the profiling consent — cross-division stitching is
--       separately gated on customer_preferences.personalization_enabled
--       (V3-34), which fails safe.
--
-- No-cross-leak invariant (Phase E Prime Directive 10): next_action_dismissals
-- is strictly owner-scoped by RLS on auth.uid() — owner-only, NO service_role
-- access at all (dismissal reads/writes flow through the viewer's
-- AUTHENTICATED client; the RLS policy IS the tenant boundary). Proven by
-- apps/hub/supabase/tests/next_action_rls_behaviour.sql +
-- next_action_grant_invariant.sql (CI).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. next_action_dismissals — per-prompt dismissal persistence.
--    Natural key (user_id, context_kind, action_id): dismissing the same
--    prompt again refreshes dismissed_at (idempotent upsert; needs UPDATE).
-- ---------------------------------------------------------------------------
create table if not exists public.next_action_dismissals (
  user_id uuid not null references auth.users (id) on delete cascade,
  context_kind text not null
    check (context_kind in (
      'account_home', 'marketplace_listing', 'care_service', 'jobs_detail',
      'studio_brief', 'learn_course', 'property_listing', 'logistics_booking'
    )),
  action_id text not null check (char_length(action_id) between 1 and 128),
  dismissed_at timestamptz not null default now(),
  primary key (user_id, context_kind, action_id)
);

-- RLS: strictly owner-only. No admin/service_role path exists on purpose.
alter table public.next_action_dismissals enable row level security;

-- Explicit grants (never lean on implicit default privileges — the
-- SEC-HARDEN-06 footgun). anon + service_role: nothing. authenticated:
-- SELECT + INSERT + UPDATE own rows (RLS-gated; UPDATE only so the
-- dismissed_at upsert refresh works) — never DELETE/TRUNCATE (a dismissal is
-- cleared by product decision, not by a client call; none exists in V3-39).
revoke all on public.next_action_dismissals from anon, service_role;
revoke delete, truncate on public.next_action_dismissals from authenticated;
grant select, insert, update on public.next_action_dismissals to authenticated;

drop policy if exists next_action_dismissals_select_own on public.next_action_dismissals;
create policy next_action_dismissals_select_own on public.next_action_dismissals
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists next_action_dismissals_insert_own on public.next_action_dismissals;
create policy next_action_dismissals_insert_own on public.next_action_dismissals
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists next_action_dismissals_update_own on public.next_action_dismissals;
create policy next_action_dismissals_update_own on public.next_action_dismissals
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- 2. customer_preferences.next_action_prompts_enabled — the opt-out control.
--    NOT NULL DEFAULT TRUE: E-D2 classifies the in-product next step on the
--    current page as legitimate interest, default ON, with user control. A
--    read failure degrades to the same default (ON) in the resolver — but a
--    persisted FALSE always wins, server-side.
--    Table-existence guard: customer_preferences is applied-not-in-repo (no
--    CREATE TABLE migration exists), so it is ABSENT on the fresh CI postgres.
--    Guard with to_regclass so the migration is safe on both fresh CI (skip)
--    and prod (apply) — the V3-34 pattern.
-- ---------------------------------------------------------------------------
do $$
begin
  if to_regclass('public.customer_preferences') is not null then
    alter table public.customer_preferences
      add column if not exists next_action_prompts_enabled boolean not null default true;

    comment on column public.customer_preferences.next_action_prompts_enabled is
      'V3-39 "do this next" suggestion control (E-D2: legitimate-interest '
      'default-ON with user control). FALSE suppresses every next-action prompt '
      'server-side. Distinct from personalization_enabled (V3-34), which gates '
      'cross-division profiling/stitching and fails safe. Export source for '
      'DSAR (own row).';
  else
    raise notice 'customer_preferences absent (fresh CI DB) — skipping next_action_prompts_enabled add';
  end if;
end $$;
