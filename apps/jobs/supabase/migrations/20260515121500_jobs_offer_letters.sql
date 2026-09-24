-- V3 PASS 21 — Jobs offer letters (Distinctive Rule #4).
--
-- WHY:
--   Greenhouse / Lever parity. Offer letter editor + e-signature via
--   SignWell (env-gated SIGNWELL_API_KEY) — NOT DocuSign, NOT Dropbox
--   Sign. Signed PDF stored in Cloudinary; fallback to typed-name
--   acknowledgement with audit_log when SignWell is offline.
--
-- TABLES:
--   public.jobs_offer_letters     (terms jsonb, signing flow, PDF urls)
--   public.jobs_offer_letter_events (lifecycle audit trail)
--
-- ENV REALITY (V3 PASS 21 preflight):
--   SIGNWELL_API_KEY is provisioned. provider='signwell' is the primary
--   path. Schema is provider-agnostic so a future swap (HelloSign /
--   DocuSign) only changes provider + provider_envelope_id.
--
-- RLS:
--   - Service role only (FIX-01). Candidate / employer access goes through the
--     app's service-role routes, which gate it; see the FIX-01 note below.
--
-- DOWN:
--   drop table if exists public.jobs_offer_letter_events;
--   drop table if exists public.jobs_offer_letters;
--
-- V3-ACTIVATION-RUNBOOK-FIX-01 (2026-09-24) — rebound to prod-actual columns:
--   public.jobs_applications has candidate_id (FK auth.users), NOT
--   candidate_user_id (never added on prod — supabase/prod-actual/schema.sql).
--   The original candidate-read policy is REMOVED: on prod, jobs_applications
--   has RLS on and no SELECT policy for request roles, so its EXISTS sub-select
--   could never match (dead policy); and if it ever did, it would expose
--   employer-only columns (employer_notes, employer_token / candidate tokens) to
--   the candidate. The table is service-role-only, which is how every shipped
--   reader/writer already accesses it. A candidate-facing read, if wanted, must
--   come through a column-limited view or RPC in its launch pass.
--
-- IDEMPOTENT: yes.

create table if not exists public.jobs_offer_letters (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.jobs_applications(id) on delete cascade,
  pipeline_id uuid references public.jobs_hiring_pipelines(id) on delete set null,
  issued_by_user_id uuid references auth.users(id) on delete set null,
  issued_at timestamptz not null default timezone('utc', now()),
  terms jsonb not null default '{}'::jsonb,
  base_salary_minor bigint,
  base_salary_currency text default 'NGN',
  start_date date,
  benefits jsonb not null default '[]'::jsonb,
  notes text,
  provider text not null default 'signwell'
    check (provider in ('signwell', 'docusign', 'hellosign', 'typed_fallback')),
  provider_envelope_id text,
  signing_url text,
  signed_pdf_url text,
  signed_at timestamptz,
  signed_signature jsonb not null default '{}'::jsonb,
  status text not null default 'draft'
    check (status in (
      'draft', 'sent', 'viewed', 'signed', 'expired', 'withdrawn', 'declined'
    )),
  expires_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists jobs_offer_letters_application_idx
  on public.jobs_offer_letters (application_id);
create index if not exists jobs_offer_letters_status_idx
  on public.jobs_offer_letters (status);
create index if not exists jobs_offer_letters_provider_envelope_idx
  on public.jobs_offer_letters (provider_envelope_id)
  where provider_envelope_id is not null;

alter table public.jobs_offer_letters enable row level security;

drop policy if exists "jobs offer letters: candidate read" on public.jobs_offer_letters;

drop policy if exists "jobs offer letters: service role" on public.jobs_offer_letters;
create policy "jobs offer letters: service role"
  on public.jobs_offer_letters
  for all
  using ((select auth.role()) = 'service_role')
  with check ((select auth.role()) = 'service_role');

create table if not exists public.jobs_offer_letter_events (
  id uuid primary key default gen_random_uuid(),
  offer_letter_id uuid not null references public.jobs_offer_letters(id) on delete cascade,
  event_type text not null,
  actor_user_id uuid references auth.users(id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default timezone('utc', now())
);

create index if not exists jobs_offer_letter_events_offer_idx
  on public.jobs_offer_letter_events (offer_letter_id, occurred_at desc);

alter table public.jobs_offer_letter_events enable row level security;

drop policy if exists "jobs offer letter events: service role" on public.jobs_offer_letter_events;
create policy "jobs offer letter events: service role"
  on public.jobs_offer_letter_events
  for all
  using ((select auth.role()) = 'service_role')
  with check ((select auth.role()) = 'service_role');

comment on table public.jobs_offer_letters is
  'V3 PASS 21 — offer letter editor + e-signature (Distinctive Rule #4). '
  'Primary provider signwell (env: SIGNWELL_API_KEY). typed_fallback '
  'records a typed-name acknowledgement with audit_log when SignWell is '
  'unavailable. signed_pdf_url stores the Cloudinary URL after countersign.';
comment on table public.jobs_offer_letter_events is
  'V3 PASS 21 — lifecycle audit trail for offer letters. Events: '
  'draft.created, sent, viewed.candidate, signed.candidate, signed.employer, '
  'expired, withdrawn, declined, pdf.uploaded.';

-- end of migration --
