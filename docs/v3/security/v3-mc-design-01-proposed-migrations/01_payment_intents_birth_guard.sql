-- V3-MC-DESIGN-01 / M-NOW — payment_intents birth guard (PROPOSED, HELD, NOT APPLIED).
--
-- Finding LF-1 (docs/v3/money/2026-10-01-multi-currency-architecture-design.md §1.5): the
-- `payment_intents_insert_own` policy (20260529120000_payment_intents.sql:235-237) lets any signed-in
-- user INSERT their own payment_intents row through PostgREST, the status CHECK admits every status at
-- insert, and no BEFORE INSERT trigger exists. The reconcilers trust a `succeeded` intent they find by
-- the user's own reference, so a user can self-credit a wallet (the live rail) or flip a division
-- record to paid with no money moved.
--
-- Closure, by construction:
--   1. the request roles lose INSERT on payment_intents (policy dropped + grant revoked — the only
--      client creator already goes through the service-role route);
--   2. a BEFORE INSERT trigger refuses any insert by the request roles regardless of grants (the FL1
--      lesson: default privileges can re-grant), and for service_role forces the row to be born
--      `pending` with no provider_reference (the route sets the reference by UPDATE after routing).
-- Superuser sessions (migrations, the CI proofs that seed captured intents, the shadow rehearsal) are
-- exempt. Nothing else changes: the A2 transition trigger, the money freeze and the guarded RPCs are
-- untouched, and every existing insert path (the account route, the division rails) inserts without a
-- status and without a provider_reference, so no live behaviour changes.

-- 1. Request roles may not insert intents at all.
drop policy if exists payment_intents_insert_own on public.payment_intents;
revoke insert on table public.payment_intents from anon, authenticated;

-- 2. Birth guard. SECURITY INVOKER on purpose: inside a SECURITY DEFINER function `current_user`
-- is the definer, not the role performing the insert, so the request-role check would never fire.
-- The body touches nothing privileged (pg_roles is world-readable), so invoker rights suffice.
-- Exemptions: a true superuser session (native-PG proofs, the shadow rehearsal) or an explicit
-- `set app.allow_intent_seed = 'on'` for a non-superuser rehearsal that must seed captured intents
-- (Supabase's `postgres` is not a true superuser). Nothing in production sets that GUC.
create or replace function payments_private.enforce_payment_intent_birth()
returns trigger language plpgsql security invoker set search_path = public, pg_temp as $$
declare
  v_super boolean;
begin
  if current_user in ('anon', 'authenticated') then
    raise exception 'payment_intents are created by the server rail only (role %)', current_user
      using errcode = 'insufficient_privilege';
  end if;
  select rolsuper into v_super from pg_roles where rolname = current_user;
  if coalesce(v_super, false) or coalesce(current_setting('app.allow_intent_seed', true), '') = 'on' then
    return new; -- proofs and rehearsals seed captured intents deliberately
  end if;
  if new.status is distinct from 'pending' then
    raise exception 'a payment_intent is born pending; status % is set only by the guarded RPCs', new.status
      using errcode = 'check_violation';
  end if;
  if new.provider_reference is not null then
    raise exception 'a payment_intent is born without a provider_reference (set after routing)'
      using errcode = 'check_violation';
  end if;
  return new;
end $$;
revoke all on function payments_private.enforce_payment_intent_birth() from public, anon, authenticated;

drop trigger if exists payment_intents_enforce_birth on public.payment_intents;
create trigger payment_intents_enforce_birth
  before insert on public.payment_intents
  for each row execute function payments_private.enforce_payment_intent_birth();
