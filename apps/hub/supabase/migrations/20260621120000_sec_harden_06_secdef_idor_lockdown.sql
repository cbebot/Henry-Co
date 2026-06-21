-- =====================================================================
-- SEC-HARDEN-06 — SECURITY DEFINER exposure + IDOR-by-parameter lockdown
-- =====================================================================
--
-- CONTEXT (verified on prod rzkbgwuznmdxnnhmjazy):
--   public holds 45 SECURITY DEFINER functions. Because this project's
--   ALTER DEFAULT PRIVILEGES grants EXECUTE to anon + authenticated by
--   default, 37 were anon-callable and 41 authenticated-callable. Two
--   of them trusted a CALLER-SUPPLIED identity parameter and returned
--   data scoped to it without checking auth.uid() -> live IDOR. A third
--   family (support_*) performed staff actions on a caller-supplied
--   actor id with no staff guard, relying only on being called by the
--   trusted service role -- a trust boundary the leaky grants broke.
--
-- This migration:
--   TIER 0  Fixes the get_signal_feed IDOR (derive the viewer guard
--           from auth.uid(); the service-role backend, the sole real
--           caller, has auth.uid() = null and keeps working).
--   TIER 1  Fixes the get_default_user_address IDOR (same guard) and
--           hardens the support_* family with an in-function staff
--           guard (skipped for the service role) -> impersonation shut.
--   TIER 2  Revokes anon/authenticated EXECUTE from every SECDEF
--           function that no end-user client legitimately calls
--           directly (trigger functions, admin_* owner tools, cron/
--           internal helpers, support_*). The 9 RLS-load-bearing
--           helpers and the genuinely public reads are LEFT callable.
--   ROOT    Corrects ALTER DEFAULT PRIVILEGES so future public
--           functions do NOT inherit anon/authenticated EXECUTE.
--
-- SAFETY:
--   * payments_private money RPCs are NOT touched (separate schema).
--   * No RLS-helper grant is revoked (verified against pg_policies).
--   * CREATE OR REPLACE preserves existing grants; the root-cause
--     change only affects functions created in the FUTURE, so none of
--     the 45 existing functions change behavior from it.
--   * Idempotent: re-running yields the same end state.
--
-- COMMITTED, NOT APPLIED. The owner applies after the architect
-- re-verifies on prod.
-- =====================================================================

set check_function_bodies = off;

-- ---------------------------------------------------------------------
-- TIER 0 — get_signal_feed IDOR fix
-- ---------------------------------------------------------------------
-- An authenticated end-user could read ANY user's notifications +
-- activity by passing another user's id as viewer_id. We now reject a
-- cross-user read from any non-service (authenticated) session. The
-- service role (packages/data/src/signal-feed.ts, the only real caller)
-- runs with auth.uid() = null and is allowed to pass viewer_id through.
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
  'Unified ranked signal feed for the dashboard shell. SEC-HARDEN-06: '
  'guarded so a non-service (authenticated) caller can only read its '
  'own feed (auth.uid() must match viewer_id); the service role '
  '(auth.uid() null) may pass viewer_id through. Joins '
  'customer_notifications + customer_activity, ranks by priority * '
  'recency, cursor-paginated via (after_score, after_created_at).';

-- ---------------------------------------------------------------------
-- TIER 1 — get_default_user_address IDOR fix
-- ---------------------------------------------------------------------
-- SECURITY DEFINER with NO auth check returned any user's full default
-- address (name / street / city / phone PII) for a supplied user id,
-- and the default-privilege leak made it anon-callable. Same guard as
-- get_signal_feed; anon EXECUTE is revoked (the function was only ever
-- meant for authenticated self-reads / service-role server reads).
create or replace function public.get_default_user_address(p_user_id uuid)
returns public.user_addresses
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_row public.user_addresses;
begin
  if auth.uid() is not null and auth.uid() is distinct from p_user_id then
    raise exception 'get_default_user_address: forbidden - cannot read another user''s address'
      using errcode = '42501';
  end if;

  select *
    into v_row
    from public.user_addresses
   where user_id = p_user_id
     and is_default = true
   limit 1;

  return v_row;
end;
$$;

revoke all on function public.get_default_user_address(uuid) from public;
revoke execute on function public.get_default_user_address(uuid) from public, anon;
grant execute on function public.get_default_user_address(uuid) to authenticated, service_role;

comment on function public.get_default_user_address(uuid) is
  'Returns the user''s default address row. SEC-HARDEN-06: guarded so '
  'a non-service (authenticated) caller can only read its own address '
  '(auth.uid() must match p_user_id); the service role passes the id '
  'through. anon EXECUTE revoked.';

-- ---------------------------------------------------------------------
-- TIER 1 — support_* family staff guard (defence in depth)
-- ---------------------------------------------------------------------
-- These perform STAFF actions (post an "agent" reply, assign, change
-- status, internal notes, forge events) on a caller-supplied actor id
-- with no staff check, trusting that only the service role calls them.
-- The leaky grants broke that trust. We (a) revoke anon/authenticated
-- EXECUTE below in TIER 2 and (b) add an in-function guard: a non-
-- service caller must be staff. The service role (auth.uid() null)
-- skips the guard, so the legitimate server-action path is unchanged.

create or replace function public.support_staff_reply(
  p_thread_id uuid, p_staff_id uuid, p_body text,
  p_attachments jsonb default '[]'::jsonb, p_metadata jsonb default '{}'::jsonb)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public', 'pg_catalog'
as $function$
declare
  v_thread record;
  v_message_id uuid;
  v_now timestamptz := timezone('utc', now());
begin
  if auth.uid() is not null and not public.is_staff_in_any() then
    raise exception 'support_staff_reply: staff-only operation' using errcode = '42501';
  end if;

  select id, user_id, subject, division, status
  into v_thread
  from public.support_threads
  where id = p_thread_id;

  if v_thread.id is null then
    return jsonb_build_object('success', false, 'error', 'thread_not_found');
  end if;

  insert into public.support_messages (thread_id, sender_id, sender_type, body, attachments, created_at)
  values (p_thread_id, p_staff_id, 'agent', p_body, p_attachments, v_now)
  returning id into v_message_id;

  update public.support_threads
  set status = case when status in ('open', 'awaiting_reply') then 'in_progress' else status end,
      staff_last_read_at = v_now,
      updated_at = v_now
  where id = p_thread_id;

  insert into public.support_thread_events (thread_id, event_type, actor_id, actor_type, new_value, metadata)
  values (p_thread_id, 'staff_reply', p_staff_id, 'staff', left(p_body, 100),
    jsonb_build_object('message_id', v_message_id));

  insert into public.customer_notifications (
    user_id, division, title, body, category, priority,
    action_url, reference_type, reference_id
  ) values (
    v_thread.user_id,
    coalesce(v_thread.division, 'account'),
    'New reply on your support request',
    'Staff has responded to "' || left(coalesce(v_thread.subject, 'your request'), 60) || '"',
    'support', 'normal',
    '/support/' || p_thread_id,
    'support_thread', p_thread_id::text
  );

  insert into public.customer_activity (
    user_id, division, activity_type, title, description,
    status, reference_type, reference_id
  ) values (
    v_thread.user_id,
    coalesce(v_thread.division, 'account'),
    'support_reply_received',
    'Reply on: ' || coalesce(v_thread.subject, 'Support conversation'),
    'Staff responded to your support request.',
    'active',
    'support_thread', p_thread_id::text
  );

  return jsonb_build_object(
    'success', true,
    'message_id', v_message_id,
    'thread_status', (select status from public.support_threads where id = p_thread_id)
  );
end;
$function$;

create or replace function public.support_assign_thread(
  p_thread_id uuid, p_assignee_id uuid, p_actor_id uuid default null::uuid,
  p_metadata jsonb default '{}'::jsonb)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public', 'pg_catalog'
as $function$
declare
  v_old_assignee uuid;
begin
  if auth.uid() is not null and not public.is_staff_in_any() then
    raise exception 'support_assign_thread: staff-only operation' using errcode = '42501';
  end if;

  select assigned_to into v_old_assignee
  from public.support_threads
  where id = p_thread_id;

  if not found then
    return jsonb_build_object('success', false, 'error', 'thread_not_found');
  end if;

  update public.support_threads
  set assigned_to = p_assignee_id,
      updated_at = timezone('utc', now())
  where id = p_thread_id;

  insert into public.support_thread_events (thread_id, event_type, actor_id, actor_type, old_value, new_value, metadata)
  values (
    p_thread_id, 'assignment',
    p_actor_id, 'staff',
    v_old_assignee::text, p_assignee_id::text,
    p_metadata
  );

  return jsonb_build_object('success', true, 'old_assignee', v_old_assignee, 'new_assignee', p_assignee_id);
end;
$function$;

create or replace function public.support_update_thread_status(
  p_thread_id uuid, p_new_status text, p_actor_id uuid default null::uuid,
  p_actor_type text default 'staff'::text, p_metadata jsonb default '{}'::jsonb)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public', 'pg_catalog'
as $function$
declare
  v_old_status text;
  v_now timestamptz := timezone('utc', now());
begin
  if auth.uid() is not null and not public.is_staff_in_any() then
    raise exception 'support_update_thread_status: staff-only operation' using errcode = '42501';
  end if;

  select status into v_old_status
  from public.support_threads
  where id = p_thread_id;

  if v_old_status is null then
    return jsonb_build_object('success', false, 'error', 'thread_not_found');
  end if;

  if v_old_status = p_new_status then
    return jsonb_build_object('success', true, 'changed', false);
  end if;

  update public.support_threads
  set status = p_new_status,
      resolved_at = case when p_new_status = 'resolved' then v_now else resolved_at end,
      closed_at = case when p_new_status = 'closed' then v_now else closed_at end,
      updated_at = v_now
  where id = p_thread_id;

  insert into public.support_thread_events (thread_id, event_type, actor_id, actor_type, old_value, new_value, metadata)
  values (p_thread_id, 'status_change', p_actor_id, p_actor_type, v_old_status, p_new_status, p_metadata);

  return jsonb_build_object('success', true, 'changed', true, 'old_status', v_old_status, 'new_status', p_new_status);
end;
$function$;

create or replace function public.support_add_internal_note(
  p_thread_id uuid, p_author_id uuid, p_body text,
  p_visibility text default 'staff'::text, p_metadata jsonb default '{}'::jsonb)
 returns uuid
 language plpgsql
 security definer
 set search_path to 'public', 'pg_catalog'
as $function$
declare
  v_note_id uuid;
begin
  if auth.uid() is not null and not public.is_staff_in_any() then
    raise exception 'support_add_internal_note: staff-only operation' using errcode = '42501';
  end if;

  insert into public.support_thread_internal_notes (thread_id, author_id, body, visibility, metadata)
  values (p_thread_id, p_author_id, p_body, p_visibility, p_metadata)
  returning id into v_note_id;

  insert into public.support_thread_events (thread_id, event_type, actor_id, actor_type, new_value, metadata)
  values (p_thread_id, 'internal_note_added', p_author_id, 'staff', left(p_body, 100), jsonb_build_object('note_id', v_note_id));

  return v_note_id;
end;
$function$;

create or replace function public.support_log_event(
  p_thread_id uuid, p_event_type text, p_actor_id uuid default null::uuid,
  p_actor_type text default 'system'::text, p_old_value text default null::text,
  p_new_value text default null::text, p_metadata jsonb default '{}'::jsonb)
 returns uuid
 language plpgsql
 security definer
 set search_path to 'public', 'pg_catalog'
as $function$
declare
  v_event_id uuid;
begin
  if auth.uid() is not null and not public.is_staff_in_any() then
    raise exception 'support_log_event: staff-only operation' using errcode = '42501';
  end if;

  insert into public.support_thread_events (thread_id, event_type, actor_id, actor_type, old_value, new_value, metadata)
  values (p_thread_id, p_event_type, p_actor_id, p_actor_type, p_old_value, p_new_value, p_metadata)
  returning id into v_event_id;

  return v_event_id;
end;
$function$;

-- ---------------------------------------------------------------------
-- TIER 2 — grant posture lockdown
-- ---------------------------------------------------------------------
-- Lock to service_role the SECDEF functions that no end-user client
-- calls directly. We revoke from public, anon AND authenticated:
-- many of these functions carry an explicit GRANT EXECUTE TO PUBLIC on
-- prod (ACL shows an empty-grantee '=X/postgres' entry), and Postgres
-- privileges are additive -- revoking only anon/authenticated would
-- leave EXECUTE reachable via the inherited PUBLIC grant. service_role
-- keeps its own explicit grant (it bypasses RLS and is the trusted
-- backend), so the legitimate callers are unaffected.

-- (a) Trigger functions: fire as the table owner; EXECUTE grants are
--     irrelevant to trigger firing, so revoking cannot break anything.
revoke execute on function public.enforce_marketplace_listing_cap() from public, anon, authenticated;
revoke execute on function public.handle_new_customer() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.hq_internal_comm_touch_thread_updated_at() from public, anon, authenticated;
revoke execute on function public.prevent_owner_property_status_change() from public, anon, authenticated;
revoke execute on function public.protect_profile_sensitive_fields() from public, anon, authenticated;
revoke execute on function public.tg_workflow_targets_to_outbox() from public, anon, authenticated;
revoke execute on function public.update_thread_unread_counts() from public, anon, authenticated;
revoke execute on function public.user_addresses_enforce_default() from public, anon, authenticated;
revoke execute on function public.user_addresses_promote_after_delete() from public, anon, authenticated;

-- (b) Event-trigger function: only the event-trigger machinery invokes it.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

-- (c) Cron / internal write helpers: only service-role callers (cron
--     routes, backfill scripts) and the search-outbox trigger use them.
revoke execute on function public.enqueue_search_index_op(text, text, text, jsonb) from public, anon, authenticated;
revoke execute on function public.purge_completed_search_outbox(interval) from public, anon, authenticated;
revoke execute on function public.saved_items_sweep_expiry() from public, anon, authenticated;

-- (d) Owner-only admin tools: is_owner()-guarded, no direct client
--     caller. Lock to service_role (the guard remains as last defence).
revoke execute on function public.admin_set_profile_role(uuid, text) from public, anon, authenticated;
revoke execute on function public.admin_set_profile_frozen(uuid, boolean) from public, anon, authenticated;
revoke execute on function public.admin_force_reauth(uuid) from public, anon, authenticated;

-- (e) support_* family: staff actions invoked only by service-role
--     server actions. Lock to service_role (+ in-function staff guard).
revoke execute on function public.support_staff_reply(uuid, uuid, text, jsonb, jsonb) from public, anon, authenticated;
revoke execute on function public.support_assign_thread(uuid, uuid, uuid, jsonb) from public, anon, authenticated;
revoke execute on function public.support_update_thread_status(uuid, text, uuid, text, jsonb) from public, anon, authenticated;
revoke execute on function public.support_add_internal_note(uuid, uuid, text, text, jsonb) from public, anon, authenticated;
revoke execute on function public.support_log_event(uuid, text, uuid, text, text, text, jsonb) from public, anon, authenticated;

-- (f) Auth-required entry points: these raise without auth.uid(), so
--     anon EXECUTE is dead weight. Drop anon; keep authenticated (the
--     real callers) + service_role.
revoke execute on function public.accept_business_invitation(text) from public, anon;
revoke execute on function public.create_business(text, text, text, text, text, text) from public, anon;

-- INTENTIONALLY LEFT CALLABLE (documented for the audit trail):
--   * RLS helpers (authenticated EXECUTE is load-bearing for policies):
--       is_staff_in, is_staff_in_any, is_platform_staff, is_business_member,
--       business_member_role, current_app_role, hq_ic_can_read_thread,
--       hq_ic_can_write_thread, owner_inbox_is_owner.
--   * Internally guarded, authenticated-staff callers (logistics/studio
--     SSR): add_audit_log_v2 (is_staff_in_any guard).
--   * Owner-scoped ownership guard: upsert_delivery_promise (auth.uid()).
--   * Genuinely public reads: get_business_public_profile (status='active'),
--     create_care_booking (public booking), track_care_booking (capability
--     code), studio_invoice_by_token (192-bit CSPRNG capability token).
--   * Already service_role-only (incl. money): add_audit_log,
--     care_ledger_reconciliation, care_record_manual_payment (MONEY -
--     untouched), recompute_seller_tier.

-- ---------------------------------------------------------------------
-- ROOT CAUSE — stop new public functions inheriting anon/authd EXECUTE
-- ---------------------------------------------------------------------
-- The project's default privileges grant EXECUTE on every new public
-- function to anon + authenticated, which is what silently exposed the
-- functions above. Revoke that default for the postgres role (the role
-- migrations run as). service_role keeps its default EXECUTE. Existing
-- functions are unaffected (default privileges apply only at CREATE);
-- FUTURE functions must grant EXECUTE explicitly to be client-callable.
alter default privileges for role postgres in schema public
  revoke execute on functions from anon, authenticated;

-- Belt-and-suspenders for the also-present supabase_admin default ACL
-- on public functions (harmless no-op if the role/entry is absent).
do $$
begin
  begin
    alter default privileges for role supabase_admin in schema public
      revoke execute on functions from anon, authenticated;
  exception when others then
    raise notice 'sec-harden-06: supabase_admin default-privilege revoke skipped (%).', sqlerrm;
  end;
end$$;
