-- CHROME-02 — Property submission governance: lock status + visibility
-- against owner self-approval.
--
-- The existing RLS policy "owners can update own listings" allows
-- owners to UPDATE any column on rows they own. Without a column-level
-- gate, a determined owner could PATCH their listing directly and set
-- `status = 'approved'` + `visibility = 'public'` to bypass moderation.
--
-- This migration adds a BEFORE UPDATE trigger that resets status and
-- visibility back to their old values when the actor is a regular
-- authenticated user. Two bypasses exist on purpose:
--
--   1. `auth.uid() is null` — server-side admin client / service role
--      writes carry no auth context, so we trust them. The
--      `/api/property` route uses createAdminSupabase() and is the
--      only path that should ever flip status forward (driven by
--      `evaluatePropertySubmissionPolicy` and inspection records).
--
--   2. `public.is_property_staff()` — owner/manager/staff/support
--      roles can change status and visibility through the admin UI.
--
-- The trigger silently resets the disallowed columns rather than
-- raising, so owner-driven updates to other fields (price, gallery,
-- amenities) keep working without partial-failure noise.

create or replace function public.prevent_owner_property_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  if public.is_property_staff() then
    return new;
  end if;

  if new.status is distinct from old.status then
    new.status := old.status;
  end if;

  if new.visibility is distinct from old.visibility then
    new.visibility := old.visibility;
  end if;

  return new;
end;
$$;

drop trigger if exists property_listings_lock_status_visibility
  on public.property_listings;

create trigger property_listings_lock_status_visibility
  before update on public.property_listings
  for each row
  execute function public.prevent_owner_property_status_change();
