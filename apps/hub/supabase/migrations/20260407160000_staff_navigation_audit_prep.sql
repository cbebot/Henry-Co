-- Future: staff device / page-visit audit (owner-inspectable, service-role writes only).
-- RLS enabled with no policies = locked to service role / Postgres role bypass.

begin;

create table if not exists public.staff_navigation_audit (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  session_fingerprint text,
  path text not null,
  division text,
  referrer text,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists staff_navigation_audit_user_created_idx
  on public.staff_navigation_audit (user_id, created_at desc);

create index if not exists staff_navigation_audit_path_created_idx
  on public.staff_navigation_audit (path, created_at desc);

alter table public.staff_navigation_audit enable row level security;

commit;
