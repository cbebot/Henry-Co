create extension if not exists pgcrypto;

create or replace function public.shared_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role text,
  avatar_url text,
  is_active boolean not null default true,
  is_frozen boolean not null default false,
  frozen_at timestamptz,
  frozen_reason text,
  force_reauth_after timestamptz,
  force_signout_at timestamptz,
  forced_signout_at timestamptz,
  disabled_reason text,
  wallet_balance_ngn numeric not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.profiles
  add column if not exists full_name text,
  add column if not exists phone text,
  add column if not exists role text,
  add column if not exists avatar_url text,
  add column if not exists is_active boolean not null default true,
  add column if not exists is_frozen boolean not null default false,
  add column if not exists frozen_at timestamptz,
  add column if not exists frozen_reason text,
  add column if not exists force_reauth_after timestamptz,
  add column if not exists force_signout_at timestamptz,
  add column if not exists forced_signout_at timestamptz,
  add column if not exists disabled_reason text,
  add column if not exists wallet_balance_ngn numeric not null default 0,
  add column if not exists created_at timestamptz not null default timezone('utc', now()),
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

create table if not exists public.owner_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'owner',
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.owner_profiles
  add column if not exists email text,
  add column if not exists full_name text,
  add column if not exists role text not null default 'owner',
  add column if not exists is_active boolean not null default true,
  add column if not exists created_at timestamptz not null default timezone('utc', now()),
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

create table if not exists public.customer_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  division text not null default 'account',
  activity_type text not null,
  title text not null,
  description text,
  status text not null default 'open',
  action_url text,
  reference_type text,
  reference_id text,
  amount_kobo bigint,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.customer_activity
  add column if not exists division text not null default 'account',
  add column if not exists activity_type text,
  add column if not exists title text,
  add column if not exists description text,
  add column if not exists status text not null default 'open',
  add column if not exists action_url text,
  add column if not exists reference_type text,
  add column if not exists reference_id text,
  add column if not exists amount_kobo bigint,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists created_at timestamptz not null default timezone('utc', now());

create table if not exists public.customer_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  division text not null default 'account',
  title text not null,
  body text not null,
  category text not null default 'general',
  priority text not null default 'normal',
  action_label text,
  action_url text,
  reference_type text,
  reference_id text,
  is_read boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.customer_notifications
  add column if not exists division text not null default 'account',
  add column if not exists title text,
  add column if not exists body text,
  add column if not exists category text not null default 'general',
  add column if not exists priority text not null default 'normal',
  add column if not exists action_label text,
  add column if not exists action_url text,
  add column if not exists reference_type text,
  add column if not exists reference_id text,
  add column if not exists is_read boolean not null default false,
  add column if not exists read_at timestamptz,
  add column if not exists created_at timestamptz not null default timezone('utc', now());

create table if not exists public.support_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null,
  division text,
  category text not null default 'general',
  status text not null default 'open',
  priority text not null default 'normal',
  reference_type text,
  reference_id text,
  assigned_to uuid references auth.users(id) on delete set null,
  resolved_at timestamptz,
  closed_at timestamptz,
  customer_last_read_at timestamptz,
  staff_last_read_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.support_threads
  add column if not exists subject text,
  add column if not exists division text,
  add column if not exists category text not null default 'general',
  add column if not exists status text not null default 'open',
  add column if not exists priority text not null default 'normal',
  add column if not exists reference_type text,
  add column if not exists reference_id text,
  add column if not exists assigned_to uuid references auth.users(id) on delete set null,
  add column if not exists resolved_at timestamptz,
  add column if not exists closed_at timestamptz,
  add column if not exists customer_last_read_at timestamptz,
  add column if not exists staff_last_read_at timestamptz,
  add column if not exists created_at timestamptz not null default timezone('utc', now()),
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.support_threads(id) on delete cascade,
  sender_id uuid references auth.users(id) on delete set null,
  sender_type text not null default 'customer',
  body text not null,
  attachments jsonb not null default '[]'::jsonb,
  is_read boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.support_messages
  add column if not exists sender_id uuid references auth.users(id) on delete set null,
  add column if not exists sender_type text not null default 'customer',
  add column if not exists body text,
  add column if not exists attachments jsonb not null default '[]'::jsonb,
  add column if not exists is_read boolean not null default false,
  add column if not exists read_at timestamptz,
  add column if not exists created_at timestamptz not null default timezone('utc', now());

create table if not exists public.staff_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  actor_role text,
  action text not null,
  entity text not null,
  entity_id text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.staff_audit_logs
  add column if not exists actor_id uuid references auth.users(id) on delete set null,
  add column if not exists actor_role text,
  add column if not exists action text,
  add column if not exists entity text,
  add column if not exists entity_id text,
  add column if not exists meta jsonb not null default '{}'::jsonb,
  add column if not exists created_at timestamptz not null default timezone('utc', now());

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  actor_role text,
  action text not null,
  entity_type text not null,
  entity_id text,
  ip inet,
  user_agent text,
  reason text,
  old_values jsonb,
  new_values jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.audit_logs
  add column if not exists actor_id uuid references auth.users(id) on delete set null,
  add column if not exists actor_role text,
  add column if not exists action text,
  add column if not exists entity_type text,
  add column if not exists entity_id text,
  add column if not exists ip inet,
  add column if not exists user_agent text,
  add column if not exists reason text,
  add column if not exists old_values jsonb,
  add column if not exists new_values jsonb,
  add column if not exists created_at timestamptz not null default timezone('utc', now());

create index if not exists profiles_role_idx on public.profiles (role);
create index if not exists owner_profiles_role_idx on public.owner_profiles (role, is_active);
create index if not exists customer_activity_user_created_idx
  on public.customer_activity(user_id, created_at desc);
create index if not exists customer_activity_division_status_idx
  on public.customer_activity(division, status, created_at desc);
create index if not exists customer_notifications_user_created_idx
  on public.customer_notifications(user_id, created_at desc);
create index if not exists customer_notifications_division_priority_idx
  on public.customer_notifications(division, priority, created_at desc);
create index if not exists support_threads_user_updated_idx
  on public.support_threads(user_id, updated_at desc);
create index if not exists support_threads_division_status_idx
  on public.support_threads(division, status, priority, updated_at desc);
create index if not exists support_threads_assignee_status_idx
  on public.support_threads(assigned_to, status, updated_at desc);
create index if not exists support_messages_thread_created_idx
  on public.support_messages(thread_id, created_at asc);
create index if not exists support_messages_thread_read_idx
  on public.support_messages(thread_id, is_read, created_at desc);
create index if not exists staff_audit_logs_entity_created_idx
  on public.staff_audit_logs(entity, entity_id, created_at desc);
create index if not exists staff_audit_logs_actor_created_idx
  on public.staff_audit_logs(actor_id, created_at desc);
create index if not exists audit_logs_entity_created_idx
  on public.audit_logs(entity_type, entity_id, created_at desc);
create index if not exists audit_logs_actor_created_idx
  on public.audit_logs(actor_id, created_at desc);

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
before update on public.profiles
for each row execute function public.shared_set_updated_at();

drop trigger if exists owner_profiles_updated_at on public.owner_profiles;
create trigger owner_profiles_updated_at
before update on public.owner_profiles
for each row execute function public.shared_set_updated_at();

drop trigger if exists support_threads_updated_at on public.support_threads;
create trigger support_threads_updated_at
before update on public.support_threads
for each row execute function public.shared_set_updated_at();
