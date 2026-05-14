-- Wrap raw `auth.<fn>()` calls in RLS policies with `(SELECT auth.<fn>())`
-- on 200 policies flagged by the Supabase advisor (`auth_rls_initplan`).
--
-- Why: Postgres evaluates RLS USING/WITH CHECK expressions PER ROW by
-- default. When such an expression calls `auth.uid()` directly, the
-- function is invoked on every row. Wrapping the call inside a scalar
-- subquery `(SELECT auth.uid())` lets Postgres recognise it as a stable
-- input and compute it ONCE per query — typically 10-100× faster on
-- list endpoints with thousands of rows.
--
-- Remediation reference:
-- https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select
-- https://supabase.com/docs/guides/database/database-linter?lint=0003_auth_rls_initplan
--
-- Safety properties of this DO block:
--   • Runs in a single transaction — partial failure rolls back ALL drops + creates.
--   • Idempotent: collapses any pre-existing `(SELECT auth.X())` wrap before
--     re-wrapping, so a second apply cannot produce `(SELECT (SELECT auth.X()))`.
--   • Only rewrites a policy when the rewritten text actually differs from
--     the current text — no-op churn is skipped.
--   • Targets exactly the 200 (table, policy) pairs reported by the advisor
--     on 2026-05-14. Any policy the advisor did not flag is untouched.
--   • Uses `format(%I, ...)` for every identifier — no SQL injection risk
--     from policy or role names containing quotes.
--   • At the end, RAISES NOTICE with the number of policies actually rewritten;
--     compare against the expected 200 in the apply log.
--
-- Apply protocol recommendation:
--   1. Apply on a Supabase preview branch first.
--   2. Verify NOTICE count = 200 (give or take any policies dropped since
--      the advisor snapshot was taken).
--   3. Run smoke tests on policies for at least 3 high-traffic tables
--      (auth-gated reads + writes).
--   4. Re-run the advisor → confirm 200 `auth_rls_initplan` lints drop to 0.
--   5. Merge to main.

do $$
declare
  pol record;
  new_qual text;
  new_check text;
  collapse_rx constant text := '\(\s*[Ss][Ee][Ll][Ee][Cc][Tt]\s+(auth\.(?:uid|role|email|jwt|claims)\(\s*\))\s*\)';
  wrap_rx     constant text := '(auth\.(?:uid|role|email|jwt|claims)\(\s*\))';
  any_auth_rx constant text := 'auth\.(?:uid|role|email|jwt|claims)\(';
  pair text[];
  roles_str text;
  rewritten int := 0;
  not_found int := 0;
  skipped_no_auth int := 0;
  targets text[][] := array[
    array['profiles', 'Profiles: user can read own profile'],
    array['profiles', 'Profiles: user can update own profile'],
    array['addresses', 'Addresses: owner can read/write own'],
    array['profiles', 'profiles_select_own'],
    array['order_items', 'Order items: read if can read order'],
    array['order_items', 'Order items: insert if customer owns order'],
    array['order_items', 'Order items: update if owner/manager or assigned'],
    array['order_status_history', 'Status history: read if can read order'],
    array['order_status_history', 'Status history: insert by owner/manager/assigned'],
    array['profiles', 'profiles_update_own'],
    array['profiles', 'profiles_insert_own'],
    array['staff_audit_logs', 'audit_logs_owner_select'],
    array['profiles', 'profiles_self_select'],
    array['audit_logs', 'owner can read audit logs'],
    array['orders', 'owner can read orders'],
    array['profiles', 'profiles_select_self_or_owner'],
    array['profiles', 'profiles_update_self'],
    array['audit_logs', 'audit_logs_insert_self'],
    array['audit_logs', 'audit_logs_select_owner_or_self'],
    array['staff_expenses', 'staff_expenses_select_policy'],
    array['staff_expenses', 'staff_expenses_insert_policy'],
    array['staff_expenses', 'staff_expenses_update_policy'],
    array['delivery_proofs', 'delivery_proofs_select_policy'],
    array['delivery_proofs', 'delivery_proofs_insert_policy'],
    array['company_site_settings', 'company_site_settings_owner_select'],
    array['company_site_settings', 'company_site_settings_owner_insert'],
    array['company_site_settings', 'company_site_settings_owner_update'],
    array['customer_preferences', 'Users can insert own preferences'],
    array['company_homepages', 'company_homepages_owner_select'],
    array['company_homepages', 'company_homepages_owner_insert'],
    array['company_homepages', 'company_homepages_owner_update'],
    array['company_pages', 'company_pages_owner_select'],
    array['company_pages', 'company_pages_owner_insert'],
    array['company_pages', 'company_pages_owner_update'],
    array['company_divisions', 'company_divisions_owner_select'],
    array['company_divisions', 'company_divisions_owner_update'],
    array['owner_profiles', 'owner_profiles_select_own'],
    array['owner_profiles', 'owner_profiles_update_own'],
    array['company_site_settings', 'company_site_settings_owner_all'],
    array['company_homepages', 'company_homepages_owner_all'],
    array['company_homepage_faqs', 'company_homepage_faqs_owner_all'],
    array['company_people', 'company_people_owner_all'],
    array['owner_profiles', 'owner_profiles_select_self_or_owner'],
    array['company_pages', 'company_pages_owner_all'],
    array['company_divisions', 'company_divisions_owner_all'],
    array['customer_profiles', 'Users can view own profile'],
    array['customer_profiles', 'Users can update own profile'],
    array['customer_profiles', 'Service role full access to customer_profiles'],
    array['customer_preferences', 'Users can view own preferences'],
    array['customer_preferences', 'Users can update own preferences'],
    array['customer_preferences', 'Service role full access to customer_preferences'],
    array['customer_wallets', 'Users can view own wallet'],
    array['customer_wallets', 'Service role full access to customer_wallets'],
    array['customer_wallet_transactions', 'Users can view own wallet transactions'],
    array['customer_wallet_transactions', 'Service role full access to customer_wallet_transactions'],
    array['customer_notifications', 'Users can view own notifications'],
    array['customer_notifications', 'Users can update own notifications'],
    array['customer_notifications', 'Service role full access to customer_notifications'],
    array['customer_addresses', 'Users can manage own addresses'],
    array['customer_addresses', 'Service role full access to customer_addresses'],
    array['customer_activity', 'Users can view own activity'],
    array['customer_activity', 'Service role full access to customer_activity'],
    array['support_threads', 'Users can view own support threads'],
    array['support_threads', 'Users can create support threads'],
    array['support_threads', 'Users can update own support threads'],
    array['support_threads', 'Service role full access to support_threads'],
    array['support_messages', 'Users can view messages in own threads'],
    array['support_messages', 'Users can create messages in own threads'],
    array['support_messages', 'Service role full access to support_messages'],
    array['customer_subscriptions', 'Users can view own subscriptions'],
    array['customer_subscriptions', 'Service role full access to customer_subscriptions'],
    array['customer_invoices', 'Users can view own invoices'],
    array['customer_invoices', 'Service role full access to customer_invoices'],
    array['customer_documents', 'Users can manage own documents'],
    array['customer_documents', 'Service role full access to customer_documents'],
    array['customer_payment_methods', 'Users can manage own payment methods'],
    array['customer_payment_methods', 'Service role full access to customer_payment_methods'],
    array['customer_security_log', 'Users can view own security log'],
    array['customer_security_log', 'Service role full access to customer_security_log'],
    array['marketplace_role_memberships', 'marketplace_member_roles'],
    array['marketplace_carts', 'marketplace_member_carts'],
    array['marketplace_vendor_follows', 'marketplace_member_follows'],
    array['marketplace_cart_items', 'marketplace_member_cart_items'],
    array['marketplace_orders', 'marketplace_member_orders'],
    array['marketplace_order_groups', 'marketplace_member_order_groups'],
    array['marketplace_order_items', 'marketplace_member_order_items'],
    array['marketplace_shipments', 'marketplace_member_shipments'],
    array['marketplace_payment_records', 'marketplace_member_payments'],
    array['marketplace_addresses', 'marketplace_member_addresses'],
    array['marketplace_wishlists', 'marketplace_member_wishlists'],
    array['marketplace_recently_viewed', 'marketplace_member_recent'],
    array['marketplace_user_notifications', 'marketplace_member_notifications'],
    array['marketplace_vendor_applications', 'marketplace_member_vendor_applications'],
    array['marketplace_disputes', 'marketplace_member_disputes'],
    array['marketplace_support_threads', 'marketplace_member_support_threads'],
    array['marketplace_support_messages', 'marketplace_member_support_messages'],
    array['marketplace_user_comm_preferences', 'marketplace_member_comm_preferences_select'],
    array['marketplace_user_comm_preferences', 'marketplace_member_comm_preferences_insert'],
    array['marketplace_user_comm_preferences', 'marketplace_member_comm_preferences_update'],
    array['care_bookings', 'Service role full access to care_bookings'],
    array['care_bookings', 'Users can view own bookings'],
    array['care_bookings', 'Users can view bookings by email'],
    array['hq_internal_comm_messages', 'hq_ic_messages_insert'],
    array['hq_internal_comm_thread_members', 'hq_ic_members_insert'],
    array['hq_internal_comm_thread_members', 'hq_ic_members_update'],
    array['hq_internal_comm_attachments', 'hq_ic_attachments_insert'],
    array['hq_internal_comm_attachments', 'hq_ic_attachments_update'],
    array['hq_internal_comm_presence', 'hq_ic_presence_select'],
    array['hq_internal_comm_presence', 'hq_ic_presence_upsert'],
    array['hq_internal_comm_presence', 'hq_ic_presence_update'],
    array['orders', 'orders_insert_authenticated'],
    array['care_reviews', 'care_reviews_insert_authenticated'],
    array['support_thread_events', 'Service role full access to support_thread_events'],
    array['support_thread_events', 'Users can view events on own threads'],
    array['support_thread_internal_notes', 'Service role full access to support_thread_internal_notes'],
    array['customer_verification_submissions', 'Service role full access to customer_verification_submissions'],
    array['customer_verification_submissions', 'Users can view own verification submissions'],
    array['marketplace_vendor_trust_snapshots', 'staff_read_vendor_trust_snapshots'],
    array['pricing_rule_books', 'pricing_rule_books_service_only'],
    array['pricing_quotes', 'pricing_quotes_service_only'],
    array['pricing_override_events', 'pricing_override_events_service_only'],
    array['notification_delivery_log', 'users can read own delivery log'],
    array['notification_delivery_log', 'service role manages delivery log'],
    array['email_subscribers', 'email_subscribers_service_role'],
    array['email_subscriber_topics', 'email_subscriber_topics_service_role'],
    array['email_suppression_list', 'email_suppression_list_service_role'],
    array['email_audience_segments', 'email_audience_segments_service_role'],
    array['email_brand_voice_rules', 'email_brand_voice_rules_service_role'],
    array['email_campaigns', 'email_campaigns_service_role'],
    array['email_campaign_sends', 'email_campaign_sends_service_role'],
    array['email_editorial_events', 'email_editorial_events_service_role'],
    array['email_draft_assists', 'email_draft_assists_service_role'],
    array['marketplace_deals_curation', 'marketplace_deals_curation_admin_all'],
    array['user_addresses', 'user_addresses_owner_select'],
    array['user_addresses', 'user_addresses_owner_insert'],
    array['user_addresses', 'user_addresses_owner_update'],
    array['user_addresses', 'user_addresses_owner_delete'],
    array['saved_items', 'saved_items_owner_select'],
    array['saved_items', 'saved_items_owner_insert'],
    array['saved_items', 'saved_items_owner_update'],
    array['saved_items', 'saved_items_owner_delete'],
    array['user_engagement_events', 'user_engagement_events_owner_select'],
    array['cart_recovery_state', 'cart_recovery_state_owner_select'],
    array['cart_recovery_state', 'cart_recovery_state_owner_upsert'],
    array['cart_recovery_state', 'cart_recovery_state_owner_update'],
    array['recently_viewed_items', 'recently_viewed_items_owner_select'],
    array['recently_viewed_items', 'recently_viewed_items_owner_upsert'],
    array['recently_viewed_items', 'recently_viewed_items_owner_update'],
    array['recently_viewed_items', 'recently_viewed_items_owner_delete'],
    array['search_workflow_targets', 'workflow_targets_owner_select'],
    array['property_listings', 'owners can read own listings'],
    array['property_listings', 'owners can update own listings'],
    array['property_inquiries', 'users can read own inquiries'],
    array['property_inquiries', 'users can insert own inquiries'],
    array['property_viewing_requests', 'users can read own viewings'],
    array['property_viewing_requests', 'users can insert own viewings'],
    array['property_listing_applications', 'owners can read own applications'],
    array['property_listing_applications', 'owners can insert own applications'],
    array['property_saved_listings', 'users can read own saved listings'],
    array['property_saved_listings', 'users can manage own saved listings'],
    array['studio_role_memberships', 'studio_member_roles'],
    array['studio_message_reactions', 'studio_message_reactions_delete'],
    array['studio_message_read_receipts', 'studio_message_read_receipts_select'],
    array['studio_message_read_receipts', 'studio_message_read_receipts_insert'],
    array['studio_typing_indicators', 'studio_typing_indicators_select'],
    array['studio_leads', 'studio_member_leads'],
    array['studio_briefs', 'studio_member_briefs'],
    array['studio_brief_files', 'studio_member_brief_files'],
    array['studio_proposals', 'studio_member_proposals'],
    array['studio_proposal_milestones', 'studio_member_proposal_milestones'],
    array['studio_projects', 'studio_member_projects'],
    array['studio_project_assignments', 'studio_member_project_assignments'],
    array['studio_project_milestones', 'studio_member_project_milestones'],
    array['studio_revisions', 'studio_member_revisions'],
    array['studio_project_files', 'studio_member_project_files'],
    array['studio_deliverables', 'studio_member_deliverables'],
    array['studio_project_messages', 'studio_member_project_messages'],
    array['studio_payments', 'studio_member_payments'],
    array['studio_notifications', 'studio_member_notifications'],
    array['studio_custom_requests', 'studio_member_custom_requests'],
    array['studio_project_updates', 'studio_member_project_updates'],
    array['studio_invoices', 'studio_invoices_select'],
    array['studio_payments', 'studio_member_payments_insert'],
    array['studio_project_messages', 'studio_member_messages_insert'],
    array['studio_project_messages', 'studio_member_messages_update'],
    array['studio_deliverables', 'studio_member_deliverables_approve'],
    array['studio_brief_drafts', 'studio_brief_drafts_select'],
    array['studio_message_reactions', 'studio_message_reactions_select'],
    array['studio_message_reactions', 'studio_message_reactions_insert'],
    array['studio_typing_indicators', 'studio_typing_indicators_insert'],
    array['studio_typing_indicators', 'studio_typing_indicators_update'],
    array['studio_typing_indicators', 'studio_typing_indicators_delete'],
    array['staff_notifications', 'staff can read targeted notifications'],
    array['staff_notifications', 'service role manages staff notifications'],
    array['staff_notification_states', 'staff can read own notification state'],
    array['staff_notification_states', 'staff can insert own notification state'],
    array['staff_notification_states', 'staff can update own notification state'],
    array['staff_notification_states', 'service role manages staff notification states'],
    array['audit_logs', 'staff can read audit logs in their divisions'],
    array['audit_logs', 'service role manages audit logs']
  ];
begin
  foreach pair slice 1 in array targets
  loop
    select *
      into pol
      from pg_policies
     where schemaname = 'public'
       and tablename = pair[1]
       and policyname = pair[2]
     limit 1;

    if not found then
      not_found := not_found + 1;
      continue;
    end if;

    -- Skip if neither qual nor with_check references auth.* — protects
    -- against a policy that was renamed but no longer has the pattern.
    if  (pol.qual is null or pol.qual !~ any_auth_rx)
    and (pol.with_check is null or pol.with_check !~ any_auth_rx)
    then
      skipped_no_auth := skipped_no_auth + 1;
      continue;
    end if;

    -- Collapse any existing `(SELECT auth.X())` wrap, then wrap fresh.
    new_qual := pol.qual;
    if new_qual is not null then
      new_qual := regexp_replace(new_qual, collapse_rx, '\1', 'g');
      new_qual := regexp_replace(new_qual, wrap_rx, '(SELECT \1)', 'g');
    end if;

    new_check := pol.with_check;
    if new_check is not null then
      new_check := regexp_replace(new_check, collapse_rx, '\1', 'g');
      new_check := regexp_replace(new_check, wrap_rx, '(SELECT \1)', 'g');
    end if;

    if new_qual is not distinct from pol.qual
       and new_check is not distinct from pol.with_check
    then
      continue;
    end if;

    -- Build space-and-comma role list, quoted.
    select string_agg(quote_ident(r), ', ') into roles_str
      from unnest(pol.roles) r;

    execute format('drop policy if exists %I on public.%I', pair[2], pair[1]);

    execute format(
      'create policy %I on public.%I as %s for %s%s%s%s',
      pair[2],
      pair[1],
      pol.permissive,
      pol.cmd,
      case when roles_str is not null and roles_str <> '' then ' to ' || roles_str else '' end,
      case when new_qual is not null then ' using (' || new_qual || ')' else '' end,
      case when new_check is not null then ' with check (' || new_check || ')' else '' end
    );

    rewritten := rewritten + 1;
  end loop;

  raise notice 'auth_rls_initplan wrap: rewrote=%, not_found=%, skipped_no_auth=%',
    rewritten, not_found, skipped_no_auth;
end $$;
