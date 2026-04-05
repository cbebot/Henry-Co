-- Launch / domain preferences captured at brief time (advisory + ops handoff)
alter table public.studio_briefs
  add column if not exists domain_intent jsonb not null default '{}'::jsonb;

comment on column public.studio_briefs.domain_intent is
  'Client domain preferences: desired name, check status, suggestions shown, bring-own-domain flag.';
