alter table public.marketplace_vendor_applications
  add column if not exists progress_step text not null default 'start',
  add column if not exists documents_json jsonb not null default '{}'::jsonb,
  add column if not exists draft_payload jsonb not null default '{}'::jsonb,
  add column if not exists agreement_accepted_at timestamptz,
  add column if not exists onboarding_completed_at timestamptz;

alter table public.marketplace_notification_queue
  add column if not exists event_id uuid,
  add column if not exists dedupe_key text,
  add column if not exists provider text,
  add column if not exists provider_message_id text,
  add column if not exists delivery_attempts integer not null default 0,
  add column if not exists last_attempted_at timestamptz,
  add column if not exists next_retry_at timestamptz,
  add column if not exists sent_at timestamptz,
  add column if not exists skipped_reason text,
  add column if not exists last_error text;

create table if not exists public.marketplace_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  dedupe_key text,
  user_id uuid references auth.users(id) on delete set null,
  normalized_email text,
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_email text,
  entity_type text,
  entity_id text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.marketplace_notification_attempts (
  id uuid primary key default gen_random_uuid(),
  queue_id uuid not null references public.marketplace_notification_queue(id) on delete cascade,
  channel text not null,
  provider text,
  status text not null default 'queued',
  reason text,
  message_id text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.marketplace_automation_runs (
  id uuid primary key default gen_random_uuid(),
  automation_key text not null,
  status text not null default 'started',
  summary jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.marketplace_user_comm_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  normalized_email text,
  email_enabled boolean not null default true,
  whatsapp_enabled boolean not null default true,
  marketing_enabled boolean not null default false,
  critical_alerts_enabled boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'marketplace_notification_queue_event_id_fkey'
  ) then
    alter table public.marketplace_notification_queue
      add constraint marketplace_notification_queue_event_id_fkey
      foreign key (event_id) references public.marketplace_events(id) on delete set null;
  end if;
end
$$;

create index if not exists marketplace_vendor_applications_progress_idx
  on public.marketplace_vendor_applications(status, progress_step, updated_at desc);

create index if not exists marketplace_events_event_type_idx
  on public.marketplace_events(event_type, created_at desc);

create index if not exists marketplace_events_entity_idx
  on public.marketplace_events(entity_type, entity_id, created_at desc);

create index if not exists marketplace_events_user_idx
  on public.marketplace_events(user_id, normalized_email, created_at desc);

create index if not exists marketplace_events_dedupe_idx
  on public.marketplace_events(dedupe_key, created_at desc);

create index if not exists marketplace_notification_attempts_queue_idx
  on public.marketplace_notification_attempts(queue_id, created_at desc);

create index if not exists marketplace_notification_queue_status_idx
  on public.marketplace_notification_queue(status, created_at desc);

create index if not exists marketplace_notification_queue_dedupe_idx
  on public.marketplace_notification_queue(dedupe_key, created_at desc);

create index if not exists marketplace_automation_runs_key_idx
  on public.marketplace_automation_runs(automation_key, created_at desc);

create unique index if not exists marketplace_comm_prefs_user_unique_idx
  on public.marketplace_user_comm_preferences(user_id)
  where user_id is not null;

create unique index if not exists marketplace_comm_prefs_email_unique_idx
  on public.marketplace_user_comm_preferences(normalized_email)
  where normalized_email is not null;

alter table public.marketplace_events enable row level security;
alter table public.marketplace_notification_attempts enable row level security;
alter table public.marketplace_automation_runs enable row level security;
alter table public.marketplace_user_comm_preferences enable row level security;

drop policy if exists marketplace_member_comm_preferences_select on public.marketplace_user_comm_preferences;
create policy marketplace_member_comm_preferences_select on public.marketplace_user_comm_preferences
for select using (auth.uid() = user_id);

drop policy if exists marketplace_member_comm_preferences_insert on public.marketplace_user_comm_preferences;
create policy marketplace_member_comm_preferences_insert on public.marketplace_user_comm_preferences
for insert with check (auth.uid() = user_id);

drop policy if exists marketplace_member_comm_preferences_update on public.marketplace_user_comm_preferences;
create policy marketplace_member_comm_preferences_update on public.marketplace_user_comm_preferences
for update using (auth.uid() = user_id);

drop trigger if exists marketplace_automation_runs_updated_at on public.marketplace_automation_runs;
create trigger marketplace_automation_runs_updated_at
before update on public.marketplace_automation_runs
for each row execute function public.marketplace_set_updated_at();

drop trigger if exists marketplace_user_comm_preferences_updated_at on public.marketplace_user_comm_preferences;
create trigger marketplace_user_comm_preferences_updated_at
before update on public.marketplace_user_comm_preferences
for each row execute function public.marketplace_set_updated_at();
