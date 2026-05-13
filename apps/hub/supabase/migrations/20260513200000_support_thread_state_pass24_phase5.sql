-- PASS 24 Phase 5 — support thread state columns.
--
-- Adds the columns that back the workspace-grade overflow menu actions
-- shipped in PASS 24 Phase 5 of the support chat upgrade:
--
--   * last_seen_by_staff_at  → studio mark-read durability (deferred
--                              from PASS 24 closure; engine already
--                              writes through gracefully when the
--                              column is missing).
--   * customer_muted_at      → customer-side mute: suppresses email/
--                              push notifications when set; not set
--                              when the customer un-mutes.
--   * staff_muted_at         → staff-side mute: same semantics from the
--                              staff dashboard perspective.
--
-- All columns are NULL-by-default + idempotently added so safe to
-- re-run on environments that already have them.
--
-- service_role + customer RLS posture is unchanged — existing policies
-- cover these timestamp columns since they're additive on an existing
-- row + already-permitted update set.

ALTER TABLE public.support_threads
  ADD COLUMN IF NOT EXISTS last_seen_by_staff_at TIMESTAMPTZ;

ALTER TABLE public.support_threads
  ADD COLUMN IF NOT EXISTS customer_muted_at TIMESTAMPTZ;

ALTER TABLE public.support_threads
  ADD COLUMN IF NOT EXISTS staff_muted_at TIMESTAMPTZ;

-- Indexes for the two surfaces that filter on these timestamps:
--   * studio staff inbox: "show me threads where last_seen_by_staff_at
--     < latest_message_at" — partial index on the timestamp column.
--   * notification fanout: "only send if customer_muted_at IS NULL" —
--     partial index speeds the OUTER JOIN against support_threads.

CREATE INDEX IF NOT EXISTS support_threads_last_seen_by_staff_at_idx
  ON public.support_threads (last_seen_by_staff_at)
  WHERE last_seen_by_staff_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS support_threads_customer_muted_at_idx
  ON public.support_threads (customer_muted_at)
  WHERE customer_muted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS support_threads_staff_muted_at_idx
  ON public.support_threads (staff_muted_at)
  WHERE staff_muted_at IS NOT NULL;

COMMENT ON COLUMN public.support_threads.last_seen_by_staff_at IS
  'Timestamp the most recent studio/care staff member opened or marked-read this thread. Used by staff inbox unread badges. Engine writes through /api/support/mark-read.';

COMMENT ON COLUMN public.support_threads.customer_muted_at IS
  'When the customer muted this thread''s notifications. NULL means notifications are active. PASS 24 phase 5.';

COMMENT ON COLUMN public.support_threads.staff_muted_at IS
  'When the studio/care staff muted this thread''s notifications. NULL means notifications are active. PASS 24 phase 5.';
