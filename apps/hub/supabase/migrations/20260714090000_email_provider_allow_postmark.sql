------------------------------------------------------------------------
-- EMAIL-POSTMARK (2026-07-14): Postmark is the only outbound email rail.
--
-- The notification email-fallback worker and the account webhook now record
-- email_provider = 'postmark'. Without this, the CHECK added by
-- 20260709090000 (resend/brevo/ses only) rejects the post-send UPDATE,
-- email_dispatched_at never sets, and every delivered row re-queues until
-- RETRY_CAP — duplicate emails to real users.
--
-- 'resend', 'brevo' and 'ses' stay allowed so historical rows written under
-- the retired rails remain valid; no new row can carry them because those
-- providers no longer exist in code.
------------------------------------------------------------------------

alter table public.customer_notifications
  drop constraint if exists customer_notifications_email_provider_known;

alter table public.customer_notifications
  add constraint customer_notifications_email_provider_known
  check (
    email_provider is null
    or email_provider in ('resend', 'brevo', 'ses', 'postmark')
  );
