-- V3-34 PERSONALIZATION — RLS behavioural proof (runtime, not just grant metadata).
--
-- Run AFTER _bootstrap_supabase_env.sql + the V3-34 migration on a fresh DB.
-- Proves the Phase E no-cross-leak invariant (Prime Directive 10) as the actual
-- `authenticated`/`anon` request roles:
--   1. user B sees ZERO rows of user A's user_home_layouts (viewer-scoped read)
--   2. user B sees only their OWN layout row
--   3. user B CANNOT UPDATE user A's layout (RLS USING blocks the cross-user row)
--   4. user B sees ZERO rows of user A's personalization_consent_events
--   5. user B sees only their OWN consent events
--   6. anon is denied SELECT on both tables (no grant at all)
--   7. user B CANNOT INSERT a row carrying user A's user_id (RLS WITH CHECK)
-- Any failure RAISES -> psql (ON_ERROR_STOP=1) exits non-zero -> CI RED.

-- Test-only: make auth.uid() readable from a GUC so we can simulate a signed-in user.
create or replace function auth.uid() returns uuid language sql stable
  as $$ select nullif(current_setting('test.uid', true), '')::uuid $$;

-- Users must exist for the FK (user_id -> auth.users). Seed as the owning
-- superuser (bypasses RLS), exactly like the gaming backstop.
insert into auth.users (id, email) values
  ('a0000000-0000-0000-0000-000000000001', 'user-a@test.local'),
  ('b0000000-0000-0000-0000-000000000002', 'user-b@test.local')
  on conflict (id) do nothing;

insert into public.user_home_layouts (user_id, surface, pinned_modules) values
  ('a0000000-0000-0000-0000-000000000001', 'account', array['wallet']),
  ('b0000000-0000-0000-0000-000000000002', 'account', array['care'])
  on conflict (user_id, surface) do nothing;

insert into public.personalization_consent_events (user_id, action, consent_text_version) values
  ('a0000000-0000-0000-0000-000000000001', 'granted', 'test-v1'),
  ('b0000000-0000-0000-0000-000000000002', 'revoked', 'test-v1');

do $$
declare
  violations int := 0;
  v_count int;
  v_rows int;
begin
  -- (1) user B cannot read user A's layout
  perform set_config('test.uid', 'b0000000-0000-0000-0000-000000000002', true);
  set local role authenticated;
  select count(*) into v_count from public.user_home_layouts
    where user_id = 'a0000000-0000-0000-0000-000000000001';
  reset role;
  if v_count <> 0 then raise warning 'SECURITY FAIL: user B read user A layout (% rows)', v_count; violations := violations + 1;
  else raise notice 'OK: user B sees 0 rows of user A layout'; end if;

  -- (2) user B sees exactly their own layout row
  perform set_config('test.uid', 'b0000000-0000-0000-0000-000000000002', true);
  set local role authenticated;
  select count(*) into v_count from public.user_home_layouts;
  reset role;
  if v_count <> 1 then raise warning 'FAIL: user B expected 1 own layout, saw %', v_count; violations := violations + 1;
  else raise notice 'OK: user B sees only their own layout'; end if;

  -- (3) user B cannot UPDATE user A's layout (RLS USING blocks the row)
  perform set_config('test.uid', 'b0000000-0000-0000-0000-000000000002', true);
  set local role authenticated;
  update public.user_home_layouts set pinned_modules = array['jobs']
    where user_id = 'a0000000-0000-0000-0000-000000000001';
  get diagnostics v_rows = row_count;
  reset role;
  if v_rows <> 0 then raise warning 'SECURITY FAIL: user B UPDATEd % of user A layout rows', v_rows; violations := violations + 1;
  else raise notice 'OK: user B UPDATE of user A layout affected 0 rows'; end if;

  -- (4) user B cannot read user A's consent events
  perform set_config('test.uid', 'b0000000-0000-0000-0000-000000000002', true);
  set local role authenticated;
  select count(*) into v_count from public.personalization_consent_events
    where user_id = 'a0000000-0000-0000-0000-000000000001';
  reset role;
  if v_count <> 0 then raise warning 'SECURITY FAIL: user B read user A consent events (% rows)', v_count; violations := violations + 1;
  else raise notice 'OK: user B sees 0 rows of user A consent events'; end if;

  -- (5) user B sees only their own consent events
  perform set_config('test.uid', 'b0000000-0000-0000-0000-000000000002', true);
  set local role authenticated;
  select count(*) into v_count from public.personalization_consent_events;
  reset role;
  if v_count <> 1 then raise warning 'FAIL: user B expected 1 own consent event, saw %', v_count; violations := violations + 1;
  else raise notice 'OK: user B sees only their own consent events'; end if;

  -- (6) anon is denied SELECT on both tables (no grant)
  set local role anon;
  begin
    perform 1 from public.user_home_layouts limit 1;
    raise warning 'SECURITY FAIL: anon can SELECT user_home_layouts'; violations := violations + 1;
  exception when insufficient_privilege then raise notice 'OK: anon denied SELECT on user_home_layouts';
  end;
  begin
    perform 1 from public.personalization_consent_events limit 1;
    raise warning 'SECURITY FAIL: anon can SELECT personalization_consent_events'; violations := violations + 1;
  exception when insufficient_privilege then raise notice 'OK: anon denied SELECT on personalization_consent_events';
  end;
  reset role;

  -- (7) user B cannot INSERT a row carrying user A's user_id — WITH CHECK denies
  -- the classic upsert-with-forged-user_id IDOR vector.
  perform set_config('test.uid', 'b0000000-0000-0000-0000-000000000002', true);
  set local role authenticated;
  begin
    insert into public.user_home_layouts (user_id, surface, pinned_modules)
      values ('a0000000-0000-0000-0000-000000000001', 'owner', array['studio']);
    raise warning 'SECURITY FAIL: user B INSERTed a row as user A'; violations := violations + 1;
  exception when insufficient_privilege then raise notice 'OK: user B INSERT with user A''s id rejected by WITH CHECK';
  end;
  reset role;

  if violations > 0 then
    raise exception 'V3-34 personalization RLS behavioural proof FAILED: % violation(s)', violations;
  end if;
  raise notice 'V3-34 personalization RLS behavioural proof: OK';
end $$;
