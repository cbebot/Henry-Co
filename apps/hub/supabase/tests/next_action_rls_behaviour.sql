-- V3-39 NEXT ACTION — RLS behavioural proof (runtime, not just grant metadata).
--
-- Run AFTER _bootstrap_supabase_env.sql + the V3-39 migration on a fresh DB.
-- Proves the Phase E no-cross-leak invariant (Prime Directive 10) as the actual
-- `authenticated`/`anon` request roles (PRIVACY-NDPR §5.3):
--   1. user B sees ZERO rows of user A's next_action_dismissals
--   2. user B sees only their OWN dismissal row(s)
--   3. user B CANNOT UPDATE user A's dismissal (RLS USING blocks the row)
--   4. user B CANNOT INSERT a dismissal carrying user A's user_id (WITH CHECK)
--   5. anon is denied SELECT entirely (no grant at all)
--   6. user B CAN upsert their OWN dismissal (the product path works under RLS)
-- Any failure RAISES -> psql (ON_ERROR_STOP=1) exits non-zero -> CI RED.

-- Test-only: make auth.uid() readable from a GUC so we can simulate a signed-in
-- user (idempotent when personalization_rls_behaviour.sql already created it).
create or replace function auth.uid() returns uuid language sql stable
  as $$ select nullif(current_setting('test.uid', true), '')::uuid $$;

-- Users must exist for the FK (user_id -> auth.users). Seed as the owning
-- superuser (bypasses RLS).
insert into auth.users (id, email) values
  ('a0000000-0000-0000-0000-0000000000a1', 'na-user-a@test.local'),
  ('b0000000-0000-0000-0000-0000000000b2', 'na-user-b@test.local')
  on conflict (id) do nothing;

insert into public.next_action_dismissals (user_id, context_kind, action_id) values
  ('a0000000-0000-0000-0000-0000000000a1', 'account_home', 'jobs-saved'),
  ('b0000000-0000-0000-0000-0000000000b2', 'care_service', 'care-book')
  on conflict (user_id, context_kind, action_id) do nothing;

do $$
declare
  violations int := 0;
  v_count int;
  v_rows int;
begin
  -- (1) user B cannot read user A's dismissals
  perform set_config('test.uid', 'b0000000-0000-0000-0000-0000000000b2', true);
  set local role authenticated;
  select count(*) into v_count from public.next_action_dismissals
    where user_id = 'a0000000-0000-0000-0000-0000000000a1';
  reset role;
  if v_count <> 0 then raise warning 'SECURITY FAIL: user B read user A dismissals (% rows)', v_count; violations := violations + 1;
  else raise notice 'OK: user B sees 0 rows of user A dismissals'; end if;

  -- (2) user B sees exactly their own dismissal row
  perform set_config('test.uid', 'b0000000-0000-0000-0000-0000000000b2', true);
  set local role authenticated;
  select count(*) into v_count from public.next_action_dismissals;
  reset role;
  if v_count <> 1 then raise warning 'FAIL: user B expected 1 own dismissal, saw %', v_count; violations := violations + 1;
  else raise notice 'OK: user B sees only their own dismissal'; end if;

  -- (3) user B cannot UPDATE user A's dismissal (RLS USING blocks the row)
  perform set_config('test.uid', 'b0000000-0000-0000-0000-0000000000b2', true);
  set local role authenticated;
  update public.next_action_dismissals set dismissed_at = now()
    where user_id = 'a0000000-0000-0000-0000-0000000000a1';
  get diagnostics v_rows = row_count;
  reset role;
  if v_rows <> 0 then raise warning 'SECURITY FAIL: user B UPDATEd % of user A dismissal rows', v_rows; violations := violations + 1;
  else raise notice 'OK: user B UPDATE of user A dismissals affected 0 rows'; end if;

  -- (4) user B cannot INSERT a dismissal carrying user A's user_id (WITH CHECK
  -- denies the forged-user_id IDOR vector).
  perform set_config('test.uid', 'b0000000-0000-0000-0000-0000000000b2', true);
  set local role authenticated;
  begin
    insert into public.next_action_dismissals (user_id, context_kind, action_id)
      values ('a0000000-0000-0000-0000-0000000000a1', 'jobs_detail', 'jobs-apply');
    raise warning 'SECURITY FAIL: user B INSERTed a dismissal as user A'; violations := violations + 1;
  exception when insufficient_privilege then raise notice 'OK: user B INSERT with user A''s id rejected by WITH CHECK';
  end;
  reset role;

  -- (5) anon is denied SELECT (no grant)
  set local role anon;
  begin
    perform 1 from public.next_action_dismissals limit 1;
    raise warning 'SECURITY FAIL: anon can SELECT next_action_dismissals'; violations := violations + 1;
  exception when insufficient_privilege then raise notice 'OK: anon denied SELECT on next_action_dismissals';
  end;
  reset role;

  -- (6) user B CAN upsert their OWN dismissal — the product path works under RLS.
  perform set_config('test.uid', 'b0000000-0000-0000-0000-0000000000b2', true);
  set local role authenticated;
  begin
    insert into public.next_action_dismissals (user_id, context_kind, action_id)
      values ('b0000000-0000-0000-0000-0000000000b2', 'care_service', 'care-book')
      on conflict (user_id, context_kind, action_id)
      do update set dismissed_at = now();
    raise notice 'OK: user B upserted their own dismissal';
  exception when others then
    raise warning 'FAIL: user B could not upsert their own dismissal (%)', sqlerrm;
    violations := violations + 1;
  end;
  reset role;

  if violations > 0 then
    raise exception 'V3-39 next-action RLS behavioural proof FAILED: % violation(s)', violations;
  end if;
  raise notice 'V3-39 next-action RLS behavioural proof: OK';
end $$;
