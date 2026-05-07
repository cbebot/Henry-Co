-- Studio live schema guards.
--
-- This migration is intentionally additive/idempotent. It repairs live
-- environments where Studio tables were created before the helper functions
-- were present, and it narrows client-side deliverable approval updates at
-- the trigger layer.

create extension if not exists pgcrypto;

create or replace function public.studio_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.studio_auth_email()
returns text
language sql
stable
as $$
  select nullif(lower(coalesce(auth.jwt() ->> 'email', '')), '');
$$;

create or replace function public.studio_is_staff()
returns boolean
language plpgsql
stable
as $$
begin
  if to_regclass('public.studio_role_memberships') is null then
    return false;
  end if;

  return exists (
    select 1
    from public.studio_role_memberships membership
    where membership.is_active = true
      and (
        membership.user_id = auth.uid()
        or (
          membership.normalized_email is not null
          and membership.normalized_email = public.studio_auth_email()
        )
      )
  );
end;
$$;

create or replace function public.studio_guard_client_deliverable_approval()
returns trigger
language plpgsql
as $$
begin
  if auth.role() = 'service_role' or public.studio_is_staff() then
    return new;
  end if;

  if auth.uid() is null then
    raise exception 'Unauthenticated deliverable updates are not allowed.';
  end if;

  if (to_jsonb(new) - array['status', 'approved_at', 'approved_by'])
     is distinct from
     (to_jsonb(old) - array['status', 'approved_at', 'approved_by']) then
    raise exception 'Client deliverable updates are limited to approval fields.';
  end if;

  if new.status is distinct from 'approved' then
    raise exception 'Client deliverable updates can only approve deliverables.';
  end if;

  if new.approved_by is distinct from auth.uid() then
    raise exception 'Deliverable approval must be attributed to the authenticated client.';
  end if;

  return new;
end;
$$;

drop trigger if exists studio_guard_client_deliverable_approval on public.studio_deliverables;
create trigger studio_guard_client_deliverable_approval
  before update on public.studio_deliverables
  for each row
  execute function public.studio_guard_client_deliverable_approval();
