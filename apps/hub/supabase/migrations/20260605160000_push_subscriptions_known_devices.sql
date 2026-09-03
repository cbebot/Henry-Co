-- Sign-in Security Alerts + Push Engine (2026-06-05)
-- Adds the push-channel token store + the new-device memory. Additive only.
--
--  push_subscriptions   — web-push (RFC 8291) + Expo tokens per user+device. The
--                         token store the @henryco/push dispatcher reads.
--  account_known_devices — the "known device" memory for new-device detection +
--                         the "Was this you? Yes/No" trust state. Grandfathers a
--                         user's first device(s) so existing users are not mass-
--                         alerted on their first post-deploy sign-in.

create extension if not exists "pgcrypto";

-- ── push_subscriptions ──────────────────────────────────────────────────────
create table if not exists public.push_subscriptions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  channel       text not null check (channel in ('web', 'expo')),
  -- web push (RFC 8291): endpoint + client public keys
  endpoint      text,
  p256dh        text,
  auth          text,
  -- native push (Expo)
  expo_token    text,
  -- ties the subscription to the signed hc_device cookie + the sign-in device
  device_id     text,
  ua_summary    text,
  created_at    timestamptz not null default now(),
  last_used_at  timestamptz not null default now(),
  revoked_at    timestamptz,
  failure_count integer not null default 0,
  -- exactly one credential shape per row
  constraint push_sub_credential_ck check (
    (channel = 'web'  and endpoint is not null and p256dh is not null and auth is not null and expo_token is null)
    or
    (channel = 'expo' and expo_token is not null and endpoint is null)
  )
);

-- one active subscription per credential per user (re-subscribe upserts)
create unique index if not exists push_sub_web_uq
  on public.push_subscriptions (user_id, endpoint)
  where channel = 'web' and revoked_at is null;
create unique index if not exists push_sub_expo_uq
  on public.push_subscriptions (user_id, expo_token)
  where channel = 'expo' and revoked_at is null;
create index if not exists push_sub_user_active_idx
  on public.push_subscriptions (user_id)
  where revoked_at is null;

alter table public.push_subscriptions enable row level security;

-- The owner can see + remove their own devices on the security page. All server
-- writes (register/prune/upsert) go through the service-role client, which
-- bypasses RLS — so no INSERT/UPDATE policy is granted to end users.
drop policy if exists push_sub_owner_select on public.push_subscriptions;
create policy push_sub_owner_select on public.push_subscriptions
  for select using ((select auth.uid()) = user_id);
drop policy if exists push_sub_owner_delete on public.push_subscriptions;
create policy push_sub_owner_delete on public.push_subscriptions
  for delete using ((select auth.uid()) = user_id);

-- ── account_known_devices ───────────────────────────────────────────────────
create table if not exists public.account_known_devices (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  device_id     text not null,
  ua_summary    text,
  first_country text,
  first_seen_at timestamptz not null default now(),
  last_seen_at  timestamptz not null default now(),
  trusted_at    timestamptz,           -- set by "Yes, it was me"
  revoked_at    timestamptz,           -- set by "No" / device removal
  unique (user_id, device_id)
);
create index if not exists known_devices_user_active_idx
  on public.account_known_devices (user_id)
  where revoked_at is null;

alter table public.account_known_devices enable row level security;

drop policy if exists known_devices_owner_select on public.account_known_devices;
create policy known_devices_owner_select on public.account_known_devices
  for select using ((select auth.uid()) = user_id);
