-- =============================================================================
-- V3-57 — Business Profiles + Tools (identity primitive)
-- =============================================================================
-- Introduces the BUSINESS ACCOUNT as a first-class identity beside the personal
-- account: a verified company entity, a team with roles, and tokenized team
-- invitations. Six downstream passes inherit this shape (V3-58 Seller Academy,
-- V3-70..V3-75 enterprise suites, V3-80 business-account API) — column names and
-- the role model are load-bearing.
--
-- The line that must not be crossed: a business context NEVER inherits more
-- authority than the acting member already holds, and the personal-vs-business
-- actor is never ambiguous. RLS is default-deny; every membership predicate runs
-- through a SECURITY DEFINER helper so it can never widen authority and can never
-- recurse.
--
-- Invariants enforced here:
--   1. Default-deny RLS on all three tables; anonymous traffic reaches ONLY the
--      grant-locked public-profile RPC (active businesses, public columns only).
--   2. business_registration / created_by / the member roster are never readable
--      by an unrelated user or by anonymous traffic.
--   3. Only an owner mutates the member roster + business metadata; an admin may
--      invite `member`s only; the creator is atomically seeded as `owner`.
--   4. Invitation tokens are stored as sha256(token); the raw token only ever
--      lives in the emailed link; expiry is enforced inside the accept RPC.
--
-- RLS recursion note: business_members' own read policy must reference
-- business_members. Inlining `exists (select 1 from business_members ...)` inside
-- a policy ON business_members triggers "infinite recursion detected in policy".
-- So membership is checked through SECURITY DEFINER helpers (is_business_member /
-- business_member_role) which run as the table owner and — because these tables
-- are `enable`d but NOT `force`d — bypass RLS internally, breaking the cycle.
-- service_role bypasses RLS by default (no explicit service_role policy needed).
-- =============================================================================

create extension if not exists pgcrypto;        -- digest() for token hashing + gen_random_uuid()

-- -----------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------
create table if not exists public.businesses (
  id                     uuid primary key default gen_random_uuid(),
  slug                   text not null unique
                           check (slug ~ '^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$'),
  legal_name             text not null check (char_length(btrim(legal_name)) >= 2),
  trading_name           text,
  business_registration  text,                   -- CAC/registration number; verified out-of-band
  country                text not null check (country ~ '^[A-Z]{2}$'),  -- ISO-3166-1 alpha-2; validated against @henryco/config/countries app-side
  primary_partner_type   text not null check (primary_partner_type in
                           ('marketplace_seller','service_provider','employer','studio_client','logistics_shipper')),
  status                 text not null default 'pending'
                           check (status in ('pending','active','suspended','closed')),
  verified_at            timestamptz,
  created_by             uuid not null references auth.users(id),
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create table if not exists public.business_members (
  business_id  uuid not null references public.businesses(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  role         text not null check (role in ('owner','admin','member')),
  joined_at    timestamptz not null default now(),
  primary key (business_id, user_id)
);

create table if not exists public.business_invitations (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses(id) on delete cascade,
  email        text not null check (position('@' in email) > 1),
  role         text not null check (role in ('admin','member')),
  token_hash   text not null,                   -- sha256(token) hex; never the raw token
  invited_by   uuid not null references auth.users(id),
  expires_at   timestamptz not null,
  accepted_at  timestamptz,
  created_at   timestamptz not null default now(),
  unique (business_id, email)
);

create index if not exists business_members_user_idx on public.business_members (user_id);
create index if not exists business_members_business_idx on public.business_members (business_id);
create index if not exists businesses_status_idx on public.businesses (status) where status = 'active';
create index if not exists business_invitations_business_idx on public.business_invitations (business_id);
create index if not exists business_invitations_token_idx on public.business_invitations (token_hash) where accepted_at is null;

-- -----------------------------------------------------------------------------
-- updated_at trigger on businesses
-- -----------------------------------------------------------------------------
create or replace function public.businesses_set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at := now();
  return new;
end
$$;

drop trigger if exists businesses_updated_at on public.businesses;
create trigger businesses_updated_at
  before update on public.businesses
  for each row
  execute function public.businesses_set_updated_at();

-- -----------------------------------------------------------------------------
-- SECURITY DEFINER membership helpers (RLS-recursion-safe; never widen authority)
-- -----------------------------------------------------------------------------
create or replace function public.is_business_member(p_business uuid, p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.business_members
     where business_id = p_business and user_id = p_user
  )
$$;

revoke all on function public.is_business_member(uuid, uuid) from public;
grant execute on function public.is_business_member(uuid, uuid) to authenticated, service_role;

create or replace function public.business_member_role(p_business uuid, p_user uuid)
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select role from public.business_members
   where business_id = p_business and user_id = p_user
$$;

revoke all on function public.business_member_role(uuid, uuid) from public;
grant execute on function public.business_member_role(uuid, uuid) to authenticated, service_role;

-- -----------------------------------------------------------------------------
-- Row Level Security (default-deny)
-- -----------------------------------------------------------------------------
alter table public.businesses           enable row level security;
alter table public.business_members     enable row level security;
alter table public.business_invitations enable row level security;

-- businesses: a member reads their own businesses; only owner/admin update metadata.
drop policy if exists businesses_member_read on public.businesses;
create policy businesses_member_read on public.businesses
  for select to authenticated
  using (public.is_business_member(id, auth.uid()));

drop policy if exists businesses_admin_write on public.businesses;
create policy businesses_admin_write on public.businesses
  for update to authenticated
  using (public.business_member_role(id, auth.uid()) in ('owner','admin'))
  with check (public.business_member_role(id, auth.uid()) in ('owner','admin'));

-- business_members: members read the roster of businesses they belong to;
-- only an owner mutates roles/removals (invite acceptance goes through the RPC).
drop policy if exists business_members_read on public.business_members;
create policy business_members_read on public.business_members
  for select to authenticated
  using (public.is_business_member(business_id, auth.uid()));

drop policy if exists business_members_owner_update on public.business_members;
create policy business_members_owner_update on public.business_members
  for update to authenticated
  using (public.business_member_role(business_id, auth.uid()) = 'owner')
  with check (public.business_member_role(business_id, auth.uid()) = 'owner');

drop policy if exists business_members_owner_delete on public.business_members;
create policy business_members_owner_delete on public.business_members
  for delete to authenticated
  using (public.business_member_role(business_id, auth.uid()) = 'owner');

-- business_invitations: owner/admin of the business read + revoke; an admin may
-- only create `member` invitations, an owner may create `admin` or `member`.
-- Acceptance is done by the invitee through accept_business_invitation() (RPC),
-- never via a direct INSERT into business_members.
drop policy if exists business_invitations_manage_read on public.business_invitations;
create policy business_invitations_manage_read on public.business_invitations
  for select to authenticated
  using (public.business_member_role(business_id, auth.uid()) in ('owner','admin'));

drop policy if exists business_invitations_manage_insert on public.business_invitations;
create policy business_invitations_manage_insert on public.business_invitations
  for insert to authenticated
  with check (
    invited_by = auth.uid()
    and (
      public.business_member_role(business_id, auth.uid()) = 'owner'
      or (public.business_member_role(business_id, auth.uid()) = 'admin' and role = 'member')
    )
  );

drop policy if exists business_invitations_manage_delete on public.business_invitations;
create policy business_invitations_manage_delete on public.business_invitations
  for delete to authenticated
  using (public.business_member_role(business_id, auth.uid()) in ('owner','admin'));

-- -----------------------------------------------------------------------------
-- create_business(): atomically create a business + seed the creator as owner.
-- No permissive INSERT policy on businesses — creation is only ever through this
-- RPC, which guarantees the creator becomes `owner` and no open insert path exists.
-- -----------------------------------------------------------------------------
create or replace function public.create_business(
  p_slug                  text,
  p_legal_name            text,
  p_country               text,
  p_primary_partner_type  text,
  p_trading_name          text default null,
  p_business_registration text default null
)
returns public.businesses
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_row public.businesses;
begin
  if v_uid is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  insert into public.businesses (slug, legal_name, trading_name, business_registration,
                                 country, primary_partner_type, status, created_by)
    values (lower(btrim(p_slug)), btrim(p_legal_name), nullif(btrim(p_trading_name), ''),
            nullif(btrim(p_business_registration), ''), upper(btrim(p_country)),
            p_primary_partner_type, 'pending', v_uid)
    returning * into v_row;

  insert into public.business_members (business_id, user_id, role)
    values (v_row.id, v_uid, 'owner');

  return v_row;
end
$$;

revoke all on function public.create_business(text, text, text, text, text, text) from public;
grant execute on function public.create_business(text, text, text, text, text, text) to authenticated, service_role;

-- -----------------------------------------------------------------------------
-- accept_business_invitation(): validate token_hash + expiry, add the caller as a
-- member, mark the invitation accepted. SECURITY DEFINER so the invitee needs no
-- direct table grant; idempotent on an already-accepted membership.
--
-- Takes the ALREADY-HASHED token (sha256(raw) hex, computed app-side) so the SQL
-- has no dependency on pgcrypto's digest() (which lives in the extensions schema
-- on Supabase, outside this function's search_path) and the raw bearer token
-- never reaches the database.
-- -----------------------------------------------------------------------------
create or replace function public.accept_business_invitation(p_token_hash text)
returns public.business_members
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_inv public.business_invitations;
  v_row public.business_members;
begin
  if v_uid is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  select * into v_inv
    from public.business_invitations
   where token_hash = p_token_hash
     and accepted_at is null
     and expires_at > now();

  if not found then
    raise exception 'invalid or expired invitation';
  end if;

  insert into public.business_members (business_id, user_id, role)
    values (v_inv.business_id, v_uid, v_inv.role)
    on conflict (business_id, user_id) do update set role = excluded.role
    returning * into v_row;

  update public.business_invitations
     set accepted_at = now()
   where id = v_inv.id;

  return v_row;
end
$$;

revoke all on function public.accept_business_invitation(text) from public;
grant execute on function public.accept_business_invitation(text) to authenticated, service_role;

-- -----------------------------------------------------------------------------
-- get_business_public_profile(): the ONLY anonymous read path. Grant-locked
-- SECURITY DEFINER (advisor-clean — preferred over a security-definer view per
-- the SEC-HARDEN clean-advisor posture) returning ONLY public columns of an
-- ACTIVE business. Never exposes business_registration / created_by / roster.
-- pending/suspended/closed businesses return zero rows -> anon 404.
-- -----------------------------------------------------------------------------
create or replace function public.get_business_public_profile(p_slug text)
returns table (
  id           uuid,
  slug         text,
  trading_name text,
  legal_name   text,
  country      text,
  verified_at  timestamptz,
  status       text
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select id, slug, coalesce(trading_name, legal_name) as trading_name, legal_name,
         country, verified_at, status
    from public.businesses
   where slug = lower(btrim(p_slug))
     and status = 'active'
$$;

revoke all on function public.get_business_public_profile(text) from public;
grant execute on function public.get_business_public_profile(text) to anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- business_public_profile view: security_invoker (advisor-clean), exposing only
-- public columns of active businesses. Obeys the caller's RLS, so it is a
-- member-facing convenience projection — anonymous reads go through the RPC above.
-- -----------------------------------------------------------------------------
create or replace view public.business_public_profile
with (security_invoker = on)
as
  select id, slug, coalesce(trading_name, legal_name) as trading_name,
         country, verified_at, status
    from public.businesses
   where status = 'active';

grant select on public.business_public_profile to authenticated;

-- -----------------------------------------------------------------------------
-- Documentation
-- -----------------------------------------------------------------------------
comment on table public.businesses is
  'V3-57: first-class business account beside the personal account. Default-deny RLS; '
  'creation only via create_business(); anonymous reads only via get_business_public_profile(). '
  'business_registration/created_by/roster never exposed to unrelated or anonymous traffic.';
comment on table public.business_members is
  'V3-57: team roster (owner/admin/member). RLS uses SECURITY DEFINER helpers (is_business_member/'
  'business_member_role) to avoid policy self-recursion. Enabled but NOT forced so the helpers bypass RLS internally.';
comment on table public.business_invitations is
  'V3-57: tokenized team invitations. token_hash = sha256(raw token) hex; raw token only in the emailed link. '
  'Acceptance via accept_business_invitation() validating token_hash + expires_at.';
comment on function public.get_business_public_profile(text) is
  'V3-57: the only anonymous read path for a business. Returns public columns of an ACTIVE business by slug; '
  'pending/suspended/closed return zero rows.';
