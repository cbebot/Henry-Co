-- V3 PASS 21 — Studio: proposal e-signature ledger.
--
-- WHY:
--   Studio proposals are accepted by clients today via an access-token
--   link, but acceptance carries no provenance. V3 PASS 21 distinctive
--   surface #2 (proposal versioning + e-signature accept) requires:
--     * signed timestamp, IP address, user agent, locale
--     * optional signed PDF Cloudinary public id
--     * optional typed-name fallback when SignWell is not configured
--   so any future audit can reconstruct the exact accept event.
--
--   SignWell is the provisioned e-signature provider (per Vercel env
--   pre-flight §3). Provider field is generic (`provider text`) so
--   migrating providers later does not require schema changes.
--
-- TABLE:
--   public.studio_proposal_signatures (id, proposal_id fk, signed_at,
--   signed_by_user_id fk nullable, signed_by_name, signed_by_email,
--   provider, provider_envelope_id, signature_image_url, signed_pdf_url,
--   cloudinary_public_id, ip_address, user_agent, locale, audit_log_id,
--   created_at).
--
-- RLS:
--   - Service role: full access.
--   - Authenticated client: SELECT own signature (proposal.lead.email
--     matches the signature's signed_by_email OR signed_by_user_id =
--     auth.uid()).
--   - Studio staff: SELECT + INSERT via public.is_staff_in('studio').
--
-- DOWN:
--   drop policy "studio proposal signatures: service role" on public.studio_proposal_signatures;
--   drop policy "studio proposal signatures: client read" on public.studio_proposal_signatures;
--   drop policy "studio proposal signatures: staff" on public.studio_proposal_signatures;
--   drop table public.studio_proposal_signatures;

-- ─────────────────────────────────────────────────────────────────────
-- Extend studio_proposals: accepted_at + signed_pdf_url (linked to the
-- generated Cloudinary PDF) so the application can query "is this
-- proposal already signed?" without joining studio_proposal_signatures.
-- ─────────────────────────────────────────────────────────────────────
alter table public.studio_proposals
  add column if not exists accepted_at timestamptz,
  add column if not exists declined_at timestamptz,
  add column if not exists signed_pdf_url text,
  add column if not exists signed_pdf_public_id text,
  add column if not exists last_signature_id uuid;

create index if not exists studio_proposals_status_idx
  on public.studio_proposals (status, valid_until);

create index if not exists studio_proposals_accepted_idx
  on public.studio_proposals (accepted_at desc)
  where accepted_at is not null;

create table if not exists public.studio_proposal_signatures (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.studio_proposals(id) on delete cascade,
  signed_at timestamptz not null default timezone('utc', now()),
  signed_by_user_id uuid references auth.users(id) on delete set null,
  signed_by_name text,
  signed_by_email text,
  provider text not null default 'typed_name',
  provider_envelope_id text,
  signature_image_url text,
  signed_pdf_url text,
  cloudinary_public_id text,
  ip_address text,
  user_agent text,
  locale text,
  audit_log_id uuid,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists studio_proposal_signatures_proposal_idx
  on public.studio_proposal_signatures (proposal_id, signed_at desc);

create index if not exists studio_proposal_signatures_user_idx
  on public.studio_proposal_signatures (signed_by_user_id, signed_at desc)
  where signed_by_user_id is not null;

create index if not exists studio_proposal_signatures_email_idx
  on public.studio_proposal_signatures (lower(signed_by_email))
  where signed_by_email is not null;

alter table public.studio_proposal_signatures enable row level security;

drop policy if exists "studio proposal signatures: service role" on public.studio_proposal_signatures;
create policy "studio proposal signatures: service role"
  on public.studio_proposal_signatures
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "studio proposal signatures: client read" on public.studio_proposal_signatures;
create policy "studio proposal signatures: client read"
  on public.studio_proposal_signatures
  for select
  using (
    signed_by_user_id = auth.uid()
    or (
      signed_by_email is not null
      and lower(signed_by_email) = lower(coalesce(
        (select email from auth.users where id = auth.uid()),
        ''
      ))
    )
  );

drop policy if exists "studio proposal signatures: staff" on public.studio_proposal_signatures;
create policy "studio proposal signatures: staff"
  on public.studio_proposal_signatures
  for all
  using (public.is_staff_in('studio'))
  with check (public.is_staff_in('studio'));

comment on table public.studio_proposal_signatures is
  'V3 PASS 21 — Studio proposal e-signature ledger. One row per accept event '
  'with timestamp + IP + UA + locale captured for audit replay. provider is '
  '"signwell" when SignWell envelope is used; "typed_name" for the fallback '
  'path (typed-name + checkbox affirmation). signed_pdf_url + cloudinary_public_id '
  'point to the Cloudinary-stored signed PDF. RLS: client can read own signature '
  'rows; studio staff full read+write.';

-- end of migration --
