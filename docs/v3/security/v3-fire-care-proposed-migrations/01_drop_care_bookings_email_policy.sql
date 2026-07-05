-- CARE-1 — Remove the #333-class email-match ownership policy on care_bookings.
-- "Users can view bookings by email" authorizes SELECT via lower(email)=lower(jwt email),
-- i.e. ownership by email rather than the stable customer_id FK. Currently 0 live collisions
-- and email-verification-gated, but it is the exact pattern behind the prior cross-user
-- notification fan-out. Ownership should be customer_id only; guest /track reads go through
-- the service_role route, not the Data API.

drop policy if exists "Users can view bookings by email" on public.care_bookings;

-- Retained: "Users can view own bookings" (auth.uid() = customer_id) and the service_role policy.
-- NOTE: also fix apps/care/lib/care-recent-bookings.ts to query .eq('customer_id', user.id)
-- instead of .ilike('email', userEmail) through the admin client (same class, app side).
