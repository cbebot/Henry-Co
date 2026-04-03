create extension if not exists pgcrypto;

create or replace function public.learn_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.learn_auth_email()
returns text
language sql
stable
as $$
  select nullif(lower(coalesce(auth.jwt() ->> 'email', '')), '');
$$;

create or replace function public.learn_is_staff()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.learn_role_memberships membership
    where membership.is_active = true
      and (
        membership.user_id = auth.uid()
        or (
          membership.normalized_email is not null
          and membership.normalized_email = public.learn_auth_email()
        )
      )
  );
$$;

create table if not exists public.learn_role_memberships (
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

create table if not exists public.learn_course_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null,
  hero_copy text not null,
  accent text,
  icon text,
  is_featured boolean not null default false,
  sort_order integer not null default 0,
  course_count integer not null default 0,
  audience_tags text[] not null default '{}',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.learn_instructors (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  full_name text not null,
  title text not null,
  bio text not null,
  expertise text[] not null default '{}',
  accent text,
  avatar_url text,
  spotlight_quote text,
  rating numeric(3,2) not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.learn_plans (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null,
  price integer not null default 0,
  currency text not null default 'NGN',
  billing_type text not null default 'one_time',
  access_scope text not null,
  perks text[] not null default '{}',
  is_public boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.learn_courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  category_id uuid references public.learn_course_categories(id) on delete set null,
  primary_instructor_id uuid references public.learn_instructors(id) on delete set null,
  title text not null,
  subtitle text not null,
  summary text not null,
  description text not null,
  hero_image_url text,
  preview_video_url text,
  duration_text text not null,
  estimated_minutes integer not null default 0,
  difficulty text not null default 'beginner',
  prerequisites text[] not null default '{}',
  outcomes text[] not null default '{}',
  tags text[] not null default '{}',
  visibility text not null default 'public',
  access_model text not null default 'free',
  plan_id uuid references public.learn_plans(id) on delete set null,
  price integer,
  currency text not null default 'NGN',
  featured boolean not null default false,
  is_certification boolean not null default false,
  passing_score integer not null default 70,
  completion_rule text,
  status text not null default 'draft',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.learn_learning_paths (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  summary text not null,
  description text not null,
  hero_image_url text,
  audience text not null,
  visibility text not null default 'public',
  access_model text not null default 'free',
  plan_id uuid references public.learn_plans(id) on delete set null,
  featured boolean not null default false,
  status text not null default 'draft',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.learn_path_items (
  id uuid primary key default gen_random_uuid(),
  path_id uuid not null references public.learn_learning_paths(id) on delete cascade,
  item_type text not null default 'course',
  course_id uuid references public.learn_courses(id) on delete cascade,
  label text,
  description text,
  sort_order integer not null default 1,
  required boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.learn_modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.learn_courses(id) on delete cascade,
  title text not null,
  summary text,
  sort_order integer not null default 1,
  unlock_rule text not null default 'sequential',
  estimated_minutes integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.learn_lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.learn_courses(id) on delete cascade,
  module_id uuid not null references public.learn_modules(id) on delete cascade,
  slug text not null,
  title text not null,
  summary text,
  body_markdown text not null default '',
  video_url text,
  duration_minutes integer not null default 0,
  lesson_type text not null default 'reading',
  is_preview boolean not null default false,
  sort_order integer not null default 1,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.learn_lesson_resources (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.learn_lessons(id) on delete cascade,
  label text not null,
  resource_type text not null,
  url text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.learn_quizzes (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.learn_courses(id) on delete cascade,
  lesson_id uuid references public.learn_lessons(id) on delete set null,
  title text not null,
  description text,
  pass_score integer not null default 70,
  max_attempts integer not null default 3,
  question_count integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.learn_quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.learn_quizzes(id) on delete cascade,
  prompt text not null,
  question_type text not null default 'single_choice',
  options text[] not null default '{}',
  correct_answer text[] not null default '{}',
  explanation text,
  sort_order integer not null default 1,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.learn_enrollments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.learn_courses(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  normalized_email text,
  source text not null default 'self',
  status text not null default 'active',
  payment_status text not null default 'not_required',
  sponsor_name text,
  enrolled_at timestamptz not null default timezone('utc', now()),
  started_at timestamptz,
  completed_at timestamptz,
  percent_complete integer not null default 0,
  last_lesson_id uuid references public.learn_lessons(id) on delete set null,
  last_activity_at timestamptz
);

create table if not exists public.learn_progress (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.learn_enrollments(id) on delete cascade,
  course_id uuid not null references public.learn_courses(id) on delete cascade,
  module_id uuid references public.learn_modules(id) on delete set null,
  lesson_id uuid not null references public.learn_lessons(id) on delete cascade,
  status text not null default 'in_progress',
  seconds_watched integer not null default 0,
  score integer,
  completed_at timestamptz
);

create table if not exists public.learn_quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.learn_quizzes(id) on delete cascade,
  enrollment_id uuid not null references public.learn_enrollments(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  normalized_email text,
  score integer not null default 0,
  passed boolean not null default false,
  submitted_at timestamptz not null default timezone('utc', now()),
  answers jsonb not null default '{}'::jsonb
);

create table if not exists public.learn_certificates (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.learn_enrollments(id) on delete cascade,
  course_id uuid not null references public.learn_courses(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  normalized_email text,
  certificate_no text not null unique,
  verification_code text not null unique,
  issued_at timestamptz not null default timezone('utc', now()),
  score integer,
  status text not null default 'issued'
);

create table if not exists public.learn_certificate_verification (
  id uuid primary key default gen_random_uuid(),
  certificate_id uuid not null references public.learn_certificates(id) on delete cascade,
  course_id uuid not null references public.learn_courses(id) on delete cascade,
  certificate_no text not null,
  verification_code text not null unique,
  normalized_email text,
  status text not null default 'issued',
  issued_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.learn_reviews (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.learn_courses(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  normalized_email text,
  rating integer not null default 5,
  title text not null,
  body text not null,
  status text not null default 'pending',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.learn_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  normalized_email text,
  channel text not null,
  template_key text not null,
  recipient text not null,
  title text not null,
  body text not null,
  status text not null default 'queued',
  reason text,
  entity_type text,
  entity_id text,
  read_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.learn_assignments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.learn_courses(id) on delete cascade,
  path_id uuid references public.learn_learning_paths(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  normalized_email text,
  assignee_role text,
  assigned_by_user_id uuid references auth.users(id) on delete set null,
  sponsor_name text,
  note text not null default '',
  required boolean not null default true,
  due_at timestamptz,
  assigned_at timestamptz not null default timezone('utc', now()),
  status text not null default 'assigned'
);

create table if not exists public.learn_payments (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.learn_enrollments(id) on delete cascade,
  course_id uuid not null references public.learn_courses(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  normalized_email text,
  amount integer not null default 0,
  currency text not null default 'NGN',
  status text not null default 'pending',
  method text not null default 'manual',
  reference text not null unique,
  created_at timestamptz not null default timezone('utc', now()),
  confirmed_at timestamptz
);

create table if not exists public.learn_saved_courses (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.learn_courses(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  normalized_email text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.learn_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists learn_role_memberships_user_idx on public.learn_role_memberships(user_id);
create index if not exists learn_role_memberships_email_idx on public.learn_role_memberships(normalized_email);
create index if not exists learn_enrollments_user_idx on public.learn_enrollments(user_id);
create index if not exists learn_enrollments_email_idx on public.learn_enrollments(normalized_email);
create index if not exists learn_notifications_user_idx on public.learn_notifications(user_id);
create index if not exists learn_notifications_email_idx on public.learn_notifications(normalized_email);
create index if not exists learn_assignments_email_idx on public.learn_assignments(normalized_email);
create index if not exists learn_payments_email_idx on public.learn_payments(normalized_email);

drop trigger if exists learn_role_memberships_updated_at on public.learn_role_memberships;
create trigger learn_role_memberships_updated_at before update on public.learn_role_memberships
for each row execute function public.learn_set_updated_at();

drop trigger if exists learn_course_categories_updated_at on public.learn_course_categories;
create trigger learn_course_categories_updated_at before update on public.learn_course_categories
for each row execute function public.learn_set_updated_at();

drop trigger if exists learn_instructors_updated_at on public.learn_instructors;
create trigger learn_instructors_updated_at before update on public.learn_instructors
for each row execute function public.learn_set_updated_at();

drop trigger if exists learn_plans_updated_at on public.learn_plans;
create trigger learn_plans_updated_at before update on public.learn_plans
for each row execute function public.learn_set_updated_at();

drop trigger if exists learn_courses_updated_at on public.learn_courses;
create trigger learn_courses_updated_at before update on public.learn_courses
for each row execute function public.learn_set_updated_at();

drop trigger if exists learn_learning_paths_updated_at on public.learn_learning_paths;
create trigger learn_learning_paths_updated_at before update on public.learn_learning_paths
for each row execute function public.learn_set_updated_at();

drop trigger if exists learn_modules_updated_at on public.learn_modules;
create trigger learn_modules_updated_at before update on public.learn_modules
for each row execute function public.learn_set_updated_at();

drop trigger if exists learn_lessons_updated_at on public.learn_lessons;
create trigger learn_lessons_updated_at before update on public.learn_lessons
for each row execute function public.learn_set_updated_at();

drop trigger if exists learn_quizzes_updated_at on public.learn_quizzes;
create trigger learn_quizzes_updated_at before update on public.learn_quizzes
for each row execute function public.learn_set_updated_at();

drop trigger if exists learn_reviews_updated_at on public.learn_reviews;
create trigger learn_reviews_updated_at before update on public.learn_reviews
for each row execute function public.learn_set_updated_at();

drop trigger if exists learn_settings_updated_at on public.learn_settings;
create trigger learn_settings_updated_at before update on public.learn_settings
for each row execute function public.learn_set_updated_at();
