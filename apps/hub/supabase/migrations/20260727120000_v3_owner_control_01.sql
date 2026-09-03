-- V3-OWNER-CONTROL-01 — owner action rail
--
-- WHY THIS EXISTS
-- On 2026-07-25 two marketplace sellers registered (applications created 10:04
-- and 10:07 UTC). The owner had no approve/reject control in HQ, so both rows
-- were flipped to 'approved' by a hand-written UPDATE at 22:22:45.573254+00 —
-- the identical microsecond on both rows, which is the signature of one raw SQL
-- statement rather than two UI decisions. `audit_logs` holds ZERO rows for any
-- marketplace/seller action: the manual path left no trail at all.
--
-- The root cause was NOT a missing button. apps/marketplace already ships a
-- vendor-application queue with working buttons (#531/#532). It is gated by
-- `marketplace_role_memberships.role in (marketplace_owner, marketplace_admin)`,
-- while HQ is gated by `owner_profiles`. Nothing maps one onto the other, and
-- the single live `marketplace_owner` membership belongs to a DIFFERENT user id
-- than the single active `owner_profiles` row. So HQ's "Open live division app"
-- deep link sent the owner across an authorization boundary he was not
-- provisioned into, and apps/marketplace silently redirect()'d him to /account.
--
-- The fix is to let the owner act from HQ, under HQ's own identity, with a
-- durable trail. This migration adds the rail that makes that safe:
--
--   1. public.owner_control_actions — a two-phase action ledger. Claim before
--      the mutation (idempotency), settle after it (outcome). RLS default-deny;
--      no policies; all writes service_role.
--   2. owner_control_claim_action / owner_control_settle_action — the two
--      guarded RPCs the rail uses. service_role-only, search_path pinned, and
--      each ASSERTS the passed actor is a live owner_profiles row so a forged
--      actor id is rejected by the database itself, not merely by app code.
--   3. owner_set_vendor_active — atomic vendor suspend/reinstate. The vendor
--      status flip and the role-membership flip must land in one transaction or
--      a half-suspended vendor keeps selling; two PostgREST calls cannot
--      guarantee that, one function can.
--   4. A CHECK on marketplace_vendors.status, because this pass makes
--      'suspended' a real, written state for the first time and a typo'd status
--      would otherwise be a silent no-op that leaves a suspended seller live.
--
-- POSTURE (mirrors 20260710160000_founder_action_proposals + the sec_harden_08
-- latent-grant lesson): RLS on, zero policies, write grants revoked from anon
-- and authenticated, EXECUTE revoked from PUBLIC (Postgres grants EXECUTE to
-- PUBLIC by default — omitting the revoke makes the service_role grant a no-op).
--
-- MONEY: this migration creates no money path. It does not touch
-- payments_private, the ledger, marketplace_payout_requests, refunds, or
-- marketplace_order_groups.payout_status. Dispute resolution in the rail above
-- is deliberately restricted to the non-refund branch.

-- ---------------------------------------------------------------------------
-- 1. The action ledger
-- ---------------------------------------------------------------------------

create table if not exists public.owner_control_actions (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references auth.users (id) on delete restrict,
  actor_role text not null,
  action_key text not null,
  entity_type text not null,
  entity_id text not null,
  division text not null,
  from_state text,
  to_state text,
  note text,
  -- 'claimed' is written before the mutation; the settle call moves it to a
  -- terminal value. A row stuck in 'claimed' means the process died mid-action
  -- and is a genuine signal worth alerting on, not noise.
  outcome text not null default 'claimed'
    check (outcome in ('claimed', 'applied', 'no_op', 'failed')),
  failure_reason text,
  idempotency_key text not null,
  audit_id uuid,
  reauth_required boolean not null default false,
  created_at timestamptz not null default now(),
  settled_at timestamptz
);

-- The idempotency contract: one physical action per key. A replayed request
-- (network retry, double-tap, the sensitive-action modal re-issuing the
-- original request after reauth) finds the existing row and re-reads its
-- outcome instead of mutating a second time.
create unique index if not exists owner_control_actions_idempotency_idx
  on public.owner_control_actions (idempotency_key);

create index if not exists owner_control_actions_actor_idx
  on public.owner_control_actions (actor_id, created_at desc);

create index if not exists owner_control_actions_entity_idx
  on public.owner_control_actions (entity_type, entity_id, created_at desc);

alter table public.owner_control_actions enable row level security;

-- Deliberately NO policies: default-deny for anon and authenticated. The owner
-- reads this history through the server (service_role) after requireOwner(),
-- so no client-side read path is needed and none is granted.
revoke all on public.owner_control_actions from anon, authenticated;

comment on table public.owner_control_actions is
  'V3-OWNER-CONTROL-01 owner action ledger. Two-phase: claim (idempotency) then settle (outcome). RLS default-deny, service_role only.';

-- ---------------------------------------------------------------------------
-- 2. Guarded RPCs
-- ---------------------------------------------------------------------------

-- The SQL half of the rail's authorization gate, called by the app under the
-- CALLER'S OWN JWT so the answer is anchored on auth.uid() and cannot be
-- influenced by anything the request supplies.
--
-- WHY NOT JUST CALL public.is_owner()? Because on prod as captured in
-- supabase/prod-actual/schema.sql it is SECURITY INVOKER, and reading
-- owner_profiles re-triggers owner_profiles' own RLS — whose
-- `owner_profiles_owner_write ... using (is_owner())` policy calls it again.
-- That is the HUB-1 recursion trap ("stack depth limit exceeded"), which is
-- masked today only because every existing caller reaches owner_profiles
-- through service-role. 20260710180000_hub_security_hardening.sql redefines
-- is_owner() as SECURITY DEFINER to fix exactly this, but that migration is
-- committed, not confirmed applied — and an authorization gate that fails
-- closed on a recursion error would leave the owner unable to act, which is the
-- very outage this pass exists to end.
--
-- So the rail owns its predicate. SECURITY DEFINER reads owner_profiles without
-- being subject to owner_profiles' RLS, breaking the cycle; the function is a
-- boolean self-check that returns no rows, so it leaks nothing. This mirrors
-- public.owner_inbox_is_owner() (20260615103000), which is already proven on
-- this database by apps/hub/scripts/owner-inbox/prove-owner-inbox-rls.sql.
--
-- Bound on user_id ONLY, never email: "email-OR role binding" is a named
-- ecosystem-wide FIRE finding, and a surface that suspends sellers is the last
-- place to honour the looser binding.
-- The role test is byte-exact, deliberately. An earlier draft wrote
-- `lower(trim(op.role))` here while owner_control_assert_actor() below tested
-- `op.role` bare, which left this rail carrying TWO definitions of "owner" that
-- agree only because owner_profiles_role_check pins the vocabulary to exact
-- lowercase. Two predicates for one question is a bug waiting for whoever
-- relaxes that CHECK: the looser one decides who sees the buttons, the stricter
-- one decides who may press them, and the gap between them is a console that
-- offers actions it then refuses. Both now match each other, and public.is_owner(),
-- character for character.
create or replace function public.owner_control_is_owner()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.owner_profiles op
    where op.user_id = (select auth.uid())
      and op.is_active = true
      and op.role in ('owner', 'admin')
  );
$$;

-- EXECUTE is granted to PUBLIC by default, so the revoke is mandatory, not
-- tidiness. Only a signed-in session evaluates this; anon has a NULL auth.uid()
-- and would always get false, but it has no business calling it at all.
revoke all on function public.owner_control_is_owner() from public, anon, authenticated, service_role;
grant execute on function public.owner_control_is_owner() to authenticated;

-- Shared actor assertion. Under service_role auth.uid() is NULL, so the app
-- must pass the actor it resolved from the session. That would be a
-- caller-supplied actor if the app were the only check — this function makes
-- the DATABASE the check: the id must resolve to a live owner_profiles row or
-- the call raises. A forged actor id therefore cannot name a non-owner.
--
-- SCOPE, STATED HONESTLY: this guards the ledger RPCs and owner_set_vendor_active.
-- The other write cores mutate their division tables through the service-role
-- client directly, so for those the database is not re-checking the actor — the
-- route's two gates are. That is why the actor is never read from the body.
create or replace function public.owner_control_assert_actor(p_actor uuid)
returns void
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if p_actor is null then
    raise exception 'owner_control: actor is required' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.owner_profiles op
    where op.user_id = p_actor
      and op.is_active = true
      and op.role in ('owner', 'admin')
  ) then
    raise exception 'owner_control: actor % is not an active owner', p_actor
      using errcode = '42501';
  end if;
end;
$$;

revoke all on function public.owner_control_assert_actor(uuid) from public, anon, authenticated;
grant execute on function public.owner_control_assert_actor(uuid) to service_role;

-- Phase 1 — claim. Returns the ledger row id plus whether this was a replay of
-- an already-claimed key. On replay the caller MUST NOT mutate again; it
-- returns the recorded outcome instead.
create or replace function public.owner_control_claim_action(
  p_actor uuid,
  p_actor_role text,
  p_action_key text,
  p_entity_type text,
  p_entity_id text,
  p_division text,
  p_from_state text,
  p_to_state text,
  p_note text,
  p_idempotency_key text,
  p_reauth_required boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
  v_outcome text;
  v_existing record;
begin
  perform public.owner_control_assert_actor(p_actor);

  if coalesce(trim(p_idempotency_key), '') = '' then
    raise exception 'owner_control: idempotency key is required' using errcode = '22023';
  end if;

  select id, outcome, actor_id into v_existing
  from public.owner_control_actions
  where idempotency_key = p_idempotency_key;

  if found then
    -- A replayed key belonging to another actor is an attempted cross-actor
    -- replay, not a retry. Refuse rather than hand back someone else's result.
    if v_existing.actor_id <> p_actor then
      raise exception 'owner_control: idempotency key belongs to another actor'
        using errcode = '42501';
    end if;
    return jsonb_build_object('id', v_existing.id, 'replayed', true, 'outcome', v_existing.outcome);
  end if;

  insert into public.owner_control_actions (
    actor_id, actor_role, action_key, entity_type, entity_id, division,
    from_state, to_state, note, idempotency_key, reauth_required, outcome
  ) values (
    p_actor, coalesce(nullif(trim(p_actor_role), ''), 'owner'), p_action_key,
    p_entity_type, p_entity_id, p_division, p_from_state, p_to_state,
    nullif(trim(coalesce(p_note, '')), ''), p_idempotency_key,
    coalesce(p_reauth_required, false), 'claimed'
  )
  returning id, outcome into v_id, v_outcome;

  return jsonb_build_object('id', v_id, 'replayed', false, 'outcome', v_outcome);
exception
  when unique_violation then
    -- Lost a race against a concurrent identical request: treat as a replay.
    select id, outcome into v_id, v_outcome
    from public.owner_control_actions
    where idempotency_key = p_idempotency_key and actor_id = p_actor;
    if v_id is null then
      raise exception 'owner_control: idempotency key belongs to another actor'
        using errcode = '42501';
    end if;
    return jsonb_build_object('id', v_id, 'replayed', true, 'outcome', v_outcome);
end;
$$;

revoke all on function public.owner_control_claim_action(uuid, text, text, text, text, text, text, text, text, text, boolean)
  from public, anon, authenticated;
grant execute on function public.owner_control_claim_action(uuid, text, text, text, text, text, text, text, text, text, boolean)
  to service_role;

-- Phase 2 — settle. Only a 'claimed' row may be settled, so a settle call can
-- never rewrite a terminal outcome.
create or replace function public.owner_control_settle_action(
  p_id uuid,
  p_actor uuid,
  p_outcome text,
  p_audit_id uuid,
  p_failure_reason text
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_updated int;
begin
  perform public.owner_control_assert_actor(p_actor);

  if p_outcome not in ('applied', 'no_op', 'failed') then
    raise exception 'owner_control: invalid settle outcome %', p_outcome using errcode = '22023';
  end if;

  update public.owner_control_actions
  set outcome = p_outcome,
      audit_id = p_audit_id,
      failure_reason = nullif(trim(coalesce(p_failure_reason, '')), ''),
      settled_at = now()
  where id = p_id
    and actor_id = p_actor
    and outcome = 'claimed';

  get diagnostics v_updated = row_count;
  return v_updated = 1;
end;
$$;

revoke all on function public.owner_control_settle_action(uuid, uuid, text, uuid, text)
  from public, anon, authenticated;
grant execute on function public.owner_control_settle_action(uuid, uuid, text, uuid, text)
  to service_role;

-- ---------------------------------------------------------------------------
-- 3. Atomic vendor suspend / reinstate
-- ---------------------------------------------------------------------------

-- Suspending a seller means two writes: the storefront status AND the vendor
-- role membership that lets them reach the vendor workspace. Split across two
-- PostgREST calls, a failure between them leaves a vendor who is hidden from
-- the catalogue but still able to operate, or vice versa. One function, one
-- transaction, no half state.
--
-- CAS on the current status makes it idempotent: a second suspend of an
-- already-suspended vendor reports changed=false rather than pretending to act.
create or replace function public.owner_set_vendor_active(
  p_vendor_id uuid,
  p_actor uuid,
  p_suspend boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_prior text;
  v_target text;
  v_updated int;
  v_memberships int;
begin
  perform public.owner_control_assert_actor(p_actor);

  select status into v_prior
  from public.marketplace_vendors
  where id = p_vendor_id
  for update;

  if v_prior is null then
    return jsonb_build_object('ok', false, 'error', 'vendor_not_found');
  end if;

  v_target := case when p_suspend then 'suspended' else 'approved' end;

  if v_prior = v_target then
    return jsonb_build_object('ok', true, 'changed', false, 'prior_status', v_prior, 'status', v_target);
  end if;

  -- Reinstating is only meaningful from 'suspended'. Refuse to promote a
  -- 'pending' or 'rejected' vendor to live through the suspend control — that
  -- decision belongs to the application review path, which grants the role
  -- membership and computes trust scores.
  if not p_suspend and v_prior <> 'suspended' then
    return jsonb_build_object('ok', false, 'error', 'not_suspended', 'prior_status', v_prior);
  end if;

  update public.marketplace_vendors
  set status = v_target,
      updated_at = now()
  where id = p_vendor_id
    and status = v_prior;
  get diagnostics v_updated = row_count;

  if v_updated <> 1 then
    return jsonb_build_object('ok', false, 'error', 'concurrent_update', 'prior_status', v_prior);
  end if;

  -- scope_id is uuid on this schema (verified against prod), so the vendor id
  -- is compared directly — a ::text cast here raises "operator does not exist".
  update public.marketplace_role_memberships
  set is_active = not p_suspend
  where scope_type = 'vendor'
    and scope_id = p_vendor_id
    and role = 'vendor';
  get diagnostics v_memberships = row_count;

  return jsonb_build_object(
    'ok', true, 'changed', true, 'prior_status', v_prior,
    'status', v_target, 'memberships_updated', v_memberships
  );
end;
$$;

revoke all on function public.owner_set_vendor_active(uuid, uuid, boolean) from public, anon, authenticated;
grant execute on function public.owner_set_vendor_active(uuid, uuid, boolean) to service_role;

-- ---------------------------------------------------------------------------
-- 4. Constrain the vendor status vocabulary
-- ---------------------------------------------------------------------------

-- Guarded the way SA-4's spine migration guards its table reference: add the
-- constraint only if live data already satisfies it, so an unexpected legacy
-- value produces a NOTICE at apply time rather than aborting the transaction.
do $$
declare
  v_violations int;
begin
  if to_regclass('public.marketplace_vendors') is null then
    raise notice 'marketplace_vendors absent — status CHECK skipped';
    return;
  end if;

  if exists (
    select 1 from pg_constraint
    where conrelid = 'public.marketplace_vendors'::regclass
      and conname = 'marketplace_vendors_status_check'
  ) then
    return;
  end if;

  select count(*) into v_violations
  from public.marketplace_vendors
  where status not in ('pending', 'approved', 'suspended', 'rejected');

  if v_violations > 0 then
    raise notice 'marketplace_vendors has % row(s) with an unexpected status — CHECK skipped, reconcile first', v_violations;
    return;
  end if;

  alter table public.marketplace_vendors
    add constraint marketplace_vendors_status_check
    check (status in ('pending', 'approved', 'suspended', 'rejected'));
end $$;

-- ---------------------------------------------------------------------------
-- 5. customer_notifications_category_check — lock-step re-state
-- ---------------------------------------------------------------------------

-- The publisher writes `category = eventType` verbatim
-- (packages/notifications/publish.ts:138), so EVERY event type this pass emits
-- needs a seat in this CHECK as well as a registration in event-types.ts.
-- Missing either half is invisible at runtime: the publishers here are
-- best-effort tails wrapped in try/catch, so a rejected insert is logged and
-- swallowed while the verdict itself lands. The person the verdict is ABOUT is
-- simply never told — which is exactly how marketplace.seller.review and
-- marketplace.product.review spent a whole tranche failing silently before
-- 20260723130000 noticed.
--
-- Two ids are new in this pass:
--   marketplace.vendor.status  — suspend/reinstate told to the seller
--   learn.teacher.review       — the teaching verdict told to the applicant
--
-- The house pattern is a FULL re-state rather than a surgical add: PostgreSQL
-- has no "extend this CHECK" and the constraint body is the only place the
-- vocabulary is written down, so restating it keeps one readable list instead
-- of a chain of deltas nobody can evaluate. This migration sorts after
-- 20260723130000, and repeats everything that one allows — dropping first with
-- `if exists` makes it correct whether or not that migration ever applied.
-- Guarded on the table's existence, like every other table this migration
-- touches. It was the one unguarded ALTER here: sections 4, 6 and 7 all test
-- `to_regclass(...) is null` first and this one did not, which is not a
-- production risk (customer_notifications is live — prod-actual schema.sql:2838)
-- but it does make the migration unappliable on any chain that lacks the table.
-- That includes the vanilla CI chain, which is where the grant invariants for
-- this pass now run; an unappliable migration cannot be proven by them.
do $$
begin
  if to_regclass('public.customer_notifications') is null then
    raise notice 'customer_notifications absent — category widening skipped';
    return;
  end if;

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
    -- F3 tranche-2 seller/product verdicts.
    'marketplace.seller.review','marketplace.product.review',
    -- SA-4 Owner-AI operator escalation (urgent — fans out to owner push).
    'owner.operator.escalation',
    -- V3-OWNER-CONTROL-01 owner verdicts told to the person they land on.
    'marketplace.vendor.status','learn.teacher.review'
  ]::text[]));

  -- Inside the guard: a comment on a constraint that was never added would
  -- itself raise.
  comment on constraint customer_notifications_category_check on public.customer_notifications is
    'Allowed category vocabulary = 9 legacy coarse values UNION the registered '
    'EVENT_TYPE ids from packages/notifications/event-types.ts. Keep in lock-step '
    'with event-types.ts. Widened 2026-07-27 (V3-OWNER-CONTROL-01) for '
    'marketplace.vendor.status and learn.teacher.review.';
end $$;

-- ---------------------------------------------------------------------------
-- 6. owner_profiles — close the self-escalation path this rail depends on
-- ---------------------------------------------------------------------------

-- Everything above trusts one predicate: "is there a live owner_profiles row
-- for auth.uid() whose role is owner or admin?". So owner_profiles is now the
-- root of trust for suspending stores and deciding registrations, and it is
-- worth stating plainly what prod looks like today
-- (supabase/prod-actual/schema.sql):
--
--   :9000  grant ... UPDATE on public.owner_profiles to authenticated;
--   :8083  owner_profiles_update_own ... for update to authenticated
--            using (auth.uid() = user_id) with check (auth.uid() = user_id);
--   :6342  owner_profiles_role_check check (role in ('owner','editor','viewer'))
--
-- The WITH CHECK pins only WHICH ROW may be updated, never WHICH COLUMNS. A
-- holder of a role='viewer' row can therefore UPDATE their own row's `role` to
-- 'owner' — the CHECK constraint permits that value — and is_owner() starts
-- returning true for them. A deactivated row can likewise set is_active back to
-- true. That is HUB-2, and 20260710180000_hub_security_hardening.sql already
-- carries the fix; but that migration is committed, not confirmed applied, and
-- the prod snapshot predates it so it cannot answer the question either.
--
-- I am re-stating the revoke here rather than assuming, because this pass is
-- what makes the answer matter. Before it, a self-promoted viewer got read
-- access to HQ dashboards. After it, the same row can suspend a live store and
-- decide who is allowed to sell. Widening the blast radius of an open door
-- without closing the door would be the wrong trade, and the revoke is
-- idempotent — applying it twice is a no-op, and applying it when the earlier
-- migration already did is also a no-op.
--
-- THE COLUMN-LEVEL REVOKE DOES NOT WORK, AND THAT IS THE WHOLE POINT OF THIS
-- SECTION. An earlier draft of this migration wrote
--
--     revoke update (role, is_active) on public.owner_profiles
--       from anon, authenticated;
--
-- which is also, verbatim, what 20260710180000_hub_security_hardening.sql
-- carries as its HUB-2 fix. It is a no-op. PostgreSQL's REVOKE documentation
-- states it plainly: "if a role has been granted privileges on a table, then
-- revoking the same privileges from individual columns will have no effect."
-- Prod holds exactly that table-level grant —
--
--     :9000  grant DELETE, INSERT, ..., UPDATE on table public.owner_profiles
--              to authenticated;
--
-- so the column-level revoke is discarded and `role` stays writable. Proven,
-- not reasoned: on PostgreSQL 16, granting table UPDATE then revoking
-- UPDATE(role, is_active) leaves relacl at `authenticated=rw` and
-- `update ... set role='owner'` SUCCEEDS. Removing the table-level grant first
-- and re-granting per column leaves `authenticated=r`, and the same statement
-- fails with "permission denied for table". Section 7 below pins that as a
-- permanent regression proof so this cannot silently come back.
--
-- The consequence, stated so nobody has to rediscover it: HUB-2 has been open
-- this whole time. Both migrations that "fixed" it changed nothing. Any holder
-- of an owner_profiles row — the CHECK admits 'editor' and 'viewer' — can
-- UPDATE their own row's `role` to 'owner' under owner_profiles_update_own's
-- column-blind `with check (auth.uid() = user_id)`, and is_owner() then returns
-- true for them. Before this pass that bought HQ read access. After it, it
-- buys the ability to suspend a live store and decide who may sell. This pass
-- is what makes the hole matter, so this pass closes it for real.
--
-- Scope: the whole write triad, not just UPDATE. INSERT and DELETE are latent
-- grants of the same class the money-table lockdown revoked ecosystem-wide —
-- RLS denies them today (owner_profiles_owner_write gates INSERT/DELETE behind
-- is_owner()), and a grant that only RLS is holding back is precisely what this
-- migration's own header calls the latent-grant lesson. SELECT is untouched, so
-- owner_profiles_select_own and owner_profiles_select_self_or_owner keep
-- working.
--
-- Verified safe against the repo: of 47 owner_profiles call sites, ZERO write —
-- there is no .insert/.update/.upsert/.delete against this table anywhere in
-- apps/ or packages/. Nothing loses a capability it was using. The now-orphaned
-- owner_profiles_update_own policy is left in place deliberately: it grants
-- nothing without the privilege, and dropping a policy this migration did not
-- create is a change with a blast radius of its own.
do $$
begin
  if to_regclass('public.owner_profiles') is null then
    raise notice 'owner_profiles absent — HUB-2 revoke skipped';
    return;
  end if;
  -- Table-level. This is the statement the privilege actually answers to.
  revoke insert, update, delete on public.owner_profiles from anon, authenticated;
end $$;

-- ---------------------------------------------------------------------------
-- 7. Prove section 6 actually took effect
-- ---------------------------------------------------------------------------

-- Section 6 exists because a revoke that reads correctly can still do nothing.
-- The only defence against that is to ask the database whether the privilege is
-- gone, rather than trusting that the statement meant what it looked like.
--
-- Both halves are required and they answer different questions:
--   has_table_privilege      — is there a TABLE-level grant?
--   has_any_column_privilege — is there a COLUMN-level grant on any column?
-- The original bug passes the second check and fails the first, so testing only
-- one would have let it through.
--
-- The two lists differ on purpose. PostgreSQL supports column-level privileges
-- for SELECT, INSERT, UPDATE and REFERENCES only — DELETE is table-wide by
-- nature, and asking has_any_column_privilege() for it raises
-- `unrecognized privilege type: "DELETE"`. An earlier draft of this guard passed
-- all three to both functions; it therefore threw on every database it touched,
-- INCLUDING one where the revoke had worked perfectly. A guard that fails closed
-- on correct input is not strictness, it is an outage — and it would have been
-- read as "the revoke is still broken" while the revoke was fine.
--
-- This RAISES rather than notices. A migration whose security clause silently
-- did nothing is the failure mode being closed here; discovering that at apply
-- time and refusing to proceed is the correct outcome, and it is safe to be
-- strict because the revoke immediately above is unconditional.
do $$
declare
  offender text;
begin
  if to_regclass('public.owner_profiles') is null then
    return;
  end if;

  select string_agg(format('%s:%s', grantee, priv), ', ' order by grantee, priv)
    into offender
  from (
    -- Table-level: all three write privileges.
    select r.rolname as grantee, p.priv as priv
    from (values ('anon'), ('authenticated')) as r(rolname)
    cross join (values ('INSERT'), ('UPDATE'), ('DELETE')) as p(priv)
    where has_table_privilege(r.rolname, 'public.owner_profiles', p.priv)
    union
    -- Column-level: only the privileges PostgreSQL tracks per column.
    select r.rolname, p.priv || ' (column)'
    from (values ('anon'), ('authenticated')) as r(rolname)
    cross join (values ('INSERT'), ('UPDATE')) as p(priv)
    where has_any_column_privilege(r.rolname, 'public.owner_profiles', p.priv)
  ) g;

  if offender is not null then
    raise exception
      'HUB-2 revoke did not take effect — owner_profiles still writable by [%]. '
      'A column-level revoke cannot remove a table-level grant; revoke at table level.',
      offender;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 8. platform_moderation_queue — close the table this rail now acts on
-- ---------------------------------------------------------------------------

-- The moderation queue is the one table in this pass that the rail both READS
-- (queues.ts, the moderation-reports queue) and WRITES (moderation-resolve-
-- write.ts, uphold-and-remove / dismiss). On the last captured production
-- surface it is world-readable and world-writable:
--
--   prod-actual schema.sql:8085
--     create policy "Service role full access" on public.platform_moderation_queue
--       as permissive for all to public using (true) with check (true);
--   prod-actual schema.sql:9007-9008
--     grant DELETE, INSERT, ..., UPDATE on table public.platform_moderation_queue
--       to anon;  -- and to authenticated
--
-- The policy's NAME says service role. Its BODY says `to public using (true)`,
-- which is every role including anon, with no restriction. Together with the
-- grants, any unauthenticated PostgREST caller could read every reported
-- content_snapshot across all divisions, and insert, edit or delete rows.
--
-- 20260614120000_sec_harden_03_world_writable_lockdown.sql already fixes this —
-- platform_moderation_queue is in its cat1 array (line 77) — and the treatment
-- below is that migration's treatment, restated for this one table. Whether it
-- has been applied is genuinely UNKNOWN and could not be determined here: the
-- prod snapshot is from 2026-06-13, one day BEFORE that migration was authored,
-- so it cannot answer the question, and both Supabase projects are currently
-- INACTIVE (paused) so no live probe was possible.
--
-- Restating it is the same trade section 6 makes for owner_profiles. Before this
-- pass, a forged moderation row sat in a table nothing in HQ read. After it, the
-- owner's console lists those rows as real reports and offers a one-tap dismiss
-- and a password-gated remove on them — so an attacker who can INSERT here can
-- put fabricated evidence in front of the owner and get real content destroyed
-- through a rail that will faithfully audit the whole thing. Widening the blast
-- radius of an open door without closing the door is the wrong trade.
--
-- Fully idempotent: `drop policy if exists` and a revoke of privileges that may
-- already be gone are both no-ops if SEC-HARDEN-03 has landed. SELECT is left
-- granted, exactly as SEC-HARDEN-03 leaves it — with the broad policy dropped
-- and no other policy on the table, RLS denies reads to every request role
-- anyway, and service_role bypasses RLS so the console keeps working.
do $$
begin
  if to_regclass('public.platform_moderation_queue') is null then
    raise notice 'platform_moderation_queue absent — moderation lockdown skipped';
    return;
  end if;

  drop policy if exists "Service role full access" on public.platform_moderation_queue;
  revoke insert, update, delete, truncate
    on table public.platform_moderation_queue
    from anon, authenticated, public;
end $$;

-- Prove it, for the same reason section 7 exists: a revoke that reads correctly
-- can still leave the door open. Writes must be gone for both request roles, and
-- no policy may remain that lets a request role back in.
do $$
declare
  offender text;
  broad_policies int;
begin
  if to_regclass('public.platform_moderation_queue') is null then
    return;
  end if;

  select string_agg(format('%s:%s', r.rolname, p.priv), ', ' order by r.rolname, p.priv)
    into offender
  from (values ('anon'), ('authenticated')) as r(rolname)
  cross join (values ('INSERT'), ('UPDATE'), ('DELETE')) as p(priv)
  where has_table_privilege(r.rolname, 'public.platform_moderation_queue', p.priv);

  if offender is not null then
    raise exception
      'platform_moderation_queue still writable by request roles [%] — a forged '
      'moderation report would reach the owner console as real evidence.', offender;
  end if;

  -- `permissive ... using (true)` to public is the specific shape that made the
  -- table world-readable despite RLS being enabled.
  select count(*) into broad_policies
  from pg_policies
  where schemaname = 'public'
    and tablename = 'platform_moderation_queue'
    and 'public' = any (roles)
    and coalesce(qual, 'true') = 'true';

  if broad_policies > 0 then
    raise exception
      'platform_moderation_queue still carries % unrestricted public policy/policies', broad_policies;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 9. Make "one password, one consequential action" actually true
-- ---------------------------------------------------------------------------

-- The route says single-use, and until this section it was single-use only by
-- the browser's cooperation. `readVerifiedReauth` is stateless — HMAC, subject,
-- age — and nothing anywhere records that a step-up has been spent. The
-- "single-use" property came entirely from `clearReauthCookieOnJar()` asking the
-- BROWSER to forget the cookie.
--
-- That clear does work (verified against the installed Next 16.1.6: the route
-- module merges the mutable cookie jar onto whatever Response the handler
-- returns, so the Set-Cookie really is sent). The gap is not a broken clear, it
-- is that clearing is not atomic with checking. N requests dispatched before the
-- first response comes back each read a still-valid cookie, each verify it
-- independently, and each proceed. One password then authorises N consequential
-- verdicts — suspensions, listing takedowns, content removals — against the
-- route's own stated guarantee. The rate limiter caps the blast radius, it does
-- not restore the invariant.
--
-- The precondition is same-origin script execution on hub, which is severe on
-- its own. That is not a reason to leave the weaker guarantee in place: this
-- rail's whole purpose is that consequential actions are individually
-- authorised, and a guarantee that holds only while nobody is attacking is a
-- comment, not a control.
--
-- FIX: a step-up is identified by the `ts` in its signed payload — the issuance
-- moment, tamper-proof because it is inside the HMAC. Recording (actor, ts) under
-- a PRIMARY KEY makes spending it a single atomic INSERT: the first request to
-- arrive wins, every concurrent sibling takes a unique_violation and is refused.
-- Postgres does the serialisation; no lock, no read-then-write, no window.
--
-- This deliberately does NOT change @henryco/auth's cookie contract. That module
-- is shared by every division's sensitive actions, and re-shaping the payload to
-- bind an action would be an ecosystem-wide change made from inside one feature.
-- The enforcement lives here, where the consequential actions are.
create table if not exists public.owner_control_reauth_spends (
  actor_id uuid not null,
  -- Epoch millis from the signed cookie payload; identifies ONE step-up.
  reauth_ts bigint not null,
  action_key text not null,
  spent_at timestamptz not null default now(),
  primary key (actor_id, reauth_ts)
);

alter table public.owner_control_reauth_spends enable row level security;
revoke all on public.owner_control_reauth_spends from anon, authenticated;

comment on table public.owner_control_reauth_spends is
  'One row per SPENT password step-up on the owner-control rail. The primary key '
  'is the enforcement: concurrent requests carrying the same reauth issuance '
  'collide and only one proceeds. Pruned by owner_control_spend_reauth.';

create or replace function public.owner_control_spend_reauth(
  p_actor uuid,
  p_reauth_ts bigint,
  p_action_key text
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  -- Same actor assertion every other RPC on this rail opens with.
  perform public.owner_control_assert_actor(p_actor);

  -- Bounded growth: a step-up older than an hour can never satisfy the 5-minute
  -- window again, so its row proves nothing. Pruning here keeps the table at
  -- roughly "step-ups in the last hour" without a scheduled job.
  delete from public.owner_control_reauth_spends
   where spent_at < now() - interval '1 hour';

  insert into public.owner_control_reauth_spends (actor_id, reauth_ts, action_key)
  values (p_actor, p_reauth_ts, p_action_key);

  return true;
exception
  when unique_violation then
    -- Already spent. Not an error: the honest answer to "may I use this
    -- step-up?" is no, and the caller turns that into a fresh challenge.
    return false;
end;
$$;

revoke all on function public.owner_control_spend_reauth(uuid, bigint, text)
  from public, anon, authenticated;
grant execute on function public.owner_control_spend_reauth(uuid, bigint, text)
  to service_role;

-- end of migration --
