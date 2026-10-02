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
  'a1000000-0000-4000-8000-000000000005', 'a1000000-0000-4000-8000-000000000006');
delete from public.marketplace_vendor_applications where proposed_store_slug like 'mkt-trust-t-%';
delete from public.marketplace_vendors where slug like 'mkt-trust-t-%';
delete from public.customer_verification_submissions where user_id in (
  'a1000000-0000-4000-8000-000000000005', 'a1000000-0000-4000-8000-000000000006');

insert into auth.users (id, email) values
  ('a1000000-0000-4000-8000-000000000001', 'seller-a@mkt-trust.test'),
  ('a1000000-0000-4000-8000-000000000002', 'seller-b@mkt-trust.test'),
  ('a1000000-0000-4000-8000-000000000003', 'staff@mkt-trust.test'),
  ('a1000000-0000-4000-8000-000000000004', 'outsider@mkt-trust.test'),
  ('a1000000-0000-4000-8000-000000000005', 'instant@mkt-trust.test'),
  ('a1000000-0000-4000-8000-000000000006', 'instant-two@mkt-trust.test')
  on conflict (id) do nothing;

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

insert into public.marketplace_role_memberships (user_id, normalized_email, scope_type, scope_id, role, is_active) values
  ('a1000000-0000-4000-8000-000000000001', 'seller-a@mkt-trust.test', 'vendor', 'b1000000-0000-4000-8000-00000000000a', 'vendor', true),
  ('a1000000-0000-4000-8000-000000000002', 'seller-b@mkt-trust.test', 'vendor', 'b1000000-0000-4000-8000-00000000000b', 'vendor', true),
  ('a1000000-0000-4000-8000-000000000003', 'staff@mkt-trust.test', 'platform', null, 'moderation', true);

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
    perform public.marketplace_gate_instant_onboard(a_user, v_app, '{}'::text[], '{}'::jsonb, 'test');
    reset role;
    raise warning 'VIOLATION N1: an application was onboarded by someone other than its owner'; violations := violations + 1;
  exception when insufficient_privilege then
    reset role;
  end;

  begin
    set local role authenticated;
    perform public.marketplace_gate_instant_onboard(inst, v_app, '{}'::text[], '{}'::jsonb, 'test');
    reset role;
    raise warning 'VIOLATION N2: authenticated called the onboarding RPC'; violations := violations + 1;
  exception when insufficient_privilege then
    reset role;
  end;

  set local role service_role;
  v := public.marketplace_gate_instant_onboard(inst, v_app, '{}'::text[], '{}'::jsonb, 'test');
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
  v := public.marketplace_gate_instant_onboard(inst, v_app, '{}'::text[], '{}'::jsonb, 'test');
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
    perform public.marketplace_gate_instant_onboard(inst2, v_app, '{}'::text[], '{}'::jsonb, 'test');
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
    perform public.marketplace_gate_instant_onboard(inst2, v_app, '{}'::text[], '{}'::jsonb, 'test');
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
     set approval_status = 'rejected', reviewed_by = staff, reviewed_at = now()
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

  if violations > 0 then
    raise exception 'V3-MKT-TRUST-01 guard behaviour FAILED: % violation(s)', violations;
  end if;
  raise notice 'V3-MKT-TRUST-01 guard behaviour: OK';
end $$;

drop policy if exists mkt_trust_test_open_products on public.marketplace_products;
drop policy if exists mkt_trust_test_open_media on public.marketplace_product_media;
drop function if exists public.mkt_trust_test_listing(text, text, integer);
