-- =============================================================================
-- V3-MKT-TRUST-01 - AFTER-APPLY VERIFICATION.  READ ONLY: it changes nothing.
--
-- Run this in the Supabase SQL editor right after applying
-- 20261002120000_v3_mkt_trust_01_instant_publish.sql.
--
-- Every row must say PASS. A FAIL means the gate is not fully installed: leave
-- MARKETPLACE_INSTANT_PUBLISH off and tell the engineer which row failed.
--
-- The last result set is not a pass/fail check: it lists WHO can approve a
-- listing by hand from now on. Confirm your own account is in it.
-- =============================================================================

with fn(sig, rpc) as (
  values
    ('public.marketplace_listing_content_hash(public.marketplace_products)', false),
    ('public.marketplace_gate_probation_caps()', true),
    ('public.marketplace_gate_granted_memberships(uuid)', false),
    ('public.marketplace_gate_is_staff(uuid)', false),
    ('public.marketplace_gate_actor_may_act_for(uuid,uuid)', false),
    ('public.marketplace_gate_identity_verified(uuid)', false),
    ('public.marketplace_gate_caller_is_trusted()', false),
    ('public.marketplace_gate_is_company_vendor(uuid)', false),
    ('public.marketplace_gate_probation_active(uuid)', false),
    ('public.marketplace_products_publish_guard()', false),
    ('public.marketplace_products_publish_record()', false),
    ('public.marketplace_product_media_guard()', false),
    ('public.marketplace_payout_identity_guard()', false),
    ('public.marketplace_product_variant_guard()', false),
    ('public.marketplace_vendors_probation_enroll()', false),
    ('public.marketplace_vendors_owner_guard()', false),
    ('public.marketplace_product_media_delete_guard()', false),
    ('public.marketplace_gate_human_hold(uuid,uuid,text)', false),
    ('public.marketplace_gate_established_accounts(uuid[],timestamptz[],integer)', true),
    ('public.marketplace_gate_owner_revoked(uuid)', false),
    ('public.marketplace_gate_listing_pictures(uuid)', false),
    ('public.marketplace_gate_pictures_alike(text,bigint,bigint,text,bigint,bigint)', false),
    ('public.marketplace_vendor_applications_revocation()', false),
    ('public.marketplace_gate_seller_state(uuid,text)', true),
    ('public.marketplace_gate_record_listing_verdict(uuid,uuid,jsonb,text[],text,text[],jsonb,text,text)', true),
    ('public.marketplace_gate_record_rescan(uuid,text)', true),
    ('public.marketplace_gate_rescan_candidates(text,integer)', true),
    ('public.marketplace_gate_hide_listing(uuid,text,text[],jsonb,text)', true),
    ('public.marketplace_gate_register_image(text,text,bigint,bigint,uuid,uuid,bigint)', true),
    ('public.marketplace_gate_image_matches(uuid,text,text[],integer)', true),
    ('public.marketplace_gate_instant_onboard(uuid,uuid,text[],jsonb,text,text)', true),
    ('public.marketplace_gate_payout_eligibility(uuid)', true)
),
function_checks as (
  select
    'function ' || sig || ' exists' as check_name,
    to_regprocedure(sig) is not null as ok
  from fn
  union all
  select 'function ' || sig || ' is NOT callable by anon',
         to_regprocedure(sig) is not null and not has_function_privilege('anon', sig, 'EXECUTE')
  from fn
  union all
  select 'function ' || sig || ' is NOT callable by authenticated',
         to_regprocedure(sig) is not null and not has_function_privilege('authenticated', sig, 'EXECUTE')
  from fn
  union all
  select 'function ' || sig || ' IS callable by service_role',
         to_regprocedure(sig) is not null and has_function_privilege('service_role', sig, 'EXECUTE')
  from fn where rpc
),
tbl(name) as (
  values ('marketplace_listing_gate_verdicts'), ('marketplace_seller_probation'),
         ('marketplace_listing_enforcement'), ('marketplace_image_fingerprints'),
         ('marketplace_seller_identity_waivers'), ('marketplace_seller_revocations')
),
table_checks as (
  select 'table public.' || name || ' has row level security ON' as check_name,
         coalesce((select c.relrowsecurity from pg_class c where c.oid = to_regclass('public.' || name)), false) as ok
  from tbl
  union all
  select 'table public.' || name || ' has NO policy (default deny)',
         not exists (select 1 from pg_policies p where p.schemaname = 'public' and p.tablename = name)
  from tbl
  union all
  select 'table public.' || name || ' is NOT readable by anon / authenticated',
         to_regclass('public.' || name) is not null
         and not has_table_privilege('anon', 'public.' || name, 'SELECT')
         and not has_table_privilege('authenticated', 'public.' || name, 'SELECT')
  from tbl
  union all
  select 'table public.' || name || ' is NOT writable by service_role (only the gate functions write it)',
         to_regclass('public.' || name) is not null
         and not has_table_privilege('service_role', 'public.' || name, 'INSERT')
         and not has_table_privilege('service_role', 'public.' || name, 'UPDATE')
         and not has_table_privilege('service_role', 'public.' || name, 'DELETE')
  from tbl
),
trg(tbl_name, trg_name) as (
  values ('marketplace_products', 'marketplace_products_publish_guard'),
         ('marketplace_products', 'marketplace_products_publish_record'),
         ('marketplace_product_media', 'marketplace_product_media_guard'),
         ('marketplace_payout_requests', 'marketplace_payout_identity_guard'),
         ('marketplace_product_variants', 'marketplace_product_variant_guard'),
         ('marketplace_vendors', 'marketplace_vendors_probation_enroll'),
         ('marketplace_vendors', 'marketplace_vendors_owner_guard'),
         ('marketplace_product_media', 'marketplace_product_media_delete_guard'),
         ('marketplace_vendor_applications', 'marketplace_vendor_applications_revocation')
),
trigger_checks as (
  select 'trigger ' || trg_name || ' on ' || tbl_name || ' is present and enabled' as check_name,
         exists (
           select 1 from pg_trigger t
            where t.tgrelid = to_regclass('public.' || tbl_name)
              and t.tgname = trg_name and not t.tgisinternal and t.tgenabled <> 'D'
         ) as ok
  from trg
),
privilege_checks as (
  select 'no request role can add a trigger to, or truncate, ' || t.tbl as check_name,
         not exists (
           select 1
             from (values ('anon'), ('authenticated'), ('service_role')) ro(rolname)
            cross join (values ('TRIGGER'), ('TRUNCATE')) pr(priv)
            where has_table_privilege(ro.rolname, 'public.' || t.tbl, pr.priv)
         ) as ok
  from (values ('marketplace_products'), ('marketplace_product_media'), ('marketplace_product_variants'),
               ('marketplace_payout_requests'), ('marketplace_vendors')) t(tbl)
),
data_checks as (
  select 'every store with an owner is on the probation register or holds a pre-gate identity waiver' as check_name,
         not exists (
           select 1 from public.marketplace_vendors v
            where v.owner_user_id is not null
              and v.owner_type is distinct from 'company'
              and not exists (select 1 from public.marketplace_seller_probation p where p.vendor_id = v.id)
              and not exists (
                select 1 from public.marketplace_seller_identity_waivers w
                 where w.vendor_id = v.id and w.owner_user_id = v.owner_user_id
              )
         ) as ok
  union all
  select 'every listing that is live has a verdict on record' as check_name,
         not exists (
           select 1 from public.marketplace_products p
            where p.approval_status = 'approved'
              and not exists (
                select 1 from public.marketplace_listing_gate_verdicts v
                 where v.product_id = p.id and v.outcome = 'publish' and v.consumed_at is not null
              )
         ) as ok
)
select check_name, case when ok then 'PASS' else 'FAIL' end as result from function_checks
union all
select check_name, case when ok then 'PASS' else 'FAIL' end from table_checks
union all
select check_name, case when ok then 'PASS' else 'FAIL' end from trigger_checks
union all
select check_name, case when ok then 'PASS' else 'FAIL' end from privilege_checks
union all
select check_name, case when ok then 'PASS' else 'FAIL' end from data_checks
order by 2, 1;

-- WHO CAN APPROVE A LISTING BY HAND. The guard only accepts a manual approval
-- from an account the marketplace treats as staff. If your own account is not in
-- this list, approving a held listing will be refused with a clear message.
select
  u.id as user_id,
  u.email,
  string_agg(distinct m.role, ', ' order by m.role) as marketplace_roles,
  bool_or(m.user_id is null) as granted_by_unclaimed_email_seed,
  (u.email_confirmed_at is not null) as email_verified
from auth.users u
join public.marketplace_role_memberships m
  on m.is_active = true
 and m.scope_type = 'platform'
 and m.role in ('marketplace_owner', 'marketplace_admin', 'moderation')
 and (m.user_id = u.id
      or (m.user_id is null and u.email_confirmed_at is not null and lower(btrim(u.email)) = m.normalized_email))
group by u.id, u.email, u.email_confirmed_at
order by u.email;
