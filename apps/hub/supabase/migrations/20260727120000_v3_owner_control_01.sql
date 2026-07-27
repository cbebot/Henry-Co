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
      and lower(trim(op.role)) in ('owner', 'admin')
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
