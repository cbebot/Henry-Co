-- V3-40 RISK — RLS + doctrine behavioural proof (runtime, not just grant metadata).
--
-- Run AFTER _bootstrap_supabase_env.sql + risk_min.sql + the risk migration on a
-- fresh DB. Proves as the actual request roles:
--   1. anon cannot SELECT any risk table (no grant at all)
--   2. an ordinary authenticated user — INCLUDING THE SCORED PARTY — sees ZERO rows
--      of scores/enforcement/models (the scored party never sees their own score)
--   3. a security-division staff viewer DOES read the queue rows (policy consults
--      is_staff_in('security'))
--   4. even staff cannot INSERT/UPDATE directly (writes are service-role only)
--   5. THE ABSOLUTE — the database itself rejects a system-actor hold/freeze
--      (risk_enforcement_no_auto_punishment), accepts a system flag, and rejects a
--      reason-less release/override
--   6. workflow_locks is invisible to both request roles
-- Any failure RAISES -> psql (ON_ERROR_STOP=1) exits non-zero -> CI RED.

-- Test doubles: uid from a GUC; is_staff_in from a GUC (the migration installed a
-- fail-closed stub on this fresh DB — replace it with a claims-reading double so
-- BOTH directions of the policy are provable).
create or replace function auth.uid() returns uuid language sql stable
  as $$ select nullif(current_setting('test.uid', true), '')::uuid $$;

create or replace function public.is_staff_in(division_key text, role_key text default null)
returns boolean language sql stable security definer set search_path = public
as $$ select current_setting('test.staff_security', true) = '1' and division_key = 'security' $$;

-- Fixtures (seeded as superuser; model v1.0.0 was seeded by the migration).
insert into auth.users (id, email) values
  ('c0000000-0000-0000-0000-000000000001', 'scored-party@test.local'),
  ('d0000000-0000-0000-0000-000000000002', 'security-staff@test.local')
  on conflict (id) do nothing;

insert into public.risk_scores
  (entity_type, entity_id, risk_score, deterministic_score, tier, deterministic_tier,
   contributing_factors, model_kind, model_version, shadow)
values
  ('account', 'c0000000-0000-0000-0000-000000000001', 72, 72, 'review', 'review',
   '[{"signal":"threat.credential_spray","weight":25,"value":"critical, 12 rows"}]'::jsonb,
   'fraud_risk', '1.0.0', true);

insert into public.risk_enforcement_log
  (entity_type, entity_id, action, tier_at_action, model_kind, model_version, shadow, actor)
values
  ('account', 'c0000000-0000-0000-0000-000000000001', 'flag', 'review', 'fraud_risk', '1.0.0', true, 'system');

do $$
declare
  violations int := 0;
  v_count int;
begin
  -- (1) anon denied outright
  set local role anon;
  begin
    perform 1 from public.risk_scores limit 1;
    raise warning 'SECURITY FAIL: anon can SELECT risk_scores'; violations := violations + 1;
  exception when insufficient_privilege then raise notice 'OK: anon denied SELECT on risk_scores';
  end;
  begin
    perform 1 from public.risk_enforcement_log limit 1;
    raise warning 'SECURITY FAIL: anon can SELECT risk_enforcement_log'; violations := violations + 1;
  exception when insufficient_privilege then raise notice 'OK: anon denied SELECT on risk_enforcement_log';
  end;
  reset role;

  -- (2) the SCORED PARTY (ordinary authenticated user, uid = the scored entity)
  --     sees ZERO rows — a prediction about you is never visible to you.
  perform set_config('test.uid', 'c0000000-0000-0000-0000-000000000001', true);
  perform set_config('test.staff_security', '0', true);
  set local role authenticated;
  select count(*) into v_count from public.risk_scores;
  if v_count <> 0 then raise warning 'SECURITY FAIL: scored party read % of their own risk rows', v_count; violations := violations + 1;
  else raise notice 'OK: the scored party sees 0 risk_scores rows'; end if;
  select count(*) into v_count from public.risk_enforcement_log;
  if v_count <> 0 then raise warning 'SECURITY FAIL: scored party read % enforcement rows', v_count; violations := violations + 1;
  else raise notice 'OK: the scored party sees 0 enforcement rows'; end if;
  select count(*) into v_count from public.model_versions;
  if v_count <> 0 then raise warning 'SECURITY FAIL: ordinary user read % model_versions rows', v_count; violations := violations + 1;
  else raise notice 'OK: ordinary user sees 0 model_versions rows'; end if;
  reset role;

  -- (3) security staff DO read the queue (policy consults is_staff_in('security'))
  perform set_config('test.uid', 'd0000000-0000-0000-0000-000000000002', true);
  perform set_config('test.staff_security', '1', true);
  set local role authenticated;
  select count(*) into v_count from public.risk_scores;
  if v_count < 1 then raise warning 'FAIL: security staff expected >=1 risk_scores row, saw %', v_count; violations := violations + 1;
  else raise notice 'OK: security staff read the risk queue (% row)', v_count; end if;
  reset role;

  -- (4) even staff cannot write directly — no INSERT/UPDATE grant for authenticated
  perform set_config('test.staff_security', '1', true);
  set local role authenticated;
  begin
    insert into public.risk_enforcement_log
      (entity_type, entity_id, action, tier_at_action, model_kind, model_version, actor, reason)
    values ('account', 'x', 'hold', 'review', 'fraud_risk', '1.0.0', 'd0000000-0000-0000-0000-000000000002', 'test');
    raise warning 'SECURITY FAIL: authenticated staff INSERTed enforcement directly'; violations := violations + 1;
  exception when insufficient_privilege then raise notice 'OK: direct staff INSERT denied (service-role only)';
  end;
  begin
    update public.model_versions set status = 'live' where model_kind = 'fraud_risk';
    raise warning 'SECURITY FAIL: authenticated staff UPDATEd model_versions'; violations := violations + 1;
  exception when insufficient_privilege then raise notice 'OK: direct staff model promotion denied (service-role only)';
  end;
  reset role;

  -- (5) THE ABSOLUTE — the DB rejects auto-punishment even from the write path
  begin
    insert into public.risk_enforcement_log
      (entity_type, entity_id, action, tier_at_action, model_kind, model_version, actor)
    values ('account', 'c0000000-0000-0000-0000-000000000001', 'freeze', 'freeze', 'fraud_risk', '1.0.0', 'system');
    raise warning 'DOCTRINE FAIL: a system-actor FREEZE was accepted'; violations := violations + 1;
  exception when check_violation then raise notice 'OK: system-actor freeze rejected by CHECK';
  end;
  begin
    insert into public.risk_enforcement_log
      (entity_type, entity_id, action, tier_at_action, model_kind, model_version, actor)
    values ('account', 'c0000000-0000-0000-0000-000000000001', 'hold', 'review', 'fraud_risk', '1.0.0', 'system');
    raise warning 'DOCTRINE FAIL: a system-actor HOLD was accepted'; violations := violations + 1;
  exception when check_violation then raise notice 'OK: system-actor hold rejected by CHECK';
  end;
  begin
    insert into public.risk_enforcement_log
      (entity_type, entity_id, action, tier_at_action, model_kind, model_version, actor, reason)
    values ('account', 'c0000000-0000-0000-0000-000000000001', 'release', 'review', 'fraud_risk', '1.0.0',
            'd0000000-0000-0000-0000-000000000002', '   ');
    raise warning 'DOCTRINE FAIL: a reason-less release was accepted'; violations := violations + 1;
  exception when check_violation then raise notice 'OK: reason-less release rejected by CHECK';
  end;
  -- and the one thing the system MAY do — flag — is accepted (seeded above; re-prove)
  begin
    insert into public.risk_enforcement_log
      (entity_type, entity_id, action, tier_at_action, model_kind, model_version, actor)
    values ('listing', 'listing-77', 'flag', 'monitor', 'fraud_risk', '1.0.0', 'system');
    raise notice 'OK: system flag accepted';
  exception when others then
    raise warning 'FAIL: the system flag write was rejected'; violations := violations + 1;
  end;

  -- (6) workflow_locks invisible to request roles
  set local role authenticated;
  begin
    perform 1 from public.workflow_locks limit 1;
    raise warning 'SECURITY FAIL: authenticated can SELECT workflow_locks'; violations := violations + 1;
  exception when insufficient_privilege then raise notice 'OK: authenticated denied on workflow_locks';
  end;
  reset role;

  -- (7) GOVERNANCE — at most ONE live model per kind (the concurrent-double-promote
  --     backstop). The seed model is shadow; promote it, then a SECOND live insert
  --     for the same kind must be rejected by the partial-unique index.
  update public.model_versions set status = 'live', approved_at = now()
    where model_kind = 'fraud_risk' and version = '1.0.0';
  begin
    insert into public.model_versions (model_kind, version, status, config)
      values ('fraud_risk', '9.9.9', 'live', '{"weights":{},"behavioralScales":{},"thresholds":{"monitor":30,"review":60,"freeze":85},"advisoryCapPoints":0}'::jsonb);
    raise warning 'GOVERNANCE FAIL: two live fraud_risk models coexist'; violations := violations + 1;
  exception when unique_violation then raise notice 'OK: a second live model was rejected (single-live-per-kind)';
  end;

  if violations > 0 then
    raise exception 'V3-40 risk RLS behavioural proof FAILED: % violation(s)', violations;
  end if;
  raise notice 'V3-40 risk RLS behavioural proof: OK';
end $$;
