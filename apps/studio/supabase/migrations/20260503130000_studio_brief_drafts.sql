-- STUDIO-CP-01 — Brief Co-pilot drafts.
-- Persists every Claude Haiku 4.5 brief-co-pilot generation: the raw
-- paragraph the user typed, the structured JSON returned, the model
-- used, and token accounting for cost auditing. RLS scopes reads to the
-- authenticated user OR a session id cookie for anonymous use.

create table if not exists public.studio_brief_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  normalized_email text,
  session_id text,
  raw_input text not null,
  structured_output jsonb not null default '{}'::jsonb,
  model_used text not null default 'claude-haiku-4-5-20251001',
  tokens_in integer not null default 0,
  tokens_out integer not null default 0,
  cache_read_input_tokens integer not null default 0,
  cache_creation_input_tokens integer not null default 0,
  duration_ms integer not null default 0,
  status text not null default 'completed' check (status in ('completed', 'failed', 'rate_limited')),
  error_reason text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists studio_brief_drafts_user_idx
  on public.studio_brief_drafts(user_id);
create index if not exists studio_brief_drafts_email_idx
  on public.studio_brief_drafts(normalized_email);
create index if not exists studio_brief_drafts_session_idx
  on public.studio_brief_drafts(session_id);
create index if not exists studio_brief_drafts_created_idx
  on public.studio_brief_drafts(created_at desc);

alter table public.studio_brief_drafts enable row level security;

-- Authenticated users see their own drafts (by user id or by email).
drop policy if exists studio_brief_drafts_select on public.studio_brief_drafts;
create policy studio_brief_drafts_select on public.studio_brief_drafts
for select using (
  public.studio_is_staff()
  or user_id = auth.uid()
  or (
    normalized_email is not null
    and normalized_email = public.studio_auth_email()
  )
);

-- Staff can see all drafts for moderation and quality review.
drop policy if exists studio_brief_drafts_staff_select on public.studio_brief_drafts;
create policy studio_brief_drafts_staff_select on public.studio_brief_drafts
for select using (public.studio_is_staff());

-- Inserts always go through the server action which uses the admin
-- client. Block direct anon inserts at the RLS layer to keep the surface
-- narrow.
drop policy if exists studio_brief_drafts_staff_write on public.studio_brief_drafts;
create policy studio_brief_drafts_staff_write on public.studio_brief_drafts
for all using (public.studio_is_staff())
with check (public.studio_is_staff());
