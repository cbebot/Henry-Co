-- PASS 24 Phase 5 — support thread mute state columns.
--
-- Adds the columns that back the workspace-grade overflow menu mute
-- actions shipped in PASS 24 Phase 5 of the support chat upgrade:
--
--   * customer_muted_at      → customer-side mute: suppresses email/
--                              push notifications when set; cleared
--                              when the customer un-mutes.
--   * staff_muted_at         → staff-side mute: same semantics from
--                              the staff dashboard perspective.
--
-- Note: `customer_last_read_at` and `staff_last_read_at` already exist
-- on `support_threads` from earlier migrations; the studio mark-read
-- route now writes to the canonical `staff_last_read_at` column.
--
-- Both new columns are NULL-by-default + idempotently added so safe
-- to re-run.

ALTER TABLE public.support_threads
  ADD COLUMN IF NOT EXISTS customer_muted_at TIMESTAMPTZ;

ALTER TABLE public.support_threads
  ADD COLUMN IF NOT EXISTS staff_muted_at TIMESTAMPTZ;

-- Partial indexes — the notification fanout filters on
-- `customer_muted_at IS NULL`; staff inbox unread surface filters on
-- `staff_muted_at IS NULL`. Partial keeps the index lean given most
-- threads aren't muted.

CREATE INDEX IF NOT EXISTS support_threads_customer_muted_at_idx
  ON public.support_threads (customer_muted_at)
  WHERE customer_muted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS support_threads_staff_muted_at_idx
  ON public.support_threads (staff_muted_at)
  WHERE staff_muted_at IS NOT NULL;

COMMENT ON COLUMN public.support_threads.customer_muted_at IS
  'When the customer muted this thread''s notifications. NULL means notifications are active. PASS 24 phase 5.';

COMMENT ON COLUMN public.support_threads.staff_muted_at IS
  'When the studio/care staff muted this thread''s notifications. NULL means notifications are active. PASS 24 phase 5.';
