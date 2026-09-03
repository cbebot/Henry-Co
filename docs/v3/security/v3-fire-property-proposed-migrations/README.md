# V3-FIRE-PROPERTY — proposed fix migrations (HELD)

Read-only audit of `apps/property` against live prod (`rzkbgwuznmdxnnhmjazy`). Placed **outside**
any apply pipeline and **not** run. **Do not apply until the architect re-verifies and the owner approves.**

Property's data + storage layers are **proven sound** (private `property-runtime` bucket; anon/stranger
read 0; clean `is_property_staff()` self-check), so the real fixes are **app-layer** — see
`../V3-FIRE-PROPERTY-2026-06-27.md`:
- **PROP-1:** remove the `user_metadata.role` fallback in `apps/property/lib/property/auth.ts:138`
  (Supabase anti-pattern — currently shadowed by `profiles.role`, but a landmine).
- **PROP-2:** signed Cloudinary delivery for property KYC/ownership docs (**cross-cutting** — same
  fix as studio/learn/jobs/account).
- **PROP-3:** ownership guard on `saved_search_delete`/`saved_search_cadence`.
- **PROP-4:** tenancy check on `maintenance_ticket_submit`.

These migrations are defense-in-depth for the (currently empty / app-unused) relational tables:
- `01_force_rls_property_pii_money.sql`
- `02_property_listings_public_view.sql` — only relevant IF the relational `property_listings` is ever
  populated (today the app writes listings to the private Storage bucket, so the table is empty).
