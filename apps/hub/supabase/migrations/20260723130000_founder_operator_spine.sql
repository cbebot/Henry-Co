-- SA-4 — the Owner-AI operator spine (hub side). Three additive pieces, all
-- flag-dark (nothing reads or writes these until FOUNDER_ACTIONS_LIVE=1 +
-- FOUNDER_ACTIONS_TRANCHE>=3 + STUDIO_AGENCY_LIVE=1):
--
--   1. founder_action_proposals.origin — server-initiated ('operator') proposals
--      live beside chat-born ones in the SAME table, confirmed by the SAME
--      reauth-gated route (ARCHITECTURE §4.2). Long TTLs are safe because the
--      confirm route re-reads true state via driftKeys — the gate never trusted
--      proposal freshness.
--   2. ai_operator_spend_ledger (+ RPCs) — the operator's NON-BILLABLE daily
--      internal-spend counter (MONEY-MODEL §5), the ai_free_spend_ledger idiom:
--      one row per UTC day, atomic upsert increment, service-role only. The
--      ₦5,000/day ceiling itself lives in code (operator-budget.ts) and is
--      enforced OUTSIDE the model at the tick.
--   3. ai_operator_tick_lock — single-flight sentinel for the operator tick
--      (the SA-3 studio_agency_tick_lock lesson: two overlapping cron ticks
--      must not each read a stale day-spend baseline and each spend a full
--      ceiling). Deliberately its OWN row — the SA-3 migration forbids forking
--      the studio spine, and the two ticks run on independent cadences.
--
-- Plus one lock-step reconcile: customer_notifications_category_check is
-- re-stated to include EVERY registered EVENT_TYPE id. This also closes a
-- LATENT PRE-EXISTING GAP found during this pass: marketplace.seller.review and
-- marketplace.product.review were added to packages/notifications/event-types.ts
-- (the F3 tranche-2 fix) but never to this constraint, so those publishes fail
-- the CHECK today (the exact drift class the 2026-06-06 reconcile documented).
--
-- RLS posture: both new tables deny-all (RLS on, ZERO policies — service-role
-- only, the founder_action_proposals / studio_agency_tick_lock discipline).
-- RPCs: SECURITY DEFINER, search_path pinned, EXECUTE revoked from
-- public/anon/authenticated and granted to service_role only.
--
-- DOWN: drop the two tables + two RPCs; drop the origin column + its index;
-- re-state the previous category CHECK (20260610121000).

set check_function_bodies = off;

-- ─────────────────────────────────────────────────────────────────────
-- 1. Server-initiated proposals — origin + per-origin lifetime
-- ─────────────────────────────────────────────────────────────────────
alter table public.founder_action_proposals
  add column if not exists origin text not null default 'chat'
    check (origin in ('chat', 'operator'));

comment on column public.founder_action_proposals.origin is
  'SA-4 — who raised this proposal: ''chat'' (born inside an owner chat turn, '
  '15-min viewing TTL) or ''operator'' (raised by the offline operator tick; '
  'lives until acted on or superseded — the confirm route re-reads true state '
  'via driftKeys, so a long-lived row is never trusted as authority).';

-- The decisions-inbox read: pending operator proposals for an owner, newest first.
create index if not exists founder_action_proposals_operator_inbox_idx
  on public.founder_action_proposals (user_id, origin, status, created_at desc);

-- ─────────────────────────────────────────────────────────────────────
-- 2. ai_operator_spend_ledger — the operator's daily internal-spend counter
-- ─────────────────────────────────────────────────────────────────────
create table if not exists public.ai_operator_spend_ledger (
  window_day date primary key default current_date,
  spent_kobo bigint not null default 0,
  updated_at timestamptz not null default now()
);

comment on table public.ai_operator_spend_ledger is
  'SA-4 — durable daily counter for the Owner-AI operator''s NON-BILLABLE '
  'internal AI spend (MONEY-MODEL §5). One row per UTC day. The ₦5,000/day '
  'ceiling is enforced in the operator tick OUTSIDE the model; this ledger is '
  'the cross-tick truth the ceiling reads. Deny-RLS, service-role-only, '
  'written solely through ai_operator_spend_add.';

alter table public.ai_operator_spend_ledger enable row level security;
-- intentionally NO policies — service-role only.
revoke all on public.ai_operator_spend_ledger from anon, authenticated;

create or replace function public.ai_operator_spend_today()
returns bigint
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    (select spent_kobo from public.ai_operator_spend_ledger where window_day = current_date),
    0
  );
$$;

create or replace function public.ai_operator_spend_add(p_add_kobo bigint)
returns bigint
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_total bigint;
begin
  -- Atomic upsert increment: the addition runs inside the row lock of the
  -- conflicting upsert, so concurrent adds serialize in the DB. greatest(0, …)
  -- clamps negatives — the counter can never be decremented.
  insert into public.ai_operator_spend_ledger (window_day, spent_kobo)
    values (current_date, greatest(0, coalesce(p_add_kobo, 0)))
  on conflict (window_day) do update set
    spent_kobo = public.ai_operator_spend_ledger.spent_kobo + greatest(0, coalesce(p_add_kobo, 0)),
    updated_at = now()
  returning spent_kobo into v_total;
  return v_total;
end;
$$;

revoke execute on function public.ai_operator_spend_today() from public, anon, authenticated;
revoke execute on function public.ai_operator_spend_add(bigint) from public, anon, authenticated;
grant execute on function public.ai_operator_spend_today() to service_role;
grant execute on function public.ai_operator_spend_add(bigint) to service_role;

-- ─────────────────────────────────────────────────────────────────────
-- 3. ai_operator_tick_lock — single-flight guard for the operator tick
-- ─────────────────────────────────────────────────────────────────────
create table if not exists public.ai_operator_tick_lock (
  id boolean primary key default true check (id),   -- single-row sentinel
  locked_until timestamptz not null default timezone('utc', now()),
  holder text,
  updated_at timestamptz not null default timezone('utc', now())
);
insert into public.ai_operator_tick_lock (id, locked_until)
  values (true, timezone('utc', now()))
  on conflict (id) do nothing;

comment on table public.ai_operator_tick_lock is
  'SA-4 — single-flight lock for the hub operator tick. CAS on locked_until '
  '(TTL) serializes overlapping cron runs so the daily-ceiling read is always '
  'fresh relative to peers (the SA-3 concurrent-tick lesson). Service-role-only '
  '(deny-RLS, no policies). Deliberately separate from studio_agency_tick_lock.';

alter table public.ai_operator_tick_lock enable row level security;
-- intentionally NO policies — service-role only.
revoke all on public.ai_operator_tick_lock from anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────
-- 4. customer_notifications_category_check — lock-step re-state
-- ─────────────────────────────────────────────────────────────────────
alter table public.customer_notifications
  drop constraint if exists customer_notifications_category_check;

alter table public.customer_notifications
  add constraint customer_notifications_category_check
  check (category = any (array[
    -- Legacy coarse vocabulary (pre-V2-NOT-01).
    'general','care','marketplace','studio','wallet','security','support','account','promotion',
    -- Registered EVENT_TYPE ids — packages/notifications/event-types.ts.
    'auth.signup.welcome','auth.password.changed','auth.security.new_device','system.welcome',
    'logistics.shipment.update','marketplace.order.update','property.viewing.update',
    'learn.enrollment.update','studio.project.update','care.booking.update',
    'support.reply.received','support.thread.created','wallet.transaction.update',
    'kyc.review.update','system.notification.relay',
    'account.recovery.reminder',
    -- F3 tranche-2 seller/product verdicts — REGISTERED in event-types.ts but
    -- missing from every prior re-state of this constraint (latent gap closed
    -- in this pass; their inserts were failing this CHECK).
    'marketplace.seller.review','marketplace.product.review',
    -- SA-4 Owner-AI operator escalation (urgent — fans out to owner push).
    'owner.operator.escalation'
  ]::text[]));

comment on constraint customer_notifications_category_check on public.customer_notifications is
  'Allowed category vocabulary = 9 legacy coarse values UNION the registered '
  'EVENT_TYPE ids from packages/notifications/event-types.ts. Keep in lock-step '
  'with event-types.ts. Widened 2026-07-23 for owner.operator.escalation (SA-4) '
  'and to close the latent marketplace.seller.review / marketplace.product.review gap.';

-- end of migration --
