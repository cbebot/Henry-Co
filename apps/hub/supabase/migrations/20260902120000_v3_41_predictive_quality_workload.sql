-- =============================================================================
-- V3-41 — PREDICTIVE QUALITY & WORKLOAD: forecasts, at-risk flags, dispute watch
-- =============================================================================
-- The platform's forward-looking OPERATIONS surface (Phase E, Wave E.4).
-- Doctrine encoded here, not merely documented:
--
--   * ADVISORY ONLY / NO AUTO-PUNISHMENT — a prediction recommends that a HUMAN
--     look at something. The `quality_no_auto_punishment` CHECK restricts
--     `suggested_intervention` to the closed set of staff-performed actions, so a
--     future code change cannot persist "suspend"/"block"/"charge" even by
--     accident. There is deliberately NO enforcement table in this pass:
--     enforcement is V3-40's domain and even there only staff-applied.
--   * STAFF-ONLY VISIBILITY — the assessed provider/customer never sees a
--     prediction about themselves (PRIVACY-NDPR §5.4, Prime Directive 11).
--     Reads are gated to staff (`is_staff_in_any()`); anon has nothing; every
--     write is service-role only (the batch).
--   * NO MONEY CONTACT — nothing here touches payments_private, a money RPC, a
--     wallet, or a payment state machine. A dispute LIKELIHOOD never holds,
--     blocks, reverses or refunds a transaction; it populates a watch-list.
--
-- Lawful basis (PRIVACY-NDPR §1, packages/config/legal.ts): legitimate interest,
-- NDPA 2023 §25(1)(f) — service-quality assurance and operational staffing. This
-- is profiling of SERVICE UNITS and QUEUES for internal operations, not of people
-- for a decision about them; no sensitive-category inference is performed or
-- stored. Never consent-gated (an operator forecast is not a marketing choice),
-- counter-balanced by staff-only visibility, advisory-only output, the 30-day
-- shadow window before staffing figures are presented as authoritative, and the
-- privacy policy's automated-decision objection route.
--
-- Retention (PRIVACY-NDPR §3): OPERATIONAL class. Forecasts and assessments are
-- superseded by the next run and carry no standalone evidentiary value; intended
-- window 180 days, executed by V3-90/92's retention job. Rows store REFERENCES
-- (queue key, unit id, transaction id) plus bands and codes — never denormalized
-- personal content, never a free-text note about a person.
--
-- Degrade posture: committed-NOT-applied until owner activation. Every reader and
-- writer in code is best-effort — absent tables mean the predictive system
-- silently contributes nothing, and the flag `predictive_operations`
-- additionally keeps the batch dark.
--
-- Depends on (created here if absent, byte-compatible with V3-43's definitions so
-- the two converge in EITHER apply order): public.workflow_locks.
-- Spend rides V3-43's public.internal_ai_spend_ledger under budget_key
-- 'predictive_ops' — NO new counter is created by this migration.
-- =============================================================================

set check_function_bodies = off;

-- ---------------------------------------------------------------------------
-- 0a. Fail-closed staff predicate stubs — ONLY when absent (fresh CI / shadow
--     DBs). On prod both exist (20260502120000 / 20260508120000) and are
--     untouched. A stub returns FALSE, so a missing predicate denies rather
--     than opens.
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
-- 0b. Single-flight lock — the V3-43 `workflow_locks` shape, created only if
--     absent and seeded expired so the first acquirer wins. The CAS is an
--     UPDATE, so a MISSING ROW means the lock can never be won: seeding is
--     mandatory, not decorative.
-- ---------------------------------------------------------------------------
create table if not exists public.workflow_locks (
  lock_key     text primary key,
  locked_until timestamptz not null default timezone('utc', now()),
  holder       text,
  updated_at   timestamptz not null default timezone('utc', now())
);
alter table public.workflow_locks enable row level security;
-- No policies by design: default-deny. Service role (bypasses RLS) does the CAS.
revoke all on public.workflow_locks from anon, authenticated;

insert into public.workflow_locks (lock_key, locked_until)
  values ('hub.predictive.tick', timezone('utc', now()))
on conflict (lock_key) do nothing;

-- ---------------------------------------------------------------------------
-- 1. workload_forecasts — one row per (queue, run). `payload` carries the
--    per-hour series + staffing recommendation exactly as the pure engine
--    produced it, so a forecast is reproducible from (model_version, payload).
-- ---------------------------------------------------------------------------
create table if not exists public.workload_forecasts (
  queue          text not null check (queue in (
                   'support','kyc_review','moderation','finance','refunds','logistics_ops')),
  generated_at   timestamptz not null default timezone('utc', now()),
  horizon_hours  integer not null default 168 check (horizon_hours > 0 and horizon_hours <= 744),
  payload        jsonb not null default '{}'::jsonb,
  -- Honesty fields: a surface must be able to say "not enough history yet"
  -- instead of drawing a confident line through noise.
  sample_size    integer not null default 0 check (sample_size >= 0),
  basis          text not null default 'empty' check (basis in ('seasonal','sparse','empty')),
  model_version  text not null,
  -- OPTIONAL staff-facing prose from the governed non-billable AI surface. It
  -- lives in its OWN column, never inside `payload`, so model text can never be
  -- mistaken for — or parsed back into — a forecast number. NULL is the normal
  -- state: the narrative slice is flag-dark, budget-bounded and degrade-CLOSED,
  -- and the forecast is complete and correct without it.
  narrative      text,
  primary key (queue, generated_at)
);

comment on table public.workload_forecasts is
  'V3-41 — per-queue incoming-volume forecast (7-day, per-hour) with staffing '
  'recommendation. ADVISORY: the recommended-agents figure is owner-ratified '
  'only after the 30-day shadow window. Staff-read only, service-role writes.';

create index if not exists workload_forecasts_recent_idx
  on public.workload_forecasts (queue, generated_at desc);

-- ---------------------------------------------------------------------------
-- 2. quality_assessments — the at-risk flag for an in-flight service unit.
--    THE no-auto-punishment guarantee lives on this table.
-- ---------------------------------------------------------------------------
create table if not exists public.quality_assessments (
  unit_type      text not null check (unit_type in (
                   'care_booking','studio_project','learn_enrolment','marketplace_order')),
  unit_id        text not null,
  assessed_at    timestamptz not null default timezone('utc', now()),
  at_risk        boolean not null default false,
  risk_band      text not null check (risk_band in ('low','elevated','high')),
  -- Explainable reason CODES (localized at the surface), never operator prose.
  reasons        jsonb not null default '[]'::jsonb,
  suggested_intervention text,
  signals_present integer not null default 0 check (signals_present >= 0),
  model_version  text not null,
  primary key (unit_type, unit_id, assessed_at),

  -- NO AUTO-PUNISHMENT, enforced by the database itself. The suggested action
  -- may only ever be something a HUMAN does. Widening this list is a deliberate
  -- three-place edit (TS union + runtime guard + this CHECK), never a slip.
  constraint quality_no_auto_punishment check (
    suggested_intervention is null or suggested_intervention in (
      'staff_review',
      'staff_contact_customer',
      'staff_contact_provider',
      'staff_reassign_provider',
      'staff_offer_goodwill'
    )
  ),
  -- A low band never carries an intervention, and a flagged unit always says why.
  constraint quality_band_matches_flag check (at_risk = (risk_band <> 'low'))
);

comment on table public.quality_assessments is
  'V3-41 — at-risk flag for an in-flight service unit (care booking, studio '
  'project, learn enrolment, marketplace order). ADVISORY ONLY: the '
  'quality_no_auto_punishment CHECK makes it impossible to persist an '
  'enforcement action here. The assessed party never reads this table.';

create index if not exists quality_assessments_at_risk_idx
  on public.quality_assessments (risk_band, assessed_at desc)
  where at_risk;

-- ---------------------------------------------------------------------------
-- 3. dispute_likelihoods — the pre-emptive watch-list. Distinct from V3-40
--    fraud risk by construction: these factors are fulfilment/settlement
--    shaped, and NOTHING here can act on a transaction.
-- ---------------------------------------------------------------------------
create table if not exists public.dispute_likelihoods (
  transaction_id text not null,
  scored_at      timestamptz not null default timezone('utc', now()),
  likelihood     numeric(5,4) not null check (likelihood >= 0 and likelihood <= 1),
  band           text not null check (band in ('low','watch','high')),
  window_days    integer not null default 60 check (window_days > 0),
  top_factors    jsonb not null default '[]'::jsonb,
  features_present integer not null default 0 check (features_present >= 0),
  model_version  text not null,
  primary key (transaction_id, scored_at)
);

comment on table public.dispute_likelihoods is
  'V3-41 — dispute/chargeback likelihood for a transaction, for the staff '
  'watch-list. NEVER holds, blocks, reverses or refunds anything (no money '
  'contact anywhere in this pass). The raw likelihood is server-side only: the '
  'staff projection exposes the BAND and the ranked factor codes, not the number.';

create index if not exists dispute_likelihoods_watch_idx
  on public.dispute_likelihoods (band, scored_at desc)
  where band in ('watch','high');

-- ---------------------------------------------------------------------------
-- 4. predictive_batch_runs — the run journal. Its INSERT doubles as the
--    "is the schema applied?" probe the batch uses to degrade silently.
-- ---------------------------------------------------------------------------
create table if not exists public.predictive_batch_runs (
  id             uuid primary key default gen_random_uuid(),
  started_at     timestamptz not null default timezone('utc', now()),
  finished_at    timestamptz,
  outcome        text not null default 'running'
                   check (outcome in ('running','succeeded','skipped','failed')),
  skip_reason    text,
  counts         jsonb not null default '{}'::jsonb,
  model_versions jsonb not null default '{}'::jsonb
);

comment on table public.predictive_batch_runs is
  'V3-41 — journal of predictive batch runs (counts, skip reasons, model '
  'versions). Service-role writes; staff-read for the shadow-window report.';

create index if not exists predictive_batch_runs_recent_idx
  on public.predictive_batch_runs (started_at desc);

-- ---------------------------------------------------------------------------
-- 5. RLS + grants — the V3-25 moderation / V3-AI-01 lockdown template.
--    RLS ON, Supabase's auto-granted DML stripped, ONE explicit SELECT
--    re-granted and gated to staff. An ordinary authenticated user — including
--    the assessed party — reads NOTHING. anon reads NOTHING.
-- ---------------------------------------------------------------------------
alter table public.workload_forecasts   enable row level security;
alter table public.quality_assessments  enable row level security;
alter table public.dispute_likelihoods  enable row level security;
alter table public.predictive_batch_runs enable row level security;

revoke all on public.workload_forecasts   from anon;
revoke all on public.quality_assessments  from anon;
revoke all on public.dispute_likelihoods  from anon;
revoke all on public.predictive_batch_runs from anon;

revoke insert, update, delete, truncate on public.workload_forecasts   from authenticated;
revoke insert, update, delete, truncate on public.quality_assessments  from authenticated;
revoke insert, update, delete, truncate on public.dispute_likelihoods  from authenticated;
revoke insert, update, delete, truncate on public.predictive_batch_runs from authenticated;

grant select on public.workload_forecasts   to authenticated;
grant select on public.quality_assessments  to authenticated;
grant select on public.dispute_likelihoods  to authenticated;
grant select on public.predictive_batch_runs to authenticated;

drop policy if exists workload_forecasts_staff_select on public.workload_forecasts;
create policy workload_forecasts_staff_select on public.workload_forecasts
  for select to authenticated
  using (public.is_staff_in_any());

drop policy if exists quality_assessments_staff_select on public.quality_assessments;
create policy quality_assessments_staff_select on public.quality_assessments
  for select to authenticated
  using (public.is_staff_in_any());

drop policy if exists dispute_likelihoods_staff_select on public.dispute_likelihoods;
create policy dispute_likelihoods_staff_select on public.dispute_likelihoods
  for select to authenticated
  using (public.is_staff_in_any());

drop policy if exists predictive_batch_runs_staff_select on public.predictive_batch_runs;
create policy predictive_batch_runs_staff_select on public.predictive_batch_runs
  for select to authenticated
  using (public.is_staff_in_any());

select 'v3-41 predictive quality + workload applied' as status;
