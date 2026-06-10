-- V3-37 — widen customer_notifications_category_check for the new recovery
-- reminder event type.
--
-- LOCK-STEP RULE (see 20260606120500_..._category_constraint_reconcile.sql):
--   packages/notifications/publish.ts writes `category = eventType`, and the
--   publisher validates eventType against packages/notifications/event-types.ts.
--   Adding `account.recovery.reminder` to that registry REQUIRES adding it to
--   this constraint, or every recovery-reminder INSERT is rejected (the exact
--   drift class that took down /api/notifications/recent on 2026-06-06).
--
-- This re-states the FULL allowed set (9 legacy coarse values + the now-16
-- registered EVENT_TYPE ids) — idempotent drop-if-exists + add, no wildcard.

set check_function_bodies = off;

alter table public.customer_notifications
  drop constraint if exists customer_notifications_category_check;

alter table public.customer_notifications
  add constraint customer_notifications_category_check
  check (category = any (array[
    -- Legacy coarse vocabulary (pre-V2-NOT-01): existing rows + handle_new_customer
    -- trigger ('account') + care sync-refresh UPDATE ('general').
    'general','care','marketplace','studio','wallet','security','support','account','promotion',
    -- Registered EVENT_TYPE ids — packages/notifications/event-types.ts.
    'auth.signup.welcome','auth.password.changed','auth.security.new_device','system.welcome',
    'logistics.shipment.update','marketplace.order.update','property.viewing.update',
    'learn.enrollment.update','studio.project.update','care.booking.update',
    'support.reply.received','support.thread.created','wallet.transaction.update',
    'kyc.review.update','system.notification.relay',
    -- V3-37 abandoned-journey recovery reminder.
    'account.recovery.reminder'
  ]::text[]));

comment on constraint customer_notifications_category_check on public.customer_notifications is
  'Allowed category vocabulary = 9 legacy coarse values UNION the 16 registered '
  'EVENT_TYPE ids from packages/notifications/event-types.ts. Keep in lock-step '
  'with event-types.ts. Widened 2026-06-10 for account.recovery.reminder (V3-37).';
