-- V3-38 AVAILABILITY — RLS + fn behavioural proof (runtime, not just metadata).
--
-- Run AFTER _bootstrap_supabase_env.sql + availability_min.sql + the V3-38
-- migration on a fresh DB. Proves the availability posture as the actual
-- request roles:
--   1. anon CAN read seeded coverage rows (availability is public by design)
--   2. authenticated CAN read coverage rows
--   3. anon/authenticated CANNOT write coverage (RLS default-deny + no grant)
--   4. anon/authenticated CANNOT read the gap counters (no grant at all)
--   5. anon/authenticated CANNOT execute record_service_availability_gap
--   6. the fn (as its owner — how service_role reaches it) increments one
--      grain row idempotently (2 calls -> shown_count 2), and silently drops
--      malformed input (bad division / bad country / bad offering key)
--   7. seed sanity: at least one active care row and one active logistics row
--      exist (the soak note depends on a real seed)
-- Any failure RAISES -> psql (ON_ERROR_STOP=1) exits non-zero -> CI RED.

do $$
declare
  violations int := 0;
  v_count int;
  v_rows int;
  v_shown bigint;
begin
  -- (1) anon reads seeded coverage rows
  set local role anon;
  select count(*) into v_count from public.service_area_coverage where is_active;
  reset role;
  if v_count < 1 then raise warning 'FAIL: anon read % active coverage rows (expected >= 1)', v_count; violations := violations + 1;
  else raise notice 'OK: anon reads % active coverage rows', v_count; end if;

  -- (2) authenticated reads coverage rows
  set local role authenticated;
  select count(*) into v_count from public.service_area_coverage where is_active;
  reset role;
  if v_count < 1 then raise warning 'FAIL: authenticated read % coverage rows (expected >= 1)', v_count; violations := violations + 1;
  else raise notice 'OK: authenticated reads coverage'; end if;

  -- (3) request roles cannot write coverage
  set local role anon;
  begin
    insert into public.service_area_coverage (division, offering_key, country)
      values ('care', 'forged-offering', 'NG');
    raise warning 'SECURITY FAIL: anon INSERTed a coverage row'; violations := violations + 1;
  exception when insufficient_privilege then raise notice 'OK: anon coverage INSERT denied';
  end;
  reset role;
  set local role authenticated;
  begin
    update public.service_area_coverage set provider_count = 999 where division = 'care';
    get diagnostics v_rows = row_count;
    if v_rows <> 0 then raise warning 'SECURITY FAIL: authenticated UPDATEd % coverage rows', v_rows; violations := violations + 1;
    else raise notice 'OK: authenticated coverage UPDATE affected 0 rows'; end if;
  exception when insufficient_privilege then raise notice 'OK: authenticated coverage UPDATE denied';
  end;
  reset role;

  -- (4) request roles cannot read the gap counters
  set local role anon;
  begin
    perform 1 from public.service_availability_gaps limit 1;
    raise warning 'SECURITY FAIL: anon can SELECT service_availability_gaps'; violations := violations + 1;
  exception when insufficient_privilege then raise notice 'OK: anon denied SELECT on gaps';
  end;
  reset role;
  set local role authenticated;
  begin
    perform 1 from public.service_availability_gaps limit 1;
    raise warning 'SECURITY FAIL: authenticated can SELECT service_availability_gaps'; violations := violations + 1;
  exception when insufficient_privilege then raise notice 'OK: authenticated denied SELECT on gaps';
  end;
  reset role;

  -- (5) request roles cannot execute the gap counter
  set local role anon;
  begin
    perform public.record_service_availability_gap('care', 'laundry', 'NG', 'Lagos', null);
    raise warning 'SECURITY FAIL: anon executed record_service_availability_gap'; violations := violations + 1;
  exception when insufficient_privilege then raise notice 'OK: anon denied EXECUTE on gap fn';
  end;
  reset role;
  set local role authenticated;
  begin
    perform public.record_service_availability_gap('care', 'laundry', 'NG', 'Lagos', null);
    raise warning 'SECURITY FAIL: authenticated executed record_service_availability_gap'; violations := violations + 1;
  exception when insufficient_privilege then raise notice 'OK: authenticated denied EXECUTE on gap fn';
  end;
  reset role;

  -- (6) the fn increments one grain row (called as the owner — the same
  -- definer context service_role reaches via its EXECUTE grant)
  perform public.record_service_availability_gap('care', 'laundry', 'NG', 'Lagos', 'Ikeja');
  perform public.record_service_availability_gap('care', 'laundry', 'NG', 'Lagos', 'Ikeja');
  select shown_count into v_shown from public.service_availability_gaps
    where division = 'care' and offering_key = 'laundry'
      and country = 'NG' and region = 'Lagos' and city = 'Ikeja';
  if v_shown is distinct from 2 then
    raise warning 'FAIL: gap counter expected shown_count 2, saw %', v_shown; violations := violations + 1;
  else raise notice 'OK: gap counter incremented to 2 on one grain row'; end if;

  -- malformed input is dropped, never inserted
  perform public.record_service_availability_gap('not-a-division', 'laundry', 'NG', null, null);
  perform public.record_service_availability_gap('care', 'laundry', 'NGA', null, null);
  perform public.record_service_availability_gap('care', 'bad key !!', 'NG', null, null);
  select count(*) into v_count from public.service_availability_gaps;
  if v_count <> 1 then
    raise warning 'FAIL: malformed gap input landed (expected 1 grain row, saw %)', v_count; violations := violations + 1;
  else raise notice 'OK: malformed gap input silently dropped'; end if;

  -- (7) seed sanity — the honest minimal seed exists
  select count(*) into v_count from public.service_area_coverage
    where division = 'care' and is_active and provider_count > 0;
  if v_count < 1 then raise warning 'FAIL: no active care coverage seed'; violations := violations + 1;
  else raise notice 'OK: care seed present (% rows)', v_count; end if;
  select count(*) into v_count from public.service_area_coverage
    where division = 'logistics' and is_active and provider_count > 0;
  if v_count < 1 then raise warning 'FAIL: no active logistics coverage seed'; violations := violations + 1;
  else raise notice 'OK: logistics seed present (% rows)', v_count; end if;

  if violations > 0 then
    raise exception 'V3-38 availability RLS behavioural proof FAILED: % violation(s)', violations;
  end if;
  raise notice 'V3-38 availability RLS behavioural proof: OK';
end $$;
