-- V3-GAMING-01 BACKSTOP — RLS behavioural proof (runtime, not just grant metadata).
--
-- Run AFTER _bootstrap_supabase_env.sql + the gaming migration on a fresh DB.
-- Proves, as the actual `authenticated`/`anon` request roles:
--   1. authenticated CANNOT INSERT into gaming_match_moves (append-only writer-only)
--   2. authenticated CANNOT INSERT into gaming_matches (writes are RPC-only)
--   3. authenticated CANNOT EXECUTE the writer RPC apply_gaming_move (grant lock)
--   4. a NON-participant sees ZERO rows of a match's Realtime signal (RLS deny)
--   5. a PARTICIPANT sees their match's signal (auth.uid()-derived policy)
--   6. anon CAN read the public leaderboard
-- Any failure RAISES -> psql (ON_ERROR_STOP=1) exits non-zero -> CI RED.

-- Test-only: make auth.uid() readable from a GUC so we can simulate a signed-in user.
create or replace function auth.uid() returns uuid language sql stable
  as $$ select nullif(current_setting('test.uid', true), '')::uuid $$;

-- Seed a live match with two players (as the owning superuser — bypasses RLS).
insert into public.gaming_matches (id, game_id, status, created_by)
  values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'onyx-lines', 'in_progress',
          'a0000000-0000-0000-0000-000000000001')
  on conflict (id) do nothing;
insert into public.gaming_match_players (match_id, user_id, seat) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a0000000-0000-0000-0000-000000000001', 0),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'b0000000-0000-0000-0000-000000000002', 1)
  on conflict do nothing;
insert into public.gaming_match_signal (match_id, seq, status)
  values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 0, 'in_progress')
  on conflict (match_id) do nothing;

do $$
declare
  violations int := 0;
  v_count int;
begin
  -- (1) authenticated cannot INSERT a forged move
  set local role authenticated;
  begin
    insert into public.gaming_match_moves (match_id, seq, user_id, seat, move, state_hash)
      values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 99, 'a0000000-0000-0000-0000-000000000001', 0, '{}'::jsonb, 'x');
    raise warning 'SECURITY FAIL: authenticated INSERTed a move'; violations := violations + 1;
  exception when insufficient_privilege then raise notice 'OK: authenticated denied INSERT on gaming_match_moves';
  end;
  reset role;

  -- (2) authenticated cannot INSERT a match
  set local role authenticated;
  begin
    insert into public.gaming_matches (game_id, status, created_by)
      values ('onyx-lines', 'lobby', 'a0000000-0000-0000-0000-000000000001');
    raise warning 'SECURITY FAIL: authenticated INSERTed a match'; violations := violations + 1;
  exception when insufficient_privilege then raise notice 'OK: authenticated denied INSERT on gaming_matches';
  end;
  reset role;

  -- (3) authenticated cannot EXECUTE the writer RPC
  set local role authenticated;
  begin
    perform public.apply_gaming_move(
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 0, 0,
      'a0000000-0000-0000-0000-000000000001', '{}'::jsonb, '{}'::jsonb, 'h', 'in_progress',
      null, null, null, null);
    raise warning 'SECURITY FAIL: authenticated EXECUTEd apply_gaming_move'; violations := violations + 1;
  exception when insufficient_privilege then raise notice 'OK: authenticated denied EXECUTE on apply_gaming_move';
  end;
  reset role;

  -- (3b) authenticated cannot read the SECRET commit-reveal server seed
  set local role authenticated;
  begin
    perform 1 from public.gaming_match_secrets limit 1;
    raise warning 'SECURITY FAIL: authenticated can SELECT gaming_match_secrets'; violations := violations + 1;
  exception when insufficient_privilege then raise notice 'OK: authenticated denied SELECT on gaming_match_secrets (server seed sealed)';
  end;
  reset role;

  -- (4) non-participant sees zero signal rows
  perform set_config('test.uid', 'c0000000-0000-0000-0000-000000000003', true);
  set local role authenticated;
  select count(*) into v_count from public.gaming_match_signal
    where match_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  reset role;
  if v_count <> 0 then raise warning 'SECURITY FAIL: non-participant read signal (% rows)', v_count; violations := violations + 1;
  else raise notice 'OK: non-participant sees 0 signal rows'; end if;

  -- (5) participant sees their signal
  perform set_config('test.uid', 'a0000000-0000-0000-0000-000000000001', true);
  set local role authenticated;
  select count(*) into v_count from public.gaming_match_signal
    where match_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  reset role;
  if v_count <> 1 then raise warning 'FAIL: participant could not read signal (% rows)', v_count; violations := violations + 1;
  else raise notice 'OK: participant reads their signal'; end if;

  -- (6) anon can read the public leaderboard
  set local role anon;
  begin
    perform public.get_gaming_leaderboard(10);
    raise notice 'OK: anon read the public leaderboard';
  exception when insufficient_privilege then
    raise warning 'FAIL: anon cannot read the public leaderboard'; violations := violations + 1;
  end;
  reset role;

  if violations > 0 then
    raise exception 'gaming RLS behavioural proof FAILED: % violation(s)', violations;
  end if;
  raise notice 'gaming RLS behavioural proof: OK';
end $$;
