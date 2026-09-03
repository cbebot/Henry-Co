-- F-08 (part 2) — DEFENSE IN DEPTH. *** NEEDS STAGING TEST BEFORE APPLY ***
-- anon/authenticated currently hold INSERT/UPDATE/DELETE on nearly all marketplace_*
-- tables. These writes are inert today ONLY because the policy set is SELECT-only — but a
-- future permissive write policy would auto-open a Data-API hole because the grant already
-- exists. Revoke write grants on tables the app only ever writes via service_role.
--
-- BEFORE APPLYING: confirm no PostgREST/Data-API writer (client supabase-js insert/update)
-- targets these tables. Tables with INTENTIONAL Data-API writes (e.g. user_comm_preferences
-- INSERT/UPDATE) are deliberately EXCLUDED below.

do $$
declare t text;
  -- tables whose writes are exclusively service_role in the app:
  targets text[] := array[
    'marketplace_orders','marketplace_order_groups','marketplace_order_items',
    'marketplace_payment_records','marketplace_payout_requests','marketplace_refunds',
    'marketplace_addresses','marketplace_carts','marketplace_cart_items',
    'marketplace_vendor_applications','marketplace_disputes','marketplace_user_notifications',
    'marketplace_wishlists','marketplace_vendor_follows','marketplace_recently_viewed',
    'marketplace_reviews','marketplace_products','marketplace_product_media',
    'marketplace_product_variants','marketplace_vendors','marketplace_shipments',
    'marketplace_support_threads','marketplace_support_messages',
    'marketplace_settings','marketplace_discount_codes','marketplace_payout_requests',
    'marketplace_audit_logs','marketplace_events','marketplace_behavior_events',
    'marketplace_notification_queue','marketplace_notification_attempts',
    'marketplace_moderation_cases','marketplace_reports','marketplace_returns',
    'marketplace_automation_runs','marketplace_deals_curation'
  ];
begin
  foreach t in array targets loop
    execute format('revoke insert, update, delete on public.%I from anon, authenticated', t);
  end loop;
end $$;
