/**
 * Per-product free-shipping capability — V3-FREESHIP-CLOSE-01.
 *
 * A product flagged `filter_data.free_delivery === true` ships with delivery
 * WAIVED, but only when EVERY line in the cart is so flagged. This is the single
 * source of truth for that contract: the producer side (a future admin/seed that
 * marks a product free-ship) and the consumer side (the checkout) both reference
 * the constant + guards here, so a typo can never silently change behaviour.
 *
 * MONEY-ADJACENT: waiving delivery lowers the order's `grand_total`, which is the
 * exact amount the card rail charges (`order.grandTotal`). The output-VAT carve is
 * inclusive, so a waiver simply removes the (now-zero) delivery from the composite
 * base — the goods' VAT treatment is unchanged (proven in order-vat.test.ts).
 *
 * ⚠️ DORMANT — there is intentionally NO live caller that SETS this flag. No prod
 * product is flagged. Activating it for a real free-shipping promo is an
 * owner/Lane-1 (money/pricing) reviewed action — it entered the codebase via a
 * one-off VAT live-test, not a planned pricing pass. See
 * `docs/marketplace/free-shipping-capability.md`.
 */

/** The `filter_data` key that marks a product as free-shipping. Must be boolean `true`. */
export const MARKETPLACE_FREE_DELIVERY_FLAG = "free_delivery" as const;

/**
 * True only when a product's `filter_data` carries `free_delivery === true` (strict
 * boolean). A string `"true"`, `1`, or any other truthy-but-not-boolean value does
 * NOT qualify — this keeps loosely-typed jsonb/import data from accidentally
 * granting free shipping.
 */
export function isFreeDeliveryProduct(filterData: unknown): boolean {
  return (
    typeof filterData === "object" &&
    filterData !== null &&
    (filterData as Record<string, unknown>)[MARKETPLACE_FREE_DELIVERY_FLAG] === true
  );
}

/**
 * Decide whether a cart qualifies for waived delivery: ONLY when there is at least
 * one product AND every cart product id is in the flagged set. A missing/unreadable
 * or unflagged product id → normal delivery (never an accidental free ship).
 */
export function cartQualifiesForFreeDelivery(
  cartProductIds: readonly string[],
  freeDeliveryProductIds: ReadonlySet<string>,
): boolean {
  return cartProductIds.length > 0 && cartProductIds.every((id) => freeDeliveryProductIds.has(id));
}
