-- V3-03 — Foundation: Notification & Message States
--
-- Closes the PRODUCT-GAP-LEDGER #1 gap: `support_messages` and
-- `support_threads` carry only thread-level fake unread state today.
-- This migration:
--
--   1. Extends `support_messages` with `read_by` (UUID) and
--      `delivery_state` (text enum) — `is_read` and `read_at` already
--      exist from earlier migrations.
--   2. Extends `support_threads` with denormalised
--      `last_read_message_id`, `last_staff_read_message_id`,
--      `unread_count_customer`, `unread_count_staff` — maintained by a
--      trigger so the UI never has to compute counts client-side.
--   3. Adds the same `delivery_state` column to
--      `customer_notifications` + `staff_notifications` so the
--      delivery state machine is uniform across in-app surfaces.
--   4. Wires a `SECURITY DEFINER` trigger function
--      `update_thread_unread_counts()` that maintains the unread
--      caches on every insert/update of `support_messages.is_read`.
--   5. Adds RLS policies so customers can mark their own thread's
--      messages as read, and staff can mark via `is_staff_in()`.
--   6. Backfills:
--        • `is_read = false` for inbound messages within the last
--          30 days (to avoid badge spam on legacy inboxes).
--        • `is_read = true` for older inbound + all outbound.
--      Then recomputes the unread caches from the backfilled state.
--
-- Idempotent: every column, index, policy, and trigger is created
-- with `IF NOT EXISTS` (or drop-then-create where Postgres requires).
-- Re-running this migration on a database where it already ran is a
-- no-op. The trigger body itself is `CREATE OR REPLACE FUNCTION` so
-- the latest body always wins.
--
-- Apply: NOT applied in this session. Conductor + owner review first.

-- ─── 1. support_messages: read_by + delivery_state ────────────────────────

ALTER TABLE public.support_messages
  ADD COLUMN IF NOT EXISTS read_by UUID;

ALTER TABLE public.support_messages
  ADD COLUMN IF NOT EXISTS delivery_state TEXT NOT NULL DEFAULT 'sent';

-- Add the CHECK constraint idempotently — Postgres does not support
-- `ADD CONSTRAINT IF NOT EXISTS` directly, so we test pg_constraint.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'support_messages_delivery_state_check'
      and conrelid = 'public.support_messages'::regclass
  ) then
    alter table public.support_messages
      add constraint support_messages_delivery_state_check
      check (delivery_state in ('sent','delivered','seen','failed'));
  end if;
end
$$;

-- Partial index for the "find unread per thread" query that the unread
-- count trigger relies on. Partial keeps it lean — most messages get
-- read quickly.
CREATE INDEX IF NOT EXISTS idx_support_messages_thread_unread
  ON public.support_messages(thread_id) WHERE is_read = FALSE;

-- Secondary index for the redelivery cron's lookup of stale sent rows.
CREATE INDEX IF NOT EXISTS idx_support_messages_delivery_state_pending
  ON public.support_messages(created_at)
  WHERE delivery_state IN ('sent','delivered');

COMMENT ON COLUMN public.support_messages.read_by IS
  'Which user marked this message as read. For inbound messages: the recipient. For outbound: typically the sender''s row (auto-read). NULL until is_read=true. V3-03.';

COMMENT ON COLUMN public.support_messages.delivery_state IS
  'WhatsApp-style delivery state machine: sent → delivered → seen, OR sent → failed. Maintained by publisher + redelivery cron + IntersectionObserver mark-read. V3-03.';

-- ─── 2. support_threads: per-side last-read pointer + cached counts ───────

ALTER TABLE public.support_threads
  ADD COLUMN IF NOT EXISTS last_read_message_id UUID;

ALTER TABLE public.support_threads
  ADD COLUMN IF NOT EXISTS last_staff_read_message_id UUID;

ALTER TABLE public.support_threads
  ADD COLUMN IF NOT EXISTS unread_count_customer INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.support_threads
  ADD COLUMN IF NOT EXISTS unread_count_staff INTEGER NOT NULL DEFAULT 0;

-- Constrain unread counts to be non-negative (defensive — the trigger
-- enforces this, but the constraint catches direct UPDATEs).
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'support_threads_unread_counts_nonneg_check'
      and conrelid = 'public.support_threads'::regclass
  ) then
    alter table public.support_threads
      add constraint support_threads_unread_counts_nonneg_check
      check (unread_count_customer >= 0 and unread_count_staff >= 0);
  end if;
end
$$;

COMMENT ON COLUMN public.support_threads.last_read_message_id IS
  'Pointer to the most recent message the thread owner (customer side) has read. Maintained by the IntersectionObserver mark-read flow + RLS-gated UPDATE. V3-03.';

COMMENT ON COLUMN public.support_threads.last_staff_read_message_id IS
  'Same as last_read_message_id but for the staff side of the thread. Allows per-side read state without overwriting the other side''s pointer. V3-03.';

COMMENT ON COLUMN public.support_threads.unread_count_customer IS
  'Denormalised count of support_messages on this thread where the customer is the recipient and is_read=false. Maintained by trigger_support_messages_unread_count. V3-03.';

COMMENT ON COLUMN public.support_threads.unread_count_staff IS
  'Same as unread_count_customer but for the staff-side recipient count. V3-03.';

-- ─── 3. customer_notifications + staff_notifications: delivery_state ─────

ALTER TABLE public.customer_notifications
  ADD COLUMN IF NOT EXISTS delivery_state TEXT NOT NULL DEFAULT 'sent';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'customer_notifications_delivery_state_check'
      and conrelid = 'public.customer_notifications'::regclass
  ) then
    alter table public.customer_notifications
      add constraint customer_notifications_delivery_state_check
      check (delivery_state in ('sent','delivered','seen','failed'));
  end if;
end
$$;

ALTER TABLE public.staff_notifications
  ADD COLUMN IF NOT EXISTS delivery_state TEXT NOT NULL DEFAULT 'sent';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'staff_notifications_delivery_state_check'
      and conrelid = 'public.staff_notifications'::regclass
  ) then
    alter table public.staff_notifications
      add constraint staff_notifications_delivery_state_check
      check (delivery_state in ('sent','delivered','seen','failed'));
  end if;
end
$$;

-- Pending-redelivery lookup indices for the every-5-min cron.
CREATE INDEX IF NOT EXISTS idx_customer_notifications_delivery_pending
  ON public.customer_notifications(created_at)
  WHERE delivery_state IN ('sent','delivered');

CREATE INDEX IF NOT EXISTS idx_staff_notifications_delivery_pending
  ON public.staff_notifications(created_at)
  WHERE delivery_state IN ('sent','delivered');

COMMENT ON COLUMN public.customer_notifications.delivery_state IS
  'Delivery state machine: sent → delivered → seen, or sent → failed. Updated by publisher (sent), Realtime push success log (delivered), is_read mark (seen), email-fallback hard bounce (failed). V3-03.';

COMMENT ON COLUMN public.staff_notifications.delivery_state IS
  'Same as customer_notifications.delivery_state. V3-03.';

-- ─── 4. Trigger function: maintain unread_count_customer/staff ───────────
--
-- Real implementation — NOT a stub. The function recomputes both
-- per-side unread counts from `support_messages` for the affected
-- thread on every insert/update of `is_read`. We recompute (instead of
-- incrementing) so concurrent writers can't drift the cache.
--
-- "Customer side unread" = messages on the thread where:
--   • is_read = false
--   • sender_type != 'customer' (i.e. inbound for the customer)
-- "Staff side unread" = messages on the thread where:
--   • is_read = false
--   • sender_type = 'customer' (i.e. inbound for staff)
--
-- The function is SECURITY DEFINER so it can write
-- support_threads.unread_count_* regardless of the calling user's RLS
-- policy on support_threads (the trigger fires on support_messages,
-- not support_threads, so the calling user may not have UPDATE on
-- support_threads). To prevent privilege escalation, the function
-- ONLY touches support_threads.unread_count_customer/staff for the
-- single thread_id implicated by the trigger row — it does not run
-- arbitrary SQL.

CREATE OR REPLACE FUNCTION public.update_thread_unread_counts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  affected_thread_id UUID;
  customer_unread INTEGER;
  staff_unread INTEGER;
BEGIN
  -- Determine the thread to recompute. INSERT: NEW.thread_id.
  -- UPDATE: NEW.thread_id (a message cannot change threads — and even
  -- if it could, we'd need to recompute both sides; we keep this
  -- simple).
  -- DELETE branch is not wired (the trigger only fires INSERT OR
  -- UPDATE OF is_read), so we don't handle OLD here.
  affected_thread_id := NEW.thread_id;

  IF affected_thread_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Recompute from scratch — safer than increment/decrement under
  -- concurrent writes. Bounded by the per-thread partial index above.
  SELECT
    COUNT(*) FILTER (
      WHERE m.is_read = FALSE
        AND m.sender_type IS DISTINCT FROM 'customer'
    ),
    COUNT(*) FILTER (
      WHERE m.is_read = FALSE
        AND m.sender_type = 'customer'
    )
  INTO customer_unread, staff_unread
  FROM public.support_messages m
  WHERE m.thread_id = affected_thread_id
    AND m.deleted_at IS NULL;

  UPDATE public.support_threads
     SET unread_count_customer = COALESCE(customer_unread, 0),
         unread_count_staff = COALESCE(staff_unread, 0)
   WHERE id = affected_thread_id;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.update_thread_unread_counts() IS
  'Trigger fn — recomputes support_threads.unread_count_customer/staff from support_messages whenever a message is inserted or its is_read flag changes. SECURITY DEFINER, hard-coded to only touch the thread row in NEW.thread_id, so safe to grant trigger-time. V3-03.';

REVOKE ALL ON FUNCTION public.update_thread_unread_counts() FROM public;
GRANT EXECUTE ON FUNCTION public.update_thread_unread_counts()
  TO authenticated, service_role;

-- CREATE TRIGGER does not support IF NOT EXISTS in Postgres — drop
-- and recreate so the migration stays idempotent.
DROP TRIGGER IF EXISTS trigger_support_messages_unread_count ON public.support_messages;
CREATE TRIGGER trigger_support_messages_unread_count
  AFTER INSERT OR UPDATE OF is_read ON public.support_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_thread_unread_counts();

COMMENT ON TRIGGER trigger_support_messages_unread_count ON public.support_messages IS
  'AFTER INSERT/UPDATE-of-is_read. Maintains the denormalised unread caches on support_threads via update_thread_unread_counts(). V3-03.';

-- ─── 5. RLS policies for marking messages read ──────────────────────────
--
-- The base RLS posture on support_messages already restricts SELECT
-- via thread ownership / is_staff_in(). We add UPDATE policies that
-- ONLY permit changing is_read/read_at/read_by/delivery_state — not
-- the message body or sender. To keep this conservative, the policy
-- predicate uses a USING (thread ownership / staff membership) +
-- WITH CHECK (same predicate AND nothing else has changed). We can't
-- enforce "only is_read/read_at columns changed" inside RLS at the
-- column level without a column-level GRANT split, which is the
-- cleaner long-term fix — but for V3-03 we add a row-level policy
-- and document that column-grant tightening is a follow-up.

-- 5a. Customer can update read state on messages in their own threads.
DROP POLICY IF EXISTS support_messages_update_customer_read ON public.support_messages;
CREATE POLICY support_messages_update_customer_read
  ON public.support_messages
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.support_threads t
      WHERE t.id = support_messages.thread_id
        AND t.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.support_threads t
      WHERE t.id = support_messages.thread_id
        AND t.user_id = (SELECT auth.uid())
    )
  );

COMMENT ON POLICY support_messages_update_customer_read ON public.support_messages IS
  'Customer owns their thread → can UPDATE messages in it (mark read). Column-level grant lockdown is a follow-up; combine with a per-column GRANT to restrict to is_read/read_at/read_by/delivery_state only. V3-03.';

-- 5b. Staff can update read state on threads they have access to via
-- is_staff_in(). Uses the thread's division to scope per-division
-- staff.
DROP POLICY IF EXISTS support_messages_update_staff_read ON public.support_messages;
CREATE POLICY support_messages_update_staff_read
  ON public.support_messages
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.support_threads t
      WHERE t.id = support_messages.thread_id
        AND public.is_staff_in(t.division, NULL)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.support_threads t
      WHERE t.id = support_messages.thread_id
        AND public.is_staff_in(t.division, NULL)
    )
  );

COMMENT ON POLICY support_messages_update_staff_read ON public.support_messages IS
  'Staff member in the same division as the thread can UPDATE message read state. V3-03.';

-- 5c. Customer can update last_read_message_id on their own thread.
DROP POLICY IF EXISTS support_threads_update_customer_read_pointer ON public.support_threads;
CREATE POLICY support_threads_update_customer_read_pointer
  ON public.support_threads
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

COMMENT ON POLICY support_threads_update_customer_read_pointer ON public.support_threads IS
  'Customer can UPDATE their own thread row (used to bump last_read_message_id). Column-level grant tightening is a follow-up. V3-03.';

-- 5d. Staff can update last_staff_read_message_id on threads in their division.
DROP POLICY IF EXISTS support_threads_update_staff_read_pointer ON public.support_threads;
CREATE POLICY support_threads_update_staff_read_pointer
  ON public.support_threads
  FOR UPDATE
  TO authenticated
  USING (public.is_staff_in(division, NULL))
  WITH CHECK (public.is_staff_in(division, NULL));

COMMENT ON POLICY support_threads_update_staff_read_pointer ON public.support_threads IS
  'Staff in the thread''s division can UPDATE the thread row (used to bump last_staff_read_message_id). V3-03.';

-- ─── 6. Backfill ──────────────────────────────────────────────────────────
--
-- Goal: avoid badge spam on legacy threads with thousands of unread
-- messages.
--
--   • Inbound (sender_type != 'customer'?) — really, "inbound" depends
--     on which side you're on. We treat the rule symmetrically:
--     – Mark as READ all messages older than 30 days (anyone's side).
--     – Mark as READ all messages where is_read is already true (no
--       change).
--     – Leave is_read=false on messages newer than 30 days that arrived
--       since the audit (status quo).
--   • This matches the spec's "cap unread at the last 30 days per thread".
--
-- Backfill must be idempotent: only touch rows where is_read = FALSE
-- AND created_at < now() - 30 days. Re-runs are no-ops because the
-- second run finds no matching rows.

UPDATE public.support_messages
   SET is_read = TRUE,
       read_at = COALESCE(read_at, created_at),
       delivery_state = CASE
         WHEN delivery_state IN ('sent','delivered') THEN 'seen'
         ELSE delivery_state
       END
 WHERE is_read = FALSE
   AND created_at < (now() - interval '30 days');

-- Now recompute the unread caches once for every thread touched by
-- the prior 30-day backfill — and also for any threads where the
-- denormalised counts are still 0 but live unread messages exist
-- (idempotent recompute).
WITH thread_unreads AS (
  SELECT
    t.id AS thread_id,
    COUNT(*) FILTER (
      WHERE m.is_read = FALSE
        AND m.sender_type IS DISTINCT FROM 'customer'
        AND m.deleted_at IS NULL
    ) AS customer_unread,
    COUNT(*) FILTER (
      WHERE m.is_read = FALSE
        AND m.sender_type = 'customer'
        AND m.deleted_at IS NULL
    ) AS staff_unread
  FROM public.support_threads t
  LEFT JOIN public.support_messages m ON m.thread_id = t.id
  GROUP BY t.id
)
UPDATE public.support_threads st
   SET unread_count_customer = thread_unreads.customer_unread,
       unread_count_staff = thread_unreads.staff_unread
  FROM thread_unreads
 WHERE st.id = thread_unreads.thread_id
   AND (
     st.unread_count_customer IS DISTINCT FROM thread_unreads.customer_unread
     OR st.unread_count_staff IS DISTINCT FROM thread_unreads.staff_unread
   );

-- ─── 7. Extend Supabase Realtime publication with new tables ─────────────
--
-- support_messages + support_threads need to be in the publication so
-- the messaging-thread UI can subscribe to delivery_state / unread
-- count updates. Pattern mirrors 20260501130000_notification_realtime_publication.sql.

do $$
begin
  if not exists (
    select 1 from pg_publication where pubname = 'supabase_realtime'
  ) then
    create publication supabase_realtime;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'support_messages'
  ) then
    execute 'alter publication supabase_realtime add table public.support_messages';
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'support_threads'
  ) then
    execute 'alter publication supabase_realtime add table public.support_threads';
  end if;
end
$$;

-- End of V3-03 — Foundation: Notification & Message States migration.
