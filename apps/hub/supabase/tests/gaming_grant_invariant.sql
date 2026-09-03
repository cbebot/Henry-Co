-- V3-GAMING-01 BACKSTOP — gaming-RPC grant invariant.
--
-- Run AFTER _bootstrap_supabase_env.sql + the gaming migration, against a freshly
-- migrated DB. Asserts the grant lock that makes the arena IDOR-proof:
--   * service_only[]   : anon=false, authenticated=false, service_role=true
--                        (every writer/server-read RPC — a client CANNOT call them,
--                         so no client-supplied id can ever reach a writer).
--   * auth_callable[]  : anon=false, authenticated=true   (caller-scoped reads via auth.uid()).
--   * public_read[]    : anon=true                        (public-columns-only leaderboard).
--
-- If any gaming writer ever becomes anon/authenticated-executable (a re-grant, a
-- `create or replace` resetting the ACL, or a NEW gaming function added without the
-- revoke + this list), this RAISES and psql (ON_ERROR_STOP=1) exits non-zero -> CI RED.
--
-- MAINTENANCE: a NEW gaming function MUST be added to the right array below.

do $$
declare
  service_only text[] := array[
    'public.create_gaming_match(text, uuid, text, text, boolean, text)',
    'public.join_gaming_match(uuid, uuid, text)',
    'public.start_gaming_match(uuid, jsonb, text)',
    'public.apply_gaming_move(uuid, bigint, int, uuid, jsonb, jsonb, text, text, uuid, integer, integer, numeric)',
    'public.abandon_gaming_match(uuid, uuid)',
    'public.set_gaming_handle(uuid, text)',
    'public.resolve_gaming_handle(text)',
    'public.create_gaming_invitation(uuid, uuid, uuid, text)',
    'public.get_gaming_match_full(uuid)',
    'public.list_open_gaming_matches(text, uuid, integer)',
    'public.get_my_gaming_invitations(uuid)',
    'public.ensure_gaming_profile(uuid)'
  ];
  auth_callable text[] := array[
    'public.gaming_is_my_match(uuid)'   -- caller-scoped (auth.uid()); RLS policy needs it
  ];
  public_read text[] := array[
    'public.get_gaming_leaderboard(integer)',     -- public columns only; intentionally anon-callable
    'public.get_gaming_match_fairness(uuid)'      -- public verifier: completed-match commitment/reveal
  ];
  fn text;
  anon_can boolean; auth_can boolean; svc_can boolean;
  violations int := 0;
begin
  raise notice '--- gaming-RPC grant invariant ---';

  foreach fn in array service_only loop
    anon_can := has_function_privilege('anon',          fn, 'EXECUTE');
    auth_can := has_function_privilege('authenticated', fn, 'EXECUTE');
    svc_can  := has_function_privilege('service_role',  fn, 'EXECUTE');
    raise notice 'service_only % | anon=% authenticated=% service_role=%', rpad(fn, 56), anon_can, auth_can, svc_can;
    if anon_can then raise warning 'VIOLATION: anon can EXECUTE %', fn;          violations := violations + 1; end if;
    if auth_can then raise warning 'VIOLATION: authenticated can EXECUTE %', fn; violations := violations + 1; end if;
    -- every service-only RPC MUST retain service_role EXECUTE or the server path breaks
    if not svc_can then raise warning 'VIOLATION: service_role CANNOT EXECUTE %', fn; violations := violations + 1; end if;
  end loop;

  foreach fn in array auth_callable loop
    anon_can := has_function_privilege('anon',          fn, 'EXECUTE');
    auth_can := has_function_privilege('authenticated', fn, 'EXECUTE');
    raise notice 'auth_callable % | anon=% authenticated=%', rpad(fn, 40), anon_can, auth_can;
    if anon_can then raise warning 'VIOLATION: anon can EXECUTE caller-scoped %', fn; violations := violations + 1; end if;
    if not auth_can then raise warning 'VIOLATION: authenticated CANNOT EXECUTE % (RLS policy would deny all)', fn; violations := violations + 1; end if;
  end loop;

  foreach fn in array public_read loop
    anon_can := has_function_privilege('anon', fn, 'EXECUTE');
    raise notice 'public_read % | anon=%', rpad(fn, 40), anon_can;
    if not anon_can then raise warning 'VIOLATION: public leaderboard % is not anon-callable', fn; violations := violations + 1; end if;
  end loop;

  if violations > 0 then
    raise exception 'gaming-RPC grant invariant FAILED: % violation(s) — a gaming writer is reachable by anon/authenticated (forge-a-move/IDOR) or a writer lost service_role EXECUTE', violations;
  end if;
  raise notice 'gaming-RPC grant invariant: OK (% service-only, % auth, % public)',
    array_length(service_only, 1), array_length(auth_callable, 1), array_length(public_read, 1);
end $$;
