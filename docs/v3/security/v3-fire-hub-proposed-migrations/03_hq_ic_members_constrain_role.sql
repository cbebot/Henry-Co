-- V3-FIRE-HUB · HELD MIGRATION 03 (HUB-3)
-- Finding: hq_internal_comm_thread_members self-management policies do not constrain
--   the `role` column:
--     hq_ic_members_insert  WITH CHECK ((user_id = auth.uid()) AND hq_ic_can_read_thread(thread_id))
--     hq_ic_members_update  USING/CHECK  (user_id = auth.uid())
--   For an `all_owners` thread (readable by any active staff), a staffer can self-INSERT
--   a membership row with role='member' (or 'owner'), or self-promote an 'observer' to
--   'member' via UPDATE. hq_ic_can_write_thread() then returns true (role distinct from
--   'observer') -> the staffer gains WRITE into owner broadcast/announcement threads.
--   Confirmed from policy text; no write probe was run (READ-ONLY mandate).
--
-- SEVERITY: MEDIUM. Authenticated-staff only (not anon); no read-leak (all_owners
--   threads are already staff-readable by design). Integrity/impersonation within the
--   owner internal-comms spine.
--
-- ⚠ INTENT CHECK (architect): decide whether active staff are MEANT to reply in
--   all_owners threads. If yes, membership should be granted explicitly by a thread
--   owner / service-role, NOT by self-join. This migration takes the secure default:
--     (a) self-join is allowed only as a read-only 'observer' (cannot write), and
--     (b) self-update can never change `role`.
--   Writer membership is then conferred only via the service-role admin path.
--
-- POSTURE: READ-ONLY audit deliverable. DO NOT APPLY until architect re-verification.

-- (a) Self-join: pin role to read-only 'observer'.
drop policy if exists hq_ic_members_insert on public.hq_internal_comm_thread_members;
create policy hq_ic_members_insert
  on public.hq_internal_comm_thread_members
  for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and hq_ic_can_read_thread(thread_id)
    and role = 'observer'
  );

-- (b) Self-update: keep self-service (e.g. last-read/presence columns) but forbid
--     changing the privileged `role` column from the client.
revoke update (role) on public.hq_internal_comm_thread_members from authenticated;
