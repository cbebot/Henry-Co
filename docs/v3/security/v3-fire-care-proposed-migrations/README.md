# V3-FIRE-CARE — proposed fix migrations (HELD)

Proposed remediations from a **read-only** audit of `apps/care` against live prod
(`rzkbgwuznmdxnnhmjazy`). Placed **outside** any apply pipeline and **not** run.
**Do not apply until the architect re-verifies and the owner approves.** Apply order is numeric.

App-layer / data fixes have no migration here (see `../V3-FIRE-CARE-2026-06-26.md`):
- CARE-1 `apps/care/lib/care-recent-bookings.ts` → resolve by `customer_id`, not `.ilike("email")`.
- CARE-2 `/api/care/track` → require a phone match (or authenticated owner) before returning PII/GPS.
- CARE-3 `apps/care/lib/payments/verification.ts:sanitizeAmount` → `Math.round`; backfill the 6 fractional rows.

The most urgent item is **cross-division and owner-gated**: deactivate the 7 still-live
`henrycogroup.com` god-mode rows (XD-F03) —
`update public.marketplace_role_memberships set is_active=false where normalized_email ilike '%henrycogroup.com' and is_active;`
— plus the `apps/marketplace/lib/marketplace/auth.ts` email-OR binding fix.
