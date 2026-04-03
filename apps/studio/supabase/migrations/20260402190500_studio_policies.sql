alter table public.studio_role_memberships enable row level security;
alter table public.studio_services enable row level security;
alter table public.studio_packages enable row level security;
alter table public.studio_team_profiles enable row level security;
alter table public.studio_settings enable row level security;
alter table public.studio_leads enable row level security;
alter table public.studio_briefs enable row level security;
alter table public.studio_brief_files enable row level security;
alter table public.studio_proposals enable row level security;
alter table public.studio_proposal_milestones enable row level security;
alter table public.studio_projects enable row level security;
alter table public.studio_project_assignments enable row level security;
alter table public.studio_project_milestones enable row level security;
alter table public.studio_revisions enable row level security;
alter table public.studio_project_files enable row level security;
alter table public.studio_deliverables enable row level security;
alter table public.studio_project_messages enable row level security;
alter table public.studio_payments enable row level security;
alter table public.studio_notifications enable row level security;
alter table public.studio_reviews enable row level security;

drop policy if exists studio_member_roles on public.studio_role_memberships;
create policy studio_member_roles on public.studio_role_memberships
for select using (
  user_id = auth.uid()
  or (
    normalized_email is not null
    and normalized_email = public.studio_auth_email()
  )
);

drop policy if exists studio_public_services on public.studio_services;
create policy studio_public_services on public.studio_services
for select using (is_published = true);

drop policy if exists studio_public_packages on public.studio_packages;
create policy studio_public_packages on public.studio_packages
for select using (is_published = true);

drop policy if exists studio_public_team_profiles on public.studio_team_profiles;
create policy studio_public_team_profiles on public.studio_team_profiles
for select using (is_published = true);

drop policy if exists studio_public_reviews on public.studio_reviews;
create policy studio_public_reviews on public.studio_reviews
for select using (published = true);

drop policy if exists studio_staff_settings on public.studio_settings;
create policy studio_staff_settings on public.studio_settings
for select using (public.studio_is_staff());

drop policy if exists studio_member_leads on public.studio_leads;
create policy studio_member_leads on public.studio_leads
for select using (
  public.studio_is_staff()
  or user_id = auth.uid()
  or (
    normalized_email is not null
    and normalized_email = public.studio_auth_email()
  )
);

drop policy if exists studio_member_briefs on public.studio_briefs;
create policy studio_member_briefs on public.studio_briefs
for select using (
  public.studio_is_staff()
  or exists (
    select 1
    from public.studio_leads lead
    where lead.id = studio_briefs.lead_id
      and (
        lead.user_id = auth.uid()
        or (
          lead.normalized_email is not null
          and lead.normalized_email = public.studio_auth_email()
        )
      )
  )
);

drop policy if exists studio_member_brief_files on public.studio_brief_files;
create policy studio_member_brief_files on public.studio_brief_files
for select using (
  public.studio_is_staff()
  or exists (
    select 1
    from public.studio_leads lead
    where lead.id = studio_brief_files.lead_id
      and (
        lead.user_id = auth.uid()
        or (
          lead.normalized_email is not null
          and lead.normalized_email = public.studio_auth_email()
        )
      )
  )
);

drop policy if exists studio_member_proposals on public.studio_proposals;
create policy studio_member_proposals on public.studio_proposals
for select using (
  public.studio_is_staff()
  or exists (
    select 1
    from public.studio_leads lead
    where lead.id = studio_proposals.lead_id
      and (
        lead.user_id = auth.uid()
        or (
          lead.normalized_email is not null
          and lead.normalized_email = public.studio_auth_email()
        )
      )
  )
);

drop policy if exists studio_member_proposal_milestones on public.studio_proposal_milestones;
create policy studio_member_proposal_milestones on public.studio_proposal_milestones
for select using (
  public.studio_is_staff()
  or exists (
    select 1
    from public.studio_proposals proposal
    join public.studio_leads lead on lead.id = proposal.lead_id
    where proposal.id = studio_proposal_milestones.proposal_id
      and (
        lead.user_id = auth.uid()
        or (
          lead.normalized_email is not null
          and lead.normalized_email = public.studio_auth_email()
        )
      )
  )
);

drop policy if exists studio_member_projects on public.studio_projects;
create policy studio_member_projects on public.studio_projects
for select using (
  public.studio_is_staff()
  or client_user_id = auth.uid()
  or (
    normalized_email is not null
    and normalized_email = public.studio_auth_email()
  )
);

drop policy if exists studio_member_project_assignments on public.studio_project_assignments;
create policy studio_member_project_assignments on public.studio_project_assignments
for select using (
  public.studio_is_staff()
  or exists (
    select 1
    from public.studio_projects project
    where project.id = studio_project_assignments.project_id
      and (
        project.client_user_id = auth.uid()
        or (
          project.normalized_email is not null
          and project.normalized_email = public.studio_auth_email()
        )
      )
  )
);

drop policy if exists studio_member_project_milestones on public.studio_project_milestones;
create policy studio_member_project_milestones on public.studio_project_milestones
for select using (
  public.studio_is_staff()
  or exists (
    select 1
    from public.studio_projects project
    where project.id = studio_project_milestones.project_id
      and (
        project.client_user_id = auth.uid()
        or (
          project.normalized_email is not null
          and project.normalized_email = public.studio_auth_email()
        )
      )
  )
);

drop policy if exists studio_member_revisions on public.studio_revisions;
create policy studio_member_revisions on public.studio_revisions
for select using (
  public.studio_is_staff()
  or exists (
    select 1
    from public.studio_projects project
    where project.id = studio_revisions.project_id
      and (
        project.client_user_id = auth.uid()
        or (
          project.normalized_email is not null
          and project.normalized_email = public.studio_auth_email()
        )
      )
  )
);

drop policy if exists studio_member_project_files on public.studio_project_files;
create policy studio_member_project_files on public.studio_project_files
for select using (
  public.studio_is_staff()
  or exists (
    select 1
    from public.studio_projects project
    where project.id = studio_project_files.project_id
      and (
        project.client_user_id = auth.uid()
        or (
          project.normalized_email is not null
          and project.normalized_email = public.studio_auth_email()
        )
      )
  )
  or exists (
    select 1
    from public.studio_leads lead
    where lead.id = studio_project_files.lead_id
      and (
        lead.user_id = auth.uid()
        or (
          lead.normalized_email is not null
          and lead.normalized_email = public.studio_auth_email()
        )
      )
  )
);

drop policy if exists studio_member_deliverables on public.studio_deliverables;
create policy studio_member_deliverables on public.studio_deliverables
for select using (
  public.studio_is_staff()
  or exists (
    select 1
    from public.studio_projects project
    where project.id = studio_deliverables.project_id
      and (
        project.client_user_id = auth.uid()
        or (
          project.normalized_email is not null
          and project.normalized_email = public.studio_auth_email()
        )
      )
  )
);

drop policy if exists studio_member_project_messages on public.studio_project_messages;
create policy studio_member_project_messages on public.studio_project_messages
for select using (
  public.studio_is_staff()
  or (
    is_internal = false
    and exists (
      select 1
      from public.studio_projects project
      where project.id = studio_project_messages.project_id
        and (
          project.client_user_id = auth.uid()
          or (
            project.normalized_email is not null
            and project.normalized_email = public.studio_auth_email()
          )
        )
    )
  )
);

drop policy if exists studio_member_payments on public.studio_payments;
create policy studio_member_payments on public.studio_payments
for select using (
  public.studio_is_staff()
  or exists (
    select 1
    from public.studio_projects project
    where project.id = studio_payments.project_id
      and (
        project.client_user_id = auth.uid()
        or (
          project.normalized_email is not null
          and project.normalized_email = public.studio_auth_email()
        )
      )
  )
);

drop policy if exists studio_member_notifications on public.studio_notifications;
create policy studio_member_notifications on public.studio_notifications
for select using (
  public.studio_is_staff()
  or user_id = auth.uid()
  or (
    normalized_email is not null
    and normalized_email = public.studio_auth_email()
  )
);
