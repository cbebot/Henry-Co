-- V3-OWNER-INBOX-01 — unified company email inbox (INBOUND capture) foundation.
--
-- Additive migration. Introduces the owner-only store for email RECEIVED at any
-- address on henryonyx.com (captured by Cloudflare Email Routing -> Email Worker
-- -> the /api/inbound/email webhook). This is the RECEIVING side and is entirely
-- separate from transactional SENDING (Resend/Brevo), which is untouched.
--
--   * received_emails              — one row per inbound message, any brand address
--   * received_email_attachments   — attachment metadata + a private media:// ref
--
-- SENSITIVE DATA. Email bodies carry verification codes, password resets, and PII.
-- Access is OWNER-ONLY:
--   - Writes: service-role only (the webhook runs behind a shared-secret HMAC and
--     uses the service-role client; server actions run behind requireOwner()).
--   - Reads (browser RLS backstop): only an active owner/admin in owner_profiles.
--     (There is no public.is_owner() function body in-repo; mirror the
--      owner_profiles EXISTS idiom from 20260408120000_hq_internal_comms_*.sql.)
-- Attachments live in a PRIVATE storage bucket, read only via signed URLs
-- (service-role), never public.
--
-- Governance rows are registered in data_governance_domains + data_retention_policies.

begin;

create extension if not exists pgcrypto;
create extension if not exists citext;

create or replace function public.owner_inbox_set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- Owner predicate (SECURITY DEFINER so it reads owner_profiles WITHOUT being
-- subject to owner_profiles' own RLS — avoids the RLS-within-RLS recursion trap
-- the SEC-HARDEN work flagged). Mirrors the proven hq_ic_can_write_thread idiom.
-- `set search_path = public` keeps the function-search-path advisor green.
create or replace function public.owner_inbox_is_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.owner_profiles o
    where o.user_id = (select auth.uid())
      and o.is_active
      and lower(trim(o.role)) in ('owner', 'admin')
  );
$$;

revoke all on function public.owner_inbox_is_owner() from public;
grant execute on function public.owner_inbox_is_owner() to authenticated;
-- Only authenticated sessions evaluate the owner-only SELECT policy; anon never
-- reaches it. Revoke anon's auto-granted EXECUTE to shrink the surface.
revoke execute on function public.owner_inbox_is_owner() from anon;

-- ──────────────────────────────────────────────────────────────────────────────
-- received_emails — the unified inbound mailbox (all addresses @henryonyx.com)
-- ──────────────────────────────────────────────────────────────────────────────
create table if not exists public.received_emails (
  id uuid primary key default gen_random_uuid(),

  -- Idempotency key. Prefer the RFC822 Message-ID; fall back to a content hash
  -- computed by the webhook. UNIQUE so a redelivered message can never duplicate.
  dedupe_key text not null unique,
  message_id text,

  -- Addressing. to_address is the brand local-part the mail was sent to and
  -- drives the per-address filter chips (data-driven: any address that receives
  -- mail appears, including ones not in brand-emails.ts such as contact@/owner@).
  to_address citext not null,
  envelope_to citext,
  from_address citext not null,
  from_name text,
  reply_to citext,
  cc_addresses text[] not null default '{}',
  subject text not null default '(no subject)',

  -- Bodies. html_body is sanitized at write-time; text_body is the plain part.
  text_body text,
  html_body text,
  snippet text,

  -- Authentication verdicts from Cloudflare (spoof / spam awareness).
  spf text,
  dkim text,
  dmarc text,
  spam_verdict text,
  is_spam boolean not null default false,

  -- Forensic metadata.
  headers jsonb not null default '{}'::jsonb,
  size_bytes integer not null default 0,
  has_attachments boolean not null default false,
  attachment_count integer not null default 0,
  -- True when one or more attachments exceeded the inline-capture cap and were
  -- recorded as metadata-only (no silent truncation — the UI surfaces this).
  attachments_truncated boolean not null default false,

  -- Owner workflow state.
  is_read boolean not null default false,
  read_at timestamptz,
  read_by uuid references auth.users(id) on delete set null,
  is_archived boolean not null default false,
  archived_at timestamptz,

  -- Timestamps.
  sent_at timestamptz,
  received_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists received_emails_to_address_idx
  on public.received_emails(to_address);
create index if not exists received_emails_received_at_idx
  on public.received_emails(received_at desc);
create index if not exists received_emails_from_address_idx
  on public.received_emails(from_address);
create index if not exists received_emails_unread_idx
  on public.received_emails(received_at desc)
  where is_read = false and is_archived = false;
create index if not exists received_emails_archived_idx
  on public.received_emails(is_archived)
  where is_archived = true;

drop trigger if exists received_emails_updated_at on public.received_emails;
create trigger received_emails_updated_at
  before update on public.received_emails
  for each row execute function public.owner_inbox_set_updated_at();

alter table public.received_emails enable row level security;

-- Service-role full access (the webhook + owner server actions run as service role).
drop policy if exists received_emails_service_role on public.received_emails;
create policy received_emails_service_role on public.received_emails
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- Browser RLS backstop: only an active owner/admin may SELECT. (No writes for
-- authenticated browser sessions — only service-role writes.)
drop policy if exists received_emails_owner_select on public.received_emails;
create policy received_emails_owner_select on public.received_emails
  for select to authenticated
  using (public.owner_inbox_is_owner());

-- ──────────────────────────────────────────────────────────────────────────────
-- received_email_attachments — metadata + private media ref per attachment
-- ──────────────────────────────────────────────────────────────────────────────
create table if not exists public.received_email_attachments (
  id uuid primary key default gen_random_uuid(),
  email_id uuid not null references public.received_emails(id) on delete cascade,
  -- Stable index within the parsed message. Makes attachment capture
  -- idempotent/resumable across Worker retries (reconcile by (email_id, position)).
  position integer not null default 0,
  filename text not null default 'attachment',
  content_type text,
  size_bytes integer not null default 0,
  -- media://private/owner-inbox-attachments/<key>. NULL when the attachment was
  -- too large to capture inline (captured=false) and only metadata was stored.
  media_ref text,
  captured boolean not null default true,
  is_inline boolean not null default false,
  content_id text,
  created_at timestamptz not null default timezone('utc', now()),
  unique (email_id, position)
);

create index if not exists received_email_attachments_email_idx
  on public.received_email_attachments(email_id);

alter table public.received_email_attachments enable row level security;

drop policy if exists received_email_attachments_service_role on public.received_email_attachments;
create policy received_email_attachments_service_role on public.received_email_attachments
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists received_email_attachments_owner_select on public.received_email_attachments;
create policy received_email_attachments_owner_select on public.received_email_attachments
  for select to authenticated
  using (public.owner_inbox_is_owner());

-- ──────────────────────────────────────────────────────────────────────────────
-- Private storage bucket for attachments (RLS-private; read via service-role
-- signed URLs only — deliberately NO storage.objects read policy for browsers).
-- ──────────────────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
select
  'owner-inbox-attachments',
  'owner-inbox-attachments',
  false,            -- PRIVATE
  26214400,         -- 25 MiB (matches the Cloudflare Email Routing inbound limit)
  null              -- inbound mail can attach any type; fidelity over filtering
where not exists (
  select 1 from storage.buckets where id = 'owner-inbox-attachments'
);

-- ──────────────────────────────────────────────────────────────────────────────
-- Governance: register the owner-inbox tables in the data-retention map.
-- ──────────────────────────────────────────────────────────────────────────────
insert into public.data_governance_domains (
  domain_key, display_name, owner_team, classification, restore_priority,
  source_of_truth, backup_dependency, retention_summary, notes
) values (
  'owner_inbox',
  'Owner inbox (received email)',
  'Owner',
  'SENSITIVE — CONTAINS PII + SECRETS (verification codes, password resets)',
  20,
  'Supabase (received_emails) + Cloudflare Email Routing (in-flight only)',
  'Provider database backup; attachments in the owner-inbox-attachments private bucket.',
  'Retain received mail for owner reference; purge on owner request or per legal hold.',
  'OWNER-ONLY. Never expose on any customer/staff surface. Attachments are RLS-private; read via signed URLs only.'
) on conflict (domain_key) do update
  set display_name = excluded.display_name,
      owner_team = excluded.owner_team,
      classification = excluded.classification,
      restore_priority = excluded.restore_priority,
      source_of_truth = excluded.source_of_truth,
      backup_dependency = excluded.backup_dependency,
      retention_summary = excluded.retention_summary,
      notes = excluded.notes,
      updated_at = timezone('utc', now());

insert into public.data_retention_policies (
  domain_key, table_name, data_classification, retention_rule, retention_action,
  soft_delete_required, archive_required, legal_hold_supported,
  destructive_prune_allowed, backup_requirement, restore_source, owner_team, notes
) values
  (
    'owner_inbox','received_emails','SENSITIVE — PII + secrets in body/headers',
    'Retain for owner reference; no automated send-side dependency.',
    'Archive (is_archived) by owner; hard purge only on explicit owner request.',
    true, true, true, false,
    'Provider database backup.','Recreatable only by re-receiving mail (not generally possible).',
    'Owner',
    'Bodies can contain auth codes/resets — treat as secret. Owner-only RLS + service-role writes.'
  ),
  (
    'owner_inbox','received_email_attachments','SENSITIVE — attachment bytes (PII)',
    'Retain alongside the parent email.','Cascade-delete with the email row.',
    true, true, true, false,
    'Private storage bucket backup.','Recreatable only by re-receiving mail.','Owner',
    'media_ref points at the owner-inbox-attachments PRIVATE bucket; never public.'
  )
on conflict (schema_name, table_name) do update
  set data_classification = excluded.data_classification,
      retention_rule = excluded.retention_rule,
      retention_action = excluded.retention_action,
      soft_delete_required = excluded.soft_delete_required,
      archive_required = excluded.archive_required,
      legal_hold_supported = excluded.legal_hold_supported,
      destructive_prune_allowed = excluded.destructive_prune_allowed,
      backup_requirement = excluded.backup_requirement,
      restore_source = excluded.restore_source,
      owner_team = excluded.owner_team,
      notes = excluded.notes,
      updated_at = timezone('utc', now());

commit;
