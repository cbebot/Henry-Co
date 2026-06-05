-- FL1 BACKSTOP — money-RPC grant invariant (V3-15-FIX-01).
--
-- Run AFTER _bootstrap_supabase_env.sql + the payment_intents migration, against a
-- freshly-migrated DB. Asserts, for each money function:
--     has_function_privilege('anon',          fn, 'EXECUTE') = false
--     has_function_privilege('authenticated', fn, 'EXECUTE') = false
-- and, for the two WRITERS the server route layer must call:
--     has_function_privilege('service_role',  fn, 'EXECUTE') = true
--
-- If any money RPC ever becomes anon/authenticated-executable again (a future
-- migration that re-grants, a `create or replace` that resets the ACL, or a new
-- money function added without the revoke + added to the list below), this RAISES
-- and psql (run with ON_ERROR_STOP=1) exits non-zero → CI goes RED.
--
-- This is the unbypassable backstop UNTIL the functions move into a non-exposed
-- `payments_private` schema (docs/v3/v3-15-fl2-payments-schema-isolation-hardening.md);
-- when that lands, update the signatures + expectations here.
--
-- MAINTENANCE: a NEW money function in `public` MUST be added to `all_fns` (and to
-- `writers` if the server calls it directly), or it is not covered.

do $$
declare
  all_fns text[] := array[
    'public.apply_payment_webhook(text, text, uuid, text)',
    'public.advance_payment_intent(uuid, text, text)',
    'public.enforce_payment_intent_transition()',
    'public.payments_set_updated_at()'
  ];
  writers text[] := array[
    'public.apply_payment_webhook(text, text, uuid, text)',
    'public.advance_payment_intent(uuid, text, text)'
  ];
  fn text;
  anon_can boolean; auth_can boolean; svc_can boolean;
  violations int := 0;
begin
  raise notice '--- money-RPC grant invariant ---';
  foreach fn in array all_fns loop
    anon_can := has_function_privilege('anon',          fn, 'EXECUTE');
    auth_can := has_function_privilege('authenticated', fn, 'EXECUTE');
    svc_can  := has_function_privilege('service_role',  fn, 'EXECUTE');
    raise notice '% | anon=% authenticated=% service_role=%', rpad(fn, 56), anon_can, auth_can, svc_can;
    if anon_can then raise warning 'VIOLATION: anon can EXECUTE %', fn;          violations := violations + 1; end if;
    if auth_can then raise warning 'VIOLATION: authenticated can EXECUTE %', fn; violations := violations + 1; end if;
  end loop;

  foreach fn in array writers loop
    if not has_function_privilege('service_role', fn, 'EXECUTE') then
      raise warning 'VIOLATION: service_role CANNOT EXECUTE writer % (server route path would break)', fn;
      violations := violations + 1;
    end if;
  end loop;

  if violations > 0 then
    raise exception 'payment money-RPC grant invariant FAILED: % violation(s) — a money writer is reachable by anon/authenticated (self-confirm-without-paying) or a writer lost service_role EXECUTE', violations;
  end if;
  raise notice 'payment money-RPC grant invariant: OK (% functions clean)', array_length(all_fns, 1);
end $$;
