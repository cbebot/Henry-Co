# Marketplace delivery waivers — unified capability contract

**Status:** seller + buyer surfaces shipped (**V3-DELIVERY-COMPLETE-01**), **dormant** (migration committed-NOT-applied; feature flag off).
**Risk:** money-adjacent — delivery is part of the order total **and** the VAT composite base.
**Source of truth (decision):** `apps/marketplace/lib/checkout/free-delivery.ts`.
**Source of truth (VAT):** `apps/marketplace/lib/checkout/order-vat.ts`.
**Reach/tier rule:** `apps/marketplace/lib/checkout/delivery-reach.ts` + `packages/config/geography-ng.ts`.

---

## One delivery line, two ways to zero it

A cart has exactly **one** delivery line (`deliveryAmount`). Whether it is waived is a **single boolean** — `cartQualifiesForFreeDelivery(...)` — that the route hands to `computeMarketplaceCheckoutBreakdown({ deliveryAmount })`. There are two independent ways a line can qualify; they are **OR-combined per line** and **AND-combined across the cart** (every line must qualify or the whole cart pays normal delivery):

| # | Mechanism | How a line qualifies | How it is set |
|---|---|---|---|
| **A** | Manual owner override (#309 / V3-FREESHIP-CLOSE-01) | the product's `filter_data.free_delivery === true` (strict boolean) | owner-manual only (no UI/seed writes it) — dormant by data-absence |
| **B** | Seller Delivery Promise (V3-FREESHIP-02 / #314) | the line's vendor has an **active** promise whose **tier-clamped** `covered_states` includes the buyer's delivery state, with any `min_order` met | `marketplace_delivery_promises` row via the ownership-checked `upsert_delivery_promise` RPC — dormant until the migration is applied + the flag is on |

### Precedence (no conflict, no double-zero)

`lineQualifiesForFreeDelivery` checks **A first** as a hard override (`manualFreeProductIds.has(productId) → true`); only if A does not apply does it evaluate **B** (buyer state known → vendor has an active promise → promise covers the state → min-order met). Because the result is a single boolean feeding a single delivery line, **the two mechanisms can never each subtract** — they jointly decide whether the one line is `0` or normal. There is structurally no double-zeroing and no precedence conflict.

---

## VAT is correct in every combination

The output-VAT carve (`order-vat.ts`) is **inclusive** and treats delivery + platform fee as a **composite supply** that rides the standard-rated goods. The route builds **one** breakdown and feeds *its* numbers to **both** the stored order and the VAT carve (`route.ts` 618-644):

- `shippingTotal` (0 when waived) → `resolveOrderOutputVat({ shippingNaira })`
- `grandTotal` (excludes the waived delivery) → `amountKobo` → `resolveOrderOutputVat({ grossMinor })`

So a waiver moves the gross **and** the composite base together; `outputVatMinor + revenue === grossMinor` holds with delivery simply absent. The four combinations:

| Combination | Delivery line | VAT base | Output VAT (₦1,500 standard good) |
|---|---|---|---|
| Free via **A** only | ₦0 | goods only | ₦104.65 (10,465 kobo) |
| Free via **B** only | ₦0 | goods only | ₦104.65 (10,465 kobo) |
| Free via **both** | ₦0 (one waiver) | goods only | ₦104.65 (10,465 kobo) |
| **Neither** | ₦180 | goods + delivery | ₦1,360.47 (136,047 kobo) |

Exempt/zero-rated goods post **0 VAT** in every delivery combo (the composite rides the exempt supply). Proven end-to-end — predicate decision → delivery line → kobo-exact carve — in `lib/checkout/__tests__/delivery-vat-combination.test.ts`, on top of the isolated proofs in `order-vat.test.ts`, `free-delivery.test.ts`, and `delivery-reach.test.ts`.

---

## Why it is forgery-proof

- **Buyer cannot forge the waiver.** The covered set is the *seller's* (not buyer input); the buyer's state is `normalizeStateInput(shipping_region)` from their real delivery address; the amount is server-computed and persisted as `grand_total`.
- **A downgraded/over-reaching seller cannot over-reach.** `covered_states` are **re-clamped at checkout** (`clampCoveredStatesToTier`) to the vendor's **CURRENT** `verification_level`, so a promise written while Gold is honored only to the seller's own state once they are Bronze. This checkout re-clamp is the money-safety guarantee; the write-time clamp in the route is defence-in-depth.
- **Tier = KYC `verification_level`** (`bronze` → own state, `silver` → geopolitical zone, `gold` → nationwide), **not** `seller_tier` (listing caps/commission). Default `'bronze'` → own state only, the honest KYC-pending default (V3-24 KYC is pending; reach earns up as verification lands).

---

## Documented limitation (seller-intent, not a money bug)

`min_order` is checked against the **whole cart's** goods subtotal, not the per-vendor portion (`free-delivery.ts` — the model has one cart-level delivery line, not per-vendor lines). In a multi-vendor cart a seller's per-vendor floor can be met by the cart total while that seller's own goods are below it. This is **seller-absorbed off-platform** (no platform money/VAT leak — the buyer is charged ₦0 delivery and the seller eats it) and is auditable (the seller configured the promise). Per-vendor min-order would require per-vendor delivery lines — a future model change, out of scope here.

---

## Why it stays dormant

- **Mechanism A**: no code/seed/UI sets `filter_data.free_delivery`; it is read-only across the repo → no product is flagged → no waiver. Owner escape hatch only.
- **Mechanism B**: the `marketplace_delivery_promises` migration is **committed-NOT-applied**; with no table the checkout promise read errors → fail-closed to no promises → normal delivery. The seller card + checkout honoring are additionally gated by `MARKETPLACE_DELIVERY_PROMISES` (mirrors the `MARKETPLACE_CARD_CHECKOUT` pattern). The buyer **state picker** ships un-gated as a pure UX upgrade (it only writes a canonical `shipping_region` code the server already normalizes); the **badge** appears only when a public promise row exists (none until applied).

> **⚠️ Lane-1 gate.** Activating either mechanism for a real free-shipping offer is an owner / Lane-1 (money + pricing) action: apply the migration (dormant data), then flip `MARKETPLACE_DELIVERY_PROMISES=1`.
