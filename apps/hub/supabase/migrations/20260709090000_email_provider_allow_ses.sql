------------------------------------------------------------------------
-- EMAIL-SES-ONLY (2026-07-09): Amazon SES is the only outbound email rail.
--
-- The notification email-fallback worker now records email_provider = 'ses'.
-- Without this, the CHECK added by 20260501120000 (resend/brevo only) rejects
-- the post-send UPDATE, email_dispatched_at never sets, and every delivered
-- row re-queues until RETRY_CAP — duplicate emails to real users.
--
-- 'resend' and 'brevo' stay allowed so historical rows remain valid; no new
-- row can carry them because the retired providers no longer exist in code.
------------------------------------------------------------------------

alter table public.customer_notifications
  drop constraint if exists customer_notifications_email_provider_known;

alter table public.customer_notifications
  add constraint customer_notifications_email_provider_known
  check (email_provider is null or email_provider in ('resend', 'brevo', 'ses'));
