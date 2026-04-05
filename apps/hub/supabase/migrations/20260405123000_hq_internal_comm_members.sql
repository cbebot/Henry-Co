-- Thread membership + read state for unread counts (owner API + service role only)

begin;

create table if not exists public.hq_internal_comm_thread_members (
  thread_id uuid not null references public.hq_internal_comm_threads(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'manager', 'member', 'observer')),
  last_read_at timestamptz,
  pinned boolean not null default false,
  muted boolean not null default false,
  joined_at timestamptz not null default timezone('utc', now()),
  primary key (thread_id, user_id)
);

create index if not exists hq_internal_comm_members_user_idx
  on public.hq_internal_comm_thread_members (user_id);

alter table public.hq_internal_comm_thread_members enable row level security;

commit;
