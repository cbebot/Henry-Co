# V3-FIRE-MARKETPLACE-FIX — verify-then-fix of the pre-launch marketplace audit

- **Date:** 2026-06-26
- **Branch:** worktree off `origin/main` (HEAD `eca6a1ff`)
- **Source audit:** PR #337 (`docs/v3/security/V3-FIRE-MARKETPLACE-2026-06-26.md`), 15 findings
- **Mandate:** VERIFY each finding against the **actual `origin/main` code** before fixing; fix only the confirmed-real ones; REFUTE generously; ownership checks derive identity from the **session** (never a caller-supplied id); do **not** touch `payments_private` or the 5 core money RPCs; any DB migration stays **HELD** for owner-gated apply after architect re-verification.

> **Why re-verify:** the audit's line numbers were taken from a different (dirty) tree —
> e.g. it cited `dispute_create` at `route.ts:1852`, but on `origin/main` it is at line
> 2111. Every finding below was re-confirmed against the real `origin/main` source in a
> clean worktree.

---

## Confirmed real → FIXED (app-layer, no DB change)

All five share one root cause: **every marketplace write flows through a single
`service_role` multiplexer** (`app/api/marketplace/route.ts`) plus two force-dynamic
public order pages. `service_role` bypasses RLS, so the database is **not** a backstop —
ownership must be proven in TypeScript, and several `case`s simply didn't. The fix
concentrates that logic in pure, unit-tested predicates (`lib/marketplace/authorization.ts`)
so the handlers can no longer drift apart.

### F-01 — Unauthenticated `/track` PII + bank-receipt leak (CRITICAL) ✅
- **Pre (origin/main):** `app/(public)/track/[orderNo]/page.tsx:34` called
  `getOrderByNumber(orderNo)` (which reads via `createAdminSupabase()` = service_role,
  `data.ts:1459`) with the **only** guard `if (!order) notFound()`. It rendered the
  bank-receipt `proofUrl` as a clickable link (`page.tsx:142-149`) and the buyer email via
  `PlacementAcknowledgement` whenever the attacker-controlled `?placed=1` was present
  (`page.tsx:31,52`). `order_no` is `MKT-ORD-YYYYMMDD-{100..999}` —
  `Math.floor(Math.random()*900+100)` (`route.ts:98`) — i.e. **900 guesses/day**. The
  sibling `/pay/[orderNo]` page already gated on ownership (`pay/.../page.tsx:79-85`);
  `/track` simply omitted it.
- **Fix:** new `getOrderForViewer(orderNo, viewer)` (`data.ts`) proves ownership via
  `isMarketplaceOrderOwner` **before** returning any order data; the page resolves the
  marketplace viewer and calls it. A signed-out or non-owning viewer gets `null` → the
  page's existing graceful `notFound()` recovery — **no email, no proof, no existence
  oracle**. The sibling `/pay` surface was also routed through the same helper (it
  previously used a weaker email-only gate), so both public order pages now share one
  vetted ownership check. Checkout requires authentication (`route.ts` `checkout_submit`),
  so every order has a bound authenticated owner — gating `/track` breaks no guest flow.
- **Post (proof):** for any `viewer.user === null`, `getOrderForViewer` returns `null` →
  `notFound()`. Enumerating `MKT-ORD-*` as an anonymous client now discloses zero orders.
  Proven deterministically by the `isMarketplaceOrderOwner` unit tests (unauthenticated →
  `false`; cross-user → `false`).

### F-02 — `dispute_create` cross-order payout-freeze (HIGH) ✅
- **Pre:** `route.ts:2111` guarded only `if (!viewer.user)`, then froze **any** order's
  payout (`payout_status:"payout_frozen"`, `:2146-2152`) and flipped status to
  `disputed`. The sibling `order_confirm_completion` (`:2061-2067`) *did* compute
  ownership — the asymmetry was the bug. Combined with F-01's enumerable `order_no`, any
  signed-in user could freeze every vendor's payouts.
- **Fix:** an `isMarketplaceOrderOwner(order, viewer)` gate (returning `error=forbidden`)
  is inserted **before** the dispute insert and the payout freeze. Identity derives from
  `viewer` (session), never the form.
- **Post:** a non-owner POST returns `error=forbidden` and performs zero writes.

### F-04 — `vendor_product_upsert` cross-vendor takeover (HIGH) ✅
- **Pre:** `route.ts:1745` did `upsert(payload, { onConflict:"slug" })` with a
  client-controlled `slug` (`:1612`) and `vendor_id: vendorScopeId` (`:1702`).
  `marketplace_products.slug` is **globally unique** (prod constraint
  `marketplace_products_slug_key`; repo `marketplace_init.sql:108`), so a colliding slug
  overwrites another vendor's row and reassigns `vendor_id`. The `vendorScopeId` also fell
  back to a client `vendor_slug` and then `snapshot.vendors[1]?.id`.
- **Fix (two parts):** (1) `vendorScopeId` resolution hardened — a `vendor` is always
  scoped to **their own** membership vendor; only staff (owner/admin) may target a named
  vendor via `vendor_slug`; the arbitrary `vendors[1]` fallback is removed. (2) a
  pre-upsert lookup of the slug's current owner + `resolveVendorProductUpsert` rejects any
  unscoped (`missing-vendor-scope`) or cross-vendor (`listing-conflict`) upsert before the
  row is touched.
- **Post:** VENDOR_B upserting VENDOR_A's slug → `error=listing-conflict`, VENDOR_A's row
  unchanged. Proven by the `resolveVendorProductUpsert` unit tests.

### F-05 — `cart_update` missing authorization (MEDIUM) ✅
- **Pre:** `route.ts:451-465` deleted/updated `marketplace_cart_items` by `id` via
  service_role with **no** auth or ownership check (UUID id ⇒ low exploitability, but zero
  authorization). The canonical `/api/cart` path already guards via
  `verifyCartItemOwnership`.
- **Fix:** resolve the item's cart and apply `cartItemOwnerMatches(cart, viewer,
  sessionToken)` (session `user_id` or guest cart cookie) before mutating — for both the
  delete and update branches. The guest token is read **cookie-only** (matching
  `/api/cart`'s `verifyCartItemOwnership`), never from a caller-supplied form field.
- **Post:** USER_B updating USER_A's cart item → treated as not-found, item unchanged.

### F-10 — `payment_verify` over-broad role (MEDIUM, latent) ✅
- **Pre:** `route.ts:1969` admitted `support` to a money-verify action (sets payment
  `verified` → escrow `paid_held`).
- **Fix:** role gate narrowed to `["marketplace_owner","marketplace_admin","finance"]`.
- **Note (not done — recommendation):** amount reconciliation (`recorded amount ===
  order.grand_total`) is a sound additional control but was left out of this patch to keep
  the change low-risk (live money probes are clean and the field semantics deserve a
  dedicated test). Flagged for a follow-up.

---

## Verified real but DB-layer → HELD (owner-gated apply, NOT applied)

These are genuine but require DDL/RLS changes; per mandate they stay held. The held SQL is
in PR #337 (`docs/v3/security/v3-fire-marketplace-proposed-migrations/`); the app-layer
fixes above already neutralise the live exploit for F-04.

- **F-04 — `vendor_id`-reassignment-blocking trigger** (held `10_…`): the app-layer
  slug-ownership pre-check above is the **primary** fix (the held SQL itself says so, and
  keeps `slug` globally unique to preserve `/product/[slug]` URLs). The held trigger
  `marketplace_block_vendor_reassign` is an airtight DB backstop that rejects ANY UPDATE
  changing a product's `vendor_id` — closing even the narrow check-then-upsert race.
- **F-07 — `inventory_movements` INSERT scope** (held `03_…`): the INSERT `WITH CHECK`
  (migration `20260514120000…:91-98`) validates the caller *holds* a vendor role but never
  ties it to the row's `vendor_id`. Confirmed real; held.
- **F-08 — FORCE RLS + revoke inert write grants** (held `01_…`, `07_…`): no
  `marketplace_*` table is `FORCE`d, so a leaked service key / any future permissive policy
  has no backstop. Defense-in-depth; `07` is flagged needs-staging-test.

---

## REFUTED / out of scope (with evidence)

- **F-03 — "henrycogroup.com staff takeover" (was HIGH): REFUTED (no live exploit).**
  Architect-verified on prod: **zero** `henrycogroup.com` rows in any privilege table and
  the domain is retired, so the email-OR role binding has nothing to bind. The **code
  pattern** remains latent: `getMarketplaceViewer` (`auth.ts:90-105`) concatenates
  `byUser` + `byEmail` with no `user_id` constraint, so it *would* re-arm if any
  `user_id IS NULL` privileged membership were seeded again. **Not fixed** (mandate: fix
  only confirmed-real; touching the auth path is the architect's call). **Residual
  recommendation:** require a `user_id` binding for privileged roles; allow email-only
  matching solely for a non-privileged invite bootstrap that binds `user_id` on first
  login.
- **F-06 / F-09 — anon reads variants/media of non-approved products (`USING(true)`):
  REFUTED.** This is the **intended public storefront catalog** (brands/categories/
  media/variants/prices) — no PII. Architect-confirmed.
- **F-11 (review_votes, 0 rows), F-12 (deals_curation lockout-not-breach), F-13
  (with_check cosmetic): not exploitable today** (the audit itself says so); posture-only,
  left to the held set.
- **F-14 (wallet checkout non-transactional): real but LOW;** requires a `SECURITY DEFINER`
  RPC (DB change) — held/follow-up, no double-charge (the audit refuted that).

---

## Adversarial review (4-lens workflow) + post-review hardening

A 4-lens adversarial review (bypass / regression / scope / correctness) found **no
critical or high** findings. Four low/nit items were actioned:
1. `cart_update` now reads the guest token **cookie-only** (was: also a form fallback).
2. `isMarketplaceOrderOwner` email branch is gated on `!order.user_id` — a bound order is
   decided solely by id, never falling through to an email match (+ a contract-locking
   test).
3. `getOrderForViewer` uses the same `user_id`/`normalized_email` shape as the write gates
   (fail-closed, consistent).
4. `/pay` routed through `getOrderForViewer` (was: weaker email-only gate).

### Known residuals / follow-ups (documented, not fixed here)
- **F-04 check-then-upsert TOCTOU:** a sub-second race could let a not-yet-existing slug be
  created by another vendor in the gap. Not practically exploitable (attacker must predict
  the exact slug and win the race); the **held trigger** `marketplace_block_vendor_reassign`
  (PR #337 `10_…`) is the airtight DB backstop.
- **Staff (owner/admin) vendor product create via the vendor UI** now returns
  `missing-vendor-scope` instead of silently attributing to an arbitrary vendor (the old
  `vendors[1]` fallback was itself a bug). Legit vendors are unaffected. Follow-up: add an
  explicit vendor selector to those pages or drop owner/admin from their route guards.
- **F-10 amount reconciliation** (recorded amount === `grand_total`) — recommended, deferred.
- **F-03 email-OR role binding** (`auth.ts`) — latent code pattern, owner-gated (see above).

## Proof / gates

- **Unit tests:** `apps/marketplace/lib/marketplace/__tests__/authorization.test.ts` — 19
  tests (TDD: each written first and watched fail before implementing). Full marketplace
  lib suite **78/78 pass**.
- **Typecheck:** `tsc --noEmit` — exit 0.
- **Lint:** `eslint` — exit 0 (3 pre-existing warnings, none in touched files).

## Constraints honored

- All ownership checks derive identity from `viewer` (session / `auth.uid`) or the guest
  cart cookie — never a caller-supplied id or subject-naming form field.
- No change to `payments_private`, the 5 money RPCs, wallet debit, or
  `post_sale_revenue` / `record_customer_receipt`.
- No DB migration applied; DB-layer hardening stays HELD.
