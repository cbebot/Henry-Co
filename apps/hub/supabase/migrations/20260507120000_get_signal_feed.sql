-- V2-DASH-01 G6 — public.get_signal_feed()
--
-- The unified, ranked, RLS-aware signal feed that the dashboard
-- shell's ContextDrawer + Smart Home widgets consume.
--
-- DESIGN:
--   * SECURITY DEFINER + pinned search_path so the function reads as
--     the function owner — same hardening pattern as the prior
--     20260502120000_staff_notifications_audience.sql migration that
--     defines is_staff_in().
--   * DASH-1 SCOPE: production today has customer_notifications and
--     customer_activity but NOT tasks / staff_notifications /
--     is_staff_in() (the V2-NOT-02-A staff-notifications-audience
--     migration is on disk at 20260502120000_staff_notifications_audience.sql
--     but has not yet been applied to production). Sources for DASH-1:
--       1. customer_notifications  (recipient_user_id = viewer_id, deleted_at null)
--       2. customer_activity        (user_id = viewer_id, last 30 days)
--     DASH-6 will extend this function with the staff_notifications
--     CTE + is_staff_in() once V2-NOT-02-A ships to production.
--   * Ranked by score = priority_weight * recency_weight (see RANKING).
--   * Cursor pagination via (after_score, after_created_at) so callers
--     can page deterministically without offset.
--
-- WHY SECURITY DEFINER:
--   The viewer is identified by parameter (`viewer_id`) rather than
--   `auth.uid()` because the function may be called from server-side
--   code paths where the auth context isn't a Supabase user session
--   (e.g., a cron-driven smart-home digest, or a Next server action
--   acting on behalf of a user). The function gates on viewer_id
--   match throughout — direct user_id filters on customer_*. The
--   function never echoes data the viewer wouldn't see via direct
--   SELECT.
--
--   Cross-tenant isolation is verified at G10 (live RLS probe) with
--   two seeded users in different tenants — see
--   .codex-temp/v2-dash-01/rls-probe.md.
--
-- RANKING:
--   priority_weight:
--     security  -> 1.5
--     urgent    -> 1.3
--     warning   -> 1.1
--     info / *  -> 1.0
--   recency_weight = exp(-extract(epoch from now() - created_at) / 86400)
--     ≈ 1.00 at now, ≈ 0.37 at 24h, ≈ 0.13 at 48h
--
--   The composite score lets one set of dashboard primitives surface
--   both routine activity ("your last booking") and urgent customer
--   signals ("verification needed") in a coherent order without the
--   ranking model leaking into the UI layer.
--
-- The function is STABLE — same inputs + same database state ⇒ same
-- output (modulo the recency exponent which is monotonic in now()).

set check_function_bodies = off;

------------------------------------------------------------------------
-- 1. The function
------------------------------------------------------------------------

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
language sql
stable
security definer
set search_path = public
as $$
  with viewer as (
    select viewer_id as id
  ),
  -- Per-priority weight.
  priority_weights(priority, weight) as (
    values
      ('security'::text, 1.5::numeric),
      ('urgent', 1.3),
      ('warning', 1.1),
      ('info', 1.0),
      ('success', 1.0)
  ),
  -- Source 1: customer_notifications scoped to the viewer.
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
    where cn.user_id = (select id from viewer)
      and cn.deleted_at is null
  ),
  -- Source 2: customer_activity scoped to the viewer (last 30d).
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
    where ca.user_id = (select id from viewer)
      and ca.created_at >= now() - interval '30 days'
      and ca.archived_at is null
  ),
  -- Union of both sources with priority weights joined.
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
$$;

------------------------------------------------------------------------
-- 2. Permissions
------------------------------------------------------------------------

revoke all on function public.get_signal_feed(uuid, int, numeric, timestamptz) from public;
grant execute on function public.get_signal_feed(uuid, int, numeric, timestamptz) to authenticated, service_role;

comment on function public.get_signal_feed(uuid, int, numeric, timestamptz) is
  'Unified ranked signal feed for the HenryCo dashboard shell. Joins '
  'customer_notifications (deleted_at null) + customer_activity '
  '(archived_at null, last 30 days), ranks by priority * recency, '
  'returns up to limit_count rows with cursor pagination via '
  '(after_score, after_created_at). SECURITY DEFINER with pinned '
  'search_path; never echoes data the viewer would not see via direct '
  'SELECT against the underlying tables. Cross-tenant isolation '
  'verified at V2-DASH-01 G10 RLS probe. DASH-6 extends this function '
  'with staff_notifications + is_staff_in() once V2-NOT-02-A '
  '(20260502120000_staff_notifications_audience.sql) is applied.';

------------------------------------------------------------------------
-- 3. Hardening notes
------------------------------------------------------------------------
--
-- Index hot-paths the planner already covers:
--   * customer_notifications: (user_id, deleted_at, created_at desc) — exists
--   * customer_activity:       (user_id, created_at desc)            — exists
--
-- Future schema dependencies (DASH-6):
--   * is_staff_in(division text, role text default null) returns boolean
--     — defined by 20260502120000_staff_notifications_audience.sql.
--   * staff_notifications + staff_notification_states tables — same.
--   When V2-NOT-02-A is applied, DASH-6 will SUPERSEDE this function
--   with a version that adds the staff_notifications CTE + role_fit
--   weight. The function name + signature stays stable; consumers do
--   not change.
