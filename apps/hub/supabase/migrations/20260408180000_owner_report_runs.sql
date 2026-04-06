create table if not exists public.owner_report_runs (
  id uuid primary key default gen_random_uuid(),
  report_kind text not null check (report_kind in ('weekly', 'monthly')),
  period_key text not null,
  period_label text not null,
  recipient_email text not null,
  subject text null,
  status text not null default 'queued' check (status in ('queued', 'sent', 'failed', 'skipped')),
  provider_message_id text null,
  error_message text null,
  payload jsonb not null default '{}'::jsonb,
  sent_at timestamptz null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists owner_report_runs_kind_period_recipient_idx
  on public.owner_report_runs (report_kind, period_key, recipient_email);

create index if not exists owner_report_runs_status_created_idx
  on public.owner_report_runs (status, created_at desc);
