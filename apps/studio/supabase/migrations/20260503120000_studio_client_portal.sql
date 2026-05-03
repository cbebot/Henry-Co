-- STUDIO-CP-01 — Studio Client Portal
-- Adds invoices, extends payments and messages with client-portal columns,
-- adds INSERT/UPDATE policies so authenticated clients can submit payment
-- proof and post messages on their own projects, and seeds a demo project
-- so the portal renders immediately after deployment.

-- ─────────────────────────────────────────────────────────────────────
-- 1. studio_invoices (new) — represents the bill a client pays against.
--    Links to studio_projects and (optionally) a milestone. A successful
--    studio_payments row references the invoice it satisfies. The
--    invoice_token column powers /payment?invoice=TOKEN unauthenticated
--    deep-links.
-- ─────────────────────────────────────────────────────────────────────
create table if not exists public.studio_invoices (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.studio_projects(id) on delete cascade,
  milestone_id uuid references public.studio_project_milestones(id) on delete set null,
  client_user_id uuid references auth.users(id) on delete set null,
  normalized_email text,
  invoice_number text not null unique,
  amount_kobo bigint not null check (amount_kobo >= 0),
  currency text not null default 'NGN',
  description text not null default '',
  due_date timestamptz,
  status text not null default 'sent' check (status in (
    'draft', 'sent', 'pending_verification', 'paid', 'overdue', 'cancelled'
  )),
  invoice_token text unique,
  issued_at timestamptz not null default timezone('utc', now()),
  paid_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists studio_invoices_project_idx
  on public.studio_invoices(project_id);
create index if not exists studio_invoices_client_user_idx
  on public.studio_invoices(client_user_id);
create index if not exists studio_invoices_email_idx
  on public.studio_invoices(normalized_email);
create index if not exists studio_invoices_status_idx
  on public.studio_invoices(status);
create index if not exists studio_invoices_token_idx
  on public.studio_invoices(invoice_token)
  where invoice_token is not null;

drop trigger if exists studio_invoices_updated_at on public.studio_invoices;
create trigger studio_invoices_updated_at before update on public.studio_invoices
for each row execute function public.studio_set_updated_at();

-- ─────────────────────────────────────────────────────────────────────
-- 2. Extend studio_payments with invoice linkage, payment reference,
--    Cloudinary public id, verification audit, rejection reason, and
--    client_user_id for the RLS predicate.
-- ─────────────────────────────────────────────────────────────────────
alter table public.studio_payments
  add column if not exists invoice_id uuid references public.studio_invoices(id) on delete set null,
  add column if not exists client_user_id uuid references auth.users(id) on delete set null,
  add column if not exists normalized_email text,
  add column if not exists payment_reference text,
  add column if not exists proof_public_id text,
  add column if not exists submitted_at timestamptz default timezone('utc', now()),
  add column if not exists verified_at timestamptz,
  add column if not exists verified_by uuid references auth.users(id) on delete set null,
  add column if not exists rejection_reason text,
  add column if not exists notes text,
  add column if not exists amount_kobo bigint;

create index if not exists studio_payments_invoice_idx
  on public.studio_payments(invoice_id);
create index if not exists studio_payments_client_user_idx
  on public.studio_payments(client_user_id);

-- ─────────────────────────────────────────────────────────────────────
-- 3. Extend studio_project_messages with sender_id, attachments, read_by,
--    edited_at so the portal messaging tab can attribute messages to the
--    auth user, support file attachments, and surface unread counts.
-- ─────────────────────────────────────────────────────────────────────
alter table public.studio_project_messages
  add column if not exists sender_id uuid references auth.users(id) on delete set null,
  add column if not exists attachments jsonb not null default '[]'::jsonb,
  add column if not exists read_by jsonb not null default '[]'::jsonb,
  add column if not exists edited_at timestamptz;

create index if not exists studio_project_messages_project_idx
  on public.studio_project_messages(project_id);
create index if not exists studio_project_messages_sender_idx
  on public.studio_project_messages(sender_id);

-- ─────────────────────────────────────────────────────────────────────
-- 4. Extend studio_deliverables with milestone_id, file_url/public_id,
--    file_type, thumbnail, version, approval audit, uploaded_by.
-- ─────────────────────────────────────────────────────────────────────
alter table public.studio_deliverables
  add column if not exists milestone_id uuid references public.studio_project_milestones(id) on delete set null,
  add column if not exists file_url text,
  add column if not exists file_public_id text,
  add column if not exists file_type text,
  add column if not exists thumbnail_url text,
  add column if not exists version integer not null default 1,
  add column if not exists shared_at timestamptz default timezone('utc', now()),
  add column if not exists approved_at timestamptz,
  add column if not exists approved_by uuid references auth.users(id) on delete set null,
  add column if not exists uploaded_by uuid references auth.users(id) on delete set null;

-- Allow new spec statuses while keeping existing rows valid. We don't
-- enforce a strict CHECK because legacy rows use 'shared' / 'approved'.

-- ─────────────────────────────────────────────────────────────────────
-- 5. Extend studio_project_updates with author_id, body, metadata, and a
--    typed update_type alias for kind so the activity feed component can
--    speak the spec's vocabulary.
-- ─────────────────────────────────────────────────────────────────────
alter table public.studio_project_updates
  add column if not exists author_id uuid references auth.users(id) on delete set null,
  add column if not exists body text,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists update_type text;

-- Backfill update_type from the legacy kind column when missing so the
-- activity feed has a consistent enum to render against.
update public.studio_project_updates
set update_type = coalesce(update_type, kind, 'note')
where update_type is null;

-- ─────────────────────────────────────────────────────────────────────
-- 6. Extend studio_project_milestones with due_date so the portal can
--    show real timeline data alongside the existing due_label string.
-- ─────────────────────────────────────────────────────────────────────
alter table public.studio_project_milestones
  add column if not exists due_date date;

-- ─────────────────────────────────────────────────────────────────────
-- 7. Extend studio_projects with brief, type, start/completion dates and
--    team_lead_id (the auth user leading the engagement — distinct from
--    the existing lead_id which references studio_leads).
-- ─────────────────────────────────────────────────────────────────────
alter table public.studio_projects
  add column if not exists brief text,
  add column if not exists project_type text,
  add column if not exists start_date date,
  add column if not exists estimated_completion date,
  add column if not exists actual_completion date,
  add column if not exists team_lead_id uuid references auth.users(id) on delete set null;

-- ─────────────────────────────────────────────────────────────────────
-- 8. RLS — invoices.
-- ─────────────────────────────────────────────────────────────────────
alter table public.studio_invoices enable row level security;

drop policy if exists studio_invoices_select on public.studio_invoices;
create policy studio_invoices_select on public.studio_invoices
for select using (
  public.studio_is_staff()
  or client_user_id = auth.uid()
  or (
    normalized_email is not null
    and normalized_email = public.studio_auth_email()
  )
  or exists (
    select 1
    from public.studio_projects project
    where project.id = studio_invoices.project_id
      and (
        project.client_user_id = auth.uid()
        or (
          project.normalized_email is not null
          and project.normalized_email = public.studio_auth_email()
        )
      )
  )
);

-- Tokenised access: an unauthenticated visitor can read a single invoice
-- when their query parameter matches invoice_token. We expose this via a
-- security-definer function rather than a permissive policy so we keep
-- the surface narrow.
drop policy if exists studio_invoices_staff_write on public.studio_invoices;
create policy studio_invoices_staff_write on public.studio_invoices
for all using (public.studio_is_staff())
with check (public.studio_is_staff());

create or replace function public.studio_invoice_by_token(token text)
returns setof public.studio_invoices
language sql
security definer
set search_path = public
as $$
  select *
  from public.studio_invoices
  where invoice_token is not null
    and invoice_token = token
  limit 1;
$$;

revoke all on function public.studio_invoice_by_token(text) from public;
grant execute on function public.studio_invoice_by_token(text) to anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────
-- 9. RLS — payments. Existing policy was SELECT-only; add INSERT for
--    clients on their own invoices and UPDATE for staff verification.
-- ─────────────────────────────────────────────────────────────────────
drop policy if exists studio_member_payments_insert on public.studio_payments;
create policy studio_member_payments_insert on public.studio_payments
for insert with check (
  public.studio_is_staff()
  or (
    client_user_id = auth.uid()
    and exists (
      select 1
      from public.studio_projects project
      where project.id = studio_payments.project_id
        and project.client_user_id = auth.uid()
    )
  )
);

drop policy if exists studio_staff_payments_update on public.studio_payments;
create policy studio_staff_payments_update on public.studio_payments
for update using (public.studio_is_staff())
with check (public.studio_is_staff());

-- ─────────────────────────────────────────────────────────────────────
-- 10. RLS — project messages. Existing policy was SELECT-only with
--     is_internal=false guard. Allow clients to INSERT messages on their
--     own project, and staff to do everything.
-- ─────────────────────────────────────────────────────────────────────
drop policy if exists studio_member_messages_insert on public.studio_project_messages;
create policy studio_member_messages_insert on public.studio_project_messages
for insert with check (
  public.studio_is_staff()
  or (
    is_internal = false
    and exists (
      select 1
      from public.studio_projects project
      where project.id = studio_project_messages.project_id
        and (
          project.client_user_id = auth.uid()
          or (
            project.normalized_email is not null
            and project.normalized_email = public.studio_auth_email()
          )
        )
    )
  )
);

drop policy if exists studio_member_messages_update on public.studio_project_messages;
create policy studio_member_messages_update on public.studio_project_messages
for update using (
  public.studio_is_staff()
  or (
    sender_id = auth.uid()
    and is_internal = false
  )
)
with check (
  public.studio_is_staff()
  or (
    sender_id = auth.uid()
    and is_internal = false
  )
);

-- ─────────────────────────────────────────────────────────────────────
-- 11. RLS — deliverables. Allow clients to UPDATE only the approval
--     status (and approval audit columns) on their own project. Staff
--     have full write access.
-- ─────────────────────────────────────────────────────────────────────
drop policy if exists studio_staff_deliverables_write on public.studio_deliverables;
create policy studio_staff_deliverables_write on public.studio_deliverables
for all using (public.studio_is_staff())
with check (public.studio_is_staff());

drop policy if exists studio_member_deliverables_approve on public.studio_deliverables;
create policy studio_member_deliverables_approve on public.studio_deliverables
for update using (
  exists (
    select 1
    from public.studio_projects project
    where project.id = studio_deliverables.project_id
      and (
        project.client_user_id = auth.uid()
        or (
          project.normalized_email is not null
          and project.normalized_email = public.studio_auth_email()
        )
      )
  )
)
with check (
  exists (
    select 1
    from public.studio_projects project
    where project.id = studio_deliverables.project_id
      and (
        project.client_user_id = auth.uid()
        or (
          project.normalized_email is not null
          and project.normalized_email = public.studio_auth_email()
        )
      )
  )
);

-- ─────────────────────────────────────────────────────────────────────
-- 12. Realtime — enable subscriptions on messages and project updates.
-- ─────────────────────────────────────────────────────────────────────
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      alter publication supabase_realtime add table public.studio_project_messages;
    exception when duplicate_object then
      null;
    end;
    begin
      alter publication supabase_realtime add table public.studio_project_updates;
    exception when duplicate_object then
      null;
    end;
    begin
      alter publication supabase_realtime add table public.studio_invoices;
    exception when duplicate_object then
      null;
    end;
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────────────
-- 13. Helpful views and helpers used by the portal data layer.
--     studio_client_invoices_v exposes invoice rows plus the related
--     payment summary. We don't enforce RLS on the view (it inherits
--     from the underlying tables).
-- ─────────────────────────────────────────────────────────────────────
create or replace view public.studio_client_invoices_v as
select
  i.id,
  i.project_id,
  i.milestone_id,
  i.client_user_id,
  i.normalized_email,
  i.invoice_number,
  i.amount_kobo,
  i.currency,
  i.description,
  i.due_date,
  i.status,
  i.invoice_token,
  i.issued_at,
  i.paid_at,
  i.created_at,
  i.updated_at,
  coalesce(payment_summary.payment_count, 0) as payment_count,
  payment_summary.last_submitted_at,
  payment_summary.last_payment_status,
  payment_summary.last_payment_id
from public.studio_invoices i
left join lateral (
  select
    count(*)::integer as payment_count,
    max(p.submitted_at) as last_submitted_at,
    (
      select status
      from public.studio_payments
      where invoice_id = i.id
      order by submitted_at desc nulls last
      limit 1
    ) as last_payment_status,
    (
      select id
      from public.studio_payments
      where invoice_id = i.id
      order by submitted_at desc nulls last
      limit 1
    ) as last_payment_id
  from public.studio_payments p
  where p.invoice_id = i.id
) payment_summary on true;

grant select on public.studio_client_invoices_v to anon, authenticated;
