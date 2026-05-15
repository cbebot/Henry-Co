-- V3 PASS 21 — Studio: extend studio_revisions with versioning.
--
-- WHY:
--   The original studio_revisions table (2026-04-02 init) has:
--     id, project_id, requested_by, summary, status, timestamps.
--   V3 PASS 21 distinctive surface #4 (revision cycle with versioning)
--   needs:
--     * version int (incremented on each new revision request for a
--       project so the audit trail is "v1 → v2 → v3" not just "open").
--     * requested_by_user_id (link to auth.users for RLS),
--     * client_email (envelope address when caller is anonymous),
--     * attached_files jsonb (file ids referenced in the request),
--     * reviewed_at + approved_by_pm_user_id + reviewer_notes,
--     * before/after Cloudinary public ids for the version-compare view.
--   The new columns are additive: existing rows continue to satisfy NOT NULL
--   constraints (none of the new columns are NOT NULL).
--
-- TABLE-OPS:
--   public.studio_revisions (ALTER): add 9 columns + 2 indexes.
--
-- RLS: existing studio_member_revisions policy already gates by project
-- membership via studio_role_memberships; the new columns do not change
-- the predicate surface. Add a separate INSERT policy gate for clients
-- who own the project (mirror the studio_payments client INSERT pattern
-- from the client-portal migration).
--
-- DOWN: revert the new columns + the new client INSERT policy.

alter table public.studio_revisions
  add column if not exists version integer not null default 1,
  add column if not exists requested_by_user_id uuid references auth.users(id) on delete set null,
  add column if not exists client_email text,
  add column if not exists attached_files jsonb not null default '[]'::jsonb,
  add column if not exists reviewed_at timestamptz,
  add column if not exists approved_by_pm_user_id uuid references auth.users(id) on delete set null,
  add column if not exists reviewer_notes text,
  add column if not exists before_public_id text,
  add column if not exists after_public_id text,
  add column if not exists rejected_reason text,
  add column if not exists deliverable_id uuid references public.studio_deliverables(id) on delete set null;

create index if not exists studio_revisions_project_version_idx
  on public.studio_revisions (project_id, version desc);

create index if not exists studio_revisions_requested_by_idx
  on public.studio_revisions (requested_by_user_id, created_at desc)
  where requested_by_user_id is not null;

create index if not exists studio_revisions_email_idx
  on public.studio_revisions (lower(client_email), created_at desc)
  where client_email is not null;

-- ─────────────────────────────────────────────────────────────────────
-- Client-side INSERT: authenticated clients can request revisions on
-- projects where they are the client (studio_projects.client_user_id
-- matches auth.uid() — mirror the studio_payments insert policy).
-- ─────────────────────────────────────────────────────────────────────

drop policy if exists studio_client_revisions_insert on public.studio_revisions;
create policy studio_client_revisions_insert on public.studio_revisions
  for insert
  with check (
    auth.uid() is not null
    and requested_by_user_id = auth.uid()
    and exists (
      select 1
      from public.studio_projects sp
      where sp.id = studio_revisions.project_id
        and sp.client_user_id = auth.uid()
    )
  );

drop policy if exists studio_client_revisions_select on public.studio_revisions;
create policy studio_client_revisions_select on public.studio_revisions
  for select
  using (
    requested_by_user_id = auth.uid()
    or exists (
      select 1
      from public.studio_projects sp
      where sp.id = studio_revisions.project_id
        and sp.client_user_id = auth.uid()
    )
  );

comment on column public.studio_revisions.version is
  'V3 PASS 21 — revision sequence number per project. Increments on each new '
  'revision request for the same project so the audit trail reads v1 → v2 → '
  'v3 not just "open / closed". Set server-side on insert via a trigger or '
  'application logic (max(version) + 1 per project_id).';

comment on column public.studio_revisions.attached_files is
  'V3 PASS 21 — jsonb array of studio_project_files.id strings referenced in '
  'the revision request (e.g. "fix the bullet point on slide 3 — see file X"). '
  'Stored as jsonb (not text[] uuid[]) so attachments can carry context: '
  '[{"id": "...", "note": "..."}].';

comment on column public.studio_revisions.before_public_id is
  'V3 PASS 21 — Cloudinary public_id of the "before" asset used in the '
  'RevisionVersionCompare view (left side). May be the original deliverable '
  'or the previous revision''s after.';

comment on column public.studio_revisions.after_public_id is
  'V3 PASS 21 — Cloudinary public_id of the "after" asset uploaded by the '
  'PM/delivery team when this revision is fulfilled. Drives the right side '
  'of the RevisionVersionCompare view.';

-- end of migration --
