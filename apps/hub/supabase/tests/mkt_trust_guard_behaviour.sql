-- V3-MKT-TRUST-01 — the publish guard, proven at runtime as real Postgres roles.
--
-- Run AFTER mkt_trust_min.sql + 20261002120000_v3_mkt_trust_01_instant_publish.sql.
-- Each block is an attack or a legitimate flow. A wrong outcome is a VIOLATION; any
-- violation RAISES at the end -> psql (ON_ERROR_STOP=1) exits non-zero -> CI RED.
--
--   A. live write with no verdict            (service_role INSERT / UPDATE)
--   B. request role with RLS opened          (authenticated, even naming a staff reviewer)
--   C. the staff branch and its limits       (non-staff, stale stamp, content moved)
--   D. forging the ledger                    (direct insert; RPC from request roles)
--   E. IDOR                                  (verdict for another seller's store / slug)
--   F. the engine path                       (verdict -> publish -> consumed once; replay; expiry)
--   G. clean -> prohibited edit              (live content change needs its own verdict)
--   H. the upsert path                       (INSERT ... ON CONFLICT DO UPDATE)
--   I. media                                 (uncovered image on a live listing)
--   J. probation caps                        (price, live count, daily count)
--   K. hides                                 (auto-hide, engine cannot lift, staff restores / upholds)
--   L. company catalogue                     (seed allowed; a seller cannot pose as it)
--   M. payout identity                       (self-set status is not identity)
--   N. instant onboarding                    (actor binding, idempotence, probation row)
--   O. duplicate images                      (identical bytes / near match, across sellers)
--   P. re-scan candidates                    (who is offered, origin, limit)
--   Q. adversarial round 1                   (id change, variants, a later trigger, multi-row cap,
--                                             every new store on probation, a prior human decision, payouts)
--   R. adversarial round 2                   (store ownership, identity waivers, payout status spellings,
--                                             a person's rejection binds the engine, holds by handle,
--                                             moved pictures, screened-profile hash, reporter age)
--   S. adversarial round 3                   (a revoked approval, pictures of held listings, handles of
--                                             held listings, company stores, live references, a listing's
--                                             store, profile field separation, a deleted owner)

-- Run far from UTC ON PURPOSE. Every clock comparison in the guard must hold for
-- a true instant whatever the session's TimeZone is: the staff branch compares a
-- caller-supplied `reviewed_at` (an ISO instant from the app) with the database
-- clock. A comparison written against a UTC wall-clock value passes in UTC and
-- silently fails everywhere else — this setting is what catches that.
set timezone to 'Pacific/Kiritimati';

-- Fixtures are removed first so the file can be re-run.
delete from public.marketplace_listing_enforcement where vendor_id in (
  select id from public.marketplace_vendors where slug like 'mkt-trust-t-%');
delete from public.marketplace_listing_gate_verdicts where slug like 'mkt-trust-t-%';
delete from public.marketplace_image_fingerprints where ref like 'media://public/marketplace-images/mkt-trust-t/%';
delete from public.marketplace_payout_requests where reference like 'MKT-TRUST-T-%';
delete from public.marketplace_products where slug like 'mkt-trust-t-%';
delete from public.marketplace_role_memberships where user_id in (
  'a1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000002',
  'a1000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000004',
  'a1000000-0000-4000-8000-000000000005', 'a1000000-0000-4000-8000-000000000006',
  'a1000000-0000-4000-8000-00000000000a', 'a1000000-0000-4000-8000-00000000000b',
  'a1000000-0000-4000-8000-00000000000c', 'a1000000-0000-4000-8000-00000000000d',
  'a1000000-0000-4000-8000-00000000000e', 'a1000000-0000-4000-8000-00000000000f',
  'a1000000-0000-4000-8000-000000000010');
delete from public.marketplace_role_memberships where normalized_email like '%@mkt-trust.test';
drop trigger if exists zz_mkt_trust_t_rewrite on public.marketplace_products;
drop function if exists public.mkt_trust_t_rewrite();
delete from public.marketplace_vendor_applications where proposed_store_slug like 'mkt-trust-t-%';
delete from public.marketplace_seller_revocations where owner_user_id::text like 'a1000000-0000-4000-8000-%';
delete from public.marketplace_vendors where slug like 'mkt-trust-t-%';
delete from public.customer_verification_submissions where user_id in (
  'a1000000-0000-4000-8000-000000000005', 'a1000000-0000-4000-8000-000000000006');

insert into auth.users (id, email) values
  ('a1000000-0000-4000-8000-000000000001', 'seller-a@mkt-trust.test'),
  ('a1000000-0000-4000-8000-000000000002', 'seller-b@mkt-trust.test'),
  ('a1000000-0000-4000-8000-000000000003', 'staff@mkt-trust.test'),
  ('a1000000-0000-4000-8000-000000000004', 'outsider@mkt-trust.test'),
  ('a1000000-0000-4000-8000-000000000005', 'instant@mkt-trust.test'),
  ('a1000000-0000-4000-8000-000000000006', 'instant-two@mkt-trust.test'),
  ('a1000000-0000-4000-8000-000000000007', 'seed-staff@mkt-trust.test'),
  ('a1000000-0000-4000-8000-000000000008', 'seed-unverified@mkt-trust.test'),
  ('a1000000-0000-4000-8000-000000000009', 'collide@mkt-trust.test'),
  ('a1000000-0000-4000-8000-00000000000a', 'q-instant@mkt-trust.test'),
  ('a1000000-0000-4000-8000-00000000000b', 'q-nodocs@mkt-trust.test'),
  ('a1000000-0000-4000-8000-00000000000c', 'q-withdocs@mkt-trust.test'),
  ('a1000000-0000-4000-8000-00000000000d', 'q-rejected@mkt-trust.test')
  on conflict (id) do nothing;
-- Whose mailbox is verified: the seeded staff member and the "collider"; not 0008.
update auth.users set email_confirmed_at = now()
 where id in ('a1000000-0000-4000-8000-000000000007', 'a1000000-0000-4000-8000-000000000009');
update auth.users set email_confirmed_at = null where id = 'a1000000-0000-4000-8000-000000000008';

insert into public.customer_profiles (id, email) values
  ('a1000000-0000-4000-8000-000000000001', 'seller-a@mkt-trust.test'),
  ('a1000000-0000-4000-8000-000000000002', 'seller-b@mkt-trust.test'),
  ('a1000000-0000-4000-8000-000000000003', 'staff@mkt-trust.test'),
  ('a1000000-0000-4000-8000-000000000004', 'outsider@mkt-trust.test'),
  ('a1000000-0000-4000-8000-000000000005', 'instant@mkt-trust.test'),
  ('a1000000-0000-4000-8000-000000000006', 'instant-two@mkt-trust.test')
  on conflict (id) do nothing;
update public.customer_profiles set verification_status = 'none'
 where id in ('a1000000-0000-4000-8000-000000000005', 'a1000000-0000-4000-8000-000000000006');

insert into public.marketplace_vendors (id, slug, name, owner_user_id, owner_type, status, seller_tier) values
  ('b1000000-0000-4000-8000-00000000000a', 'mkt-trust-t-store-a', 'Store A', 'a1000000-0000-4000-8000-000000000001', 'vendor', 'approved', 'partner'),
  ('b1000000-0000-4000-8000-00000000000b', 'mkt-trust-t-store-b', 'Store B', 'a1000000-0000-4000-8000-000000000002', 'vendor', 'approved', 'partner'),
  ('b1000000-0000-4000-8000-00000000000c', 'mkt-trust-t-company', 'Company Store', null, 'company', 'approved', 'partner');

-- Store A and Store B stand for stores that EXISTED BEFORE the gate was installed:
-- no probation, and the identity waiver the migration gives such stores once. (A
-- store created after the gate — every other store in this file — gets neither.)
delete from public.marketplace_seller_probation
 where vendor_id in ('b1000000-0000-4000-8000-00000000000a', 'b1000000-0000-4000-8000-00000000000b');
insert into public.marketplace_seller_identity_waivers (vendor_id, owner_user_id) values
  ('b1000000-0000-4000-8000-00000000000a', 'a1000000-0000-4000-8000-000000000001'),
  ('b1000000-0000-4000-8000-00000000000b', 'a1000000-0000-4000-8000-000000000002');

insert into public.marketplace_role_memberships (user_id, normalized_email, scope_type, scope_id, role, is_active) values
  ('a1000000-0000-4000-8000-000000000001', 'seller-a@mkt-trust.test', 'vendor', 'b1000000-0000-4000-8000-00000000000a', 'vendor', true),
  ('a1000000-0000-4000-8000-000000000002', 'seller-b@mkt-trust.test', 'vendor', 'b1000000-0000-4000-8000-00000000000b', 'vendor', true),
  ('a1000000-0000-4000-8000-000000000003', 'staff@mkt-trust.test', 'platform', null, 'moderation', true);
-- Unclaimed staff SEEDS (user_id null): how staff rows commonly exist. One for a
-- verified mailbox, one for an unverified one.
insert into public.marketplace_role_memberships (user_id, normalized_email, scope_type, scope_id, role, is_active) values
  (null, 'seed-staff@mkt-trust.test', 'platform', null, 'marketplace_admin', true),
  (null, 'seed-unverified@mkt-trust.test', 'platform', null, 'moderation', true),
  -- BOUND to the staff member, but carrying the collider's email: must never grant to the collider.
  ('a1000000-0000-4000-8000-000000000003', 'collide@mkt-trust.test', 'platform', null, 'marketplace_admin', true);

-- Opened ON PURPOSE: a future migration that adds a seller write policy must not be
-- enough to publish. Dropped at the end of the file.
drop policy if exists mkt_trust_test_open_products on public.marketplace_products;
create policy mkt_trust_test_open_products on public.marketplace_products
  for all to authenticated using (true) with check (true);
drop policy if exists mkt_trust_test_open_media on public.marketplace_product_media;
create policy mkt_trust_test_open_media on public.marketplace_product_media
  for all to authenticated using (true) with check (true);

create or replace function public.mkt_trust_test_listing(p_slug text, p_title text, p_price integer)
returns jsonb language sql immutable as $$
  select jsonb_build_object(
    'slug', p_slug, 'title', p_title, 'summary', 'A clean summary', 'description', 'A clean description',
    'sku', 'SKU-' || p_slug, 'base_price', p_price);
$$;
grant execute on function public.mkt_trust_test_listing(text, text, integer) to anon, authenticated, service_role;

-- What the TS gate sends with an onboarding request: the hash of the profile it screened.
create or replace function public.mkt_trust_test_profile_hash(p_application uuid)
returns text language sql stable security definer set search_path = public, pg_temp as $$
  select encode(sha256(convert_to(
           encode(sha256(convert_to(lower(btrim(a.proposed_store_slug)), 'UTF8')), 'hex')
           || encode(sha256(convert_to(btrim(a.store_name), 'UTF8')), 'hex')
           || encode(sha256(convert_to(coalesce(a.story, ''), 'UTF8')), 'hex'), 'UTF8')), 'hex')
    from public.marketplace_vendor_applications a
   where a.id = p_application;
$$;
grant execute on function public.mkt_trust_test_profile_hash(uuid) to anon, authenticated, service_role;

do $$
declare
  violations int := 0;
  a_user  constant uuid := 'a1000000-0000-4000-8000-000000000001';
  b_user  constant uuid := 'a1000000-0000-4000-8000-000000000002';
  staff   constant uuid := 'a1000000-0000-4000-8000-000000000003';
  outsider constant uuid := 'a1000000-0000-4000-8000-000000000004';
  inst    constant uuid := 'a1000000-0000-4000-8000-000000000005';
  inst2   constant uuid := 'a1000000-0000-4000-8000-000000000006';
  va constant uuid := 'b1000000-0000-4000-8000-00000000000a';
  vb constant uuid := 'b1000000-0000-4000-8000-00000000000b';
  vc constant uuid := 'b1000000-0000-4000-8000-00000000000c';
  v jsonb;
  v_id uuid;
  v_pid uuid;
  v_app uuid;
  v_inst_vendor uuid;
  v_n int;
  v_text text;
  i int;
  seed_staff constant uuid := 'a1000000-0000-4000-8000-000000000007';
  seed_unverified constant uuid := 'a1000000-0000-4000-8000-000000000008';
  collider constant uuid := 'a1000000-0000-4000-8000-000000000009';
  v_seed_pid uuid;
  q_inst    constant uuid := 'a1000000-0000-4000-8000-00000000000a';
  q_nodocs  constant uuid := 'a1000000-0000-4000-8000-00000000000b';
  q_docs    constant uuid := 'a1000000-0000-4000-8000-00000000000c';
  q_reject  constant uuid := 'a1000000-0000-4000-8000-00000000000d';
  v_q_vendor uuid;
  v_q_pid uuid;
  v_hint text;
begin
  -- ===== A. live write with no verdict ======================================
  begin
    set local role service_role;
    insert into public.marketplace_products (slug, vendor_id, title, sku, base_price, approval_status)
      values ('mkt-trust-t-a1', va, 'Direct live insert', 'SKU-A1', 1000, 'approved');
    reset role;
    raise warning 'VIOLATION A1: service_role inserted a live listing with no verdict'; violations := violations + 1;
  exception when others then
    reset role;
    if sqlerrm not like 'marketplace_publish_guard:%' then
      raise warning 'VIOLATION A1: wrong error: %', sqlerrm; violations := violations + 1;
    end if;
  end;

  insert into public.marketplace_products (slug, vendor_id, title, summary, description, sku, base_price, approval_status)
    values ('mkt-trust-t-a2', va, 'Draft then flipped', 'A clean summary', 'A clean description', 'SKU-mkt-trust-t-a2', 1000, 'submitted')
    returning id into v_pid;

  begin
    set local role service_role;
    update public.marketplace_products set approval_status = 'approved' where id = v_pid;
    reset role;
    raise warning 'VIOLATION A2: service_role flipped a listing live with no verdict'; violations := violations + 1;
  exception when others then
    reset role;
    if sqlerrm not like 'marketplace_publish_guard:%' then
      raise warning 'VIOLATION A2: wrong error: %', sqlerrm; violations := violations + 1;
    end if;
  end;

  -- Even the platform's own superuser session needs a verdict for a seller row.
  begin
    update public.marketplace_products set approval_status = 'approved' where id = v_pid;
    raise warning 'VIOLATION A3: an unattributed superuser write published a seller listing'; violations := violations + 1;
  exception when others then
    if sqlerrm not like 'marketplace_publish_guard:%' then
      raise warning 'VIOLATION A3: wrong error: %', sqlerrm; violations := violations + 1;
    end if;
  end;

  -- ===== B. request role, RLS deliberately opened ==========================
  begin
    perform set_config('test.uid', a_user::text, true);
    set local role authenticated;
    update public.marketplace_products set approval_status = 'approved' where id = v_pid;
    reset role;
    raise warning 'VIOLATION B1: authenticated published once a write policy existed'; violations := violations + 1;
  exception when others then
    reset role;
    if sqlerrm not like 'marketplace_publish_guard:%' then
      raise warning 'VIOLATION B1: wrong error: %', sqlerrm; violations := violations + 1;
    end if;
  end;

  -- ...and naming a real staff member as reviewer does not help a request role.
  begin
    set local role authenticated;
    update public.marketplace_products
       set approval_status = 'approved', reviewed_by = staff, reviewed_at = now()
     where id = v_pid;
    reset role;
    raise warning 'VIOLATION B2: authenticated published by naming a staff reviewer'; violations := violations + 1;
  exception when others then
    reset role;
    if sqlerrm not like 'marketplace_publish_guard:%' then
      raise warning 'VIOLATION B2: wrong error: %', sqlerrm; violations := violations + 1;
    end if;
  end;

  -- ===== C. the staff branch and its limits ================================
  begin
    set local role service_role;
    update public.marketplace_products
       set approval_status = 'approved', reviewed_by = a_user, reviewed_at = now()
     where id = v_pid;
    reset role;
    raise warning 'VIOLATION C1: a non-staff reviewer id published a listing'; violations := violations + 1;
  exception when others then
    reset role;
    if sqlerrm not like 'marketplace_publish_guard:%' then
      raise warning 'VIOLATION C1: wrong error: %', sqlerrm; violations := violations + 1;
    end if;
  end;

  -- content moved in the same statement as the "decision"
  begin
    set local role service_role;
    update public.marketplace_products
       set approval_status = 'approved', reviewed_by = staff, reviewed_at = now(),
           title = 'Swapped during approval'
     where id = v_pid;
    reset role;
    raise warning 'VIOLATION C2: content changed inside a staff approval'; violations := violations + 1;
  exception when others then
    reset role;
    if sqlerrm not like 'marketplace_publish_guard:%' then
      raise warning 'VIOLATION C2: wrong error: %', sqlerrm; violations := violations + 1;
    end if;
  end;

  -- a rejection stamps reviewed_* ; that stale stamp must not authorise a later publish
  set local role service_role;
  update public.marketplace_products
     set approval_status = 'rejected', reviewed_by = staff, reviewed_at = now() - interval '1 minute'
   where id = v_pid;
  reset role;
  begin
    set local role service_role;
    update public.marketplace_products set approval_status = 'approved' where id = v_pid;
    reset role;
    raise warning 'VIOLATION C3: a stale staff stamp authorised a publish'; violations := violations + 1;
  exception when others then
    reset role;
    if sqlerrm not like 'marketplace_publish_guard:%' then
      raise warning 'VIOLATION C3: wrong error: %', sqlerrm; violations := violations + 1;
    end if;
  end;

  -- the real thing: staff approves -> live, and the decision is on the ledger
  begin
    set local role service_role;
    update public.marketplace_products
       set approval_status = 'approved', reviewed_by = staff, reviewed_at = now()
     where id = v_pid;
    reset role;
  exception when others then
    reset role;
    raise warning 'VIOLATION C4: a genuine staff approval was refused: %', sqlerrm; violations := violations + 1;
  end;
  select count(*) into v_n from public.marketplace_listing_gate_verdicts
   where product_id = v_pid and source = 'staff_review' and actor_user_id = staff and consumed_at is not null;
  if v_n <> 1 then
    raise warning 'VIOLATION C5: staff approval not recorded exactly once (found %)', v_n; violations := violations + 1;
  end if;

  -- ----- who counts as staff: the app's grant rule, mirrored ----------------
  insert into public.marketplace_products (slug, vendor_id, title, summary, description, sku, base_price, approval_status)
    values ('mkt-trust-t-c6', va, 'Seed staff kettle', 'A clean summary', 'A clean description', 'SKU-mkt-trust-t-c6', 1000, 'under_review')
    returning id into v_seed_pid;

  -- an UNCLAIMED seed row, but the mailbox is NOT verified: no grant
  begin
    set local role service_role;
    update public.marketplace_products
       set approval_status = 'approved', reviewed_by = seed_unverified, reviewed_at = now()
     where id = v_seed_pid;
    reset role;
    raise warning 'VIOLATION C6: an unverified mailbox claimed a staff seed and published'; violations := violations + 1;
  exception when others then
    reset role;
    if sqlerrm not like 'marketplace_publish_guard:%' then
      raise warning 'VIOLATION C6: wrong error: %', sqlerrm; violations := violations + 1;
    end if;
  end;

  -- a row BOUND to someone else is never matched by email
  begin
    set local role service_role;
    update public.marketplace_products
       set approval_status = 'approved', reviewed_by = collider, reviewed_at = now()
     where id = v_seed_pid;
    reset role;
    raise warning 'VIOLATION C7: an email collision with a bound staff row published a listing'; violations := violations + 1;
  exception when others then
    reset role;
    if sqlerrm not like 'marketplace_publish_guard:%' then
      raise warning 'VIOLATION C7: wrong error: %', sqlerrm; violations := violations + 1;
    end if;
  end;
  if public.marketplace_gate_is_staff(collider) or public.marketplace_gate_actor_may_act_for(collider, va) then
    raise warning 'VIOLATION C7: the collider is treated as staff'; violations := violations + 1;
  end if;
  if not public.marketplace_gate_actor_may_act_for(staff, va) then
    raise warning 'VIOLATION C7: the row''s real owner lost the role'; violations := violations + 1;
  end if;
  if public.marketplace_gate_is_staff(outsider) or public.marketplace_gate_actor_may_act_for(outsider, va) then
    raise warning 'VIOLATION C7: a user with no membership is treated as staff'; violations := violations + 1;
  end if;

  -- the real thing: a staff member whose role is an unclaimed seed, verified mailbox
  begin
    set local role service_role;
    update public.marketplace_products
       set approval_status = 'approved', reviewed_by = seed_staff, reviewed_at = now()
     where id = v_seed_pid;
    reset role;
  exception when others then
    reset role;
    raise warning 'VIOLATION C8: a staff member granted by a verified seed was refused: %', sqlerrm; violations := violations + 1;
  end;
  if not public.marketplace_gate_actor_may_act_for(seed_staff, va) then
    raise warning 'VIOLATION C8: seeded staff cannot act for a store'; violations := violations + 1;
  end if;
  if public.marketplace_gate_actor_may_act_for(seed_unverified, va) then
    raise warning 'VIOLATION C8: an unverified seed may act for a store'; violations := violations + 1;
  end if;

  -- an inactive row never grants
  update public.marketplace_role_memberships set is_active = false where normalized_email = 'seed-staff@mkt-trust.test' and user_id is null;
  if public.marketplace_gate_is_staff(seed_staff) then
    raise warning 'VIOLATION C9: an inactive seed still grants'; violations := violations + 1;
  end if;
  update public.marketplace_role_memberships set is_active = true where normalized_email = 'seed-staff@mkt-trust.test' and user_id is null;
  if public.marketplace_gate_is_staff(null) then
    raise warning 'VIOLATION C9: a null user is staff'; violations := violations + 1;
  end if;

  -- ===== D. forging the ledger =============================================
  begin
    set local role service_role;
    insert into public.marketplace_listing_gate_verdicts (slug, content_hash, outcome, source, expires_at)
      values ('mkt-trust-t-forged', 'x', 'publish', 'policy_engine', now() + interval '1 hour');
    reset role;
    raise warning 'VIOLATION D1: service_role wrote the ledger directly'; violations := violations + 1;
  exception when insufficient_privilege then
    reset role;
  end;

  begin
    set local role service_role;
    update public.marketplace_listing_gate_verdicts set outcome = 'publish' where slug = 'mkt-trust-t-a2';
    reset role;
    raise warning 'VIOLATION D2: service_role updated the ledger directly'; violations := violations + 1;
  exception when insufficient_privilege then
    reset role;
  end;

  begin
    set local role authenticated;
    perform public.marketplace_gate_record_listing_verdict(
      a_user, va, public.mkt_trust_test_listing('mkt-trust-t-d3', 'Forged by a seller', 1000),
      '{}'::text[], 'publish', '{}'::text[], '{}'::jsonb, 'test');
    reset role;
    raise warning 'VIOLATION D3: authenticated minted a verdict'; violations := violations + 1;
  exception when insufficient_privilege then
    reset role;
  end;

  begin
    set local role anon;
    perform public.marketplace_gate_record_listing_verdict(
      a_user, va, public.mkt_trust_test_listing('mkt-trust-t-d4', 'Forged by anon', 1000),
      '{}'::text[], 'publish', '{}'::text[], '{}'::jsonb, 'test');
    reset role;
    raise warning 'VIOLATION D4: anon minted a verdict'; violations := violations + 1;
  exception when insufficient_privilege then
    reset role;
  end;

  begin
    set local role authenticated;
    perform 1 from public.marketplace_listing_gate_verdicts limit 1;
    reset role;
    raise warning 'VIOLATION D5: authenticated can read the ledger'; violations := violations + 1;
  exception when insufficient_privilege then
    reset role;
  end;

  -- reason codes are identifiers, never free text (nothing a seller typed, and no
  -- model output, can reach the ledger through them)
  begin
    set local role service_role;
    perform public.marketplace_gate_record_listing_verdict(
      a_user, va, public.mkt_trust_test_listing('mkt-trust-t-d6', 'Reason smuggling', 1000),
      '{}'::text[], 'hold', array['Call me on 0803 555 0101'], '{}'::jsonb, 'test');
    reset role;
    raise warning 'VIOLATION D6: free text was accepted as a reason code'; violations := violations + 1;
  exception when check_violation then
    reset role;
  end;

  begin
    set local role service_role;
    perform public.marketplace_gate_record_listing_verdict(
      a_user, va, public.mkt_trust_test_listing('mkt-trust-t-d7', 'Bad outcome', 1000),
      '{}'::text[], 'approve', '{}'::text[], '{}'::jsonb, 'test');
    reset role;
    raise warning 'VIOLATION D7: an outcome outside the vocabulary was accepted'; violations := violations + 1;
  exception when check_violation then
    reset role;
  end;

  begin
    set local role service_role;
    perform public.marketplace_gate_record_listing_verdict(
      a_user, va, public.mkt_trust_test_listing('mkt-trust-t-d8', 'Bad source', 1000),
      '{}'::text[], 'publish', '{}'::text[], '{}'::jsonb, 'test', 'staff_review');
    reset role;
    raise warning 'VIOLATION D8: the RPC minted a verdict under a source reserved for the guard'; violations := violations + 1;
  exception when check_violation then
    reset role;
  end;

  -- ===== E. IDOR ============================================================
  -- seller A asks for a verdict on seller B's store
  begin
    set local role service_role;
    perform public.marketplace_gate_record_listing_verdict(
      a_user, vb, public.mkt_trust_test_listing('mkt-trust-t-e1', 'Planted in B', 1000),
      '{}'::text[], 'publish', '{}'::text[], '{}'::jsonb, 'test');
    reset role;
    raise warning 'VIOLATION E1: a seller obtained a verdict for another store'; violations := violations + 1;
  exception when insufficient_privilege then
    reset role;
  end;

  -- an account with no membership at all
  begin
    set local role service_role;
    perform public.marketplace_gate_record_listing_verdict(
      outsider, va, public.mkt_trust_test_listing('mkt-trust-t-e2', 'No membership', 1000),
      '{}'::text[], 'publish', '{}'::text[], '{}'::jsonb, 'test');
    reset role;
    raise warning 'VIOLATION E2: a non-member obtained a verdict'; violations := violations + 1;
  exception when insufficient_privilege then
    reset role;
  end;

  -- seller B targets a slug that belongs to seller A: the DB turns publish into reject
  set local role service_role;
  v := public.marketplace_gate_record_listing_verdict(
    b_user, vb, public.mkt_trust_test_listing('mkt-trust-t-a2', 'Takeover attempt', 1000),
    '{}'::text[], 'publish', '{}'::text[], '{}'::jsonb, 'test');
  reset role;
  if v ->> 'outcome' <> 'reject' or not (v -> 'reasons' ? 'listing_conflict') then
    raise warning 'VIOLATION E3: a cross-vendor slug did not become reject/listing_conflict: %', v; violations := violations + 1;
  end if;

  -- ===== F. the engine path ================================================
  set local role service_role;
  v := public.marketplace_gate_record_listing_verdict(
    a_user, va, public.mkt_trust_test_listing('mkt-trust-t-f1', 'Clean kettle', 12000),
    array['media://public/marketplace-images/mkt-trust-t/f1-cover.jpg'], 'publish', '{}'::text[], '{}'::jsonb, 'test');
  reset role;
  if v ->> 'outcome' <> 'publish' then
    raise warning 'VIOLATION F0: a clean verdict was not publish: %', v; violations := violations + 1;
  end if;

  begin
    set local role service_role;
    insert into public.marketplace_products (slug, vendor_id, title, summary, description, sku, base_price, approval_status)
      values ('mkt-trust-t-f1', va, 'Clean kettle', 'A clean summary', 'A clean description', 'SKU-mkt-trust-t-f1', 12000, 'approved')
      returning id into v_pid;
    reset role;
  exception when others then
    reset role;
    raise warning 'VIOLATION F1: a verdict-backed publish was refused: %', sqlerrm; violations := violations + 1;
  end;

  select count(*) into v_n from public.marketplace_listing_gate_verdicts
   where id = (v ->> 'verdict_id')::uuid and consumed_at is not null and product_id = v_pid and transition = 'go_live';
  if v_n <> 1 then
    raise warning 'VIOLATION F2: the verdict was not consumed against the product'; violations := violations + 1;
  end if;

  -- same content, different amount of money: a verdict does not stretch
  begin
    set local role service_role;
    v := public.marketplace_gate_record_listing_verdict(
      a_user, va, public.mkt_trust_test_listing('mkt-trust-t-f3', 'Clean lamp', 9000),
      '{}'::text[], 'publish', '{}'::text[], '{}'::jsonb, 'test');
    insert into public.marketplace_products (slug, vendor_id, title, summary, description, sku, base_price, approval_status)
      values ('mkt-trust-t-f3', va, 'Clean lamp', 'A clean summary', 'A clean description', 'SKU-mkt-trust-t-f3', 9001, 'approved');
    reset role;
    raise warning 'VIOLATION F3: a verdict covered content it was not minted for'; violations := violations + 1;
  exception when others then
    reset role;
    if sqlerrm not like 'marketplace_publish_guard:%' then
      raise warning 'VIOLATION F3: wrong error: %', sqlerrm; violations := violations + 1;
    end if;
  end;

  -- replay: unpublish, then try to ride the consumed verdict back to live
  set local role service_role;
  update public.marketplace_products set approval_status = 'draft' where id = v_pid;
  reset role;
  begin
    set local role service_role;
    update public.marketplace_products set approval_status = 'approved' where id = v_pid;
    reset role;
    raise warning 'VIOLATION F4: a consumed verdict was replayed'; violations := violations + 1;
  exception when others then
    reset role;
    if sqlerrm not like 'marketplace_publish_guard:%' then
      raise warning 'VIOLATION F4: wrong error: %', sqlerrm; violations := violations + 1;
    end if;
  end;

  -- expiry
  set local role service_role;
  v := public.marketplace_gate_record_listing_verdict(
    a_user, va, public.mkt_trust_test_listing('mkt-trust-t-f1', 'Clean kettle', 12000),
    array['media://public/marketplace-images/mkt-trust-t/f1-cover.jpg'], 'publish', '{}'::text[], '{}'::jsonb, 'test');
  reset role;
  update public.marketplace_listing_gate_verdicts
     set expires_at = now() - interval '1 second'
   where id = (v ->> 'verdict_id')::uuid;
  begin
    set local role service_role;
    update public.marketplace_products set approval_status = 'approved' where id = v_pid;
    reset role;
    raise warning 'VIOLATION F5: an expired verdict published a listing'; violations := violations + 1;
  exception when others then
    reset role;
    if sqlerrm not like 'marketplace_publish_guard:%' then
      raise warning 'VIOLATION F5: wrong error: %', sqlerrm; violations := violations + 1;
    end if;
  end;

  -- a hold or reject verdict is never a licence to publish
  set local role service_role;
  v := public.marketplace_gate_record_listing_verdict(
    a_user, va, public.mkt_trust_test_listing('mkt-trust-t-f1', 'Clean kettle', 12000),
    array['media://public/marketplace-images/mkt-trust-t/f1-cover.jpg'], 'hold', array['scam_language'], '{}'::jsonb, 'test');
  reset role;
  begin
    set local role service_role;
    update public.marketplace_products set approval_status = 'approved' where id = v_pid;
    reset role;
    raise warning 'VIOLATION F6: a hold verdict published a listing'; violations := violations + 1;
  exception when others then
    reset role;
    if sqlerrm not like 'marketplace_publish_guard:%' then
      raise warning 'VIOLATION F6: wrong error: %', sqlerrm; violations := violations + 1;
    end if;
  end;

  -- back to live properly, for the next sections
  set local role service_role;
  v := public.marketplace_gate_record_listing_verdict(
    a_user, va, public.mkt_trust_test_listing('mkt-trust-t-f1', 'Clean kettle', 12000),
    array['media://public/marketplace-images/mkt-trust-t/f1-cover.jpg'], 'publish', '{}'::text[], '{}'::jsonb, 'test');
  update public.marketplace_products set approval_status = 'approved' where id = v_pid;
  reset role;

  -- ===== G. clean -> prohibited edit =======================================
  begin
    set local role service_role;
    update public.marketplace_products set title = 'Call 0803 555 0101 to buy' where id = v_pid;
    reset role;
    raise warning 'VIOLATION G1: live content changed with no verdict'; violations := violations + 1;
  exception when others then
    reset role;
    if sqlerrm not like 'marketplace_publish_guard:%' then
      raise warning 'VIOLATION G1: wrong error: %', sqlerrm; violations := violations + 1;
    end if;
  end;

  begin
    set local role service_role;
    update public.marketplace_products set description = 'Now with a different story' where id = v_pid;
    reset role;
    raise warning 'VIOLATION G2: live description changed with no verdict'; violations := violations + 1;
  exception when others then
    reset role;
    if sqlerrm not like 'marketplace_publish_guard:%' then
      raise warning 'VIOLATION G2: wrong error: %', sqlerrm; violations := violations + 1;
    end if;
  end;

  begin
    set local role service_role;
    update public.marketplace_products set trust_badges = array['Henry Onyx verified partner'] where id = v_pid;
    reset role;
    raise warning 'VIOLATION G3: a trust badge was added to a live listing with no verdict'; violations := violations + 1;
  exception when others then
    reset role;
    if sqlerrm not like 'marketplace_publish_guard:%' then
      raise warning 'VIOLATION G3: wrong error: %', sqlerrm; violations := violations + 1;
    end if;
  end;

  -- the staff branch is status-only: it cannot carry a live content change either
  begin
    set local role service_role;
    update public.marketplace_products
       set title = 'Edited under a reviewer name', reviewed_by = staff, reviewed_at = now()
     where id = v_pid;
    reset role;
    raise warning 'VIOLATION G4: a live edit rode the staff branch'; violations := violations + 1;
  exception when others then
    reset role;
    if sqlerrm not like 'marketplace_publish_guard:%' then
      raise warning 'VIOLATION G4: wrong error: %', sqlerrm; violations := violations + 1;
    end if;
  end;

  -- non-content columns stay writable on a live row
  begin
    set local role service_role;
    update public.marketplace_products set total_stock = 7, rating = 4.5, review_count = 3, featured = true where id = v_pid;
    reset role;
  exception when others then
    reset role;
    raise warning 'VIOLATION G5: stock/rating update on a live listing was refused: %', sqlerrm; violations := violations + 1;
  end;

  -- a live edit WITH its own verdict goes through and is recorded as an edit
  begin
    set local role service_role;
    v := public.marketplace_gate_record_listing_verdict(
      a_user, va, public.mkt_trust_test_listing('mkt-trust-t-f1', 'Clean kettle, 2 litre', 12500),
      array['media://public/marketplace-images/mkt-trust-t/f1-cover.jpg'], 'publish', '{}'::text[], '{}'::jsonb, 'test');
    update public.marketplace_products set title = 'Clean kettle, 2 litre', base_price = 12500 where id = v_pid;
    reset role;
  exception when others then
    reset role;
    raise warning 'VIOLATION G6: a verdict-backed live edit was refused: %', sqlerrm; violations := violations + 1;
  end;
  select count(*) into v_n from public.marketplace_listing_gate_verdicts
   where product_id = v_pid and transition = 'live_edit' and consumed_at is not null;
  if v_n <> 1 then
    raise warning 'VIOLATION G7: live edit not recorded (found %)', v_n; violations := violations + 1;
  end if;

  -- ===== H. the upsert path ================================================
  begin
    set local role service_role;
    v := public.marketplace_gate_record_listing_verdict(
      a_user, va, public.mkt_trust_test_listing('mkt-trust-t-f1', 'Clean kettle, 3 litre', 13000),
      array['media://public/marketplace-images/mkt-trust-t/f1-cover.jpg'], 'publish', '{}'::text[], '{}'::jsonb, 'test');
    insert into public.marketplace_products (slug, vendor_id, title, summary, description, sku, base_price, approval_status)
      values ('mkt-trust-t-f1', va, 'Clean kettle, 3 litre', 'A clean summary', 'A clean description', 'SKU-mkt-trust-t-f1', 13000, 'approved')
      on conflict (slug) do update
        set title = excluded.title, base_price = excluded.base_price, approval_status = excluded.approval_status;
    reset role;
  exception when others then
    reset role;
    raise warning 'VIOLATION H1: verdict-backed upsert was refused: %', sqlerrm; violations := violations + 1;
  end;
  select count(*) into v_n from public.marketplace_listing_gate_verdicts
   where id = (v ->> 'verdict_id')::uuid and consumed_at is not null and product_id = v_pid;
  if v_n <> 1 then
    raise warning 'VIOLATION H2: upsert did not consume its verdict against the existing row'; violations := violations + 1;
  end if;

  begin
    set local role service_role;
    insert into public.marketplace_products (slug, vendor_id, title, summary, description, sku, base_price, approval_status)
      values ('mkt-trust-t-f1', va, 'Upserted without a verdict', 'A clean summary', 'A clean description', 'SKU-mkt-trust-t-f1', 13000, 'approved')
      on conflict (slug) do update
        set title = excluded.title, approval_status = excluded.approval_status;
    reset role;
    raise warning 'VIOLATION H3: an upsert changed live content with no verdict'; violations := violations + 1;
  exception when others then
    reset role;
    if sqlerrm not like 'marketplace_publish_guard:%' then
      raise warning 'VIOLATION H3: wrong error: %', sqlerrm; violations := violations + 1;
    end if;
  end;

  -- ===== I. media ===========================================================
  begin
    set local role service_role;
    insert into public.marketplace_product_media (product_id, url, kind, is_primary, sort_order)
      values (v_pid, 'media://public/marketplace-images/mkt-trust-t/f1-cover.jpg', 'image', true, 0);
    reset role;
  exception when others then
    reset role;
    raise warning 'VIOLATION I1: a covered image was refused on a live listing: %', sqlerrm; violations := violations + 1;
  end;

  begin
    set local role service_role;
    insert into public.marketplace_product_media (product_id, url, kind, is_primary, sort_order)
      values (v_pid, 'https://attacker.example/swapped.jpg', 'image', false, 1);
    reset role;
    raise warning 'VIOLATION I2: an uncovered image was attached to a live listing'; violations := violations + 1;
  exception when others then
    reset role;
    if sqlerrm not like 'marketplace_media_guard:%' then
      raise warning 'VIOLATION I2: wrong error: %', sqlerrm; violations := violations + 1;
    end if;
  end;

  begin
    set local role service_role;
    update public.marketplace_product_media set url = 'https://attacker.example/swapped.jpg' where product_id = v_pid;
    reset role;
    raise warning 'VIOLATION I3: a live listing''s image url was rewritten'; violations := violations + 1;
  exception when others then
    reset role;
    if sqlerrm not like 'marketplace_media_guard:%' then
      raise warning 'VIOLATION I3: wrong error: %', sqlerrm; violations := violations + 1;
    end if;
  end;

  -- going live while carrying an image the verdict never saw
  set local role service_role;
  insert into public.marketplace_products (slug, vendor_id, title, summary, description, sku, base_price, approval_status)
    values ('mkt-trust-t-i4', va, 'Has a stray image', 'A clean summary', 'A clean description', 'SKU-mkt-trust-t-i4', 5000, 'submitted')
    returning id into v_id;
  insert into public.marketplace_product_media (product_id, url, kind) values (v_id, 'https://attacker.example/stray.jpg', 'image');
  v := public.marketplace_gate_record_listing_verdict(
    a_user, va, public.mkt_trust_test_listing('mkt-trust-t-i4', 'Has a stray image', 5000),
    array['media://public/marketplace-images/mkt-trust-t/i4.jpg'], 'publish', '{}'::text[], '{}'::jsonb, 'test');
  reset role;
  begin
    set local role service_role;
    update public.marketplace_products set approval_status = 'approved' where id = v_id;
    reset role;
    raise warning 'VIOLATION I4: a listing went live with an image outside its verdict'; violations := violations + 1;
  exception when others then
    reset role;
    if sqlerrm not like 'marketplace_publish_guard:%' then
      raise warning 'VIOLATION I4: wrong error: %', sqlerrm; violations := violations + 1;
    end if;
  end;

  -- ===== N. instant onboarding (before J/M, which need a probation store) ===
  insert into public.marketplace_vendor_applications
    (user_id, normalized_email, store_name, proposed_store_slug, legal_name, status, agreement_accepted_at, story)
  values
    (inst, 'instant@mkt-trust.test', 'Instant Store', 'mkt-trust-t-instant', 'Instant Ltd', 'submitted', now(), 'We sell kettles.')
  returning id into v_app;

  begin
    set local role service_role;
    perform public.marketplace_gate_instant_onboard(a_user, v_app, '{}'::text[], '{}'::jsonb, 'test', public.mkt_trust_test_profile_hash(v_app));
    reset role;
    raise warning 'VIOLATION N1: an application was onboarded by someone other than its owner'; violations := violations + 1;
  exception when insufficient_privilege then
    reset role;
  end;

  begin
    set local role authenticated;
    perform public.marketplace_gate_instant_onboard(inst, v_app, '{}'::text[], '{}'::jsonb, 'test', public.mkt_trust_test_profile_hash(v_app));
    reset role;
    raise warning 'VIOLATION N2: authenticated called the onboarding RPC'; violations := violations + 1;
  exception when insufficient_privilege then
    reset role;
  end;

  set local role service_role;
  v := public.marketplace_gate_instant_onboard(inst, v_app, '{}'::text[], '{}'::jsonb, 'test', public.mkt_trust_test_profile_hash(v_app));
  reset role;
  v_inst_vendor := (v ->> 'vendor_id')::uuid;
  if (v ->> 'onboarded')::boolean is not true or v_inst_vendor is null then
    raise warning 'VIOLATION N3: instant onboarding did not open a store: %', v; violations := violations + 1;
  end if;
  select count(*) into v_n from public.marketplace_seller_probation where vendor_id = v_inst_vendor and graduated_at is null;
  if v_n <> 1 then
    raise warning 'VIOLATION N4: instant store has no probation row'; violations := violations + 1;
  end if;
  select count(*) into v_n from public.marketplace_role_memberships
   where user_id = inst and scope_type = 'vendor' and scope_id = v_inst_vendor and role = 'vendor' and is_active;
  if v_n <> 1 then
    raise warning 'VIOLATION N5: instant store has no vendor membership'; violations := violations + 1;
  end if;
  select count(*) into v_n from public.marketplace_listing_gate_verdicts
   where subject_type = 'seller' and vendor_id = v_inst_vendor and actor_user_id = inst;
  if v_n <> 1 then
    raise warning 'VIOLATION N6: onboarding verdict not recorded'; violations := violations + 1;
  end if;

  -- a second application from the same account never opens a second store
  insert into public.marketplace_vendor_applications
    (user_id, normalized_email, store_name, proposed_store_slug, legal_name, status, agreement_accepted_at)
  values
    (inst, 'instant@mkt-trust.test', 'Instant Store Two', 'mkt-trust-t-instant-2', 'Instant Ltd', 'submitted', now())
  returning id into v_app;
  set local role service_role;
  v := public.marketplace_gate_instant_onboard(inst, v_app, '{}'::text[], '{}'::jsonb, 'test', public.mkt_trust_test_profile_hash(v_app));
  reset role;
  if (v ->> 'onboarded')::boolean is not false or v ->> 'why' <> 'already_seller' then
    raise warning 'VIOLATION N7: a second store was opened for one account: %', v; violations := violations + 1;
  end if;

  -- a taken handle is refused
  insert into public.marketplace_vendor_applications
    (user_id, normalized_email, store_name, proposed_store_slug, legal_name, status, agreement_accepted_at)
  values
    (inst2, 'instant-two@mkt-trust.test', 'Copycat', 'mkt-trust-t-store-a', 'Copy Ltd', 'submitted', now())
  returning id into v_app;
  begin
    set local role service_role;
    perform public.marketplace_gate_instant_onboard(inst2, v_app, '{}'::text[], '{}'::jsonb, 'test', public.mkt_trust_test_profile_hash(v_app));
    reset role;
    raise warning 'VIOLATION N8: an existing store handle was taken over'; violations := violations + 1;
  exception when others then
    reset role;
    if sqlerrm not like 'marketplace_gate_instant_onboard:%' then
      raise warning 'VIOLATION N8: wrong error: %', sqlerrm; violations := violations + 1;
    end if;
  end;

  -- an application whose agreement was never accepted is refused
  insert into public.marketplace_vendor_applications
    (user_id, normalized_email, store_name, proposed_store_slug, legal_name, status)
  values
    (inst2, 'instant-two@mkt-trust.test', 'No Agreement', 'mkt-trust-t-no-agreement', 'NA Ltd', 'submitted')
  returning id into v_app;
  begin
    set local role service_role;
    perform public.marketplace_gate_instant_onboard(inst2, v_app, '{}'::text[], '{}'::jsonb, 'test', public.mkt_trust_test_profile_hash(v_app));
    reset role;
    raise warning 'VIOLATION N9: onboarding without the seller agreement'; violations := violations + 1;
  exception when others then
    reset role;
    if sqlerrm not like 'marketplace_gate_instant_onboard:%' then
      raise warning 'VIOLATION N9: wrong error: %', sqlerrm; violations := violations + 1;
    end if;
  end;

  -- ===== J. probation caps ==================================================
  -- A new store starts on the `launch` plan, whose own listing allowance (3) is a
  -- commercial limit enforced by an older trigger. Lift it here so the PROBATION
  -- caps are what is being measured.
  update public.marketplace_vendors set seller_tier = 'partner' where id = v_inst_vendor;

  -- price ceiling: the RPC tightens publish -> reject
  set local role service_role;
  v := public.marketplace_gate_record_listing_verdict(
    inst, v_inst_vendor, public.mkt_trust_test_listing('mkt-trust-t-j-price', 'Too dear for probation', 500001),
    '{}'::text[], 'publish', '{}'::text[], '{}'::jsonb, 'test');
  reset role;
  if v ->> 'outcome' <> 'reject' or not (v -> 'reasons' ? 'probation_price_cap') then
    raise warning 'VIOLATION J1: probation price ceiling not enforced: %', v; violations := violations + 1;
  end if;

  -- daily cap: five go-lives pass, the sixth is refused
  for i in 1..5 loop
    begin
      set local role service_role;
      v := public.marketplace_gate_record_listing_verdict(
        inst, v_inst_vendor, public.mkt_trust_test_listing('mkt-trust-t-j-' || i, 'Probation item ' || i, 2000),
        '{}'::text[], 'publish', '{}'::text[], '{}'::jsonb, 'test');
      insert into public.marketplace_products (slug, vendor_id, title, summary, description, sku, base_price, approval_status)
        values ('mkt-trust-t-j-' || i, v_inst_vendor, 'Probation item ' || i, 'A clean summary', 'A clean description',
                'SKU-mkt-trust-t-j-' || i, 2000, 'approved');
      reset role;
    exception when others then
      reset role;
      raise warning 'VIOLATION J2: probation listing % was refused: %', i, sqlerrm; violations := violations + 1;
    end;
  end loop;

  set local role service_role;
  v := public.marketplace_gate_record_listing_verdict(
    inst, v_inst_vendor, public.mkt_trust_test_listing('mkt-trust-t-j-6', 'Probation item 6', 2000),
    '{}'::text[], 'publish', '{}'::text[], '{}'::jsonb, 'test');
  reset role;
  if v ->> 'outcome' <> 'reject' or not (v -> 'reasons' ? 'probation_daily_cap') then
    raise warning 'VIOLATION J3: probation daily cap not enforced by the RPC: %', v; violations := violations + 1;
  end if;

  -- the guard holds the same line even when a publish verdict already exists
  -- (minted before the cap was reached: simulated by ageing the earlier go-lives,
  -- minting, then restoring them)
  update public.marketplace_listing_gate_verdicts
     set consumed_at = consumed_at - interval '2 days'
   where vendor_id = v_inst_vendor and transition = 'go_live';
  set local role service_role;
  v := public.marketplace_gate_record_listing_verdict(
    inst, v_inst_vendor, public.mkt_trust_test_listing('mkt-trust-t-j-6', 'Probation item 6', 2000),
    '{}'::text[], 'publish', '{}'::text[], '{}'::jsonb, 'test');
  reset role;
  if v ->> 'outcome' <> 'publish' then
    raise warning 'VIOLATION J4: setup — expected a publish verdict once the day window cleared: %', v; violations := violations + 1;
  end if;
  update public.marketplace_listing_gate_verdicts
     set consumed_at = consumed_at + interval '2 days'
   where vendor_id = v_inst_vendor and transition = 'go_live';
  begin
    set local role service_role;
    insert into public.marketplace_products (slug, vendor_id, title, summary, description, sku, base_price, approval_status)
      values ('mkt-trust-t-j-6', v_inst_vendor, 'Probation item 6', 'A clean summary', 'A clean description', 'SKU-mkt-trust-t-j-6', 2000, 'approved');
    reset role;
    raise warning 'VIOLATION J5: the guard let a sixth go-live through inside 24h'; violations := violations + 1;
  exception when others then
    reset role;
    if sqlerrm not like 'marketplace_publish_guard:%' then
      raise warning 'VIOLATION J5: wrong error: %', sqlerrm; violations := violations + 1;
    end if;
  end;

  -- live-listing cap: age every go-live out of the day window, fill up to ten, the eleventh is refused
  update public.marketplace_listing_gate_verdicts
     set consumed_at = consumed_at - interval '3 days'
   where vendor_id = v_inst_vendor and transition = 'go_live';
  for i in 6..10 loop
    begin
      set local role service_role;
      v := public.marketplace_gate_record_listing_verdict(
        inst, v_inst_vendor, public.mkt_trust_test_listing('mkt-trust-t-j-' || i, 'Probation item ' || i, 2000),
        '{}'::text[], 'publish', '{}'::text[], '{}'::jsonb, 'test');
      insert into public.marketplace_products (slug, vendor_id, title, summary, description, sku, base_price, approval_status)
        values ('mkt-trust-t-j-' || i, v_inst_vendor, 'Probation item ' || i, 'A clean summary', 'A clean description',
                'SKU-mkt-trust-t-j-' || i, 2000, 'approved');
      reset role;
    exception when others then
      reset role;
      raise warning 'VIOLATION J6: probation listing % was refused: %', i, sqlerrm; violations := violations + 1;
    end;
  end loop;
  update public.marketplace_listing_gate_verdicts
     set consumed_at = consumed_at - interval '3 days'
   where vendor_id = v_inst_vendor and transition = 'go_live';
  set local role service_role;
  v := public.marketplace_gate_record_listing_verdict(
    inst, v_inst_vendor, public.mkt_trust_test_listing('mkt-trust-t-j-11', 'Probation item 11', 2000),
    '{}'::text[], 'publish', '{}'::text[], '{}'::jsonb, 'test');
  reset role;
  if v ->> 'outcome' <> 'reject' or not (v -> 'reasons' ? 'probation_listing_cap') then
    raise warning 'VIOLATION J7: probation live-listing cap not enforced: %', v; violations := violations + 1;
  end if;

  -- the state RPC reports the same picture the caps were enforced on
  set local role service_role;
  v := public.marketplace_gate_seller_state(v_inst_vendor, 'mkt-trust-t-j-1');
  reset role;
  if (v -> 'probation' ->> 'active')::boolean is not true
     or (v -> 'probation' ->> 'live_listings')::int <> 10
     or (v -> 'probation' -> 'caps' ->> 'max_live_listings')::int <> 10
     or (v ->> 'identity_verified')::boolean is not false then
    raise warning 'VIOLATION J8: seller state disagrees with the enforced caps: %', v; violations := violations + 1;
  end if;

  -- The guard does not lean on the RPC for the price ceiling. Simulate a mint that
  -- went wrong (a publish verdict for an over-ceiling price, written by the table
  -- owner — nothing else can) and show the guard still refuses the row.
  delete from public.marketplace_products where slug = 'mkt-trust-t-j-10';
  update public.marketplace_listing_gate_verdicts
     set consumed_at = consumed_at - interval '3 days'
   where vendor_id = v_inst_vendor and transition = 'go_live';
  insert into public.marketplace_listing_gate_verdicts
    (subject_type, vendor_id, slug, content_hash, outcome, source, engine_version, actor_user_id, expires_at)
  values ('listing', v_inst_vendor, 'mkt-trust-t-j-dear',
          public.marketplace_listing_content_hash(jsonb_populate_record(null::public.marketplace_products,
            public.mkt_trust_test_listing('mkt-trust-t-j-dear', 'Dear item', 600000)
            || jsonb_build_object('vendor_id', v_inst_vendor))),
          'publish', 'policy_engine', 'test', inst, now() + interval '10 minutes');
  begin
    set local role service_role;
    insert into public.marketplace_products (slug, vendor_id, title, summary, description, sku, base_price, approval_status)
      values ('mkt-trust-t-j-dear', v_inst_vendor, 'Dear item', 'A clean summary', 'A clean description', 'SKU-mkt-trust-t-j-dear', 600000, 'approved');
    reset role;
    raise warning 'VIOLATION J9: the guard published an over-ceiling price for a probation store'; violations := violations + 1;
  exception when others then
    reset role;
    if sqlerrm not like 'marketplace_publish_guard: price exceeds%' then
      raise warning 'VIOLATION J9: wrong error: %', sqlerrm; violations := violations + 1;
    end if;
  end;

  -- ===== M. payout identity =================================================
  begin
    set local role service_role;
    insert into public.marketplace_payout_requests (reference, vendor_id, amount, status, requested_by)
      values ('MKT-TRUST-T-M1', v_inst_vendor, 1000, 'requested', inst);
    reset role;
    raise warning 'VIOLATION M1: an unverified instant seller filed a payout request'; violations := violations + 1;
  exception when others then
    reset role;
    if sqlerrm not like 'marketplace_payout_identity_guard:%' then
      raise warning 'VIOLATION M1: wrong error: %', sqlerrm; violations := violations + 1;
    end if;
  end;

  -- the seller sets their own profile to "verified" (possible on production today)
  update public.customer_profiles set verification_status = 'verified' where id = inst;
  begin
    set local role service_role;
    insert into public.marketplace_payout_requests (reference, vendor_id, amount, status, requested_by)
      values ('MKT-TRUST-T-M2', v_inst_vendor, 1000, 'requested', inst);
    reset role;
    raise warning 'VIOLATION M2: a self-set verification status unlocked a payout'; violations := violations + 1;
  exception when others then
    reset role;
    if sqlerrm not like 'marketplace_payout_identity_guard:%' then
      raise warning 'VIOLATION M2: wrong error: %', sqlerrm; violations := violations + 1;
    end if;
  end;

  -- an approved, reviewed document of the wrong kind (proof of address) is not identity
  insert into public.customer_verification_submissions (user_id, document_type, status, reviewer_id)
    values (inst, 'proof_of_address', 'approved', staff);
  begin
    set local role service_role;
    insert into public.marketplace_payout_requests (reference, vendor_id, amount, status, requested_by)
      values ('MKT-TRUST-T-M2B', v_inst_vendor, 1000, 'requested', inst);
    reset role;
    raise warning 'VIOLATION M2b: a non-identity document unlocked a payout'; violations := violations + 1;
  exception when others then
    reset role;
    if sqlerrm not like 'marketplace_payout_identity_guard:%' then
      raise warning 'VIOLATION M2b: wrong error: %', sqlerrm; violations := violations + 1;
    end if;
  end;

  -- a submission nobody reviewed is not identity either
  insert into public.customer_verification_submissions (user_id, document_type, status) values (inst, 'government_id', 'approved');
  begin
    set local role service_role;
    insert into public.marketplace_payout_requests (reference, vendor_id, amount, status, requested_by)
      values ('MKT-TRUST-T-M3', v_inst_vendor, 1000, 'requested', inst);
    reset role;
    raise warning 'VIOLATION M3: an unreviewed submission unlocked a payout'; violations := violations + 1;
  exception when others then
    reset role;
    if sqlerrm not like 'marketplace_payout_identity_guard:%' then
      raise warning 'VIOLATION M3: wrong error: %', sqlerrm; violations := violations + 1;
    end if;
  end;

  -- reviewed by staff: now it is identity
  update public.customer_verification_submissions set reviewer_id = staff
   where user_id = inst and document_type = 'government_id';
  begin
    set local role service_role;
    insert into public.marketplace_payout_requests (reference, vendor_id, amount, status, requested_by)
      values ('MKT-TRUST-T-M4', v_inst_vendor, 1000, 'requested', inst);
    reset role;
  exception when others then
    reset role;
    raise warning 'VIOLATION M4: a verified instant seller was refused a payout request: %', sqlerrm; violations := violations + 1;
  end;

  -- identity withdrawn after the request: finance cannot approve or release it
  update public.customer_profiles set verification_status = 'rejected' where id = inst;
  begin
    set local role service_role;
    update public.marketplace_payout_requests set status = 'released' where reference = 'MKT-TRUST-T-M4';
    reset role;
    raise warning 'VIOLATION M5: a payout was released to an unverified instant seller'; violations := violations + 1;
  exception when others then
    reset role;
    if sqlerrm not like 'marketplace_payout_identity_guard:%' then
      raise warning 'VIOLATION M5: wrong error: %', sqlerrm; violations := violations + 1;
    end if;
  end;
  -- ...but declining it is always possible
  begin
    set local role service_role;
    update public.marketplace_payout_requests set status = 'rejected' where reference = 'MKT-TRUST-T-M4';
    reset role;
  exception when others then
    reset role;
    raise warning 'VIOLATION M6: declining a payout was refused: %', sqlerrm; violations := violations + 1;
  end;

  -- a store that passed the human review is untouched by this guard (flag OFF behaviour)
  begin
    set local role service_role;
    insert into public.marketplace_payout_requests (reference, vendor_id, amount, status, requested_by)
      values ('MKT-TRUST-T-M7', va, 1000, 'requested', a_user);
    reset role;
  exception when others then
    reset role;
    raise warning 'VIOLATION M7: a human-approved store was blocked from a payout request: %', sqlerrm; violations := violations + 1;
  end;

  -- ===== K. hides ===========================================================
  select id into v_pid from public.marketplace_products where slug = 'mkt-trust-t-f1';

  -- a publish verdict minted BEFORE the hide must not survive it
  set local role service_role;
  v := public.marketplace_gate_record_listing_verdict(
    a_user, va, public.mkt_trust_test_listing('mkt-trust-t-f1', 'Clean kettle, 3 litre', 13000),
    array['media://public/marketplace-images/mkt-trust-t/f1-cover.jpg'], 'publish', '{}'::text[], '{}'::jsonb, 'test');
  v := public.marketplace_gate_hide_listing(v_pid, 'reports', array['reports_threshold'], '{"distinct_reporters": 3}'::jsonb, 'test');
  reset role;
  if (v ->> 'hidden')::boolean is not true then
    raise warning 'VIOLATION K1: a live listing was not hidden: %', v; violations := violations + 1;
  end if;
  select approval_status into v_text from public.marketplace_products where id = v_pid;
  if v_text <> 'under_review' then
    raise warning 'VIOLATION K2: a hidden listing is still %', v_text; violations := violations + 1;
  end if;

  begin
    set local role service_role;
    update public.marketplace_products set approval_status = 'approved' where id = v_pid;
    reset role;
    raise warning 'VIOLATION K3: an earlier engine verdict lifted a reports hide'; violations := violations + 1;
  exception when others then
    reset role;
    if sqlerrm not like 'marketplace_publish_guard:%' then
      raise warning 'VIOLATION K3: wrong error: %', sqlerrm; violations := violations + 1;
    end if;
  end;

  -- a fresh engine verdict is tightened to hold while the hide is open
  set local role service_role;
  v := public.marketplace_gate_record_listing_verdict(
    a_user, va, public.mkt_trust_test_listing('mkt-trust-t-f1', 'Clean kettle, 3 litre', 13000),
    array['media://public/marketplace-images/mkt-trust-t/f1-cover.jpg'], 'publish', '{}'::text[], '{}'::jsonb, 'test');
  reset role;
  if v ->> 'outcome' <> 'hold' or not (v -> 'reasons' ? 'enforcement_hold_active') then
    raise warning 'VIOLATION K4: verdict not tightened under an open hide: %', v; violations := violations + 1;
  end if;

  -- hiding twice is a no-op
  set local role service_role;
  v := public.marketplace_gate_hide_listing(v_pid, 'reports', array['reports_threshold'], '{}'::jsonb, 'test');
  reset role;
  if (v ->> 'hidden')::boolean is not false then
    raise warning 'VIOLATION K5: a non-live listing was hidden again: %', v; violations := violations + 1;
  end if;

  -- a listing that is not live cannot be "hidden": nothing recorded, nothing moved
  select id into v_id from public.marketplace_products where slug = 'mkt-trust-t-i4';
  set local role service_role;
  v := public.marketplace_gate_hide_listing(v_id, 'policy', array['contact_details'], '{}'::jsonb, 'test');
  reset role;
  select count(*) into v_n from public.marketplace_listing_enforcement where product_id = v_id;
  select approval_status into v_text from public.marketplace_products where id = v_id;
  if (v ->> 'hidden')::boolean is not false or v_n <> 0 or v_text <> 'submitted' then
    raise warning 'VIOLATION K5b: a non-live listing was hidden (%, % rows, now %)', v, v_n, v_text; violations := violations + 1;
  end if;

  -- staff restores: live again, hide lifted, decision recorded
  begin
    set local role service_role;
    update public.marketplace_products
       set approval_status = 'approved', reviewed_by = staff, reviewed_at = now()
     where id = v_pid;
    reset role;
  exception when others then
    reset role;
    raise warning 'VIOLATION K6: staff could not restore a hidden listing: %', sqlerrm; violations := violations + 1;
  end;
  select count(*) into v_n from public.marketplace_listing_enforcement
   where product_id = v_pid and status = 'lifted' and resolution = 'restored_by_staff' and resolved_by = staff;
  if v_n <> 1 then
    raise warning 'VIOLATION K7: the restore was not recorded on the hide'; violations := violations + 1;
  end if;

  -- a policy hide lifts itself when the seller's fix passes the gate
  set local role service_role;
  v := public.marketplace_gate_hide_listing(v_pid, 'policy', array['contact_details'], '{}'::jsonb, 'test');
  v := public.marketplace_gate_record_listing_verdict(
    a_user, va, public.mkt_trust_test_listing('mkt-trust-t-f1', 'Clean kettle, fixed', 13000),
    array['media://public/marketplace-images/mkt-trust-t/f1-cover.jpg'], 'publish', '{}'::text[], '{}'::jsonb, 'test');
  reset role;
  if v ->> 'outcome' <> 'publish' then
    raise warning 'VIOLATION K8: a policy hide blocked the seller''s clean fix: %', v; violations := violations + 1;
  end if;
  begin
    set local role service_role;
    update public.marketplace_products set title = 'Clean kettle, fixed', approval_status = 'approved' where id = v_pid;
    reset role;
  exception when others then
    reset role;
    raise warning 'VIOLATION K9: a clean fix could not republish: %', sqlerrm; violations := violations + 1;
  end;
  select count(*) into v_n from public.marketplace_listing_enforcement
   where product_id = v_pid and kind = 'policy' and status = 'lifted' and resolution = 'cleared_by_gate';
  if v_n <> 1 then
    raise warning 'VIOLATION K10: policy hide not cleared by the gate'; violations := violations + 1;
  end if;

  -- staff upholds a hide by rejecting
  set local role service_role;
  v := public.marketplace_gate_hide_listing(v_pid, 'reports', array['reports_threshold'], '{}'::jsonb, 'test');
  update public.marketplace_products
     set approval_status = 'rejected', reviewed_by = staff, reviewed_at = clock_timestamp()
   where id = v_pid;
  reset role;
  select count(*) into v_n from public.marketplace_listing_enforcement
   where product_id = v_pid and kind = 'reports' and status = 'upheld' and resolution = 'upheld_by_staff';
  if v_n <> 1 then
    raise warning 'VIOLATION K11: uphold not recorded'; violations := violations + 1;
  end if;

  -- ===== L. company catalogue ==============================================
  begin
    set local role service_role;
    insert into public.marketplace_products (slug, vendor_id, title, sku, base_price, approval_status, inventory_owner_type)
      values ('mkt-trust-t-l1', vc, 'Company kettle', 'SKU-L1', 15000, 'approved', 'company')
      on conflict (slug) do update set title = excluded.title, approval_status = excluded.approval_status;
    reset role;
  exception when others then
    reset role;
    raise warning 'VIOLATION L1: the catalogue seed was refused: %', sqlerrm; violations := violations + 1;
  end;
  select count(*) into v_n from public.marketplace_listing_gate_verdicts
   where slug = 'mkt-trust-t-l1' and source = 'platform_catalog' and consumed_at is not null;
  if v_n <> 1 then
    raise warning 'VIOLATION L2: catalogue publish not recorded exactly once (found %)', v_n; violations := violations + 1;
  end if;

  -- a seller row cannot pose as company inventory
  begin
    set local role service_role;
    insert into public.marketplace_products (slug, vendor_id, title, sku, base_price, approval_status, inventory_owner_type)
      values ('mkt-trust-t-l3', va, 'Posing as company', 'SKU-L3', 15000, 'approved', 'company');
    reset role;
    raise warning 'VIOLATION L3: a seller listing published by claiming company inventory'; violations := violations + 1;
  exception when others then
    reset role;
    if sqlerrm not like 'marketplace_publish_guard:%' then
      raise warning 'VIOLATION L3: wrong error: %', sqlerrm; violations := violations + 1;
    end if;
  end;

  -- and a request role gets nothing from the company branch
  begin
    set local role authenticated;
    insert into public.marketplace_products (slug, vendor_id, title, sku, base_price, approval_status, inventory_owner_type)
      values ('mkt-trust-t-l4', vc, 'Company by a request role', 'SKU-L4', 15000, 'approved', 'company');
    reset role;
    raise warning 'VIOLATION L4: a request role used the company branch'; violations := violations + 1;
  exception when others then
    reset role;
    if sqlerrm not like 'marketplace_publish_guard:%' then
      raise warning 'VIOLATION L4: wrong error: %', sqlerrm; violations := violations + 1;
    end if;
  end;

  -- the company catalogue is never auto-hidden
  select id into v_id from public.marketplace_products where slug = 'mkt-trust-t-l1';
  set local role service_role;
  v := public.marketplace_gate_hide_listing(v_id, 'reports', array['reports_threshold'], '{}'::jsonb, 'test');
  reset role;
  if (v ->> 'hidden')::boolean is not false then
    raise warning 'VIOLATION L5: the company catalogue was auto-hidden'; violations := violations + 1;
  end if;

  -- ===== O. duplicate images ===============================================
  -- A perceptual hash is two masks (brighter-left, brighter-right); the distance
  -- is the number of mask bits that differ.
  set local role service_role;
  perform public.marketplace_gate_register_image(
    'media://public/marketplace-images/mkt-trust-t/f1-cover.jpg', repeat('a', 64), 1234567890123456789, 1000, a_user, va,
    81985529216486895);
  -- B re-uploads the identical bytes
  perform public.marketplace_gate_register_image(
    'media://public/marketplace-images/mkt-trust-t/b-copy.jpg', repeat('a', 64), 1234567890123456789, 1000, b_user, vb,
    81985529216486895);
  -- B uploads a re-encoded copy: different bytes, perceptual hash 2 bits away
  perform public.marketplace_gate_register_image(
    'media://public/marketplace-images/mkt-trust-t/b-reencoded.jpg', repeat('b', 64), 1234567890123456789 # 3, 1100, b_user, vb,
    81985529216486895);
  -- B uploads a merely SIMILAR picture: 5 bits away, one past the threshold
  perform public.marketplace_gate_register_image(
    'media://public/marketplace-images/mkt-trust-t/b-similar.jpg', repeat('f', 64), 1234567890123456789 # 7, 1100, b_user, vb,
    81985529216486895 # 3);
  -- B uploads an unrelated picture
  perform public.marketplace_gate_register_image(
    'media://public/marketplace-images/mkt-trust-t/b-own.jpg', repeat('c', 64), -1234567890123456789, 900, b_user, vb,
    1311768467463790320);
  v := public.marketplace_gate_image_matches(vb, 'mkt-trust-t-b-new', array[
    'media://public/marketplace-images/mkt-trust-t/b-copy.jpg',
    'media://public/marketplace-images/mkt-trust-t/b-reencoded.jpg',
    'media://public/marketplace-images/mkt-trust-t/b-similar.jpg',
    'media://public/marketplace-images/mkt-trust-t/b-own.jpg']);
  reset role;
  if not exists (select 1 from jsonb_array_elements(v) e
                 where e ->> 'ref' like '%b-copy.jpg' and e ->> 'relation' = 'other_seller') then
    raise warning 'VIOLATION O1: identical bytes from another seller not detected: %', v; violations := violations + 1;
  end if;
  if not exists (select 1 from jsonb_array_elements(v) e
                 where e ->> 'ref' like '%b-reencoded.jpg' and e ->> 'relation' = 'other_seller') then
    raise warning 'VIOLATION O2: a re-encoded copy from another seller not detected: %', v; violations := violations + 1;
  end if;
  if exists (select 1 from jsonb_array_elements(v) e where e ->> 'ref' like '%b-similar.jpg') then
    raise warning 'VIOLATION O2b: a merely similar picture (past the threshold) was flagged: %', v; violations := violations + 1;
  end if;
  if exists (select 1 from jsonb_array_elements(v) e where e ->> 'ref' like '%b-own.jpg') then
    raise warning 'VIOLATION O3: an unrelated picture was flagged: %', v; violations := violations + 1;
  end if;

  -- identical bytes are caught even when neither copy could be decoded (no
  -- perceptual hash): the byte hash alone is enough
  set local role service_role;
  perform public.marketplace_gate_register_image(
    'media://public/marketplace-images/mkt-trust-t/a-opaque.jpg', repeat('e', 64), null, 500, a_user, va);
  perform public.marketplace_gate_register_image(
    'media://public/marketplace-images/mkt-trust-t/b-opaque.jpg', repeat('e', 64), null, 500, b_user, vb);
  v := public.marketplace_gate_image_matches(vb, 'mkt-trust-t-b-new',
    array['media://public/marketplace-images/mkt-trust-t/b-opaque.jpg']);
  reset role;
  if not exists (select 1 from jsonb_array_elements(v) e
                 where e ->> 'ref' like '%b-opaque.jpg' and e ->> 'relation' = 'other_seller') then
    raise warning 'VIOLATION O3b: identical bytes without a perceptual hash not detected: %', v; violations := violations + 1;
  end if;

  -- THE ORIGINAL OWNER IS NOT THE ONE WHO GETS FLAGGED. Seller A registered this
  -- picture first; B copied it afterwards. From A's side it is only "already on
  -- another of my listings" — never "another seller's".
  set local role service_role;
  v := public.marketplace_gate_image_matches(va, 'mkt-trust-t-a-other',
    array['media://public/marketplace-images/mkt-trust-t/f1-cover.jpg']);
  reset role;
  if exists (select 1 from jsonb_array_elements(v) e where e ->> 'relation' in ('other_seller', 'foreign_ref'))
     or not exists (select 1 from jsonb_array_elements(v) e where e ->> 'relation' = 'same_seller') then
    raise warning 'VIOLATION O3c: the original owner was flagged for a copier''s upload: %', v; violations := violations + 1;
  end if;

  -- attaching the very object another store uploaded (a copied reference)
  set local role service_role;
  v := public.marketplace_gate_image_matches(vb, 'mkt-trust-t-b-new',
    array['media://public/marketplace-images/mkt-trust-t/f1-cover.jpg']);
  reset role;
  if not exists (select 1 from jsonb_array_elements(v) e
                 where e ->> 'ref' like '%f1-cover.jpg' and e ->> 'relation' = 'foreign_ref') then
    raise warning 'VIOLATION O3d: a copied image reference was not detected: %', v; violations := violations + 1;
  end if;

  -- PRECISION: two near-blank pictures (three structured cells each) have nothing
  -- to tell them apart, so their hashes are never treated as a match — a plain
  -- white-background shot must not be "the same picture" as every other one.
  set local role service_role;
  perform public.marketplace_gate_register_image(
    'media://public/marketplace-images/mkt-trust-t/a-blank.jpg', repeat('1', 64), 5, 400, a_user, va, 2);
  perform public.marketplace_gate_register_image(
    'media://public/marketplace-images/mkt-trust-t/b-blank.jpg', repeat('2', 64), 5, 410, b_user, vb, 2);
  -- half a hash is stored as no hash
  perform public.marketplace_gate_register_image(
    'media://public/marketplace-images/mkt-trust-t/b-half.jpg', repeat('3', 64), 1234567890123456789, 420, b_user, vb, null);
  v := public.marketplace_gate_image_matches(vb, 'mkt-trust-t-b-new', array[
    'media://public/marketplace-images/mkt-trust-t/b-blank.jpg',
    'media://public/marketplace-images/mkt-trust-t/b-half.jpg']);
  reset role;
  if exists (select 1 from jsonb_array_elements(v) e where e ->> 'ref' like '%b-blank.jpg') then
    raise warning 'VIOLATION O3e: two low-structure pictures were treated as the same picture: %', v; violations := violations + 1;
  end if;
  if exists (select 1 from jsonb_array_elements(v) e where e ->> 'ref' like '%b-half.jpg') then
    raise warning 'VIOLATION O3f: a half perceptual hash was used for matching: %', v; violations := violations + 1;
  end if;
  if exists (select 1 from public.marketplace_image_fingerprints f
             where f.ref like '%b-half.jpg' and (f.phash is not null or f.phash_aux is not null)) then
    raise warning 'VIOLATION O3f: a half perceptual hash was stored'; violations := violations + 1;
  end if;

  -- request roles cannot read or register fingerprints
  begin
    set local role authenticated;
    perform public.marketplace_gate_register_image('media://x', repeat('d', 64), 1, 1, a_user, va);
    reset role;
    raise warning 'VIOLATION O4: authenticated registered a fingerprint'; violations := violations + 1;
  exception when insufficient_privilege then
    reset role;
  end;

  -- ===== P. re-scan candidates =============================================
  -- A listing let through under engine version "test".
  set local role service_role;
  v := public.marketplace_gate_record_listing_verdict(
    a_user, va, public.mkt_trust_test_listing('mkt-trust-t-p1', 'Rescan kettle', 7000),
    '{}'::text[], 'publish', '{}'::text[], '{}'::jsonb, 'test');
  insert into public.marketplace_products (slug, vendor_id, title, summary, description, sku, base_price, approval_status)
    values ('mkt-trust-t-p1', va, 'Rescan kettle', 'A clean summary', 'A clean description', 'SKU-mkt-trust-t-p1', 7000, 'approved')
    returning id into v_pid;
  -- ...and one that is NOT live.
  insert into public.marketplace_products (slug, vendor_id, title, summary, description, sku, base_price, approval_status)
    values ('mkt-trust-t-p2', va, 'Rescan draft', 'A clean summary', 'A clean description', 'SKU-mkt-trust-t-p2', 7000, 'draft');
  reset role;

  set local role service_role;
  select count(*) into v_n from public.marketplace_gate_rescan_candidates('test', 500) c where c.slug = 'mkt-trust-t-p1';
  reset role;
  if v_n <> 0 then
    raise warning 'VIOLATION P1: a listing under the CURRENT engine version was offered for re-scan'; violations := violations + 1;
  end if;

  set local role service_role;
  select count(*) into v_n from public.marketplace_gate_rescan_candidates('test-2', 500) c
   where c.slug = 'mkt-trust-t-p1' and c.source = 'policy_engine' and c.engine_version = 'test'
     and c.origin = 'policy_engine';
  reset role;
  if v_n <> 1 then
    raise warning 'VIOLATION P2: a listing under an OLDER engine version was not offered for re-scan'; violations := violations + 1;
  end if;

  set local role service_role;
  select count(*) into v_n from public.marketplace_gate_rescan_candidates('test-2', 500) c where c.slug = 'mkt-trust-t-p2';
  reset role;
  if v_n <> 0 then
    raise warning 'VIOLATION P3: a listing that is not live was offered for re-scan'; violations := violations + 1;
  end if;

  -- ...including one that WAS live and has since been taken down: it has a
  -- consumed verdict on record, but it is not in front of buyers any more.
  set local role service_role;
  v := public.marketplace_gate_record_listing_verdict(
    a_user, va, public.mkt_trust_test_listing('mkt-trust-t-p3', 'Rescan lamp', 7100),
    '{}'::text[], 'publish', '{}'::text[], '{}'::jsonb, 'test');
  insert into public.marketplace_products (slug, vendor_id, title, summary, description, sku, base_price, approval_status)
    values ('mkt-trust-t-p3', va, 'Rescan lamp', 'A clean summary', 'A clean description', 'SKU-mkt-trust-t-p3', 7100, 'approved');
  update public.marketplace_products set approval_status = 'under_review' where slug = 'mkt-trust-t-p3';
  select count(*) into v_n from public.marketplace_gate_rescan_candidates('test-2', 500) c where c.slug = 'mkt-trust-t-p3';
  reset role;
  if v_n <> 0 then
    raise warning 'VIOLATION P3b: a listing that is no longer live was offered for re-scan'; violations := violations + 1;
  end if;

  -- A clean re-scan refreshes the standing verdict: it is not offered again.
  set local role service_role;
  perform public.marketplace_gate_record_rescan(v_pid, 'test-2');
  select count(*) into v_n from public.marketplace_gate_rescan_candidates('test-2', 500) c where c.slug = 'mkt-trust-t-p1';
  reset role;
  if v_n <> 0 then
    raise warning 'VIOLATION P4: a re-scanned listing was offered again'; violations := violations + 1;
  end if;

  -- After a clean re-scan the listing still remembers who ORIGINALLY approved it:
  -- at the next ruleset change it is offered again with that origin, not "rescan".
  set local role service_role;
  select count(*) into v_n from public.marketplace_gate_rescan_candidates('test-3', 500) c
   where c.slug = 'mkt-trust-t-p1' and c.source = 'rescan' and c.origin = 'policy_engine';
  reset role;
  if v_n <> 1 then
    raise warning 'VIOLATION P4b: the original approver was lost after a re-scan'; violations := violations + 1;
  end if;

  -- A listing a PERSON approved keeps that origin (the sweep must not auto-hide it).
  set local role service_role;
  select count(*) into v_n from public.marketplace_gate_rescan_candidates('test-3', 500) c
   where c.origin = 'staff_review';
  reset role;
  if v_n < 1 then
    raise warning 'VIOLATION P4c: no staff-approved listing reported its origin as staff_review'; violations := violations + 1;
  end if;

  -- The limit is honoured and never unbounded.
  set local role service_role;
  select count(*) into v_n from public.marketplace_gate_rescan_candidates('no-such-version', 1);
  reset role;
  if v_n > 1 then
    raise warning 'VIOLATION P5: the candidate limit was ignored (% rows for limit 1)', v_n; violations := violations + 1;
  end if;

  begin
    set local role authenticated;
    perform count(*) from public.marketplace_gate_rescan_candidates('test', 10);
    reset role;
    raise warning 'VIOLATION P6: authenticated listed re-scan candidates'; violations := violations + 1;
  exception when insufficient_privilege then
    reset role;
  end;


  -- ===== Q. adversarial round 1 =============================================
  -- ---- Q1. a listing's id never changes (take-downs and verdicts are keyed on it)
  set local role service_role;
  v := public.marketplace_gate_record_listing_verdict(
    a_user, va, public.mkt_trust_test_listing('mkt-trust-t-q1', 'Q1 clean', 1500),
    '{}'::text[], 'publish', '{}'::text[], '{}'::jsonb, 'test');
  insert into public.marketplace_products (slug, vendor_id, title, summary, description, sku, base_price, approval_status)
    values ('mkt-trust-t-q1', va, 'Q1 clean', 'A clean summary', 'A clean description', 'SKU-mkt-trust-t-q1', 1500, 'approved')
    returning id into v_q_pid;
  reset role;
  begin
    set local role service_role;
    update public.marketplace_products set id = 'c1000000-0000-4000-8000-000000000001' where id = v_q_pid;
    reset role;
    raise warning 'VIOLATION Q1: the id of a live listing was changed'; violations := violations + 1;
  exception when others then
    get stacked diagnostics v_hint = pg_exception_hint;
    reset role;
    if v_hint is distinct from 'listing_id_immutable' then
      raise warning 'VIOLATION Q1: wrong refusal: % (hint %)', sqlerrm, v_hint; violations := violations + 1;
    end if;
  end;
  begin
    set local role service_role;
    update public.marketplace_products set id = 'c1000000-0000-4000-8000-000000000002'
     where slug = 'mkt-trust-t-a2';
    reset role;
    raise warning 'VIOLATION Q1b: the id of a listing that is not live was changed'; violations := violations + 1;
  exception when others then
    get stacked diagnostics v_hint = pg_exception_hint;
    reset role;
    if v_hint is distinct from 'listing_id_immutable' then
      raise warning 'VIOLATION Q1b: wrong refusal: % (hint %)', sqlerrm, v_hint; violations := violations + 1;
    end if;
  end;

  -- ---- Q2. variants: buyer-visible, unscreened -> never the engine's to publish
  begin
    set local role service_role;
    insert into public.marketplace_product_variants (product_id, sku, options, price)
      values (v_q_pid, 'Q2-V1', '{"call_0803_555_0101":"pay outside"}'::jsonb, 5000000);
    reset role;
    raise warning 'VIOLATION Q2a: a variant was added to a live listing'; violations := violations + 1;
  exception when others then
    reset role;
    if sqlerrm not like 'marketplace_variant_guard:%' then
      raise warning 'VIOLATION Q2a: wrong error: %', sqlerrm; violations := violations + 1;
    end if;
  end;

  -- a listing that is not live may carry variants ...
  insert into public.marketplace_products (slug, vendor_id, title, summary, description, sku, base_price, approval_status)
    values ('mkt-trust-t-q2', va, 'Q2 with variants', 'A clean summary', 'A clean description', 'SKU-mkt-trust-t-q2', 1500, 'under_review')
    returning id into v_pid;
  -- ... the publish verdict is minted while it has none ...
  set local role service_role;
  v := public.marketplace_gate_record_listing_verdict(
    a_user, va, public.mkt_trust_test_listing('mkt-trust-t-q2', 'Q2 with variants', 1500),
    '{}'::text[], 'publish', '{}'::text[], '{}'::jsonb, 'test');
  insert into public.marketplace_product_variants (product_id, sku, options, price)
    values (v_pid, 'Q2-V1', '{"size":"L"}'::jsonb, 1500);
  reset role;
  if v ->> 'outcome' <> 'publish' then
    raise warning 'VIOLATION Q2b: fixture verdict was not publish: %', v; violations := violations + 1;
  end if;
  -- ... and the engine verdict can no longer publish it
  begin
    set local role service_role;
    update public.marketplace_products set approval_status = 'approved' where id = v_pid;
    reset role;
    raise warning 'VIOLATION Q2c: the engine published a listing that carries variants'; violations := violations + 1;
  exception when others then
    get stacked diagnostics v_hint = pg_exception_hint;
    reset role;
    if v_hint is distinct from 'variants_need_review' then
      raise warning 'VIOLATION Q2c: wrong refusal: % (hint %)', sqlerrm, v_hint; violations := violations + 1;
    end if;
  end;
  -- the RPC says so up front: a person decides
  set local role service_role;
  v := public.marketplace_gate_record_listing_verdict(
    a_user, va, public.mkt_trust_test_listing('mkt-trust-t-q2', 'Q2 with variants', 1500),
    '{}'::text[], 'publish', '{}'::text[], '{}'::jsonb, 'test');
  reset role;
  if v ->> 'outcome' <> 'hold' or not (v -> 'reasons' ? 'gate_unavailable') then
    raise warning 'VIOLATION Q2d: the RPC did not hold a listing with variants: %', v; violations := violations + 1;
  end if;
  -- a person can approve it; afterwards its variants are frozen, its stock is not
  begin
    set local role service_role;
    update public.marketplace_products
       set approval_status = 'approved', reviewed_by = staff, reviewed_at = now()
     where id = v_pid;
    reset role;
  exception when others then
    reset role;
    raise warning 'VIOLATION Q2e: staff could not approve a listing with variants: %', sqlerrm; violations := violations + 1;
  end;
  select count(*) into v_n from public.marketplace_listing_gate_verdicts
   where product_id = v_pid and source = 'staff_review' and transition = 'go_live' and actor_user_id = staff;
  if v_n <> 1 then
    raise warning 'VIOLATION Q2e2: the approval of a listing with variants is not on record as a staff decision (found %)', v_n;
    violations := violations + 1;
  end if;
  begin
    set local role service_role;
    update public.marketplace_product_variants set price = 9, options = '{"size":"call 0803 555 0101"}'::jsonb
     where product_id = v_pid;
    reset role;
    raise warning 'VIOLATION Q2f: a live listing''s variant content was changed'; violations := violations + 1;
  exception when others then
    reset role;
    if sqlerrm not like 'marketplace_variant_guard:%' then
      raise warning 'VIOLATION Q2f: wrong error: %', sqlerrm; violations := violations + 1;
    end if;
  end;
  begin
    set local role service_role;
    update public.marketplace_product_variants set stock = 7, status = 'out_of_stock' where product_id = v_pid;
    reset role;
  exception when others then
    reset role;
    raise warning 'VIOLATION Q2g: a stock-only variant update was refused: %', sqlerrm; violations := violations + 1;
  end;
  -- moving a variant onto a live listing is the same as adding one
  insert into public.marketplace_products (slug, vendor_id, title, sku, base_price, approval_status)
    values ('mkt-trust-t-q2-donor', va, 'Q2 donor', 'SKU-mkt-trust-t-q2-donor', 1500, 'draft')
    returning id into v_id;
  insert into public.marketplace_product_variants (product_id, sku, options, price)
    values (v_id, 'Q2-DONOR', '{"note":"pay outside"}'::jsonb, 1);
  begin
    set local role service_role;
    update public.marketplace_product_variants set product_id = v_q_pid where sku = 'Q2-DONOR';
    reset role;
    raise warning 'VIOLATION Q2h: a variant was moved onto a live listing'; violations := violations + 1;
  exception when others then
    reset role;
    if sqlerrm not like 'marketplace_variant_guard:%' then
      raise warning 'VIOLATION Q2h: wrong error: %', sqlerrm; violations := violations + 1;
    end if;
  end;

  -- ---- Q3. a trigger that runs AFTER the guard cannot smuggle content past it
  begin
    set local role service_role;
    execute 'create function pg_temp.mkt_trust_t_evil() returns trigger language plpgsql as $f$ begin return new; end $f$';
    execute 'create trigger zz_mkt_trust_t_evil before update on public.marketplace_products
               for each row execute function pg_temp.mkt_trust_t_evil()';
    reset role;
    execute 'drop trigger if exists zz_mkt_trust_t_evil on public.marketplace_products';
    raise warning 'VIOLATION Q3a: service_role created a trigger on the guarded table'; violations := violations + 1;
  exception when insufficient_privilege then
    reset role;
  end;
  if has_table_privilege('service_role', 'public.marketplace_products', 'TRIGGER')
     or has_table_privilege('authenticated', 'public.marketplace_products', 'TRIGGER')
     or has_table_privilege('anon', 'public.marketplace_products', 'TRUNCATE')
     or has_table_privilege('service_role', 'public.marketplace_product_variants', 'TRIGGER')
     or has_table_privilege('service_role', 'public.marketplace_product_media', 'TRIGGER')
     or has_table_privilege('service_role', 'public.marketplace_payout_requests', 'TRIGGER')
  then
    raise warning 'VIOLATION Q3b: a request role still holds TRIGGER/TRUNCATE on a guarded table'; violations := violations + 1;
  end if;

  -- Even a trigger the OWNER adds later (a future migration) cannot do it: it sorts
  -- after the guard, rewrites the row, and the AFTER trigger refuses the result.
  create function public.mkt_trust_t_rewrite() returns trigger language plpgsql as $f$
  begin
    if new.slug = 'mkt-trust-t-q3' then
      new.title := 'REWRITTEN AFTER THE GUARD - call 0803 555 0101';
    end if;
    return new;
  end $f$;
  create trigger zz_mkt_trust_t_rewrite before insert or update on public.marketplace_products
    for each row execute function public.mkt_trust_t_rewrite();
  begin
    set local role service_role;
    v := public.marketplace_gate_record_listing_verdict(
      a_user, va, public.mkt_trust_test_listing('mkt-trust-t-q3', 'Q3 clean', 1500),
      '{}'::text[], 'publish', '{}'::text[], '{}'::jsonb, 'test');
    insert into public.marketplace_products (slug, vendor_id, title, summary, description, sku, base_price, approval_status)
      values ('mkt-trust-t-q3', va, 'Q3 clean', 'A clean summary', 'A clean description', 'SKU-mkt-trust-t-q3', 1500, 'approved');
    reset role;
    raise warning 'VIOLATION Q3c: content rewritten after the guard went live'; violations := violations + 1;
  exception when others then
    reset role;
    if sqlerrm not like 'marketplace_publish_guard:%' then
      raise warning 'VIOLATION Q3c: wrong error: %', sqlerrm; violations := violations + 1;
    end if;
  end;
  -- ... and the same for a live row touched by an innocent stock update
  drop trigger zz_mkt_trust_t_rewrite on public.marketplace_products;
  create or replace function public.mkt_trust_t_rewrite() returns trigger language plpgsql as $f$
  begin
    if new.slug = 'mkt-trust-t-q1' then
      new.title := 'REWRITTEN AFTER THE GUARD - call 0803 555 0101';
    end if;
    return new;
  end $f$;
  create trigger zz_mkt_trust_t_rewrite before insert or update on public.marketplace_products
    for each row execute function public.mkt_trust_t_rewrite();
  begin
    set local role service_role;
    update public.marketplace_products set total_stock = coalesce(total_stock, 0) + 1 where id = v_q_pid;
    reset role;
    raise warning 'VIOLATION Q3d: a stock update carried rewritten content onto a live listing'; violations := violations + 1;
  exception when others then
    reset role;
    if sqlerrm not like 'marketplace_publish_guard:%' then
      raise warning 'VIOLATION Q3d: wrong error: %', sqlerrm; violations := violations + 1;
    end if;
  end;
  drop trigger zz_mkt_trust_t_rewrite on public.marketplace_products;
  drop function public.mkt_trust_t_rewrite();
  select title into v_text from public.marketplace_products where id = v_q_pid;
  if v_text <> 'Q1 clean' then
    raise warning 'VIOLATION Q3e: the live listing was rewritten: %', v_text; violations := violations + 1;
  end if;

  -- ---- Q4. one multi-row write cannot walk past the daily cap
  insert into public.marketplace_vendor_applications
    (user_id, normalized_email, store_name, proposed_store_slug, legal_name, status, agreement_accepted_at)
  values
    (q_inst, 'q-instant@mkt-trust.test', 'Q Instant', 'mkt-trust-t-q-instant', 'Q Ltd', 'submitted', now())
  returning id into v_app;
  set local role service_role;
  v := public.marketplace_gate_instant_onboard(q_inst, v_app, '{}'::text[], '{}'::jsonb, 'test', public.mkt_trust_test_profile_hash(v_app));
  reset role;
  v_q_vendor := (v ->> 'vendor_id')::uuid;
  update public.marketplace_vendors set seller_tier = 'partner' where id = v_q_vendor;
  select count(*) into v_n from public.marketplace_seller_probation
   where vendor_id = v_q_vendor and source = 'instant_onboarding' and onboarding_verdict_id is not null;
  if v_n <> 1 then
    raise warning 'VIOLATION Q4a: the instant store''s probation row is not an instant_onboarding one'; violations := violations + 1;
  end if;
  set local role service_role;
  for i in 1..6 loop
    v := public.marketplace_gate_record_listing_verdict(
      q_inst, v_q_vendor, public.mkt_trust_test_listing('mkt-trust-t-q4-' || i, 'Q4 item ' || i, 2000),
      '{}'::text[], 'publish', '{}'::text[], '{}'::jsonb, 'test');
  end loop;
  reset role;
  begin
    set local role service_role;
    insert into public.marketplace_products (slug, vendor_id, title, summary, description, sku, base_price, approval_status)
    select 'mkt-trust-t-q4-' || g, v_q_vendor, 'Q4 item ' || g, 'A clean summary', 'A clean description',
           'SKU-mkt-trust-t-q4-' || g, 2000, 'approved'
      from generate_series(1, 6) g;
    reset role;
    raise warning 'VIOLATION Q4b: six listings went live in one statement on a five-a-day cap'; violations := violations + 1;
  exception when others then
    get stacked diagnostics v_hint = pg_exception_hint;
    reset role;
    if v_hint is distinct from 'probation_daily_cap' then
      raise warning 'VIOLATION Q4b: wrong refusal: % (hint %)', sqlerrm, v_hint; violations := violations + 1;
    end if;
  end;
  begin
    set local role service_role;
    insert into public.marketplace_products (slug, vendor_id, title, summary, description, sku, base_price, approval_status)
    select 'mkt-trust-t-q4-' || g, v_q_vendor, 'Q4 item ' || g, 'A clean summary', 'A clean description',
           'SKU-mkt-trust-t-q4-' || g, 2000, 'approved'
      from generate_series(1, 5) g;
    reset role;
  exception when others then
    reset role;
    raise warning 'VIOLATION Q4c: five listings in one statement were refused: %', sqlerrm; violations := violations + 1;
  end;

  -- ---- Q5. every store opened after the gate is on probation, with the payout wall —
  --          whoever opened it, and whatever its application says about documents
  insert into public.marketplace_vendor_applications
    (user_id, normalized_email, store_name, proposed_store_slug, legal_name, status, agreement_accepted_at, documents_json)
  values
    (q_nodocs, 'q-nodocs@mkt-trust.test', 'Q No Docs', 'mkt-trust-t-q-nodocs', 'Q Ltd', 'submitted', now(), '{}'::jsonb),
    (q_docs, 'q-withdocs@mkt-trust.test', 'Q With Docs', 'mkt-trust-t-q-withdocs', 'Q Ltd', 'submitted', now(),
     '{"founderIdentity":{"fileUrl":"media://private/docs/id.pdf"},"payoutProof":{"fileUrl":"media://private/docs/bank.pdf"}}'::jsonb);
  -- the legacy human approval: the console writes the store row itself
  set local role service_role;
  insert into public.marketplace_vendors (slug, name, owner_user_id, owner_type, status)
    values ('mkt-trust-t-q-nodocs', 'Q No Docs', q_nodocs, 'vendor', 'approved') returning id into v_id;
  reset role;
  select count(*) into v_n from public.marketplace_seller_probation
   where vendor_id = v_id and source = 'staff_approved' and owner_user_id = q_nodocs and graduated_at is null;
  if v_n <> 1 then
    raise warning 'VIOLATION Q5a: a store a person approved is not on probation'; violations := violations + 1;
  end if;
  begin
    set local role service_role;
    insert into public.marketplace_payout_requests (reference, vendor_id, amount, status, requested_by)
      values ('MKT-TRUST-T-Q5', v_id, 1000, 'requested', q_nodocs);
    reset role;
    raise warning 'VIOLATION Q5b: a new store filed a payout request with no verified identity'; violations := violations + 1;
  exception when others then
    reset role;
    if sqlerrm not like 'marketplace_payout_identity_guard:%' then
      raise warning 'VIOLATION Q5b: wrong error: %', sqlerrm; violations := violations + 1;
    end if;
  end;
  -- "documents" on the application are a claim nobody reviewed: they exempt nothing
  set local role service_role;
  insert into public.marketplace_vendors (slug, name, owner_user_id, owner_type, status)
    values ('mkt-trust-t-q-withdocs', 'Q With Docs', q_docs, 'vendor', 'approved') returning id into v_id;
  reset role;
  select count(*) into v_n from public.marketplace_seller_probation where vendor_id = v_id and graduated_at is null;
  if v_n <> 1 then
    raise warning 'VIOLATION Q5c: document strings on the application exempted a new store from probation'; violations := violations + 1;
  end if;
  begin
    set local role service_role;
    insert into public.marketplace_payout_requests (reference, vendor_id, amount, status, requested_by)
      values ('MKT-TRUST-T-Q5C', v_id, 1000, 'requested', q_docs);
    reset role;
    raise warning 'VIOLATION Q5d: document strings on the application opened the payout wall'; violations := violations + 1;
  exception when others then
    reset role;
    if sqlerrm not like 'marketplace_payout_identity_guard:%' then
      raise warning 'VIOLATION Q5d: wrong error: %', sqlerrm; violations := violations + 1;
    end if;
  end;
  -- a store that existed before the gate keeps working as it did (the flag-off flow)
  begin
    set local role service_role;
    insert into public.marketplace_payout_requests (reference, vendor_id, amount, status, requested_by)
      values ('MKT-TRUST-T-Q5E', va, 1000, 'requested', a_user);
    update public.marketplace_payout_requests
       set status = 'approved', reviewed_by = staff, reviewed_at = now() where reference = 'MKT-TRUST-T-Q5E';
    update public.marketplace_payout_requests set status = 'released' where reference = 'MKT-TRUST-T-Q5E';
    reset role;
  exception when others then
    reset role;
    raise warning 'VIOLATION Q5e: a store from before the gate was refused its payout: %', sqlerrm; violations := violations + 1;
  end;

  -- ---- Q6. a payout request cannot be re-pointed past the wall
  begin
    set local role service_role;
    update public.marketplace_payout_requests set vendor_id = v_q_vendor where reference = 'MKT-TRUST-T-Q5E';
    reset role;
    raise warning 'VIOLATION Q6a: an open payout request was re-pointed to an unverified probation store'; violations := violations + 1;
  exception when others then
    reset role;
    if sqlerrm not like 'marketplace_payout_identity_guard:%' then
      raise warning 'VIOLATION Q6a: wrong error: %', sqlerrm; violations := violations + 1;
    end if;
  end;
  begin
    set local role service_role;
    update public.marketplace_payout_requests set review_note = 'looked at' where reference = 'MKT-TRUST-T-Q5E';
    reset role;
  exception when others then
    reset role;
    raise warning 'VIOLATION Q6b: an unrelated update of a payout request was refused: %', sqlerrm; violations := violations + 1;
  end;

  -- ---- Q7. submitting again does not undo a person's decision
  insert into public.marketplace_vendor_applications
    (user_id, normalized_email, store_name, proposed_store_slug, legal_name, status, agreement_accepted_at,
     reviewed_at, reviewed_by, review_note)
  values
    (q_reject, 'q-rejected@mkt-trust.test', 'Q Rejected', 'mkt-trust-t-q-rejected', 'Q Ltd', 'submitted', now(),
     now() - interval '1 day', staff, 'Rejected by a person yesterday')
  returning id into v_app;
  begin
    set local role service_role;
    perform public.marketplace_gate_instant_onboard(q_reject, v_app, '{}'::text[], '{}'::jsonb, 'test', public.mkt_trust_test_profile_hash(v_app));
    reset role;
    raise warning 'VIOLATION Q7a: an application a person had decided was opened instantly on re-submit'; violations := violations + 1;
  exception when others then
    get stacked diagnostics v_hint = pg_exception_hint;
    reset role;
    if v_hint is distinct from 'prior_human_decision' then
      raise warning 'VIOLATION Q7a: wrong refusal: % (hint %)', sqlerrm, v_hint; violations := violations + 1;
    end if;
  end;
  select count(*) into v_n from public.marketplace_vendors where owner_user_id = q_reject;
  if v_n <> 0 then
    raise warning 'VIOLATION Q7b: a store exists for the rejected applicant'; violations := violations + 1;
  end if;

  -- ---- Q8. an account that already owns a store leaves nothing in the staff queue
  insert into public.marketplace_vendor_applications
    (user_id, normalized_email, store_name, proposed_store_slug, legal_name, status, agreement_accepted_at)
  values
    (q_inst, 'q-instant@mkt-trust.test', 'Q Instant Again', 'mkt-trust-t-q-instant-2', 'Q Ltd', 'submitted', now())
  returning id into v_app;
  set local role service_role;
  v := public.marketplace_gate_instant_onboard(q_inst, v_app, '{}'::text[], '{}'::jsonb, 'test', public.mkt_trust_test_profile_hash(v_app));
  reset role;
  select status into v_text from public.marketplace_vendor_applications where id = v_app;
  if v ->> 'why' <> 'already_seller' or v_text <> 'approved' or v ->> 'vendor_status' is null then
    raise warning 'VIOLATION Q8: already_seller left the application as "%" in the queue: %', v_text, v; violations := violations + 1;
  end if;


  -- ===== R. adversarial round 2 =============================================
  -- ---- R1. a store never changes hands, and never becomes company inventory, by an UPDATE
  begin
    set local role service_role;
    -- the legacy approval's write: an upsert on the handle, naming ANOTHER owner
    insert into public.marketplace_vendors (slug, name, owner_user_id, owner_type, status)
      values ('mkt-trust-t-store-b', 'Taken over', q_reject, 'vendor', 'approved')
      on conflict (slug) do update
        set name = excluded.name, owner_user_id = excluded.owner_user_id, owner_type = excluded.owner_type, status = excluded.status;
    reset role;
    raise warning 'VIOLATION R1a: an upsert on the handle handed a store to another account'; violations := violations + 1;
  exception when others then
    get stacked diagnostics v_hint = pg_exception_hint;
    reset role;
    if v_hint is distinct from 'store_owner_immutable' then
      raise warning 'VIOLATION R1a: wrong refusal: % (hint %)', sqlerrm, v_hint; violations := violations + 1;
    end if;
  end;
  begin
    set local role service_role;
    update public.marketplace_vendors set owner_user_id = null where id = vb;
    reset role;
    raise warning 'VIOLATION R1b: a store''s owner was removed'; violations := violations + 1;
  exception when others then
    reset role;
    if sqlerrm not like 'marketplace_vendor_guard:%' then
      raise warning 'VIOLATION R1b: wrong error: %', sqlerrm; violations := violations + 1;
    end if;
  end;
  begin
    set local role service_role;
    update public.marketplace_vendors set owner_type = 'company' where id = vb;
    reset role;
    raise warning 'VIOLATION R1c: a seller''s store was turned into a company store'; violations := violations + 1;
  exception when others then
    get stacked diagnostics v_hint = pg_exception_hint;
    reset role;
    if v_hint is distinct from 'store_type_immutable' then
      raise warning 'VIOLATION R1c: wrong refusal: % (hint %)', sqlerrm, v_hint; violations := violations + 1;
    end if;
  end;
  -- the same owner being written again (a re-approval of their own application) is fine
  begin
    set local role service_role;
    insert into public.marketplace_vendors (slug, name, owner_user_id, owner_type, status)
      values ('mkt-trust-t-store-b', 'Store B', b_user, 'vendor', 'approved')
      on conflict (slug) do update
        set name = excluded.name, owner_user_id = excluded.owner_user_id, owner_type = excluded.owner_type, status = excluded.status;
    reset role;
  exception when others then
    reset role;
    raise warning 'VIOLATION R1d: the owner''s own re-approval was refused: %', sqlerrm; violations := violations + 1;
  end;
  select count(*) into v_n from public.marketplace_seller_probation where vendor_id = vb;
  if v_n <> 0 then
    raise warning 'VIOLATION R1e: re-writing an unchanged owner put a store from before the gate on probation'; violations := violations + 1;
  end if;

  -- ---- R2. a store that GETS an owner later is enrolled then (not only at INSERT)
  set local role service_role;
  insert into public.marketplace_vendors (slug, name, owner_user_id, owner_type, status)
    values ('mkt-trust-t-r2-late', 'R2 Late Owner', null, 'vendor', 'approved') returning id into v_id;
  reset role;
  select count(*) into v_n from public.marketplace_seller_probation where vendor_id = v_id;
  if v_n <> 0 then
    raise warning 'VIOLATION R2a: an ownerless store has a probation row'; violations := violations + 1;
  end if;
  begin
    set local role service_role;
    insert into public.marketplace_payout_requests (reference, vendor_id, amount, status)
      values ('MKT-TRUST-T-R2A', v_id, 1000, 'requested');
    reset role;
    raise warning 'VIOLATION R2b: a store with no owner filed a payout request'; violations := violations + 1;
  exception when others then
    reset role;
    if sqlerrm not like 'marketplace_payout_identity_guard:%' then
      raise warning 'VIOLATION R2b: wrong error: %', sqlerrm; violations := violations + 1;
    end if;
  end;
  -- an owner-less store is never handed to an account (an owner is set only when a store is created)
  begin
    set local role service_role;
    update public.marketplace_vendors set owner_user_id = outsider where id = v_id;
    reset role;
    raise warning 'VIOLATION R2c: an owner-less store was handed to an account'; violations := violations + 1;
  exception when others then
    get stacked diagnostics v_hint = pg_exception_hint;
    reset role;
    if v_hint is distinct from 'store_owner_immutable' then
      raise warning 'VIOLATION R2c: wrong refusal: % (hint %)', sqlerrm, v_hint; violations := violations + 1;
    end if;
  end;
  -- deleting the account that owns a store is allowed: the store becomes nobody's
  insert into auth.users (id, email) values ('a1000000-0000-4000-8000-000000000010', 'r2-leaver@mkt-trust.test')
    on conflict (id) do nothing;
  set local role service_role;
  insert into public.marketplace_vendors (slug, name, owner_user_id, owner_type, status)
    values ('mkt-trust-t-r2-leaver', 'R2 Leaver', 'a1000000-0000-4000-8000-000000000010', 'vendor', 'approved')
    returning id into v_id;
  reset role;
  begin
    delete from auth.users where id = 'a1000000-0000-4000-8000-000000000010';
  exception when others then
    raise warning 'VIOLATION R2d: deleting an account that owns a store was refused: %', sqlerrm; violations := violations + 1;
  end;
  select count(*) into v_n from public.marketplace_vendors where id = v_id and owner_user_id is null;
  if v_n <> 1 then
    raise warning 'VIOLATION R2d2: the deleted account''s store did not become owner-less'; violations := violations + 1;
  end if;
  -- the company's own store is never handed to a seller, nor turned into a seller's store
  begin
    set local role service_role;
    update public.marketplace_vendors set owner_user_id = collider where id = vc;
    reset role;
    raise warning 'VIOLATION R2e: the company store was handed to an account'; violations := violations + 1;
  exception when others then
    get stacked diagnostics v_hint = pg_exception_hint;
    reset role;
    if v_hint is distinct from 'store_owner_immutable' then
      raise warning 'VIOLATION R2e: wrong refusal: % (hint %)', sqlerrm, v_hint; violations := violations + 1;
    end if;
  end;
  begin
    set local role service_role;
    update public.marketplace_vendors set owner_type = 'vendor' where id = vc;
    reset role;
    raise warning 'VIOLATION R2f: the company store was turned into a seller''s store'; violations := violations + 1;
  exception when others then
    get stacked diagnostics v_hint = pg_exception_hint;
    reset role;
    if v_hint is distinct from 'store_type_immutable' then
      raise warning 'VIOLATION R2f: wrong refusal: % (hint %)', sqlerrm, v_hint; violations := violations + 1;
    end if;
  end;
  -- the payout facts say which stores are the company's (they are not asked for an identity)
  set local role service_role;
  v := public.marketplace_gate_payout_eligibility(vc);
  reset role;
  if (v ->> 'company_store')::boolean is not true then
    raise warning 'VIOLATION R2g: the payout facts do not mark the company store: %', v; violations := violations + 1;
  end if;

  -- ---- R3. the waiver belongs to the owner it was given to, and is not writable
  begin
    set local role service_role;
    insert into public.marketplace_seller_identity_waivers (vendor_id, owner_user_id) values (v_q_vendor, q_inst);
    reset role;
    raise warning 'VIOLATION R3a: service_role wrote an identity waiver'; violations := violations + 1;
  exception when insufficient_privilege then
    reset role;
  end;
  -- (as the table owner, to stand for history: a waiver recorded for someone who is no longer the owner)
  insert into public.marketplace_seller_identity_waivers (vendor_id, owner_user_id) values (v_q_vendor, staff);
  begin
    set local role service_role;
    insert into public.marketplace_payout_requests (reference, vendor_id, amount, status, requested_by)
      values ('MKT-TRUST-T-R3B', v_q_vendor, 1000, 'requested', q_inst);
    reset role;
    raise warning 'VIOLATION R3b: a waiver recorded for another account opened the payout wall'; violations := violations + 1;
  exception when others then
    reset role;
    if sqlerrm not like 'marketplace_payout_identity_guard:%' then
      raise warning 'VIOLATION R3b: wrong error: %', sqlerrm; violations := violations + 1;
    end if;
  end;
  delete from public.marketplace_seller_identity_waivers where vendor_id = v_q_vendor;

  -- ---- R4. a payout status is read as a person would read it
  foreach v_text in array array['Requested', ' requested', 'REQUESTED', 'approved ', 'Released', 'paid', 'pending']
  loop
    begin
      set local role service_role;
      insert into public.marketplace_payout_requests (reference, vendor_id, amount, status, requested_by)
        values ('MKT-TRUST-T-R4-' || md5(v_text), v_q_vendor, 1000, v_text, q_inst);
      reset role;
      raise warning 'VIOLATION R4a: a payout request with status "%" passed the identity wall', v_text; violations := violations + 1;
    exception when others then
      reset role;
      if sqlerrm not like 'marketplace_payout_identity_guard:%' then
        raise warning 'VIOLATION R4a: wrong error for "%": %', v_text, sqlerrm; violations := violations + 1;
      end if;
    end;
  end loop;
  -- a closed status is read as a person reads it too: "Frozen" is frozen, and moves no money
  begin
    set local role service_role;
    insert into public.marketplace_payout_requests (reference, vendor_id, amount, status, requested_by)
      values ('MKT-TRUST-T-R4D', v_q_vendor, 1000, ' Frozen', q_inst);
    reset role;
  exception when others then
    reset role;
    raise warning 'VIOLATION R4d: a closed request written " Frozen" was refused: %', sqlerrm; violations := violations + 1;
  end;
  -- a closed request is not a payout: it can be recorded and then cannot be reopened past the wall
  begin
    set local role service_role;
    insert into public.marketplace_payout_requests (reference, vendor_id, amount, status, requested_by)
      values ('MKT-TRUST-T-R4B', v_q_vendor, 1000, 'frozen', q_inst);
    reset role;
  exception when others then
    reset role;
    raise warning 'VIOLATION R4b: a frozen request could not be recorded: %', sqlerrm; violations := violations + 1;
  end;
  begin
    set local role service_role;
    update public.marketplace_payout_requests set status = 'Requested' where reference = 'MKT-TRUST-T-R4B';
    reset role;
    raise warning 'VIOLATION R4c: a frozen request was reopened as "Requested" past the wall'; violations := violations + 1;
  exception when others then
    reset role;
    if sqlerrm not like 'marketplace_payout_identity_guard:%' then
      raise warning 'VIOLATION R4c: wrong error: %', sqlerrm; violations := violations + 1;
    end if;
  end;

  -- ---- R5. a person's rejection binds the engine
  set local role service_role;
  v := public.marketplace_gate_record_listing_verdict(
    a_user, va, public.mkt_trust_test_listing('mkt-trust-t-r5', 'R5 clean', 1500),
    '{}'::text[], 'publish', '{}'::text[], '{}'::jsonb, 'test');
  insert into public.marketplace_products (slug, vendor_id, title, summary, description, sku, base_price, approval_status)
    values ('mkt-trust-t-r5', va, 'R5 clean', 'A clean summary', 'A clean description', 'SKU-mkt-trust-t-r5', 1500, 'approved')
    returning id into v_pid;
  -- a bare status write is not a person's decision: it records nothing
  update public.marketplace_products set approval_status = 'rejected' where id = v_pid;
  reset role;
  select count(*) into v_n from public.marketplace_listing_enforcement where product_id = v_pid;
  if v_n <> 0 then
    raise warning 'VIOLATION R5a: a rejection with no reviewer was recorded as a staff decision'; violations := violations + 1;
  end if;
  -- ... nor is one stamped with an account that is not marketplace staff
  set local role service_role;
  update public.marketplace_products set approval_status = 'draft' where id = v_pid;
  update public.marketplace_products
     set approval_status = 'rejected', reviewed_by = outsider, reviewed_at = clock_timestamp()
   where id = v_pid;
  reset role;
  select count(*) into v_n from public.marketplace_listing_enforcement where product_id = v_pid;
  if v_n <> 0 then
    raise warning 'VIOLATION R5a2: a rejection stamped by a non-staff account was recorded as a person''s decision'; violations := violations + 1;
  end if;
  -- ... so the engine may still publish it (nothing a person decided stands against it)
  set local role service_role;
  v := public.marketplace_gate_record_listing_verdict(
    a_user, va, public.mkt_trust_test_listing('mkt-trust-t-r5', 'R5 clean', 1500),
    '{}'::text[], 'publish', '{}'::text[], '{}'::jsonb, 'test');
  update public.marketplace_products set approval_status = 'approved' where id = v_pid;
  -- a publish verdict for the same content is minted while nothing stands against it ...
  v := public.marketplace_gate_record_listing_verdict(
    a_user, va, public.mkt_trust_test_listing('mkt-trust-t-r5', 'R5 clean', 1500),
    '{}'::text[], 'publish', '{}'::text[], '{}'::jsonb, 'test');
  -- ... and then a real staff rejection
  update public.marketplace_products
     set approval_status = 'rejected', reviewed_by = staff, reviewed_at = clock_timestamp()
   where id = v_pid;
  reset role;
  select count(*) into v_n from public.marketplace_listing_enforcement
   where product_id = v_pid and kind = 'staff_decision' and status = 'upheld' and resolved_by = staff and slug = 'mkt-trust-t-r5';
  if v_n <> 1 then
    raise warning 'VIOLATION R5b: a staff rejection is not on record as a binding decision (found %)', v_n; violations := violations + 1;
  end if;
  set local role service_role;
  v := public.marketplace_gate_record_listing_verdict(
    a_user, va, public.mkt_trust_test_listing('mkt-trust-t-r5', 'R5 clean', 1500),
    '{}'::text[], 'publish', '{}'::text[], '{}'::jsonb, 'test');
  reset role;
  if v ->> 'outcome' <> 'hold' or not (v -> 'reasons' ? 'enforcement_hold_active') then
    raise warning 'VIOLATION R5c: the engine would republish a listing a person rejected: %', v; violations := violations + 1;
  end if;
  -- even with a publish verdict in hand (minted before the rejection), the guard refuses
  begin
    set local role service_role;
    update public.marketplace_products set approval_status = 'approved' where id = v_pid;
    reset role;
    raise warning 'VIOLATION R5d: a rejected listing went live again with no person approving it'; violations := violations + 1;
  exception when others then
    get stacked diagnostics v_hint = pg_exception_hint;
    reset role;
    if v_hint is distinct from 'enforcement_hold_active' then
      raise warning 'VIOLATION R5d: wrong refusal: % (hint %)', sqlerrm, v_hint; violations := violations + 1;
    end if;
  end;
  -- deleting the row and creating it again under the same handle does not shed the decision
  set local role service_role;
  delete from public.marketplace_products where id = v_pid;
  v := public.marketplace_gate_record_listing_verdict(
    a_user, va, public.mkt_trust_test_listing('mkt-trust-t-r5', 'R5 clean', 1500),
    '{}'::text[], 'publish', '{}'::text[], '{}'::jsonb, 'test');
  reset role;
  if v ->> 'outcome' <> 'hold' then
    raise warning 'VIOLATION R5e: delete + re-create shed a person''s decision (RPC): %', v; violations := violations + 1;
  end if;
  begin
    set local role service_role;
    insert into public.marketplace_products (slug, vendor_id, title, summary, description, sku, base_price, approval_status)
      values ('mkt-trust-t-r5', va, 'R5 clean', 'A clean summary', 'A clean description', 'SKU-mkt-trust-t-r5', 1500, 'approved');
    reset role;
    raise warning 'VIOLATION R5f: delete + re-create shed a person''s decision (guard)'; violations := violations + 1;
  exception when others then
    reset role;
    if sqlerrm not like 'marketplace_publish_guard:%' then
      raise warning 'VIOLATION R5f: wrong error: %', sqlerrm; violations := violations + 1;
    end if;
  end;
  -- a person can still approve it, and that settles the decision
  set local role service_role;
  insert into public.marketplace_products (slug, vendor_id, title, summary, description, sku, base_price, approval_status)
    values ('mkt-trust-t-r5', va, 'R5 clean', 'A clean summary', 'A clean description', 'SKU-mkt-trust-t-r5', 1500, 'under_review')
    returning id into v_pid;
  update public.marketplace_products
     set approval_status = 'approved', reviewed_by = staff, reviewed_at = clock_timestamp()
   where id = v_pid;
  reset role;
  select count(*) into v_n from public.marketplace_listing_enforcement
   where vendor_id = va and slug = 'mkt-trust-t-r5' and status in ('active', 'upheld');
  if v_n <> 0 then
    raise warning 'VIOLATION R5g: a staff approval left % decision(s) standing against the listing', v_n; violations := violations + 1;
  end if;
  -- "changes requested" by a person binds the same way
  set local role service_role;
  update public.marketplace_products
     set approval_status = 'changes_requested', reviewed_by = staff, reviewed_at = clock_timestamp()
   where id = v_pid;
  v := public.marketplace_gate_record_listing_verdict(
    a_user, va, public.mkt_trust_test_listing('mkt-trust-t-r5', 'R5 clean', 1500),
    '{}'::text[], 'publish', '{}'::text[], '{}'::jsonb, 'test');
  reset role;
  if v ->> 'outcome' <> 'hold' then
    raise warning 'VIOLATION R5h: a listing a person sent back for changes was publishable by the engine: %', v; violations := violations + 1;
  end if;

  -- ---- R6. the same item listed again under another handle (same picture) is held too
  set local role service_role;
  v := public.marketplace_gate_record_listing_verdict(
    a_user, va, public.mkt_trust_test_listing('mkt-trust-t-r6', 'R6 clean', 1500),
    array['media://public/marketplace-images/mkt-trust-t/r6-cover.jpg'], 'publish', '{}'::text[], '{}'::jsonb, 'test');
  insert into public.marketplace_products (slug, vendor_id, title, summary, description, sku, base_price, approval_status)
    values ('mkt-trust-t-r6', va, 'R6 clean', 'A clean summary', 'A clean description', 'SKU-mkt-trust-t-r6', 1500, 'approved')
    returning id into v_pid;
  insert into public.marketplace_product_media (product_id, url, kind, is_primary, sort_order)
    values (v_pid, 'media://public/marketplace-images/mkt-trust-t/r6-cover.jpg', 'image', true, 0);
  v := public.marketplace_gate_hide_listing(v_pid, 'reports', array['reports_threshold'], '{}'::jsonb, 'test');
  v := public.marketplace_gate_record_listing_verdict(
    a_user, va, public.mkt_trust_test_listing('mkt-trust-t-r6-again', 'R6 listed again', 1500),
    array['media://public/marketplace-images/mkt-trust-t/r6-cover.jpg'], 'publish', '{}'::text[], '{}'::jsonb, 'test');
  reset role;
  if v ->> 'outcome' <> 'hold' or not (v -> 'reasons' ? 'enforcement_hold_active') then
    raise warning 'VIOLATION R6a: a taken-down item was publishable again under a new handle with the same picture: %', v;
    violations := violations + 1;
  end if;
  set local role service_role;
  v := public.marketplace_gate_record_listing_verdict(
    a_user, va, public.mkt_trust_test_listing('mkt-trust-t-r6-other', 'R6 another item', 1500),
    array['media://public/marketplace-images/mkt-trust-t/r6-other.jpg'], 'publish', '{}'::text[], '{}'::jsonb, 'test');
  reset role;
  if v ->> 'outcome' <> 'publish' then
    raise warning 'VIOLATION R6b: an unrelated listing of the same store was held: %', v; violations := violations + 1;
  end if;

  -- ---- R7. a picture cannot be moved off a live listing
  set local role service_role;
  v := public.marketplace_gate_record_listing_verdict(
    a_user, va, public.mkt_trust_test_listing('mkt-trust-t-r7', 'R7 clean', 1500),
    array['media://public/marketplace-images/mkt-trust-t/r7-cover.jpg'], 'publish', '{}'::text[], '{}'::jsonb, 'test');
  insert into public.marketplace_products (slug, vendor_id, title, summary, description, sku, base_price, approval_status)
    values ('mkt-trust-t-r7', va, 'R7 clean', 'A clean summary', 'A clean description', 'SKU-mkt-trust-t-r7', 1500, 'approved')
    returning id into v_pid;
  insert into public.marketplace_product_media (product_id, url, kind, is_primary, sort_order)
    values (v_pid, 'media://public/marketplace-images/mkt-trust-t/r7-cover.jpg', 'image', true, 0);
  insert into public.marketplace_products (slug, vendor_id, title, sku, base_price, approval_status)
    values ('mkt-trust-t-r7-draft', va, 'R7 draft', 'SKU-mkt-trust-t-r7-draft', 1500, 'draft')
    returning id into v_id;
  reset role;
  begin
    set local role service_role;
    update public.marketplace_product_media
       set product_id = v_id, url = 'https://evil.example/swap.jpg'
     where product_id = v_pid;
    reset role;
    raise warning 'VIOLATION R7: a live listing''s picture was moved to a draft and swapped'; violations := violations + 1;
  exception when others then
    reset role;
    if sqlerrm not like 'marketplace_media_guard:%' then
      raise warning 'VIOLATION R7: wrong error: %', sqlerrm; violations := violations + 1;
    end if;
  end;

  -- ---- R7b. a live listing is never left without a picture
  begin
    set local role service_role;
    delete from public.marketplace_product_media
     where product_id = (select id from public.marketplace_products where slug = 'mkt-trust-t-r7');
    reset role;
    raise warning 'VIOLATION R7b: every picture of a live listing was removed'; violations := violations + 1;
  exception when others then
    reset role;
    if sqlerrm not like 'marketplace_media_guard:%' then
      raise warning 'VIOLATION R7b: wrong error: %', sqlerrm; violations := violations + 1;
    end if;
  end;
  select count(*) into v_n from public.marketplace_product_media m
    join public.marketplace_products p on p.id = m.product_id
   where p.slug = 'mkt-trust-t-r7';
  if v_n <> 1 then
    raise warning 'VIOLATION R7c: the refused delete still removed pictures (% left)', v_n; violations := violations + 1;
  end if;
  -- one picture of two may go; a listing that is not live may lose them all; deleting
  -- the listing takes its pictures with it
  set local role service_role;
  insert into public.marketplace_products (slug, vendor_id, title, sku, base_price, approval_status)
    values ('mkt-trust-t-r7-two', va, 'R7 two pictures', 'SKU-mkt-trust-t-r7-two', 1500, 'draft') returning id into v_id;
  insert into public.marketplace_product_media (product_id, url, kind, is_primary, sort_order) values
    (v_id, 'media://public/marketplace-images/mkt-trust-t/r7-a.jpg', 'image', true, 0),
    (v_id, 'media://public/marketplace-images/mkt-trust-t/r7-b.jpg', 'image', false, 1);
  delete from public.marketplace_product_media where product_id = v_id;
  reset role;
  begin
    set local role service_role;
    v := public.marketplace_gate_record_listing_verdict(
      a_user, va, public.mkt_trust_test_listing('mkt-trust-t-r7', 'R7 clean', 1500),
      array['media://public/marketplace-images/mkt-trust-t/r7-cover.jpg', 'media://public/marketplace-images/mkt-trust-t/r7-second.jpg'],
      'publish', '{}'::text[], '{}'::jsonb, 'test');
    reset role;
  exception when others then
    reset role;
  end;
  begin
    set local role service_role;
    delete from public.marketplace_products where slug = 'mkt-trust-t-r7';
    reset role;
  exception when others then
    reset role;
    raise warning 'VIOLATION R7d: deleting a live listing was refused by the picture guard: %', sqlerrm; violations := violations + 1;
  end;

  -- ---- R10. a person revoking a seller's approval stops the engine for that store
  insert into public.marketplace_vendor_applications
    (user_id, normalized_email, store_name, proposed_store_slug, legal_name, status, agreement_accepted_at,
     reviewed_at, reviewed_by)
  values
    (a_user, 'seller-a@mkt-trust.test', 'Store A', 'mkt-trust-t-store-a', 'A Ltd', 'approved', now() - interval '30 days',
     now() - interval '30 days', staff)
  returning id into v_app;
  set local role service_role;
  v := public.marketplace_gate_record_listing_verdict(
    a_user, va, public.mkt_trust_test_listing('mkt-trust-t-r10', 'R10 clean', 1500),
    '{}'::text[], 'publish', '{}'::text[], '{}'::jsonb, 'test');
  reset role;
  if v ->> 'outcome' <> 'publish' then
    raise warning 'VIOLATION R10a: an approved seller could not publish: %', v; violations := violations + 1;
  end if;
  -- "Revoke approval": staff reject the application that was approved
  update public.marketplace_vendor_applications
     set status = 'rejected', reviewed_by = staff, reviewed_at = now() - interval '1 day', review_note = 'revoked'
   where id = v_app;
  set local role service_role;
  v := public.marketplace_gate_record_listing_verdict(
    a_user, va, public.mkt_trust_test_listing('mkt-trust-t-r10', 'R10 clean', 1500),
    '{}'::text[], 'publish', '{}'::text[], '{}'::jsonb, 'test');
  reset role;
  if v ->> 'outcome' <> 'reject' or not (v -> 'reasons' ? 'seller_not_active') then
    raise warning 'VIOLATION R10b: a seller whose approval a person revoked could still publish: %', v; violations := violations + 1;
  end if;
  set local role service_role;
  v := public.marketplace_gate_seller_state(va, null);
  reset role;
  if v -> 'vendor' ->> 'status' <> 'revoked' then
    raise warning 'VIOLATION R10c: the seller state does not say the approval was revoked: %', v -> 'vendor'; violations := violations + 1;
  end if;
  select count(*) into v_n from public.marketplace_seller_revocations
   where owner_user_id = a_user and lifted_at is null and application_id = v_app and revoked_by = staff;
  if v_n <> 1 then
    raise warning 'VIOLATION R10c2: the revocation was not recorded'; violations := violations + 1;
  end if;
  -- The seller submits again: the route rewrites the SAME row to 'submitted' and keeps the
  -- review stamp. That must not undo a person's revocation.
  update public.marketplace_vendor_applications set status = 'submitted' where id = v_app;
  set local role service_role;
  v := public.marketplace_gate_record_listing_verdict(
    a_user, va, public.mkt_trust_test_listing('mkt-trust-t-r10', 'R10 clean', 1500),
    '{}'::text[], 'publish', '{}'::text[], '{}'::jsonb, 'test');
  reset role;
  if v ->> 'outcome' = 'publish' then
    raise warning 'VIOLATION R10d: the seller''s re-submission undid a person''s revocation'; violations := violations + 1;
  end if;
  -- ...and the onboarding RPC answers "already a seller" without approving it
  set local role service_role;
  v := public.marketplace_gate_instant_onboard(a_user, v_app, '{}'::text[], '{}'::jsonb, 'test', public.mkt_trust_test_profile_hash(v_app));
  reset role;
  select count(*) into v_n from public.marketplace_vendor_applications where id = v_app and status = 'approved';
  if v ->> 'why' is distinct from 'already_seller' or v_n <> 0 then
    raise warning 'VIOLATION R10d2: a revoked seller''s re-application was approved by the gate: % (approved %)', v, v_n;
    violations := violations + 1;
  end if;
  -- a person approving again lifts it
  update public.marketplace_vendor_applications
     set status = 'approved', reviewed_by = staff, reviewed_at = now()
   where id = v_app;
  set local role service_role;
  v := public.marketplace_gate_record_listing_verdict(
    a_user, va, public.mkt_trust_test_listing('mkt-trust-t-r10', 'R10 clean', 1500),
    '{}'::text[], 'publish', '{}'::text[], '{}'::jsonb, 'test');
  reset role;
  if v ->> 'outcome' <> 'publish' then
    raise warning 'VIOLATION R10e: a person''s new approval did not lift the revocation: %', v; violations := violations + 1;
  end if;
  -- a "revocation" stamped by an account that is not marketplace staff records nothing
  update public.marketplace_vendor_applications
     set status = 'rejected', reviewed_by = outsider, reviewed_at = now() + interval '1 second'
   where id = v_app;
  select count(*) into v_n from public.marketplace_seller_revocations where owner_user_id = a_user and lifted_at is null;
  if v_n <> 0 then
    raise warning 'VIOLATION R10f: a non-staff stamp revoked a seller'; violations := violations + 1;
  end if;
  -- an account whose approval was revoked, and that has no store, is not opened by the gate
  insert into auth.users (id, email) values ('a1000000-0000-4000-8000-000000000011', 'r10-revoked@mkt-trust.test')
    on conflict (id) do nothing;
  insert into public.marketplace_vendor_applications
    (user_id, normalized_email, store_name, proposed_store_slug, legal_name, status, agreement_accepted_at,
     reviewed_at, reviewed_by)
  values
    ('a1000000-0000-4000-8000-000000000011', 'r10-revoked@mkt-trust.test', 'R10 Revoked', 'mkt-trust-t-r10-revoked',
     'R Ltd', 'approved', now() - interval '20 days', now() - interval '20 days', staff)
  returning id into v_app;
  update public.marketplace_vendor_applications
     set status = 'rejected', reviewed_by = staff, reviewed_at = now()
   where id = v_app;
  insert into public.marketplace_vendor_applications
    (user_id, normalized_email, store_name, proposed_store_slug, legal_name, status, agreement_accepted_at)
  values
    ('a1000000-0000-4000-8000-000000000011', 'r10-revoked@mkt-trust.test', 'R10 Again', 'mkt-trust-t-r10-again',
     'R Ltd', 'submitted', now())
  returning id into v_app;
  begin
    set local role service_role;
    perform public.marketplace_gate_instant_onboard(
      'a1000000-0000-4000-8000-000000000011', v_app, '{}'::text[], '{}'::jsonb, 'test', public.mkt_trust_test_profile_hash(v_app));
    reset role;
    raise warning 'VIOLATION R10g: the gate opened a store for an account whose approval a person revoked'; violations := violations + 1;
  exception when others then
    get stacked diagnostics v_hint = pg_exception_hint;
    reset role;
    if v_hint is distinct from 'prior_human_decision' then
      raise warning 'VIOLATION R10g: wrong refusal: % (hint %)', sqlerrm, v_hint; violations := violations + 1;
    end if;
  end;
  delete from public.marketplace_vendor_applications
   where user_id in (a_user, 'a1000000-0000-4000-8000-000000000011');

  -- ---- R8. the store is opened on the profile that was screened, or not at all
  insert into auth.users (id, email) values ('a1000000-0000-4000-8000-00000000000f', 'r8-toctou@mkt-trust.test')
    on conflict (id) do nothing;
  insert into public.marketplace_vendor_applications
    (user_id, normalized_email, store_name, proposed_store_slug, legal_name, status, agreement_accepted_at, story)
  values
    ('a1000000-0000-4000-8000-00000000000f', 'r8-toctou@mkt-trust.test', 'R8 Clean Store', 'mkt-trust-t-r8', 'R Ltd',
     'submitted', now(), 'We sell kettles.')
  returning id into v_app;
  v_text := public.mkt_trust_test_profile_hash(v_app); -- what the caller screened
  -- a draft save lands between the screen and the call
  update public.marketplace_vendor_applications
     set store_name = 'WhatsApp 0803 555 0101 for cheap phones', story = 'Pay to 0123456789 GTBank'
   where id = v_app;
  begin
    set local role service_role;
    perform public.marketplace_gate_instant_onboard(
      'a1000000-0000-4000-8000-00000000000f', v_app, '{}'::text[], '{}'::jsonb, 'test', v_text);
    reset role;
    raise warning 'VIOLATION R8a: a store was opened on a profile that changed after it was screened'; violations := violations + 1;
  exception when others then
    get stacked diagnostics v_hint = pg_exception_hint;
    reset role;
    if v_hint is distinct from 'profile_changed' then
      raise warning 'VIOLATION R8a: wrong refusal: % (hint %)', sqlerrm, v_hint; violations := violations + 1;
    end if;
  end;
  begin
    set local role service_role;
    perform public.marketplace_gate_instant_onboard(
      'a1000000-0000-4000-8000-00000000000f', v_app, '{}'::text[], '{}'::jsonb, 'test', null);
    reset role;
    raise warning 'VIOLATION R8b: a store was opened with no screened-profile hash'; violations := violations + 1;
  exception when others then
    reset role;
    if sqlerrm not like 'marketplace_gate_instant_onboard:%' then
      raise warning 'VIOLATION R8b: wrong error: %', sqlerrm; violations := violations + 1;
    end if;
  end;
  select count(*) into v_n from public.marketplace_vendors where owner_user_id = 'a1000000-0000-4000-8000-00000000000f';
  if v_n <> 0 then
    raise warning 'VIOLATION R8c: a store exists for the applicant whose profile changed'; violations := violations + 1;
  end if;
  -- no note is written into the seller-visible column by the gate
  select count(*) into v_n from public.marketplace_vendor_applications a
   where a.user_id in (inst, q_inst) and a.status = 'approved' and a.review_note is not null;
  if v_n <> 0 then
    raise warning 'VIOLATION R8d: the gate wrote a note into the seller-visible application column'; violations := violations + 1;
  end if;

  -- ---- R9. reporter age comes from the account, not from a row its owner can edit
  update auth.users set created_at = now() - interval '30 days' where id = a_user;
  update auth.users set created_at = now() - interval '2 days' where id = b_user;
  update auth.users set created_at = now() where id = outsider;
  set local role service_role;
  select count(*) into v_n from public.marketplace_gate_established_accounts(
    array[a_user, b_user, outsider], array[now(), now(), now()], 7);
  reset role;
  if v_n <> 1 then
    raise warning 'VIOLATION R9a: % of 3 accounts counted as a week old (expected 1)', v_n; violations := violations + 1;
  end if;
  -- the age that counts is the age WHEN THEY REPORTED: an account 30 days old today that
  -- reported 25 days ago was 5 days old then
  set local role service_role;
  select count(*) into v_n from public.marketplace_gate_established_accounts(
    array[a_user], array[now() - interval '25 days'], 7);
  reset role;
  if v_n <> 0 then
    raise warning 'VIOLATION R9c: an account was judged by its age today, not when it reported'; violations := violations + 1;
  end if;
  begin
    set local role authenticated;
    perform count(*) from public.marketplace_gate_established_accounts(array[a_user], array[now()], 7);
    reset role;
    raise warning 'VIOLATION R9b: authenticated listed account ages'; violations := violations + 1;
  exception when insufficient_privilege then
    reset role;
  end;

  -- ===== S. adversarial round 3 ==============================================
  -- ---- S1. the same item listed again: pictures of a held listing, as they were
  declare
    s_ref constant text := 'media://public/marketplace-images/mkt-trust-t/';
    sh_a constant text := repeat('5a', 32);  -- the held item's photo
    sh_b constant text := repeat('5b', 32);  -- the same photo, re-encoded (other bytes)
    sh_c constant text := repeat('5c', 32);  -- a store-wide size chart
    sh_d constant text := repeat('5d', 32);  -- the second held item's photo
    sh_e constant text := repeat('5e', 32);  -- a photo of a listing a person turned down
    ph_a constant bigint := 4294967295;      -- 32 structured cells
    ph_near constant bigint := 4294967292;   -- the same, 2 bits apart
    ph_far constant bigint := 281470681743360;
    v_h uuid;
    v_h2 uuid;
    v_l uuid;
    v_r uuid;
  begin
    insert into public.marketplace_image_fingerprints (ref, sha256, phash, phash_aux, vendor_id) values
      (s_ref || 's1-h.jpg', sh_a, ph_a, 0, va),
      (s_ref || 's1-n1.jpg', sh_a, ph_a, 0, va),
      (s_ref || 's1-n2.jpg', sh_b, ph_near, 0, va),
      (s_ref || 's1-n3.jpg', sh_a, ph_a, 0, va),
      (s_ref || 's1-chart-l.jpg', sh_c, ph_far, 0, va),
      (s_ref || 's1-chart-h2.jpg', sh_c, ph_far, 0, va),
      (s_ref || 's1-chart-n4.jpg', sh_c, ph_far, 0, va),
      (s_ref || 's1-h2.jpg', sh_d, null, null, va),
      (s_ref || 's1-n5.jpg', sh_d, null, null, va),
      (s_ref || 's1-r.jpg', sh_e, null, null, va),
      (s_ref || 's1-n6.jpg', sh_e, null, null, va);

    set local role service_role;
    -- H: live with its photo, then taken down by reports
    v := public.marketplace_gate_record_listing_verdict(
      a_user, va, public.mkt_trust_test_listing('mkt-trust-t-s1-h', 'S1 held item', 1500),
      array[s_ref || 's1-h.jpg'], 'publish', '{}'::text[], '{}'::jsonb, 'test');
    insert into public.marketplace_products (slug, vendor_id, title, summary, description, sku, base_price, approval_status)
      values ('mkt-trust-t-s1-h', va, 'S1 held item', 'A clean summary', 'A clean description', 'SKU-mkt-trust-t-s1-h', 1500, 'approved')
      returning id into v_h;
    insert into public.marketplace_product_media (product_id, url, kind, is_primary, sort_order)
      values (v_h, s_ref || 's1-h.jpg', 'image', true, 0);
    -- L: live, carrying the store's size chart
    v := public.marketplace_gate_record_listing_verdict(
      a_user, va, public.mkt_trust_test_listing('mkt-trust-t-s1-l', 'S1 shirt', 1500),
      array[s_ref || 's1-chart-l.jpg'], 'publish', '{}'::text[], '{}'::jsonb, 'test');
    insert into public.marketplace_products (slug, vendor_id, title, summary, description, sku, base_price, approval_status)
      values ('mkt-trust-t-s1-l', va, 'S1 shirt', 'A clean summary', 'A clean description', 'SKU-mkt-trust-t-s1-l', 1500, 'approved')
      returning id into v_l;
    insert into public.marketplace_product_media (product_id, url, kind, is_primary, sort_order)
      values (v_l, s_ref || 's1-chart-l.jpg', 'image', true, 0);
    -- H2: live with its own photo and the size chart, then taken down
    v := public.marketplace_gate_record_listing_verdict(
      a_user, va, public.mkt_trust_test_listing('mkt-trust-t-s1-h2', 'S1 trousers', 1500),
      array[s_ref || 's1-h2.jpg', s_ref || 's1-chart-h2.jpg'], 'publish', '{}'::text[], '{}'::jsonb, 'test');
    insert into public.marketplace_products (slug, vendor_id, title, summary, description, sku, base_price, approval_status)
      values ('mkt-trust-t-s1-h2', va, 'S1 trousers', 'A clean summary', 'A clean description', 'SKU-mkt-trust-t-s1-h2', 1500, 'approved')
      returning id into v_h2;
    insert into public.marketplace_product_media (product_id, url, kind, is_primary, sort_order) values
      (v_h2, s_ref || 's1-h2.jpg', 'image', true, 0),
      (v_h2, s_ref || 's1-chart-h2.jpg', 'image', false, 1);
    v := public.marketplace_gate_hide_listing(v_h, 'reports', array['reports_threshold'], '{}'::jsonb, 'test');
    v := public.marketplace_gate_hide_listing(v_h2, 'reports', array['reports_threshold'], '{}'::jsonb, 'test');
    reset role;

    select count(*) into v_n from public.marketplace_listing_enforcement e,
           jsonb_array_elements(e.media_snapshot) x
     where e.product_id = v_h and e.status = 'active' and x ->> 'sha256' = sh_a;
    if v_n < 1 then
      raise warning 'VIOLATION S1a: the take-down did not keep the listing''s pictures'; violations := violations + 1;
    end if;

    -- the seller removes the photo from the held listing, then lists the item again
    set local role service_role;
    delete from public.marketplace_product_media where product_id = v_h;
    v := public.marketplace_gate_record_listing_verdict(
      a_user, va, public.mkt_trust_test_listing('mkt-trust-t-s1-n1', 'S1 listed again', 1500),
      array[s_ref || 's1-n1.jpg'], 'publish', '{}'::text[], '{}'::jsonb, 'test');
    reset role;
    if v ->> 'outcome' <> 'hold' then
      raise warning 'VIOLATION S1b: removing the photo from the held listing shed its hold: %', v; violations := violations + 1;
    end if;
    -- the same photo re-encoded (other bytes, the same picture)
    set local role service_role;
    v := public.marketplace_gate_record_listing_verdict(
      a_user, va, public.mkt_trust_test_listing('mkt-trust-t-s1-n2', 'S1 re-encoded', 1500),
      array[s_ref || 's1-n2.jpg'], 'publish', '{}'::text[], '{}'::jsonb, 'test');
    reset role;
    if v ->> 'outcome' <> 'hold' then
      raise warning 'VIOLATION S1c: a re-encoded copy of a held listing''s photo published: %', v; violations := violations + 1;
    end if;
    -- the held listing deleted outright
    set local role service_role;
    delete from public.marketplace_products where id = v_h;
    v := public.marketplace_gate_record_listing_verdict(
      a_user, va, public.mkt_trust_test_listing('mkt-trust-t-s1-n3', 'S1 after delete', 1500),
      array[s_ref || 's1-n3.jpg'], 'publish', '{}'::text[], '{}'::jsonb, 'test');
    reset role;
    if v ->> 'outcome' <> 'hold' then
      raise warning 'VIOLATION S1d: deleting the held listing shed its hold: %', v; violations := violations + 1;
    end if;
    -- a store-wide picture (the size chart is also on live L) says nothing: publish
    set local role service_role;
    v := public.marketplace_gate_record_listing_verdict(
      a_user, va, public.mkt_trust_test_listing('mkt-trust-t-s1-n4', 'S1 dress', 1500),
      array[s_ref || 's1-chart-n4.jpg'], 'publish', '{}'::text[], '{}'::jsonb, 'test');
    reset role;
    if v ->> 'outcome' <> 'publish' then
      raise warning 'VIOLATION S1e: a store-wide picture held an unrelated listing: %', v; violations := violations + 1;
    end if;
    -- L's own edit keeps the chart it was approved with: publish
    set local role service_role;
    v := public.marketplace_gate_record_listing_verdict(
      a_user, va, public.mkt_trust_test_listing('mkt-trust-t-s1-l', 'S1 shirt', 1700),
      array[s_ref || 's1-chart-l.jpg'], 'publish', '{}'::text[], '{}'::jsonb, 'test');
    reset role;
    if v ->> 'outcome' <> 'publish' then
      raise warning 'VIOLATION S1f: a live listing''s edit was held for the picture it was approved with: %', v; violations := violations + 1;
    end if;
    -- the second held item's own photo is still held
    set local role service_role;
    v := public.marketplace_gate_record_listing_verdict(
      a_user, va, public.mkt_trust_test_listing('mkt-trust-t-s1-n5', 'S1 trousers again', 1500),
      array[s_ref || 's1-n5.jpg'], 'publish', '{}'::text[], '{}'::jsonb, 'test');
    reset role;
    if v ->> 'outcome' <> 'hold' then
      raise warning 'VIOLATION S1g: a held listing''s own photo published under a new handle: %', v; violations := violations + 1;
    end if;
    -- a listing a person turned down keeps its pictures too
    insert into public.marketplace_products (slug, vendor_id, title, summary, description, sku, base_price, approval_status)
      values ('mkt-trust-t-s1-r', va, 'S1 rejected', 'A clean summary', 'A clean description', 'SKU-mkt-trust-t-s1-r', 1500, 'submitted')
      returning id into v_r;
    insert into public.marketplace_product_media (product_id, url, kind, is_primary, sort_order)
      values (v_r, s_ref || 's1-r.jpg', 'image', true, 0);
    update public.marketplace_products
       set approval_status = 'rejected', reviewed_by = staff, reviewed_at = now()
     where id = v_r;
    delete from public.marketplace_product_media where product_id = v_r;
    set local role service_role;
    v := public.marketplace_gate_record_listing_verdict(
      a_user, va, public.mkt_trust_test_listing('mkt-trust-t-s1-n6', 'S1 turned down, again', 1500),
      array[s_ref || 's1-n6.jpg'], 'publish', '{}'::text[], '{}'::jsonb, 'test');
    reset role;
    if v ->> 'outcome' <> 'hold' then
      raise warning 'VIOLATION S1h: a photo of a listing a person turned down published again: %', v; violations := violations + 1;
    end if;

    -- ---- S2. a held listing keeps its handle; an approval lifts only its own holds
    begin
      update public.marketplace_products set slug = 'mkt-trust-t-s2-renamed' where id = v_h2;
      raise warning 'VIOLATION S2a: a listing under a person''s hold was renamed'; violations := violations + 1;
    exception when others then
      get stacked diagnostics v_hint = pg_exception_hint;
      if v_hint is distinct from 'listing_handle_held' then
        raise warning 'VIOLATION S2a: wrong refusal: % (hint %)', sqlerrm, v_hint; violations := violations + 1;
      end if;
    end;
    -- a hold row whose handle another listing now has (written before handles were fixed)
    insert into public.marketplace_listing_enforcement (product_id, vendor_id, slug, kind, reasons)
      values (v_l, va, 'mkt-trust-t-s2-y', 'reports', array['reports_threshold'])
      returning id into v_id;
    insert into public.marketplace_products (slug, vendor_id, title, summary, description, sku, base_price, approval_status)
      values ('mkt-trust-t-s2-y', va, 'S2 Y', 'A clean summary', 'A clean description', 'SKU-mkt-trust-t-s2-y', 1500, 'submitted')
      returning id into v_pid;
    update public.marketplace_products
       set approval_status = 'approved', reviewed_by = staff, reviewed_at = now()
     where id = v_pid;
    select count(*) into v_n from public.marketplace_listing_enforcement where id = v_id and status = 'active';
    if v_n <> 1 then
      raise warning 'VIOLATION S2b: approving one listing lifted the hold of another that still exists'; violations := violations + 1;
    end if;
    delete from public.marketplace_listing_enforcement where id = v_id;

    -- ---- S4. a live listing losing its store: refused with the cause named
    begin
      update public.marketplace_products set vendor_id = null where id = v_l;
      raise warning 'VIOLATION S4: a live listing lost its store with no decision'; violations := violations + 1;
    exception when others then
      get stacked diagnostics v_hint = pg_exception_hint;
      if v_hint is distinct from 'live_listing_reference' then
        raise warning 'VIOLATION S4: wrong refusal: % (hint %)', sqlerrm, v_hint; violations := violations + 1;
      end if;
    end;

    -- ---- S5. a listing never moves to another store; company catalogue may be re-homed
    begin
      set local role service_role;
      update public.marketplace_products set vendor_id = vb where id = v_r;
      reset role;
      raise warning 'VIOLATION S5a: a listing moved to another store'; violations := violations + 1;
    exception when others then
      get stacked diagnostics v_hint = pg_exception_hint;
      reset role;
      if v_hint is distinct from 'listing_store_immutable' then
        raise warning 'VIOLATION S5a: wrong refusal: % (hint %)', sqlerrm, v_hint; violations := violations + 1;
      end if;
    end;
    insert into public.marketplace_products (slug, vendor_id, title, sku, base_price, approval_status)
      values ('mkt-trust-t-s5-orphan', null, 'S5 orphan', 'SKU-mkt-trust-t-s5-orphan', 1500, 'draft')
      returning id into v_pid;
    begin
      set local role service_role;
      update public.marketplace_products set vendor_id = vb where id = v_pid;
      reset role;
      raise warning 'VIOLATION S5b: a store adopted an orphaned listing'; violations := violations + 1;
    exception when others then
      get stacked diagnostics v_hint = pg_exception_hint;
      reset role;
      if v_hint is distinct from 'listing_store_immutable' then
        raise warning 'VIOLATION S5b: wrong refusal: % (hint %)', sqlerrm, v_hint; violations := violations + 1;
      end if;
    end;
    update public.marketplace_products set inventory_owner_type = 'company' where id = v_pid;
    begin
      update public.marketplace_products set vendor_id = vc where id = v_pid;
    exception when others then
      raise warning 'VIOLATION S5c: company catalogue could not be re-homed to the company store: %', sqlerrm;
      violations := violations + 1;
    end;
  end;

  -- ---- S3. a store of company type that names an owner is that owner's store
  insert into public.marketplace_vendors (slug, name, owner_user_id, owner_type, status)
    values ('mkt-trust-t-s3-co', 'S3 Company-typed', outsider, 'company', 'approved')
    returning id into v_id;
  select count(*) into v_n from public.marketplace_seller_probation where vendor_id = v_id and owner_user_id = outsider;
  if v_n <> 1 then
    raise warning 'VIOLATION S3a: a company-typed store with an owner escaped probation'; violations := violations + 1;
  end if;
  set local role service_role;
  v := public.marketplace_gate_payout_eligibility(v_id);
  reset role;
  if (v ->> 'company_store')::boolean then
    raise warning 'VIOLATION S3b: a company-typed store with an owner reads as the company''s: %', v; violations := violations + 1;
  end if;
  begin
    set local role service_role;
    insert into public.marketplace_payout_requests (reference, vendor_id, amount, status, requested_by)
      values ('MKT-TRUST-T-S3C', v_id, 1000, 'requested', outsider);
    reset role;
    raise warning 'VIOLATION S3c: a company-typed store with an unverified owner passed the payout wall'; violations := violations + 1;
  exception when others then
    reset role;
    if sqlerrm not like 'marketplace_payout_identity_guard:%' then
      raise warning 'VIOLATION S3c: wrong error: %', sqlerrm; violations := violations + 1;
    end if;
  end;
  begin
    insert into public.marketplace_products (slug, vendor_id, title, sku, base_price, approval_status, inventory_owner_type)
      values ('mkt-trust-t-s3-co-item', v_id, 'S3 catalogue?', 'SKU-mkt-trust-t-s3-co-item', 1500, 'approved', 'company');
    raise warning 'VIOLATION S3d: a company-typed store with an owner published as the company''s catalogue'; violations := violations + 1;
  exception when others then
    if sqlerrm not like 'marketplace_publish_guard:%' then
      raise warning 'VIOLATION S3d: wrong error: %', sqlerrm; violations := violations + 1;
    end if;
  end;

  -- ---- S6. the screened-profile hash keeps the fields apart
  insert into auth.users (id, email) values ('a1000000-0000-4000-8000-000000000012', 's6-fields@mkt-trust.test')
    on conflict (id) do nothing;
  insert into public.marketplace_vendor_applications
    (user_id, normalized_email, store_name, proposed_store_slug, legal_name, status, agreement_accepted_at, story)
  values
    ('a1000000-0000-4000-8000-000000000012', 's6-fields@mkt-trust.test', 'Shop|call', 'mkt-trust-t-s6', 'S Ltd',
     'submitted', now(), 'me')
  returning id into v_app;
  -- what was screened: name "Shop", story "call|me"
  v_text := encode(sha256(convert_to(
    encode(sha256(convert_to('mkt-trust-t-s6', 'UTF8')), 'hex')
    || encode(sha256(convert_to('Shop', 'UTF8')), 'hex')
    || encode(sha256(convert_to('call|me', 'UTF8')), 'hex'), 'UTF8')), 'hex');
  begin
    set local role service_role;
    perform public.marketplace_gate_instant_onboard(
      'a1000000-0000-4000-8000-000000000012', v_app, '{}'::text[], '{}'::jsonb, 'test', v_text);
    reset role;
    raise warning 'VIOLATION S6: text moved between the name and the story without changing the hash'; violations := violations + 1;
  exception when others then
    get stacked diagnostics v_hint = pg_exception_hint;
    reset role;
    if v_hint is distinct from 'profile_changed' then
      raise warning 'VIOLATION S6: wrong refusal: % (hint %)', sqlerrm, v_hint; violations := violations + 1;
    end if;
  end;
  delete from public.marketplace_vendor_applications where user_id = 'a1000000-0000-4000-8000-000000000012';

  -- ---- S7. deleting the account that owns a pre-gate (waived) store is allowed; the
  --          store's payouts then need a verified owner, and it has none
  insert into auth.users (id, email) values ('a1000000-0000-4000-8000-000000000013', 's7-leaver@mkt-trust.test')
    on conflict (id) do nothing;
  insert into public.marketplace_vendors (slug, name, owner_user_id, owner_type, status)
    values ('mkt-trust-t-s7-pre', 'S7 Pre-gate', 'a1000000-0000-4000-8000-000000000013', 'vendor', 'approved')
    returning id into v_id;
  delete from public.marketplace_seller_probation where vendor_id = v_id;
  insert into public.marketplace_seller_identity_waivers (vendor_id, owner_user_id)
    values (v_id, 'a1000000-0000-4000-8000-000000000013');
  begin
    delete from auth.users where id = 'a1000000-0000-4000-8000-000000000013';
  exception when others then
    raise warning 'VIOLATION S7a: deleting the owner of a waived store was refused: %', sqlerrm; violations := violations + 1;
  end;
  begin
    set local role service_role;
    insert into public.marketplace_payout_requests (reference, vendor_id, amount, status, requested_by)
      values ('MKT-TRUST-T-S7B', v_id, 1000, 'requested', outsider);
    reset role;
    raise warning 'VIOLATION S7b: an owner-less store passed the payout wall'; violations := violations + 1;
  exception when others then
    reset role;
    if sqlerrm not like 'marketplace_payout_identity_guard:%' then
      raise warning 'VIOLATION S7b: wrong error: %', sqlerrm; violations := violations + 1;
    end if;
  end;

  if violations > 0 then
    raise exception 'V3-MKT-TRUST-01 guard behaviour FAILED: % violation(s)', violations;
  end if;
  raise notice 'V3-MKT-TRUST-01 guard behaviour: OK';
end $$;

drop policy if exists mkt_trust_test_open_products on public.marketplace_products;
drop policy if exists mkt_trust_test_open_media on public.marketplace_product_media;
drop function if exists public.mkt_trust_test_listing(text, text, integer);
drop function if exists public.mkt_trust_test_profile_hash(uuid);
