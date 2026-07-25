-- V3-40 RISK — grant/constraint invariant. Run AFTER the risk migration on the
-- chain DB. Any violation RAISEs -> psql (ON_ERROR_STOP=1) -> CI RED.
--
-- Asserts, for model_versions / risk_scores / risk_enforcement_log / risk_batch_runs
-- / workflow_locks:
--   1. RLS is enabled on every table.
--   2. anon holds ZERO table privileges (the scored party's anonymous half).
--   3. authenticated holds NO INSERT/UPDATE/DELETE anywhere (writes are
--      service-role only), and SELECT only on the four risk tables (gated by the
--      security-staff policy), never on workflow_locks.
--   4. Each risk table's SELECT policy exists and references is_staff_in.
--   5. The NO-AUTO-PUNISHMENT and reason-required CHECK constraints exist.
--   6. The idempotent daily unique index and the composite model FK exist.

do $$
declare
  violations int := 0;
  t text;
  v_ok boolean;
begin
  -- 1. RLS enabled
  for t in select unnest(array['model_versions','risk_scores','risk_enforcement_log','risk_batch_runs','workflow_locks']) loop
    select c.relrowsecurity into v_ok
      from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relname = t;
    if not coalesce(v_ok, false) then
      raise warning 'VIOLATION: RLS not enabled on public.%', t; violations := violations + 1;
    end if;
  end loop;

  -- 2. anon: zero privileges
  for t in select unnest(array['model_versions','risk_scores','risk_enforcement_log','risk_batch_runs','workflow_locks']) loop
    if has_table_privilege('anon', 'public.' || t, 'SELECT')
      or has_table_privilege('anon', 'public.' || t, 'INSERT')
      or has_table_privilege('anon', 'public.' || t, 'UPDATE')
      or has_table_privilege('anon', 'public.' || t, 'DELETE') then
      raise warning 'VIOLATION: anon holds a privilege on public.%', t; violations := violations + 1;
    end if;
  end loop;

  -- 3. authenticated: no DML anywhere; SELECT only where intended
  for t in select unnest(array['model_versions','risk_scores','risk_enforcement_log','risk_batch_runs','workflow_locks']) loop
    if has_table_privilege('authenticated', 'public.' || t, 'INSERT')
      or has_table_privilege('authenticated', 'public.' || t, 'UPDATE')
      or has_table_privilege('authenticated', 'public.' || t, 'DELETE') then
      raise warning 'VIOLATION: authenticated holds DML on public.%', t; violations := violations + 1;
    end if;
  end loop;
  if has_table_privilege('authenticated', 'public.workflow_locks', 'SELECT') then
    raise warning 'VIOLATION: authenticated can SELECT workflow_locks'; violations := violations + 1;
  end if;
  for t in select unnest(array['model_versions','risk_scores','risk_enforcement_log','risk_batch_runs']) loop
    if not has_table_privilege('authenticated', 'public.' || t, 'SELECT') then
      raise warning 'VIOLATION: authenticated missing the policy-gated SELECT grant on public.%', t; violations := violations + 1;
    end if;
  end loop;

  -- 4. security-staff SELECT policies present + referencing is_staff_in
  for t in select unnest(array['model_versions','risk_scores','risk_enforcement_log','risk_batch_runs']) loop
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = t
        and cmd = 'SELECT' and qual ~ 'is_staff_in'
    ) then
      raise warning 'VIOLATION: public.% lacks the is_staff_in-gated SELECT policy', t; violations := violations + 1;
    end if;
    -- and no OTHER policy widens access
    if exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = t
        and (cmd <> 'SELECT' or qual !~ 'is_staff_in')
    ) then
      raise warning 'VIOLATION: public.% carries an unexpected extra policy', t; violations := violations + 1;
    end if;
  end loop;
  if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'workflow_locks') then
    raise warning 'VIOLATION: workflow_locks must have NO policies (default-deny)'; violations := violations + 1;
  end if;

  -- 5. doctrine CHECK constraints
  if not exists (
    select 1 from pg_constraint
    where conname = 'risk_enforcement_no_auto_punishment'
      and conrelid = 'public.risk_enforcement_log'::regclass and contype = 'c'
  ) then
    raise warning 'VIOLATION: no-auto-punishment CHECK missing'; violations := violations + 1;
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'risk_enforcement_reason_required'
      and conrelid = 'public.risk_enforcement_log'::regclass and contype = 'c'
  ) then
    raise warning 'VIOLATION: reason-required CHECK missing'; violations := violations + 1;
  end if;

  -- 6. idempotency + versioned-model integrity
  if not exists (
    select 1 from pg_indexes
    where schemaname = 'public' and tablename = 'risk_scores' and indexname = 'risk_scores_daily_unique'
  ) then
    raise warning 'VIOLATION: risk_scores_daily_unique index missing'; violations := violations + 1;
  end if;
  -- The single-live-per-kind backstop (no two live models can coexist).
  if not exists (
    select 1 from pg_indexes
    where schemaname = 'public' and tablename = 'model_versions' and indexname = 'model_versions_one_live_per_kind'
  ) then
    raise warning 'VIOLATION: model_versions_one_live_per_kind partial-unique index missing'; violations := violations + 1;
  end if;
  for t in select unnest(array['risk_scores','risk_enforcement_log']) loop
    if not exists (
      select 1 from pg_constraint
      where conrelid = ('public.' || t)::regclass and contype = 'f'
        and confrelid = 'public.model_versions'::regclass
    ) then
      raise warning 'VIOLATION: public.% lacks the composite FK to model_versions', t; violations := violations + 1;
    end if;
  end loop;

  if violations > 0 then
    raise exception 'V3-40 risk grant invariant FAILED: % violation(s)', violations;
  end if;
  raise notice 'V3-40 risk grant invariant: OK';
end $$;
