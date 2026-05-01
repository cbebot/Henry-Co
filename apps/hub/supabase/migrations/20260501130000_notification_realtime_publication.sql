-- V2-NOT-01-B B3.1: enable Supabase Realtime on customer_notifications.
--
-- This is the server-side half of the polling-to-Realtime upgrade. The
-- client-side rewrite of NotificationSignalProvider to subscribe to the
-- channel is staged for B3.2 (separate change) so that the migration can
-- land independently and the existing polling flow keeps working until the
-- client subscriber ships.
--
-- Why a dedicated migration rather than a one-line ALTER:
--   * The realtime publication may not exist on every Supabase project (older
--     projects have it, freshly minted ones too, but this is defensive).
--   * The publication membership is global — if customer_notifications were
--     already added by a Supabase dashboard click in the past, ALTER
--     PUBLICATION ... ADD TABLE would error. We pre-check pg_publication_tables.
--   * RLS on customer_notifications already restricts SELECT to
--     auth.uid() = user_id; Supabase Realtime applies the same RLS to the
--     subscription stream, so isolation holds without extra channel-level
--     filters. This is verified by the cross-user isolation probe (B3.3,
--     deferred to a preview environment with two authenticated browsers).

do $$
begin
  -- Create the publication if it somehow doesn't exist yet. Supabase's
  -- managed setup creates `supabase_realtime` automatically; this is the
  -- belt-and-braces guard for self-hosted clones.
  if not exists (
    select 1 from pg_publication where pubname = 'supabase_realtime'
  ) then
    create publication supabase_realtime;
  end if;

  -- Add customer_notifications to the publication only if it isn't a member
  -- already. Re-running this migration is then a no-op.
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'customer_notifications'
  ) then
    execute 'alter publication supabase_realtime add table public.customer_notifications';
  end if;
end
$$;

-- Sanity comment: subscribers must filter on user_id=eq.auth.uid() at the
-- channel layer for clarity, but the SELECT-side RLS policy is the
-- authoritative isolator. Do not weaken either.
comment on table public.customer_notifications is
  'In-app notification inbox per user. RLS: SELECT own only (auth.uid() = user_id). Realtime publication: supabase_realtime. Inserted by service-role only via packages/notifications publisher shim or per-division bridge files.';
