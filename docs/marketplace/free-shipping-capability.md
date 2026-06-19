# Marketplace free shipping — capability contract

**Status:** foundation shipped (V3-FREESHIP-CLOSE-01), **dormant**. Seller-controlled, location-aware product layer is the owner-directed next pass (**V3-FREESHIP-02**, below).
**Risk:** money-adjacent (delivery is part of the order total and the VAT composite base).
**Source of truth:** `apps/marketplace/lib/checkout/free-delivery.ts`.

---

## What ships today (the foundation)

A product whose `marketplace_products.filter_data` carries `free_delivery === true` ships with **delivery waived** — but only when **every** line in the cart is so flagged. One unflagged item → the whole cart pays normal delivery.

Contract + guards (one definition, used by both the producer and the checkout):

| Symbol | Meaning |
|---|---|
| `MARKETPLACE_FREE_DELIVERY_FLAG` (`"free_delivery"`) | the `filter_data` key |
| `isFreeDeliveryProduct(filterData)` | true **only** on strict boolean `true` (a string `"true"`, `1`, `"on"` do NOT qualify) |
| `cartQualifiesForFreeDelivery(ids, flaggedSet)` | true only when the cart is non-empty **and every** id is flagged |

### Why it is money-safe

- **The waiver lowers `grand_total`**, which is the exact amount the card rail charges (`/pay/[orderNo]/card` → `order.grandTotal`). The buyer cannot set or forge it — it is server-computed and persisted.
- **VAT stays correct.** The output-VAT carve is inclusive; waiving delivery simply removes the (now-zero) delivery line from the composite base, so VAT falls on the goods alone. The goods' VAT treatment is never changed. Proven for standard (₦1,075 → ₦75.00), exempt (→0), and mixed carts in `lib/checkout/__tests__/order-vat.test.ts`; the flag contract is proven in `__tests__/free-delivery.test.ts`.
- **Fail-closed.** A failed product read rejects the checkout (no unclassified settlement, no silent waiver). A missing/unreadable product row leaves its id unflagged → normal delivery. The flag is read with a strict `=== true` check.
- **Single read.** The free-ship decision reuses the existing VAT-classification product read — no extra DB round-trip on the checkout path.

### Why it is dormant

There is intentionally **no live caller that SETS the flag** — no default, no seed, no admin/seller UI, no env var, no migration. Repo-wide, `free_delivery` appears only on the read side. No production product is flagged.

> **⚠️ Lane-1 gate.** This capability entered the codebase via a one-off VAT live-test, not a planned pricing pass. **Activating it for any real free-shipping offer is an owner / Lane-1 (money + pricing) reviewed action.** The seller+location pass below IS that review.

---

## What comes next — V3-FREESHIP-02 (seller-controlled, location-aware)

Owner-directed evolution: sellers configure their own free-shipping offers, scoped by buyer **location**. Design lives in `docs/marketplace/free-shipping-seller-zones-design.md` (forthcoming). The foundation above is the spine it builds on: the same money-safe checkout waiver and VAT composition, now driven by a richer, seller-owned, zone-aware rule instead of a single boolean.
