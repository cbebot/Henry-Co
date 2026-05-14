-- Add covering indexes for 218 foreign keys flagged by the Supabase
-- advisor (`unindexed_foreign_keys`).
--
-- A foreign key without a covering index forces a sequential scan on the
-- referenced table any time the parent row is updated/deleted or any time
-- a CASCADE/SET NULL cascades — degrading both write performance and the
-- planner's ability to use index-only joins.
--
-- Remediation reference:
-- https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys
--
-- The DO block resolves each foreign key's column list at apply time via
-- pg_constraint, so it generates the correct multi-column index name and
-- column order regardless of how the FK was originally defined. The index
-- name is derived from the constraint name (`<fk>_idx`) and creation is
-- idempotent (`create index if not exists`).

do $$
declare
  r record;
  idx_name text;
  fk_names text[] := array[
    'addresses_user_id_fkey','addresses_zone_id_fkey','care_expenses_booking_id_fkey',
    'care_notification_queue_payment_request_id_fkey','company_divisions_lead_person_id_fkey',
    'company_homepages_updated_by_fkey','company_people_division_slug_fkey',
    'company_site_settings_updated_by_fkey','customer_payment_methods_user_id_fkey',
    'customer_profiles_verification_reviewer_id_fkey','customer_subscriptions_user_id_fkey',
    'customer_verification_submissions_document_id_fkey',
    'customer_verification_submissions_reviewer_id_fkey',
    'data_recovery_drill_runs_actor_user_id_fkey','email_campaigns_approved_by_fkey',
    'email_campaigns_author_id_fkey','email_campaigns_segment_id_fkey',
    'email_draft_assists_accepted_by_fkey','email_editorial_events_actor_id_fkey',
    'email_suppression_list_recorded_by_fkey','hq_internal_comm_attachments_uploader_id_fkey',
    'hq_internal_comm_messages_author_id_fkey','hq_internal_comm_messages_parent_id_fkey',
    'jobs_applications_candidate_id_fkey','jobs_applications_pipeline_id_fkey',
    'jobs_contact_masks_user_id_fkey','jobs_conversations_application_id_fkey',
    'jobs_conversations_candidate_id_fkey','jobs_conversations_employer_id_fkey',
    'jobs_conversations_pipeline_id_fkey','jobs_hiring_pipelines_company_id_fkey',
    'jobs_hiring_pipelines_employer_id_fkey','jobs_interviews_application_id_fkey',
    'jobs_interviews_candidate_id_fkey','jobs_interviews_conversation_id_fkey',
    'jobs_interviews_interviewer_id_fkey','jobs_interviews_pipeline_id_fkey',
    'jobs_messages_conversation_id_fkey','jobs_messages_sender_id_fkey',
    'learn_assignments_assigned_by_user_id_fkey','learn_assignments_course_id_fkey',
    'learn_assignments_path_id_fkey','learn_assignments_user_id_fkey',
    'learn_certificate_verification_certificate_id_fkey',
    'learn_certificate_verification_course_id_fkey','learn_certificates_course_id_fkey',
    'learn_certificates_enrollment_id_fkey','learn_certificates_user_id_fkey',
    'learn_courses_category_id_fkey','learn_courses_plan_id_fkey',
    'learn_courses_primary_instructor_id_fkey','learn_enrollments_course_id_fkey',
    'learn_enrollments_last_lesson_id_fkey','learn_learning_paths_plan_id_fkey',
    'learn_lesson_resources_lesson_id_fkey','learn_lessons_course_id_fkey',
    'learn_lessons_module_id_fkey','learn_modules_course_id_fkey',
    'learn_path_items_course_id_fkey','learn_path_items_path_id_fkey',
    'learn_payments_course_id_fkey','learn_payments_enrollment_id_fkey',
    'learn_payments_user_id_fkey','learn_progress_course_id_fkey',
    'learn_progress_enrollment_id_fkey','learn_progress_lesson_id_fkey',
    'learn_progress_module_id_fkey','learn_quiz_attempts_enrollment_id_fkey',
    'learn_quiz_attempts_quiz_id_fkey','learn_quiz_attempts_user_id_fkey',
    'learn_quiz_questions_quiz_id_fkey','learn_quizzes_course_id_fkey',
    'learn_quizzes_lesson_id_fkey','learn_reviews_course_id_fkey',
    'learn_reviews_user_id_fkey','learn_saved_courses_course_id_fkey',
    'learn_saved_courses_user_id_fkey',
    'learn_teacher_applications_instructor_membership_id_fkey',
    'learn_teacher_applications_reviewed_by_user_id_fkey',
    'logistics_addresses_shipment_id_fkey','logistics_assignments_shipment_id_fkey',
    'logistics_events_shipment_id_fkey','logistics_expenses_shipment_id_fkey',
    'logistics_issues_shipment_id_fkey','logistics_notifications_shipment_id_fkey',
    'logistics_proof_of_delivery_shipment_id_fkey','logistics_rate_cards_zone_id_fkey',
    'logistics_role_memberships_user_id_fkey','logistics_shipments_customer_user_id_fkey',
    'logistics_shipments_zone_id_fkey','marketplace_addresses_user_id_fkey',
    'marketplace_audit_logs_actor_user_id_fkey','marketplace_behavior_events_user_id_fkey',
    'marketplace_cart_items_product_id_fkey','marketplace_cart_items_vendor_id_fkey',
    'marketplace_carts_user_id_fkey','marketplace_categories_parent_id_fkey',
    'marketplace_collection_items_collection_id_fkey',
    'marketplace_collection_items_product_id_fkey','marketplace_disputes_assigned_to_fkey',
    'marketplace_disputes_order_id_fkey','marketplace_disputes_vendor_id_fkey',
    'marketplace_events_actor_user_id_fkey','marketplace_moderation_cases_assigned_to_fkey',
    'marketplace_notification_queue_event_id_fkey',
    'marketplace_notification_queue_user_id_fkey','marketplace_order_groups_vendor_id_fkey',
    'marketplace_order_items_order_id_fkey','marketplace_order_items_product_id_fkey',
    'marketplace_order_items_vendor_id_fkey','marketplace_payment_records_order_id_fkey',
    'marketplace_payment_records_verified_by_fkey',
    'marketplace_payout_requests_requested_by_fkey',
    'marketplace_payout_requests_reviewed_by_fkey',
    'marketplace_payout_requests_vendor_id_fkey','marketplace_product_media_product_id_fkey',
    'marketplace_products_brand_id_fkey','marketplace_products_reviewed_by_fkey',
    'marketplace_recently_viewed_product_id_fkey','marketplace_reports_assigned_to_fkey',
    'marketplace_reports_reporter_user_id_fkey','marketplace_returns_order_item_id_fkey',
    'marketplace_reviews_order_item_id_fkey','marketplace_reviews_product_id_fkey',
    'marketplace_reviews_user_id_fkey','marketplace_reviews_vendor_id_fkey',
    'marketplace_support_messages_user_id_fkey','marketplace_support_threads_user_id_fkey',
    'marketplace_vendor_applications_reviewed_by_fkey',
    'marketplace_vendor_applications_user_id_fkey',
    'marketplace_vendor_follows_vendor_id_fkey','marketplace_vendors_owner_user_id_fkey',
    'marketplace_wishlists_product_id_fkey','notification_delivery_log_actor_user_id_fkey',
    'order_items_order_id_fkey','order_status_history_changed_by_fkey',
    'order_status_history_order_id_fkey','orders_assigned_rider_id_fkey',
    'orders_customer_id_fkey','orders_delivery_address_id_fkey',
    'orders_pickup_address_id_fkey','pricing_override_events_actor_user_id_fkey',
    'pricing_quotes_created_by_fkey','pricing_rule_books_created_by_fkey',
    'property_amenities_listing_id_fkey','property_inquiries_assigned_agent_id_fkey',
    'property_listing_applications_listing_id_fkey','property_listing_media_listing_id_fkey',
    'property_listings_agent_id_fkey','property_managed_records_assigned_manager_id_fkey',
    'property_role_memberships_user_id_fkey','property_saved_listings_listing_id_fkey',
    'property_viewing_requests_assigned_agent_id_fkey',
    'property_viewing_requests_inquiry_id_fkey','referral_rewards_referral_id_fkey',
    'referral_rewards_user_id_fkey','referrals_program_id_fkey',
    'referrals_referee_id_fkey','referrals_referrer_id_fkey',
    'staff_assignments_order_id_fkey','staff_assignments_staff_id_fkey',
    'staff_expenses_created_by_fkey','staff_notification_states_notification_id_fkey',
    'staff_notifications_actor_user_id_fkey','studio_brief_files_brief_id_fkey',
    'studio_brief_files_lead_id_fkey','studio_briefs_lead_id_fkey',
    'studio_briefs_user_id_fkey','studio_custom_requests_brief_id_fkey',
    'studio_custom_requests_lead_id_fkey','studio_custom_requests_user_id_fkey',
    'studio_deliverables_approved_by_fkey','studio_deliverables_milestone_id_fkey',
    'studio_deliverables_project_id_fkey','studio_deliverables_uploaded_by_fkey',
    'studio_deliverables_user_id_fkey','studio_invoices_milestone_id_fkey',
    'studio_leads_matched_team_id_fkey','studio_leads_preferred_team_id_fkey',
    'studio_leads_requested_package_id_fkey','studio_packages_service_id_fkey',
    'studio_payments_milestone_id_fkey','studio_payments_user_id_fkey',
    'studio_payments_verified_by_fkey','studio_project_assignments_project_id_fkey',
    'studio_project_assignments_team_id_fkey','studio_project_assignments_user_id_fkey',
    'studio_project_files_brief_id_fkey','studio_project_files_lead_id_fkey',
    'studio_project_files_project_id_fkey','studio_project_milestones_project_id_fkey',
    'studio_project_updates_author_id_fkey','studio_project_updates_project_id_fkey',
    'studio_projects_lead_id_fkey','studio_projects_package_id_fkey',
    'studio_projects_proposal_id_fkey','studio_projects_service_id_fkey',
    'studio_projects_team_id_fkey','studio_projects_team_lead_id_fkey',
    'studio_projects_user_id_fkey','studio_proposal_milestones_proposal_id_fkey',
    'studio_proposals_brief_id_fkey','studio_proposals_lead_id_fkey',
    'studio_proposals_package_id_fkey','studio_proposals_service_id_fkey',
    'studio_proposals_team_id_fkey','studio_proposals_user_id_fkey',
    'studio_reviews_project_id_fkey','studio_reviews_user_id_fkey',
    'studio_revisions_deliverable_id_fkey','studio_revisions_project_id_fkey',
    'studio_revisions_requested_by_fkey','studio_typing_indicators_user_id_fkey',
    'support_messages_sender_id_fkey','trust_flags_user_id_fkey',
    'user_addresses_kyc_submission_fk','wallet_transactions_created_by_fkey',
    'wallet_transactions_order_id_fkey'
  ];
begin
  for r in
    select
      con.conrelid::regclass::text as table_qualified,
      con.conname as fk_name,
      array_to_string(
        (
          select array_agg(att.attname order by u.ord)
          from unnest(con.conkey) with ordinality u(attnum, ord)
          join pg_attribute att
            on att.attrelid = con.conrelid and att.attnum = u.attnum
        ),
        ', '
      ) as col_list
    from pg_constraint con
    where con.contype = 'f'
      and con.conname = any(fk_names)
  loop
    -- Index name: strip the `_fkey` suffix, append `_idx`. Postgres caps
    -- identifiers at 63 bytes, so we truncate if needed.
    idx_name := left(
      regexp_replace(r.fk_name, '_fkey$', '') || '_idx',
      63
    );
    execute format(
      'create index if not exists %I on %s (%s)',
      idx_name, r.table_qualified, r.col_list
    );
  end loop;
end $$;
