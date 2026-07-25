-- V3-40 RISK — transactional lifecycle RPC proof (promote_risk_model / rollback_risk_model).
--
-- Run AFTER _bootstrap_supabase_env.sql + risk_min.sql + the risk migration on a fresh
-- DB. Proves the governance invariants the round-3 adversarial pass demanded:
--   1. promote refuses before the ≥N-day shadow window (fail-safe, no state change)
--   2. promote succeeds once the window is met → EXACTLY ONE live model, approvals set
--   3. a second promote of another version demotes-first → still exactly one live
--   4. the RPCs are EXECUTE-only for service_role (never anon/authenticated)
--   5. rollback releases EVERY open hold under the rolled-back version (set-based, no cap)
--      and restores the most-recent previously-live version, atomically
--   6. rollback of a non-live version returns ok:false, changes nothing
-- Any failure RAISEs -> psql (ON_ERROR_STOP=1) exits non-zero -> CI RED.

insert into auth.users (id, email) values
  ('e0000000-0000-0000-0000-000000000001', 'owner@test.local')
  on conflict (id) do nothing;

-- A dedicated model_kind so this proof is independent of whatever earlier chain steps
-- did to fraud_risk (they run on the same DB). Two shadow versions to exercise
-- demote-first + rollback-restore.
insert into public.model_versions (model_kind, version, status, config) values
  ('lifecycle_test', '1.0.0', 'shadow',
   '{"weights":{},"behavioralScales":{},"thresholds":{"monitor":30,"review":60,"freeze":85},"advisoryCapPoints":0}'::jsonb),
  ('lifecycle_test', '2.0.0', 'shadow',
   '{"weights":{},"behavioralScales":{},"thresholds":{"monitor":30,"review":60,"freeze":85},"advisoryCapPoints":0}'::jsonb)
  on conflict (model_kind, version) do nothing;

do $$
declare
  violations int := 0;
  v jsonb;
  v_live int;
  v_count int;
begin
  -- (4) function grants: service_role only
  if has_function_privilege('anon', 'public.promote_risk_model(text,text,uuid,integer)', 'EXECUTE')
    or has_function_privilege('authenticated', 'public.promote_risk_model(text,text,uuid,integer)', 'EXECUTE')
    or has_function_privilege('anon', 'public.rollback_risk_model(text,text,text,uuid)', 'EXECUTE')
    or has_function_privilege('authenticated', 'public.rollback_risk_model(text,text,text,uuid)', 'EXECUTE') then
    raise warning 'VIOLATION: a lifecycle RPC is executable by a request role'; violations := violations + 1;
  end if;
  if not has_function_privilege('service_role', 'public.promote_risk_model(text,text,uuid,integer)', 'EXECUTE')
    or not has_function_privilege('service_role', 'public.rollback_risk_model(text,text,text,uuid)', 'EXECUTE') then
    raise warning 'VIOLATION: service_role cannot execute a lifecycle RPC'; violations := violations + 1;
  end if;

  -- (1) promote refuses before the shadow window (0 scored days < 30)
  v := public.promote_risk_model('lifecycle_test', '1.0.0', 'e0000000-0000-0000-0000-000000000001', 30);
  if (v->>'ok')::boolean is not false or v->>'reason' <> 'shadow_window' then
    raise warning 'FAIL: promote should refuse on shadow_window, got %', v; violations := violations + 1;
  else raise notice 'OK: promote refused (shadow window not met)'; end if;
  select count(*) into v_live from public.model_versions where status = 'live' and model_kind = 'lifecycle_test';
  if v_live <> 0 then raise warning 'FAIL: a refused promote changed state (% live)', v_live; violations := violations + 1;
  else raise notice 'OK: refused promote left zero live'; end if;

  -- Seed 30 distinct scored days for 1.0.0.
  insert into public.risk_scores
    (entity_type, entity_id, risk_score, deterministic_score, tier, deterministic_tier,
     contributing_factors, model_kind, model_version, shadow, scored_on)
  select 'account', 'seed-' || g, 10, 10, 'pass', 'pass', '[]'::jsonb, 'lifecycle_test', '1.0.0', true,
         (current_date - g)
  from generate_series(0, 29) g;

  -- (2) promote now succeeds → exactly one live, approvals set
  v := public.promote_risk_model('lifecycle_test', '1.0.0', 'e0000000-0000-0000-0000-000000000001', 30);
  if (v->>'ok')::boolean is not true then raise warning 'FAIL: promote should succeed, got %', v; violations := violations + 1;
  else raise notice 'OK: promote succeeded after window met'; end if;
  select count(*) into v_live from public.model_versions where status = 'live' and model_kind = 'lifecycle_test';
  if v_live <> 1 then raise warning 'FAIL: expected 1 live, saw %', v_live; violations := violations + 1;
  else raise notice 'OK: exactly one live model'; end if;
  if not exists (select 1 from public.model_versions where version = '1.0.0' and approved_by is not null and approved_at is not null) then
    raise warning 'FAIL: promote did not stamp approvals'; violations := violations + 1;
  else raise notice 'OK: approvals stamped'; end if;

  -- Seed a staff hold on an entity under 1.0.0 (the live model). created_at is set in
  -- the past because in reality a hold always predates its rollback-release (separate
  -- requests); the whole do-block shares one transaction timestamp otherwise.
  insert into public.risk_enforcement_log
    (entity_type, entity_id, action, tier_at_action, model_kind, model_version, shadow, actor, created_at)
  values ('account', 'held-1', 'freeze', 'freeze', 'lifecycle_test', '1.0.0', false,
          'e0000000-0000-0000-0000-000000000001', now() - interval '2 minutes');

  -- Seed 30 days + promote 2.0.0 as well (demote-first): 1.0.0 retires, 2.0.0 live.
  insert into public.risk_scores
    (entity_type, entity_id, risk_score, deterministic_score, tier, deterministic_tier,
     contributing_factors, model_kind, model_version, shadow, scored_on)
  select 'account', 'seed2-' || g, 10, 10, 'pass', 'pass', '[]'::jsonb, 'lifecycle_test', '2.0.0', true,
         (current_date - g)
  from generate_series(0, 29) g;
  v := public.promote_risk_model('lifecycle_test', '2.0.0', 'e0000000-0000-0000-0000-000000000001', 30);
  if (v->>'ok')::boolean is not true then raise warning 'FAIL: second promote failed, got %', v; violations := violations + 1; end if;
  -- (3) still exactly one live
  select count(*) into v_live from public.model_versions where status = 'live' and model_kind = 'lifecycle_test';
  if v_live <> 1 then raise warning 'FAIL: demote-first left % live', v_live; violations := violations + 1;
  else raise notice 'OK: demote-first kept exactly one live'; end if;

  -- (6) rollback of a non-live version returns ok:false
  v := public.rollback_risk_model('lifecycle_test', '1.0.0', 'test', 'e0000000-0000-0000-0000-000000000001');
  if (v->>'ok')::boolean is not false or v->>'reason' <> 'not_live' then
    raise warning 'FAIL: rollback of non-live should return not_live, got %', v; violations := violations + 1;
  else raise notice 'OK: rollback of non-live refused'; end if;

  -- (5) rollback the LIVE 2.0.0 → restores 1.0.0 (most-recent retired previously-live),
  --     and the hold under 1.0.0 is unaffected (it was under 1.0.0, not 2.0.0).
  --     First add a hold under 2.0.0 to prove the release path.
  insert into public.risk_enforcement_log
    (entity_type, entity_id, action, tier_at_action, model_kind, model_version, shadow, actor, created_at)
  values ('account', 'held-2', 'hold', 'review', 'lifecycle_test', '2.0.0', false,
          'e0000000-0000-0000-0000-000000000001', now() - interval '1 minute');
  v := public.rollback_risk_model('lifecycle_test', '2.0.0', 'precision regression', 'e0000000-0000-0000-0000-000000000001');
  if (v->>'ok')::boolean is not true then raise warning 'FAIL: rollback failed, got %', v; violations := violations + 1;
  else raise notice 'OK: rollback succeeded (restored %, released %)', v->>'restored', v->>'released'; end if;
  if v->>'restored' <> '1.0.0' then raise warning 'FAIL: expected 1.0.0 restored, got %', v->>'restored'; violations := violations + 1; end if;
  if (v->>'released')::int <> 1 then raise warning 'FAIL: expected 1 release, got %', v->>'released'; violations := violations + 1; end if;
  -- the held-2 entity's latest action is now 'release'
  if not exists (
    select 1 from (
      select distinct on (entity_type, entity_id) action
      from public.risk_enforcement_log where entity_id = 'held-2'
      order by entity_type, entity_id, created_at desc
    ) t where action = 'release'
  ) then raise warning 'FAIL: held-2 was not released'; violations := violations + 1;
  else raise notice 'OK: open hold under the rolled-back version was released'; end if;
  -- exactly one live again (1.0.0 restored)
  select count(*) into v_live from public.model_versions where status = 'live' and model_kind = 'lifecycle_test';
  if v_live <> 1 then raise warning 'FAIL: after rollback expected 1 live, saw %', v_live; violations := violations + 1;
  else raise notice 'OK: rollback restored exactly one live'; end if;

  if violations > 0 then
    raise exception 'V3-40 lifecycle RPC proof FAILED: % violation(s)', violations;
  end if;
  raise notice 'V3-40 lifecycle RPC proof: OK';
end $$;
