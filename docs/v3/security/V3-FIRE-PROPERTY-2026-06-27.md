# V3-FIRE-PROPERTY — Pre-launch adversarial security + smart-leak audit

- **Entity:** Henry Onyx Limited (codename `HenryCo` / `@henryco/*`; only valid domain **henryonyx.com**).
- **Division:** property (`apps/property` — rentals / hotels / short-lets; listings, inquiries, viewings, applications, rent/maintenance).
- **Live DB audited:** Supabase project `rzkbgwuznmdxnnhmjazy` ("HENRY ONYX").
- **Date:** 2026-06-27
- **Method:** static map (3 parallel subagents: RLS/SECDEF catalog; the `/api/property` multiplexer authz; money + tenant↔landlord isolation + webhook) → live read-only probing as the **real `anon` + `authenticated`(stranger) roles**, prod function-body + `storage.buckets`/`storage.objects` + `auth.users` metadata inspection (via the Supabase MCP), never `service_role`. `SELECT`/catalog only, zero mutation. Did not touch `payments_private`/core money RPCs.
- **Calibration (owner directive):** public listing/catalog/amenity/photo data via `USING(true)` is **public-by-design** — not flagged. Only PII/money/KYC exposure flagged. CRITICAL/HIGH require a live probe or a code path whose **precondition is confirmed on prod**; unproven → SUSPECTED/downgraded. Pre-data defects annotated.

---

## Executive summary

**Property's data + storage layers are sound, and all three agent HIGH/SUSPECTED calls were refuted or downgraded by live prod verification.** 0 CRITICAL / 0 HIGH live. The division is **entirely pre-data** (18 users exist, but **0 listings / 0 inquiries / 0 viewings**), so the residual code defects are pre-launch.

Key live facts that shaped the grading:
- **The runtime data store is JSON in a *private* Supabase Storage bucket, not the relational tables.** `property-runtime` is `public=false` with **no `storage.objects` read policy** → anon/authenticated clients cannot read the blobs at all (only service_role). `property-documents` is also private; only `property-media` (listing photos) is public — by-design. So the storage layer is locked down, and ownership enforcement is correctly app-layer in the multiplexer.
- **Cross-user reads of the relational tables are fully closed (live probe):** anon and authenticated-*stranger* both read **0** from `property_inquiries`, `property_viewing_requests`, `property_listing_applications`, `property_saved_listings`, `property_notifications`, `property_managed_records`, and `0` non-public listings. RLS is well-scoped (owner/staff predicates).
- **`is_property_staff()` is a clean self-check** (`exists(... from profiles where id=auth.uid() and role in (...))`, search_path pinned) — notably the **only** division whose staff gate doesn't use the recurring email-OR anti-pattern.
- **The money path is dormant** (`property_rent_payments` write is staff-only RLS; `upsertPropertyRentPayment` has zero callers; `/pay` is a `notFound()` stub) → no self-mark-paid / amount-tamper reachable.
- **Webhook + cron are correctly hardened** (WhatsApp HMAC-on-raw-body, fail-closed; cron `CRON_SECRET`-gated, fail-closed; neither moves money).

| # | Finding | Category | Severity |
|---|---------|----------|----------|
| **PROP-1** | Property staff role resolved partly from **self-writable `user_metadata.role`** (`auth.ts:138`) — but **shadowed on prod** (18/18 users have `profiles.role`) → not currently reachable | Priv-esc (Supabase anti-pattern) | **MEDIUM (latent)** |
| **PROP-2** | Property KYC/ownership docs (`ownership_proof`, `identity_evidence`, `authority_proof`) at **permanent public Cloudinary URLs** — *systemic* | KYC data-at-rest | **MEDIUM** |
| **PROP-3** | IDOR: any authed user deletes/silences **any** user's saved search by id (`saved_search_delete`/`saved_search_cadence`, no ownership check) | IDOR (cross-user write) | **MEDIUM** |
| **PROP-4** | `maintenance_ticket_submit` accepts any `listing_id` with no tenancy/ownership check (queue spam) | IDOR (write) | **LOW** |
| **PROP-5** | `getPropertyBySlug` returns prospect PII arrays (not rendered today); webhook receipt non-idempotent; cron non-constant-time compare; owner-email alert spoofable | Latent / hardening | **LOW** |
| **PROP-6** | `viewerHasRole` ignores membership `scope_id` (a listing-scoped role would act globally); no CSRF token on the cookie-auth form-POST multiplexer | AuthZ / CSRF | **SUSPECTED/LOW** |

---

## Findings

### PROP-1 — `user_metadata.role` in authorization (MEDIUM, latent — agent HIGH downgraded by prod verification)
- **Asset:** `apps/property/lib/property/auth.ts:132-140` → `mapLegacyRole(profile?.role || app_metadata.role || user_metadata.role)`; `user_metadata` (`raw_user_meta_data`) is user-writable via `supabase.auth.updateUser({ data: { role: "owner" } })`, and `mapLegacyRole("owner")` grants every property staff role.
- **Why it is NOT a live HIGH:** the `||` chain only reaches `user_metadata.role` when **both** `profiles.role` and `app_metadata.role` are falsy. **Live prod probe: 18/18 `auth.users` have a populated `profiles.role`** (`profiles_with_role=18`, distinct = `customer,manager,owner,rider,staff`) — and `customer` (truthy) short-circuits the chain before `user_metadata` is read. So a self-registered customer cannot escalate today; `mapLegacyRole('customer')` confers no staff role. This is a **Supabase security-checklist anti-pattern** ("never use `user_metadata` in authZ") that is currently **shadowed** but fragile — it becomes live the instant any signup path leaves `profiles.role` null.
- **Proposed fix (app-layer):** delete the `user_metadata.role` fallback; derive property roles only from `property_role_memberships` (+ `app_metadata.role`/`profiles.role`, both service-role-controlled).
- **Post-fix:** a fresh account with `user_metadata.role='owner'` and null `profiles.role` is redirected from `/operations` → `/account`.

### PROP-2 — Property KYC/ownership documents at permanent public Cloudinary URLs (MEDIUM; systemic)
- **Asset:** `apps/property/lib/property/store.ts:179-243` (`uploadPropertyDocument` → Cloudinary). The verification document kinds (`ownership_proof`, `identity_evidence`, `authority_proof` — `route.ts:201-232`) are uploaded with no `access_mode:"authenticated"` and the public `secure_url` is stored verbatim (`:242`) — permanent unauthenticated delivery. The Supabase `property-documents` bucket is private, but **documents bypass it for Cloudinary**, so the bucket privacy is moot. The folder path embeds the publicly-exposed listing UUID; only a `Date.now()`+filename `public_id` adds entropy.
- **This is the systemic Cloudinary pattern** also confirmed in studio (deliverables/asset packs), learn (videos), jobs (resumes), and account (KYC IDs/proofs). **Fix as one cross-cutting change** — upload sensitive docs with `access_mode:"authenticated"` + short-lived signed delivery behind an ownership/role check; leave listing *media* public.
- **Probe:** `curl` a stored property-document `secure_url` unauthenticated → `200` with the file.

### PROP-3 — Saved-search IDOR (MEDIUM)
- **Asset:** `apps/property/app/api/property/route.ts:1838-1846` (`saved_search_delete`) + `:1848-1862` (`saved_search_cadence`). Both authenticate the caller but pass the client `saved_search_id` straight to `deleteSavedSearch(id)` / `setSavedSearchCadence(id, …)` with **no `userId` ownership check**; the data layer (`saved-searches.ts:111`, `:115-130`) looks up by raw id and mutates the service-role JSON blob. Any authed user can delete another user's saved search or set its cadence to `off` (silently disabling their new-listing alerts). UUID id (not enumerable) → MEDIUM. **Fix:** load the record, require `record.userId === viewer.user.id` (or `normalizedEmail` match) before mutating.

### PROP-4 — `maintenance_ticket_submit` missing ownership (LOW)
- `route.ts:1868-1944` requires a session but no `isListingOwner`/tenancy check before creating a ticket against a client-supplied `listing_id`. Write-only nuisance (attacker-stamped id/contact; reaches the ops queue + the targeted owner). **Fix:** gate with `isListingOwner(viewer, listing) || requireRoles([...staff])`.

### PROP-5 — Latent / hardening (LOW)
- `getPropertyBySlug` (`lib/property/data.ts:90-91`) returns per-listing `inquiries`/`viewings` arrays with full prospect PII — **not rendered** by the current public page, but a footgun: strip them or scope to the owner.
- WhatsApp webhook receipt log is **not idempotent** (`createId()` per call → Meta retries duplicate log rows; harmless log-only).
- Cron Bearer compare uses `===` (not constant-time) — negligible for a high-entropy secret; `timingSafeEqual` would match the webhook's rigor.
- Stale-listing alert emails go to the attacker-settable `listing.ownerEmail` — low-grade email-injection/spam, not a data leak.
- (DB) `property_listings`' `public can read approved listings` policy returns **all columns** incl. `owner_email/phone/name/address` to anon for approved+public rows — **but the table has 0 rows on prod** (the app uses Storage), so no live leak; latent if the relational table is ever populated (held `02` provides a PII-stripped view + revoke).

### PROP-6 — SUSPECTED
- `viewerHasRole` (`auth.ts:66-72`) checks only the role string and **ignores membership `scope_id`** — a role granted scoped to one listing/area would act globally. No scoped grants exist today.
- The form-POST multiplexer is cookie-authenticated with no CSRF token/Origin check — depends on the shared SSR auth cookie's `SameSite` attribute (out of this app's scope; confirm it's `Lax`/`Strict`).
- `packages/data/calendar-aggregate.ts` reads `property_viewing_requests` with an `.or(user_id, normalized_email)` email-OR match — safe under an RLS-enforced client, risky under service_role; verify which client it uses.

---

## Closed / refuted (by live probe / source)

| Hypothesis | Verdict | Evidence |
|---|---|---|
| `user_metadata.role` → customer-to-staff escalation (agent HIGH) | **DOWNGRADED → MEDIUM-latent** | 18/18 prod users have `profiles.role` → the `user_metadata` fallback is shadowed/unreachable today |
| Anon reads landlord PII (`owner_email/phone`) on `property_listings` (agent HIGH) | **REFUTED (live)** | `property_listings` has **0 rows** on prod (app uses the private Storage bucket); anon read = 0 |
| `property_listings` streams owner PII to anon via realtime (agent HIGH) | **REFUTED** | the realtime-publication migration is unapplied — **no property table is on `supabase_realtime`** on prod |
| `property-runtime` storage blobs (inquiries/viewings PII) world-readable | **CLOSED** | bucket `public=false` + no `storage.objects` policy → anon/auth denied |
| Cross-user read of inquiries/viewings/applications/saved/managed/notifications | **CLOSED** | anon + authenticated-stranger read = 0 for all |
| Self-mark-paid / amount tamper / IDOR receipt (money) | **REFUTED** | dormant — no rent/booking write path; `/pay` is a stub; rent RLS is staff-only |
| Contact-info leak (landlord↔tenant) / anti-disintermediation | **REFUTED** | owner email/phone never rendered; tenant↔landlord intermediated; PII only on role-gated `/agent` |
| `is_property_staff()` mutable search_path / email-OR | **CLOSED** | prod: search_path pinned (`public, pg_catalog`); clean `auth.uid()` self-check, no email-OR |
| WhatsApp webhook forgery / cron open | **REFUTED** | HMAC-on-raw-body fail-closed; cron `CRON_SECRET`-gated fail-closed; neither moves money |

---

## Proposed fixes index
- **Held migrations** `docs/v3/security/v3-fire-property-proposed-migrations/`: `01_force_rls_property_pii_money.sql` (defense-in-depth), `02_property_listings_public_view.sql` (PII-stripped public view + revoke anon — for if/when the relational `property_listings` is ever populated).
- **App-layer (the real fixes):** PROP-1 remove the `user_metadata.role` fallback; PROP-2 signed Cloudinary delivery (**cross-cutting** — also studio/learn/jobs/account); PROP-3 ownership guard on saved-search delete/cadence; PROP-4 tenancy check on maintenance tickets; PROP-5 strip prospect-PII arrays from `getPropertyBySlug`; PROP-6 honor `scope_id`, confirm cookie `SameSite`.

---

**V3-FIRE-PROPERTY COMPLETE — 6 findings (0 critical / 0 high live / 3 med / 2 low / 1 suspected); 2 held migrations. Data + storage layers proven sound (private `property-runtime` bucket; anon/stranger read 0 everywhere; clean `is_property_staff` self-check), and ALL THREE agent HIGH/SUSPECTED calls were refuted or downgraded by live prod verification — the `user_metadata.role` escalation is shadowed (18/18 users have `profiles.role`), the relational `property_listings` is empty (app uses Storage) and not on realtime. Money is dormant; webhook/cron hardened. Residual risk: the systemic public-Cloudinary KYC/ownership docs (MEDIUM) + the saved-search IDOR (MEDIUM) + the latent `user_metadata` anti-pattern — all pre-data. No severity inflation.**
