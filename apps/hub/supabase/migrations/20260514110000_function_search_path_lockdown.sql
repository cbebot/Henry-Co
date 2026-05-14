-- Lock down `search_path` on 46 public functions flagged by the Supabase
-- advisor (`function_search_path_mutable`).
--
-- A function with a role-mutable `search_path` can be tricked into resolving
-- to a shadow object if a caller injects a malicious schema earlier in
-- their session search_path. Pinning `search_path = public, pg_catalog`
-- eliminates that vector for every flagged function.
--
-- Remediation reference:
-- https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable
--
-- The DO block resolves each function's signature at apply time via
-- pg_proc + pg_get_function_identity_arguments, so it works correctly
-- across overloads and stays idempotent (only acts on functions whose
-- proconfig does NOT already pin search_path).

do $$
declare
  r record;
  target_names text[] := array[
    'care_append_expense_ledger',
    'care_append_payment_ledger',
    'care_order_item_set_line_total',
    'care_queue_picked_up_payment_email',
    'care_recalc_booking_totals_from_order_items',
    'care_recalc_booking_totals_from_payments',
    'care_recalculate_booking_totals',
    'care_set_payment_request_no',
    'cart_recovery_state_touch',
    'current_role',
    'customer_lifecycle_snapshots_set_updated_at',
    'data_governance_set_updated_at',
    'handle_updated_at',
    'hq_ic_storage_thread_id_from_path',
    'i18n_translation_cache_touch_updated_at',
    'is_owner',
    'is_property_staff',
    'learn_auth_email',
    'learn_is_staff',
    'learn_matches_identity',
    'learn_set_updated_at',
    'make_care_tracking_code',
    'marketplace_set_updated_at',
    'marketplace_tier_listing_cap',
    'newsletter_set_updated_at',
    'normalize_phone',
    'saved_items_touch_updated_at',
    'set_row_updated_at',
    'set_status_updated_at',
    'set_updated_at',
    'studio_auth_email',
    'studio_guard_client_deliverable_approval',
    'studio_is_staff',
    'studio_prune_stale_typing',
    'studio_seed_welcome_message',
    'studio_set_updated_at',
    'support_add_internal_note',
    'support_assign_thread',
    'support_log_event',
    'support_staff_reply',
    'support_update_thread_status',
    'touch_marketplace_tier_changed_at',
    'update_updated_at',
    'user_addresses_set_updated_at',
    'wallet_apply_tx',
    'workspace_set_updated_at'
  ];
begin
  for r in
    select
      n.nspname as schema_name,
      p.proname as func_name,
      pg_get_function_identity_arguments(p.oid) as func_args
    from pg_proc p
    join pg_namespace n on p.pronamespace = n.oid
    where n.nspname = 'public'
      and p.proname = any(target_names)
      and (
        p.proconfig is null
        or not exists (
          select 1 from unnest(p.proconfig) cfg
          where cfg like 'search_path=%'
        )
      )
  loop
    execute format(
      'alter function %I.%I(%s) set search_path = public, pg_catalog',
      r.schema_name, r.func_name, r.func_args
    );
  end loop;
end $$;
