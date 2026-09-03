-- ============================================================================
-- FAITHFUL PROD CAPTURE — V3-RECONCILE-01 (2026-06-21)
-- prod migration: version=20260602041048  name=cms_phase1_publish_workflow_drafts_revisions
-- project: rzkbgwuznmdxnnhmjazy (HENRY ONYX)
-- classification: GENUINE_GAP (applied on prod; no app-folder migration file existed)
--
-- BYTE-FAITHFUL capture of the SQL prod actually applied for this migration
-- (supabase_migrations.schema_migrations.statements). Recorded so the repo
-- migration record mirrors prod. Like supabase/prod-actual/schema.sql this is a
-- REFERENCE capture: NOT part of any app auto-apply chain, and must NOT be
-- re-applied to prod (these objects already exist there). See
-- supabase/prod-actual/captured-migrations/README.md and
-- .codex-temp/v3-reconcile-01/report.md.
-- ============================================================================

-- Phase 1 (CMS) — publish state machine + draft buffer + revision history.
-- Additive + reversible. New owner-only tables reuse the platform is_owner()
-- RLS convention, so the CMS edits via the authenticated owner session.

alter table public.company_pages
  add column if not exists status text not null default 'draft'
    check (status in ('draft','in_review','published','archived')),
  add column if not exists published_at timestamptz,
  add column if not exists published_by uuid,
  add column if not exists version bigint not null default 1,
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid,
  add column if not exists locale_overrides jsonb not null default '{}'::jsonb;

-- Backfill existing live rows so status matches their current is_published truth.
update public.company_pages
   set status = 'published',
       published_at = coalesce(published_at, updated_at)
 where is_published = true and status = 'draft';

-- Owner-only draft buffer (drafts NEVER on the anon-readable company_pages row).
create table if not exists public.company_page_drafts (
  page_slug   text primary key,
  draft       jsonb not null default '{}'::jsonb,
  author_id   uuid,
  updated_at  timestamptz not null default now()
);
alter table public.company_page_drafts enable row level security;
create policy "company_page_drafts_owner_all" on public.company_page_drafts
  for all to authenticated using (is_owner()) with check (is_owner());

-- Append-only revision history — every publish an immutable, restorable snapshot.
create table if not exists public.company_page_revisions (
  id          uuid primary key default gen_random_uuid(),
  page_slug   text not null,
  revision_no bigint not null,
  snapshot    jsonb not null,
  author_id   uuid,
  label       text,
  created_at  timestamptz not null default now()
);
alter table public.company_page_revisions enable row level security;
create policy "company_page_revisions_owner_all" on public.company_page_revisions
  for all to authenticated using (is_owner()) with check (is_owner());
create index if not exists company_page_revisions_slug_idx
  on public.company_page_revisions(page_slug, revision_no desc);
