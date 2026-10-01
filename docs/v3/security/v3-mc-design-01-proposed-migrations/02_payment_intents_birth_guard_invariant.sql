-- V3-MC-DESIGN-01 / M-NOW — birth guard proof (PROPOSED, HELD, NOT IN CI).
-- Run after 01_payment_intents_birth_guard.sql on the fresh money-chain DB (bootstrap →
-- payment_intents → isolation → ledger → … → refunds). Any violation RAISEs → psql exits non-zero.
\set ON_ERROR_STOP on

insert into auth.users (id, email) values
  ('000000ee-0000-0000-0000-0000000000ee', 'birth-guard@fixtures.henryco.test') on conflict do nothing;

-- (b1) the request roles have no INSERT privilege and no insert policy
do $$ begin
  if has_table_privilege('authenticated', 'public.payment_intents', 'INSERT') then
    raise exception 'PROOF b1 FAILED: authenticated can INSERT payment_intents';
  end if;
  if has_table_privilege('anon', 'public.payment_intents', 'INSERT') then
    raise exception 'PROOF b1 FAILED: anon can INSERT payment_intents';
  end if;
  if exists (select 1 from pg_policies where tablename = 'payment_intents' and policyname = 'payment_intents_insert_own') then
    raise exception 'PROOF b1 FAILED: payment_intents_insert_own policy still exists';
  end if;
  raise notice 'PROOF b1 OK: request roles cannot insert payment_intents';
end $$;

-- The CI bootstrap reproduces Supabase's default EXECUTE grant on functions only
-- (_bootstrap_supabase_env.sql:76); on prod, service_role holds table DML through the platform's
-- default table grants. Mirror that here (idempotent) so (b2) exercises the trigger, not a missing
-- table grant: without it the insert dies with 42501 before any BEFORE ROW trigger runs.
grant select, insert on table public.payment_intents to service_role;

-- (b0) the trigger exists and is enabled, and no session-level escape hatch is set
do $$ begin
  if not exists (
    select 1 from pg_trigger where tgname = 'payment_intents_enforce_birth'
      and tgrelid = 'public.payment_intents'::regclass and tgenabled <> 'D'
  ) then
    raise exception 'PROOF b0 FAILED: payment_intents_enforce_birth is missing or disabled';
  end if;
  if current_setting('app.allow_intent_seed', true) is not null then
    raise exception 'PROOF b0 FAILED: a seed escape hatch is set in this session';
  end if;
  raise notice 'PROOF b0 OK: birth trigger present and enabled';
end $$;

-- (b2) as service_role, an intent born `succeeded` is refused; a `pending` one is accepted
set role service_role;
do $$ begin
  begin
    insert into public.payment_intents (user_id, amount_minor, currency, country, method, status, idempotency_key)
    values ('000000ee-0000-0000-0000-0000000000ee', 5000, 'NGN', 'NG', 'card', 'succeeded', 'birth-forged');
    raise exception 'PROOF b2 FAILED: a succeeded intent was born';
  exception when check_violation then
    raise notice 'PROOF b2 OK: a succeeded birth is refused';
  end;
  begin
    insert into public.payment_intents (user_id, amount_minor, currency, country, method, idempotency_key, provider_reference)
    values ('000000ee-0000-0000-0000-0000000000ee', 5000, 'NGN', 'NG', 'card', 'birth-ref', 'ref-at-birth');
    raise exception 'PROOF b2 FAILED: an intent was born with a provider_reference';
  exception when check_violation then
    raise notice 'PROOF b2 OK: a provider_reference at birth is refused';
  end;
  insert into public.payment_intents (user_id, amount_minor, currency, country, method, idempotency_key)
  values ('000000ee-0000-0000-0000-0000000000ee', 5000, 'NGN', 'NG', 'card', 'birth-ok');
  raise notice 'PROOF b2 OK: a pending birth by the server rail is accepted';
end $$;
reset role;

-- (b3) the authenticated role is refused by the TRIGGER even if a grant were ever re-added.
-- RLS with no insert policy raises the same SQLSTATE (42501), so the proof must read the message:
-- only the trigger says "server rail only". A dropped or mis-wired trigger therefore fails here.
grant insert on table public.payment_intents to authenticated; -- simulate a future re-grant
set role authenticated;
do $$ begin
  begin
    insert into public.payment_intents (user_id, amount_minor, currency, country, method, idempotency_key)
    values ('000000ee-0000-0000-0000-0000000000ee', 5000, 'NGN', 'NG', 'card', 'birth-auth');
    raise exception 'PROOF b3 FAILED: authenticated inserted an intent';
  exception when insufficient_privilege then
    if sqlerrm not like '%server rail only%' then
      raise exception 'PROOF b3 FAILED: refused by RLS or grants, not by the birth trigger (%)', sqlerrm;
    end if;
    raise notice 'PROOF b3 OK: the trigger refuses the request role regardless of grants';
  end;
end $$;
reset role;
revoke insert on table public.payment_intents from authenticated; -- restore the end state

select 'PAYMENT_INTENTS BIRTH GUARD (b0)trigger-present (b1)no-request-role-insert (b2)born-pending (b3)trigger-backstop === ALL PROVEN' as result;
