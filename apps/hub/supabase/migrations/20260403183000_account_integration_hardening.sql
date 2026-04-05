create extension if not exists pgcrypto;

create or replace function public.account_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

alter table public.customer_preferences
  add column if not exists notification_jobs boolean not null default true,
  add column if not exists notification_learn boolean not null default true,
  add column if not exists notification_property boolean not null default true,
  add column if not exists notification_logistics boolean not null default true,
  add column if not exists notification_referrals boolean not null default true,
  add column if not exists whatsapp_enabled boolean not null default false,
  add column if not exists sms_enabled boolean not null default false;

create table if not exists public.customer_wallet_funding_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'bank_transfer',
  amount_kobo bigint not null check (amount_kobo > 0),
  currency text not null default 'NGN',
  status text not null default 'pending_verification',
  payment_reference text not null unique,
  source_division text not null default 'account',
  proof_url text,
  proof_public_id text,
  proof_name text,
  note text,
  verified_at timestamptz,
  verified_by uuid references auth.users(id) on delete set null,
  rejected_at timestamptz,
  rejected_by uuid references auth.users(id) on delete set null,
  rejection_reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.customer_payout_methods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  method_type text not null default 'bank_transfer',
  account_name text,
  bank_name text,
  account_number text,
  routing_label text,
  currency text not null default 'NGN',
  country text,
  is_default boolean not null default false,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.customer_referral_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  referral_code text not null unique,
  share_path text,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.customer_referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_user_id uuid not null references auth.users(id) on delete cascade,
  referred_user_id uuid references auth.users(id) on delete set null,
  referred_email_normalized text,
  referred_phone_normalized text,
  source text not null default 'account',
  status text not null default 'pending',
  hold_reason text,
  first_eligible_event_type text,
  first_eligible_event_at timestamptz,
  converted_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.customer_referral_rewards (
  id uuid primary key default gen_random_uuid(),
  referral_id uuid not null references public.customer_referrals(id) on delete cascade,
  referrer_user_id uuid not null references auth.users(id) on delete cascade,
  referred_user_id uuid references auth.users(id) on delete set null,
  reward_kind text not null default 'wallet_credit',
  reward_status text not null default 'held',
  amount_kobo bigint not null default 0,
  currency text not null default 'NGN',
  released_at timestamptz,
  released_by uuid references auth.users(id) on delete set null,
  hold_reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.jobs_interview_sessions (
  id uuid primary key default gen_random_uuid(),
  application_id text not null,
  candidate_user_id uuid references auth.users(id) on delete cascade,
  division text not null default 'jobs',
  provider text not null default 'video_provider_pending',
  status text not null default 'awaiting_schedule',
  scheduled_at timestamptz,
  ends_at timestamptz,
  location_label text,
  join_url text,
  interviewer_name text,
  interviewer_title text,
  preparation_notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.jobs_interview_participants (
  id uuid primary key default gen_random_uuid(),
  interview_session_id uuid not null references public.jobs_interview_sessions(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  email_normalized text,
  role text not null,
  display_name text,
  joined_at timestamptz,
  left_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.jobs_interview_events (
  id uuid primary key default gen_random_uuid(),
  interview_session_id uuid not null references public.jobs_interview_sessions(id) on delete cascade,
  event_type text not null,
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_role text,
  summary text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.care_bookings
  add column if not exists user_id uuid references auth.users(id) on delete set null,
  add column if not exists email_normalized text;

update public.care_bookings
set email_normalized = lower(trim(email))
where email is not null
  and (email_normalized is null or email_normalized = '');

update public.care_bookings as booking
set user_id = profile.id
from public.customer_profiles as profile
where booking.user_id is null
  and booking.email_normalized is not null
  and lower(trim(profile.email)) = booking.email_normalized;

update public.care_bookings as booking
set user_id = profile.id
from public.customer_profiles as profile
where booking.user_id is null
  and booking.phone_normalized is not null
  and profile.phone = booking.phone_normalized;

insert into public.company_divisions (
  slug,
  display_name,
  tagline,
  description,
  subdomain,
  href,
  is_active,
  is_public,
  sort_order
) values
  ('care', 'HenryCo Care', 'Trusted fabric care and cleaning operations.', 'Bookings, pickup tracking, payment verification, and care service follow-through.', 'care', 'https://care.henrycogroup.com', true, true, 10),
  ('marketplace', 'HenryCo Marketplace', 'Commerce, sellers, orders, and delivery confidence.', 'Buyer and seller activity, order state, and marketplace commerce operations.', 'marketplace', 'https://marketplace.henrycogroup.com', true, true, 20),
  ('studio', 'HenryCo Studio', 'Web, app, and software delivery with calmer execution.', 'Creative, product, and software project rooms with payment and delivery continuity.', 'studio', 'https://studio.henrycogroup.com', true, true, 30),
  ('jobs', 'HenryCo Jobs', 'Hiring, applications, and cleaner recruiting lanes.', 'Candidate and employer activity across structured recruiting workflows.', 'jobs', 'https://jobs.henrycogroup.com', true, true, 40),
  ('property', 'HenryCo Property', 'Listings, inquiries, and property operations.', 'Property discovery, submissions, inquiries, and managed listing operations.', 'property', 'https://property.henrycogroup.com', true, true, 50),
  ('learn', 'HenryCo Learn', 'Academy, certifications, and learning progression.', 'Courses, certifications, saved learning, and instructor application flows.', 'learn', 'https://learn.henrycogroup.com', true, true, 60),
  ('logistics', 'HenryCo Logistics', 'Shipment visibility and delivery coordination.', 'Operational shipment state, proof, and logistics updates.', 'logistics', 'https://logistics.henrycogroup.com', true, true, 70)
on conflict (slug) do update
set
  display_name = excluded.display_name,
  tagline = excluded.tagline,
  description = excluded.description,
  subdomain = excluded.subdomain,
  href = excluded.href,
  is_active = excluded.is_active,
  is_public = excluded.is_public,
  sort_order = excluded.sort_order;

create index if not exists customer_wallet_funding_requests_user_idx
  on public.customer_wallet_funding_requests(user_id, status, created_at desc);
create index if not exists customer_payout_methods_user_idx
  on public.customer_payout_methods(user_id, is_default desc, created_at desc);
create index if not exists customer_referrals_referrer_idx
  on public.customer_referrals(referrer_user_id, status, created_at desc);
create index if not exists customer_referrals_referred_email_idx
  on public.customer_referrals(referred_email_normalized);
create index if not exists customer_referrals_referred_phone_idx
  on public.customer_referrals(referred_phone_normalized);
create unique index if not exists customer_referrals_referred_user_uidx
  on public.customer_referrals(referred_user_id)
  where referred_user_id is not null;
create index if not exists customer_referral_rewards_referrer_idx
  on public.customer_referral_rewards(referrer_user_id, reward_status, created_at desc);
create index if not exists jobs_interview_sessions_candidate_idx
  on public.jobs_interview_sessions(candidate_user_id, status, scheduled_at desc);
create index if not exists jobs_interview_events_session_idx
  on public.jobs_interview_events(interview_session_id, created_at desc);
create index if not exists jobs_interview_participants_session_idx
  on public.jobs_interview_participants(interview_session_id, role);
create index if not exists care_bookings_user_idx
  on public.care_bookings(user_id, created_at desc);
create index if not exists care_bookings_email_normalized_idx
  on public.care_bookings(email_normalized);

alter table public.customer_wallet_funding_requests enable row level security;
alter table public.customer_payout_methods enable row level security;
alter table public.customer_referral_profiles enable row level security;
alter table public.customer_referrals enable row level security;
alter table public.customer_referral_rewards enable row level security;
alter table public.jobs_interview_sessions enable row level security;
alter table public.jobs_interview_participants enable row level security;
alter table public.jobs_interview_events enable row level security;

drop trigger if exists customer_wallet_funding_requests_updated_at on public.customer_wallet_funding_requests;
create trigger customer_wallet_funding_requests_updated_at
before update on public.customer_wallet_funding_requests
for each row execute function public.account_set_updated_at();

drop trigger if exists customer_payout_methods_updated_at on public.customer_payout_methods;
create trigger customer_payout_methods_updated_at
before update on public.customer_payout_methods
for each row execute function public.account_set_updated_at();

drop trigger if exists customer_referral_profiles_updated_at on public.customer_referral_profiles;
create trigger customer_referral_profiles_updated_at
before update on public.customer_referral_profiles
for each row execute function public.account_set_updated_at();

drop trigger if exists customer_referrals_updated_at on public.customer_referrals;
create trigger customer_referrals_updated_at
before update on public.customer_referrals
for each row execute function public.account_set_updated_at();

drop trigger if exists customer_referral_rewards_updated_at on public.customer_referral_rewards;
create trigger customer_referral_rewards_updated_at
before update on public.customer_referral_rewards
for each row execute function public.account_set_updated_at();

drop trigger if exists jobs_interview_sessions_updated_at on public.jobs_interview_sessions;
create trigger jobs_interview_sessions_updated_at
before update on public.jobs_interview_sessions
for each row execute function public.account_set_updated_at();

drop trigger if exists jobs_interview_participants_updated_at on public.jobs_interview_participants;
create trigger jobs_interview_participants_updated_at
before update on public.jobs_interview_participants
for each row execute function public.account_set_updated_at();

drop trigger if exists jobs_interview_events_updated_at on public.jobs_interview_events;
create trigger jobs_interview_events_updated_at
before update on public.jobs_interview_events
for each row execute function public.account_set_updated_at();

alter table public.customer_notifications
  add column if not exists read_at timestamptz,
  add column if not exists archived_at timestamptz,
  add column if not exists deleted_at timestamptz,
  add column if not exists detail_payload jsonb not null default '{}'::jsonb;

update public.customer_notifications
set read_at = coalesce(read_at, created_at)
where is_read = true
  and read_at is null;

update public.customer_notifications
set detail_payload = jsonb_strip_nulls(
  coalesce(detail_payload, '{}'::jsonb) ||
  jsonb_build_object(
    'title', title,
    'body', body,
    'division', division,
    'category', category,
    'action_url', action_url
  )
)
where coalesce(detail_payload, '{}'::jsonb) = '{}'::jsonb;

alter table public.customer_security_log
  add column if not exists event_category text,
  add column if not exists risk_level text,
  add column if not exists device_summary text,
  add column if not exists location_summary text,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

update public.customer_security_log
set
  event_category = coalesce(
    event_category,
    case
      when lower(coalesce(event_type, '')) like '%password%' or lower(coalesce(event_type, '')) like '%otp%' or lower(coalesce(event_type, '')) like '%credential%' then 'sensitive_change'
      when lower(coalesce(event_type, '')) like '%alert%' or lower(coalesce(event_type, '')) like '%failed%' or lower(coalesce(event_type, '')) like '%suspicious%' then 'alert'
      when lower(coalesce(event_type, '')) like '%sign_out%' or lower(coalesce(event_type, '')) like '%logout%' then 'session'
      else 'sign_in'
    end
  ),
  risk_level = coalesce(
    risk_level,
    case
      when lower(coalesce(event_type, '')) like '%alert%' or lower(coalesce(event_type, '')) like '%failed%' or lower(coalesce(event_type, '')) like '%suspicious%' then 'high'
      when lower(coalesce(event_type, '')) like '%password%' or lower(coalesce(event_type, '')) like '%otp%' or lower(coalesce(event_type, '')) like '%credential%' then 'medium'
      else 'low'
    end
  ),
  device_summary = coalesce(device_summary, 'Unknown device'),
  location_summary = coalesce(
    location_summary,
    case
      when ip_address is not null then 'Approximate source IP ' || ip_address
      else 'Location not available'
    end
  ),
  metadata = coalesce(metadata, '{}'::jsonb);

create table if not exists public.customer_trust_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  tier text not null default 'basic',
  score integer not null default 0,
  signals jsonb not null default '{}'::jsonb,
  requirements jsonb not null default '[]'::jsonb,
  eligibility_flags jsonb not null default '{}'::jsonb,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

insert into public.customer_trust_profiles (user_id)
select id
from auth.users
on conflict (user_id) do nothing;

insert into public.customer_wallet_funding_requests (
  user_id,
  provider,
  amount_kobo,
  currency,
  status,
  payment_reference,
  source_division,
  note,
  metadata,
  created_at,
  updated_at
)
select
  tx.user_id,
  coalesce(tx.metadata->>'provider', 'bank_transfer'),
  tx.amount_kobo,
  'NGN',
  coalesce(tx.status, 'pending_verification'),
  coalesce(nullif(tx.reference_id, ''), 'HCW-BACKFILL-' || substring(tx.id::text, 1, 8)),
  'account',
  tx.metadata->>'note',
  coalesce(tx.metadata, '{}'::jsonb),
  tx.created_at,
  tx.created_at
from public.customer_wallet_transactions as tx
where tx.reference_type = 'wallet_funding_request'
on conflict (payment_reference) do nothing;

create index if not exists customer_notifications_user_lifecycle_idx
  on public.customer_notifications(user_id, archived_at, deleted_at, created_at desc);
create index if not exists customer_security_log_user_risk_idx
  on public.customer_security_log(user_id, event_category, risk_level, created_at desc);
create index if not exists customer_trust_profiles_user_idx
  on public.customer_trust_profiles(user_id, tier, score);

alter table public.customer_trust_profiles enable row level security;

drop trigger if exists customer_trust_profiles_updated_at on public.customer_trust_profiles;
create trigger customer_trust_profiles_updated_at
before update on public.customer_trust_profiles
for each row execute function public.account_set_updated_at();
