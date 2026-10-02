-- V3-MKT-TRUST-01 — grant / structure invariant. Run AFTER the instant-publish
-- migration. Any violation RAISEs -> psql (ON_ERROR_STOP=1) -> CI RED.
--
-- Asserts:
--   1. The four gate tables have RLS on and NO policy (default-deny).
--   2. anon and authenticated hold no privilege on them at all; service_role may
--      SELECT and nothing else (the ledger cannot be written around the RPCs).
--   3. Every gate function is NOT executable by anon or authenticated — proven with
--      has_function_privilege, because Supabase grants EXECUTE to those roles
--      directly and `revoke from public` alone leaves them callable.
--   4. The RPCs the TS gate calls ARE executable by service_role.
--   5. Every gate function that reads or writes gate tables is SECURITY DEFINER with
--      a pinned search_path.
--   6. The three guard triggers exist, are enabled, and fire on the right events.
--   7. The one-active-hide unique index exists (the hide RPC's idempotence).

do $$
declare
  violations int := 0;
  t text;
  f text;
  v_ok boolean;
  v_cfg text[];
  v_secdef boolean;
  r record;
begin
  -- 1 + 2. tables
  for t in select unnest(array[
    'marketplace_listing_gate_verdicts', 'marketplace_seller_probation',
    'marketplace_listing_enforcement', 'marketplace_image_fingerprints'
  ]) loop
    select c.relrowsecurity into v_ok
      from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relname = t;
    if not coalesce(v_ok, false) then
      raise warning 'VIOLATION: RLS not enabled on public.%', t; violations := violations + 1;
    end if;
    if exists (select 1 from pg_policies where schemaname = 'public' and tablename = t) then
      raise warning 'VIOLATION: public.% must have NO policies (default-deny)', t; violations := violations + 1;
    end if;
    if has_table_privilege('anon', 'public.' || t, 'SELECT')
      or has_table_privilege('anon', 'public.' || t, 'INSERT')
      or has_table_privilege('anon', 'public.' || t, 'UPDATE')
      or has_table_privilege('anon', 'public.' || t, 'DELETE')
      or has_table_privilege('anon', 'public.' || t, 'TRUNCATE') then
      raise warning 'VIOLATION: anon holds a privilege on public.%', t; violations := violations + 1;
    end if;
    if has_table_privilege('authenticated', 'public.' || t, 'SELECT')
      or has_table_privilege('authenticated', 'public.' || t, 'INSERT')
      or has_table_privilege('authenticated', 'public.' || t, 'UPDATE')
      or has_table_privilege('authenticated', 'public.' || t, 'DELETE')
      or has_table_privilege('authenticated', 'public.' || t, 'TRUNCATE') then
      raise warning 'VIOLATION: authenticated holds a privilege on public.%', t; violations := violations + 1;
    end if;
    if has_table_privilege('service_role', 'public.' || t, 'INSERT')
      or has_table_privilege('service_role', 'public.' || t, 'UPDATE')
      or has_table_privilege('service_role', 'public.' || t, 'DELETE')
      or has_table_privilege('service_role', 'public.' || t, 'TRUNCATE') then
      raise warning 'VIOLATION: service_role can write public.% directly (writes must go through the RPCs)', t;
      violations := violations + 1;
    end if;
    if not has_table_privilege('service_role', 'public.' || t, 'SELECT') then
      raise warning 'VIOLATION: service_role cannot read public.%', t; violations := violations + 1;
    end if;
  end loop;

  -- 3. no gate function is callable by a request role
  for f in select unnest(array[
    'public.marketplace_listing_content_hash(public.marketplace_products)',
    'public.marketplace_gate_probation_caps()',
    'public.marketplace_gate_granted_memberships(uuid)',
    'public.marketplace_gate_is_staff(uuid)',
    'public.marketplace_gate_actor_may_act_for(uuid,uuid)',
    'public.marketplace_gate_identity_verified(uuid)',
    'public.marketplace_gate_caller_is_trusted()',
    'public.marketplace_gate_is_company_vendor(uuid)',
    'public.marketplace_gate_probation_active(uuid)',
    'public.marketplace_products_publish_guard()',
    'public.marketplace_products_publish_record()',
    'public.marketplace_product_media_guard()',
    'public.marketplace_payout_identity_guard()',
    'public.marketplace_product_variant_guard()',
    'public.marketplace_vendors_probation_enroll()',
    'public.marketplace_gate_seller_state(uuid,text)',
    'public.marketplace_gate_record_listing_verdict(uuid,uuid,jsonb,text[],text,text[],jsonb,text,text)',
    'public.marketplace_gate_record_rescan(uuid,text)',
    'public.marketplace_gate_rescan_candidates(text,integer)',
    'public.marketplace_gate_hide_listing(uuid,text,text[],jsonb,text)',
    'public.marketplace_gate_register_image(text,text,bigint,bigint,uuid,uuid,bigint)',
    'public.marketplace_gate_image_matches(uuid,text,text[],integer)',
    'public.marketplace_gate_instant_onboard(uuid,uuid,text[],jsonb,text)',
    'public.marketplace_gate_payout_eligibility(uuid)'
  ]) loop
    if to_regprocedure(f) is null then
      raise warning 'VIOLATION: % does not exist', f; violations := violations + 1;
      continue;
    end if;
    if has_function_privilege('anon', f, 'EXECUTE') then
      raise warning 'VIOLATION: % is executable by anon', f; violations := violations + 1;
    end if;
    if has_function_privilege('authenticated', f, 'EXECUTE') then
      raise warning 'VIOLATION: % is executable by authenticated', f; violations := violations + 1;
    end if;
  end loop;

  -- 4. the RPC surface the TS gate calls
  for f in select unnest(array[
    'public.marketplace_gate_probation_caps()',
    'public.marketplace_gate_seller_state(uuid,text)',
    'public.marketplace_gate_record_listing_verdict(uuid,uuid,jsonb,text[],text,text[],jsonb,text,text)',
    'public.marketplace_gate_record_rescan(uuid,text)',
    'public.marketplace_gate_rescan_candidates(text,integer)',
    'public.marketplace_gate_hide_listing(uuid,text,text[],jsonb,text)',
    'public.marketplace_gate_register_image(text,text,bigint,bigint,uuid,uuid,bigint)',
    'public.marketplace_gate_image_matches(uuid,text,text[],integer)',
    'public.marketplace_gate_instant_onboard(uuid,uuid,text[],jsonb,text)',
    'public.marketplace_gate_payout_eligibility(uuid)'
  ]) loop
    if to_regprocedure(f) is not null and not has_function_privilege('service_role', f, 'EXECUTE') then
      raise warning 'VIOLATION: service_role cannot execute %', f; violations := violations + 1;
    end if;
  end loop;

  -- 5. SECURITY DEFINER + pinned search_path where gate tables are touched
  for f in select unnest(array[
    'public.marketplace_gate_granted_memberships(uuid)',
    'public.marketplace_gate_is_staff(uuid)',
    'public.marketplace_gate_actor_may_act_for(uuid,uuid)',
    'public.marketplace_gate_identity_verified(uuid)',
    'public.marketplace_gate_is_company_vendor(uuid)',
    'public.marketplace_gate_probation_active(uuid)',
    'public.marketplace_products_publish_guard()',
    'public.marketplace_products_publish_record()',
    'public.marketplace_product_media_guard()',
    'public.marketplace_payout_identity_guard()',
    'public.marketplace_product_variant_guard()',
    'public.marketplace_vendors_probation_enroll()',
    'public.marketplace_gate_seller_state(uuid,text)',
    'public.marketplace_gate_record_listing_verdict(uuid,uuid,jsonb,text[],text,text[],jsonb,text,text)',
    'public.marketplace_gate_record_rescan(uuid,text)',
    'public.marketplace_gate_rescan_candidates(text,integer)',
    'public.marketplace_gate_hide_listing(uuid,text,text[],jsonb,text)',
    'public.marketplace_gate_register_image(text,text,bigint,bigint,uuid,uuid,bigint)',
    'public.marketplace_gate_image_matches(uuid,text,text[],integer)',
    'public.marketplace_gate_instant_onboard(uuid,uuid,text[],jsonb,text)',
    'public.marketplace_gate_payout_eligibility(uuid)'
  ]) loop
    if to_regprocedure(f) is null then continue; end if;
    select p.prosecdef, p.proconfig into v_secdef, v_cfg from pg_proc p where p.oid = to_regprocedure(f);
    if not coalesce(v_secdef, false) then
      raise warning 'VIOLATION: % is not SECURITY DEFINER', f; violations := violations + 1;
    end if;
    if v_cfg is null or not exists (select 1 from unnest(v_cfg) c where c like 'search_path=%') then
      raise warning 'VIOLATION: % has no pinned search_path', f; violations := violations + 1;
    end if;
  end loop;

  -- The caller-trust probe must NOT be SECURITY DEFINER: its whole job is to see
  -- the calling role, and it reads only the role setting and session_user.
  select p.prosecdef into v_secdef from pg_proc p
   where p.oid = to_regprocedure('public.marketplace_gate_caller_is_trusted()');
  if coalesce(v_secdef, true) then
    raise warning 'VIOLATION: marketplace_gate_caller_is_trusted must be SECURITY INVOKER'; violations := violations + 1;
  end if;

  -- 6. guard triggers
  if not exists (
    select 1 from pg_trigger tg
    where tg.tgrelid = 'public.marketplace_products'::regclass and tg.tgname = 'marketplace_products_publish_guard'
      and not tg.tgisinternal and tg.tgenabled = 'O'
      and (tg.tgtype & 2) = 2      -- BEFORE
      and (tg.tgtype & 4) = 4      -- INSERT
      and (tg.tgtype & 16) = 16    -- UPDATE
      and (tg.tgtype & 1) = 1      -- ROW
  ) then
    raise warning 'VIOLATION: publish guard trigger missing, disabled or not BEFORE INSERT OR UPDATE FOR EACH ROW';
    violations := violations + 1;
  end if;
  if not exists (
    select 1 from pg_trigger tg
    where tg.tgrelid = 'public.marketplace_products'::regclass and tg.tgname = 'marketplace_products_publish_record'
      and not tg.tgisinternal and tg.tgenabled = 'O'
      and (tg.tgtype & 2) = 0 and (tg.tgtype & 4) = 4 and (tg.tgtype & 16) = 16 and (tg.tgtype & 1) = 1
  ) then
    raise warning 'VIOLATION: publish record trigger missing, disabled or not AFTER INSERT OR UPDATE FOR EACH ROW';
    violations := violations + 1;
  end if;
  if not exists (
    select 1 from pg_trigger tg
    where tg.tgrelid = 'public.marketplace_product_media'::regclass and tg.tgname = 'marketplace_product_media_guard'
      and not tg.tgisinternal and tg.tgenabled = 'O'
      and (tg.tgtype & 2) = 2 and (tg.tgtype & 4) = 4 and (tg.tgtype & 16) = 16 and (tg.tgtype & 1) = 1
  ) then
    raise warning 'VIOLATION: media guard trigger missing or disabled'; violations := violations + 1;
  end if;
  if not exists (
    select 1 from pg_trigger tg
    where tg.tgrelid = 'public.marketplace_payout_requests'::regclass and tg.tgname = 'marketplace_payout_identity_guard'
      and not tg.tgisinternal and tg.tgenabled = 'O'
      and (tg.tgtype & 2) = 2 and (tg.tgtype & 4) = 4 and (tg.tgtype & 16) = 16 and (tg.tgtype & 1) = 1
  ) then
    raise warning 'VIOLATION: payout identity guard trigger missing or disabled'; violations := violations + 1;
  end if;
  -- the payout guard must see EVERY update (a request re-pointed to another store), not only `update of status`
  if exists (
    select 1 from pg_trigger tg
    where tg.tgrelid = 'public.marketplace_payout_requests'::regclass and tg.tgname = 'marketplace_payout_identity_guard'
      and tg.tgattr::text <> ''
  ) then
    raise warning 'VIOLATION: payout identity guard is limited to a column list'; violations := violations + 1;
  end if;
  if not exists (
    select 1 from pg_trigger tg
    where tg.tgrelid = 'public.marketplace_product_variants'::regclass and tg.tgname = 'marketplace_product_variant_guard'
      and not tg.tgisinternal and tg.tgenabled = 'O'
      and (tg.tgtype & 2) = 2 and (tg.tgtype & 4) = 4 and (tg.tgtype & 16) = 16 and (tg.tgtype & 1) = 1
  ) then
    raise warning 'VIOLATION: variant guard trigger missing or disabled'; violations := violations + 1;
  end if;
  if not exists (
    select 1 from pg_trigger tg
    where tg.tgrelid = 'public.marketplace_vendors'::regclass and tg.tgname = 'marketplace_vendors_probation_enroll'
      and not tg.tgisinternal and tg.tgenabled = 'O'
      and (tg.tgtype & 2) = 0 and (tg.tgtype & 4) = 4 and (tg.tgtype & 1) = 1
  ) then
    raise warning 'VIOLATION: probation enrolment trigger missing or disabled'; violations := violations + 1;
  end if;

  -- 6b. no request role may add a trigger to, or truncate, a guarded table
  for r in
    select t.tbl, ro.rolname, pr.priv
      from (values ('public.marketplace_products'), ('public.marketplace_product_media'),
                   ('public.marketplace_product_variants'), ('public.marketplace_payout_requests'),
                   ('public.marketplace_vendors')) t(tbl)
     cross join (values ('anon'), ('authenticated'), ('service_role')) ro(rolname)
     cross join (values ('TRIGGER'), ('TRUNCATE')) pr(priv)
     where has_table_privilege(ro.rolname, t.tbl, pr.priv)
  loop
    raise warning 'VIOLATION: % holds % on %', r.rolname, r.priv, r.tbl; violations := violations + 1;
  end loop;

  -- 7. one active hide per listing
  if not exists (
    select 1 from pg_indexes
    where schemaname = 'public' and tablename = 'marketplace_listing_enforcement'
      and indexname = 'marketplace_listing_enforcement_one_active'
  ) then
    raise warning 'VIOLATION: one-active-hide unique index missing'; violations := violations + 1;
  end if;

  -- The ledger's outcome/source vocabularies are CHECK-constrained.
  if (select count(*) from pg_constraint
       where conrelid = 'public.marketplace_listing_gate_verdicts'::regclass and contype = 'c') < 3 then
    raise warning 'VIOLATION: verdict ledger CHECK constraints missing'; violations := violations + 1;
  end if;

  if violations > 0 then
    raise exception 'V3-MKT-TRUST-01 grant invariant FAILED: % violation(s)', violations;
  end if;
  raise notice 'V3-MKT-TRUST-01 grant invariant: OK';
end $$;
