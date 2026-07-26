-- SA-2 — the autonomous build agent's job spine. The orchestration state
-- machine (studio_build_jobs) + append-only log (studio_build_events) +
-- operational cost metering (studio_build_usage) + the governed build rate
-- card, all composing the repo's own outbox+cron idiom (no new queue).
--
-- WHY (docs/v3/studio-agency/ARCHITECTURE.md §3, MONEY-MODEL §3):
--   An approved brief becomes a budget-capped, auditable job envelope. A
--   cron tick advances it; an external sandboxed executor reports over an
--   HMAC callback; a hard human one-tap+reauth gate is the only door to
--   deploy. Every transition is legal-checked in ONE place — the app-layer
--   choke point (state-machine.ts) AND this DB trigger, belt and braces
--   exactly as enforce_payment_intent_transition does for payment intents.
--
-- TABLE-OPS:
--   public.studio_build_jobs   (CREATE) — the state machine row.
--   public.studio_build_events (CREATE) — append-only per-job log.
--   public.studio_build_usage  (CREATE) — per-attempt provider-cost metering.
--   public.pricing_rule_books  (SEED)   — studio-build-rate-card-v1 (guarded, conditional).
--
-- MONEY: composes the LIVE spine, introduces NO new money RPC and touches NO
--   existing one. studio_build_usage is OPERATIONAL metering (kobo BIGINT),
--   NOT a ledger post — finance reconciles the provider invoice against
--   Σ provider_cost_kobo (MONEY-MODEL §3). Client cash + ledger revenue flow
--   only through the unchanged studio card rail. No wallet, no payments_private.
--
-- RLS: all three tables default-deny with ZERO write policies (service-role
--   writes only — the founder_action_proposals discipline). Client SELECT is
--   limited to a STAGE PROJECTION of their OWN project's jobs (never the spec,
--   never internal cost) via studio_build_jobs_client_stage_v; staff read the
--   raw rows via studio_is_staff().
--
-- DEPLOY ORDER: safe to ship code-first — the studio store degrades on missing
--   tables and the tick/callback no-op until applied. The rate-card seed is
--   conditional on pricing_rule_books existing (a hub-owned table), so a
--   studio-only shadow build never fails on it.
--
-- DOWN: drop the view, the three tables, the trigger + function.

-- ─────────────────────────────────────────────────────────────────────
-- 1. studio_build_jobs — the state machine
-- ─────────────────────────────────────────────────────────────────────
create table if not exists public.studio_build_jobs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.studio_projects(id) on delete cascade,
  brief_id uuid not null references public.studio_briefs(id) on delete cascade,
  -- The frozen BuildJobSpec (PII-scrubbed at render). The agent's whole input.
  spec jsonb not null default '{}'::jsonb,
  stage text not null default 'queued' check (stage in (
    'queued','dispatching','building','qa','client_review','owner_review',
    'approved_for_deploy','deploying','live','aftercare',
    'build_failed','qa_failed','changes_requested','stalled','cancelled')),
  attempt int not null default 0,
  -- Mode A only in SA-2 (fixed-price internal envelope). Track 1 (bundle) only.
  cost_mode text not null default 'mode_a' check (cost_mode in ('mode_a','mode_b')),
  track text not null default 'bundle' check (track in ('bundle','codegen')),
  budget_kobo bigint not null check (budget_kobo >= 0),
  cost_kobo bigint not null default 0 check (cost_kobo >= 0),
  -- CAS claim for the tick — one worker per job.
  claimed_by text,
  claimed_at timestamptz,
  -- Runner run id from the first heartbeat — stall-kill + log linkage bind here.
  executor_run_ref text,
  last_heartbeat_at timestamptz,
  -- Monotonic per (job, attempt); a non-increasing heartbeat is rejected.
  heartbeat_seq bigint not null default 0,
  -- Content-addressed artifact + its sha256 (the deploy step re-verifies this).
  artifact_ref text,
  artifact_hash text,
  preview_ref text,
  qa jsonb,
  -- SA-1 discriminator carried onto the job (only 'template' is buildable here).
  brief_class text check (brief_class is null or brief_class in ('template','agency')),
  -- Owner-invoked company site (R&D) — no client payment leg (MONEY-MODEL §5).
  is_internal boolean not null default false,
  -- Warranty-fix jobs link to the closed parent (never mutate a closed job).
  parent_job_id uuid references public.studio_build_jobs(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- One ACTIVE job per project (ARCHITECTURE §3.5) — a partial unique index over
-- the non-terminal stages.
create unique index if not exists studio_build_jobs_one_active_per_project
  on public.studio_build_jobs (project_id)
  where stage in (
    'queued','dispatching','building','qa','client_review','owner_review',
    'approved_for_deploy','deploying','changes_requested');

create index if not exists studio_build_jobs_stage_idx
  on public.studio_build_jobs (stage, updated_at desc);
create index if not exists studio_build_jobs_project_idx
  on public.studio_build_jobs (project_id, created_at desc);

comment on table public.studio_build_jobs is
  'SA-2 — the build-agent job envelope + state machine. Budget-capped (kobo '
  'BIGINT), audited, RLS default-deny/service-role-write. The ONLY door to '
  'stage=deploying is stage=approved_for_deploy, reached solely by the human '
  'one-tap+reauth confirm — enforced by the transition trigger below.';

-- ─────────────────────────────────────────────────────────────────────
-- 2. The legal-transition trigger — the DB half of the single choke point
--    (mirrors LEGAL_TRANSITIONS in apps/studio/lib/agency/state-machine.ts;
--    the enforce_payment_intent_transition doctrine).
-- ─────────────────────────────────────────────────────────────────────
create or replace function public.enforce_studio_build_job_transition()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  -- Same-stage update is an idempotent no-op (a re-delivered callback must
  -- never error).
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

drop trigger if exists studio_build_jobs_enforce_transition on public.studio_build_jobs;
create trigger studio_build_jobs_enforce_transition
  before update on public.studio_build_jobs
  for each row execute function public.enforce_studio_build_job_transition();

-- ─────────────────────────────────────────────────────────────────────
-- 3. studio_build_events — append-only job log
-- ─────────────────────────────────────────────────────────────────────
create table if not exists public.studio_build_events (
  id bigint generated always as identity primary key,
  job_id uuid not null references public.studio_build_jobs(id) on delete cascade,
  kind text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists studio_build_events_job_idx
  on public.studio_build_events (job_id, created_at);

comment on table public.studio_build_events is
  'SA-2 — append-only per-job log: every transition, heartbeat, gate verdict, '
  'approval, deploy. correlationId = job_id across audit + telemetry.';

-- ─────────────────────────────────────────────────────────────────────
-- 4. studio_build_usage — per-attempt provider cost metering (MONEY-MODEL §3)
-- ─────────────────────────────────────────────────────────────────────
create table if not exists public.studio_build_usage (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.studio_build_jobs(id) on delete cascade,
  attempt int not null,
  source text not null check (source in ('executor','gateway')),
  usage jsonb not null default '{}'::jsonb,
  provider_cost_kobo bigint not null default 0 check (provider_cost_kobo >= 0),
  -- FK-by-value to ai_usage_events when source='gateway' (no hard FK: that
  -- table is payments-schema-adjacent and this join is app-held, per the
  -- escalated_thread_id precedent).
  usage_event_id uuid,
  created_at timestamptz not null default timezone('utc', now()),
  -- Idempotent settlement — a re-delivered executor report cannot double-count.
  unique (job_id, attempt, source)
);

create index if not exists studio_build_usage_job_idx
  on public.studio_build_usage (job_id);

comment on table public.studio_build_usage is
  'SA-2 — OPERATIONAL cost metering (kobo BIGINT), not a ledger post. Finance '
  'reconciles the provider invoice against Σ provider_cost_kobo. Idempotent by '
  '(job_id, attempt, source).';

-- ─────────────────────────────────────────────────────────────────────
-- 4b. studio_build_bundles — the content-addressed Track-1 artifact store
--     (ARCHITECTURE §2.6: DB rows for small bundles; NEVER Cloudinary / any
--     public-URL store — the FIRE audits named permanent public media URLs as
--     the systemic risk, and this design does not add an instance).
-- ─────────────────────────────────────────────────────────────────────
create table if not exists public.studio_build_bundles (
  content_hash text primary key check (content_hash ~ '^[0-9a-f]{64}$'),
  job_id uuid not null references public.studio_build_jobs(id) on delete cascade,
  bundle jsonb not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists studio_build_bundles_job_idx
  on public.studio_build_bundles (job_id, created_at desc);

comment on table public.studio_build_bundles is
  'SA-2 — content-addressed (sha256) Track-1 site bundles. Service-role-only '
  '(the renderer app reads via service role; preview bundles are never public). '
  'The deploy step re-hashes the row and refuses to flip live on a mismatch.';

-- ─────────────────────────────────────────────────────────────────────
-- 4c. studio_sites — the host → live/preview bundle pointer (the renderer's
--     lookup). Go-live = flip the pointer (instant, instantly reversible).
-- ─────────────────────────────────────────────────────────────────────
create table if not exists public.studio_sites (
  host text primary key,
  job_id uuid references public.studio_build_jobs(id) on delete set null,
  project_id uuid references public.studio_projects(id) on delete set null,
  bundle_hash text references public.studio_build_bundles(content_hash) on delete set null,
  status text not null default 'preview' check (status in ('preview','live','disabled')),
  -- Token-gated preview: a nonce the client's authenticated portal appends to
  -- reach an unreleased site (an open preview URL would leak it).
  preview_token text,
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists studio_sites_project_idx
  on public.studio_sites (project_id);

comment on table public.studio_sites is
  'SA-2 — host → bundle pointer for apps/studio-sites. status=live serves the '
  'released bundle; status=preview is token-gated. Service-role-only writes; '
  'the renderer reads via service role.';

-- ─────────────────────────────────────────────────────────────────────
-- 5. RLS — default-deny; service-role writes; client reads a stage projection
-- ─────────────────────────────────────────────────────────────────────
alter table public.studio_build_jobs enable row level security;
alter table public.studio_build_events enable row level security;
alter table public.studio_build_usage enable row level security;
alter table public.studio_build_bundles enable row level security;
alter table public.studio_sites enable row level security;

-- Bundles + site pointers are service-role-only for BOTH read and write: a
-- preview bundle must never be reachable via the Data API. The renderer app
-- reads them with the service-role key server-side. No policy = deny-all to
-- anon/authenticated (RLS on, zero policies).
-- (studio_build_bundles / studio_sites: intentionally NO policies.)

-- Staff read raw rows; a client NEVER reads studio_build_jobs directly (the
-- spec + internal cost live here). The client's honest stage comes from the
-- view below.
drop policy if exists studio_build_jobs_staff_read on public.studio_build_jobs;
create policy studio_build_jobs_staff_read on public.studio_build_jobs
  for select using (public.studio_is_staff());
-- No INSERT / UPDATE / DELETE policy: writes are service-role-only.

drop policy if exists studio_build_events_staff_read on public.studio_build_events;
create policy studio_build_events_staff_read on public.studio_build_events
  for select using (public.studio_is_staff());

drop policy if exists studio_build_usage_staff_read on public.studio_build_usage;
create policy studio_build_usage_staff_read on public.studio_build_usage
  for select using (public.studio_is_staff());

-- The client-facing projection: ONLY the honest stage of the client's OWN
-- project's jobs — never the spec, never cost, never the artifact ref.
-- security_invoker=on so the caller's RLS on studio_projects gates the join.
create or replace view public.studio_build_jobs_client_stage_v
  with (security_invoker = on)
as
  select
    j.id,
    j.project_id,
    j.stage,
    j.updated_at
  from public.studio_build_jobs j
  where exists (
    select 1 from public.studio_projects sp
    where sp.id = j.project_id
      and (
        sp.client_user_id = auth.uid()
        or (sp.normalized_email is not null and sp.normalized_email = public.studio_auth_email())
        or (
          sp.client_business_id is not null
          and exists (
            select 1 from public.business_members bm
            where bm.business_id = sp.client_business_id
              and bm.user_id = auth.uid()
          )
        )
      )
  );

comment on view public.studio_build_jobs_client_stage_v is
  'SA-2 — the ONLY client-visible read of a build job: id + project_id + stage '
  '+ updated_at for the client''s own project. Never spec, cost, or artifact.';

-- ─────────────────────────────────────────────────────────────────────
-- 6. Seed the governed build rate card (conditional — pricing_rule_books is
--    a hub-owned table; skip cleanly on a studio-only shadow build).
--    Kept byte-compatible with DEFAULT_ENVELOPE_RULES + the build-agent tier
--    in apps/studio/lib/agency/rate-card.ts (lockstep, like defaultAiUsageRules).
-- ─────────────────────────────────────────────────────────────────────
do $$
begin
  if to_regclass('public.pricing_rule_books') is not null then
    insert into public.pricing_rule_books
      (rule_book_key, label, description, division, currency, status, version, rules)
    values (
      'studio-build-rate-card-v1',
      'Studio build-agent rate card',
      'Per-token provider rates for the sandboxed build agent + the Mode-A job '
        || 'cost-envelope knobs (fraction of package price, floor/ceiling kobo). '
        || 'Keep in lockstep with apps/studio/lib/agency/rate-card.ts.',
      'ai',
      'NGN',
      'active',
      '2026-07-19',
      jsonb_build_object(
        'key', 'studio-build-rate-card-v1',
        'version', '2026-07-19',
        'currency', 'NGN',
        'envelope', jsonb_build_object(
          'fraction', 0.2,
          'floorKobo', 1000000,
          'ceilingKobo', 10000000
        ),
        'tiers', jsonb_build_object(
          'deep', jsonb_build_object(
            'rate', jsonb_build_object('in', 0.8, 'out', 4, 'cacheRead', 0.08, 'cacheWrite', 1),
            'marginRate', 0.35,
            'minChargeableKobo', 500,
            'maxCostKoboPerCall', 200000
          )
        )
      )
    )
    on conflict (rule_book_key) do update set
      rules = excluded.rules,
      version = excluded.version,
      label = excluded.label,
      description = excluded.description,
      division = excluded.division,
      currency = excluded.currency,
      status = excluded.status,
      updated_at = timezone('utc', now());
  end if;
end $$;

-- end of migration --
