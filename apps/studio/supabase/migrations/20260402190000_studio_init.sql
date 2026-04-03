create extension if not exists pgcrypto;

create or replace function public.studio_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.studio_auth_email()
returns text
language sql
stable
as $$
  select nullif(lower(coalesce(auth.jwt() ->> 'email', '')), '');
$$;

create or replace function public.studio_is_staff()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.studio_role_memberships membership
    where membership.is_active = true
      and (
        membership.user_id = auth.uid()
        or (
          membership.normalized_email is not null
          and membership.normalized_email = public.studio_auth_email()
        )
      )
  );
$$;

create table if not exists public.studio_role_memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  normalized_email text,
  scope_type text not null default 'platform',
  scope_id uuid,
  role text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.studio_services (
  id text primary key,
  slug text not null unique,
  kind text not null,
  name text not null,
  headline text not null,
  summary text not null,
  starting_price integer not null default 0,
  delivery_window text not null,
  stack text[] not null default '{}',
  outcomes text[] not null default '{}',
  score_boosts text[] not null default '{}',
  is_published boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.studio_packages (
  id text primary key,
  service_id text not null references public.studio_services(id) on delete cascade,
  slug text not null unique,
  name text not null,
  summary text not null,
  price integer not null default 0,
  deposit_rate numeric(5,2) not null default 0.40,
  timeline_weeks integer not null default 1,
  best_for text not null,
  includes text[] not null default '{}',
  is_published boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.studio_team_profiles (
  id text primary key,
  slug text not null unique,
  name text not null,
  label text not null,
  summary text not null,
  availability text not null default 'open',
  focus text[] not null default '{}',
  industries text[] not null default '{}',
  stack text[] not null default '{}',
  highlights text[] not null default '{}',
  score_biases text[] not null default '{}',
  is_published boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.studio_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.studio_leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  normalized_email text,
  customer_name text not null,
  company_name text,
  phone text,
  service_kind text not null,
  status text not null default 'new',
  readiness_score integer not null default 0,
  business_type text not null,
  budget_band text not null,
  urgency text not null,
  requested_package_id text references public.studio_packages(id) on delete set null,
  preferred_team_id text references public.studio_team_profiles(id) on delete set null,
  matched_team_id text references public.studio_team_profiles(id) on delete set null,
  deposit_requested boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.studio_briefs (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.studio_leads(id) on delete cascade,
  goals text not null,
  scope_notes text not null,
  business_type text not null,
  budget_band text not null,
  urgency text not null,
  timeline text not null,
  package_intent text not null default 'custom',
  tech_preferences text[] not null default '{}',
  required_features text[] not null default '{}',
  reference_links text[] not null default '{}',
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.studio_brief_files (
  id uuid primary key default gen_random_uuid(),
  brief_id uuid not null references public.studio_briefs(id) on delete cascade,
  lead_id uuid references public.studio_leads(id) on delete cascade,
  label text not null,
  path text not null,
  bucket text not null,
  size bigint,
  mime_type text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.studio_proposals (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.studio_leads(id) on delete cascade,
  access_token_hash text not null,
  access_token_hint text,
  status text not null default 'draft',
  title text not null,
  summary text not null,
  investment integer not null default 0,
  deposit_amount integer not null default 0,
  currency text not null default 'NGN',
  valid_until timestamptz not null,
  team_id text references public.studio_team_profiles(id) on delete set null,
  service_id text not null references public.studio_services(id) on delete restrict,
  package_id text references public.studio_packages(id) on delete set null,
  scope_bullets text[] not null default '{}',
  comparison_notes text[] not null default '{}',
  proposal_options jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.studio_proposal_milestones (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.studio_proposals(id) on delete cascade,
  name text not null,
  amount integer not null default 0,
  description text not null,
  due_label text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.studio_projects (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.studio_proposals(id) on delete cascade,
  lead_id uuid not null references public.studio_leads(id) on delete cascade,
  access_token_hash text not null,
  access_token_hint text,
  client_user_id uuid references auth.users(id) on delete set null,
  normalized_email text,
  status text not null default 'pending_deposit',
  title text not null,
  summary text not null,
  next_action text not null,
  service_id text not null references public.studio_services(id) on delete restrict,
  package_id text references public.studio_packages(id) on delete set null,
  team_id text references public.studio_team_profiles(id) on delete set null,
  confidence integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.studio_project_assignments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.studio_projects(id) on delete cascade,
  team_id text references public.studio_team_profiles(id) on delete set null,
  role text not null,
  label text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.studio_project_milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.studio_projects(id) on delete cascade,
  name text not null,
  description text not null,
  due_label text not null,
  amount integer not null default 0,
  status text not null default 'planned',
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.studio_revisions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.studio_projects(id) on delete cascade,
  requested_by text not null,
  summary text not null,
  status text not null default 'open',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.studio_project_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.studio_projects(id) on delete cascade,
  lead_id uuid references public.studio_leads(id) on delete cascade,
  brief_id uuid references public.studio_briefs(id) on delete cascade,
  kind text not null,
  label text not null,
  path text not null,
  bucket text not null,
  size bigint,
  mime_type text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.studio_deliverables (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.studio_projects(id) on delete cascade,
  label text not null,
  summary text not null,
  file_ids uuid[] not null default '{}',
  status text not null default 'shared',
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.studio_project_messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.studio_projects(id) on delete cascade,
  sender text not null,
  sender_role text not null,
  body text not null,
  is_internal boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.studio_payments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.studio_projects(id) on delete cascade,
  milestone_id uuid references public.studio_project_milestones(id) on delete set null,
  label text not null,
  amount integer not null default 0,
  currency text not null default 'NGN',
  status text not null default 'requested',
  due_date timestamptz,
  method text not null default 'bank_transfer',
  proof_url text,
  proof_name text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.studio_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  normalized_email text,
  entity_type text,
  entity_id text,
  channel text not null,
  template_key text not null,
  recipient text not null,
  subject text not null,
  status text not null default 'queued',
  reason text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.studio_reviews (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.studio_projects(id) on delete cascade,
  customer_name text not null,
  rating integer not null default 5,
  quote text not null,
  company text,
  published boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists studio_role_memberships_user_idx on public.studio_role_memberships(user_id);
create index if not exists studio_role_memberships_email_idx on public.studio_role_memberships(normalized_email);
create index if not exists studio_leads_user_idx on public.studio_leads(user_id);
create index if not exists studio_leads_email_idx on public.studio_leads(normalized_email);
create index if not exists studio_projects_user_idx on public.studio_projects(client_user_id);
create index if not exists studio_projects_email_idx on public.studio_projects(normalized_email);
create index if not exists studio_payments_project_idx on public.studio_payments(project_id);
create index if not exists studio_notifications_user_idx on public.studio_notifications(user_id);
create index if not exists studio_notifications_email_idx on public.studio_notifications(normalized_email);

drop trigger if exists studio_role_memberships_updated_at on public.studio_role_memberships;
create trigger studio_role_memberships_updated_at before update on public.studio_role_memberships
for each row execute function public.studio_set_updated_at();

drop trigger if exists studio_services_updated_at on public.studio_services;
create trigger studio_services_updated_at before update on public.studio_services
for each row execute function public.studio_set_updated_at();

drop trigger if exists studio_packages_updated_at on public.studio_packages;
create trigger studio_packages_updated_at before update on public.studio_packages
for each row execute function public.studio_set_updated_at();

drop trigger if exists studio_team_profiles_updated_at on public.studio_team_profiles;
create trigger studio_team_profiles_updated_at before update on public.studio_team_profiles
for each row execute function public.studio_set_updated_at();

drop trigger if exists studio_settings_updated_at on public.studio_settings;
create trigger studio_settings_updated_at before update on public.studio_settings
for each row execute function public.studio_set_updated_at();

drop trigger if exists studio_leads_updated_at on public.studio_leads;
create trigger studio_leads_updated_at before update on public.studio_leads
for each row execute function public.studio_set_updated_at();

drop trigger if exists studio_proposals_updated_at on public.studio_proposals;
create trigger studio_proposals_updated_at before update on public.studio_proposals
for each row execute function public.studio_set_updated_at();

drop trigger if exists studio_projects_updated_at on public.studio_projects;
create trigger studio_projects_updated_at before update on public.studio_projects
for each row execute function public.studio_set_updated_at();

drop trigger if exists studio_project_milestones_updated_at on public.studio_project_milestones;
create trigger studio_project_milestones_updated_at before update on public.studio_project_milestones
for each row execute function public.studio_set_updated_at();

drop trigger if exists studio_revisions_updated_at on public.studio_revisions;
create trigger studio_revisions_updated_at before update on public.studio_revisions
for each row execute function public.studio_set_updated_at();

drop trigger if exists studio_payments_updated_at on public.studio_payments;
create trigger studio_payments_updated_at before update on public.studio_payments
for each row execute function public.studio_set_updated_at();

insert into public.studio_settings (key, value)
values
  (
    'platform',
    jsonb_build_object(
      'currency', 'NGN',
      'support_email', 'studio@henrycogroup.com',
      'support_phone', '+2349133957084',
      'whatsapp_default_template_name', 'studio_update',
      'whatsapp_default_template_language', 'en_US'
    )
  )
on conflict (key) do nothing;
