-- V3-AI-VERIFY (property) — durable "Henry Onyx Verified" trust record for property listings.
--
-- Mirrors the marketplace precedent (20260627130000_v3_ai_verify_01_listing_verifications.sql)
-- exactly, adapted to property's schema. Makes the AI trust review a real, persisted,
-- buyer-visible signal instead of an ephemeral panel result. Adds, alongside the existing
-- property schema (nothing existing altered):
--   * property_listing_verifications — an APPEND-ONLY audit of every AI review.
--   * property_listings.henry_onyx_verified (+ _at) — the durable public badge flag, in a
--     DEDICATED column no upsert/edit path resets.
--   * record_property_listing_verification(...) — the ONLY writer: a SECURITY DEFINER fn that
--     records the audit row and sets/clears the badge from the resolved verdict, with the IDOR
--     ownership guard INSIDE the function. service_role-only.
--
-- The AI verdict AUGMENTS human moderation: a `verified` outcome awards the badge (revocable by
-- staff); `review`/`reject` clear it and route to a human. The badge never publishes a listing —
-- go-live still flows through the listing's own submit/approve/status pipeline.
--
-- Flag-dark: only written when the property.listing.verify surface is enabled. Additive +
-- idempotent. Prove on a throwaway DB (see __proofs__/property-verify.proof.mjs).

-- 1. The durable public badge flag — a dedicated column the upsert/edit path never resets.
alter table public.property_listings
  add column if not exists henry_onyx_verified boolean not null default false;
alter table public.property_listings
  add column if not exists henry_onyx_verified_at timestamptz;

-- 2. Append-only audit of every review.
create table if not exists public.property_listing_verifications (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.property_listings(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  ai_usage_event_id text,
  outcome text not null check (outcome in ('verified', 'review', 'reject')),
  trust_score integer not null default 0 check (trust_score between 0 and 100),
  honest boolean not null default false,
  ai_generated_media boolean not null default false,
  matches_standards boolean not null default false,
  safe_to_post boolean not null default false,
  reasons jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);
create index if not exists property_listing_verifications_listing_idx
  on public.property_listing_verifications (listing_id, created_at desc);
create index if not exists property_listing_verifications_user_idx
  on public.property_listing_verifications (user_id, created_at desc);

-- 3. RLS default-deny: a requester reads their OWN verification history; no client writes (the
--    SECURITY DEFINER fn is the only writer). Staff/admin read via service-role.
alter table public.property_listing_verifications enable row level security;
revoke all on public.property_listing_verifications from anon;
revoke insert, update, delete, truncate on public.property_listing_verifications from authenticated, service_role;
grant select on public.property_listing_verifications to authenticated;
drop policy if exists property_listing_verifications_select_own on public.property_listing_verifications;
create policy property_listing_verifications_select_own on public.property_listing_verifications
  for select to authenticated
  using (user_id = (select auth.uid()));

-- 4. The ONLY writer: record the audit row + set/clear the durable badge from the verdict.
--    SECURITY DEFINER, search_path pinned, service_role-only.
create or replace function public.record_property_listing_verification(
  p_listing_id uuid,
  p_user_id uuid,
  p_outcome text,
  p_trust_score integer,
  p_honest boolean,
  p_ai_generated_media boolean,
  p_matches_standards boolean,
  p_safe_to_post boolean,
  p_reasons jsonb,
  p_ai_usage_event_id text
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
begin
  if p_outcome not in ('verified', 'review', 'reject') then
    raise exception 'record_property_listing_verification: invalid outcome %', p_outcome using errcode = 'check_violation';
  end if;

  -- AUTHORIZATION (IDOR guard): this fn is SECURITY DEFINER and sets a public trust badge, so it
  -- MUST verify the actor owns the listing before touching it — otherwise a user could award or
  -- revoke the badge on ANOTHER user's listing by passing its id. The actor must be the
  -- listing's owner (owner_user_id) or an active property staff member (admin / managed-ops).
  -- (A null listing is a pre-save dry run — audited under the actor, affects no listing.)
  if p_listing_id is not null then
    if not exists (
      select 1
      from public.property_listings pl
      where pl.id = p_listing_id
        and (
          pl.owner_user_id = p_user_id
          or exists (
            select 1
            from public.property_role_memberships m
            where m.user_id = p_user_id
              and m.is_active = true
              and m.role in ('property_admin', 'managed_ops')
          )
        )
    ) then
      raise exception 'record_property_listing_verification: actor % is not authorized for listing %', p_user_id, p_listing_id
        using errcode = 'insufficient_privilege';
    end if;
  end if;

  insert into public.property_listing_verifications
    (listing_id, user_id, ai_usage_event_id, outcome, trust_score,
     honest, ai_generated_media, matches_standards, safe_to_post, reasons)
  values
    (p_listing_id, p_user_id, p_ai_usage_event_id, p_outcome, coalesce(p_trust_score, 0),
     coalesce(p_honest, false), coalesce(p_ai_generated_media, false),
     coalesce(p_matches_standards, false), coalesce(p_safe_to_post, false),
     coalesce(p_reasons, '[]'::jsonb))
  returning id into v_id;

  -- Set/clear the durable badge. `verified` awards it; a later `review`/`reject` revokes a
  -- now-stale badge. Only when a listing row is provided (a pre-save review just audits).
  if p_listing_id is not null then
    if p_outcome = 'verified' then
      update public.property_listings
         set henry_onyx_verified = true, henry_onyx_verified_at = timezone('utc', now()), updated_at = timezone('utc', now())
       where id = p_listing_id;
    else
      update public.property_listings
         set henry_onyx_verified = false, henry_onyx_verified_at = null, updated_at = timezone('utc', now())
       where id = p_listing_id;
    end if;
  end if;

  return jsonb_build_object('verification_id', v_id, 'outcome', p_outcome, 'badge', p_outcome = 'verified');
end;
$$;

revoke all     on function public.record_property_listing_verification(uuid, uuid, text, integer, boolean, boolean, boolean, boolean, jsonb, text) from public, anon, authenticated;
grant  execute on function public.record_property_listing_verification(uuid, uuid, text, integer, boolean, boolean, boolean, boolean, jsonb, text) to service_role;
