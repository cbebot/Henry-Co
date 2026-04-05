-- HenryCo HQ internal messaging (owner API + service role only; RLS enabled with no policies = locked to service role)

begin;

create table if not exists public.hq_internal_comm_threads (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  kind text not null default 'group' check (kind in ('dm', 'group', 'broadcast', 'announcement')),
  title text not null,
  division text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.hq_internal_comm_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.hq_internal_comm_threads(id) on delete cascade,
  author_id uuid references auth.users(id) on delete set null,
  author_label text,
  body text not null check (char_length(body) > 0 and char_length(body) < 8000),
  parent_id uuid references public.hq_internal_comm_messages(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists hq_internal_comm_messages_thread_created_idx
  on public.hq_internal_comm_messages (thread_id, created_at desc);

alter table public.hq_internal_comm_threads enable row level security;
alter table public.hq_internal_comm_messages enable row level security;

commit;
