-- Defense-in-depth. No property table is FORCE-RLS'd. The live app writes via service_role to the
-- private property-runtime Storage bucket (so RLS is not the live boundary today), but FORCE-RLS on
-- the relational PII/money tables is a cheap launch invariant for any future direct-PostgREST path.
-- Apply only to tables that exist on prod (the PASS-21 tables — rent_payments/maintenance_tickets —
-- are committed-not-applied; FORCE them when they land).

alter table public.property_listings            force row level security;
alter table public.property_inquiries           force row level security;
alter table public.property_viewing_requests    force row level security;
alter table public.property_listing_applications force row level security;
alter table public.property_managed_records     force row level security;
alter table public.property_notifications       force row level security;
alter table public.property_saved_listings      force row level security;
