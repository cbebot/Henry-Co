-- =============================================================================
-- V3-MKT-TRUST-01 - DAY-OF PREFLIGHT.  READ ONLY: it changes nothing.
--
-- Run this in the Supabase SQL editor BEFORE applying
-- 20261002120000_v3_mkt_trust_01_instant_publish.sql.
--
-- It answers one question: does production have every object the migration and
-- the gate's runtime code assume? The migration's functions are PL/pgSQL, and
-- PL/pgSQL does not check a function body when it is created - a missing column
-- would only surface the first time a seller presses Publish. This finds it now.
--
-- Read the `verdict` column:
--   REQUIRED ... MISSING  -> STOP. Do not apply. Tell the engineer which row.
--   optional ... absent   -> fine; the named feature simply stays switched off.
-- =============================================================================

with required_columns(tbl, col) as (
  values
    ('public.marketplace_products', 'id'), ('public.marketplace_products', 'slug'),
    ('public.marketplace_products', 'vendor_id'), ('public.marketplace_products', 'category_id'),
    ('public.marketplace_products', 'brand_id'), ('public.marketplace_products', 'title'),
    ('public.marketplace_products', 'summary'), ('public.marketplace_products', 'description'),
    ('public.marketplace_products', 'base_price'), ('public.marketplace_products', 'compare_at_price'),
    ('public.marketplace_products', 'currency'), ('public.marketplace_products', 'sku'),
    ('public.marketplace_products', 'delivery_note'), ('public.marketplace_products', 'lead_time'),
    ('public.marketplace_products', 'cod_eligible'), ('public.marketplace_products', 'inventory_owner_type'),
    ('public.marketplace_products', 'specifications'), ('public.marketplace_products', 'trust_badges'),
    ('public.marketplace_products', 'filter_data'), ('public.marketplace_products', 'approval_status'),
    ('public.marketplace_products', 'status'), ('public.marketplace_products', 'total_stock'),
    ('public.marketplace_products', 'reviewed_by'), ('public.marketplace_products', 'reviewed_at'),
    ('public.marketplace_products', 'updated_at'),
    ('public.marketplace_product_media', 'product_id'), ('public.marketplace_product_media', 'url'),
    ('public.marketplace_product_media', 'kind'), ('public.marketplace_product_media', 'sort_order'),
    ('public.marketplace_product_media', 'is_primary'), ('public.marketplace_product_media', 'created_at'),
    ('public.marketplace_vendors', 'id'), ('public.marketplace_vendors', 'slug'),
    ('public.marketplace_vendors', 'name'), ('public.marketplace_vendors', 'description'),
    ('public.marketplace_vendors', 'owner_user_id'), ('public.marketplace_vendors', 'owner_type'),
    ('public.marketplace_vendors', 'status'), ('public.marketplace_vendors', 'seller_tier'),
    ('public.marketplace_vendors', 'verification_level'), ('public.marketplace_vendors', 'trust_score'),
    ('public.marketplace_vendors', 'response_sla_hours'), ('public.marketplace_vendors', 'fulfillment_rate'),
    ('public.marketplace_vendors', 'dispute_rate'), ('public.marketplace_vendors', 'review_score'),
    ('public.marketplace_vendors', 'followers_count'), ('public.marketplace_vendors', 'badges'),
    ('public.marketplace_vendors', 'support_email'), ('public.marketplace_vendors', 'support_phone'),
    ('public.marketplace_vendors', 'created_at'),
    ('public.marketplace_vendor_applications', 'id'), ('public.marketplace_vendor_applications', 'user_id'),
    ('public.marketplace_vendor_applications', 'status'), ('public.marketplace_vendor_applications', 'store_name'),
    ('public.marketplace_vendor_applications', 'proposed_store_slug'), ('public.marketplace_vendor_applications', 'story'),
    ('public.marketplace_vendor_applications', 'normalized_email'), ('public.marketplace_vendor_applications', 'contact_phone'),
    ('public.marketplace_vendor_applications', 'agreement_accepted_at'), ('public.marketplace_vendor_applications', 'reviewed_at'),
    ('public.marketplace_vendor_applications', 'review_note'), ('public.marketplace_vendor_applications', 'reviewed_by'),
    ('public.marketplace_vendor_applications', 'documents_json'), ('public.marketplace_vendor_applications', 'created_at'),
    ('public.marketplace_product_variants', 'product_id'), ('public.marketplace_product_variants', 'sku'),
    ('public.marketplace_product_variants', 'options'), ('public.marketplace_product_variants', 'price'),
    ('public.marketplace_product_variants', 'compare_at_price'), ('public.marketplace_product_variants', 'currency'),
    ('public.marketplace_product_variants', 'media_id'),
    ('public.marketplace_role_memberships', 'user_id'), ('public.marketplace_role_memberships', 'normalized_email'),
    ('public.marketplace_role_memberships', 'scope_type'), ('public.marketplace_role_memberships', 'scope_id'),
    ('public.marketplace_role_memberships', 'role'), ('public.marketplace_role_memberships', 'is_active'),
    ('public.marketplace_order_groups', 'vendor_id'), ('public.marketplace_order_groups', 'fulfillment_status'),
    ('public.marketplace_payout_requests', 'vendor_id'), ('public.marketplace_payout_requests', 'status'),
    ('public.customer_profiles', 'id'), ('public.customer_profiles', 'verification_status'),
    ('public.customer_verification_submissions', 'user_id'), ('public.customer_verification_submissions', 'document_type'),
    ('public.customer_verification_submissions', 'status'), ('public.customer_verification_submissions', 'reviewer_id'),
    ('auth.users', 'id'), ('auth.users', 'email'), ('auth.users', 'email_confirmed_at'), ('auth.users', 'created_at'),
    ('public.marketplace_products', 'id'), ('public.marketplace_products', 'slug'),
    ('public.marketplace_products', 'base_price'), ('public.marketplace_vendors', 'updated_at')
),
column_checks as (
  select
    'REQUIRED column ' || r.tbl || '.' || r.col as item,
    case when exists (
      select 1 from information_schema.columns c
       where c.table_schema || '.' || c.table_name = r.tbl and c.column_name = r.col
    ) then 'present' else 'MISSING' end as verdict,
    'the migration or the gate reads/writes it' as why
  from required_columns r
),
other_required(item, ok, why) as (
  values
    ('REQUIRED function public.marketplace_tier_listing_cap(text)',
     to_regprocedure('public.marketplace_tier_listing_cap(text)') is not null,
     'the store-state function calls it for the plan allowance'),
    ('REQUIRED role anon', exists (select 1 from pg_roles where rolname = 'anon'), 'grants are revoked from it'),
    ('REQUIRED role authenticated', exists (select 1 from pg_roles where rolname = 'authenticated'), 'grants are revoked from it'),
    ('REQUIRED role service_role (bypassrls)',
     exists (select 1 from pg_roles where rolname = 'service_role' and rolbypassrls),
     'the app writes through it; the guard treats it as a trusted caller'),
    ('REQUIRED extension pgcrypto / sha256()',
     to_regprocedure('sha256(bytea)') is not null,
     'the content hash uses sha256')
),
optional_objects(item, ok, why) as (
  values
    ('optional table public.moderation_reports (V3-25)',
     to_regclass('public.moderation_reports') is not null,
     'absent -> the "three buyers reported it" take-down never fires'),
    ('optional table public.marketplace_moderation_cases',
     to_regclass('public.marketplace_moderation_cases') is not null,
     'absent -> held listings are still held, but no staff-queue case is opened'),
    ('optional table public.risk_enforcement_log (V3-40)',
     to_regclass('public.risk_enforcement_log') is not null,
     'absent -> staff risk holds are not read; the deterministic rules still decide'),
    ('optional function public.internal_ai_spend_add(text,bigint) (V3-43)',
     to_regprocedure('public.internal_ai_spend_add(text,bigint)') is not null,
     'absent -> the optional AI screen is skipped; the deterministic rules still decide'),
    ('optional table public.trust_flags',
     to_regclass('public.trust_flags') is not null,
     'absent -> open trust flags are not consulted at onboarding'),
    ('optional table public.henry_events',
     to_regclass('public.henry_events') is not null,
     'absent -> gate decisions are logged but not stored as queryable events')
),
already_applied(item, ok, why) as (
  values
    ('state: gate ledger already exists',
     to_regclass('public.marketplace_listing_gate_verdicts') is not null,
     'true -> the migration was applied before (it is idempotent; re-applying is safe)')
)
select item, verdict, why
from (
  select item, verdict, why from column_checks
  union all
  select item, case when ok then 'present' else 'MISSING' end, why from other_required
  union all
  select item, case when ok then 'present' else 'absent' end, why from optional_objects
  union all
  select item, case when ok then 'yes' else 'no' end, why from already_applied
) results
order by
  case
    when verdict = 'MISSING' then 0
    when item like 'optional%' then 2
    when item like 'state:%' then 3
    else 1
  end,
  item;
