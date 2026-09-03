-- ─────────────────────────────────────────────────────────────────────────────
-- V3 notifications/email reliability fix — restore the customer notification +
-- email pipeline (applied to production 2026-06-05).
--
-- ROOT CAUSE: `customer_notifications` was missing the `metadata` jsonb column
-- that the shared notification publish shim (packages/notifications/publish.ts)
-- and the account email-fallback cron both write and read. Its sibling table
-- `staff_notifications` already has this column; `customer_notifications` was
-- never migrated to add it. Every customer-notification INSERT therefore failed
-- with PostgREST `PGRST204` ("Could not find the 'metadata' column ... in the
-- schema cache"), so no in-app notifications were created, the email-fallback
-- cron had zero candidates, and the endless publish retries by the
-- studio/care/property/account bridges saturated the per-minute/hour rate
-- limiter. Net effect: notification/automation emails stopped (last successful
-- send 2026-05-02).
--
-- FIX: add the missing column, mirroring `staff_notifications.metadata` exactly
-- (jsonb NOT NULL DEFAULT '{}'). Additive and non-breaking — a constant default
-- is a metadata-only DDL change on PG17 (no table rewrite), safe on a live
-- table. Idempotent (IF NOT EXISTS) so it is safe to re-run / reconcile with the
-- already-applied production change.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.customer_notifications
  add column if not exists metadata jsonb not null default '{}'::jsonb;

comment on column public.customer_notifications.metadata is
  'Operational/delivery metadata bag (suppress_toast/suppress_sound mute flags from the publish shim; email_outcome/digest markers from the email-fallback cron). Mirrors staff_notifications.metadata. Distinct from detail_payload (user-facing notification payload).';

-- Make the new column immediately visible to PostgREST (clears the PGRST204).
notify pgrst, 'reload schema';
