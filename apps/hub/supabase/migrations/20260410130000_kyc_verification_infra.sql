-- 20260410130000_kyc_verification_infra.sql
-- Adds KYC/identity verification infrastructure.
--
-- The trust system already assigns tiers based on behavioral signals.
-- This migration adds first-class document-based identity verification
-- for sensitive actions (wallet withdrawals, seller approval, etc.)
-- where behavioral trust alone is insufficient.

-- Verification status on the profile itself.
alter table public.customer_profiles
  add column if not exists verification_status text not null default 'none',
  add column if not exists verification_submitted_at timestamptz,
  add column if not exists verification_reviewed_at timestamptz,
  add column if not exists verification_reviewer_id uuid references auth.users(id) on delete set null,
  add column if not exists verification_note text;

-- Track which specific document types have been submitted.
-- Keeps the review queue queryable without joining customer_documents.
create table if not exists public.customer_verification_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document_type text not null,   -- 'government_id', 'selfie', 'address_proof', 'business_cert'
  document_id uuid references public.customer_documents(id) on delete set null,
  status text not null default 'pending',  -- pending, approved, rejected
  reviewer_id uuid references auth.users(id) on delete set null,
  reviewer_note text,
  submitted_at timestamptz not null default timezone('utc', now()),
  reviewed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists customer_verification_submissions_user_idx
  on public.customer_verification_submissions(user_id, status, document_type);

create index if not exists customer_verification_submissions_review_queue_idx
  on public.customer_verification_submissions(status, submitted_at asc)
  where status = 'pending';

alter table public.customer_verification_submissions enable row level security;

-- Trigger for updated_at
drop trigger if exists customer_verification_submissions_updated_at on public.customer_verification_submissions;
create trigger customer_verification_submissions_updated_at
before update on public.customer_verification_submissions
for each row execute function public.account_set_updated_at();

-- Index for admin queries filtering by verification status.
create index if not exists customer_profiles_verification_status_idx
  on public.customer_profiles(verification_status)
  where verification_status != 'none';
