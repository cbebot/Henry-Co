-- ============================================================================
-- V3-STAFF-SELFGRANT-FIX-01 — DAY-OF REVIEW (READ-ONLY). Runbook §6.3 "G10b".
-- Run in the Supabase SQL editor AFTER applying
-- 20260924120000_v3_staff_selfgrant_fix_01.sql (the apply closes the write path first,
-- so this list is final — nothing can be self-granted after it). Changes nothing.
-- R2's grant_source 'backfill:v3_staff_selfgrant_fix_01' marks every row that existed
-- before the fix: exactly the population the owner must judge.
--
-- The SQL editor shows only the LAST result set, so run each numbered block on its
-- own and save every result. The owner then decides, row by row, which accounts are
-- genuine staff and which go into remediate-self-granted-staff.sql.
-- ============================================================================

-- ── R1 · Headline counts ─────────────────────────────────────────────────────
select
  (select count(*) from auth.users u
    where not exists (select 1 from public.profiles p where p.id = u.id))            as g10_auth_users_without_profile,
  (select count(*) from public.profiles where lower(role) <> 'customer')              as non_customer_profiles,
  (select count(*) from public.profiles where lower(role) = 'staff')                  as role_staff,
  (select count(*) from public.profiles where lower(role) = 'owner')                  as role_owner,
  (select count(*) from public.profiles p join auth.users u on u.id = p.id
    where lower(p.role) <> 'customer'
      and coalesce(u.raw_app_meta_data ->> 'role', '') = '')                          as self_insert_shaped,
  (select count(*) from auth.users u
    left join public.profiles p on p.id = u.id
    where lower(coalesce(u.raw_app_meta_data ->> 'role', '')) in ('owner','manager','rider','support','staff')
      and lower(coalesce(p.role, 'customer')) = 'customer')                           as app_metadata_only_staff,
  (select count(*) from public.owner_profiles where role <> 'owner')                  as owner_console_non_owner_rows,
  (select count(*) from public.staff_role_grants where revoked_at is null)            as active_grants,
  (select count(*) from public.profiles p where lower(p.role) <> 'customer'
     and not exists (select 1 from public.staff_role_grants g where g.user_id = p.id
                     and g.revoked_at is null and g.role = lower(p.role)))            as unbacked_non_customer_rows_expect_0;

-- ── R2 · Every non-customer profiles row, with evidence (population A) ───────
-- verdict_hint is a HINT, not a verdict:
--   SELF-INSERT-SHAPED   app_metadata.role is empty. A PostgREST self-insert cannot set
--                        app_metadata, while care's provisioning (syncStaffIdentity) always
--                        writes it. Strongest signal of the hole being used.
--   METADATA-MISMATCH    app_metadata.role disagrees with profiles.role.
--   PROVISIONED-SHAPED   app_metadata.role matches. Genuine care provisioning looks like this,
--                        but so does an ordinary user that the pre-fix
--                        reconcileStaffDirectory() auto-promoted when the owner opened the
--                        care staff page. Check owner_console / memberships / email / activity.
select
  p.id                                                   as user_id,
  u.email,
  p.role                                                 as profile_role,
  u.raw_app_meta_data ->> 'role'                         as app_metadata_role,
  u.raw_user_meta_data ->> 'role'                        as user_metadata_role,
  op.role                                                as owner_console_role,
  op.is_active                                           as owner_console_active,
  (select string_agg(x, ', ') from (
      select 'marketplace:' || role x from public.marketplace_role_memberships m where m.user_id = p.id and m.is_active
      union all select 'studio:' || role from public.studio_role_memberships m where m.user_id = p.id and m.is_active
      union all select 'property:' || role from public.property_role_memberships m where m.user_id = p.id and m.is_active
      union all select 'learn:' || role from public.learn_role_memberships m where m.user_id = p.id and m.is_active
   ) mm)                                                 as active_division_memberships,
  u.created_at                                           as auth_created_at,
  p.created_at                                           as profile_created_at,
  round(extract(epoch from (p.created_at - u.created_at)))::bigint as profile_after_auth_seconds,
  u.last_sign_in_at,
  (u.email_confirmed_at is not null)                     as email_confirmed,
  p.is_active, p.is_frozen,
  g.source                                               as grant_source,
  (g.revoked_at is null)                                 as grant_active,
  case
    when coalesce(u.raw_app_meta_data ->> 'role', '') = ''                        then 'SELF-INSERT-SHAPED'
    when lower(u.raw_app_meta_data ->> 'role') <> lower(p.role)                   then 'METADATA-MISMATCH'
    else 'PROVISIONED-SHAPED'
  end                                                    as verdict_hint
from public.profiles p
join auth.users u on u.id = p.id
left join public.owner_profiles op on op.user_id = p.id
left join public.staff_role_grants g on g.user_id = p.id
where lower(p.role) <> 'customer'
order by verdict_hint, p.created_at desc;

-- ── R3 · App-metadata-only staff (population B) ──────────────────────────────
-- Accounts whose admin-set app_metadata.role is a staff role but whose profiles row is
-- 'customer' or missing. The DB (is_staff_in) never treated these as staff, but the care
-- app does: care resolves app_metadata.role first. The pre-fix reconcileStaffDirectory()
-- and care staff sign-in / recovery wrote app_metadata.role='staff' for ordinary customers
-- whose profiles UPDATE the guard rejected. Genuine staff normally have BOTH set.
select
  u.id                                 as user_id,
  u.email,
  u.raw_app_meta_data ->> 'role'       as app_metadata_role,
  u.raw_user_meta_data ->> 'role'      as user_metadata_role,
  p.role                               as profile_role,
  op.role                              as owner_console_role,
  u.created_at, u.last_sign_in_at
from auth.users u
left join public.profiles p on p.id = u.id
left join public.owner_profiles op on op.user_id = u.id
where lower(coalesce(u.raw_app_meta_data ->> 'role', '')) in ('owner','manager','rider','support','staff')
  and lower(coalesce(p.role, 'customer')) = 'customer'
order by u.created_at desc;

-- ── R4 · Owner-console rows (the owner_profiles self-promotion vector) ──────
select op.user_id, op.email, op.role, op.is_active, op.created_at, op.updated_at,
       p.role as profile_role
from public.owner_profiles op
left join public.profiles p on p.id = op.user_id
order by op.role, op.created_at;

-- ── R5 · user_metadata-only "staff" — REVIEW BEFORE DEPLOYING THE APP CHANGES ──
-- The app no longer reads user_metadata.role (it is self-writable). An account whose
-- staff role lives ONLY there — no admin-set app_metadata.role and no grant-backed
-- profiles.role — loses staff access when the app deploys. No in-repo provisioning path
-- creates such accounts (care and hub invites set app_metadata), but dashboard- or
-- hand-made accounts might. For each GENUINE staff member listed here, re-provision
-- through the care owner console or the hub invite flow (both set app_metadata) BEFORE
-- the deploy. Everyone else here merely self-declared a role: no action needed.
select u.id as user_id, u.email,
       u.raw_user_meta_data ->> 'role' as user_metadata_role,
       u.raw_app_meta_data ->> 'role'  as app_metadata_role,
       p.role as profile_role, u.created_at, u.last_sign_in_at
from auth.users u
left join public.profiles p on p.id = u.id
where lower(coalesce(u.raw_user_meta_data ->> 'role', '')) in ('owner','manager','rider','support','staff','admin')
  and coalesce(u.raw_app_meta_data ->> 'role', '') = ''
  and lower(coalesce(p.role, 'customer')) = 'customer'
order by u.last_sign_in_at desc nulls last;

-- ═════════════════════════════════════════════════════════════════════════════
-- FORENSICS for the same-class holes closed in sections 10–12 (read-only).
-- They answer "was this ALREADY exploited?" — each needs an owner decision.
-- ═════════════════════════════════════════════════════════════════════════════

-- ── R6 · KYC marked verified WITHOUT an approved, reviewer-signed submission ──
-- Genuine approval (apps/hub/lib/kyc-review-write.ts) sets verification_status =
-- 'verified' only when a customer_verification_submissions row is 'approved'. A verified
-- profile with no such row was very likely SELF-SET through the (now closed) direct
-- update — and passed the wallet-withdrawal KYC gate. Their withdrawal requests are
-- listed alongside: freezing/reviewing them is a MONEY decision for the owner (the
-- remediation script only resets KYC, with reset_kyc = true).
select cp.id as user_id, cp.email, cp.verification_status, cp.is_verified,
       cp.verification_reviewer_id, cp.verification_reviewed_at,
       (select count(*) from public.customer_verification_submissions s
         where s.user_id = cp.id)                                              as submissions_total,
       (select count(*) from public.customer_wallet_withdrawal_requests w
         where w.user_id = cp.id)                                              as withdrawal_requests,
       (select coalesce(sum(w.amount_kobo), 0) from public.customer_wallet_withdrawal_requests w
         where w.user_id = cp.id)                                              as withdrawal_kobo_total,
       (select string_agg(distinct w.status, ', ') from public.customer_wallet_withdrawal_requests w
         where w.user_id = cp.id)                                              as withdrawal_statuses
from public.customer_profiles cp
where (lower(coalesce(cp.verification_status, '')) = 'verified' or cp.is_verified is true)
  and not exists (
    select 1 from public.customer_verification_submissions s
    where s.user_id = cp.id and lower(s.status) = 'approved' and s.reviewer_id is not null
  )
order by withdrawal_kobo_total desc, cp.verification_reviewed_at desc nulls last;

-- ── R7 · Addresses marked KYC-verified — the evidence behind each ─────────────
-- Display-only today (no flow sets AddressSelector requireKycVerified), so this is lower
-- priority; rows with no match method/score/submission are the suspicious ones.
select a.id, a.user_id, a.label, a.city, a.kyc_verified_at, a.kyc_match_method,
       a.kyc_match_score, a.kyc_submission_id,
       (select s.status from public.customer_verification_submissions s where s.id = a.kyc_submission_id) as submission_status
from public.user_addresses a
where a.kyc_verified
order by (a.kyc_match_method is null and a.kyc_submission_id is null) desc, a.kyc_verified_at desc nulls last;

-- ── R8 · Internal-comms memberships in owners-only threads held by non-owners ──
-- The (now closed) escape moved a membership row into an all_owners thread with a
-- FILTERLESS update. A member of an all_owners thread who is not an active owner is the
-- signature; the app itself adds members via the service role (check the owner knows).
select m.thread_id, t.slug, t.title, t.visibility, m.user_id, m.role, m.joined_at,
       (select op.role from public.owner_profiles op where op.user_id = m.user_id and op.is_active) as owner_console_role
from public.hq_internal_comm_thread_members m
join public.hq_internal_comm_threads t on t.id = m.thread_id
where t.visibility = 'all_owners'
  and not exists (select 1 from public.owner_profiles op
                  where op.user_id = m.user_id and op.is_active and op.role in ('owner', 'admin'))
order by m.joined_at desc;

-- ── R9 · MONEY (escalation, read-only): 'succeeded' payment intents with NO provider-
--    confirmed attempt. A signed-in user can INSERT their own payment_intents row with
--    status 'succeeded' (insert policy checks only user_id; the transition/freeze triggers
--    fire on UPDATE only). payment_intents is money-spine — NOT changed by this pass; the
--    owner decides the fix (see docs/v3/staff-selfgrant-fix-01/README.md "Money escalation").
select pi.id, pi.user_id, pi.amount_minor, pi.currency, pi.method, pi.status, pi.division,
       pi.provider_reference, pi.created_at,
       (select count(*) from public.payment_attempts a where a.intent_id = pi.id)            as attempts,
       (select string_agg(distinct a.status, ', ') from public.payment_attempts a where a.intent_id = pi.id) as attempt_statuses
from public.payment_intents pi
where lower(pi.status) in ('succeeded', 'refund_processing', 'refunded')
  and not exists (select 1 from public.payment_attempts a
                  where a.intent_id = pi.id and lower(a.status) in ('succeeded', 'success', 'successful'))
order by pi.created_at desc;
