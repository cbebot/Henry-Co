-- V2-SEARCH-01: Search index outbox + workflow tracker.
--
-- Purpose:
--   The single bridge between Postgres source-of-truth and the Typesense
--   search index. Subsystems write small "I changed" rows here on
--   insert/update/delete; a worker drains the outbox every 60s and pushes
--   to Typesense via the admin API.
--
-- DESIGN:
--   * `search_index_outbox`  — append-only queue of pending index ops.
--                              Service-role-only writes. RLS denies SELECT
--                              to authenticated callers; only service role
--                              (the worker) reads it.
--   * `search_workflow_targets` — durable per-user action queue
--                              ("Resume cart", "Confirm care booking",
--                              "Complete KYC"). Subsystems insert/update
--                              rows as state warrants. The outbox AFTER
--                              triggers project these into Typesense as
--                              hc_workflows documents.
--
-- WHY OUTBOX, NOT DIRECT WEBHOOK:
--   Triggers must be fast and side-effect-free for transactional safety —
--   Postgres triggers cannot reliably make HTTP calls (extension-dependent,
--   permission-fragile, blocks the txn). The outbox decouples write
--   latency from index latency: triggers are O(1) inserts, the worker
--   batches network IO.
--
-- WHY STAFF-ONLY READ ON OUTBOX:
--   Outbox payloads include role_visibility hints and pre-resolved
--   summaries that may carry partial PII while in-flight. Only the
--   service-role worker should ever read this table.

set check_function_bodies = off;

------------------------------------------------------------------------
-- 1. search_index_outbox
------------------------------------------------------------------------

create table if not exists public.search_index_outbox (
  id              bigserial primary key,
  collection      text        not null,
  document_id     text        not null,
  operation       text        not null check (operation in ('upsert', 'delete')),
  -- Source row payload at write-time. Worker hydrates and validates against
  -- @henryco/search-core schemas before pushing.
  payload         jsonb       not null default '{}'::jsonb,
  enqueued_at     timestamptz not null default now(),
  -- Worker stamps these once attempted.
  attempted_at    timestamptz,
  attempts        int         not null default 0,
  last_error      text,
  -- Cleared after a successful Typesense ack.
  completed_at    timestamptz
);

create index if not exists idx_search_outbox_pending
  on public.search_index_outbox (enqueued_at)
  where completed_at is null;

create index if not exists idx_search_outbox_collection_doc
  on public.search_index_outbox (collection, document_id);

alter table public.search_index_outbox enable row level security;

-- No SELECT, INSERT, UPDATE, DELETE for any role except service_role.
-- Service role bypasses RLS, so we just deny everyone else explicitly.
drop policy if exists outbox_deny_all on public.search_index_outbox;
create policy outbox_deny_all
  on public.search_index_outbox
  as permissive
  for all
  to authenticated, anon
  using (false)
  with check (false);

comment on table public.search_index_outbox is
  'V2-SEARCH-01: queue drained by the search worker. Service-role only.';

------------------------------------------------------------------------
-- 2. search_workflow_targets
------------------------------------------------------------------------
--
-- Durable per-user "things you have left to do" rows. Powers the
-- hc_workflows synthetic Typesense collection — the differentiator that
-- turns search into a nervous system. Subsystems own the lifecycle:
--   - cart writes one when an abandoned cart > 24h old
--   - care writes one when a booking awaits the user's confirm
--   - account writes one when KYC is pending
-- and so on. Rows are deleted when the action is complete; the outbox
-- AFTER trigger projects insert/update/delete into Typesense.

create table if not exists public.search_workflow_targets (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        not null references auth.users (id) on delete cascade,
  -- Stable identity for the workflow target ("cart_resume", "kyc_complete",
  -- "care_booking_confirm:<booking_id>"). UNIQUE per user so a subsystem
  -- can upsert without duplication.
  workflow_key    text        not null,
  division        text        not null,
  cta_label       text        not null,
  title           text        not null,
  summary         text        not null default '',
  deep_link       text        not null,
  -- High = louder ranking boost; see @henryco/search-core ranking formula.
  urgency         text        not null default 'normal'
                                check (urgency in ('low', 'normal', 'high', 'critical')),
  due_at          timestamptz,
  -- Free-form metadata for ranking signals downstream (e.g. cart total).
  metadata        jsonb       not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  -- Soft-deletion: subsystem clears this when the action completes.
  resolved_at     timestamptz,
  unique (user_id, workflow_key)
);

create index if not exists idx_workflow_targets_active
  on public.search_workflow_targets (user_id, updated_at desc)
  where resolved_at is null;

alter table public.search_workflow_targets enable row level security;

-- The owner can SELECT to render their workflows in product UI; no INSERT
-- /UPDATE/DELETE from authenticated session — subsystems write via
-- service role helpers (e.g. @henryco/cart-saved-items, @henryco/care).
drop policy if exists workflow_targets_owner_select on public.search_workflow_targets;
create policy workflow_targets_owner_select
  on public.search_workflow_targets
  as permissive
  for select
  to authenticated
  using (user_id = auth.uid());

comment on table public.search_workflow_targets is
  'V2-SEARCH-01: durable per-user action queue projected into hc_workflows.';

------------------------------------------------------------------------
-- 3. enqueue_search_index_op() — service-role helper
------------------------------------------------------------------------
--
-- Subsystems and triggers call this rather than INSERTing into the outbox
-- directly. Centralizing it keeps the contract auditable and lets us
-- evolve payload shape in one place.

create or replace function public.enqueue_search_index_op(
  p_collection text,
  p_document_id text,
  p_operation text,
  p_payload jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  if p_collection is null or length(p_collection) = 0 then
    raise exception 'enqueue_search_index_op: collection required';
  end if;
  if p_document_id is null or length(p_document_id) = 0 then
    raise exception 'enqueue_search_index_op: document_id required';
  end if;
  if p_operation not in ('upsert', 'delete') then
    raise exception 'enqueue_search_index_op: invalid operation %', p_operation;
  end if;

  insert into public.search_index_outbox (collection, document_id, operation, payload)
  values (p_collection, p_document_id, p_operation, coalesce(p_payload, '{}'::jsonb));
end;
$$;

revoke all on function public.enqueue_search_index_op(text, text, text, jsonb) from public;
grant execute on function public.enqueue_search_index_op(text, text, text, jsonb) to service_role;

------------------------------------------------------------------------
-- 4. Workflow trigger — projects search_workflow_targets to outbox
------------------------------------------------------------------------

create or replace function public.tg_workflow_targets_to_outbox()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_doc_id text;
  v_payload jsonb;
begin
  if (tg_op = 'DELETE') then
    v_doc_id := 'account:workflow:' || old.id::text;
    perform public.enqueue_search_index_op('hc_workflows', v_doc_id, 'delete', '{}'::jsonb);
    return old;
  end if;

  v_doc_id := 'account:workflow:' || new.id::text;

  -- Soft-delete: resolved rows are removed from index.
  if (new.resolved_at is not null) then
    perform public.enqueue_search_index_op('hc_workflows', v_doc_id, 'delete', '{}'::jsonb);
    return new;
  end if;

  v_payload := jsonb_build_object(
    'id', v_doc_id,
    'type', 'workflow',
    'division', new.division,
    'title', new.title,
    'summary', new.summary,
    'deep_link', new.deep_link,
    'role_visibility', jsonb_build_array('owner'),
    'trust_state', 'unknown',
    'created_at', extract(epoch from new.created_at)::bigint,
    'updated_at', extract(epoch from new.updated_at)::bigint,
    'tags', jsonb_build_array('workflow', new.workflow_key, new.urgency),
    'cta_label', new.cta_label,
    'due_at', new.due_at,
    'owner_user_id', new.user_id,
    'ranking_signals', jsonb_build_object(
      'workflow_urgency',
      case new.urgency
        when 'critical' then 1.0
        when 'high' then 0.75
        when 'normal' then 0.5
        else 0.25
      end
    )
  );

  perform public.enqueue_search_index_op('hc_workflows', v_doc_id, 'upsert', v_payload);
  return new;
end;
$$;

drop trigger if exists tr_workflow_targets_to_outbox on public.search_workflow_targets;
create trigger tr_workflow_targets_to_outbox
  after insert or update or delete on public.search_workflow_targets
  for each row execute function public.tg_workflow_targets_to_outbox();

------------------------------------------------------------------------
-- 5. Retention: clear completed outbox rows after 7 days
------------------------------------------------------------------------
--
-- The worker stamps completed_at on success. Old rows are not retried —
-- their existence is purely an audit trail. Cron prunes >7d.

create or replace function public.purge_completed_search_outbox(p_older_than interval default '7 days')
returns int
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_count int;
begin
  delete from public.search_index_outbox
   where completed_at is not null
     and completed_at < now() - p_older_than;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.purge_completed_search_outbox(interval) from public;
grant execute on function public.purge_completed_search_outbox(interval) to service_role;

comment on function public.purge_completed_search_outbox(interval) is
  'V2-SEARCH-01: prune completed outbox rows older than interval. Worker calls this opportunistically.';
