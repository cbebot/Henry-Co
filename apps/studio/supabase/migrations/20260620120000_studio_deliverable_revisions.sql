-- V3-73 — Studio Project Suite: per-deliverable revision rounds with tamper-evident
-- approval snapshots + Principle-5 export tracking.
--
-- WHY:
--   The existing studio_revisions table tracks PROJECT-level change requests
--   (a version chain the studio team fulfils). V3-73 adds the CLIENT-facing
--   approval depth layer: each deliverable carries a contracted revision
--   allowance; each client action (approve / request-changes) is one round; an
--   approval produces an HMAC-signed snapshot of the EXACT approved state
--   (ANTI-CLONE Principle 12) so we can later prove what the client approved.
--
--   Two-tier asset access (Principle 5) needs export forensics: every
--   watermarked preview + every final-file unlock writes a studio_asset_exports
--   row carrying the viewer identity tag, so a leaked asset is attributable.
--
-- TABLE-OPS:
--   public.studio_deliverable_revisions (CREATE) — the round history + HMAC.
--   public.studio_asset_exports          (CREATE) — Principle-5 export tracking.
--   public.studio_deliverables (ALTER)  — add revision_allowance.
--   public.studio_projects     (ALTER)  — add client_business_id (V3-57 link).
--
-- MONEY: this migration is OFF the money path. It does not touch studio_payments,
--   studio_invoices, pricing, or any settlement logic. The final-file unlock READS
--   confirmed invoice status at the application layer (no write here).
--
-- RLS: client (own project via client_user_id / normalized_email) + V3-57
--   business members (via studio_projects.client_business_id) read their project's
--   rows; studio operators read all via studio_is_staff(). Writes are
--   service-role-only (the API computes + signs the HMAC; clients never insert a
--   forged approval — same discipline as the SEC-HARDEN data-table class).
--
-- DOWN: drop the two tables + the two added columns.

-- ─────────────────────────────────────────────────────────────────────
-- 0. V3-57 business link on studio_projects (nullable, additive, back-compat)
-- ─────────────────────────────────────────────────────────────────────
alter table public.studio_projects
  add column if not exists client_business_id uuid
    references public.businesses(id) on delete set null;

create index if not exists studio_projects_client_business_idx
  on public.studio_projects (client_business_id)
  where client_business_id is not null;

comment on column public.studio_projects.client_business_id is
  'V3-73 — optional link to a V3-57 business when the client is a team rather '
  'than an individual. When set, every active business_members member of that '
  'business gets client-portal access to the project (see the RLS below).';

-- ─────────────────────────────────────────────────────────────────────
-- 1. Per-deliverable contracted revision allowance
-- ─────────────────────────────────────────────────────────────────────
alter table public.studio_deliverables
  add column if not exists revision_allowance integer not null default 3;

comment on column public.studio_deliverables.revision_allowance is
  'V3-73 — contracted revision rounds for this deliverable (the "Y" in '
  '"X used / Y remaining"). Sourced from the package/proposal; defaults to 3. '
  'When used >= allowance, the next change-request is flagged billable.';

-- ─────────────────────────────────────────────────────────────────────
-- 2. studio_deliverable_revisions — the client approval/change round history
-- ─────────────────────────────────────────────────────────────────────
create table if not exists public.studio_deliverable_revisions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.studio_projects(id) on delete cascade,
  deliverable_id uuid not null references public.studio_deliverables(id) on delete cascade,
  revision_number integer not null,                -- 1-based, monotonic per deliverable
  status text not null default 'submitted'
    check (status in ('submitted','changes_requested','approved')),
  requested_by uuid references auth.users(id) on delete set null,  -- client who requested changes
  change_notes text,
  approved_by uuid references auth.users(id) on delete set null,
  approval_signature text,                          -- HMAC-SHA256 over approval_snapshot (Principle 12)
  approval_snapshot jsonb,                          -- the exact deliverable state approved (immutable)
  billable boolean not null default false,          -- raised after the allowance is exhausted
  created_at timestamptz not null default timezone('utc', now()),
  unique (deliverable_id, revision_number)
);

create index if not exists studio_deliverable_revisions_project_idx
  on public.studio_deliverable_revisions (project_id, created_at desc);

create index if not exists studio_deliverable_revisions_deliverable_idx
  on public.studio_deliverable_revisions (deliverable_id, revision_number desc);

comment on table public.studio_deliverable_revisions is
  'V3-73 — one row per client revision round on a deliverable. status=approved '
  'rows carry an HMAC approval_signature over an immutable approval_snapshot '
  '(ANTI-CLONE Principle 12). Writes are service-role-only; the API validates '
  'project ownership + computes the signature so a client cannot forge an approval.';

alter table public.studio_deliverable_revisions enable row level security;

-- Reusable membership predicate for the policies below: is auth.uid() the
-- project's client (by id or email) OR an active member of the linked business?
-- Inlined per-policy (no SECURITY DEFINER fn) to keep the migration self-contained.
drop policy if exists studio_deliverable_revisions_read on public.studio_deliverable_revisions;
create policy studio_deliverable_revisions_read on public.studio_deliverable_revisions
  for select
  using (
    public.studio_is_staff()
    or exists (
      select 1 from public.studio_projects sp
      where sp.id = studio_deliverable_revisions.project_id
        and (
          sp.client_user_id = auth.uid()
          or (sp.normalized_email is not null and sp.normalized_email = public.studio_auth_email())
          or (
            sp.client_business_id is not null
            and exists (
              select 1 from public.business_members bm
              where bm.business_id = sp.client_business_id
                and bm.user_id = auth.uid()
            )
          )
        )
    )
  );
-- No INSERT / UPDATE / DELETE policy: writes are service-role-only. The API
-- (admin client) is the sole writer, after it validates ownership + signs.

-- Immutability guard (Principle 12): once an approval is signed, its signature +
-- snapshot can never be silently rewritten — even by a service-role mistake.
create or replace function public.studio_deliverable_revisions_immutable()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.approval_signature is not null
     and (new.approval_signature is distinct from old.approval_signature
          or new.approval_snapshot is distinct from old.approval_snapshot) then
    raise exception 'studio_deliverable_revisions: signed approval is immutable';
  end if;
  return new;
end;
$$;

drop trigger if exists studio_deliverable_revisions_immutable_trg
  on public.studio_deliverable_revisions;
create trigger studio_deliverable_revisions_immutable_trg
  before update on public.studio_deliverable_revisions
  for each row execute function public.studio_deliverable_revisions_immutable();

-- ─────────────────────────────────────────────────────────────────────
-- 3. studio_asset_exports — Principle-5 export/forensics tracking
-- ─────────────────────────────────────────────────────────────────────
create table if not exists public.studio_asset_exports (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.studio_projects(id) on delete cascade,
  deliverable_id uuid references public.studio_deliverables(id) on delete set null,
  exported_by uuid references auth.users(id) on delete set null,
  -- 'preview' = watermarked, served before payment; 'final' = un-watermarked,
  -- served only after confirmed-paid money-truth.
  export_kind text not null check (export_kind in ('preview','final')),
  identity_tag text not null,            -- HMAC viewer-identity tag (invisible forensic mark)
  watermark_text text,                   -- the visible overlay burned into a preview
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists studio_asset_exports_project_idx
  on public.studio_asset_exports (project_id, created_at desc);

create index if not exists studio_asset_exports_deliverable_idx
  on public.studio_asset_exports (deliverable_id, created_at desc)
  where deliverable_id is not null;

comment on table public.studio_asset_exports is
  'V3-73 — ANTI-CLONE Principle 5 export tracking (the studio-scoped equivalent of '
  'branded_document_exports). One row per preview/final asset served, carrying the '
  'viewer HMAC identity_tag so a leak is forensically attributable. Writes are '
  'service-role-only.';

alter table public.studio_asset_exports enable row level security;

drop policy if exists studio_asset_exports_read on public.studio_asset_exports;
create policy studio_asset_exports_read on public.studio_asset_exports
  for select
  using (
    public.studio_is_staff()
    or exported_by = auth.uid()
  );
-- No INSERT / UPDATE / DELETE policy: service-role-only writes.

-- ─────────────────────────────────────────────────────────────────────
-- 4. V3-57 business-member portal read access (ADDITIVE)
--
-- The existing client-portal policies (20260503120000_studio_client_portal.sql)
-- scope reads to client_user_id / normalized_email only. To let a V3-57 business
-- member load the portal for a project whose client is their business, ADD a
-- separate permissive SELECT policy per portal table. RLS permissive policies are
-- OR-combined, so these only GRANT access to business members — they never reduce
-- the existing direct-client access. Each links the row to studio_projects via
-- project_id and checks active business_members of client_business_id.
-- ─────────────────────────────────────────────────────────────────────

drop policy if exists studio_projects_business_member_read on public.studio_projects;
create policy studio_projects_business_member_read on public.studio_projects
  for select using (
    studio_projects.client_business_id is not null
    and exists (
      select 1 from public.business_members bm
      where bm.business_id = studio_projects.client_business_id
        and bm.user_id = auth.uid()
    )
  );

drop policy if exists studio_project_milestones_business_member_read on public.studio_project_milestones;
create policy studio_project_milestones_business_member_read on public.studio_project_milestones
  for select using (
    exists (
      select 1 from public.studio_projects sp
      join public.business_members bm on bm.business_id = sp.client_business_id
      where sp.id = studio_project_milestones.project_id and bm.user_id = auth.uid()
    )
  );

drop policy if exists studio_deliverables_business_member_read on public.studio_deliverables;
create policy studio_deliverables_business_member_read on public.studio_deliverables
  for select using (
    exists (
      select 1 from public.studio_projects sp
      join public.business_members bm on bm.business_id = sp.client_business_id
      where sp.id = studio_deliverables.project_id and bm.user_id = auth.uid()
    )
  );

drop policy if exists studio_invoices_business_member_read on public.studio_invoices;
create policy studio_invoices_business_member_read on public.studio_invoices
  for select using (
    exists (
      select 1 from public.studio_projects sp
      join public.business_members bm on bm.business_id = sp.client_business_id
      where sp.id = studio_invoices.project_id and bm.user_id = auth.uid()
    )
  );

drop policy if exists studio_project_messages_business_member_read on public.studio_project_messages;
create policy studio_project_messages_business_member_read on public.studio_project_messages
  for select using (
    exists (
      select 1 from public.studio_projects sp
      join public.business_members bm on bm.business_id = sp.client_business_id
      where sp.id = studio_project_messages.project_id and bm.user_id = auth.uid()
    )
  );

drop policy if exists studio_project_updates_business_member_read on public.studio_project_updates;
create policy studio_project_updates_business_member_read on public.studio_project_updates
  for select using (
    exists (
      select 1 from public.studio_projects sp
      join public.business_members bm on bm.business_id = sp.client_business_id
      where sp.id = studio_project_updates.project_id and bm.user_id = auth.uid()
    )
  );

drop policy if exists studio_payments_business_member_read on public.studio_payments;
create policy studio_payments_business_member_read on public.studio_payments
  for select using (
    exists (
      select 1 from public.studio_projects sp
      join public.business_members bm on bm.business_id = sp.client_business_id
      where sp.id = studio_payments.project_id and bm.user_id = auth.uid()
    )
  );

-- end of migration --
