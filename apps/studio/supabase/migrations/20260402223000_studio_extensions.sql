create table if not exists public.studio_custom_requests (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.studio_leads(id) on delete cascade,
  project_type text not null,
  platform_preference text not null,
  design_direction text not null,
  page_requirements text[] not null default '{}',
  addon_services text[] not null default '{}',
  inspiration_summary text not null default '',
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.studio_project_updates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.studio_projects(id) on delete cascade,
  kind text not null,
  title text not null,
  summary text not null,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.studio_custom_requests enable row level security;
alter table public.studio_project_updates enable row level security;

drop policy if exists studio_member_custom_requests on public.studio_custom_requests;
create policy studio_member_custom_requests on public.studio_custom_requests
for select using (
  public.studio_is_staff()
  or exists (
    select 1
    from public.studio_leads lead
    where lead.id = studio_custom_requests.lead_id
      and (
        lead.user_id = auth.uid()
        or (
          lead.normalized_email is not null
          and lead.normalized_email = public.studio_auth_email()
        )
      )
  )
);

drop policy if exists studio_member_project_updates on public.studio_project_updates;
create policy studio_member_project_updates on public.studio_project_updates
for select using (
  public.studio_is_staff()
  or exists (
    select 1
    from public.studio_projects project
    where project.id = studio_project_updates.project_id
      and (
        project.client_user_id = auth.uid()
        or (
          project.normalized_email is not null
          and project.normalized_email = public.studio_auth_email()
        )
      )
  )
);
