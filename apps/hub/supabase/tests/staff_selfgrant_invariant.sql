-- V3-STAFF-SELFGRANT-FIX-01 invariant — run AFTER staff_selfgrant_min.sql and
-- 20260924120000_v3_staff_selfgrant_fix_01.sql. Every probe runs as a REAL Postgres
-- request role with Supabase-shaped JWT claims. Any failed expectation raises.
--
--   §0 structure       grant table locked; no request-role INSERT path; triggers present
--   §1 attacks         the exact exploit + every variant, full stack      => all fail
--   §2 W-mechanisms    each write-path mechanism ALONE stops the exploit
--   §3 layer R alone   ALL write guards removed => forged role still confers nothing
--   §4 layer W alone   read path reverted to trust profiles.role => write path still holds
--   §5 genuine paths   backfilled legacy staff/owner/manager/support, divisional staff,
--                      service-role provisioning, owner promotion, demotion, deletion,
--                      signup, customer self-edit, owner console — all still work
--   §6 owner_profiles  a viewer cannot promote itself; the owner still manages rows
--
-- Personas: see staff_selfgrant_min.sql (5e1f0000-…-0001 … -000b).

\set ON_ERROR_STOP 1

-- helpers ------------------------------------------------------------------------
create or replace function pg_temp.as_user(p_uid uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_uid, 'role', 'authenticated')::text, true);
  set local role authenticated;
end $$;

create or replace function pg_temp.as_anon() returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  set local role anon;
end $$;

create or replace function pg_temp.as_service(p_owner_uid uuid default null) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims',
    case when p_owner_uid is null then '{"role":"service_role"}'
         else json_build_object('sub', p_owner_uid, 'role', 'service_role')::text end, true);
  set local role service_role;
end $$;

-- every staff predicate for the CURRENT caller, as one row
create or replace function pg_temp.staff_signals()
returns table (care boolean, logistics boolean, jobs boolean, hub boolean, staff boolean,
               account boolean, security boolean, any_div boolean, app_role text,
               cur_role text, property boolean, platform boolean, verified text)
language sql as $$
  select public.is_staff_in('care'), public.is_staff_in('logistics'), public.is_staff_in('jobs'),
         public.is_staff_in('hub'), public.is_staff_in('staff'), public.is_staff_in('account'),
         public.is_staff_in('security'), public.is_staff_in_any(), public.current_app_role(),
         public."current_role"(), public.is_property_staff(), public.is_platform_staff(),
         public.verified_profile_role()
$$;

create or replace function pg_temp.assert_no_staff(p_label text) returns void language plpgsql as $$
declare s record;
begin
  select * into s from pg_temp.staff_signals();
  if s.care or s.logistics or s.jobs or s.hub or s.staff or s.account or s.security
     or s.any_div or s.property or s.platform
     or s.app_role in ('owner','manager','support','staff','rider')
     or coalesce(s.cur_role, 'customer') <> 'customer'
     or s.verified is not null then
    raise exception 'FAIL %: forged role conferred privilege: %', p_label, row_to_json(s);
  end if;
end $$;

grant execute on all functions in schema pg_temp to anon, authenticated, service_role;

-- ═══ §0 structure ════════════════════════════════════════════════════════════
do $s0$
begin
  if not (select relrowsecurity from pg_class where oid = 'public.staff_role_grants'::regclass) then
    raise exception 'FAIL §0: staff_role_grants RLS off';
  end if;
  if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'staff_role_grants') then
    raise exception 'FAIL §0: staff_role_grants must have NO policies';
  end if;
  if has_table_privilege('authenticated', 'public.staff_role_grants', 'select,insert,update,delete')
     or has_table_privilege('anon', 'public.staff_role_grants', 'select,insert,update,delete') then
    raise exception 'FAIL §0: a request role holds a privilege on staff_role_grants';
  end if;
  if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles'
             and cmd in ('INSERT', 'ALL')) then
    raise exception 'FAIL §0: a profiles INSERT/ALL policy exists';
  end if;
  if has_table_privilege('authenticated', 'public.profiles', 'insert')
     or has_table_privilege('anon', 'public.profiles', 'insert,update,delete') then
    raise exception 'FAIL §0: request-role INSERT (or anon write) on profiles';
  end if;
  if has_column_privilege('authenticated', 'public.profiles', 'role', 'update')
     or has_column_privilege('authenticated', 'public.profiles', 'wallet_balance_ngn', 'update')
     or has_column_privilege('authenticated', 'public.profiles', 'is_frozen', 'update')
     or has_column_privilege('authenticated', 'public.profiles', 'id', 'update') then
    raise exception 'FAIL §0: authenticated may UPDATE a sensitive profiles column';
  end if;
  if not has_column_privilege('authenticated', 'public.profiles', 'full_name', 'update') then
    raise exception 'FAIL §0: authenticated lost UPDATE(full_name)';
  end if;
  if (select count(*) from pg_trigger where tgrelid = 'public.profiles'::regclass and tgname in
      ('trg_profiles_block_self_grant', 'trg_profiles_mint_staff_grant', 'trg_profiles_require_staff_grant')
      and tgenabled <> 'D') <> 3 then
    raise exception 'FAIL §0: a profiles guard trigger is missing/disabled';
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_profiles_require_staff_grant'
                 and tgdeferrable and tginitdeferred) then
    raise exception 'FAIL §0: W4 is not DEFERRABLE INITIALLY DEFERRED';
  end if;
  -- No RLS policy anywhere may read profiles.role inline (it must go through the grant).
  if exists (select 1 from pg_policies
             where (coalesce(qual, '') || coalesce(with_check, '')) ~* 'from\s+(public\.)?profiles\M'
               and (coalesce(qual, '') || coalesce(with_check, '')) ~* 'role') then
    raise exception 'FAIL §0: a policy reads profiles.role inline: %', (
      select string_agg(schemaname || '.' || tablename || ':' || policyname, ', ') from pg_policies
      where (coalesce(qual, '') || coalesce(with_check, '')) ~* 'from\s+(public\.)?profiles\M'
        and (coalesce(qual, '') || coalesce(with_check, '')) ~* 'role');
  end if;
  if position('staff_role_grants' in pg_get_functiondef('public.is_staff_in(text,text)'::regprocedure)) = 0
     or position('staff_role_grants' in pg_get_functiondef('public.is_staff_in_any()'::regprocedure)) = 0 then
    raise exception 'FAIL §0: is_staff_in/_any do not require the grant';
  end if;
  raise notice '§0 structure OK';
end $s0$;

-- ═══ §1 attacks, full stack ═════════════════════════════════════════════════
do $s1$
declare
  a  constant uuid := '5e1f0000-0000-4000-8000-000000000006';  -- attacker, no row
  v  constant uuid := '5e1f0000-0000-4000-8000-000000000007';  -- victim, no row
  c  constant uuid := '5e1f0000-0000-4000-8000-000000000005';  -- customer with a row
  r  text;
  n  int;
begin
  -- A1/A2: THE exploit, role staff / owner / manager / support / rider
  foreach r in array array['staff', 'owner', 'manager', 'support', 'rider'] loop
    begin
      perform pg_temp.as_user(a);
      insert into public.profiles (id, role) values (a, r);
      raise exception 'FAIL A1: self-insert role=% succeeded', r;
    exception when insufficient_privilege then null;
    end;
  end loop;
  -- A3: even a "customer" self-insert has no request-role path (default-deny)
  begin
    perform pg_temp.as_user(a);
    insert into public.profiles (id, role) values (a, 'customer');
    raise exception 'FAIL A3: request-role insert succeeded';
  exception when insufficient_privilege then null;
  end;
  -- A4: caller-supplied id (someone else's) instead of auth.uid()
  begin
    perform pg_temp.as_user(a);
    insert into public.profiles (id, role) values (v, 'staff');
    raise exception 'FAIL A4: cross-id insert succeeded';
  exception when insufficient_privilege then null;
  end;
  -- A5: upsert (INSERT … ON CONFLICT DO UPDATE) on a row that exists (customer c)
  begin
    perform pg_temp.as_user(c);
    insert into public.profiles (id, role) values (c, 'staff')
      on conflict (id) do update set role = excluded.role;
    raise exception 'FAIL A5: upsert role escalation succeeded';
  exception when insufficient_privilege then null;
  end;
  -- A6: UPDATE own role / wallet / freeze / id
  begin
    perform pg_temp.as_user(c);
    update public.profiles set role = 'staff' where id = c;
    raise exception 'FAIL A6a: self role update succeeded';
  exception when insufficient_privilege then null;
  end;
  begin
    perform pg_temp.as_user(c);
    update public.profiles set wallet_balance_ngn = 999999999 where id = c;
    raise exception 'FAIL A6b: self wallet_balance_ngn update succeeded';
  exception when insufficient_privilege then null;
  end;
  begin
    perform pg_temp.as_user(c);
    update public.profiles set id = v where id = c;
    raise exception 'FAIL A6c: self id rebind succeeded';
  exception when insufficient_privilege then null;
  end;
  -- A7: anon
  begin
    perform pg_temp.as_anon();
    insert into public.profiles (id, role) values (a, 'staff');
    raise exception 'FAIL A7: anon insert succeeded';
  exception when insufficient_privilege then null;
  end;
  -- A8: forge the evidence directly
  begin
    perform pg_temp.as_user(a);
    insert into public.staff_role_grants (user_id, role, source) values (a, 'staff', 'forged');
    raise exception 'FAIL A8: direct grant insert succeeded';
  exception when insufficient_privilege then null;
  end;
  begin
    perform pg_temp.as_user(c);
    update public.staff_role_grants set revoked_at = null;
    raise exception 'FAIL A8b: direct grant update succeeded';
  exception when insufficient_privilege then null;
  end;
  -- A9: the service-role-only admin RPC is not callable by a request role
  begin
    perform pg_temp.as_user(c);
    perform public.admin_set_profile_role(c, 'staff');
    raise exception 'FAIL A9: admin_set_profile_role callable by authenticated';
  exception when insufficient_privilege then null;
  end;
  -- after all of it: attacker + customer confer nothing, no row was created
  perform pg_temp.as_user(a);
  perform pg_temp.assert_no_staff('§1 attacker');
  reset role;
  perform pg_temp.as_user(c);
  perform pg_temp.assert_no_staff('§1 customer');
  reset role;
  select count(*) into n from public.profiles where id in (a, v);
  if n <> 0 then raise exception 'FAIL §1: attacker/victim rows exist (%)', n; end if;
  select count(*) into n from public.staff_role_grants where user_id in (a, v, c);
  if n <> 0 then raise exception 'FAIL §1: a grant exists for attacker/victim/customer'; end if;
  raise notice '§1 attacks (A1-A9) all rejected OK';
end $s1$;

-- ═══ §2 each write mechanism ALONE ═══════════════════════════════════════════
-- Strip the OTHER mechanisms (as the platform), attack, roll everything back.
do $s2$
declare
  a constant uuid := '5e1f0000-0000-4000-8000-000000000006';
  mech text;
  blocked boolean;
begin
  foreach mech in array array['W1_privileges', 'W2_rls', 'W3_before_trigger', 'W4_deferred_constraint'] loop
    blocked := false;
    begin
      -- open everything except `mech`
      if mech <> 'W1_privileges' then
        grant insert on table public.profiles to authenticated;
      end if;
      if mech <> 'W2_rls' then
        create policy sg_test_open_insert on public.profiles for insert to authenticated with check (true);
      end if;
      if mech <> 'W3_before_trigger' then
        alter table public.profiles disable trigger trg_profiles_block_self_grant;
      end if;
      if mech <> 'W4_deferred_constraint' then
        alter table public.profiles disable trigger trg_profiles_require_staff_grant;
      end if;
      begin
        perform pg_temp.as_user(a);
        insert into public.profiles (id, role) values (a, 'staff');
        set constraints all immediate;   -- make W4 fire now, not at COMMIT
        reset role;
      exception when insufficient_privilege then
        blocked := true;
      end;
      reset role;
      raise exception using errcode = 'P0SG2', message = 'rollback';
    exception when sqlstate 'P0SG2' then null;
    end;
    if not blocked then
      raise exception 'FAIL §2: % alone did NOT stop the self-grant', mech;
    end if;
    raise notice '§2 % alone blocks the exploit OK', mech;
  end loop;
end $s2$;

-- ═══ §2b W3 alone guards EVERY non-cosmetic column (round-1 F2) ═════════════
do $s2b$
declare
  c constant uuid := '5e1f0000-0000-4000-8000-000000000005';
  col text;
  blocked boolean;
begin
  foreach col in array array['is_active = false', 'deleted_at = now()', 'archived_at = now()',
      'legal_hold_reason = ''x''', 'retention_hold_until = now()', 'force_signout_at = now()',
      'disabled_reason = ''x''', 'is_frozen = true', 'force_reauth_after = now()',
      'created_at = ''2000-01-01''', 'wallet_balance_ngn = 999'] loop
    blocked := false;
    begin
      grant update on table public.profiles to authenticated;          -- W1 regressed
      alter table public.profiles disable trigger trg_profiles_protect_sensitive_fields;
      begin
        perform pg_temp.as_user(c);
        execute format('update public.profiles set %s where id = %L', col, c);
      exception when insufficient_privilege then blocked := true;
      end;
      reset role;
      raise exception using errcode = 'P0SG5', message = 'rollback';
    exception when sqlstate 'P0SG5' then null;
    end;
    if not blocked then raise exception 'FAIL §2b: W3 let a request role set %', col; end if;
  end loop;
  raise notice '§2b W3 alone blocks every non-cosmetic self-edit OK';
end $s2b$;

-- ═══ §3 LAYER R alone (every write guard removed) ═══════════════════════════
do $s3$
declare
  a constant uuid := '5e1f0000-0000-4000-8000-000000000006';
  r text;
begin
  foreach r in array array['staff', 'owner', 'manager', 'support'] loop
    begin
      grant insert, update on table public.profiles to authenticated;
      create policy sg_test_open_insert on public.profiles for insert to authenticated with check (true);
      alter table public.profiles disable trigger trg_profiles_block_self_grant;
      alter table public.profiles disable trigger trg_profiles_require_staff_grant;
      alter table public.profiles disable trigger trg_profiles_protect_sensitive_fields;

      perform pg_temp.as_user(a);
      insert into public.profiles (id, role) values (a, r);      -- the write now SUCCEEDS
      perform pg_temp.assert_no_staff('§3 layer-R-only role=' || r);
      reset role;

      -- laundering attempt: a trusted writer later touches the row WITHOUT setting role
      -- (learn's admin upsert of full_name/phone) — must not mint a grant.
      perform pg_temp.as_service();
      insert into public.profiles (id, role, full_name) values (a, r, 'x')
        on conflict (id) do update set full_name = excluded.full_name;
      update public.profiles set phone = '000' where id = a;
      reset role;
      if exists (select 1 from public.staff_role_grants where user_id = a) then
        raise exception 'FAIL §3: trusted non-role write laundered a grant for role=%', r;
      end if;
      perform pg_temp.as_user(a);
      perform pg_temp.assert_no_staff('§3 after laundering role=' || r);
      reset role;
      raise exception using errcode = 'P0SG3', message = 'rollback';
    exception when sqlstate 'P0SG3' then null;
    end;
  end loop;
  raise notice '§3 layer R alone: forged staff/owner/manager/support confer nothing OK';
end $s3$;

-- ═══ §4 LAYER W alone (read path reverted to trust bare profiles.role) ═══════
do $s4$
declare
  a constant uuid := '5e1f0000-0000-4000-8000-000000000006';
  blocked boolean := false;
begin
  begin
    create or replace function public.is_staff_in(division_key text, role_key text default null)
    returns boolean language sql stable security definer set search_path = public as $b$
      select exists (select 1 from public.profiles where id = auth.uid()
                     and lower(role) in ('owner','admin','superadmin','staff'))
    $b$;
    begin
      perform pg_temp.as_user(a);
      insert into public.profiles (id, role) values (a, 'staff');
      set constraints all immediate;
    exception when insufficient_privilege then blocked := true;
    end;
    reset role;
    perform pg_temp.as_user(a);
    if public.is_staff_in('care') then
      raise exception 'FAIL §4: with layer R reverted, the write path let the exploit through';
    end if;
    reset role;
    raise exception using errcode = 'P0SG4', message = 'rollback';
  exception when sqlstate 'P0SG4' then null;
  end;
  if not blocked then raise exception 'FAIL §4: write not rejected'; end if;
  raise notice '§4 layer W alone holds OK';
end $s4$;

-- ═══ §5 genuine paths ═══════════════════════════════════════════════════════
do $s5$
declare
  staff_u  constant uuid := '5e1f0000-0000-4000-8000-000000000001';
  owner_u  constant uuid := '5e1f0000-0000-4000-8000-000000000002';
  mgr_u    constant uuid := '5e1f0000-0000-4000-8000-000000000003';
  sup_u    constant uuid := '5e1f0000-0000-4000-8000-000000000004';
  cust_u   constant uuid := '5e1f0000-0000-4000-8000-000000000005';
  mkt_u    constant uuid := '5e1f0000-0000-4000-8000-000000000009';
  new_u    constant uuid := '5e1f0000-0000-4000-8000-00000000000a';
  prom_u   constant uuid := '5e1f0000-0000-4000-8000-00000000000b';
  signup_u constant uuid := '5e1f0000-0000-4000-8000-00000000000c';
  s record;
begin
  -- G1 backfilled legacy staff: all six legacy divisions
  perform pg_temp.as_user(staff_u);
  select * into s from pg_temp.staff_signals();
  if not (s.care and s.logistics and s.jobs and s.hub and s.staff and s.account and s.any_div)
     or s.security or s.cur_role <> 'staff' or s.verified <> 'staff' then
    raise exception 'FAIL G1 legacy staff: %', row_to_json(s);
  end if;
  reset role;

  -- G2 backfilled owner: everything incl. security + platform
  perform pg_temp.as_user(owner_u);
  select * into s from pg_temp.staff_signals();
  if not (s.care and s.logistics and s.jobs and s.hub and s.staff and s.account and s.security
          and s.any_div and s.platform and s.property) or s.app_role <> 'owner' or s.cur_role <> 'owner' then
    raise exception 'FAIL G2 owner: %', row_to_json(s);
  end if;
  if not public.is_owner() then raise exception 'FAIL G2: is_owner() false'; end if;
  reset role;

  -- G3 manager / support: current_app_role / current_role / is_property_staff consumers
  perform pg_temp.as_user(mgr_u);
  select * into s from pg_temp.staff_signals();
  if s.app_role <> 'manager' or s.cur_role <> 'manager' or not s.property or not s.any_div then
    raise exception 'FAIL G3 manager: %', row_to_json(s);
  end if;
  reset role;
  perform pg_temp.as_user(sup_u);
  select * into s from pg_temp.staff_signals();
  if s.app_role <> 'support' or not s.property or not s.any_div then
    raise exception 'FAIL G3 support: %', row_to_json(s);
  end if;
  reset role;

  -- G4 divisional (membership-table) staff unaffected
  perform pg_temp.as_user(mkt_u);
  if not public.is_staff_in('marketplace') or not public.is_staff_in_any() then
    raise exception 'FAIL G4: marketplace membership staff lost access';
  end if;
  reset role;

  -- G4b a self-served vendor application is NOT marketplace staff (round-1 app finding 1)
  perform pg_temp.as_user('5e1f0000-0000-4000-8000-00000000000d');
  if public.is_staff_in('marketplace') or public.is_staff_in_any() then
    raise exception 'FAIL G4b: vendor_applicant membership reads as staff';
  end if;
  reset role;

  -- G5 customer: reads own row, edits cosmetic fields, is not staff
  perform pg_temp.as_user(cust_u);
  update public.profiles set full_name = 'Renamed Customer', phone = '+2340000' where id = cust_u;
  if (select full_name from public.profiles where id = cust_u) <> 'Renamed Customer' then
    raise exception 'FAIL G5: customer self-edit did not apply';
  end if;
  perform pg_temp.assert_no_staff('G5 customer');
  reset role;

  -- G6 service-role provisioning of a brand-new staff member (care syncStaffIdentity INSERT)
  perform pg_temp.as_service();
  insert into public.profiles (id, role, full_name) values (new_u, 'staff', 'New Staff');
  set constraints all immediate;
  reset role;
  if not exists (select 1 from public.staff_role_grants where user_id = new_u and role = 'staff'
                 and revoked_at is null and granted_by_role = 'service_role') then
    raise exception 'FAIL G6: service-role provisioning did not mint a grant';
  end if;
  perform pg_temp.as_user(new_u);
  select * into s from pg_temp.staff_signals();
  if not (s.care and s.logistics and s.jobs and s.hub and s.staff and s.account) then
    raise exception 'FAIL G6: provisioned staff not staff: %', row_to_json(s);
  end if;
  reset role;

  -- G7 owner promotion through the owner-gated SECURITY DEFINER RPC (server-side owner
  --    action: service_role key + the owner's claims)
  perform pg_temp.as_service(owner_u);
  perform public.admin_set_profile_role(prom_u, 'manager');
  set constraints all immediate;
  reset role;
  perform pg_temp.as_user(prom_u);
  if public.current_app_role() <> 'manager' or not public.is_property_staff() then
    raise exception 'FAIL G7: owner promotion did not take effect';
  end if;
  reset role;

  -- G8 demotion by the platform (SQL editor) revokes the evidence
  alter table public.profiles disable trigger trg_profiles_protect_sensitive_fields;
  update public.profiles set role = 'customer' where id = prom_u;
  alter table public.profiles enable trigger trg_profiles_protect_sensitive_fields;
  if exists (select 1 from public.staff_role_grants where user_id = prom_u and revoked_at is null) then
    raise exception 'FAIL G8: demotion left an active grant';
  end if;
  perform pg_temp.as_user(prom_u);
  perform pg_temp.assert_no_staff('G8 demoted');
  reset role;

  -- G9 staff deletion by the service role (care owner "delete staff") revokes the evidence
  perform pg_temp.as_service();
  delete from public.profiles where id = new_u;
  reset role;
  if exists (select 1 from public.staff_role_grants where user_id = new_u and revoked_at is null) then
    raise exception 'FAIL G9: deleted profile kept an active grant';
  end if;

  -- G10 signup trigger still creates a customer row (no grant, no error)
  insert into auth.users (id, email, raw_user_meta_data)
  values (signup_u, 'signup@sg.test', '{"full_name":"New Signup","role":"owner"}')
  on conflict (id) do nothing;
  set constraints all immediate;
  if coalesce((select role from public.profiles where id = signup_u), '') <> 'customer' then
    raise exception 'FAIL G10: signup did not create a customer profile';
  end if;
  if exists (select 1 from public.staff_role_grants where user_id = signup_u) then
    raise exception 'FAIL G10: signup minted a grant';
  end if;

  -- G11 legacy staff keeps self-service cosmetic edits (grant untouched)
  perform pg_temp.as_user(staff_u);
  update public.profiles set full_name = 'Legacy Staff Renamed' where id = staff_u;
  set constraints all immediate;
  if not public.is_staff_in('care') then raise exception 'FAIL G11: staff self-edit broke access'; end if;
  reset role;

  raise notice '§5 genuine paths G1-G11 OK';
end $s5$;

-- ═══ §6 owner_profiles ══════════════════════════════════════════════════════
do $s6$
declare
  owner_u  constant uuid := '5e1f0000-0000-4000-8000-000000000002';
  viewer_u constant uuid := '5e1f0000-0000-4000-8000-000000000008';
begin
  begin
    perform pg_temp.as_user(viewer_u);
    update public.owner_profiles set role = 'owner' where user_id = viewer_u;
    raise exception 'FAIL O1: owner_profiles viewer self-promoted';
  exception when insufficient_privilege then null;
  end;
  reset role;
  begin
    perform pg_temp.as_user(viewer_u);
    update public.owner_profiles set email = 'legacy.owner+x@sg.test' where user_id = viewer_u;
    raise exception 'FAIL O1b: owner_profiles viewer changed its email';
  exception when insufficient_privilege then null;
  end;
  reset role;
  perform pg_temp.as_user(viewer_u);
  if public.is_owner() then raise exception 'FAIL O1: viewer is owner'; end if;
  perform pg_temp.assert_no_staff('O1 viewer');
  update public.owner_profiles set full_name = 'Viewer Renamed' where user_id = viewer_u;  -- cosmetic OK
  reset role;
  -- the real owner still edits console rows from a session (cosmetic columns) …
  perform pg_temp.as_user(owner_u);
  update public.owner_profiles set full_name = 'Owner Renamed' where user_id = owner_u;
  update public.owner_profiles set full_name = 'Viewer Renamed By Owner' where user_id = viewer_u;
  reset role;
  if (select full_name from public.owner_profiles where user_id = viewer_u) <> 'Viewer Renamed By Owner' then
    raise exception 'FAIL O2: owner could not edit owner_profiles';
  end if;
  -- … and changes console roles the way the app does: through the service role
  -- (role / is_active are service-role-only, as in hub_security_hardening HUB-2).
  perform pg_temp.as_service();
  update public.owner_profiles set role = 'editor' where user_id = viewer_u;
  reset role;
  if (select role from public.owner_profiles where user_id = viewer_u) <> 'editor' then
    raise exception 'FAIL O2: service-role owner-console role change failed';
  end if;
  raise notice '§6 owner_profiles OK';
end $s6$;

select 'V3-STAFF-SELFGRANT-FIX-01 invariant: ALL SECTIONS PASSED' as result;
