-- =============================================================================
-- V3-42 — STAFF RECOMMENDATION STATE: accept / dismiss / snooze, human-only
-- =============================================================================
-- The persistence behind the recommendation rail on the advanced staff
-- dashboards (Phase E, Wave E.4). Doctrine encoded here, not merely documented:
--
--   * A RECOMMENDATION NEVER ACTS. This table records that a HUMAN acknowledged,
--     dismissed or snoozed a suggestion. It has no column that could express
--     "applied", "executed" or "auto-accepted", and the
--     `staff_recommendation_human_actor` CHECK makes a state change away from
--     'open' impossible without an actor uuid. The system therefore cannot
--     accept its own recommendation — not by policy, but by construction.
--     (Automation is V3-43/44/47's domain, and even there human-gated.)
--   * STAFF-ONLY VISIBILITY. Reads are gated to staff (`is_staff_in_any()`);
--     anon has nothing; every write is service-role only, performed by a staff
--     server action that has already re-derived the acting staff identity.
--   * NO MONEY CONTACT, NO CUSTOMER CONTACT. Nothing here touches a wallet, a
--     payment, an order, an account or any customer-visible surface. Accepting
--     "consider staffing +2 agents" changes a row in this table and nothing else.
--
-- Lawful basis (PRIVACY-NDPR §1): legitimate interest, NDPA 2023 §25(1)(f) —
-- internal operations. Rows reference a RECOMMENDATION KEY and a staff actor;
-- no customer is identified here, and no customer-derived personal content is
-- stored. The `actor` is an employee acting in role, recorded for audit.
--
-- Retention (PRIVACY-NDPR §3): OPERATIONAL class, intended window 365 days
-- (longer than the predictive tables' 180 because accept/dismiss ratios are the
-- 14-day-soak evidence the pass spec asks the owner to tune cards against).
--
-- Degrade posture: committed-NOT-applied until owner activation. The dashboard
-- reads are best-effort — an absent table means the recommendation rail renders
-- its empty state, and the flag `predictive_dashboards` keeps it dark anyway.
--
-- Reads V3-40 (`risk_scores`, `risk_enforcement_log`) and V3-41
-- (`workload_forecasts`, `quality_assessments`, `dispute_likelihoods`) output.
-- It creates NO new predictive table and re-scores NOTHING.
-- =============================================================================

set check_function_bodies = off;

-- ---------------------------------------------------------------------------
-- 0. Fail-closed staff predicate stub — ONLY when absent (fresh CI / shadow
--    DBs). On prod it exists (20260508120000) and is untouched. A stub returns
--    FALSE, so a missing predicate DENIES rather than opens.
-- ---------------------------------------------------------------------------
do $$ begin
  if to_regprocedure('public.is_staff_in_any()') is null then
    create function public.is_staff_in_any()
    returns boolean
    language sql stable security definer set search_path = public
    as 'select false';
    revoke all on function public.is_staff_in_any() from public;
    grant execute on function public.is_staff_in_any() to authenticated, service_role;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 1. staff_recommendation_state
-- ---------------------------------------------------------------------------
create table if not exists public.staff_recommendation_state (
  id                 uuid primary key default gen_random_uuid(),
  -- Stable identity of the suggestion (e.g. 'workload.staffing.support.2026-W38').
  -- A key, never prose: the card's words come from the operator copy module.
  recommendation_key text not null,
  -- Which role lens raised it. Mirrors the dashboard's four lenses.
  role_scope         text not null
    check (role_scope in ('trust', 'finance', 'support', 'moderation')),
  status             text not null default 'open'
    check (status in ('open', 'accepted', 'dismissed', 'snoozed')),
  -- The HUMAN who acted. Null only while the row is still 'open'.
  actor              uuid,
  acted_at           timestamptz,
  snooze_until       timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  -- THE load-bearing constraint. A recommendation may only leave 'open' when a
  -- human actor is recorded against it. There is no system actor and no
  -- auto-accept path; the database refuses one.
  constraint staff_recommendation_human_actor
    check (status = 'open' or actor is not null),

  -- An acted-upon row records WHEN, so the 14-day soak can measure
  -- accept/dismiss ratios honestly.
  constraint staff_recommendation_acted_at
    check (status = 'open' or acted_at is not null),

  -- A snooze without a wake time would silently become a permanent dismissal.
  constraint staff_recommendation_snooze_window
    check (status <> 'snoozed' or snooze_until is not null)
);

comment on table public.staff_recommendation_state is
  'V3-42 — accept/dismiss/snooze state for staff dashboard recommendation cards. '
  'ADVISORY ONLY: the staff_recommendation_human_actor CHECK makes a state change '
  'without a human actor impossible, so the platform cannot accept its own '
  'suggestion. Staff-read only, service-role writes, every action audited.';

-- One live state per (recommendation, role lens): re-raising the same card must
-- update the existing row rather than accumulate duplicates a dismissal misses.
create unique index if not exists staff_recommendation_state_key_idx
  on public.staff_recommendation_state (recommendation_key, role_scope);

-- The rail's read: open cards for a lens, newest first.
create index if not exists staff_recommendation_state_open_idx
  on public.staff_recommendation_state (role_scope, status, created_at desc);

-- Snoozed cards due to re-surface.
create index if not exists staff_recommendation_state_snooze_idx
  on public.staff_recommendation_state (snooze_until)
  where status = 'snoozed';

-- ---------------------------------------------------------------------------
-- 2. RLS + grants — the V3-41 / V3-25 lockdown template. RLS ON, Supabase's
--    auto-granted DML stripped, ONE explicit SELECT re-granted and gated to
--    staff. An ordinary authenticated user reads NOTHING; anon reads NOTHING;
--    writes are service-role only (the audited staff server action).
-- ---------------------------------------------------------------------------
alter table public.staff_recommendation_state enable row level security;

revoke all on public.staff_recommendation_state from anon;
revoke insert, update, delete, truncate on public.staff_recommendation_state from authenticated;
grant select on public.staff_recommendation_state to authenticated;

drop policy if exists staff_recommendation_state_staff_select on public.staff_recommendation_state;
create policy staff_recommendation_state_staff_select on public.staff_recommendation_state
  for select to authenticated
  using (public.is_staff_in_any());

select 'v3-42 staff recommendation state applied' as status;
