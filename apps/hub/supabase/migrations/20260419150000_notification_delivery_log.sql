-- Unified cross-division delivery attempt log for non-in-app channels.
-- Division-specific queues (care_notification_queue, studio_notification_records, etc.) are
-- not replaced — this table captures the account-level email/push/sms decision record so
-- delivery success/failure is visible without reading multiple division tables.

create table if not exists public.notification_delivery_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  notification_id uuid references public.customer_notifications(id) on delete set null,
  channel text not null,
  provider text not null,
  status text not null,
  provider_message_id text,
  error_code text,
  error_message text,
  division text,
  category text,
  event_name text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists notification_delivery_log_user_idx
  on public.notification_delivery_log(user_id, channel, status, created_at desc);

create index if not exists notification_delivery_log_notification_idx
  on public.notification_delivery_log(notification_id)
  where notification_id is not null;

alter table public.notification_delivery_log enable row level security;

create policy "users can read own delivery log"
  on public.notification_delivery_log for select
  using (auth.uid() = user_id);

create policy "service role manages delivery log"
  on public.notification_delivery_log for all
  using (auth.role() = 'service_role');
