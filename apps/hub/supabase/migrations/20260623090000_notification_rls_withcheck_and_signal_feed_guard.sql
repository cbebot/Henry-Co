-- =====================================================================
-- V3-NOTIF-RLS-01 — close the notification write-IDOR (WITH CHECK),
-- seal the inbox to service-role writes, and re-assert the
-- get_signal_feed read guard.
-- =====================================================================
--
-- ROOT CAUSE (verified against the captured prod schema
-- supabase/prod-actual/schema.sql; prod project rzkbgwuznmdxnnhmjazy):
--
--   public.customer_notifications and public.customer_preferences each
--   carry an UPDATE policy with a USING clause but NO WITH CHECK:
--       "Users can update own notifications"  (schema.sql:7841)
--       "Users can update own preferences"    (schema.sql:7847)
--   Postgres applies USING only to the OLD (pre-update) row; with no
--   WITH CHECK the NEW (post-update) row is unconstrained. Because the
--   `authenticated` role holds a table-wide UPDATE grant (schema.sql
--   :8490 / :8498), `user_id` is a plain updatable column, and there is
--   no BEFORE UPDATE trigger guarding it, an authenticated end user can:
--       PATCH /customer_notifications?id=eq.<a-notification-they-own>
--       { "user_id": "<victim>", "title": "...", "body": "...",
--         "action_url": "..." }
--   The row passes USING (auth.uid() = OLD.user_id) and, with no WITH
--   CHECK, is re-homed to the victim with attacker-authored content.
--   customer_notifications is in the supabase_realtime publication
--   (schema.sql:9677), so the retargeted UPDATE matches the victim's
--   per-user channel filter (user_id=eq.<victim>) and live-pushes a
--   FORGED notification straight into the victim's bell. This is the
--   reported "dashboard notifications shown to / sent to users who do
--   not own them" + "it can bridge security" defect.
--
--   The correct pattern already exists on staff_notification_states,
--   whose INSERT and UPDATE policies BOTH carry
--   WITH CHECK (recipient_user_id = auth.uid()) — the two customer
--   policies are simply missing it.
--
-- FIX (three layers, all idempotent):
--   1. Recreate both UPDATE policies WITH CHECK ((select auth.uid()) =
--      user_id) so a row can never be updated to belong to another user
--      (and the actor can never re-home their own row).
--   2. Defense-in-depth on the inbox: REVOKE insert/update/delete/
--      truncate on customer_notifications from anon + authenticated.
--      The inbox is authored ONLY by the service role — every write
--      path in the monorepo uses createAdminSupabase()/admin() (the
--      @henryco/notifications publish shim, every per-division bridge,
--      the support_staff_reply + handle_new_customer DB triggers, the
--      care sync-refresh, the jobs seed). Browser/authenticated clients
--      only SELECT (bell read) and receive realtime change events
--      (which require SELECT, never write grants). SELECT is preserved,
--      so the realtime subscription and bell read keep working. This
--      makes a client-side forge impossible even if a future migration
--      regresses the WITH CHECK. service_role keeps its grant (:8491)
--      and authors as before.
--      customer_preferences KEEPS its grants (a legacy client preference
--      path may write it) and is protected by the WITH CHECK in step 1.
--   3. Re-assert the get_signal_feed auth.uid() IDOR guard (identical to
--      SEC-HARDEN-06 / #323 TIER 0). The captured prod schema still
--      shows the pre-guard `language sql` body with no auth.uid() check
--      while EXECUTE is granted to `authenticated`, i.e. any logged-in
--      user could read another user's notification + activity feed by
--      passing the victim's uuid to the RPC. If #323 already landed on
--      prod this CREATE OR REPLACE is a byte-faithful no-op; if it did
--      not, this closes the read-IDOR. (This migration does NOT pull in
--      the rest of #323 — get_default_user_address, support_* guards,
--      the grant-posture sweep — those remain owned by #323; confirm it
--      is applied on prod.)
--
-- SAFETY / idempotent: DROP POLICY IF EXISTS + CREATE POLICY; declarative
--   REVOKE; CREATE OR REPLACE FUNCTION. Re-running yields the same end
--   state. No table is created, no money/payments object is touched, no
--   read path changes for a legitimate owner.
--
-- COMMITTED, NOT APPLIED. Apply after a rehearsal on prod
--   rzkbgwuznmdxnnhmjazy (the architect cannot reach that project from
--   the current MCP connection). Recommended verification after apply:
--     * a second authenticated user's PATCH that sets user_id=<victim>
--       on an owned notification is rejected (RLS) AND, independently,
--       blocked by the missing grant;
--     * get_signal_feed(<other-uuid>) raises 42501 for an authenticated
--       caller but still returns rows for the service role;
--     * the bell still hydrates and receives realtime events.
-- =====================================================================

set check_function_bodies = off;

-- ---------------------------------------------------------------------
-- 1a. customer_notifications: the post-update row must stay owned by
--     the acting user. Closes the forge-into-another-user's-bell hole.
-- ---------------------------------------------------------------------
drop policy if exists "Users can update own notifications" on public.customer_notifications;
create policy "Users can update own notifications"
  on public.customer_notifications
  as permissive
  for update
  to public
  using ((( select auth.uid() ) = user_id))
  with check ((( select auth.uid() ) = user_id));

-- ---------------------------------------------------------------------
-- 1b. customer_preferences: same WITH CHECK closure (its INSERT policy
--     already has WITH CHECK — only UPDATE was missing it).
-- ---------------------------------------------------------------------
drop policy if exists "Users can update own preferences" on public.customer_preferences;
create policy "Users can update own preferences"
  on public.customer_preferences
  as permissive
  for update
  to public
  using ((( select auth.uid() ) = user_id))
  with check ((( select auth.uid() ) = user_id));

-- ---------------------------------------------------------------------
-- 2. Seal the inbox: clients read + subscribe, the service role writes.
--    SELECT is intentionally retained (bell read + realtime delivery).
-- ---------------------------------------------------------------------
revoke insert, update, delete, truncate
  on table public.customer_notifications
  from anon, authenticated;

-- ---------------------------------------------------------------------
-- 3. get_signal_feed read-IDOR guard (SEC-HARDEN-06 TIER 0, re-asserted
--    verbatim so the hole is closed regardless of #323's apply state).
-- ---------------------------------------------------------------------
create or replace function public.get_signal_feed(
  viewer_id uuid,
  limit_count int default 50,
  after_score numeric default null,
  after_created_at timestamptz default null
)
returns table (
  id uuid,
  kind text,
  source text,
  division text,
  priority text,
  title text,
  body text,
  action_url text,
  created_at timestamptz,
  score numeric
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  -- IDOR guard. auth.uid() is null only for the trusted service-role
  -- backend (and DB superusers); any real end-user JWT sets it.
  if auth.uid() is not null and auth.uid() is distinct from viewer_id then
    raise exception 'get_signal_feed: forbidden - cannot read another user''s feed'
      using errcode = '42501';
  end if;

  return query
  with viewer as (
    select viewer_id as vid
  ),
  priority_weights(priority, weight) as (
    values
      ('security'::text, 1.5::numeric),
      ('urgent', 1.3),
      ('warning', 1.1),
      ('info', 1.0),
      ('success', 1.0)
  ),
  cust_notif as (
    select
      cn.id,
      'notification'::text as kind,
      'customer'::text as source,
      coalesce(cn.division, 'account')::text as division,
      cn.priority,
      cn.title,
      cn.body,
      cn.action_url,
      cn.created_at
    from public.customer_notifications cn
    where cn.user_id = (select vid from viewer)
      and cn.deleted_at is null
  ),
  cust_activity as (
    select
      ca.id,
      'activity'::text as kind,
      'customer'::text as source,
      ca.division,
      coalesce(nullif(ca.status, ''), 'info')::text as priority,
      ca.title,
      ca.description as body,
      ca.action_url,
      ca.created_at
    from public.customer_activity ca
    where ca.user_id = (select vid from viewer)
      and ca.created_at >= now() - interval '30 days'
      and ca.archived_at is null
  ),
  unioned as (
    select * from cust_notif
    union all
    select * from cust_activity
  ),
  scored as (
    select
      u.id,
      u.kind,
      u.source,
      u.division,
      u.priority,
      u.title,
      u.body,
      u.action_url,
      u.created_at,
      coalesce(pw.weight, 1.0)
        * exp(- extract(epoch from now() - u.created_at) / 86400.0)
        as score
    from unioned u
    left join priority_weights pw on pw.priority = u.priority
  )
  select
    s.id,
    s.kind,
    s.source,
    s.division,
    s.priority,
    s.title,
    s.body,
    s.action_url,
    s.created_at,
    s.score
  from scored s
  where (after_score is null or s.score < after_score)
     or (
       after_score is not null
       and s.score = after_score
       and s.created_at < after_created_at
     )
  order by s.score desc, s.created_at desc
  limit greatest(coalesce(limit_count, 50), 1);
end;
$$;

revoke all on function public.get_signal_feed(uuid, int, numeric, timestamptz) from public;
grant execute on function public.get_signal_feed(uuid, int, numeric, timestamptz) to authenticated, service_role;

comment on function public.get_signal_feed(uuid, int, numeric, timestamptz) is
  'Unified ranked signal feed for the dashboard shell. SEC-HARDEN-06 / '
  'V3-NOTIF-RLS-01: guarded so a non-service (authenticated) caller can '
  'only read its own feed (auth.uid() must match viewer_id); the service '
  'role (auth.uid() null) may pass viewer_id through. Joins '
  'customer_notifications + customer_activity, ranks by priority * '
  'recency, cursor-paginated via (after_score, after_created_at).';
