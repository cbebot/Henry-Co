-- V3-35 DEALS — RLS behavioural proof (runtime, not just grant metadata).
--
-- Run AFTER deals_min.sql + the V3-35 migration on a fresh DB. Proves the
-- deal-model visibility wall as the actual `authenticated`/`anon` roles:
--   1. anon sees ONLY live public/targeted deals — never drafts, never
--      pending_review, never unlisted, never out-of-window rows
--   2. an authenticated NON-creator sees the same live set and ZERO of
--      another user's drafts (no cross-user read)
--   3. the creator reads their own rows in every status
--   4. authenticated cannot UPDATE any deal (no write grant at all)
--   5. authenticated cannot INSERT a deal
--   6. anon is denied SELECT on deal_impressions (no grant)
--   7. a non-staff authenticated user reads ZERO impression rows (staff-only
--      policy; is_staff_in_any() is the fail-closed stub on CI)
--   8. authenticated cannot INSERT an impression (service-role only)
--   9. the curation reconciliation moved both seeded rows (live -> active
--      spotlight, retired -> expired) — ONE deal model
-- Any failure RAISES -> psql (ON_ERROR_STOP=1) exits non-zero -> CI RED.

-- Test-only: make auth.uid() readable from a GUC so we can simulate a signed-in user.
create or replace function auth.uid() returns uuid language sql stable
  as $$ select nullif(current_setting('test.uid', true), '')::uuid $$;

-- Fixture users (superuser insert bypasses RLS).
insert into auth.users (id, email) values
  ('da000000-0000-0000-0000-000000000001', 'deal-creator@test.local'),
  ('db000000-0000-0000-0000-000000000002', 'deal-stranger@test.local')
  on conflict (id) do nothing;

-- Fixture deals: only d2 (public) and d6 (targeted) are live-visible.
insert into public.deals
  (id, created_by, source, title, deal_type, discount_percent, scope_division,
   starts_at, ends_at, status, visibility)
values
  ('dd000000-0000-0000-0000-000000000001', 'da000000-0000-0000-0000-000000000001',
   'platform', 'Draft offer', 'percent_off', 10, 'marketplace',
   now() - interval '1 day', now() + interval '7 days', 'draft', 'public'),
  ('dd000000-0000-0000-0000-000000000002', 'da000000-0000-0000-0000-000000000001',
   'platform', 'Live public offer', 'percent_off', 15, 'marketplace',
   now() - interval '1 day', now() + interval '7 days', 'active', 'public'),
  ('dd000000-0000-0000-0000-000000000003', 'da000000-0000-0000-0000-000000000001',
   'platform', 'Live unlisted offer', 'percent_off', 15, 'care',
   now() - interval '1 day', now() + interval '7 days', 'active', 'unlisted'),
  ('dd000000-0000-0000-0000-000000000004', 'da000000-0000-0000-0000-000000000001',
   'platform', 'Window-expired offer', 'percent_off', 15, 'learn',
   now() - interval '10 days', now() - interval '2 days', 'active', 'public'),
  ('dd000000-0000-0000-0000-000000000005', 'da000000-0000-0000-0000-000000000001',
   'platform', 'Pending offer', 'percent_off', 40, 'jobs',
   now() - interval '1 day', now() + interval '7 days', 'pending_review', 'public'),
  ('dd000000-0000-0000-0000-000000000006', 'da000000-0000-0000-0000-000000000001',
   'platform', 'Live targeted offer', 'percent_off', 15, 'logistics',
   now() - interval '1 day', now() + interval '7 days', 'active', 'targeted')
  on conflict (id) do nothing;

-- One impression row (service-role-shaped write, done as superuser).
insert into public.deal_impressions (deal_id, user_id, surface)
values ('dd000000-0000-0000-0000-000000000002',
        'da000000-0000-0000-0000-000000000001', 'all_deals');

do $$
declare
  violations int := 0;
  v_count int;
begin
  -- (1) anon sees only the live public/targeted fixtures (d2 + d6).
  set local role anon;
  select count(*) into v_count from public.deals
    where id::text like 'dd000000-%';
  reset role;
  if v_count <> 2 then
    raise warning 'SECURITY FAIL: anon sees % fixture deals (expected 2 live)', v_count;
    violations := violations + 1;
  else raise notice 'OK: anon sees only the 2 live deals'; end if;

  -- (2) authenticated non-creator: same live set; zero of A''s drafts.
  perform set_config('test.uid', 'db000000-0000-0000-0000-000000000002', true);
  set local role authenticated;
  select count(*) into v_count from public.deals
    where id::text like 'dd000000-%';
  reset role;
  if v_count <> 2 then
    raise warning 'SECURITY FAIL: stranger sees % fixture deals (expected 2 live)', v_count;
    violations := violations + 1;
  else raise notice 'OK: stranger sees only the 2 live deals (no drafts/unlisted)'; end if;

  -- (3) creator reads own rows in every status.
  perform set_config('test.uid', 'da000000-0000-0000-0000-000000000001', true);
  set local role authenticated;
  select count(*) into v_count from public.deals
    where id::text like 'dd000000-%';
  reset role;
  if v_count <> 6 then
    raise warning 'FAIL: creator expected 6 own fixture deals, saw %', v_count;
    violations := violations + 1;
  else raise notice 'OK: creator reads all 6 own rows'; end if;

  -- (4) authenticated cannot UPDATE any deal (no grant).
  perform set_config('test.uid', 'db000000-0000-0000-0000-000000000002', true);
  set local role authenticated;
  begin
    update public.deals set title = 'hijack'
      where id = 'dd000000-0000-0000-0000-000000000001';
    raise warning 'SECURITY FAIL: authenticated UPDATEd a deal';
    violations := violations + 1;
  exception when insufficient_privilege then
    raise notice 'OK: authenticated UPDATE on deals denied (no grant)';
  end;
  reset role;

  -- (5) authenticated cannot INSERT a deal.
  perform set_config('test.uid', 'db000000-0000-0000-0000-000000000002', true);
  set local role authenticated;
  begin
    insert into public.deals (created_by, title, deal_type, discount_percent, starts_at, ends_at)
      values ('db000000-0000-0000-0000-000000000002', 'forged', 'percent_off', 5,
              now(), now() + interval '1 day');
    raise warning 'SECURITY FAIL: authenticated INSERTed a deal';
    violations := violations + 1;
  exception when insufficient_privilege then
    raise notice 'OK: authenticated INSERT on deals denied (no grant)';
  end;
  reset role;

  -- (6) anon denied SELECT on deal_impressions (no grant).
  set local role anon;
  begin
    perform 1 from public.deal_impressions limit 1;
    raise warning 'SECURITY FAIL: anon can SELECT deal_impressions';
    violations := violations + 1;
  exception when insufficient_privilege then
    raise notice 'OK: anon denied SELECT on deal_impressions';
  end;
  reset role;

  -- (7) non-staff authenticated reads ZERO impression rows.
  perform set_config('test.uid', 'db000000-0000-0000-0000-000000000002', true);
  set local role authenticated;
  select count(*) into v_count from public.deal_impressions;
  reset role;
  if v_count <> 0 then
    raise warning 'SECURITY FAIL: non-staff user read % impression rows', v_count;
    violations := violations + 1;
  else raise notice 'OK: non-staff user reads 0 impression rows'; end if;

  -- (8) authenticated cannot INSERT an impression.
  perform set_config('test.uid', 'db000000-0000-0000-0000-000000000002', true);
  set local role authenticated;
  begin
    insert into public.deal_impressions (deal_id, user_id, surface)
      values ('dd000000-0000-0000-0000-000000000002',
              'db000000-0000-0000-0000-000000000002', 'all_deals');
    raise warning 'SECURITY FAIL: authenticated INSERTed an impression';
    violations := violations + 1;
  exception when insufficient_privilege then
    raise notice 'OK: authenticated INSERT on deal_impressions denied';
  end;
  reset role;

  -- (9) curation reconciliation: both seeded rows migrated, one deal model.
  select count(*) into v_count from public.deals
    where source = 'curation_migration';
  if v_count <> 2 then
    raise warning 'FAIL: expected 2 migrated curation rows, saw %', v_count;
    violations := violations + 1;
  else raise notice 'OK: both curation rows migrated into deals'; end if;

  select count(*) into v_count from public.deals
    where source = 'curation_migration' and status = 'active'
      and deal_type = 'spotlight' and target_ref = 'test-live-pick'
      and scope_division = 'marketplace';
  if v_count <> 1 then
    raise warning 'FAIL: live curation row did not migrate as an active spotlight';
    violations := violations + 1;
  else raise notice 'OK: live curation row -> active marketplace spotlight'; end if;

  select count(*) into v_count from public.deals
    where source = 'curation_migration' and status = 'expired'
      and target_ref = 'test-retired-pick';
  if v_count <> 1 then
    raise warning 'FAIL: retired curation row did not migrate as expired';
    violations := violations + 1;
  else raise notice 'OK: retired curation row -> expired'; end if;

  if violations > 0 then
    raise exception 'V3-35 deals RLS behavioural proof FAILED: % violation(s)', violations;
  end if;
  raise notice 'V3-35 deals RLS behavioural proof: OK';
end $$;
