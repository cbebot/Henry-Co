-- =============================================================================
-- V3-41 PREDICTIVE — RUNTIME RLS BEHAVIOUR + NO-AUTO-PUNISHMENT PROOF
-- =============================================================================
-- The static grant invariant proves the ACLs. This proves what actually happens
-- when a real role runs a real query:
--
--   1. anon reads ZERO rows from every predictive table.
--   2. The ASSESSED PARTY — an ordinary authenticated user — reads ZERO rows.
--      A person never sees a prediction about themselves (PRIVACY-NDPR §5.4 /
--      Phase E Prime Directive 11).
--   3. Staff DO read the queue (the policy is not simply "deny everyone").
--   4. authenticated cannot INSERT/UPDATE, even as staff — writes belong to the
--      service-role batch alone.
--   5. NO AUTO-PUNISHMENT AT THE DATA LAYER: the database REJECTS every
--      enforcement verb and ACCEPTS the advisory ones. This runs as the OWNER,
--      which is the strongest possible statement — even the role that bypasses
--      RLS and performs every legitimate write cannot persist a punishment.
--   6. A likelihood outside [0,1] and an at_risk/band mismatch are rejected.
--   7. workflow_locks is invisible to both request roles.
--
-- Role switching uses set_config('role', …, true) rather than SET LOCAL ROLE so
-- everything is a plain function call inside PL/pgSQL — no statement-form
-- surprises, and it reverts automatically at transaction end.
-- =============================================================================

\set ON_ERROR_STOP on

-- GUC-driven staff predicate so BOTH policy directions are provable in one run.
create or replace function public.is_staff_in_any()
returns boolean language sql stable security definer set search_path = public
as $$ select current_setting('test.staff', true) = '1' $$;

-- Seed rows as the table owner (service-role equivalent — bypasses RLS).
insert into public.workload_forecasts
  (queue, generated_at, horizon_hours, payload, sample_size, basis, model_version)
values
  ('support', timezone('utc', now()), 168, '{"perHour":[]}'::jsonb, 504, 'seasonal', 'workload-seasonal-ewma-v1')
on conflict do nothing;

insert into public.quality_assessments
  (unit_type, unit_id, assessed_at, at_risk, risk_band, reasons, suggested_intervention, signals_present, model_version)
values
  ('care_booking', 'unit-owned-by-user-a', timezone('utc', now()), true, 'high',
   '["provider_silent"]'::jsonb, 'staff_contact_provider', 4, 'quality-rules-v1')
on conflict do nothing;

insert into public.dispute_likelihoods
  (transaction_id, scored_at, likelihood, band, window_days, top_factors, features_present, model_version)
values
  ('txn-owned-by-user-a', timezone('utc', now()), 0.7300, 'high', 60,
   '[{"factor":"item_not_received_reported"}]'::jsonb, 6, 'dispute-logistic-v1')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Reads: anon / assessed party / staff
-- ---------------------------------------------------------------------------
do $$
declare
  violations int := 0;
  n int;
  t text;
begin
  -- 1. anon sees nothing -----------------------------------------------------
  perform set_config('role', 'anon', true);
  foreach t in array array['workload_forecasts','quality_assessments','dispute_likelihoods','predictive_batch_runs']
  loop
    begin
      execute format('select count(*) from public.%I', t) into n;
      if n <> 0 then
        raise warning 'VIOLATION: anon read % rows from %', n, t;
        violations := violations + 1;
      end if;
    exception when insufficient_privilege then
      null; -- equally correct: anon holds no grant at all
    end;
  end loop;
  perform set_config('role', 'none', true);

  -- 2. The ASSESSED PARTY (ordinary authenticated user) sees nothing ----------
  perform set_config('test.staff', '0', true);
  perform set_config('role', 'authenticated', true);
  foreach t in array array['workload_forecasts','quality_assessments','dispute_likelihoods','predictive_batch_runs']
  loop
    begin
      execute format('select count(*) from public.%I', t) into n;
      if n <> 0 then
        raise warning 'VIOLATION: a NON-STAFF user read % rows from % (the assessed party must see NOTHING)', n, t;
        violations := violations + 1;
      end if;
    exception when insufficient_privilege then
      null;
    end;
  end loop;
  perform set_config('role', 'none', true);

  -- 3. Staff DO read the queue ----------------------------------------------
  perform set_config('test.staff', '1', true);
  perform set_config('role', 'authenticated', true);
  select count(*) into n from public.quality_assessments;
  if n < 1 then
    raise warning 'VIOLATION: staff read 0 quality_assessments — the operator surface would be blank';
    violations := violations + 1;
  end if;
  select count(*) into n from public.dispute_likelihoods;
  if n < 1 then
    raise warning 'VIOLATION: staff read 0 dispute_likelihoods';
    violations := violations + 1;
  end if;
  select count(*) into n from public.workload_forecasts;
  if n < 1 then
    raise warning 'VIOLATION: staff read 0 workload_forecasts';
    violations := violations + 1;
  end if;

  -- 4. Even staff cannot write ----------------------------------------------
  begin
    insert into public.quality_assessments (unit_type, unit_id, at_risk, risk_band, model_version)
      values ('studio_project', 'forged-by-staff', true, 'high', 'quality-rules-v1');
    raise warning 'VIOLATION: authenticated staff INSERTED into quality_assessments';
    violations := violations + 1;
  exception when others then
    null; -- insufficient_privilege (expected) or any RLS refusal
  end;
  begin
    update public.dispute_likelihoods set band = 'low';
    if found then
      raise warning 'VIOLATION: authenticated staff UPDATED dispute_likelihoods';
      violations := violations + 1;
    end if;
  exception when others then
    null;
  end;

  -- 7. The lock table is invisible to request roles --------------------------
  begin
    select count(*) into n from public.workflow_locks;
    raise warning 'VIOLATION: authenticated read workflow_locks (% rows)', n;
    violations := violations + 1;
  exception when insufficient_privilege then
    null;
  end;
  perform set_config('role', 'none', true);

  if violations > 0 then
    raise exception 'V3-41 PREDICTIVE RLS BEHAVIOUR FAILED: % violation(s)', violations;
  end if;
  raise notice 'V3-41 predictive RLS behaviour PASSED (anon 0, assessed party 0, staff reads, staff cannot write)';
end $$;

-- ---------------------------------------------------------------------------
-- NO AUTO-PUNISHMENT + range constraints, as the OWNER.
-- ---------------------------------------------------------------------------
do $$
declare
  violations int := 0;
  bad text;
begin
  foreach bad in array array[
    'suspend_provider','block_account','auto_refund','freeze_payout','charge_customer','ban_user'
  ]
  loop
    begin
      insert into public.quality_assessments
        (unit_type, unit_id, assessed_at, at_risk, risk_band, suggested_intervention, model_version)
      values
        ('care_booking', 'punish-' || bad, timezone('utc', now()), true, 'high', bad, 'quality-rules-v1');
      raise warning 'VIOLATION: the database ACCEPTED enforcement action "%" — auto-punishment is reachable', bad;
      violations := violations + 1;
    exception when check_violation then
      null; -- correct: quality_no_auto_punishment rejected it
    end;
  end loop;

  -- ...and every ADVISORY verb still works, so the constraint is not "deny all".
  foreach bad in array array[
    'staff_review','staff_contact_customer','staff_contact_provider','staff_reassign_provider','staff_offer_goodwill'
  ]
  loop
    begin
      insert into public.quality_assessments
        (unit_type, unit_id, assessed_at, at_risk, risk_band, suggested_intervention, model_version)
      values
        ('studio_project', 'advisory-' || bad, timezone('utc', now()), true, 'elevated', bad, 'quality-rules-v1');
    exception when others then
      raise warning 'VIOLATION: the ADVISORY intervention "%" was rejected — the constraint is too tight', bad;
      violations := violations + 1;
    end;
  end loop;

  -- 6a. A likelihood outside [0,1] is impossible.
  begin
    insert into public.dispute_likelihoods (transaction_id, scored_at, likelihood, band, model_version)
      values ('out-of-range', timezone('utc', now()), 1.5, 'high', 'dispute-logistic-v1');
    raise warning 'VIOLATION: a likelihood of 1.5 was accepted';
    violations := violations + 1;
  exception when check_violation or numeric_value_out_of_range then
    null;
  end;

  -- 6b. at_risk must agree with the band.
  begin
    insert into public.quality_assessments (unit_type, unit_id, assessed_at, at_risk, risk_band, model_version)
      values ('learn_enrolment', 'band-mismatch', timezone('utc', now()), true, 'low', 'quality-rules-v1');
    raise warning 'VIOLATION: at_risk=true with risk_band=low was accepted';
    violations := violations + 1;
  exception when check_violation then
    null;
  end;

  if violations > 0 then
    raise exception 'V3-41 NO-AUTO-PUNISHMENT PROOF FAILED: % violation(s)', violations;
  end if;
  raise notice 'V3-41 no-auto-punishment PASSED (DB rejects every enforcement verb, accepts every advisory one)';
end $$;
