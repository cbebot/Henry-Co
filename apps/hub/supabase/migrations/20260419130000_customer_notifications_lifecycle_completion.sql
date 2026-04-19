-- Customer notification lifecycle completion.
-- Safe additive production pass for notification payload + lifecycle fields.
-- Intentionally scoped to customer_notifications only.

alter table if exists public.customer_notifications
  add column if not exists detail_payload jsonb not null default '{}'::jsonb,
  add column if not exists archived_at timestamptz,
  add column if not exists deleted_at timestamptz,
  add column if not exists read_at timestamptz;

-- Backfill read_at only for rows already marked read without rewriting the
-- rest of the table. Existing unread rows remain untouched.
update public.customer_notifications
set read_at = coalesce(read_at, created_at)
where is_read = true
  and read_at is null;

create index if not exists customer_notifications_user_lifecycle_idx
  on public.customer_notifications(user_id, archived_at, deleted_at, created_at desc);
