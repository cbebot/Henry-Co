-- Bring legacy Studio tables up to the repository schema before applying
-- the client portal, messaging, and payment migrations. Existing production
-- rows are preserved; missing columns are added and backfilled from the
-- older generic fields where possible.

create extension if not exists pgcrypto;

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

create table if not exists public.studio_brief_files (
  id uuid primary key default gen_random_uuid(),
  brief_id uuid references public.studio_briefs(id) on delete cascade,
  lead_id uuid references public.studio_leads(id) on delete cascade,
  label text not null default 'Brief file',
  path text not null default '',
  bucket text not null default 'studio',
  size bigint,
  mime_type text,
  created_at timestamptz not null default timezone('utc', now())
);

-- Legacy-column shims keep this migration portable: fresh environments
-- created from the repository schema do not have the older dashboard field
-- names, while the linked production database does.
alter table public.studio_leads
  add column if not exists full_name text,
  add column if not exists email text,
  add column if not exists service_type text,
  add column if not exists budget_min bigint,
  add column if not exists budget_max bigint,
  add column if not exists timeline text,
  add column if not exists metadata jsonb default '{}'::jsonb;

alter table public.studio_briefs
  add column if not exists title text,
  add column if not exists description text,
  add column if not exists objectives text,
  add column if not exists budget text,
  add column if not exists notes text,
  add column if not exists metadata jsonb default '{}'::jsonb,
  add column if not exists updated_at timestamptz default timezone('utc', now());

alter table public.studio_proposals
  add column if not exists brief_id uuid,
  add column if not exists user_id uuid references auth.users(id) on delete set null,
  add column if not exists description text,
  add column if not exists price_kobo bigint,
  add column if not exists metadata jsonb default '{}'::jsonb;

alter table public.studio_proposal_milestones
  add column if not exists title text,
  add column if not exists due_date date,
  add column if not exists amount_kobo bigint;

alter table public.studio_projects
  add column if not exists user_id uuid references auth.users(id) on delete set null,
  add column if not exists description text,
  add column if not exists end_date date,
  add column if not exists budget_kobo bigint,
  add column if not exists metadata jsonb default '{}'::jsonb;

alter table public.studio_project_milestones
  add column if not exists title text,
  add column if not exists amount_kobo bigint;

alter table public.studio_revisions
  add column if not exists deliverable_id uuid,
  add column if not exists notes text;

alter table public.studio_project_files
  add column if not exists name text,
  add column if not exists type text,
  add column if not exists file_url text,
  add column if not exists file_size bigint;

alter table public.studio_deliverables
  add column if not exists title text,
  add column if not exists description text;

alter table public.studio_project_messages
  add column if not exists sender_type text;

alter table public.studio_project_updates
  add column if not exists description text;

alter table public.studio_payments
  add column if not exists user_id uuid references auth.users(id) on delete set null,
  add column if not exists payment_method text,
  add column if not exists reference text,
  add column if not exists amount_kobo bigint,
  add column if not exists metadata jsonb default '{}'::jsonb;

alter table public.studio_notifications
  add column if not exists title text,
  add column if not exists is_read boolean default false;

alter table public.studio_reviews
  add column if not exists user_id uuid references auth.users(id) on delete set null,
  add column if not exists feedback text,
  add column if not exists metadata jsonb default '{}'::jsonb;

alter table public.studio_custom_requests
  add column if not exists brief_id uuid,
  add column if not exists user_id uuid references auth.users(id) on delete set null,
  add column if not exists title text,
  add column if not exists description text,
  add column if not exists metadata jsonb default '{}'::jsonb;

alter table public.studio_role_memberships
  add column if not exists updated_at timestamptz default timezone('utc', now());

alter table public.studio_leads
  add column if not exists customer_name text,
  add column if not exists company_name text,
  add column if not exists service_kind text,
  add column if not exists readiness_score integer default 0,
  add column if not exists business_type text,
  add column if not exists budget_band text,
  add column if not exists urgency text,
  add column if not exists requested_package_id text references public.studio_packages(id) on delete set null,
  add column if not exists preferred_team_id text references public.studio_team_profiles(id) on delete set null,
  add column if not exists matched_team_id text references public.studio_team_profiles(id) on delete set null,
  add column if not exists deposit_requested boolean default false;

update public.studio_leads
set
  customer_name = coalesce(nullif(customer_name, ''), nullif(full_name, ''), nullif(email, ''), 'Studio client'),
  company_name = coalesce(nullif(company_name, ''), nullif((metadata ->> 'company_name'), '')),
  service_kind = coalesce(nullif(service_kind, ''), nullif(service_type, ''), 'custom'),
  readiness_score = coalesce(readiness_score, 0),
  business_type = coalesce(nullif(business_type, ''), nullif((metadata ->> 'business_type'), ''), 'general'),
  budget_band = coalesce(
    nullif(budget_band, ''),
    nullif((metadata ->> 'budget_band'), ''),
    case
      when budget_min is not null or budget_max is not null then concat_ws('-', budget_min::text, budget_max::text)
      else null
    end,
    'to_scope'
  ),
  urgency = coalesce(nullif(urgency, ''), nullif(timeline, ''), 'standard'),
  deposit_requested = coalesce(deposit_requested, false)
where customer_name is null
   or customer_name = ''
   or service_kind is null
   or service_kind = ''
   or readiness_score is null
   or business_type is null
   or business_type = ''
   or budget_band is null
   or budget_band = ''
   or urgency is null
   or urgency = ''
   or deposit_requested is null;

alter table public.studio_briefs
  add column if not exists goals text,
  add column if not exists scope_notes text,
  add column if not exists business_type text,
  add column if not exists budget_band text,
  add column if not exists urgency text,
  add column if not exists package_intent text default 'custom',
  add column if not exists tech_preferences text[] default '{}',
  add column if not exists required_features text[] default '{}',
  add column if not exists reference_links text[] default '{}';

update public.studio_briefs
set
  goals = coalesce(nullif(goals, ''), nullif(objectives, ''), nullif(title, ''), nullif(description, ''), 'Studio brief'),
  scope_notes = coalesce(nullif(scope_notes, ''), nullif(description, ''), nullif(notes, ''), 'Scope to be confirmed'),
  business_type = coalesce(nullif(business_type, ''), nullif((metadata ->> 'business_type'), ''), 'general'),
  budget_band = coalesce(nullif(budget_band, ''), nullif(budget, ''), nullif((metadata ->> 'budget_band'), ''), 'to_scope'),
  urgency = coalesce(nullif(urgency, ''), nullif(timeline, ''), 'standard'),
  package_intent = coalesce(nullif(package_intent, ''), 'custom'),
  tech_preferences = coalesce(tech_preferences, '{}'),
  required_features = coalesce(required_features, '{}'),
  reference_links = coalesce(reference_links, '{}')
where goals is null
   or goals = ''
   or scope_notes is null
   or scope_notes = ''
   or business_type is null
   or business_type = ''
   or budget_band is null
   or budget_band = ''
   or urgency is null
   or urgency = ''
   or package_intent is null
   or package_intent = ''
   or tech_preferences is null
   or required_features is null
   or reference_links is null;

alter table public.studio_proposals
  add column if not exists lead_id uuid references public.studio_leads(id) on delete cascade,
  add column if not exists access_token_hash text,
  add column if not exists access_token_hint text,
  add column if not exists summary text,
  add column if not exists investment integer default 0,
  add column if not exists deposit_amount integer default 0,
  add column if not exists currency text default 'NGN',
  add column if not exists valid_until timestamptz,
  add column if not exists team_id text references public.studio_team_profiles(id) on delete set null,
  add column if not exists service_id text references public.studio_services(id) on delete restrict,
  add column if not exists package_id text references public.studio_packages(id) on delete set null,
  add column if not exists scope_bullets text[] default '{}',
  add column if not exists comparison_notes text[] default '{}',
  add column if not exists proposal_options jsonb default '[]'::jsonb;

update public.studio_proposals proposal
set lead_id = brief.lead_id
from public.studio_briefs brief
where proposal.lead_id is null
  and proposal.brief_id = brief.id;

update public.studio_proposals
set
  summary = coalesce(nullif(summary, ''), nullif(description, ''), nullif(title, ''), 'Studio proposal'),
  investment = coalesce(investment, greatest(0, round(coalesce(price_kobo, 0)::numeric / 100)::integer)),
  deposit_amount = coalesce(deposit_amount, 0),
  currency = coalesce(nullif(currency, ''), 'NGN'),
  valid_until = coalesce(valid_until, timezone('utc', now()) + interval '14 days'),
  scope_bullets = coalesce(scope_bullets, '{}'),
  comparison_notes = coalesce(comparison_notes, '{}'),
  proposal_options = coalesce(proposal_options, '[]'::jsonb)
where summary is null
   or summary = ''
   or investment is null
   or deposit_amount is null
   or currency is null
   or currency = ''
   or valid_until is null
   or scope_bullets is null
   or comparison_notes is null
   or proposal_options is null;

alter table public.studio_proposal_milestones
  add column if not exists name text,
  add column if not exists amount integer default 0,
  add column if not exists due_label text,
  add column if not exists sort_order integer default 0,
  add column if not exists created_at timestamptz default timezone('utc', now());

update public.studio_proposal_milestones
set
  name = coalesce(nullif(name, ''), nullif(title, ''), 'Proposal milestone'),
  amount = coalesce(amount, greatest(0, round(coalesce(amount_kobo, 0)::numeric / 100)::integer)),
  due_label = coalesce(nullif(due_label, ''), due_date::text, 'To be scheduled'),
  sort_order = coalesce(sort_order, 0),
  created_at = coalesce(created_at, timezone('utc', now()))
where name is null
   or name = ''
   or amount is null
   or due_label is null
   or due_label = ''
   or sort_order is null
   or created_at is null;

alter table public.studio_projects
  add column if not exists lead_id uuid references public.studio_leads(id) on delete cascade,
  add column if not exists access_token_hash text,
  add column if not exists access_token_hint text,
  add column if not exists client_user_id uuid references auth.users(id) on delete set null,
  add column if not exists normalized_email text,
  add column if not exists summary text,
  add column if not exists next_action text,
  add column if not exists service_id text references public.studio_services(id) on delete restrict,
  add column if not exists package_id text references public.studio_packages(id) on delete set null,
  add column if not exists team_id text references public.studio_team_profiles(id) on delete set null,
  add column if not exists confidence integer default 0,
  add column if not exists brief text,
  add column if not exists project_type text,
  add column if not exists estimated_completion date,
  add column if not exists actual_completion date,
  add column if not exists team_lead_id uuid references auth.users(id) on delete set null;

update public.studio_projects project
set lead_id = proposal.lead_id
from public.studio_proposals proposal
where project.lead_id is null
  and project.proposal_id = proposal.id;

update public.studio_projects
set
  client_user_id = coalesce(client_user_id, user_id),
  summary = coalesce(nullif(summary, ''), nullif(description, ''), nullif(title, ''), 'Studio project'),
  next_action = coalesce(nullif(next_action, ''), 'Review the workspace and latest project updates.'),
  confidence = coalesce(confidence, 0),
  brief = coalesce(nullif(brief, ''), nullif(description, ''), nullif((metadata ->> 'brief'), '')),
  project_type = coalesce(nullif(project_type, ''), nullif((metadata ->> 'project_type'), ''), 'studio_project'),
  estimated_completion = coalesce(estimated_completion, end_date)
where client_user_id is null
   or summary is null
   or summary = ''
   or next_action is null
   or next_action = ''
   or confidence is null
   or brief is null
   or brief = ''
   or project_type is null
   or project_type = ''
   or estimated_completion is null;

alter table public.studio_project_assignments
  add column if not exists team_id text references public.studio_team_profiles(id) on delete set null,
  add column if not exists label text,
  add column if not exists created_at timestamptz default timezone('utc', now());

update public.studio_project_assignments
set
  label = coalesce(nullif(label, ''), nullif(role, ''), 'Studio team'),
  created_at = coalesce(created_at, timezone('utc', now()))
where label is null
   or label = ''
   or created_at is null;

alter table public.studio_project_milestones
  add column if not exists name text,
  add column if not exists due_label text,
  add column if not exists amount integer default 0,
  add column if not exists status text default 'planned',
  add column if not exists sort_order integer default 0,
  add column if not exists order_index integer default 0,
  add column if not exists currency text default 'NGN',
  add column if not exists created_at timestamptz default timezone('utc', now()),
  add column if not exists updated_at timestamptz default timezone('utc', now());

update public.studio_project_milestones
set
  name = coalesce(nullif(name, ''), nullif(title, ''), 'Project milestone'),
  due_label = coalesce(nullif(due_label, ''), due_date::text, 'To be scheduled'),
  amount = coalesce(amount, greatest(0, round(coalesce(amount_kobo, 0)::numeric / 100)::integer)),
  status = coalesce(nullif(status, ''), 'planned'),
  sort_order = coalesce(sort_order, order_index, 0),
  order_index = coalesce(order_index, sort_order, 0),
  currency = coalesce(nullif(currency, ''), 'NGN'),
  created_at = coalesce(created_at, timezone('utc', now())),
  updated_at = coalesce(updated_at, created_at, timezone('utc', now()))
where name is null
   or name = ''
   or due_label is null
   or due_label = ''
   or amount is null
   or status is null
   or status = ''
   or sort_order is null
   or order_index is null
   or currency is null
   or currency = ''
   or created_at is null
   or updated_at is null;

alter table public.studio_revisions
  add column if not exists project_id uuid references public.studio_projects(id) on delete cascade,
  add column if not exists summary text,
  add column if not exists updated_at timestamptz default timezone('utc', now());

update public.studio_revisions revision
set project_id = deliverable.project_id
from public.studio_deliverables deliverable
where revision.project_id is null
  and revision.deliverable_id = deliverable.id;

update public.studio_revisions
set
  summary = coalesce(nullif(summary, ''), nullif(notes, ''), 'Revision request'),
  updated_at = coalesce(updated_at, created_at, timezone('utc', now()))
where summary is null
   or summary = ''
   or updated_at is null;

alter table public.studio_project_files
  add column if not exists lead_id uuid references public.studio_leads(id) on delete cascade,
  add column if not exists brief_id uuid references public.studio_briefs(id) on delete cascade,
  add column if not exists kind text,
  add column if not exists label text,
  add column if not exists path text,
  add column if not exists bucket text default 'studio',
  add column if not exists size bigint,
  add column if not exists created_at timestamptz default timezone('utc', now());

update public.studio_project_files
set
  kind = coalesce(nullif(kind, ''), nullif(type, ''), 'file'),
  label = coalesce(nullif(label, ''), nullif(name, ''), 'Project file'),
  path = coalesce(nullif(path, ''), nullif(file_url, ''), ''),
  bucket = coalesce(nullif(bucket, ''), 'studio'),
  size = coalesce(size, file_size),
  created_at = coalesce(created_at, timezone('utc', now()))
where kind is null
   or kind = ''
   or label is null
   or label = ''
   or path is null
   or bucket is null
   or bucket = ''
   or size is null
   or created_at is null;

alter table public.studio_deliverables
  add column if not exists label text,
  add column if not exists summary text,
  add column if not exists file_ids uuid[] default '{}',
  add column if not exists milestone_id uuid references public.studio_project_milestones(id) on delete set null,
  add column if not exists file_url text,
  add column if not exists file_public_id text,
  add column if not exists file_type text,
  add column if not exists thumbnail_url text,
  add column if not exists version integer default 1,
  add column if not exists shared_at timestamptz default timezone('utc', now()),
  add column if not exists approved_at timestamptz,
  add column if not exists approved_by uuid references auth.users(id) on delete set null,
  add column if not exists uploaded_by uuid references auth.users(id) on delete set null;

update public.studio_deliverables
set
  label = coalesce(nullif(label, ''), nullif(title, ''), 'Studio deliverable'),
  summary = coalesce(nullif(summary, ''), nullif(description, ''), 'Deliverable shared for review'),
  file_ids = coalesce(file_ids, '{}'),
  version = coalesce(version, 1),
  shared_at = coalesce(shared_at, created_at, timezone('utc', now()))
where label is null
   or label = ''
   or summary is null
   or summary = ''
   or file_ids is null
   or version is null
   or shared_at is null;

alter table public.studio_project_messages
  add column if not exists sender text,
  add column if not exists sender_role text,
  add column if not exists is_internal boolean default false,
  add column if not exists read_by jsonb default '[]'::jsonb,
  add column if not exists edited_at timestamptz;

update public.studio_project_messages
set
  sender = coalesce(nullif(sender, ''), nullif(sender_type, ''), 'Studio participant'),
  sender_role = coalesce(nullif(sender_role, ''), nullif(sender_type, ''), 'client'),
  is_internal = coalesce(is_internal, false),
  read_by = coalesce(read_by, '[]'::jsonb)
where sender is null
   or sender = ''
   or sender_role is null
   or sender_role = ''
   or is_internal is null
   or read_by is null;

alter table public.studio_project_updates
  add column if not exists author_id uuid references auth.users(id) on delete set null,
  add column if not exists body text,
  add column if not exists update_type text;

update public.studio_project_updates
set
  kind = coalesce(nullif(kind, ''), 'note'),
  summary = coalesce(nullif(summary, ''), nullif(description, ''), nullif(title, ''), 'Project update'),
  body = coalesce(nullif(body, ''), nullif(description, ''), nullif(summary, '')),
  update_type = coalesce(nullif(update_type, ''), nullif(kind, ''), 'note'),
  metadata = coalesce(metadata, '{}'::jsonb)
where kind is null
   or kind = ''
   or summary is null
   or summary = ''
   or body is null
   or body = ''
   or update_type is null
   or update_type = ''
   or metadata is null;

alter table public.studio_project_updates
  alter column metadata set default '{}'::jsonb;

alter table public.studio_payments
  add column if not exists milestone_id uuid references public.studio_project_milestones(id) on delete set null,
  add column if not exists label text,
  add column if not exists amount integer default 0,
  add column if not exists due_date timestamptz,
  add column if not exists method text default 'bank_transfer',
  add column if not exists proof_url text,
  add column if not exists proof_name text;

update public.studio_payments
set
  label = coalesce(nullif(label, ''), nullif(reference, ''), 'Studio payment'),
  amount = coalesce(amount, greatest(0, round(coalesce(amount_kobo, 0)::numeric / 100)::integer)),
  currency = coalesce(nullif(currency, ''), 'NGN'),
  method = coalesce(nullif(method, ''), nullif(payment_method, ''), 'bank_transfer')
where label is null
   or label = ''
   or amount is null
   or currency is null
   or currency = ''
   or method is null
   or method = '';

alter table public.studio_notifications
  add column if not exists normalized_email text,
  add column if not exists entity_type text,
  add column if not exists entity_id text,
  add column if not exists channel text default 'in_app',
  add column if not exists template_key text default 'studio_notification',
  add column if not exists recipient text,
  add column if not exists subject text,
  add column if not exists status text default 'queued',
  add column if not exists reason text,
  add column if not exists payload jsonb default '{}'::jsonb;

update public.studio_notifications
set
  channel = coalesce(nullif(channel, ''), 'in_app'),
  template_key = coalesce(nullif(template_key, ''), 'studio_notification'),
  recipient = coalesce(nullif(recipient, ''), normalized_email, ''),
  subject = coalesce(nullif(subject, ''), nullif(title, ''), 'Studio notification'),
  status = coalesce(nullif(status, ''), case when is_read then 'sent' else 'queued' end, 'queued'),
  payload = coalesce(payload, '{}'::jsonb)
where channel is null
   or channel = ''
   or template_key is null
   or template_key = ''
   or recipient is null
   or subject is null
   or subject = ''
   or status is null
   or status = ''
   or payload is null;

alter table public.studio_reviews
  add column if not exists project_id uuid references public.studio_projects(id) on delete cascade,
  add column if not exists customer_name text,
  add column if not exists quote text,
  add column if not exists company text,
  add column if not exists published boolean default false;

update public.studio_reviews
set
  customer_name = coalesce(nullif(customer_name, ''), 'Studio client'),
  quote = coalesce(nullif(quote, ''), nullif(feedback, ''), 'Studio review'),
  published = coalesce(published, false)
where customer_name is null
   or customer_name = ''
   or quote is null
   or quote = ''
   or published is null;

alter table public.studio_custom_requests
  add column if not exists lead_id uuid references public.studio_leads(id) on delete cascade,
  add column if not exists project_type text,
  add column if not exists platform_preference text,
  add column if not exists design_direction text,
  add column if not exists page_requirements text[] default '{}',
  add column if not exists addon_services text[] default '{}',
  add column if not exists inspiration_summary text default '';

update public.studio_custom_requests request
set lead_id = brief.lead_id
from public.studio_briefs brief
where request.lead_id is null
  and request.brief_id = brief.id;

update public.studio_custom_requests
set
  project_type = coalesce(nullif(project_type, ''), nullif(title, ''), 'custom'),
  platform_preference = coalesce(nullif(platform_preference, ''), nullif((metadata ->> 'platform_preference'), ''), 'to_scope'),
  design_direction = coalesce(nullif(design_direction, ''), nullif(description, ''), 'Design direction to be confirmed'),
  page_requirements = coalesce(page_requirements, '{}'),
  addon_services = coalesce(addon_services, '{}'),
  inspiration_summary = coalesce(inspiration_summary, '')
where project_type is null
   or project_type = ''
   or platform_preference is null
   or platform_preference = ''
   or design_direction is null
   or design_direction = ''
   or page_requirements is null
   or addon_services is null
   or inspiration_summary is null;
