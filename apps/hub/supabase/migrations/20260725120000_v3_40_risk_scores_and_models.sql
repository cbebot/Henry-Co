-- =============================================================================
-- V3-40 — PREDICTIVE FRAUD & RISK: versioned scores, governed models, enforcement log
-- =============================================================================
-- The platform's fraud-risk control surface (Phase E, Wave E.3). Doctrine encoded here:
--
--   * NO AUTO-PUNISHMENT — a prediction only ever FLAGS for human review. The
--     `risk_enforcement_no_auto_punishment` CHECK makes a system-actor hold/freeze
--     impossible at the data layer, not just in code.
--   * STAFF-ONLY VISIBILITY — the scored party never sees a score (PRIVACY-NDPR §5.4).
--     Reads are gated to security-division staff (`is_staff_in('security')` = profiles
--     owner/admin/superadmin); anon has nothing; writes are service-role only.
--   * SHADOW-FIRST GOVERNANCE — every model version starts 'shadow'; promotion is an
--     owner action that stamps approved_by/approved_at; scores carry `shadow` so a
--     shadow score can never be mistaken for an enforceable one.
--
-- Lawful basis (PRIVACY-NDPR §1, packages/config/legal.ts): legitimate interest
-- NDPA 2023 §25(1)(f) + legal obligation §25(1)(c) (fraud prevention / AML control).
-- Never consent-gated; counter-balanced by staff-only visibility, shadow governance,
-- and the staff-override route (the automated-decision objection mechanism).
-- Retention (PRIVACY-NDPR §3): risk scores follow the ANONYMIZE-RETAIN class
-- (legal-obligation evidence) — they do NOT cascade-delete with the account; V3-93
-- executes the per-class model. Export inventory: rows here are staff-only control
-- data about an entity, not a user-readable export source; DSAR handling goes through
-- the anonymize-retain class with staff review.
--
-- Degrade posture: committed-NOT-applied until owner activation. Every reader/writer
-- in code is best-effort — absent tables mean the risk system silently contributes
-- nothing (flag `predictive_shadow` additionally keeps the batch dark).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 0a. Fail-closed staff predicate stub — ONLY when absent (fresh CI / shadow DBs).
--     On prod `public.is_staff_in` exists (20260502120000) and is untouched.
-- ---------------------------------------------------------------------------
do $$ begin
  if to_regprocedure('public.is_staff_in(text,text)') is null then
    create function public.is_staff_in(division_key text, role_key text default null)
    returns boolean
    language sql stable security definer set search_path = public
    as 'select false';
    revoke all on function public.is_staff_in(text, text) from public;
    grant execute on function public.is_staff_in(text, text) to authenticated, service_role;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 0b. Single-flight lock — the V3-43 `workflow_locks` shape, byte-compatible so
--     this migration and the workflow-rail one converge in either apply order
--     (both use create-if-not-exists + seed-on-conflict-do-nothing). CAS idiom:
--     win iff `locked_until < now`, holder-guarded release. Seeded expired so
--     the first acquirer wins.
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
  values ('hub.risk.score', timezone('utc', now()))
on conflict (lock_key) do nothing;

-- ---------------------------------------------------------------------------
-- 1. model_versions — the governed scoring-config registry (E-D3 Option A:
--    "learning" = owner-ratified new versions of this config, never a provider
--    call). `config` carries weights/thresholds/advisory cap ONLY — never a
--    provider or model name (enforced in code before every write; adversarially
--    grepped). Composite natural key (model_kind, version) is what scores FK.
-- ---------------------------------------------------------------------------
create table if not exists public.model_versions (
  id uuid primary key default gen_random_uuid(),
  model_kind text not null,
  version text not null,
  status text not null default 'shadow'
    check (status in ('shadow', 'live', 'rolled_back', 'retired')),
  config jsonb not null,
  approved_by uuid references auth.users (id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  unique (model_kind, version)
);

-- AT MOST ONE live version per model_kind — the enforcement doctrine's DB backstop.
-- Promotion is demote-first (retire the live, then promote the shadow); this partial
-- unique index makes a concurrent double-promote FAIL ATOMICALLY at the second write
-- rather than leaving two live models (the TOCTOU that app-level ordering alone can't
-- close). loadActiveRiskModel would otherwise pick one arbitrarily; here it can't happen.
create unique index if not exists model_versions_one_live_per_kind
  on public.model_versions (model_kind)
  where status = 'live';

-- ---------------------------------------------------------------------------
-- 2. risk_scores — one explainable row per entity per batch run. Idempotent per
--    (entity, model, day) via the partial-free unique below; `contributing_factors`
--    is stable-sorted by the engine so staff explanations reproduce byte-for-byte.
-- ---------------------------------------------------------------------------
create table if not exists public.risk_scores (
  entity_type text not null
    check (entity_type in ('account', 'listing', 'transaction', 'support_ticket')),
  entity_id text not null,
  risk_score integer not null check (risk_score between 0 and 100),
  deterministic_score integer not null check (deterministic_score between 0 and 100),
  tier text not null check (tier in ('pass', 'monitor', 'review', 'freeze')),
  deterministic_tier text not null
    check (deterministic_tier in ('pass', 'monitor', 'review', 'freeze')),
  contributing_factors jsonb not null,
  model_kind text not null default 'fraud_risk',
  model_version text not null,
  shadow boolean not null default true,
  scored_at timestamptz not null default now(),
  scored_on date not null default current_date,
  primary key (entity_type, entity_id, scored_at),
  constraint risk_scores_model_fk
    foreign key (model_kind, model_version)
    references public.model_versions (model_kind, version)
);

create index if not exists risk_scores_latest
  on public.risk_scores (entity_type, entity_id, scored_at desc);
-- The staff queue reads "today's review/freeze entities" — keep that read cheap.
create index if not exists risk_scores_queue_idx
  on public.risk_scores (scored_on desc, tier)
  where tier in ('review', 'freeze');

-- ---------------------------------------------------------------------------
-- 3. risk_enforcement_log — append-only record of every flag and every staff
--    action. THE doctrine constraint lives here: the system actor's vocabulary
--    is 'flag' — hold/freeze/release/override require a staff actor (uuid).
-- ---------------------------------------------------------------------------
create table if not exists public.risk_enforcement_log (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null
    check (entity_type in ('account', 'listing', 'transaction', 'support_ticket')),
  entity_id text not null,
  action text not null
    check (action in ('flag', 'hold', 'freeze', 'release', 'staff_override')),
  tier_at_action text not null
    check (tier_at_action in ('pass', 'monitor', 'review', 'freeze')),
  model_kind text not null default 'fraud_risk',
  model_version text not null,
  shadow boolean not null default true,
  actor text not null,
  reason text,
  created_at timestamptz not null default now(),
  constraint risk_enforcement_model_fk
    foreign key (model_kind, model_version)
    references public.model_versions (model_kind, version),
  -- NO AUTO-PUNISHMENT, enforced by the database itself: a prediction can only
  -- flag; anything user-affecting carries a human actor.
  constraint risk_enforcement_no_auto_punishment
    check (action = 'flag' or actor <> 'system'),
  -- Auditability is not optional: release/override always carry a reason.
  constraint risk_enforcement_reason_required
    check (action not in ('release', 'staff_override') or nullif(btrim(reason), '') is not null)
);

create index if not exists risk_enforcement_entity_idx
  on public.risk_enforcement_log (entity_type, entity_id, created_at desc);

-- ---------------------------------------------------------------------------
-- 4. risk_batch_runs — run journal for observability + the shadow validation
--    report (per-entity-type counts land in `counts`). Concurrency is guarded
--    by the workflow lock, idempotency by risk_scores' daily unique — this
--    table just records what happened.
-- ---------------------------------------------------------------------------
create table if not exists public.risk_batch_runs (
  id uuid primary key default gen_random_uuid(),
  window_day date not null default current_date,
  model_kind text not null default 'fraud_risk',
  model_version text not null,
  status text not null default 'running'
    check (status in ('running', 'done', 'failed')),
  counts jsonb not null default '{}'::jsonb,
  error text,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create index if not exists risk_batch_runs_day_idx
  on public.risk_batch_runs (window_day desc, started_at desc);

-- ---------------------------------------------------------------------------
-- 5. Idempotent daily scoring — the ON CONFLICT target for the batch writer.
-- ---------------------------------------------------------------------------
create unique index if not exists risk_scores_daily_unique
  on public.risk_scores (entity_type, entity_id, model_kind, model_version, scored_on);

-- ---------------------------------------------------------------------------
-- 6. RLS + grants — the V3-AI-01 lockdown template (20260627120000). RLS ON,
--    Supabase auto-granted DML stripped, ONE explicit read re-granted and then
--    gated to security-division staff. The scored party (any ordinary
--    authenticated user) reads NOTHING. anon reads NOTHING. Writes are
--    service-role only (the batch, and staff server actions that run through
--    the assertEnforcementAllowed choke point + admin client).
-- ---------------------------------------------------------------------------
alter table public.model_versions enable row level security;
alter table public.risk_scores enable row level security;
alter table public.risk_enforcement_log enable row level security;
alter table public.risk_batch_runs enable row level security;

revoke all on public.model_versions from anon;
revoke all on public.risk_scores from anon;
revoke all on public.risk_enforcement_log from anon;
revoke all on public.risk_batch_runs from anon;

revoke insert, update, delete, truncate on public.model_versions from authenticated;
revoke insert, update, delete, truncate on public.risk_scores from authenticated;
revoke insert, update, delete, truncate on public.risk_enforcement_log from authenticated;
revoke insert, update, delete, truncate on public.risk_batch_runs from authenticated;

grant select on public.model_versions to authenticated;
grant select on public.risk_scores to authenticated;
grant select on public.risk_enforcement_log to authenticated;
grant select on public.risk_batch_runs to authenticated;

drop policy if exists model_versions_security_staff_select on public.model_versions;
create policy model_versions_security_staff_select on public.model_versions
  for select to authenticated
  using (public.is_staff_in('security'));

drop policy if exists risk_scores_security_staff_select on public.risk_scores;
create policy risk_scores_security_staff_select on public.risk_scores
  for select to authenticated
  using (public.is_staff_in('security'));

drop policy if exists risk_enforcement_security_staff_select on public.risk_enforcement_log;
create policy risk_enforcement_security_staff_select on public.risk_enforcement_log
  for select to authenticated
  using (public.is_staff_in('security'));

drop policy if exists risk_batch_runs_security_staff_select on public.risk_batch_runs;
create policy risk_batch_runs_security_staff_select on public.risk_batch_runs
  for select to authenticated
  using (public.is_staff_in('security'));

-- ---------------------------------------------------------------------------
-- 7. Seed fraud_risk v1.0.0 (SHADOW). Weights are score points; tier map is the
--    pass spec's 0-30-60-85; advisory clamped to 10 points and structurally
--    unable to produce a freeze on its own (engine rule). Owner ratifies any
--    change as a NEW version — never an UPDATE to a scored one.
-- ---------------------------------------------------------------------------
insert into public.model_versions (model_kind, version, status, config)
values (
  'fraud_risk',
  '1.0.0',
  'shadow',
  '{
    "weights": {
      "signal.failed_sensitive_action_burst": 18,
      "signal.listing_spam_pattern": 14,
      "signal.wallet_velocity_anomaly": 22,
      "signal.verification_mismatch": 16,
      "signal.support_abuse_pattern": 10,
      "signal.booking_brute_force": 14,
      "signal.moderation_repeat_failure": 12,
      "signal.upload_pattern_suspicious": 8,
      "threat.credential_spray": 25,
      "threat.shared_device": 18,
      "threat.impossible_travel": 20,
      "threat.new_device_alert": 8,
      "threat.revoked_reuse": 22,
      "threat.reset_pressure": 12,
      "threat.high_risk_cluster": 15,
      "behavioral.velocity_events_24h": 10,
      "behavioral.failed_actions_7d": 12,
      "behavioral.disputes_open": 10,
      "behavioral.trust_deficit": 15,
      "behavioral.graph_degree": 8
    },
    "behavioralScales": {
      "velocity_events_24h": 50,
      "failed_actions_7d": 10,
      "disputes_open": 3,
      "trust_deficit": 100,
      "graph_degree": 10
    },
    "thresholds": { "monitor": 30, "review": 60, "freeze": 85 },
    "advisoryCapPoints": 10
  }'::jsonb
)
on conflict (model_kind, version) do nothing;
