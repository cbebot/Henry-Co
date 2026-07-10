-- Founder Intelligence F2 (2026-07-10) — the owner-only executive assistant's
-- conversation store. SEPARATE from the customer intelligence_* pair BY DESIGN:
-- the brief requires an access model independent of the support AI.
--
-- FLAG-DARK: nothing reads or writes these tables until
-- NEXT_PUBLIC_FOUNDER_INTELLIGENCE_LIVE=1. Apply at activation.
--
-- Posture (the owner-inbox lockbox idiom):
--   • RLS enabled, default-deny.
--   • ALL writes are service-role from the hub route (ownership-checked in
--     code before appending to a caller-supplied conversation — the PR #389
--     IDOR lesson applied from day one).
--   • SELECT is owner-only through a SECURITY DEFINER gate function — the
--     same idiom as owner_inbox_is_owner(), created because is_owner() is
--     SECURITY INVOKER and recurses through owner_profiles RLS (FIRE HUB-1).

create or replace function public.founder_intelligence_is_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.owner_profiles op
    where op.user_id = auth.uid()
      and op.is_active
      and op.role in ('owner', 'admin')
  );
$$;

revoke all on function public.founder_intelligence_is_owner() from anon;
grant execute on function public.founder_intelligence_is_owner() to authenticated;

create table if not exists public.founder_intelligence_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.founder_intelligence_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.founder_intelligence_conversations (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  navigate jsonb,
  created_at timestamptz not null default now()
);

create index if not exists founder_intelligence_messages_conversation_idx
  on public.founder_intelligence_messages (conversation_id, created_at);

alter table public.founder_intelligence_conversations enable row level security;
alter table public.founder_intelligence_messages enable row level security;

-- Owner-only reads; NO insert/update/delete policies (service-role writes only).
create policy founder_intel_conversations_owner_read
  on public.founder_intelligence_conversations
  for select
  to authenticated
  using (public.founder_intelligence_is_owner());

create policy founder_intel_messages_owner_read
  on public.founder_intelligence_messages
  for select
  to authenticated
  using (public.founder_intelligence_is_owner());

-- The latent-grant lockdown lesson (sec_harden_08): revoke write grants so a
-- future permissive policy cannot silently open a write path.
revoke insert, update, delete, truncate on public.founder_intelligence_conversations from anon, authenticated;
revoke insert, update, delete, truncate on public.founder_intelligence_messages from anon, authenticated;
