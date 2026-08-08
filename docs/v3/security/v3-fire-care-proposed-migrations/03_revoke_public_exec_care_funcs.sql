-- CARE-5 — Remove the PUBLIC/anon EXECUTE grant on a money-recompute and the tracking-code
-- generator. proacl shows an empty-grantee '=X/' (PUBLIC) entry on both, and
-- has_function_privilege('anon', ...) = true. The PUBLIC grant is ADDITIVE, so revoking from
-- anon alone is a no-op — revoke from public, anon, authenticated.
-- (create_care_booking / track_care_booking stay anon-executable BY DESIGN for guest
-- booking + tracking; is_staff_in is a safe boolean self-check on auth.uid().)

revoke execute on function public.care_recalculate_booking_totals(uuid) from public, anon, authenticated;
revoke execute on function public.make_care_tracking_code() from public, anon, authenticated;

-- care_recalculate_booking_totals is SECURITY INVOKER (so anon's underlying write was already
-- blocked by RLS), but a money recompute should not be a public API surface regardless.
