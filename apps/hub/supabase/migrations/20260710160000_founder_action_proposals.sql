-- Founder Intelligence F3 (2026-07-10) — the governed-action proposal ledger.
--
-- Every write the assistant proposes lands here as a row the owner must
-- explicitly confirm. The row is the authoritative forward-ledger of the
-- action's disposition (pending → executing → executed | conflict | expired)
-- and threads the propose audit row to the execute audit row via its id.
--
-- FLAG-DARK: nothing reads or writes this until FOUNDER_ACTIONS_LIVE=1 (and the
-- surface flag NEXT_PUBLIC_FOUNDER_INTELLIGENCE_LIVE). Apply at activation.
--
-- Posture (the founder_intelligence_* lockbox idiom, F2):
--   • RLS enabled, default-deny.
--   • ALL writes service-role from the hub (propose + confirm routes).
--   • SELECT is owner-only AND row-owner-only (a second admin must not read
--     the founder's proposals), through the F2 SECURITY DEFINER gate.
--   • write grants revoked (the sec_harden_08 latent-grant lesson).

create table if not exists public.founder_action_proposals (
  token uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  action_key text not null,
  params jsonb not null default '{}'::jsonb,
  -- The server-fetched true state at propose time (money/status snapshot the
  -- owner reviewed) — the drift-check baseline.
  true_state jsonb not null default '{}'::jsonb,
  rationale text,
  status text not null default 'pending'
    check (status in ('pending', 'executing', 'executed', 'conflict', 'expired', 'failed')),
  execution_ref text,
  audit_id uuid,
  created_at timestamptz not null default now(),
  claimed_at timestamptz,
  resolved_at timestamptz,
  -- Viewing TTL (15 min) is decoupled from the confirm-time reauth window
  -- (5 min, enforced independently in the route) — audit fix #7.
  expires_at timestamptz not null default (now() + interval '15 minutes')
);

create index if not exists founder_action_proposals_user_idx
  on public.founder_action_proposals (user_id, created_at desc);

-- Propose-flood containment (audit fix #7): one live pending proposal per
-- (owner, action, params-fingerprint) — a re-proposal of the same thing is a
-- conflict, not a second card. params_fingerprint is a stable md5 of the
-- action key + sorted params, written by the propose route.
alter table public.founder_action_proposals
  add column if not exists params_fingerprint text;

create unique index if not exists founder_action_proposals_pending_dedupe
  on public.founder_action_proposals (user_id, params_fingerprint)
  where status = 'pending';

alter table public.founder_action_proposals enable row level security;

create policy founder_action_proposals_owner_read
  on public.founder_action_proposals
  for select
  to authenticated
  using (
    public.founder_intelligence_is_owner()
    and user_id = auth.uid()
  );

revoke insert, update, delete, truncate on public.founder_action_proposals from anon, authenticated;
