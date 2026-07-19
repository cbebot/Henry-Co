-- SA-3 — the orchestration layer's one new table: the decisions inbox. The
-- coordinator (tick + routes) is otherwise pure code over the SA-2 spine
-- (studio_build_jobs / studio_build_events); it introduces NO new money RPC,
-- touches NO existing one, and adds NO column to studio_build_jobs (client-review
-- silence + aftercare timing are derived from the append-only studio_build_events
-- log, so the hot read path — JOB_COLUMNS in store.ts — is unchanged and a
-- partial migration apply cannot break it).
--
-- WHY (docs/v3/studio-agency/ARCHITECTURE.md §4.2):
--   The Owner-AI operator needs a DURABLE, server-initiated decision queue: the
--   orchestrator prepares/queues a one-tap decision (deploy approval, budget
--   increase, a stall) and the owner returns to a triaged inbox rather than a
--   chat scrollback. This is the studio-scoped inbox — it deliberately does NOT
--   fork the flag-dark hub founder_action_proposals spine (SA-4). The gate never
--   changes: acting on a decision routes to the SAME reauth-gated action route,
--   which re-reads true state and re-authorizes. A long-lived row is safe because
--   nothing trusts its freshness — the confirm path re-reads the job.
--
-- TABLE-OPS:
--   public.studio_agency_decisions (CREATE) — the server-initiated decision inbox.
--
-- RLS: default-deny with ZERO write policies (service-role writes only — the
--   founder_action_proposals / studio_build_jobs discipline). Staff read via
--   studio_is_staff(). No client-facing read (decisions are owner/ops only).
--
-- DEPLOY ORDER: safe to ship code-first — the decisions store degrades on a
--   missing table (hasAdminSupabaseEnv guard + best-effort inserts), so the tick
--   and routes no-op the inbox until this is applied. Ships/holds alongside the
--   SA-1/SA-2 migrations per the ratified apply order.
--
-- DOWN: drop the table (cascades its indexes + policy); revert the trigger fn
-- to its SA-2 body; drop approved_artifact_hash.

-- ─────────────────────────────────────────────────────────────────────
-- 0. HASH-PIN HARDENING (adversarial finding — post-approval artifact swap).
--    SA-2's hash "pin" only proved the content-addressed store is internally
--    consistent (bundle keyed by H re-hashes to H — trivially true). It did NOT
--    bind the deploy to the hash the OWNER approved, and the executor callback
--    could raw-update artifact_hash on a post-build stage (a same-stage update
--    the transition trigger waved through). Two DB-level fixes, belt-and-braces
--    with the app-layer gate (executor-callback stale-stage guard + deploy's
--    approved_artifact_hash equality check):
--
--    (a) approved_artifact_hash — the hash captured at the owner's reauth-gated
--        approval. WRITE-ONCE: set exactly once when the job enters
--        approved_for_deploy; the deploy binds to THIS, not the mutable column.
--    (b) artifact_hash is immutable once the job leaves the build phase, enforced
--        in the transition trigger (rejects a swap even via a raw same-stage
--        update) — the enforce_payment_intent_transition doctrine, extended.
-- ─────────────────────────────────────────────────────────────────────
alter table public.studio_build_jobs
  add column if not exists approved_artifact_hash text;

comment on column public.studio_build_jobs.approved_artifact_hash is
  'SA-3 — the artifact_hash the owner reauth-approved, captured once at '
  'owner_review→approved_for_deploy. The deploy binds to THIS (not the mutable '
  'artifact_hash), so a post-approval swap cannot reach production.';

create or replace function public.enforce_studio_build_job_transition()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  -- (b) artifact_hash is WRITE-ONCE after the build phase. A build produces it
  -- (stage in queued/dispatching/building); nothing past QA may change it — a
  -- post-approval swap (even a raw same-stage update from a compromised callback
  -- secret) is rejected here before it can reach the deploy step.
  if old.stage not in ('queued','dispatching','building')
     and new.artifact_hash is distinct from old.artifact_hash then
    raise exception 'studio_build_job artifact_hash is immutable after the build phase (stage=%)', old.stage
      using errcode = 'check_violation';
  end if;
  -- approved_artifact_hash is write-once: once set, it may never change.
  if old.approved_artifact_hash is not null
     and new.approved_artifact_hash is distinct from old.approved_artifact_hash then
    raise exception 'studio_build_job approved_artifact_hash is write-once'
      using errcode = 'check_violation';
  end if;

  -- Same-stage update is an idempotent no-op (a re-delivered callback must
  -- never error) — but only AFTER the immutability guards above.
  if new.stage = old.stage then
    return new;
  end if;

  if (old.stage = 'queued'              and new.stage in ('dispatching','cancelled','stalled'))
  or (old.stage = 'dispatching'         and new.stage in ('building','build_failed','stalled','cancelled'))
  or (old.stage = 'building'            and new.stage in ('qa','build_failed','stalled','cancelled'))
  or (old.stage = 'qa'                  and new.stage in ('client_review','qa_failed','stalled','cancelled'))
  or (old.stage = 'client_review'       and new.stage in ('owner_review','changes_requested','stalled','cancelled'))
  or (old.stage = 'owner_review'        and new.stage in ('approved_for_deploy','changes_requested','stalled','cancelled'))
  or (old.stage = 'approved_for_deploy' and new.stage in ('deploying','cancelled','stalled'))
  or (old.stage = 'deploying'           and new.stage in ('live','stalled'))
  or (old.stage = 'changes_requested'   and new.stage in ('queued','cancelled'))
  or (old.stage = 'build_failed'        and new.stage in ('queued','stalled','cancelled'))
  or (old.stage = 'qa_failed'           and new.stage in ('queued','stalled','cancelled'))
  or (old.stage = 'live'                and new.stage in ('aftercare'))
  or (old.stage = 'stalled'             and new.stage in ('queued','cancelled'))
  then
    return new;
  end if;

  raise exception 'illegal studio_build_job transition: % -> %', old.stage, new.stage
    using errcode = 'check_violation';
end;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- studio_agency_decisions — the durable, server-initiated owner decision inbox
-- ─────────────────────────────────────────────────────────────────────
create table if not exists public.studio_agency_decisions (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.studio_build_jobs(id) on delete cascade,
  project_id uuid not null references public.studio_projects(id) on delete cascade,
  -- The decision kind — a closed set. Each maps to a one-tap owner action or a
  -- read-and-decide nudge. deploy_approval routes to the reauth-gated approve.
  kind text not null check (kind in (
    'deploy_approval','budget_increase','job_stalled','review_stalled',
    'qa_failed','build_failed','deploy_check_failed')),
  status text not null default 'pending' check (status in (
    'pending','acted','superseded','dismissed')),
  title text not null,
  body text not null default '',
  -- The owner action key the one-tap routes to (audit/telemetry only — the
  -- server re-authorizes on the target route; this is never trusted as auth).
  action_key text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  -- Resolution attribution (auth.uid() of the owner who acted, or 'system').
  acted_by text,
  acted_at timestamptz
);

-- Idempotent server-initiated proposals: at most ONE pending decision per
-- (job, kind). A re-running tick that re-detects the same condition upserts the
-- same row instead of flooding the inbox (the founder pending-dedupe discipline).
create unique index if not exists studio_agency_decisions_one_pending
  on public.studio_agency_decisions (job_id, kind)
  where status = 'pending';

create index if not exists studio_agency_decisions_status_idx
  on public.studio_agency_decisions (status, created_at desc);
create index if not exists studio_agency_decisions_job_idx
  on public.studio_agency_decisions (job_id, created_at desc);

comment on table public.studio_agency_decisions is
  'SA-3 — the durable, server-initiated Owner-AI decision inbox (ARCHITECTURE '
  '§4.2), studio-scoped. Deny-RLS / service-role-write / staff-read. One pending '
  'row per (job,kind). Acting routes to the SAME reauth-gated action route — the '
  'gate re-reads true state; a long-lived row is never trusted as authority.';

-- ─────────────────────────────────────────────────────────────────────
-- studio_agency_tick_lock — single-flight guard for the orchestration tick
--   (adversarial finding: concurrent/overlapping cron ticks each read a stale
--   day-spend baseline with a process-local reservation, so two ticks could each
--   dispatch a full daily ceiling — 2x overspend). PostgREST can't hold a session
--   advisory lock across the tick's many statements, so single-flight uses the
--   repo's own CAS-row idiom: a tick acquires the sentinel row only when the
--   prior holder's TTL has expired; a losing tick no-ops. This serializes ticks,
--   so the start-of-tick spend read is always fresh relative to peers and the
--   ceiling reservation holds across ticks, not just within one.
-- ─────────────────────────────────────────────────────────────────────
create table if not exists public.studio_agency_tick_lock (
  id boolean primary key default true check (id),   -- single-row sentinel
  locked_until timestamptz not null default timezone('utc', now()),
  holder text,
  updated_at timestamptz not null default timezone('utc', now())
);
insert into public.studio_agency_tick_lock (id, locked_until)
  values (true, timezone('utc', now()))
  on conflict (id) do nothing;

comment on table public.studio_agency_tick_lock is
  'SA-3 — single-flight lock for /api/agency/tick. CAS on locked_until (TTL) '
  'serializes overlapping cron runs so the daily-ceiling reservation holds '
  'across ticks. Service-role-only (deny-RLS, no policies).';

-- ─────────────────────────────────────────────────────────────────────
-- RLS — default-deny; service-role writes; staff read only (no client read)
-- ─────────────────────────────────────────────────────────────────────
alter table public.studio_agency_decisions enable row level security;
alter table public.studio_agency_tick_lock enable row level security;
-- studio_agency_tick_lock: intentionally NO policies (service-role-only).

drop policy if exists studio_agency_decisions_staff_read on public.studio_agency_decisions;
create policy studio_agency_decisions_staff_read on public.studio_agency_decisions
  for select using (public.studio_is_staff());
-- No INSERT / UPDATE / DELETE policy: writes are service-role-only.

-- end of migration --
