-- SEC-HARDEN-04 (part B) backstop — studio_payments money-safe lockdown invariant.
--
-- Run AFTER the SEC-HARDEN-04A chain + 20260614161000_sec_harden_04_studio_payments_
-- money_safe_lockdown.sql. studio_payments is MONEY-INPUT (its amount sizes a real
-- customer_wallets debit), so part B is owner-money-gated for the PROD apply; this
-- invariant proves the lock is correct in CI and doubles as the prod post-apply check.
--
-- Asserts:
--   1. The broad "Service role full access" policy is GONE; the two PROVABLY-UNUSED
--      scoped write policies (studio_member_payments_insert, studio_staff_payments_update)
--      are GONE; anon + authenticated + public hold NO INSERT/UPDATE/DELETE/TRUNCATE;
--      service_role keeps writes; no true-qual permissive write policy targets a
--      request role.
--   2. The scoped SELECT policy studio_member_payments SURVIVES (customer portal read
--      preserved); the SELECT grant is retained for the request roles.
--   3. Behavioural: as authenticated, an INSERT into studio_payments is rejected.
--   4. CLASS-DRIFT GUARD: the world-writable allowlist is now {audit_logs} only
--      (studio_payments + profiles both closed; audit_logs stays — SEC-HARDEN-01/FL2).
--
-- psql runs with ON_ERROR_STOP=1, so any RAISE EXCEPTION exits non-zero → CI RED.

do $$
declare
  violations int := 0;
  sp oid := to_regclass('public.studio_payments');
  writes text[] := array['INSERT','UPDATE','DELETE'];
  w text;
  bad_true_write int;
begin
  raise notice '--- SEC-HARDEN-04B invariant: studio_payments money-safe lockdown ---';
  if sp is null then
    raise notice 'studio_payments absent on this chain — invariant skipped'; return;
  end if;

  -- (1) broad + scoped write policies gone
  if exists (select 1 from pg_policies where schemaname='public' and tablename='studio_payments'
               and policyname='Service role full access') then
    raise warning 'VIOLATION: broad "Service role full access" policy still on studio_payments'; violations := violations + 1; end if;
  if exists (select 1 from pg_policies where schemaname='public' and tablename='studio_payments'
               and policyname='studio_member_payments_insert') then
    raise warning 'VIOLATION: unused studio_member_payments_insert write policy still present'; violations := violations + 1; end if;
  if exists (select 1 from pg_policies where schemaname='public' and tablename='studio_payments'
               and policyname='studio_staff_payments_update') then
    raise warning 'VIOLATION: unused studio_staff_payments_update write policy still present'; violations := violations + 1; end if;

  -- (1) request roles hold no write grant; service_role keeps writes
  foreach w in array writes loop
    if has_table_privilege('anon', sp, w) then
      raise warning 'VIOLATION: anon has % on studio_payments', w; violations := violations + 1; end if;
    if has_table_privilege('authenticated', sp, w) then
      raise warning 'VIOLATION: authenticated has % on studio_payments', w; violations := violations + 1; end if;
  end loop;
  if has_table_privilege('anon', sp, 'TRUNCATE') then
    raise warning 'VIOLATION: anon has TRUNCATE on studio_payments'; violations := violations + 1; end if;
  if has_table_privilege('authenticated', sp, 'TRUNCATE') then
    raise warning 'VIOLATION: authenticated has TRUNCATE on studio_payments'; violations := violations + 1; end if;
  if not (has_table_privilege('service_role', sp, 'INSERT')
          and has_table_privilege('service_role', sp, 'UPDATE')
          and has_table_privilege('service_role', sp, 'DELETE')) then
    raise warning 'VIOLATION: service_role lost write on studio_payments (admin path broken)'; violations := violations + 1; end if;

  -- (1) no true-qual permissive write policy targets a request role
  select count(*) into bad_true_write from pg_policies
    where schemaname='public' and tablename='studio_payments' and permissive='PERMISSIVE'
      and cmd in ('ALL','INSERT','UPDATE','DELETE')
      and coalesce(qual,'true')='true' and coalesce(with_check, qual, 'true')='true'
      and (roles @> array['authenticated']::name[] or roles @> array['anon']::name[] or roles @> array['public']::name[]);
  if bad_true_write > 0 then
    raise warning 'VIOLATION: studio_payments still has % true-qual permissive WRITE policy(ies) for a request role', bad_true_write; violations := violations + 1; end if;

  -- (2) scoped SELECT read preserved + SELECT grant retained
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='studio_payments'
                   and policyname='studio_member_payments' and cmd in ('SELECT','ALL')) then
    raise warning 'VIOLATION: scoped studio_member_payments SELECT policy lost (customer portal read broken)'; violations := violations + 1; end if;
  if not has_table_privilege('authenticated', sp, 'SELECT') then
    raise warning 'VIOLATION: authenticated lost SELECT on studio_payments (portal read broken)'; violations := violations + 1; end if;

  if violations > 0 then
    raise exception 'SEC-HARDEN-04B studio_payments invariant FAILED with % violation(s)', violations;
  end if;
  raise notice 'SEC-HARDEN-04B structural invariant PASSED (writes service-role-only; scoped SELECT kept)';
end $$;

-- ── (3) behavioural: as authenticated, an INSERT into studio_payments is rejected
do $$
declare inserted boolean := false; new_id uuid := gen_random_uuid();
begin
  if to_regclass('public.studio_payments') is null then
    raise notice 'studio_payments behavioural check skipped — table absent'; return;
  end if;
  set local role authenticated;
  begin
    execute format('insert into public.studio_payments (id, status) values (%L, %L)', new_id, 'paid');
    inserted := true;
  exception when others then
    inserted := false;  -- rejected (no write grant / no permissive insert policy) — desired
  end;
  reset role;
  if inserted then
    delete from public.studio_payments where id = new_id;
    raise exception 'VIOLATION: authenticated role INSERTED a studio_payments row — the money-input world-write is LIVE';
  end if;
  raise notice 'behavioural check PASSED — authenticated INSERT into studio_payments is rejected';
end $$;

-- ── (4) CLASS-DRIFT GUARD — final end-state allowlist {audit_logs} ────────────
do $$
declare
  offenders text[];
  allowlist text[] := array['audit_logs'];
begin
  select coalesce(array_agg(distinct tablename order by tablename), array[]::text[]) into offenders
  from pg_policies
  where schemaname='public' and permissive='PERMISSIVE'
    and cmd in ('ALL','INSERT','UPDATE','DELETE')
    and coalesce(qual,'true')='true' and coalesce(with_check, qual, 'true')='true'
    and (roles @> array['authenticated']::name[] or roles @> array['anon']::name[] or roles @> array['public']::name[])
    and not (tablename = any(allowlist))
    and tablename not like '%\_role\_memberships';   -- closed by SEC-HARDEN-02
  if array_length(offenders, 1) > 0 then
    raise exception 'CLASS DRIFT: world-writable table(s) outside the final allowlist {audit_logs}: %', array_to_string(offenders, ', ');
  end if;
  raise notice 'class-drift guard PASSED (final allowlist {audit_logs} — studio_payments + profiles both closed)';
end $$;

select 'sec-harden-04B studio_payments invariant: all assertions passed' as status;
