-- INCIDENT-NOTIFICATIONS-CATEGORY (2026-06-06): reconcile the customer_notifications
-- category CHECK constraint with the code's registered category vocabulary.
--
-- ROOT CAUSE — schema drift (same class as the email metadata-column outage):
--   public.customer_notifications was hand-created in production before the migration
--   history existed (see 20260501..._notification_signal_foundation_extensions.sql
--   header). Its category CHECK was authored with a COARSE, division-ish vocabulary:
--     'general','care','marketplace','studio','wallet','security','support',
--     'account','promotion'
--   The V2-NOT-01 publisher shim (packages/notifications) later switched the column's
--   vocabulary to FINE-GRAINED, registered EVENT_TYPE ids (division.entity.verb, e.g.
--   'care.booking.update'). The matching constraint-update migration was never written,
--   so EVERY shim publish has been rejected with
--     new row for relation "customer_notifications" violates check constraint
--     "customer_notifications_category_check"
--   flooding Postgres continuously and (via the failing insert path + DB pressure)
--   starving /api/notifications/recent, which the account shell loads on every route.
--
-- FIX (write side) — widen, do NOT loosen-to-silence, do NOT touch the writer:
--   The writer is integrity-correct: packages/notifications/validate.ts rejects any
--   eventType not in the registered EVENT_TYPES set, so only registered categories ever
--   reach this column. The constraint is the stale side. We widen it to EXACTLY the
--   union the code legitimately writes — no wildcard, no escape hatch:
--     * the 9 legacy coarse categories  — still written by the handle_new_customer
--       signup trigger ('account') and the care sync-refresh UPDATE paths ('general'),
--       and held by every existing row;
--     * the 15 registered EVENT_TYPE ids — packages/notifications/event-types.ts.
--   Keep this list in lock-step with event-types.ts: adding a new EVENT_TYPE there
--   REQUIRES a follow-up widen here.
--
-- SAFETY:
--   Forward-safe + idempotent (drop-if-exists + add, mirroring the established pattern
--   in 20260501..._notification_signal_foundation_extensions.sql). Pre-flight against
--   production confirmed 0 existing rows fall outside the new set, so ADD validates
--   cleanly. Touches ONLY customer_notifications_category_check — no other DDL.

set check_function_bodies = off;

alter table public.customer_notifications
  drop constraint if exists customer_notifications_category_check;

alter table public.customer_notifications
  add constraint customer_notifications_category_check
  check (category = any (array[
    -- Legacy coarse vocabulary (pre-V2-NOT-01). Preserved: existing rows + the
    -- handle_new_customer trigger ('account') + the care sync-refresh UPDATE ('general').
    'general','care','marketplace','studio','wallet','security','support','account','promotion',
    -- Registered EVENT_TYPE ids — packages/notifications/event-types.ts (only registered
    -- EVENT_TYPES are accepted; the publisher shim writes category = eventType).
    'auth.signup.welcome','auth.password.changed','auth.security.new_device','system.welcome',
    'logistics.shipment.update','marketplace.order.update','property.viewing.update',
    'learn.enrollment.update','studio.project.update','care.booking.update',
    'support.reply.received','support.thread.created','wallet.transaction.update',
    'kyc.review.update','system.notification.relay'
  ]::text[]));

comment on constraint customer_notifications_category_check on public.customer_notifications is
  'Allowed category vocabulary = 9 legacy coarse values (existing rows + handle_new_customer '
  'trigger + care sync UPDATE) UNION the 15 registered EVENT_TYPE ids from '
  'packages/notifications/event-types.ts. Keep in lock-step with event-types.ts. '
  'Reconciled 2026-06-06 after the category-check drift incident.';
