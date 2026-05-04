-- CHROME-02 — Employer subscription gate (soft-fail by default).
--
-- Posting roles on HenryCo Jobs requires an active employer subscription.
-- Until the operator applies this migration AND seeds at least one
-- active row, `isEmployerSubscribed()` reports `soft-fail` and the
-- create-job server action allows the post (with a visible notice on
-- the new-job page so the employer can self-correct ahead of
-- enforcement).
--
-- Once rows exist:
--   * status = 'active'  AND expires_at > now() → posting allowed
--   * status = 'expired' OR 'cancelled'         → posting blocked
--   * no row for the employer                    → soft-fail allowed
--
-- The plan_key column is free-text on purpose so the operator can
-- set the price ladder without a code change. Suggested keys:
-- 'free' (legacy), 'basic', 'professional', 'enterprise'.

create table if not exists public.jobs_employer_subscriptions (
  id uuid primary key default gen_random_uuid(),
  employer_slug text not null,
  plan_key text not null default 'basic',
  status text not null default 'active'
    check (status in ('active', 'expired', 'cancelled', 'past_due')),
  started_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz,
  cancelled_at timestamptz,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists jobs_employer_subscriptions_employer_idx
  on public.jobs_employer_subscriptions(employer_slug);
create index if not exists jobs_employer_subscriptions_status_idx
  on public.jobs_employer_subscriptions(status);
create index if not exists jobs_employer_subscriptions_expires_idx
  on public.jobs_employer_subscriptions(expires_at);

alter table public.jobs_employer_subscriptions enable row level security;

-- Reads from the admin client only (server-side eligibility check). No
-- public read policy. The check runs through createAdminSupabase() and
-- bypasses RLS, so we deliberately leave the table closed to anon/auth
-- roles.
drop policy if exists jobs_employer_subscriptions_admin_only on public.jobs_employer_subscriptions;
create policy jobs_employer_subscriptions_admin_only on public.jobs_employer_subscriptions
for all using (false) with check (false);
