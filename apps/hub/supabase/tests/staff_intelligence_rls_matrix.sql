-- =============================================================================
-- V3-42 — THE PER-ROLE DRILL-DOWN RLS MATRIX  (the load-bearing safety check)
-- =============================================================================
-- The pass spec names this the deployment gate: "each role drills only into its
-- permitted entities; a support drill-down cannot reach trust-only risk rows;
-- SQL-proven". This file is that proof, run as REAL Postgres roles.
--
-- The property under test exists because V3-40 and V3-41 chose different
-- predicates ON PURPOSE:
--
--     risk_scores / risk_enforcement_log      ->  is_staff_in('security')
--     workload_forecasts / quality_assessments
--     / dispute_likelihoods                   ->  is_staff_in_any()
--     staff_recommendation_state              ->  is_staff_in_any()
--       (rows with role_scope='trust'         ->  is_staff_in('security'))
--
-- So the matrix is not something the dashboards implement — it is something
-- they must not BYPASS. V3-42 reads with the caller's RLS-scoped session, never
-- the service role, which is why the table below is the whole story.
--
--                        | risk_scores | quality_assessments | recommendation_state
--   anon                 |      0      |          0          |         0
--   authenticated (none) |      0      |          0          |         0
--   support staff        |      0      |         >0          |        >0
--   finance staff        |      0      |         >0          |        >0
--   moderation staff     |      0      |         >0          |        >0
--   security staff       |     >0      |         >0          |        >0
--
-- The single cell that matters most is (support staff, risk_scores) = 0.
--
-- Role and staff membership are simulated with GUC-driven stubs so every
-- persona is exercised in one transaction. set_config(...) is used rather than
-- SET LOCAL ROLE so everything is a plain function call inside PL/pgSQL.
-- =============================================================================

\set ON_ERROR_STOP on

-- GUC-driven staff predicates. `test.divisions` is a comma list, so a persona
-- can hold several divisions exactly as a real staff member does.
create or replace function public.is_staff_in_any()
returns boolean language sql stable security definer set search_path = public
as $$ select coalesce(nullif(current_setting('test.divisions', true), ''), '') <> '' $$;

create or replace function public.is_staff_in(division_key text, role_key text default null)
returns boolean language sql stable security definer set search_path = public
as $$
  select division_key = any(
    string_to_array(coalesce(nullif(current_setting('test.divisions', true), ''), ''), ',')
  )
$$;

-- ---------------------------------------------------------------------------
-- Seed one row in each table, as the owner (service-role equivalent).
-- ---------------------------------------------------------------------------
insert into public.model_versions (model_kind, version, status, config)
values ('fraud_risk', 'matrix-test-v1', 'shadow', '{}'::jsonb)
on conflict do nothing;

insert into public.risk_scores
  (entity_type, entity_id, risk_score, deterministic_score, tier, deterministic_tier,
   contributing_factors, model_kind, model_version, shadow, scored_at)
values
  ('account', 'matrix-account-a', 72, 72, 'review', 'review', '[]'::jsonb,
   'fraud_risk', 'matrix-test-v1', true, timezone('utc', now()))
on conflict do nothing;

insert into public.quality_assessments
  (unit_type, unit_id, assessed_at, at_risk, risk_band, reasons, model_version)
values
  ('care_booking', 'matrix-unit-a', timezone('utc', now()), true, 'high',
   '["provider_silent"]'::jsonb, 'quality-rules-v1')
on conflict do nothing;

insert into public.staff_recommendation_state
  (recommendation_key, role_scope, status)
values
  ('matrix.card.a', 'support', 'open')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- THE MATRIX
-- ---------------------------------------------------------------------------
do $$
declare
  violations int := 0;
  persona    record;
  n          int;
begin
  for persona in
    select * from (values
      -- role,            divisions,           risk_expected, predictive_expected
      ('anon',            '',                  0,             0),
      ('authenticated',   '',                  0,             0),   -- signed in, not staff
      ('authenticated',   'support',           0,             1),   -- THE cell that matters
      ('authenticated',   'marketplace',       0,             1),   -- finance lens
      ('authenticated',   'hub',               0,             1),   -- moderation lens
      ('authenticated',   'security',          1,             1),   -- trust lens
      ('authenticated',   'support,security',  1,             1)    -- multi-division staff
    ) as t(rolename, divisions, risk_expected, predictive_expected)
  loop
    perform set_config('test.divisions', persona.divisions, true);
    perform set_config('role', persona.rolename, true);

    -- 1. V3-40 risk rows ----------------------------------------------------
    begin
      select count(*) into n from public.risk_scores;
    exception when insufficient_privilege then n := 0;
    end;
    if (n > 0) <> (persona.risk_expected = 1) then
      raise warning 'MATRIX VIOLATION: role=% divisions=[%] read % risk_scores row(s), expected %',
        persona.rolename, persona.divisions, n,
        case when persona.risk_expected = 1 then 'some' else 'ZERO' end;
      violations := violations + 1;
    end if;

    -- 2. V3-41 predictive rows ----------------------------------------------
    begin
      select count(*) into n from public.quality_assessments;
    exception when insufficient_privilege then n := 0;
    end;
    if (n > 0) <> (persona.predictive_expected = 1) then
      raise warning 'MATRIX VIOLATION: role=% divisions=[%] read % quality_assessments row(s), expected %',
        persona.rolename, persona.divisions, n,
        case when persona.predictive_expected = 1 then 'some' else 'ZERO' end;
      violations := violations + 1;
    end if;

    -- 3. V3-42 recommendation state -----------------------------------------
    begin
      select count(*) into n from public.staff_recommendation_state;
    exception when insufficient_privilege then n := 0;
    end;
    if (n > 0) <> (persona.predictive_expected = 1) then
      raise warning 'MATRIX VIOLATION: role=% divisions=[%] read % recommendation row(s), expected %',
        persona.rolename, persona.divisions, n,
        case when persona.predictive_expected = 1 then 'some' else 'ZERO' end;
      violations := violations + 1;
    end if;

    perform set_config('role', 'none', true);
  end loop;

  if violations > 0 then
    raise exception 'V3-42 PER-ROLE RLS MATRIX FAILED: % violation(s)', violations;
  end if;
  raise notice 'V3-42 per-role RLS matrix PASSED (7 personas x 3 table sets; support staff read ZERO risk rows)';
end $$;

-- ---------------------------------------------------------------------------
-- WRITES: no request role may write recommendation state, even as staff.
-- ---------------------------------------------------------------------------
do $$
declare
  violations int := 0;
begin
  perform set_config('test.divisions', 'security', true);
  perform set_config('role', 'authenticated', true);

  begin
    insert into public.staff_recommendation_state (recommendation_key, role_scope, status)
      values ('matrix.forged', 'trust', 'open');
    raise warning 'VIOLATION: authenticated staff INSERTED recommendation state';
    violations := violations + 1;
  exception when others then null;
  end;

  begin
    update public.staff_recommendation_state set status = 'accepted';
    if found then
      raise warning 'VIOLATION: authenticated staff UPDATED recommendation state';
      violations := violations + 1;
    end if;
  exception when others then null;
  end;

  perform set_config('role', 'none', true);

  if violations > 0 then
    raise exception 'V3-42 RECOMMENDATION WRITE LOCKDOWN FAILED: % violation(s)', violations;
  end if;
  raise notice 'V3-42 recommendation write lockdown PASSED (service-role only)';
end $$;

-- ---------------------------------------------------------------------------
-- NO AUTO-ACT at the data layer: a state change without a human actor is
-- impossible. Run as the OWNER — even the role that bypasses RLS and performs
-- every legitimate write cannot record a decision nobody made.
-- ---------------------------------------------------------------------------
do $$
declare
  violations int := 0;
  s text;
begin
  foreach s in array array['accepted', 'dismissed', 'snoozed']
  loop
    begin
      insert into public.staff_recommendation_state
        (recommendation_key, role_scope, status, acted_at, snooze_until)
      values
        ('matrix.noactor.' || s, 'support', s, timezone('utc', now()),
         case when s = 'snoozed' then timezone('utc', now()) + interval '3 days' else null end);
      raise warning 'VIOLATION: the database ACCEPTED status "%" with NO actor — the platform could accept its own recommendation', s;
      violations := violations + 1;
    exception when check_violation then
      null; -- correct: staff_recommendation_human_actor refused it
    end;
  end loop;

  -- ...and a real human decision still works, so the constraint is not "deny all".
  begin
    insert into public.staff_recommendation_state
      (recommendation_key, role_scope, status, actor, acted_at)
    values
      ('matrix.human.ok', 'support', 'accepted', gen_random_uuid(), timezone('utc', now()));
  exception when others then
    raise warning 'VIOLATION: a HUMAN-actored acceptance was rejected — the constraint is too tight';
    violations := violations + 1;
  end;

  -- A snooze with no wake time would silently become a permanent dismissal.
  begin
    insert into public.staff_recommendation_state
      (recommendation_key, role_scope, status, actor, acted_at)
    values
      ('matrix.snooze.nowake', 'support', 'snoozed', gen_random_uuid(), timezone('utc', now()));
    raise warning 'VIOLATION: a snooze with no snooze_until was accepted';
    violations := violations + 1;
  exception when check_violation then null;
  end;

  -- The role scope is closed: no lens outside the four may be persisted.
  begin
    insert into public.staff_recommendation_state (recommendation_key, role_scope, status)
      values ('matrix.badscope', 'owner', 'open');
    raise warning 'VIOLATION: an unknown role_scope was accepted';
    violations := violations + 1;
  exception when check_violation then null;
  end;

  if violations > 0 then
    raise exception 'V3-42 NO-AUTO-ACT PROOF FAILED: % violation(s)', violations;
  end if;
  raise notice 'V3-42 no-auto-act PASSED (DB refuses every actorless state change)';
end $$;

-- =============================================================================
-- ROUND-1 HARDENING — cells the first matrix did not exercise. An adversarial
-- review proved six policy mutations SURVIVED the original proof, and found that
-- trust-scoped decision rows leaked to all staff. Every one is now a cell.
-- =============================================================================
insert into public.risk_enforcement_log
  (entity_type, entity_id, action, tier_at_action, model_kind, model_version, shadow, actor)
values ('account', 'matrix-account-a', 'flag', 'review', 'fraud_risk', 'matrix-test-v1', true, 'system');

insert into public.dispute_likelihoods (transaction_id, scored_at, likelihood, band, model_version)
values ('matrix-txn-a', timezone('utc', now()), 0.5, 'high', 'dispute-logistic-v1')
on conflict do nothing;

insert into public.workload_forecasts (queue, generated_at, payload, sample_size, basis, model_version)
values ('support', timezone('utc', now()), '{}'::jsonb, 0, 'empty', 'workload-seasonal-ewma-v1')
on conflict do nothing;

-- A TRUST-scoped decision, as a security staffer would leave it.
insert into public.staff_recommendation_state
  (recommendation_key, role_scope, status, actor, acted_at)
values ('matrix.trust.decision', 'trust', 'dismissed', gen_random_uuid(), timezone('utc', now()));

do $$
declare
  violations int := 0;
  p record;
  n int;
  t text;
begin
  for p in
    select * from (values
      -- role,          divisions,          security, staff
      ('anon',          '',                 false,    false),
      ('authenticated', '',                 false,    false),
      ('authenticated', 'support',          false,    true),
      ('authenticated', 'marketplace',      false,    true),
      ('authenticated', 'security',         true,     true)
    ) as v(rolename, divisions, security, staff)
  loop
    perform set_config('test.divisions', p.divisions, true);
    perform set_config('role', p.rolename, true);

    -- V3-40 enforcement log: security only (round 1: only risk_scores was probed).
    begin select count(*) into n from public.risk_enforcement_log;
    exception when insufficient_privilege then n := 0; end;
    if (n > 0) <> p.security then
      raise warning 'MATRIX VIOLATION: role=% divisions=[%] read % risk_enforcement_log rows', p.rolename, p.divisions, n;
      violations := violations + 1;
    end if;

    -- V3-41 tables: staff only, never anon / non-staff.
    foreach t in array array['dispute_likelihoods', 'workload_forecasts'] loop
      begin execute format('select count(*) from public.%I', t) into n;
      exception when insufficient_privilege then n := 0; end;
      if (n > 0) <> p.staff then
        raise warning 'MATRIX VIOLATION: role=% divisions=[%] read % % rows', p.rolename, p.divisions, n, t;
        violations := violations + 1;
      end if;
    end loop;

    -- THE round-1 leak: trust-scoped decisions are security-only.
    begin select count(*) into n from public.staff_recommendation_state where role_scope = 'trust';
    exception when insufficient_privilege then n := 0; end;
    if (n > 0) <> p.security then
      raise warning 'MATRIX VIOLATION: role=% divisions=[%] read % TRUST-scoped decision rows', p.rolename, p.divisions, n;
      violations := violations + 1;
    end if;

    -- ...while non-trust decisions stay visible to every staff member.
    begin select count(*) into n from public.staff_recommendation_state where role_scope <> 'trust';
    exception when insufficient_privilege then n := 0; end;
    if (n > 0) <> p.staff then
      raise warning 'MATRIX VIOLATION: role=% divisions=[%] read % non-trust decision rows', p.rolename, p.divisions, n;
      violations := violations + 1;
    end if;

    perform set_config('role', 'none', true);
  end loop;

  -- DELETE is locked too (round 1: only INSERT/UPDATE were probed).
  perform set_config('test.divisions', 'security', true);
  perform set_config('role', 'authenticated', true);
  begin
    delete from public.staff_recommendation_state;
    if found then
      raise warning 'VIOLATION: authenticated staff DELETED recommendation state';
      violations := violations + 1;
    end if;
  exception when others then null;
  end;
  perform set_config('role', 'none', true);

  -- The acted_at CHECK: a decision must record WHEN (as owner).
  begin
    insert into public.staff_recommendation_state (recommendation_key, role_scope, status, actor)
      values ('matrix.noactedat', 'support', 'accepted', gen_random_uuid());
    raise warning 'VIOLATION: a decision with no acted_at was accepted';
    violations := violations + 1;
  exception when check_violation then null;
  end;

  -- The (key, role_scope) uniqueness the app's upsert depends on.
  begin
    insert into public.staff_recommendation_state (recommendation_key, role_scope, status)
      values ('matrix.card.a', 'support', 'open');
    raise warning 'VIOLATION: a duplicate (key, role_scope) row was accepted — the upsert target is gone';
    violations := violations + 1;
  exception when unique_violation then null;
  end;

  if violations > 0 then
    raise exception 'V3-42 ROUND-1 HARDENING FAILED: % violation(s)', violations;
  end if;
  raise notice 'V3-42 round-1 hardening PASSED (enforcement log, V3-41 tables, trust-row isolation, DELETE, acted_at, uniqueness)';
end $$;

-- =============================================================================
-- ROUND-2 HARDENING — the batch journals the dashboards now chart from.
-- Round 1 moved the trust and support snapshot series onto these journals, so
-- their gates are now load-bearing for V3-42: `risk_batch_runs` (tier counts)
-- must stay security-only, `predictive_batch_runs` staff-only.
-- =============================================================================
insert into public.risk_batch_runs (model_version, status, counts)
values ('matrix-test-v1', 'done', '{"tiers":{"review":3,"freeze":1}}'::jsonb);

insert into public.predictive_batch_runs (outcome, counts)
values ('succeeded', '{"at_risk":2,"dispute_watch":1}'::jsonb);

do $$
declare
  violations int := 0;
  p record;
  n int;
begin
  for p in
    select * from (values
      ('anon',          '',            false, false),
      ('authenticated', '',            false, false),
      ('authenticated', 'support',     false, true),
      ('authenticated', 'marketplace', false, true),
      ('authenticated', 'security',    true,  true)
    ) as v(rolename, divisions, security, staff)
  loop
    perform set_config('test.divisions', p.divisions, true);
    perform set_config('role', p.rolename, true);

    begin select count(*) into n from public.risk_batch_runs;
    exception when insufficient_privilege then n := 0; end;
    if (n > 0) <> p.security then
      raise warning 'MATRIX VIOLATION: role=% divisions=[%] read % risk_batch_runs rows', p.rolename, p.divisions, n;
      violations := violations + 1;
    end if;

    begin select count(*) into n from public.predictive_batch_runs;
    exception when insufficient_privilege then n := 0; end;
    if (n > 0) <> p.staff then
      raise warning 'MATRIX VIOLATION: role=% divisions=[%] read % predictive_batch_runs rows', p.rolename, p.divisions, n;
      violations := violations + 1;
    end if;

    perform set_config('role', 'none', true);
  end loop;

  if violations > 0 then
    raise exception 'V3-42 ROUND-2 JOURNAL MATRIX FAILED: % violation(s)', violations;
  end if;
  raise notice 'V3-42 round-2 journal matrix PASSED (risk_batch_runs security-only, predictive_batch_runs staff-only)';
end $$;
