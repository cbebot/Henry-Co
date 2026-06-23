-- V3-NOTIF-OWNER-GUARD (DB enforcement) — a care booking shows only to its owner.
--
-- ROOT CAUSE (found in live prod data): care bookings carry the booker's
-- email/phone, and several accounts can share that contact (e.g. the same
-- phone). care-sync.ts matches guest bookings by email/phone, so the same
-- booking's "Care booking available" notification + activity got planted in
-- EVERY matching account — so one booking appeared in everyone's Smart Home
-- signal feed, "irrespective of who booked it". A care booking has exactly
-- ONE rightful owner: care_bookings.customer_id (backfilled from the booking
-- email, the authoritative "who booked it" signal).
--
-- This BEFORE INSERT guard drops any care_booking notification/activity row
-- whose user_id is not the booking's owner — enforced at the database
-- regardless of application code (defense-in-depth alongside the app-layer
-- owner guard + claim-on-first-match in apps/account/lib/care-sync.ts). It
-- returns NULL (skip the row) rather than raising, so the best-effort sync
-- callers are unaffected. When the booking has no known owner (customer_id
-- null) it does not block — those are handled by the app-layer claim.
--
-- Idempotent: CREATE OR REPLACE + DROP TRIGGER IF EXISTS.

set check_function_bodies = off;

create or replace function public.enforce_care_booking_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
begin
  if NEW.reference_type = 'care_booking'
     and nullif(btrim(coalesce(NEW.reference_id, '')), '') is not null then
    select customer_id into v_owner
    from public.care_bookings
    where id::text = NEW.reference_id;

    if v_owner is not null and v_owner <> NEW.user_id then
      return null; -- not the rightful owner — drop the cross-user row
    end if;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_enforce_care_booking_owner_notif on public.customer_notifications;
create trigger trg_enforce_care_booking_owner_notif
  before insert on public.customer_notifications
  for each row execute function public.enforce_care_booking_owner();

drop trigger if exists trg_enforce_care_booking_owner_activity on public.customer_activity;
create trigger trg_enforce_care_booking_owner_activity
  before insert on public.customer_activity
  for each row execute function public.enforce_care_booking_owner();
