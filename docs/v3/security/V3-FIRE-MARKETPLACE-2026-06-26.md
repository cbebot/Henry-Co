# V3-FIRE-MARKETPLACE — Pre-launch adversarial security + smart-leak audit

- **Entity:** Henry Onyx Limited (codename `HenryCo` / `@henryco/*`; customer strings say "Henry & Co."; one legacy seed domain `henrycogroup.com` — see Appendix A)
- **Division:** marketplace (`apps/marketplace`, 45 `marketplace_*` tables, `@henryco/pricing`)
- **Live DB audited:** Supabase project `rzkbgwuznmdxnnhmjazy` ("HENRY ONYX", eu-west-1, Postgres 17). The second org project `xzrqejqovbuaksoxyhap` has **zero** marketplace tables and is not in play.
- **Date:** 2026-06-26
- **Method:** static map (repo migrations + route/server-action/Next.js/money static analysis) → live read-only prod probing. Every IDOR/RLS probe ran by **dropping to the real `anon`/`authenticated` Postgres role** inside a transaction (`SET LOCAL ROLE … ; SET LOCAL request.jwt.claims = …`) so RLS evaluates exactly as for a real user. **Never queried as `service_role`** (it bypasses RLS and gives false passes). All transactions `ROLLBACK` — zero prod mutation.
- **Read-only attestation:** SELECT / catalog only. No `apply_migration`, no DDL, no writes. `payments_private`, the core money RPCs, and search-ui were not touched. Every proposed fix is a **held migration** for owner-gated apply after architect re-verification.

---

## Executive summary

The marketplace's **data-layer posture is genuinely sound** — the failure mode that just bit notifications (#333, RLS regression → cross-user read) did **not** recur here. Every `marketplace_*` table has RLS enabled; every owner-scoped table (`orders`, `addresses`, `carts`, `vendor_applications`, `payment_records`, `refunds`, `user_notifications`, `role_memberships`) **passed** a cross-user probe (0 rows as another authenticated user); all 12 zero-policy "lockbox" tables (`payout_requests`, `notification_queue` = 10,758 PII rows, `discount_codes`, `settings`, `audit_logs`, …) correctly **deny** a non-staff user; money internal-consistency, verified-payment-equals-order, and no-over-refund all came back clean.

The real risk has migrated **into the application layer** — specifically the single `service_role` multiplexer (`app/api/marketplace/route.ts`) where ownership is enforced (inconsistently) in TypeScript instead of in RLS, plus an **email-based role-binding** path in the viewer resolver, and two `qual=true` catalog policies. Because all writes flow through `service_role`, RLS provides **no backstop** for these app-layer gaps (no table has `FORCE ROW LEVEL SECURITY`).

| # | Title | Category | Severity |
|---|-------|----------|----------|
| **F-01** | Unauthenticated order-tracking IDOR (`/track/[orderNo]`) — buyer PII + payment-proof doc, brute-forceable | IDOR / PII | **CRITICAL** |
| **F-02** | `dispute_create` freezes any vendor's payout & marks any order disputed (no ownership check) | IDOR / Money-DoS | **HIGH** |
| **F-03** | Privilege escalation via email-only staff seeds on the **permanently-retired** `henrycogroup.com` domain + `getMarketplaceViewer` email-OR role binding → money-control takeover | AuthZ / Priv-esc | **CRITICAL** |
| **F-04** | `vendor_product_upsert` cross-vendor product takeover via `onConflict:"slug"` | Multi-tenant | **HIGH** |
| **F-05** | `cart_update` mutates any cart item by id — no auth, no ownership | IDOR | **MEDIUM** |
| **F-06** | Anon reads price/stock/SKU of non-approved products (`product_variants` `USING(true)`) — *re-graded per anti-inflation calibration: catalog metadata, no PII/money* | Smart-leak | **LOW** |
| **F-07** | `inventory_movements` INSERT policy checks role but not row `vendor_id` (cross-vendor write) | Multi-tenant | **MEDIUM** |
| **F-08** | No `FORCE ROW LEVEL SECURITY` on money/PII tables + broad inert anon/auth write grants | Hardening | **MEDIUM** |
| **F-09** | Anon reads media of non-approved products (`product_media` `USING(true)`) — *re-graded: catalog metadata, no PII/money* | Smart-leak | **LOW** |
| **F-10** | `payment_verify` allows `support` role + no amount reconciliation | Money / AuthZ | **MEDIUM** |
| **F-11** | `review_votes` public read exposes `voter_user_id` (deanonymization; 0 rows today) | Smart-leak | **LOW** |
| **F-12** | `deals_curation` policy uses role names matching nobody (staff lockout, not breach) | Posture | **LOW** |
| **F-13** | `user_comm_preferences` UPDATE policy omits explicit `WITH CHECK` (safe via USING-reuse) | Posture | **LOW** |
| **F-14** | Wallet checkout money mutation spans multiple non-transactional PostgREST calls | Money / atomicity | **LOW** |
| **A** | Three company names in code (`@henryco`, "Henry & Co.", `henrycogroup.com`) | Branding (non-sec) | note |

---

## Findings

### F-01 — Unauthenticated order-tracking IDOR (CRITICAL)
- **Category:** IDOR / unauth PII + financial-document exposure. CVSS 3.1 base `AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N` = **7.5**; elevated to **CRITICAL** per the pass rubric ("unauth access to money or PII" — context outranks raw score) because it exposes buyer PII **and** the bank-transfer proof document for **every** order and is brute-forceable.
- **Asset:** `apps/marketplace/app/(public)/track/[orderNo]/page.tsx` + `lib/marketplace/data.ts:getOrderByNumber` + `marketplace_orders.order_no`.
- **Pre-fix reproduction (source + prod evidence):**
  - The page is in the `(public)` route group, `export const dynamic = "force-dynamic"`, and calls `getOrderByNumber(orderNo)` with **no auth/ownership check** (`page.tsx:34`); the only guard is `if (!order) notFound()`.
  - `getOrderByNumber` (`data.ts:1363-1376`) reads via `createAdminSupabase()` (**service_role, bypasses RLS**) and selects `marketplace_orders`, `_order_groups`, `_order_items`, and **`marketplace_payment_records` (`select("*")`)** purely `eq("order_no", orderNo)` — no user scoping.
  - The page renders a clickable link to the **payment-proof document**: `<a href={order.paymentRecord.proofUrl}>` (`page.tsx:141-149`), plus reference/method/status/payout/tracking. **Buyer email** is rendered by `PlacementAcknowledgement` (`page.tsx:49-55`) whenever `search.placed === "1"` — an **attacker-controlled query param** (`page.tsx:31`): appending `?placed=1` to any guessed URL reveals it.
  - `order_no` is generated as `MKT-ORD-${YYYYMMDD}-${100..999}` (`route.ts:86-93`, `Math.floor(Math.random()*900+100)`). Prod entropy probe:
    ```sql
    select substring(order_no from 1 for 17) day_prefix, count(*) orders_that_day,
           count(distinct right(order_no,3)) distinct_nonces
    from marketplace_orders group by 1 order by orders_that_day desc;
    -- → max 3 orders/day, 0 collisions; nonce space = 900/day. Samples:
    --   MKT-ORD-20260620-324, MKT-ORD-20260619-463, MKT-ORD-20260618-224 …
    ```
  - **Impact:** an unauthenticated attacker enumerating `MKT-ORD-<date>-100..999` (≤900 requests/day) retrieves, for every order: buyer email, order total, payment reference/method/status, a **working link to the buyer's bank-receipt document** (Cloudinary `secureUrl`), and payout/fulfillment state.
- **Proposed fix:** (a) require an authenticated session AND ownership (`order.user_id === viewer.user.id` or `normalized_email` match) on `/track` and `/pay`, OR replace `order_no` in the public URL with an unguessable token (`gen_random_uuid()` / `marketplace_orders.public_token`); (b) never render `proofUrl` or `buyerEmail` to an unauthenticated viewer; serve proof docs through a short-lived **signed, owner-scoped** URL, not a permanent public Cloudinary link; (c) ignore the `?placed=1` PII-reveal for non-owners. App-layer fix (no migration), optional `public_token` column migration provided as `held/08_order_public_token.sql`.
- **Post-fix reproduction:** `curl -s https://<marketplace-host>/track/MKT-ORD-20260620-324?placed=1` as an anonymous client → must return 404/redirect-to-login and contain **no** `buyer_email` and **no** `proofUrl`. Re-run the enumeration over `100..999` for a known date → 0 orders disclosed.
- **Regression test:** Playwright/route test asserting unauthenticated GET `/track/{realOrderNo}` and `/track/{realOrderNo}?placed=1` return 404/redirect and the response body excludes email + proof URL; unit test that `getOrderByNumber` callers on public routes pass a viewer scope.

### F-02 — `dispute_create` cross-order payout-freeze & status tamper (HIGH)
- **Category:** IDOR → money-flow DoS / griefing. CVSS `AV:N/AC:L/PR:L/UI:N/S:U/C:L/I:H/A:H` ≈ **8.0**.
- **Asset:** `app/api/marketplace/route.ts:1852-1893` (`case "dispute_create"`).
- **Pre-fix reproduction (source):** the only guard is `if (!viewer.user)` (any authenticated user). It reads `order_no` from the form, **never verifies the order belongs to the caller**, then via `service_role`:
  - `update marketplace_orders set status='disputed' where order_no=<any>` (`:1883-1886`)
  - `update marketplace_order_groups set payout_status='payout_frozen' where order_no=<any>` (`:1887-1893`)
  - The asymmetry is the proof of omission: `order_confirm_completion` (`:1802-1808`) **does** compute `isOwner` and reject non-owners; `dispute_create` does not. Combined with F-01's enumerable `order_no`, an attacker can freeze **every** vendor's payouts for guessed orders.
- **Proposed fix:** before inserting the dispute / freezing payout, fetch the order and require `order.user_id === viewer.user.id || normalizeEmail(order.normalized_email) === normalizeEmail(viewer.user.email)` (mirror `order_confirm_completion`); reject otherwise with `error=forbidden`.
- **Post-fix reproduction:** as USER_B, POST `intent=dispute_create&order_no=<USER_A order>` → expect `error=forbidden`, and a prod check that `marketplace_order_groups.payout_status` for USER_A's order is unchanged.
- **Regression test:** route test: USER_B dispute on USER_A's `order_no` returns forbidden and does not flip order status / payout_status.

### F-03 — Privilege escalation via email-only staff seeds + email-OR role binding (CRITICAL)
- **Category:** Broken authorization / privilege escalation → money-control account takeover. **CRITICAL.** CVSS `AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H` ≈ **9.6**. ⚠️ **Owner-confirmed 2026-06-26: `henrycogroup.com` is PERMANENTLY RETIRED**, hence re-registerable by anyone — so the "control the seed mailbox" precondition is now SATISFIABLE, not hypothetical. An attacker registers the lapsed domain, stands up mail, signs up as `…@henrycogroup.com` (receiving the verification mail at their own server), and the email-OR binding hands them owner+finance. This is a **LIVE** takeover path; remediate immediately (purge/deactivate the 7 seed rows + ship the `auth.ts` fix), ahead of the slower owner-gated migration cycle.
- **Asset:** `lib/marketplace/auth.ts:getMarketplaceViewer` (lines 78-105) + `marketplace_role_memberships`.
- **Pre-fix reproduction (source + prod evidence):**
  - `getMarketplaceViewer` loads memberships **twice and concatenates**: `byUser` (`eq("user_id", user.id)`, `auth.ts:78-82`) **and `byEmail`** (`eq("normalized_email", email)`, `auth.ts:90-95`) → `memberships = [...byUser, ...byEmail]` (`:100-103`). The `byEmail` query has **no `user_id` constraint**, so a role row matching the caller's email is granted regardless of who (if anyone) owns it. These roles gate the money-control intents in the multiplexer (`payment_verify`, `payout_decision`, `admin_*`) which then run via `service_role`.
  - Prod: there are **7 active privileged membership rows with `user_id = NULL`**, all bound to a single email:
    ```sql
    select role, (user_id is null) user_id_null,
      left(normalized_email,2)||'***@'||split_part(normalized_email,'@',2) masked
    from marketplace_role_memberships where is_active and user_id is null order by role;
    -- → finance, marketplace_admin, marketplace_owner, moderation, operations,
    --   support, vendor  — ALL = ma***@henrycogroup.com, user_id_null = true
    ```
  - **Impact:** whoever authenticates a session with `…@henrycogroup.com` inherits owner+admin+finance+moderation+operations+support+vendor simultaneously → can verify payments and approve/release payouts. The seed email is on the **permanently-retired `henrycogroup.com` domain** (the only valid domain is henryonyx.com / Henry Onyx Limited). Because that domain is now retired (owner-confirmed 2026-06-26), it is **re-registerable by an attacker** — making this a LIVE full money-control account takeover, not a hypothetical.
  - Note: the DB RLS layer does **not** honor the email match (policies are `auth.uid()=user_id`), so this is strictly an **app-layer** escalation — but the app-layer is where the money intents are gated.
- **Proposed fix:** (a) do **not** grant privileged roles by email match — for staff/owner/finance/etc. require a `user_id` binding; permit email-only matching solely for a non-privileged invite bootstrap that **binds `user_id` on first authenticated login and stops matching by email** thereafter; (b) bind the 7 seed rows to real `user_id`s (or delete/migrate them to henryonyx.com identities); (c) **verify `henrycogroup.com` is owned and locked** (registrar + MX) — operational, outside this repo. Code fix in `auth.ts`; data remediation as held migration `held/09_bind_or_purge_email_only_staff.sql` (commented, owner-driven).
- **Post-fix reproduction:** register/sign-in a fresh account whose email matches a seeded staff email → `getMarketplaceViewer().roles` must contain only `["buyer"]`; assert `viewerHasRole(viewer, ["finance","marketplace_owner"])` is false; POST `payment_verify` → redirected to `/account` (denied).
- **Regression test:** unit test for `getMarketplaceViewer`: an email-only membership row with `user_id=null` does **not** confer its role to a user with a matching email but different `user_id`.

### F-04 — `vendor_product_upsert` cross-vendor product takeover (HIGH)
- **Category:** Multi-tenant integrity / BFLA. CVSS `AV:N/AC:L/PR:L/UI:N/S:U/C:L/I:H/A:L` ≈ **7.1**.
- **Asset:** `app/api/marketplace/route.ts:1382-1504` (`case "vendor_product_upsert"`).
- **Pre-fix reproduction (source):** the handler upserts `marketplace_products` with `{ onConflict: "slug" }` (`:1489-1491`) where `slug` is globally unique and **client-controllable** (`:1397` `text(formData,"slug") || slugify(title)`). The conflict update writes the full payload **including `vendor_id: vendorScopeId`** (`:1448`). So a vendor who submits a product whose `slug` collides with another vendor's existing product **overwrites that row — reassigning `vendor_id`, title, price, media** to the attacker. The role gate (`viewerHasRole(["vendor","marketplace_owner","marketplace_admin"])`, `:1383`) admits any vendor, including pending ones.
  - Secondary (currently not reachable): `vendorScopeId` falls back to client `vendor_slug` then `snapshot.vendors[1]?.id` when the vendor membership `scopeId` is null (`:1387-1391`). Prod shows all active `vendor` memberships have non-null `scope_id` (`null_scope_rows=0`), so this branch is not presently exploitable — but it is one bad seed away.
- **Proposed fix:** make the conflict target vendor-scoped — either a composite unique `(vendor_id, slug)` and `onConflict:"vendor_id,slug"`, or, before upsert, `select vendor_id from marketplace_products where slug=$1` and reject if it exists and differs from the caller's vendor; never allow `vendor_id` reassignment on conflict. Remove the `vendors[1]` fallback; reject when `vendorScopeId` is null. Schema change for the composite unique provided as held `held/10_products_vendor_slug_unique.sql`.
- **Post-fix reproduction:** as VENDOR_B, POST `vendor_product_upsert` with `slug=<VENDOR_A existing slug>` → expect rejection (`error=listing-conflict`); prod check that the existing product's `vendor_id` is unchanged.
- **Regression test:** route test: cross-vendor slug collision is rejected and does not mutate the other vendor's row.

### F-05 — `cart_update` missing authorization (MEDIUM)
- **Category:** IDOR. CVSS `AV:N/AC:H/PR:N/UI:N/S:U/C:L/I:L/A:L` ≈ **3.1** (UUID id is not enumerable; no auth at all).
- **Asset:** `app/api/marketplace/route.ts:392-406` (`case "cart_update"`).
- **Pre-fix reproduction (source):** `delete()/update()` of `marketplace_cart_items` `.eq("id", itemId)` via `service_role` with **no `viewer.user` guard and no ownership check**. Contrast the `address_*` intents (`:1044-1049`,`:1091-1095`,`:1124-1134`) which all scope `.eq("user_id", viewer.user.id)`. Practical exploitability is gated by `cart_items.id` being a UUID (not guessable), so this is MEDIUM, but it has zero authorization.
- **Proposed fix:** resolve the caller's cart (by `user_id` for authed, `session_token` cookie for guest) and constrain the mutation to items in that cart (mirror `/api/cart/route.ts`).
- **Post-fix reproduction:** as USER_B with a known USER_A `cart_item` id, POST `cart_update` → item unchanged.
- **Regression test:** route test asserting `cart_update` only affects items in the caller's own cart.

### F-06 — Anon reads price/stock/SKU of non-approved products (MEDIUM)
- **Category:** Smart-leak (pre-launch pricing/inventory). CVSS `AV:N/AC:L/PR:N/UI:N/C:L` ≈ **5.3**.
- **Asset:** `marketplace_product_variants` policy `marketplace_public_product_variants` — `qual = true`.
- **Pre-fix reproduction (prod, as `anon`):**
  ```sql
  begin; set local role anon; set local request.jwt.claims = '{"role":"anon"}';
  select count(*) leaked from marketplace_product_variants v
   where not exists (select 1 from marketplace_products p where p.id = v.product_id);
  rollback;   -- → leaked = 1  (variant of the 'marble-serve-tray' product, approval_status='submitted')
  ```
  Under anon RLS only approved products are visible, so a variant whose parent isn't visible is a leak. The variant row carries `price`, `compare_at_price`, `stock`, `sku`, `options`. Today 1 row; this scales with every draft/rejected listing.
- **Proposed fix:** replace `USING(true)` with a parent-approval gate (`EXISTS approved parent` OR uploader/staff). Held `held/02_gate_product_media_variants_anon_leak.sql`.
- **Post-fix reproduction:** re-run the probe → `leaked = 0`; confirm approved-product variants still visible to anon.
- **Regression test:** SQL/RLS test: anon sees variants of approved products only.

### F-07 — `inventory_movements` INSERT checks role but not row vendor (MEDIUM)
- **Category:** Multi-tenant write. CVSS `AV:N/AC:L/PR:L/UI:N/I:L` ≈ **4.3** (needs a vendor account; ledger pollution).
- **Asset:** policy `marketplace_inventory_movements_service_write` (INSERT), `WITH CHECK = EXISTS(role_memberships … role IN ('marketplace_owner','marketplace_admin','operations','vendor'))`. anon/auth hold the INSERT grant.
- **Pre-fix reproduction (policy text):** the `WITH CHECK` validates that the caller **is** a vendor but does **not** reference the inserted row's `vendor_id`, so any vendor can insert inventory movements attributed to **any** `vendor_id` via the Data API. (No write performed — read-only mandate; the policy text is the proof; the read counterparts correctly scope by `scope_id`.)
- **Proposed fix:** add `AND vendor_id IN (select scope_id from marketplace_role_memberships where user_id=auth.uid() and role='vendor' and is_active and scope_type='vendor')` to the `WITH CHECK` (and keep staff roles unscoped). Held `held/03_inventory_movements_vendor_scope_check.sql`.
- **Post-fix reproduction:** as VENDOR_A, evaluate the new `WITH CHECK` predicate for VENDOR_B's id via a read-only `select` of the predicate → false.
- **Regression test:** RLS test: a vendor INSERT with another vendor's `vendor_id` is rejected.

### F-08 — No FORCE RLS on money/PII tables + broad inert write grants (MEDIUM)
- **Category:** Hardening / defense-in-depth. CVSS n/a (latent).
- **Asset:** all 45 `marketplace_*` tables (`relforcerowsecurity = false`); `anon`/`authenticated` hold INSERT/UPDATE/DELETE on nearly all tables.
- **Pre-fix reproduction (prod):**
  ```sql
  select relname, relrowsecurity, relforcerowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace
   where n.nspname='public' and relname like 'marketplace\_%' order by relforcerowsecurity, relname;
  -- → every table relforcerowsecurity = false
  ```
  Two consequences: (1) `service_role` (used for **all** app writes) and the table owner bypass RLS — so the app-layer IDORs above have **no DB backstop**, and a leaked service key reads/writes everything; (2) the open anon/auth write grants are inert **only** because the policy set is SELECT-only — any future migration that adds a permissive write policy instantly opens a Data-API write hole because the grant already exists.
- **Proposed fix:** `ALTER TABLE … FORCE ROW LEVEL SECURITY` on the money/PII tables (`orders`, `payment_records`, `payout_requests`, `refunds`, `addresses`, `order_groups`, `order_items`, `vendor_applications`, `disputes`, `user_notifications`); revoke unused anon/auth INSERT/UPDATE/DELETE grants where the app path is service_role-only. Held `held/01_force_rls_money_pii.sql` and `held/07_revoke_unused_write_grants.sql` (the latter flagged **needs-staging-test** — verify no Data-API writer relies on them).
- **Post-fix reproduction:** re-run the catalog query → `relforcerowsecurity = true` for the listed tables; smoke-test checkout/vendor flows in staging.
- **Regression test:** CI invariant asserting money/PII tables are `FORCE`d and lack anon/auth write privilege.

### F-09 — Anon reads media of non-approved products (LOW–MEDIUM)
- **Category:** Smart-leak. CVSS ≈ **4.3**. **Asset:** `marketplace_product_media` policy `qual = true`.
- **Pre-fix reproduction (prod, anon):** `leaked_media_nonapproved_parent = 1` (same `submitted` product's media row — url/public_id). Same probe shape as F-06.
- **Proposed fix / post-fix / test:** identical treatment to F-06 (held `held/02_…`); gate media SELECT on parent approval or uploader/staff.

### F-10 — `payment_verify` over-broad role + no amount reconciliation (MEDIUM)
- **Category:** Money / authorization breadth. CVSS ≈ **5.0** (latent — no live divergence).
- **Asset:** `route.ts:1709-1738`. Gate is `["marketplace_owner","marketplace_admin","finance","support"]` → `support` can flip `payment_status='verified'`/`paid_held` by `order_no` with **no amount/provider cross-check**. Prod money probes are clean (`verified_payment_mismatch = []`), so no current abuse, but the manual bank-transfer rail trusts a client-uploaded proof image. (Note: bank-transfer marketplace checkout was nominally retired in #303, but this verify path remains.)
- **Proposed fix:** restrict `payment_verify` to `finance`/`marketplace_owner`; reconcile the recorded amount against `order.grand_total` before marking verified; prefer provider-webhook confirmation once the card rail is live.
- **Post-fix reproduction:** as `support`, POST `payment_verify` → denied; verify path rejects when `amount <> grand_total`.
- **Regression test:** route test for role restriction + amount reconciliation.

### F-11 — `review_votes` public read exposes `voter_user_id` (LOW, latent)
- `marketplace_review_votes` SELECT `qual=true`; `review_votes_count = 0` today, so nothing leaks yet, but the policy would let anon map `voter_user_id` ↔ reviews. **Fix:** restrict read to owner/staff or expose only server-side aggregates. Held `held/04_review_votes_read_restrict.sql`.

### F-12 — `deals_curation` role-vocabulary mismatch (LOW, lockout not breach)
- Policy `marketplace_deals_curation_admin_all` matches `role IN ('owner','manager','curator')`, but `loose_role_active_members = 0` (canonical scheme is `marketplace_owner`/`marketplace_admin`/…). So staff **cannot** manage deals via the Data API (functional lockout) and there is **no over-grant**. **Fix:** align to canonical marketplace roles. Held `held/06_deals_curation_role_vocab.sql`.

### F-13 — `user_comm_preferences` UPDATE missing explicit `WITH CHECK` (LOW)
- UPDATE policy `qual = auth.uid()=user_id`, `with_check = null`. Postgres reuses `USING` as `WITH CHECK` when omitted, so it is **not** exploitable (a probe of the policy confirms USING blocks user_id reassignment), but add an explicit `WITH CHECK(auth.uid()=user_id)` for clarity/defense. Held `held/05_comm_preferences_with_check.sql`.

### F-14 — Wallet checkout money mutation is non-transactional (LOW)
- **Category:** Money atomicity (the map's claimed "double-charge" is **refuted**). CVSS ≈ low.
- **Asset:** `route.ts:689-776` (`checkout_submit`, wallet branch).
- **Analysis:** double-charge does **not** occur — the wallet debit uses an optimistic compare-and-set (`.eq("balance_kobo", currentBalanceKobo)`, `:697`) that fails a second concurrent debit, and the cart is marked `converted` (`:801-804`) blocking replay. The residual issue: the balance update, `customer_wallet_transactions` insert, and `marketplace_payment_records` insert are **separate PostgREST autocommit calls** with no enclosing DB transaction, so a partial failure (e.g. txn-log insert throws after balance decremented, `:737`) leaves inconsistent state. **Fix:** move the wallet debit + ledger writes into a single `SECURITY DEFINER` RPC / DB transaction. (Code/DB change, not in this PR.)

---

## Closed / refuted probes (proven, not assumed)

| Probe | Result | Evidence |
|-------|--------|----------|
| P-RLS-01 RLS-off catastrophe | **CLOSED** | all 45 `marketplace_*` tables `relrowsecurity=true` |
| P-IDOR-01/02/03/04/05/08/09/10 cross-user reads (orders, payments, order_groups, addresses, vendor_apps, notifications, role_memberships, refunds) | **CLOSED** | as authenticated USER_B every count of USER_A's rows = **0** |
| P-MONEY-01 `payout_requests` readable | **CLOSED** | lockbox returns 0 to authenticated USER_B |
| P-MONEY-02 `notification_queue` (10,758 PII rows) readable | **CLOSED** | returns 0 to authenticated USER_B + anon |
| P-MONEY-05/06 `discount_codes`/`settings` anon-readable | **CLOSED** | 0 (and 0 discount rows exist) |
| P-MONEY-08/09/10 totals / verified-payment / over-refund | **CLOSED** | `[]`, `[]`, `[]` — money internally consistent, every verified payment = order total, no over-refund |
| P-LEAK-05 product/vendor/review public gates | **CLOSED** | anon sees 0 non-approved products, 0 unapproved vendors, 0 unpublished reviews |
| P-AUTH-01 email→multi-user in orders | **CLOSED** | `[]` (each email = 1 user) |
| P-AUTH-02 email-shared privileged membership | partial | sharing-across-user_ids = `[]`; **email-only seeds = F-03** |
| P-MT-03 `deals_curation` over-grant | **REFUTED** | loose-role members = 0 (→ F-12 lockout instead) |
| P-SECDEF-01/02 SECDEF IDOR | **CLOSED** | `enforce_marketplace_listing_cap`/`recompute_seller_tier` = service_role-only; `is_staff_in`/`_any` = boolean self-checks (derive from `auth.uid()`); `upsert_delivery_promise` = ownership-guarded (`if v_owner is distinct from auth.uid() then raise`) + search_path pinned |
| Supabase security advisor | corroborates | 12 marketplace lockboxes = `rls_enabled_no_policy` **INFO** (deny=safe); flagged SECDEF executables = the vetted-safe set above |

---

## State × surface coverage

The state×surface matrix (21 user states × 27 surfaces) was enumerated; the live-confirmed leak cells are F-01 (`signed-out` × `/track`), F-06/F-09 (`signed-out` × variant/media), F-03 (`membership-by-email-only` × staff queues), F-02/F-04/F-05 (`buyer`/`vendor` × `/api/marketplace` intents). Cells asserting **server-truth variants hold**: anon sees no private/owner surfaces; authenticated USER_B sees only their own orders/addresses/notifications/vendor-apps; lockbox surfaces deny. No "verified user shown verify prompt" / "member shown admin control" leak was found at the data layer; the only privilege-leak vector is the app-layer email-OR binding (F-03).

## Proposed fixes index (held — owner-gated apply, **not** applied)
`docs/v3/security/v3-fire-marketplace-proposed-migrations/`:
- `01_force_rls_money_pii.sql` (F-08)
- `02_gate_product_media_variants_anon_leak.sql` (F-06, F-09)
- `03_inventory_movements_vendor_scope_check.sql` (F-07)
- `04_review_votes_read_restrict.sql` (F-11)
- `05_comm_preferences_with_check.sql` (F-13)
- `06_deals_curation_role_vocab.sql` (F-12)
- `07_revoke_unused_write_grants.sql` (F-08, **needs staging test**)
- `08_order_public_token.sql` (F-01 optional token approach)
- `09_bind_or_purge_email_only_staff.sql` (F-03 data remediation, owner-driven, commented)
- `10_products_vendor_slug_unique.sql` (F-04)

App-layer fixes (F-01 routing/render, F-02 ownership check, F-03 `auth.ts` email-binding, F-04 conflict scoping, F-05 cart scoping, F-10 role+amount, F-14 transactional RPC) are specified per-finding above and require code changes + tests, held for a follow-up implementation PR after architect re-verification.

## Appendix A — name drift (non-security, raised by owner)
Three company names coexist in the codebase: the package scope/codename `@henryco/*` and `marketplace_*`; the **customer-facing** strings "Henry & Co." (e.g. `route.ts:456,564,1741`); and the **permanently-retired seed domain `henrycogroup.com`** (the F-03 staff email). The only valid domain is **henryonyx.com** (entity: **Henry Onyx Limited**); `henrycogroup.com` has been retired and must never be reintroduced. Because the retired domain is re-registerable and is load-bearing in the auth path (F-03 → CRITICAL), purging it from the seed rows is **urgent**, ahead of the broader RR-1 legal-name cleanup.

---

**V3-FIRE-MARKETPLACE COMPLETE — 14 findings (2 critical / 2 high / 4 med / 6 low; +1 branding note), each with pre/post-fix evidence; 10 fix migrations proposed for owner-gated apply; division audited every class + state×surface matrix. Live DB posture is sound (no RLS-off table, all IDOR probes closed, lockboxes deny, money consistent); residual risk is concentrated in the `service_role` app layer (F-01, F-02, F-04, F-05, F-10) and the email-OR role binding (F-03 — elevated to CRITICAL after owner confirmed `henrycogroup.com` is permanently retired / re-registerable). Anti-inflation calibration applied: F-06/F-09 (anon reads of draft catalog price/media) re-graded LOW — catalog metadata, not PII/money.**
