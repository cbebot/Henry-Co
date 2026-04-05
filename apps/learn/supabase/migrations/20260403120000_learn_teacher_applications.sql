create table if not exists public.learn_teacher_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  normalized_email text,
  full_name text not null,
  phone text,
  country text,
  expertise_area text not null,
  teaching_topics text[] not null default '{}',
  credentials text not null default '',
  portfolio_links text[] not null default '{}',
  course_proposal text not null default '',
  supporting_files jsonb not null default '[]'::jsonb,
  terms_accepted_at timestamptz not null default timezone('utc', now()),
  status text not null default 'submitted',
  review_notes text,
  admin_notes text,
  payout_model text not null default 'pending',
  revenue_share_percent integer,
  reviewed_at timestamptz,
  reviewed_by_user_id uuid references auth.users(id) on delete set null,
  instructor_membership_id uuid references public.learn_role_memberships(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists learn_teacher_applications_user_idx
  on public.learn_teacher_applications(user_id);

create index if not exists learn_teacher_applications_email_idx
  on public.learn_teacher_applications(normalized_email);

create index if not exists learn_teacher_applications_status_idx
  on public.learn_teacher_applications(status);

drop trigger if exists learn_teacher_applications_updated_at on public.learn_teacher_applications;
create trigger learn_teacher_applications_updated_at
before update on public.learn_teacher_applications
for each row execute function public.learn_set_updated_at();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
select
  'learn-teaching-files',
  'learn-teaching-files',
  false,
  12582912,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp'
  ]::text[]
where not exists (
  select 1
  from storage.buckets
  where id = 'learn-teaching-files'
);
