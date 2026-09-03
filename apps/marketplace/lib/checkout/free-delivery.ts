/**
 * Free-delivery checkout contract — V3-FREESHIP-02 (seller-controlled, location-aware),
 * built on the money-safe waiver from V3-FREESHIP-CLOSE-01.
 *
 * Delivery is waived for a cart ONLY when EVERY line qualifies, where a line
 * qualifies if either:
 *   (a) the seller has an active Delivery Promise covering the BUYER'S delivery
 *       state, with any minimum-order met, OR
 *   (b) the product carries the manual owner override `filter_data.free_delivery`
 *       (CLOSE-01 — subsumed here as a hard override).
 *
 * MONEY-ADJACENT: waiving delivery lowers `grand_total`, the exact amount the card
 * rail charges (`order.grandTotal`). The output-VAT carve is inclusive, so a waiver
 * removes the (now-zero) delivery from the composite base; the goods' VAT treatment
 * is unchanged (proven in order-vat.test.ts). The buyer cannot forge it: the covered
 * set is the seller's, the buyer's state is their real delivery address, and the
 * amount is server-computed.
 *
 * This module is PURE. The route resolves the inputs (the buyer's normalized state,
 * the cart's vendor map, and each vendor's active promise RE-CLAMPED to the vendor's
 * CURRENT tier) and hands them in; this function only decides.
 */

/** The `filter_data` key that marks a product as a manual owner free-ship override. */
export const MARKETPLACE_FREE_DELIVERY_FLAG = "free_delivery" as const;

/**
 * True only when a product's `filter_data` carries `free_delivery === true` (strict
 * boolean). A string `"true"`, `1`, or any truthy-but-not-boolean value does NOT
 * qualify — keeps loosely-typed jsonb from accidentally granting free shipping.
 */
export function isFreeDeliveryProduct(filterData: unknown): boolean {
  return (
    typeof filterData === "object" &&
    filterData !== null &&
    (filterData as Record<string, unknown>)[MARKETPLACE_FREE_DELIVERY_FLAG] === true
  );
}

/** A vendor's single active Delivery Promise, as the checkout sees it. */
export type ActiveDeliveryPromise = {
  /** Canonical NG state codes covered — already RE-CLAMPED to the vendor's current tier. */
  coveredStates: readonly string[];
  /** Optional goods-subtotal floor (kobo); null = no minimum. */
  minOrderMinor: number | null;
};

export type FreeDeliveryCartInput = {
  cartProductIds: readonly string[];
  /** The buyer's delivery state (canonical NG code) or null when unknown/unrecognized. */
  buyerState: string | null;
  /** productId → vendorId (null when unknown). */
  vendorByProduct: ReadonlyMap<string, string | null>;
  /** vendorId → its single ACTIVE, tier-clamped promise (absent ⇒ vendor has none). */
  activePromiseByVendor: ReadonlyMap<string, ActiveDeliveryPromise>;
  /** Products carrying the manual owner override (CLOSE-01). */
  manualFreeProductIds: ReadonlySet<string>;
  /** The cart's goods subtotal in kobo (for minimum-order checks). */
  goodsSubtotalMinor: number;
};

/**
 * Decide whether the whole cart's delivery is waived. Non-empty cart AND every line
 * qualifies. Fail-closed: an unknown buyer state, a line with no vendor/promise, or
 * an unmet minimum → the line does not qualify → the cart pays normal delivery.
 */
export function cartQualifiesForFreeDelivery(input: FreeDeliveryCartInput): boolean {
  if (input.cartProductIds.length === 0) return false;
  return input.cartProductIds.every((productId) => lineQualifiesForFreeDelivery(productId, input));
}

function lineQualifiesForFreeDelivery(productId: string, input: FreeDeliveryCartInput): boolean {
  // (b) Manual owner override — a hard-flagged product always ships free.
  if (input.manualFreeProductIds.has(productId)) return true;
  // (a) Seller Delivery Promise covering the buyer's state, with any minimum met.
  if (!input.buyerState) return false; // unknown delivery location → no promise waiver
  const vendorId = input.vendorByProduct.get(productId);
  if (!vendorId) return false;
  const promise = input.activePromiseByVendor.get(vendorId);
  if (!promise) return false;
  if (!promise.coveredStates.includes(input.buyerState)) return false;
  if (promise.minOrderMinor != null && input.goodsSubtotalMinor < promise.minOrderMinor) return false;
  return true;
}
