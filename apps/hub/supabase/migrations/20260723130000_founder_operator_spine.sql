-- SA-4 — the Owner-AI operator spine (hub side). RETARGETED by V3-43: the
-- operator's single-flight lock and its NON-BILLABLE daily spend counter are NO
-- LONGER created here as their own tables. They now reuse the ONE consolidated
-- rail primitives created in 20260724120000_v3_43_workflow_rail.sql:
--
--   • single-flight  → public.workflow_locks, key 'hub.operator.tick'
--   • daily spend    → public.internal_ai_spend_ledger, budget_key 'operator'
--
-- This is the architect's "never two" constraint (verified on prod 2026-07-23:
-- ONE lock table + ONE spend ledger exist; do not let this migration land a
-- second of each). The operator tick reads those primitives at runtime; this
-- migration therefore carries only the two pieces that ARE the operator's own:
--
--   1. founder_action_proposals.origin — server-initiated ('operator') proposals
--      live beside chat-born ones in the SAME table, confirmed by the SAME
--      reauth-gated route (ARCHITECTURE §4.2). Long TTLs are safe because the
--      confirm route re-reads true state via driftKeys — the gate never trusted
--      proposal freshness.
--   2. customer_notifications_category_check — re-stated to include EVERY
--      registered EVENT_TYPE id (adds owner.operator.escalation, and closes the
--      latent marketplace.seller.review / marketplace.product.review gap the F3
--      tranche-2 fix left).
--
-- Apply order: this file (20260723130000) applies BEFORE the rail
-- (20260724120000); it is self-contained (touches only founder_action_proposals
-- + customer_notifications), so the ordering is safe either way. The operator
-- code only needs the rail primitives at RUNTIME (activation), by which point
-- both migrations are applied.
--
-- RLS posture unchanged. DOWN: drop the origin column + its index; re-state the
-- previous category CHECK (20260610121000).

set check_function_bodies = off;

-- ─────────────────────────────────────────────────────────────────────
-- 1. Server-initiated proposals — origin + per-origin lifetime
--    Guarded by table existence: the runbook applies the base
--    founder_action_proposals migration (20260710160000) first, but the guard
--    makes this spine safe to run standalone (it no-ops the origin add rather
--    than aborting on a prod that has not yet applied the founder stack).
-- ─────────────────────────────────────────────────────────────────────
do $$
begin
  if to_regclass('public.founder_action_proposals') is not null then
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
  else
    raise notice 'founder_action_proposals absent — apply 20260710160000 first; origin column skipped';
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────────────
-- 2. (RETARGETED) operator single-flight lock + spend ledger — REMOVED.
--    Previously created public.ai_operator_tick_lock and
--    public.ai_operator_spend_ledger (+ ai_operator_spend_today / _add RPCs).
--    Both are superseded by the V3-43 rail primitives (workflow_locks key
--    'hub.operator.tick' and internal_ai_spend_ledger budget_key 'operator').
--    The operator tick (apps/hub/lib/founder-intelligence/operator-tick.ts) is
--    rewired to those in the same PR. Nothing to create here.
-- ─────────────────────────────────────────────────────────────────────

-- ─────────────────────────────────────────────────────────────────────
-- 3. customer_notifications_category_check — lock-step re-state
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
