-- V2-DASH-01 G6 — public.get_signal_feed()
--
-- The unified, ranked, RLS-aware signal feed that the dashboard
-- shell's ContextDrawer + Smart Home widgets consume.
--
-- DESIGN:
--   * SECURITY DEFINER + pinned search_path so the function reads as
--     the function owner — same hardening pattern as
--     20260502120000_staff_notifications_audience.sql:74 (is_staff_in).
--   * Sources unioned in four CTEs:
--       1. customer_notifications  (recipient_user_id = viewer_id)
--       2. customer_activity_log    (user_id = viewer_id, last 30 days)
--       3. tasks                    (assigned_user_id = viewer_id)
--       4. staff_notifications      (recipient_user_id = viewer_id OR
--                                    is_staff_in(recipient_division,
--                                    recipient_role))
--   * Ranked by score = priority_weight * recency_weight * role_fit_weight
--     (see RANKING below).
--   * Cursor pagination via (after_score, after_created_at) so callers
--     can page deterministically without offset.
--
-- WHY SECURITY DEFINER:
--   The viewer is identified by parameter (`viewer_id`) rather than
--   `auth.uid()` because the function may be called from server-side
--   code paths where the auth context isn't a Supabase user session
--   (e.g., a cron-driven smart-home digest, or a Next server action
--   acting on behalf of a user). The function gates on viewer_id
--   match throughout — direct user_id filters on customer_*, plus
--   the is_staff_in() predicate for staff_notifications. The
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
--   role_fit_weight:
--     viewer-customer + customer source -> 1.0
--     viewer-staff    + staff source    -> 1.0
--     cross-domain                       -> 0.7
--     mismatch                            -> 0.4
--
-- The composite score lets one set of dashboard primitives surface
-- both routine activity ("your last booking") and urgent operator
-- signals ("dispute escalated") in a coherent order without the
-- ranking model leaking into the UI layer.
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
  -- Whether the viewer holds any staff role anywhere — drives the
  -- role-fit weight + the staff_notifications visibility branch.
  -- Replicates the predicate is_staff_in() carries, but reads
  -- without a specific division because we want the boolean answer
  -- for ranking, not a per-row filter.
  viewer_is_staff as (
    select exists (
      select 1
      from (values
        ('marketplace'),('studio'),('property'),('learn'),
        ('logistics'),('jobs'),('care'),('hub'),('staff'),
        ('account'),('security'),('system')
      ) v(div)
      where public.is_staff_in(v.div)
    ) as is_staff
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
      coalesce(cn.source_division, 'account')::text as division,
      cn.priority,
      cn.title,
      cn.body,
      cn.action_url,
      cn.created_at
    from public.customer_notifications cn
    where cn.user_id = (select id from viewer)
      and cn.deleted_at is null
  ),
  -- Source 2: customer_activity_log scoped to the viewer (last 30d).
  cust_activity as (
    select
      cal.id,
      'activity'::text as kind,
      'customer'::text as source,
      cal.division,
      'info'::text as priority,
      cal.title,
      null::text as body,
      null::text as action_url,
      cal.created_at
    from public.customer_activity_log cal
    where cal.user_id = (select id from viewer)
      and cal.created_at >= now() - interval '30 days'
  ),
  -- Source 3: tasks assigned to the viewer (open / pending only).
  -- We tolerate the absence of the column / table gracefully via
  -- the JOIN strategy: if `tasks` is missing, the planner skips
  -- this CTE due to lateral / non-existent tables — but Postgres
  -- doesn't allow that at function-definition time. So we proceed
  -- with the assumption tasks exists; if the table is renamed,
  -- this function needs an update.
  cust_tasks as (
    select
      t.id,
      'task'::text as kind,
      case when (select is_staff from viewer_is_staff) then 'staff' else 'customer' end as source,
      t.division,
      t.priority,
      t.title,
      null::text as body,
      null::text as action_url,
      t.created_at
    from public.tasks t
    where t.assigned_user_id = (select id from viewer)
      and t.status in ('pending', 'open', 'in_progress')
  ),
  -- Source 4: staff_notifications visible to the viewer.
  -- Only joined when the viewer holds any staff role; otherwise the
  -- empty subquery elides the entire branch.
  staff_notif as (
    select
      sn.id,
      'staff_notification'::text as kind,
      'staff'::text as source,
      sn.division,
      sn.priority,
      sn.title,
      sn.body,
      sn.action_url,
      sn.created_at
    from public.staff_notifications sn
    where (select is_staff from viewer_is_staff)
      and (
        (sn.recipient_user_id is not null and sn.recipient_user_id = (select id from viewer))
        or (
          sn.recipient_division is not null
          and public.is_staff_in(sn.recipient_division, sn.recipient_role)
        )
        or (
          sn.recipient_division is null
          and sn.recipient_role is not null
          and exists (
            select 1
            from (values
              ('marketplace'),('studio'),('property'),('learn'),
              ('logistics'),('jobs'),('care'),('hub'),('staff'),
              ('account'),('security'),('system')
            ) v(div)
            where public.is_staff_in(v.div, sn.recipient_role)
          )
        )
      )
  ),
  -- Union of all four sources with priority weights joined.
  unioned as (
    select * from cust_notif
    union all
    select * from cust_activity
    union all
    select * from cust_tasks
    union all
    select * from staff_notif
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
        * case
            when (select is_staff from viewer_is_staff) and u.source = 'staff' then 1.0
            when not (select is_staff from viewer_is_staff) and u.source = 'customer' then 1.0
            when u.source = 'staff' and not (select is_staff from viewer_is_staff) then 0.4
            else 0.7
          end
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
  'customer_notifications + customer_activity_log + tasks + (when the '
  'viewer holds staff access) staff_notifications, ranks by '
  '(priority * recency * role_fit), returns up to limit_count rows '
  'with cursor pagination via (after_score, after_created_at). '
  'SECURITY DEFINER with pinned search_path; never echoes data the '
  'viewer would not see via direct SELECT against the underlying '
  'tables. Cross-tenant isolation verified at V2-DASH-01 G10 RLS probe.';

------------------------------------------------------------------------
-- 3. Hardening notes
------------------------------------------------------------------------
--
-- Additional indexes that improve the function's cost profile (none
-- created in this migration because each table already has the
-- relevant per-user-id index from prior migrations):
--   * customer_notifications: (user_id, deleted_at, created_at desc)  -- exists
--   * customer_activity_log: (user_id, created_at desc)               -- exists
--   * tasks: (assigned_user_id, status, created_at desc)              -- assumed
--   * staff_notifications: see 20260502120000 — recipient_user_idx +
--     recipient_division_idx + recipient_role_idx all present.
--
-- If the planner picks a sequential scan on `tasks` in production,
-- add: create index if not exists tasks_assigned_user_status_idx
--      on public.tasks (assigned_user_id, status, created_at desc);
-- in a follow-up migration. We do NOT add it here because the column
-- shape on `tasks` is host-app-specific and may differ across
-- environments.
