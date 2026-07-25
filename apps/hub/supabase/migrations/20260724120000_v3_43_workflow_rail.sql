-- =============================================================================
-- V3-43 — THE PLATFORM DURABLE-JOB RAIL + primitive consolidation
-- =============================================================================
-- Generalizes the shipped search_index_outbox / drainOutbox idiom into ONE
-- durable-job rail (@henryco/workflow) and CONSOLIDATES the two per-division
-- single-flight locks and the two durable internal-spend ledgers into ONE
-- primitive each — BEFORE SA-4's operator migration would have landed a second
-- of each (the architect's "never two" constraint, verified on prod 2026-07-23).
--
-- Prod TODAY (verified): ONE lock table (studio_agency_tick_lock, SA-3), ONE
-- spend ledger (ai_free_spend_ledger, account free-AI), ONE outbox
-- (search_index_outbox, search-ui — NOT touched here). SA-4's operator spine
-- (20260723130000) is NOT applied; it is retargeted (in this pass) to reuse the
-- primitives below instead of creating ai_operator_tick_lock /
-- ai_operator_spend_ledger.
--
-- END STATE after this migration + the retargeted SA-4 migration apply:
--   • ONE lock primitive:  public.workflow_locks           (keyed CAS)
--   • ONE spend primitive: public.internal_ai_spend_ledger (keyed daily counter)
--   • ONE outbox idiom generalized in @henryco/workflow (workflow_jobs/runs)
--   • search_index_outbox unchanged (search-ui is out of scope).
--
-- SECURITY POSTURE (unchanged doctrine): every new table is RLS default-deny with
-- ZERO policies (service-role only); every new RPC is SECURITY DEFINER with a
-- pinned search_path, EXECUTE revoked from public/anon/authenticated and granted
-- to service_role only. Nothing here touches payments_private, the money RPCs, or
-- a customer wallet — the internal ledger is NON-BILLABLE company spend.
--
-- FLAG-DARK: creating these objects activates nothing. The rail engine is gated
-- by WORKFLOW_RAIL_LIVE in the app layer; the studio/operator ticks only run
-- under their own owner-gated flags (STUDIO_AGENCY_LIVE / FOUNDER_ACTIONS_LIVE).
--
-- DOWN (manual, not auto-run): recreate studio_agency_tick_lock + ai_free_spend_
-- ledger, restore the two original RPC bodies, drop workflow_jobs/runs/locks +
-- internal_ai_spend_ledger + its RPCs. Kept in the runbook, not inline — a down
-- would strand live free-AI spend history, so it is a deliberate owner step.
-- =============================================================================

set check_function_bodies = off;

-- ─────────────────────────────────────────────────────────────────────
-- 1. workflow_jobs — the ONE durable-job rail (the outbox idiom generalized)
--    Discrete at-least-once jobs: enqueue → claim (atomic CAS) → run handler →
--    succeed / requeue-with-backoff / dead-letter. Domain sagas register a
--    handler keyed by workflow_key; they DO NOT flatten their own state tables
--    into this one (studio_build_jobs keeps its 15 domain stages).
-- ─────────────────────────────────────────────────────────────────────
create table if not exists public.workflow_jobs (
  id              uuid primary key default gen_random_uuid(),
  workflow_key    text not null,
  payload         jsonb not null default '{}'::jsonb,
  idempotency_key text,
  state           text not null default 'pending'
                    check (state in ('pending','claimed','succeeded','failed','dead_letter')),
  attempts        integer not null default 0,
  max_attempts    integer not null default 8,
  run_after       timestamptz not null default timezone('utc', now()),
  claimed_by      text,
  claimed_at      timestamptz,
  visible_after   timestamptz,
  last_error      text,
  created_at      timestamptz not null default timezone('utc', now()),
  updated_at      timestamptz not null default timezone('utc', now())
);

comment on table public.workflow_jobs is
  'V3-43 — the platform durable-job rail (the search_index_outbox idiom '
  'generalized). At-least-once discrete jobs claimed by atomic CAS; a handler '
  'registered on workflow_key runs each. Domain sagas keep their own state '
  'tables — this rail carries the JOB, not the saga. RLS default-deny, '
  'service-role only.';

-- Claim scan: due, not-terminal, invisibility-expired, FIFO by created_at.
create index if not exists workflow_jobs_claim_idx
  on public.workflow_jobs (state, run_after, created_at);
-- Reclaim scan for jobs whose visibility window lapsed (a crashed worker).
create index if not exists workflow_jobs_visibility_idx
  on public.workflow_jobs (visible_after)
  where visible_after is not null;
-- Idempotency: at most ONE live (non-terminal) job per (workflow_key,
-- idempotency_key) — a replayed enqueue dedupes to the in-flight row, so a
-- double side-effect is impossible. Terminal rows are excluded so a KEY can be
-- reused on a later day/run.
create unique index if not exists workflow_jobs_idempotency_idx
  on public.workflow_jobs (workflow_key, idempotency_key)
  where idempotency_key is not null and state in ('pending','claimed','failed');

alter table public.workflow_jobs enable row level security;
-- intentionally NO policies — service-role only.
revoke all on public.workflow_jobs from anon, authenticated;

-- workflow_enqueue — idempotent insert. If an idempotency_key is given and a
-- LIVE (non-terminal) job already carries it, the existing row is returned and NO
-- new job is created (a replayed enqueue can never fan out a second side-effect).
-- The select-then-insert TOCTOU race is closed by the unique partial index: a
-- losing concurrent insert raises unique_violation and we return the winner's row.
create or replace function public.workflow_enqueue(
  p_workflow_key    text,
  p_payload         jsonb  default '{}'::jsonb,
  p_idempotency_key text   default null,
  p_max_attempts    integer default 8,
  p_run_after       timestamptz default timezone('utc', now())
)
returns setof public.workflow_jobs
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_existing public.workflow_jobs;
begin
  if p_idempotency_key is not null then
    select * into v_existing from public.workflow_jobs
      where workflow_key = p_workflow_key
        and idempotency_key = p_idempotency_key
        and state in ('pending','claimed','failed')
      limit 1;
    if found then
      return next v_existing;
      return;
    end if;
  end if;

  return query
    insert into public.workflow_jobs (workflow_key, payload, idempotency_key, max_attempts, run_after)
      values (p_workflow_key, coalesce(p_payload, '{}'::jsonb), p_idempotency_key,
              greatest(1, coalesce(p_max_attempts, 8)), coalesce(p_run_after, timezone('utc', now())))
    returning *;
exception when unique_violation then
  -- A concurrent enqueue won the race — return its live row, don't duplicate.
  return query
    select * from public.workflow_jobs
      where workflow_key = p_workflow_key
        and idempotency_key = p_idempotency_key
        and state in ('pending','claimed','failed')
      limit 1;
end;
$$;

-- workflow_claim_job — atomically claim the oldest DUE job. `for update skip
-- locked` guarantees two concurrent drain workers never grab the same row (the
-- canonical Postgres queue-claim). Claimable = due AND (pending | failed-and-due |
-- claimed-but-visibility-lapsed, i.e. a crashed worker). Bumps attempts and sets
-- a fresh invisibility window. Returns the claimed row, or the empty set.
create or replace function public.workflow_claim_job(
  p_worker            text,
  p_visibility_seconds integer default 90
)
returns setof public.workflow_jobs
language sql
security definer
set search_path = public, pg_temp
as $$
  update public.workflow_jobs
    set state = 'claimed',
        claimed_by = p_worker,
        claimed_at = timezone('utc', now()),
        visible_after = timezone('utc', now()) + make_interval(secs => greatest(1, coalesce(p_visibility_seconds, 90))),
        attempts = attempts + 1,
        updated_at = timezone('utc', now())
    where id = (
      select id from public.workflow_jobs
        where run_after <= timezone('utc', now())
          and (
            state in ('pending','failed')
            or (state = 'claimed' and visible_after is not null and visible_after < timezone('utc', now()))
          )
        order by created_at asc
        for update skip locked
        limit 1
    )
    returning *;
$$;

revoke execute on function public.workflow_enqueue(text, jsonb, text, integer, timestamptz) from public, anon, authenticated;
revoke execute on function public.workflow_claim_job(text, integer) from public, anon, authenticated;
grant execute on function public.workflow_enqueue(text, jsonb, text, integer, timestamptz) to service_role;
grant execute on function public.workflow_claim_job(text, integer) to service_role;

-- ─────────────────────────────────────────────────────────────────────
-- 2. workflow_runs — append-only disposition log (one row per handler outcome)
-- ─────────────────────────────────────────────────────────────────────
create table if not exists public.workflow_runs (
  id           uuid primary key default gen_random_uuid(),
  job_id       uuid not null references public.workflow_jobs(id) on delete cascade,
  workflow_key text not null,
  outcome      text not null check (outcome in ('succeeded','requeued','dead_letter')),
  note         text,
  error        text,
  at           timestamptz not null default timezone('utc', now())
);

comment on table public.workflow_runs is
  'V3-43 — append-only audit of every workflow_jobs disposition (succeeded / '
  'requeued / dead_letter). RLS default-deny, service-role only.';

create index if not exists workflow_runs_job_idx on public.workflow_runs (job_id, at desc);

alter table public.workflow_runs enable row level security;
-- intentionally NO policies — service-role only.
revoke all on public.workflow_runs from anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────
-- 3. workflow_locks — the ONE single-flight lock primitive (keyed CAS row)
--    Generalizes studio_agency_tick_lock's single-row sentinel to a KEYED row.
--    CAS: win a key iff its locked_until < now (the prior holder's TTL lapsed).
--    A losing acquirer no-ops — so two overlapping ticks serialize and the
--    daily-ceiling read is always fresh relative to peers (the SA-3 lesson).
-- ─────────────────────────────────────────────────────────────────────
create table if not exists public.workflow_locks (
  lock_key     text primary key,
  locked_until timestamptz not null default timezone('utc', now()),
  holder       text,
  updated_at   timestamptz not null default timezone('utc', now())
);

comment on table public.workflow_locks is
  'V3-43 — the ONE single-flight lock primitive (keyed CAS). Replaces the '
  'per-division studio_agency_tick_lock / (would-be) ai_operator_tick_lock '
  'sentinel rows. A key is won only when its locked_until has expired, so '
  'overlapping cron ticks serialize. RLS default-deny, service-role only.';

alter table public.workflow_locks enable row level security;
-- intentionally NO policies — service-role only.
revoke all on public.workflow_locks from anon, authenticated;

-- Seed the two known single-flight keys, expired so the first acquirer wins.
-- (Drain workers need NO lock — their claim is atomic; only the sweep ticks do.)
insert into public.workflow_locks (lock_key, locked_until) values
  ('studio.agency.tick', timezone('utc', now())),
  ('hub.operator.tick',  timezone('utc', now()))
on conflict (lock_key) do nothing;

-- FOLD studio_agency_tick_lock → workflow_locks('studio.agency.tick'), then DROP
-- it, so prod is left with exactly ONE lock primitive (never two). Guarded: on a
-- prod that has the SA-3 table we carry its holder/expiry forward; a prod without
-- it just keeps the seeded row. The studio app layer is rewired to workflow_locks
-- in the same PR and its agency tick is flag-dark, so no live caller is stranded.
do $$
begin
  if to_regclass('public.studio_agency_tick_lock') is not null then
    update public.workflow_locks w
      set locked_until = greatest(w.locked_until, s.locked_until),
          holder       = coalesce(s.holder, w.holder),
          updated_at   = timezone('utc', now())
      from public.studio_agency_tick_lock s
      where w.lock_key = 'studio.agency.tick';
    drop table public.studio_agency_tick_lock;
    raise notice 'V3-43: folded studio_agency_tick_lock into workflow_locks(studio.agency.tick) and dropped it';
  else
    raise notice 'V3-43: studio_agency_tick_lock absent — seeded workflow_locks(studio.agency.tick) only';
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────────────
-- 4. internal_ai_spend_ledger — the ONE keyed daily internal-spend counter
--    Generalizes ai_free_spend_ledger to a (budget_key, window_day) grid so the
--    free-AI, operator, and (future) automation counters share ONE table. This
--    is NON-BILLABLE company spend (MONEY-MODEL §5) — it never touches a wallet.
--    Ceilings live in code; this is only the cross-tick truth the ceiling reads.
-- ─────────────────────────────────────────────────────────────────────
create table if not exists public.internal_ai_spend_ledger (
  budget_key  text not null,
  window_day  date not null default current_date,
  spent_kobo  bigint not null default 0,
  updated_at  timestamptz not null default now(),
  primary key (budget_key, window_day)
);

comment on table public.internal_ai_spend_ledger is
  'V3-43 — the ONE durable daily counter for NON-BILLABLE internal AI spend '
  '(MONEY-MODEL §5), keyed by budget_key: ''free_ai'' (customer free surfaces), '
  '''operator'' (Owner-AI operator tick), ''automation'' (Phase F, reserved). One '
  'row per (budget_key, UTC day), atomic upsert increment. RLS default-deny, '
  'service-role only, written solely through internal_ai_spend_add.';

alter table public.internal_ai_spend_ledger enable row level security;
-- intentionally NO policies — service-role only.
revoke all on public.internal_ai_spend_ledger from anon, authenticated;

-- Today's accumulated spend for a budget key, in kobo (0 when no row yet).
create or replace function public.internal_ai_spend_today(p_budget_key text)
returns bigint
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    (select spent_kobo from public.internal_ai_spend_ledger
      where budget_key = p_budget_key and window_day = current_date),
    0
  );
$$;

-- Add a turn's estimated provider cost to today's total for a key; return the
-- new total. Atomic upsert increment (concurrent adds serialize on the row lock);
-- greatest(0, …) clamps negatives so the counter can never be decremented.
create or replace function public.internal_ai_spend_add(p_budget_key text, p_add_kobo bigint)
returns bigint
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_total bigint;
begin
  insert into public.internal_ai_spend_ledger (budget_key, window_day, spent_kobo)
    values (p_budget_key, current_date, greatest(0, coalesce(p_add_kobo, 0)))
  on conflict (budget_key, window_day) do update set
    spent_kobo = public.internal_ai_spend_ledger.spent_kobo + greatest(0, coalesce(p_add_kobo, 0)),
    updated_at = now()
  returning spent_kobo into v_total;
  return v_total;
end;
$$;

revoke execute on function public.internal_ai_spend_today(text) from public, anon, authenticated;
revoke execute on function public.internal_ai_spend_add(text, bigint) from public, anon, authenticated;
grant execute on function public.internal_ai_spend_today(text) to service_role;
grant execute on function public.internal_ai_spend_add(text, bigint) to service_role;

-- ─────────────────────────────────────────────────────────────────────
-- 5. FOLD ai_free_spend_ledger → internal_ai_spend_ledger('free_ai')
--    ai_free_spend_ledger is LIVE with real data + the account app calls its two
--    RPCs by name. So: migrate its rows under budget_key='free_ai', then REDEFINE
--    the two RPCs IN PLACE to delegate to the unified ledger (signatures byte-for-
--    byte preserved — apps/account budget-guard.ts is untouched), then drop the
--    old table. Order matters: rows first, RPCs redefined BEFORE the drop, drop
--    last — the redefined RPCs no longer reference the old table when it goes.
-- ─────────────────────────────────────────────────────────────────────
do $$
begin
  if to_regclass('public.ai_free_spend_ledger') is not null then
    insert into public.internal_ai_spend_ledger (budget_key, window_day, spent_kobo, updated_at)
      select 'free_ai', window_day, spent_kobo, updated_at from public.ai_free_spend_ledger
    on conflict (budget_key, window_day) do update set
      spent_kobo = public.internal_ai_spend_ledger.spent_kobo + excluded.spent_kobo,
      updated_at = greatest(public.internal_ai_spend_ledger.updated_at, excluded.updated_at);
    raise notice 'V3-43: migrated ai_free_spend_ledger rows into internal_ai_spend_ledger(free_ai)';
  else
    raise notice 'V3-43: ai_free_spend_ledger absent — nothing to migrate';
  end if;
end $$;

-- Redefine the account-facing RPCs to delegate — SAME signatures, so every
-- existing admin.rpc("ai_free_spend_today") / ("ai_free_spend_add",{p_add_kobo})
-- caller keeps working with zero code change.
create or replace function public.ai_free_spend_today()
returns bigint
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.internal_ai_spend_today('free_ai');
$$;

create or replace function public.ai_free_spend_add(p_add_kobo bigint)
returns bigint
language sql
security definer
set search_path = public, pg_temp
as $$
  select public.internal_ai_spend_add('free_ai', p_add_kobo);
$$;

revoke all on function public.ai_free_spend_today() from public, anon, authenticated;
revoke all on function public.ai_free_spend_add(bigint) from public, anon, authenticated;
grant execute on function public.ai_free_spend_today() to service_role;
grant execute on function public.ai_free_spend_add(bigint) to service_role;

-- Now that the RPCs delegate, retire the old table (no CASCADE — a surprise
-- dependency should surface loudly, not be silently dropped).
drop table if exists public.ai_free_spend_ledger;

-- end of migration --
